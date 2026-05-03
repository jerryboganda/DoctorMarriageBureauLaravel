<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReferralRule extends Model
{
    protected $table = 'referral_rules';

    protected $fillable = [
        'name',
        'is_active',
        'trigger_threshold',
        'qualification_mode',
        'qualification_params',
        'reward_type',
        'reward_params',
        'per_user_limit',
        'starts_at',
        'ends_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'trigger_threshold' => 'integer',
        'qualification_params' => 'array',
        'reward_params' => 'array',
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
    ];

    /**
     * Scope: only active rules
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('starts_at')->orWhere('starts_at', '<=', now());
            })
            ->where(function ($q) {
                $q->whereNull('ends_at')->orWhere('ends_at', '>=', now());
            });
    }

    /**
     * Get the target package for upgrade rewards
     */
    public function getTargetPackageId()
    {
        return $this->reward_params['target_package_id'] ?? null;
    }

    /**
     * Get upgrade duration in days
     */
    public function getUpgradeDurationDays()
    {
        return $this->reward_params['upgrade_duration_days'] ?? 90;
    }

    /**
     * Check if upgrade is permanent
     */
    public function isPermanentUpgrade()
    {
        return $this->reward_params['is_permanent'] ?? false;
    }

    public function rewards()
    {
        return $this->hasMany(ReferralReward::class, 'rule_id');
    }
}
