<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReferralAuditLog extends Model
{
    protected $table = 'referral_audit_logs';

    public $timestamps = false;

    protected $fillable = [
        'actor_type',
        'actor_id',
        'action',
        'entity_type',
        'entity_id',
        'before_data',
        'after_data',
        'ip_address',
        'notes',
        'created_at',
    ];

    protected $casts = [
        'before_data' => 'array',
        'after_data' => 'array',
        'created_at' => 'datetime',
    ];

    /**
     * Static helper to log an audit entry
     */
    public static function log($actorType, $actorId, $action, $entityType, $entityId, $before = null, $after = null, $notes = null)
    {
        return static::create([
            'actor_type' => $actorType,
            'actor_id' => $actorId,
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'before_data' => $before,
            'after_data' => $after,
            'ip_address' => request()->ip() ?? null,
            'notes' => $notes,
            'created_at' => now(),
        ]);
    }
}
