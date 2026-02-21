<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Coupon extends Model
{
    protected $casts = [
        'is_active' => 'boolean',
        'starts_at' => 'datetime',
        'expires_at' => 'datetime',
        'discount_value' => 'float',
        'min_amount' => 'float',
        'max_redemptions' => 'integer',
        'used_count' => 'integer',
        'per_user_limit' => 'integer',
    ];

    public function redemptions()
    {
        return $this->hasMany(CouponRedemption::class);
    }
}
