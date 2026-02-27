<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProfileCompletionReminderSetting extends Model
{
    protected $table = 'profile_completion_reminder_settings';

    protected $fillable = [
        'is_enabled',
        'threshold_percent',
        'interval_days',
        'max_reminders',
        'email_subject',
        'email_body',
    ];

    protected $casts = [
        'is_enabled' => 'boolean',
        'threshold_percent' => 'integer',
        'interval_days' => 'integer',
        'max_reminders' => 'integer',
    ];

    /**
     * Get the singleton settings row.
     */
    public static function getSettings(): self
    {
        return static::first() ?? static::create([
            'is_enabled' => true,
            'threshold_percent' => 80,
            'interval_days' => 5,
            'max_reminders' => 10,
            'email_subject' => 'Complete Your Profile - Doctor Marriage Bureau',
        ]);
    }
}
