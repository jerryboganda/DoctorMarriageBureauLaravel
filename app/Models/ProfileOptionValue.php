<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProfileOptionValue extends Model
{
    protected $fillable = [
        'group',
        'value',
        'label',
        'sort_order',
        'is_active',
    ];
}
