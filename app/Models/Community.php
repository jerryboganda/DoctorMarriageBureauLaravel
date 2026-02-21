<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Community extends Model
{
    protected $fillable = [
        'name',
        'type',
        'description',
        'is_private',
        'is_active',
        'created_by',
    ];

    protected $casts = [
        'is_private' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function memberships()
    {
        return $this->hasMany(CommunityMembership::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
