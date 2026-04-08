<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FieldVisibilitySetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'field_name',
        'is_visible',
    ];

    protected $casts = [
        'is_visible' => 'boolean',
    ];

    /**
     * Valid field names that can have visibility settings
     */
    public const VALID_FIELDS = [
        // Basics
        'full_name',
        'birthday',
        'age',
        'gender',
        'height',
        'weight',
        'phone',
        'email',
        'nationality',
        'immigration_status',
        'current_residency',
        'languages',
        // Marriage Intent
        'marriage_timeline',
        'relocation_willingness',
        'seriousness_level',
        // Career
        'profession',
        'company',
        'income',
        'education',
        'work_location',
        // Family
        'family_type',
        'father_occupation',
        'mother_occupation',
        'siblings',
        'family_location',
        'religion',
        'caste',
        'gothra',
        // Lifestyle
        'diet',
        'drinking',
        'smoking',
        'hobbies',
        // Media
        'photos',
        'voice_intro',
        'intro_video',
        'private_vault',
        'screenshot_deterrence',
    ];

    /**
     * Get the user that owns this visibility setting.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get all visibility settings for a user as a keyed array.
     */
    public static function getForUser(int $userId): array
    {
        $settings = self::where('user_id', $userId)
            ->pluck('is_visible', 'field_name')
            ->toArray();

        // Default all fields to visible if not set
        $defaults = array_fill_keys(self::VALID_FIELDS, true);

        return array_merge($defaults, $settings);
    }

    /**
     * Set visibility for a field (upsert).
     */
    public static function setVisibility(int $userId, string $fieldName, bool $isVisible): self
    {
        return self::updateOrCreate(
            ['user_id' => $userId, 'field_name' => $fieldName],
            ['is_visible' => $isVisible]
        );
    }

    /**
     * Toggle visibility for a field.
     */
    public static function toggleVisibility(int $userId, string $fieldName): bool
    {
        $current = self::where('user_id', $userId)
            ->where('field_name', $fieldName)
            ->first();

        $newValue = $current ? !$current->is_visible : false;

        self::setVisibility($userId, $fieldName, $newValue);

        return $newValue;
    }

    /**
     * Bulk set visibility settings for a user.
     */
    public static function setBulk(int $userId, array $settings): void
    {
        foreach ($settings as $fieldName => $isVisible) {
            if (in_array($fieldName, self::VALID_FIELDS)) {
                self::setVisibility($userId, $fieldName, (bool) $isVisible);
            }
        }
    }
}
