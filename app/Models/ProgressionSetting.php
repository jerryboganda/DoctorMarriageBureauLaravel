<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProgressionSetting extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'share_calendar_busy' => 'boolean',
        'auto_detect_timezone' => 'boolean',
        'budget_target' => 'float',
    ];

    public function progression()
    {
        return $this->belongsTo(MemberProgression::class, 'member_progression_id');
    }
}
