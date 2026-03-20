<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProgressionChecklistItem extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'is_completed' => 'boolean',
        'completed_at' => 'datetime',
    ];

    public function progression()
    {
        return $this->belongsTo(MemberProgression::class, 'member_progression_id');
    }
}
