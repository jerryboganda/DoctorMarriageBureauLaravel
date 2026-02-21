<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserNotificationPreference extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'email_digest' => 'boolean',
        'whatsapp' => 'boolean',
        'push_notifications' => 'boolean',
        'sms' => 'boolean',
        'weekly_digest' => 'boolean',
        'profile_snoozed' => 'boolean',
        'snooze_until' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if profile should auto-wake from snooze.
     */
    public function shouldAutoWake(): bool
    {
        if (!$this->profile_snoozed) {
            return false;
        }
        
        if ($this->snooze_until && now()->gte($this->snooze_until)) {
            return true;
        }
        
        return false;
    }
}
