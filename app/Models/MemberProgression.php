<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MemberProgression extends Model
{
    use HasFactory;

    protected $guarded = [];

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
}
