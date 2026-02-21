<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

class ProfileAuditLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'section',
        'field_name',
        'old_value',
        'new_value',
        'ip_address',
        'user_agent',
        'changed_at',
    ];

    protected $casts = [
        'changed_at' => 'datetime',
    ];

    /**
     * Valid sections for audit logging
     */
    public const SECTION_BASICS = 'basics';
    public const SECTION_LIFESTYLE = 'lifestyle';
    public const SECTION_CAREER = 'career';
    public const SECTION_FAMILY = 'family';
    public const SECTION_PREFERENCES = 'preferences';
    public const SECTION_MEDIA = 'media';
    public const SECTION_VISIBILITY = 'visibility';

    /**
     * Get the user that owns this audit log.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Log a profile change.
     */
    public static function logChange(
        int $userId,
        string $section,
        string $fieldName,
        mixed $oldValue,
        mixed $newValue,
        ?string $ipAddress = null,
        ?string $userAgent = null
    ): self {
        // Don't log if values are the same
        $oldEncoded = is_array($oldValue) || is_object($oldValue) ? json_encode($oldValue) : (string) $oldValue;
        $newEncoded = is_array($newValue) || is_object($newValue) ? json_encode($newValue) : (string) $newValue;

        if ($oldEncoded === $newEncoded) {
            return new self(); // Return empty model, don't save
        }

        return self::create([
            'user_id' => $userId,
            'section' => $section,
            'field_name' => $fieldName,
            'old_value' => $oldEncoded,
            'new_value' => $newEncoded,
            'ip_address' => $ipAddress ?? request()->ip(),
            'user_agent' => $userAgent ?? substr(request()->userAgent() ?? '', 0, 255),
            'changed_at' => now(),
        ]);
    }

    /**
     * Log multiple field changes at once.
     */
    public static function logChanges(
        int $userId,
        string $section,
        array $oldData,
        array $newData,
        ?string $ipAddress = null,
        ?string $userAgent = null
    ): array {
        $logs = [];
        
        foreach ($newData as $fieldName => $newValue) {
            $oldValue = $oldData[$fieldName] ?? null;
            
            if ($oldValue !== $newValue) {
                $logs[] = self::logChange(
                    $userId,
                    $section,
                    $fieldName,
                    $oldValue,
                    $newValue,
                    $ipAddress,
                    $userAgent
                );
            }
        }

        return $logs;
    }

    /**
     * Get history for a user with optional filters.
     */
    public static function getHistory(
        int $userId,
        ?string $section = null,
        ?Carbon $startDate = null,
        ?Carbon $endDate = null,
        int $limit = 50
    ) {
        $query = self::where('user_id', $userId)
            ->orderBy('changed_at', 'desc');

        if ($section) {
            $query->where('section', $section);
        }

        if ($startDate) {
            $query->where('changed_at', '>=', $startDate);
        }

        if ($endDate) {
            $query->where('changed_at', '<=', $endDate);
        }

        return $query->limit($limit)->get();
    }

    /**
     * Get grouped history by date for a user.
     */
    public static function getGroupedHistory(int $userId, int $days = 30): array
    {
        $logs = self::where('user_id', $userId)
            ->where('changed_at', '>=', now()->subDays($days))
            ->orderBy('changed_at', 'desc')
            ->get();

        $grouped = [];
        foreach ($logs as $log) {
            $date = $log->changed_at->format('Y-m-d');
            if (!isset($grouped[$date])) {
                $grouped[$date] = [
                    'date' => $date,
                    'formatted_date' => $log->changed_at->format('M j, Y'),
                    'changes' => [],
                ];
            }
            $grouped[$date]['changes'][] = [
                'id' => $log->id,
                'section' => $log->section,
                'field_name' => $log->field_name,
                'old_value' => $log->old_value,
                'new_value' => $log->new_value,
                'time' => $log->changed_at->format('g:i A'),
            ];
        }

        return array_values($grouped);
    }

    /**
     * Get summary stats for a user's profile changes.
     */
    public static function getStats(int $userId): array
    {
        $total = self::where('user_id', $userId)->count();
        $lastWeek = self::where('user_id', $userId)
            ->where('changed_at', '>=', now()->subWeek())
            ->count();
        $lastChange = self::where('user_id', $userId)
            ->orderBy('changed_at', 'desc')
            ->first();

        $bySectionQuery = self::where('user_id', $userId)
            ->selectRaw('section, COUNT(*) as count')
            ->groupBy('section')
            ->pluck('count', 'section')
            ->toArray();

        return [
            'total_changes' => $total,
            'changes_last_week' => $lastWeek,
            'last_change_at' => $lastChange?->changed_at?->toISOString(),
            'by_section' => $bySectionQuery,
        ];
    }
}
