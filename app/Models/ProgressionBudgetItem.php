<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProgressionBudgetItem extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'amount' => 'float',
    ];

    public function progression()
    {
        return $this->belongsTo(MemberProgression::class, 'member_progression_id');
    }
}
