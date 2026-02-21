<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PartnerPreferencePriority extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'field_name',
        'priority_type',
    ];

    /**
     * Valid field names for partner preferences
     */
    public const VALID_FIELDS = [
        'age',
        'height',
        'weight',
        'religion',
        'caste',
        'profession',
        'education',
        'income',
        'location',
        'marital_status',
        'diet',
        'drinking',
        'smoking',
        'body_type',
        'complexion',
        'language',
        'family_type',
        'children_acceptable',
    ];

    /**
     * Priority types
     */
    public const PRIORITY_DEALBREAKER = 'dealbreaker';
    public const PRIORITY_MUST_HAVE = 'must_have';
    public const PRIORITY_NICE_TO_HAVE = 'nice_to_have';
    public const PRIORITY_FLEXIBLE = 'flexible';

    /**
     * Get the user that owns this priority setting.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get all priorities for a user as a keyed array.
     */
    public static function getForUser(int $userId): array
    {
        return self::where('user_id', $userId)
            ->pluck('priority_type', 'field_name')
            ->toArray();
    }

    /**
     * Set priority for a field (upsert).
     */
    public static function setPriority(int $userId, string $fieldName, string $priorityType): self
    {
        return self::updateOrCreate(
            ['user_id' => $userId, 'field_name' => $fieldName],
            ['priority_type' => $priorityType]
        );
    }

    /**
     * Bulk set priorities for a user.
     */
    public static function setBulk(int $userId, array $priorities): void
    {
        foreach ($priorities as $fieldName => $priorityType) {
            if (in_array($fieldName, self::VALID_FIELDS)) {
                self::setPriority($userId, $fieldName, $priorityType);
            }
        }
    }
}
