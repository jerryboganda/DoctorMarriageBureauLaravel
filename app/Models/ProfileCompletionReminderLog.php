<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProfileCompletionReminderLog extends Model
{
    public $timestamps = false;

    protected $table = 'profile_completion_reminder_logs';

    protected $fillable = [
        'user_id',
        'profile_percentage',
        'sent_at',
        'status',
        'error_message',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
        'profile_percentage' => 'integer',
    ];

    /**
     * Get the user that owns this log.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
