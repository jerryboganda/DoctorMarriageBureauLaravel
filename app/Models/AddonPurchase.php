<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class AddonPurchase extends Model
{
    use SoftDeletes;

    protected $casts = [
        'amount' => 'float',
        'original_amount' => 'float',
        'discount_amount' => 'float',
    ];

    public function addon()
    {
        return $this->belongsTo(AddonProduct::class, 'addon_product_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class)->withTrashed();
    }

    public function coupon()
    {
        return $this->belongsTo(Coupon::class);
    }
}
