<?php

namespace App\Models;
use App\Models\User;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Lifestyle extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'diet',
        'drink',
        'smoke',
        'property',
        'property_details',
        'living_with',
        'sleep_schedule',
        'personality_tags',
    ];

    public function user()
    {
        return $this->belongsTo(User::class)->withTrashed();
    }
}
