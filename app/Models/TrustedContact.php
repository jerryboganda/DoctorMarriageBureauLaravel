<?php

namespace App\Models;

use App\Utility\EmailUtility;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class TrustedContact extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'relationship',
        'phone',
        'email',
        'is_verified',
        'verification_token',
        'verification_sent_at',
        'verified_at',
        'can_recover_account',
        'notify_on_login',
    ];

    protected $casts = [
        'is_verified' => 'boolean',
        'can_recover_account' => 'boolean',
        'notify_on_login' => 'boolean',
        'verification_sent_at' => 'datetime',
        'verified_at' => 'datetime',
    ];

    const RELATIONSHIPS = ['parent', 'sibling', 'spouse', 'friend', 'relative', 'other'];

    const MAX_TRUSTED_CONTACTS = 3;

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function recoveryRequests(): HasMany
    {
        return $this->hasMany(AccountRecoveryRequest::class);
    }

    /**
     * Get contacts for a user
     */
    public static function getForUser(int $userId): Collection
    {
        return self::where('user_id', $userId)
            ->orderBy('is_verified', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Add a trusted contact
     */
    public static function addContact(int $userId, array $data): self
    {
        // Check limit
        $count = self::where('user_id', $userId)->count();
        if ($count >= self::MAX_TRUSTED_CONTACTS) {
            throw new \Exception('Maximum trusted contacts limit reached');
        }

        return self::create([
            'user_id' => $userId,
            'name' => $data['name'],
            'relationship' => $data['relationship'] ?? 'other',
            'phone' => $data['phone'] ?? null,
            'email' => $data['email'] ?? null,
            'verification_token' => Str::random(64),
            'can_recover_account' => $data['can_recover_account'] ?? true,
            'notify_on_login' => $data['notify_on_login'] ?? false,
        ]);
    }

    /**
     * Send verification request
     */
    public function sendVerification(): bool
    {
        if (! $this->email) {
            Log::warning('Trusted contact verification requires email because SMS is disabled.', [
                'trusted_contact_id' => $this->id,
            ]);

            return false;
        }

        $this->verification_token = Str::random(64);
        $this->verification_sent_at = now();
        $this->save();

        $verifyUrl = url('/api/trusted-contact/verify/'.$this->verification_token);

        if ($this->email) {
            try {
                $subject = 'Trusted Contact Verification - '.env('APP_NAME', 'Matrimonial Site');
                $userName = $this->user ? ($this->user->first_name.' '.$this->user->last_name) : 'a member';

                Mail::send('emails.trusted_contact_verification', [
                    'contactName' => $this->name,
                    'userName' => $userName,
                    'verifyUrl' => $verifyUrl,
                ], function ($message) use ($subject) {
                    $message->from(EmailUtility::fromAddress(), EmailUtility::fromName())
                        ->to($this->email)
                        ->subject($subject);
                });

                return true;
            } catch (\Exception $e) {
                Log::error('Trusted contact email failed: '.$e->getMessage());

                return false;
            }
        }

        return false;
    }

    /**
     * Verify with token
     */
    public static function verifyWithToken(string $token): ?self
    {
        $contact = self::where('verification_token', $token)
            ->where('is_verified', false)
            ->first();

        if (! $contact) {
            return null;
        }

        $contact->update([
            'is_verified' => true,
            'verified_at' => now(),
            'verification_token' => null,
        ]);

        return $contact;
    }

    /**
     * Get masked contact info for display
     */
    public function getMaskedEmailAttribute(): ?string
    {
        if (! $this->email) {
            return null;
        }

        $parts = explode('@', $this->email);
        if (count($parts) !== 2) {
            return '***@***';
        }

        $local = $parts[0];
        $domain = $parts[1];

        $maskedLocal = substr($local, 0, 2).str_repeat('*', max(0, strlen($local) - 2));

        return $maskedLocal.'@'.$domain;
    }

    public function getMaskedPhoneAttribute(): ?string
    {
        if (! $this->phone) {
            return null;
        }

        $len = strlen($this->phone);
        if ($len <= 4) {
            return str_repeat('*', $len);
        }

        return str_repeat('*', $len - 4).substr($this->phone, -4);
    }

    /**
     * Format for API response
     */
    public function toApiResponse(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'relationship' => $this->relationship,
            'email' => $this->masked_email,
            'phone' => $this->masked_phone,
            'is_verified' => $this->is_verified,
            'verified_at' => $this->verified_at?->toISOString(),
            'can_recover_account' => $this->can_recover_account,
            'notify_on_login' => $this->notify_on_login,
            'created_at' => $this->created_at->toISOString(),
        ];
    }
}
