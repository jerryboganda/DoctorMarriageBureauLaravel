<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CouponRedemption extends Model
{
    protected $casts = [
        'redeemed_at' => 'datetime',
        'original_amount' => 'float',
        'discount_amount' => 'float',
        'final_amount' => 'float',
    ];

    public function coupon()
    {
        return $this->belongsTo(Coupon::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class)->withTrashed();
    }
}
