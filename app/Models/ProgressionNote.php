<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProgressionNote extends Model
{
    use HasFactory;

    protected $guarded = [];

    public function progression()
    {
        return $this->belongsTo(MemberProgression::class, 'member_progression_id');
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }
}
