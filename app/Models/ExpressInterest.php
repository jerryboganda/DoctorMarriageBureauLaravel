<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExpressInterest extends Model
{
    protected $fillable = [
        'user_id',
        'interested_by',
        'status',
    ];

    public function user()
    {
        return $this->belongsTo(User::class)->withTrashed();
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    public function interestedby()
    {
        return $this->belongsTo(User::class, 'interested_by');
    }
}
