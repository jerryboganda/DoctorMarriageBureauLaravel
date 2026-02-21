<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CommunityMembership extends Model
{
    protected $casts = [
        'requested_at' => 'datetime',
        'approved_at' => 'datetime',
    ];

    public function community()
    {
        return $this->belongsTo(Community::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class)->withTrashed();
    }
}
