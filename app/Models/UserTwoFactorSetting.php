<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Str;

class UserTwoFactorSetting extends Model
{
    protected $fillable = [
        'user_id',
        'is_enabled',
        'method',
        'secret',
        'recovery_codes',
        'confirmed_at',
        'last_used_at',
        'backup_phone',
        'backup_email',
        'failed_attempts',
        'locked_until',
    ];

    protected $casts = [
        'is_enabled' => 'boolean',
        'confirmed_at' => 'datetime',
        'last_used_at' => 'datetime',
        'locked_until' => 'datetime',
        'failed_attempts' => 'integer',
    ];

    protected $hidden = [
        'secret',
        'recovery_codes',
    ];

    const METHODS = ['app', 'email'];

    const MAX_FAILED_ATTEMPTS = 5;

    const LOCKOUT_MINUTES = 30;

    const RECOVERY_CODE_COUNT = 8;

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get or create 2FA settings for a user
     */
    public static function getOrCreate(int $userId): self
    {
        return self::firstOrCreate(
            ['user_id' => $userId],
            ['is_enabled' => false, 'method' => 'app']
        );
    }

    /**
     * Generate a new TOTP secret
     */
    public function generateSecret(): string
    {
        $secret = '';
        $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; // Base32 alphabet
        for ($i = 0; $i < 32; $i++) {
            $secret .= $chars[random_int(0, 31)];
        }

        $this->secret = Crypt::encryptString($secret);
        $this->save();

        return $secret;
    }

    /**
     * Get decrypted secret
     */
    public function getDecryptedSecret(): ?string
    {
        if (! $this->secret) {
            return null;
        }

        try {
            return Crypt::decryptString($this->secret);
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Generate QR code provisioning URI
     */
    public function getQrCodeUri(string $appName = 'DMB'): ?string
    {
        $secret = $this->getDecryptedSecret();
        if (! $secret) {
            return null;
        }

        $user = $this->user;
        $email = $user->email ?? 'user@example.com';

        return sprintf(
            'otpauth://totp/%s:%s?secret=%s&issuer=%s&algorithm=SHA1&digits=6&period=30',
            urlencode($appName),
            urlencode($email),
            $secret,
            urlencode($appName)
        );
    }

    /**
     * Verify TOTP code
     */
    public function verifyCode(string $code): bool
    {
        if ($this->isLocked()) {
            return false;
        }

        $secret = $this->getDecryptedSecret();
        if (! $secret) {
            return false;
        }

        // Allow 1 time step variance (30 seconds before/after)
        $timeSteps = [
            floor(time() / 30),
            floor(time() / 30) - 1,
            floor(time() / 30) + 1,
        ];

        foreach ($timeSteps as $timeStep) {
            $expectedCode = $this->generateTOTP($secret, $timeStep);
            if (hash_equals($expectedCode, $code)) {
                $this->update([
                    'failed_attempts' => 0,
                    'last_used_at' => now(),
                ]);

                return true;
            }
        }

        $this->incrementFailedAttempts();

        return false;
    }

    /**
     * Generate TOTP code for a time step
     */
    protected function generateTOTP(string $secret, int $timeStep): string
    {
        // Decode base32 secret
        $base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $binarySecret = '';
        $buffer = 0;
        $bitsLeft = 0;

        foreach (str_split(strtoupper($secret)) as $char) {
            $val = strpos($base32Chars, $char);
            if ($val === false) {
                continue;
            }

            $buffer = ($buffer << 5) | $val;
            $bitsLeft += 5;

            if ($bitsLeft >= 8) {
                $bitsLeft -= 8;
                $binarySecret .= chr(($buffer >> $bitsLeft) & 0xFF);
            }
        }

        // Generate HMAC
        $timeBytes = pack('N*', 0).pack('N*', $timeStep);
        $hash = hash_hmac('sha1', $timeBytes, $binarySecret, true);

        // Dynamic truncation
        $offset = ord($hash[19]) & 0xF;
        $code = (
            ((ord($hash[$offset]) & 0x7F) << 24) |
            ((ord($hash[$offset + 1]) & 0xFF) << 16) |
            ((ord($hash[$offset + 2]) & 0xFF) << 8) |
            (ord($hash[$offset + 3]) & 0xFF)
        ) % 1000000;

        return str_pad((string) $code, 6, '0', STR_PAD_LEFT);
    }

    /**
     * Generate recovery codes
     */
    public function generateRecoveryCodes(): array
    {
        $codes = [];
        for ($i = 0; $i < self::RECOVERY_CODE_COUNT; $i++) {
            $codes[] = strtoupper(Str::random(4).'-'.Str::random(4));
        }

        $this->recovery_codes = Crypt::encryptString(json_encode($codes));
        $this->save();

        return $codes;
    }

    /**
     * Get remaining recovery codes
     */
    public function getRecoveryCodes(): array
    {
        if (! $this->recovery_codes) {
            return [];
        }

        try {
            return json_decode(Crypt::decryptString($this->recovery_codes), true) ?? [];
        } catch (\Exception $e) {
            return [];
        }
    }

    /**
     * Use a recovery code
     */
    public function useRecoveryCode(string $code): bool
    {
        $codes = $this->getRecoveryCodes();
        $code = strtoupper(trim($code));

        $index = array_search($code, $codes);
        if ($index === false) {
            return false;
        }

        unset($codes[$index]);
        $this->recovery_codes = Crypt::encryptString(json_encode(array_values($codes)));
        $this->last_used_at = now();
        $this->failed_attempts = 0;
        $this->save();

        return true;
    }

    /**
     * Enable 2FA
     */
    public function enable(): void
    {
        $this->update([
            'is_enabled' => true,
            'confirmed_at' => now(),
            'failed_attempts' => 0,
            'locked_until' => null,
        ]);
    }

    /**
     * Disable 2FA
     */
    public function disable(): void
    {
        $this->update([
            'is_enabled' => false,
            'secret' => null,
            'recovery_codes' => null,
            'confirmed_at' => null,
            'failed_attempts' => 0,
            'locked_until' => null,
        ]);
    }

    /**
     * Check if locked out
     */
    public function isLocked(): bool
    {
        return $this->locked_until && $this->locked_until->isFuture();
    }

    /**
     * Increment failed attempts
     */
    protected function incrementFailedAttempts(): void
    {
        $this->failed_attempts++;

        if ($this->failed_attempts >= self::MAX_FAILED_ATTEMPTS) {
            $this->locked_until = now()->addMinutes(self::LOCKOUT_MINUTES);
        }

        $this->save();
    }

    /**
     * Get masked backup phone
     */
    public function getMaskedBackupPhoneAttribute(): ?string
    {
        if (! $this->backup_phone) {
            return null;
        }

        $len = strlen($this->backup_phone);
        if ($len <= 4) {
            return str_repeat('*', $len);
        }

        return str_repeat('*', $len - 4).substr($this->backup_phone, -4);
    }
}
