<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReferralReward extends Model
{
    protected $table = 'referral_rewards';

    protected $fillable = [
        'user_id',
        'rule_id',
        'reward_type',
        'reward_payload',
        'status',
        'applied_at',
        'reversed_at',
        'idempotency_key',
        'admin_notes',
    ];

    protected $casts = [
        'reward_payload' => 'array',
        'applied_at' => 'datetime',
        'reversed_at' => 'datetime',
    ];

    // ── Relationships ──

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function rule()
    {
        return $this->belongsTo(ReferralRule::class, 'rule_id');
    }

    // ── Scopes ──

    public function scopeApplied($query)
    {
        return $query->where('status', 'applied');
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    // ── Status Methods ──

    /**
     * Mark as applied (idempotent)
     */
    public function markAsApplied()
    {
        if ($this->status === 'applied') {
            return true; // Already applied, idempotent
        }

        $this->status = 'applied';
        $this->applied_at = now();

        return $this->save();
    }

    /**
     * Mark as failed
     */
    public function markAsFailed($notes = null)
    {
        $this->status = 'failed';
        if ($notes) {
            $this->admin_notes = $notes;
        }

        return $this->save();
    }

    /**
     * Reverse reward
     */
    public function reverseReward($adminId = null, $reason = null)
    {
        if ($this->status === 'reversed') {
            return false;
        }

        $previousStatus = $this->status;
        $this->status = 'reversed';
        $this->reversed_at = now();
        if ($reason) {
            $this->admin_notes = ($this->admin_notes ? $this->admin_notes."\n" : '').'Reversed: '.$reason;
        }

        $saved = $this->save();

        if ($saved) {
            ReferralAuditLog::log(
                $adminId ? 'admin' : 'system',
                $adminId,
                'reward_reversed',
                'referral_reward',
                $this->id,
                ['status' => $previousStatus],
                ['status' => 'reversed', 'reason' => $reason]
            );
        }

        return $saved;
    }

    /**
     * Generate idempotency key
     */
    public static function generateIdempotencyKey($ruleId, $userId, $milestone)
    {
        return "rule_{$ruleId}_user_{$userId}_milestone_{$milestone}";
    }
}
