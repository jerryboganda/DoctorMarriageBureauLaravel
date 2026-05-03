<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Referral extends Model
{
    protected $table = 'referrals';

    protected $fillable = [
        'referrer_user_id',
        'referred_user_id',
        'referral_code_id',
        'source',
        'status',
        'qualified_at',
        'invalidated_at',
        'reversed_at',
        'metadata',
    ];

    protected $casts = [
        'qualified_at' => 'datetime',
        'invalidated_at' => 'datetime',
        'reversed_at' => 'datetime',
        'metadata' => 'array',
    ];

    // ── Relationships ──

    public function referrer()
    {
        return $this->belongsTo(User::class, 'referrer_user_id');
    }

    public function referred()
    {
        return $this->belongsTo(User::class, 'referred_user_id');
    }

    public function referralCode()
    {
        return $this->belongsTo(ReferralCode::class, 'referral_code_id');
    }

    // ── Scopes ──

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeQualified($query)
    {
        return $query->where('status', 'qualified');
    }

    public function scopeForReferrer($query, $userId)
    {
        return $query->where('referrer_user_id', $userId);
    }

    // ── Status Transitions ──

    /**
     * Mark referral as qualified (atomic)
     */
    public function markAsQualified()
    {
        if ($this->status !== 'pending') {
            return false;
        }

        $this->status = 'qualified';
        $this->qualified_at = now();
        return $this->save();
    }

    /**
     * Invalidate referral
     */
    public function invalidate($reason = null)
    {
        if ($this->status === 'invalid') {
            return false;
        }

        $previousStatus = $this->status;
        $this->status = 'invalid';
        $this->invalidated_at = now();

        if ($reason) {
            $metadata = $this->metadata ?? [];
            $metadata['invalidation_reason'] = $reason;
            $this->metadata = $metadata;
        }

        $saved = $this->save();

        if ($saved) {
            ReferralAuditLog::log('system', null, 'referral_invalidated', 'referral', $this->id, [
                'previous_status' => $previousStatus,
            ], [
                'status' => 'invalid',
                'reason' => $reason,
            ]);
        }

        return $saved;
    }

    /**
     * Reverse referral
     */
    public function reverse($reason = null)
    {
        if ($this->status === 'reversed') {
            return false;
        }

        $previousStatus = $this->status;
        $this->status = 'reversed';
        $this->reversed_at = now();

        if ($reason) {
            $metadata = $this->metadata ?? [];
            $metadata['reversal_reason'] = $reason;
            $this->metadata = $metadata;
        }

        $saved = $this->save();

        if ($saved) {
            ReferralAuditLog::log('system', null, 'referral_reversed', 'referral', $this->id, [
                'previous_status' => $previousStatus,
            ], [
                'status' => 'reversed',
                'reason' => $reason,
            ]);
        }

        return $saved;
    }
}
