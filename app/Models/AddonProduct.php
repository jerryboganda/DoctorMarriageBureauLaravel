<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AddonProduct extends Model
{
    protected $casts = [
        'is_active' => 'boolean',
        'price' => 'float',
        'metadata' => 'array',
    ];

    public function purchases()
    {
        return $this->hasMany(AddonPurchase::class);
    }
}
