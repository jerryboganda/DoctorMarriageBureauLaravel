<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProgressionVenue extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'estimated_cost' => 'float',
        'rating' => 'float',
        'visited_at' => 'datetime',
    ];

    public function progression()
    {
        return $this->belongsTo(MemberProgression::class, 'member_progression_id');
    }
}
