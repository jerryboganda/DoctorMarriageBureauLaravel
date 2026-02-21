<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class OwnershipTransfer extends Model
{
    protected $fillable = [
        'member_id',
        'from_user_id',
        'to_user_id',
        'to_email',
        'to_phone',
        'to_name',
        'status',
        'transfer_token',
        'step_up_token',
        'step_up_verified',
        'step_up_verified_at',
        'transfer_reason',
        'expires_at',
        'accepted_at',
        'rejected_at',
        'rejection_reason',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'step_up_verified' => 'boolean',
        'step_up_verified_at' => 'datetime',
        'expires_at' => 'datetime',
        'accepted_at' => 'datetime',
        'rejected_at' => 'datetime',
    ];

    const STATUSES = ['pending', 'accepted', 'rejected', 'expired', 'cancelled'];
    const TRANSFER_VALIDITY_DAYS = 7;

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }

    public function fromUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'from_user_id');
    }

    public function toUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'to_user_id');
    }

    /**
     * Initiate ownership transfer (requires step-up auth token)
     */
    public static function initiate(
        int $memberId,
        int $fromUserId,
        string $stepUpToken,
        array $data,
        ?string $ipAddress = null,
        ?string $userAgent = null
    ): self {
        // Verify step-up auth
        $stepUp = StepUpAuthToken::getByToken($stepUpToken);
        if (!$stepUp || !$stepUp->isComplete() || $stepUp->user_id !== $fromUserId) {
            throw new \Exception('Step-up authentication required');
        }

        // Cancel any pending transfers for this member
        self::where('member_id', $memberId)
            ->where('status', 'pending')
            ->update(['status' => 'cancelled']);

        return self::create([
            'member_id' => $memberId,
            'from_user_id' => $fromUserId,
            'to_user_id' => $data['to_user_id'] ?? null,
            'to_email' => $data['to_email'] ?? null,
            'to_phone' => $data['to_phone'] ?? null,
            'to_name' => $data['to_name'] ?? null,
            'transfer_token' => Str::random(64),
            'step_up_token' => $stepUpToken,
            'step_up_verified' => true,
            'step_up_verified_at' => now(),
            'transfer_reason' => $data['reason'] ?? null,
            'expires_at' => now()->addDays(self::TRANSFER_VALIDITY_DAYS),
            'ip_address' => $ipAddress,
            'user_agent' => $userAgent,
        ]);
    }

    /**
     * Get pending transfer by token
     */
    public static function getByToken(string $token): ?self
    {
        return self::where('transfer_token', $token)
            ->where('status', 'pending')
            ->where('expires_at', '>', now())
            ->first();
    }

    /**
     * Get pending transfers for a member
     */
    public static function getPendingForMember(int $memberId): ?self
    {
        return self::where('member_id', $memberId)
            ->where('status', 'pending')
            ->where('expires_at', '>', now())
            ->first();
    }

    /**
     * Accept the transfer
     */
    public function accept(int $userId): bool
    {
        if ($this->status !== 'pending') {
            return false;
        }

        if ($this->expires_at->isPast()) {
            $this->update(['status' => 'expired']);
            return false;
        }

        // If to_user_id is set, verify it matches
        if ($this->to_user_id && $this->to_user_id !== $userId) {
            return false;
        }

        $this->update([
            'status' => 'accepted',
            'to_user_id' => $userId,
            'accepted_at' => now(),
        ]);

        // Update member ownership
        $member = $this->member;
        if ($member) {
            $member->update(['user_id' => $userId]);
            
            // Update primary manager
            ProfileManager::where('member_id', $member->id)
                ->where('manager_type', 'owner')
                ->update(['is_active' => false]);

            ProfileManager::create([
                'member_id' => $member->id,
                'manager_user_id' => $userId,
                'manager_type' => 'owner',
                'permissions' => array_keys(ProfileManager::PERMISSIONS),
                'is_primary' => true,
                'is_active' => true,
                'accepted_at' => now(),
            ]);
        }

        return true;
    }

    /**
     * Reject the transfer
     */
    public function reject(?string $reason = null): void
    {
        $this->update([
            'status' => 'rejected',
            'rejected_at' => now(),
            'rejection_reason' => $reason,
        ]);
    }

    /**
     * Cancel the transfer (by initiator)
     */
    public function cancel(): void
    {
        if ($this->status === 'pending') {
            $this->update(['status' => 'cancelled']);
        }
    }

    /**
     * Check and expire old transfers
     */
    public static function expireOldTransfers(): int
    {
        return self::where('status', 'pending')
            ->where('expires_at', '<', now())
            ->update(['status' => 'expired']);
    }

    /**
     * Format for API response
     */
    public function toApiResponse(): array
    {
        return [
            'id' => $this->id,
            'to_name' => $this->to_name,
            'to_email' => $this->to_email ? $this->getMaskedEmail() : null,
            'status' => $this->status,
            'reason' => $this->transfer_reason,
            'expires_at' => $this->expires_at->toISOString(),
            'created_at' => $this->created_at->toISOString(),
            'days_remaining' => max(0, now()->diffInDays($this->expires_at, false)),
        ];
    }

    protected function getMaskedEmail(): string
    {
        if (!$this->to_email) {
            return '';
        }
        
        $parts = explode('@', $this->to_email);
        if (count($parts) !== 2) {
            return '***@***';
        }

        $local = $parts[0];
        $domain = $parts[1];
        
        $maskedLocal = substr($local, 0, 2) . str_repeat('*', max(0, strlen($local) - 2));
        
        return $maskedLocal . '@' . $domain;
    }
}
