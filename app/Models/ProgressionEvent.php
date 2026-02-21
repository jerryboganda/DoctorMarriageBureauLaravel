<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProgressionEvent extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'event_at' => 'datetime'
    ];

    public function memberProgression() {
        return $this->belongsTo(MemberProgression::class);
    }
}
