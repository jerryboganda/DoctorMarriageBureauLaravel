<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MemberProgression extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'total_progress_percent' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function partner()
    {
        return $this->belongsTo(User::class, 'partner_id');
    }

    public function stage()
    {
        return $this->belongsTo(ProgressionStage::class, 'current_stage_id');
    }

    public function events()
    {
        return $this->hasMany(ProgressionEvent::class);
    }

    public function checklistItems()
    {
        return $this->hasMany(ProgressionChecklistItem::class, 'member_progression_id');
    }

    public function notes()
    {
        return $this->hasMany(ProgressionNote::class, 'member_progression_id');
    }

    public function venues()
    {
        return $this->hasMany(ProgressionVenue::class, 'member_progression_id');
    }

    public function budgetItems()
    {
        return $this->hasMany(ProgressionBudgetItem::class, 'member_progression_id');
    }

    public function settings()
    {
        return $this->hasOne(ProgressionSetting::class, 'member_progression_id');
    }
}
