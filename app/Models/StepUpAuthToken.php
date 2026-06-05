<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class StepUpAuthToken extends Model
{
    protected $fillable = [
        'user_id',
        'token',
        'purpose',
        'password_verified',
        'otp_verified',
        'otp_code',
        'otp_sent_at',
        'otp_expires_at',
        'otp_attempts',
        'is_valid',
        'expires_at',
        'completed_at',
        'ip_address',
    ];

    protected $casts = [
        'password_verified' => 'boolean',
        'otp_verified' => 'boolean',
        'is_valid' => 'boolean',
        'otp_sent_at' => 'datetime',
        'otp_expires_at' => 'datetime',
        'expires_at' => 'datetime',
        'completed_at' => 'datetime',
        'otp_attempts' => 'integer',
    ];

    protected $hidden = [
        'otp_code',
    ];

    const PURPOSES = ['ownership_transfer', '2fa_disable', 'account_delete', 'password_change'];

    const TOKEN_VALIDITY_MINUTES = 15;

    const OTP_VALIDITY_MINUTES = 5;

    const MAX_OTP_ATTEMPTS = 3;

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Create step-up auth session
     */
    public static function createSession(int $userId, string $purpose, ?string $ipAddress = null): self
    {
        // Invalidate existing sessions for this purpose
        self::where('user_id', $userId)
            ->where('purpose', $purpose)
            ->where('is_valid', true)
            ->update(['is_valid' => false]);

        return self::create([
            'user_id' => $userId,
            'token' => Str::random(64),
            'purpose' => $purpose,
            'expires_at' => now()->addMinutes(self::TOKEN_VALIDITY_MINUTES),
            'ip_address' => $ipAddress,
        ]);
    }

    /**
     * Verify password step
     */
    public function verifyPassword(string $password): bool
    {
        if (! $this->isValid()) {
            return false;
        }

        $user = $this->user;
        if (! Hash::check($password, $user->password)) {
            return false;
        }

        $this->update(['password_verified' => true]);

        return true;
    }

    /**
     * Generate and send OTP
     */
    public function generateOtp(): string
    {
        $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        $this->update([
            'otp_code' => Hash::make($otp),
            'otp_sent_at' => now(),
            'otp_expires_at' => now()->addMinutes(self::OTP_VALIDITY_MINUTES),
            'otp_attempts' => 0,
        ]);

        return $otp;
    }

    /**
     * Verify OTP step
     */
    public function verifyOtp(string $otp): bool
    {
        if (! $this->isValid()) {
            return false;
        }

        if (! $this->password_verified) {
            return false;
        }

        if ($this->otp_expires_at && $this->otp_expires_at->isPast()) {
            return false;
        }

        if ($this->otp_attempts >= self::MAX_OTP_ATTEMPTS) {
            $this->update(['is_valid' => false]);

            return false;
        }

        $this->increment('otp_attempts');

        if (! Hash::check($otp, $this->otp_code)) {
            return false;
        }

        $this->update([
            'otp_verified' => true,
            'completed_at' => now(),
        ]);

        return true;
    }

    /**
     * Check if session is valid and complete
     */
    public function isComplete(): bool
    {
        return $this->is_valid &&
               $this->password_verified &&
               $this->otp_verified &&
               $this->expires_at->isFuture();
    }

    /**
     * Check if session is still valid
     */
    public function isValid(): bool
    {
        return $this->is_valid && $this->expires_at->isFuture();
    }

    /**
     * Get valid session by token
     */
    public static function getByToken(string $token): ?self
    {
        return self::where('token', $token)
            ->where('is_valid', true)
            ->where('expires_at', '>', now())
            ->first();
    }

    /**
     * Invalidate session
     */
    public function invalidate(): void
    {
        $this->update(['is_valid' => false]);
    }

    /**
     * Format for API response
     */
    public function toApiResponse(): array
    {
        return [
            'token' => $this->token,
            'purpose' => $this->purpose,
            'password_verified' => $this->password_verified,
            'otp_verified' => $this->otp_verified,
            'otp_sent' => (bool) $this->otp_sent_at,
            'is_complete' => $this->isComplete(),
            'expires_at' => $this->expires_at->toISOString(),
            'remaining_otp_attempts' => max(0, self::MAX_OTP_ATTEMPTS - $this->otp_attempts),
        ];
    }
}
