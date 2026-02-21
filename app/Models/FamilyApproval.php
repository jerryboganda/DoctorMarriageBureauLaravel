<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FamilyApproval extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'responded_at' => 'datetime',
    ];

    public function family()
    {
        return $this->belongsTo(Family::class);
    }

    public function guardian()
    {
        return $this->belongsTo(FamilyGuardian::class);
    }

    public function targetUser()
    {
        return $this->belongsTo(User::class, 'target_user_id');
    }
}
