<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Recidency extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'immigration_status',
        'birth_country_id',
        'recidency_country_id',
        'growup_country_id',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
