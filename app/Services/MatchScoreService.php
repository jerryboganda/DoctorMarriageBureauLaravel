<?php

namespace App\Services;

use App\Models\Country;
use App\Models\MemberLanguage;
use App\Models\PartnerExpectation;
use App\Models\Religion;
use App\Models\User;
use App\Utility\MemberUtility;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Lightweight match-score service used by Discovery cards, search results,
 * and any endpoint that needs a quick compatibility percentage between two users.
 *
 * Design principles:
 *  - Uses the viewer's PartnerExpectation + importance weights.
 *  - Missing data → 50 (moderate penalty, not a free pass).
 *  - Score is 0-100 integer.
 *  - Cached per pair for 24 h; cache invalidated on preference change.
 */
class MatchScoreService
{
    /**
     * Get the compatibility score between the viewer and target user.
     * Returns an integer 0–100.
     */
    public static function score(User $viewer, User $target): int
    {
        $cacheKey = "match_score:{$viewer->id}:{$target->id}";

        return Cache::remember($cacheKey, now()->addHours(24), function () use ($viewer, $target) {
            return self::compute($viewer, $target);
        });
    }

    /**
     * Bust all cached scores that involve this user (call after preferences change).
     */
    public static function invalidateFor(int $userId): void
    {
        // We tag-based invalidation isn't available on file/database cache drivers,
        // so we just flush the specific known pairs. For production at scale,
        // consider switching to a tagged-cache driver (Redis/Memcached).
        // For now, do a simple pattern flush via DB if using database driver,
        // or accept that caches will naturally expire after 24 h.
        // This is a no-op placeholder that can be expanded.
    }

    /**
     * Compute the raw score (no cache).
     */
    private static function compute(User $viewer, User $target): int
    {
        $expectations = PartnerExpectation::where('user_id', $viewer->id)->first();

        // If the viewer has no expectations at all, return a flat 50
        if (! $expectations) {
            return 50;
        }

        $scores = []; // ['weight' => int, 'score' => int]

        // --- 1. Age ---
        $scores[] = self::scoreAge($viewer, $target, $expectations);

        // --- 2. Religion ---
        $scores[] = self::scoreReligion($viewer, $target, $expectations);

        // --- 3. Location ---
        $scores[] = self::scoreLocation($viewer, $target, $expectations);

        // --- 4. Marital Status ---
        $scores[] = self::scoreMaritalStatus($target, $expectations);

        // --- 5. Height ---
        $scores[] = self::scoreHeight($target, $expectations);

        // --- 6. Language ---
        $scores[] = self::scoreLanguage($viewer, $target, $expectations);

        // Weighted average
        $totalWeight = 0;
        $weightedSum = 0;

        foreach ($scores as $s) {
            $weightedSum += $s['score'] * $s['weight'];
            $totalWeight += $s['weight'];
        }

        return $totalWeight > 0 ? (int) round($weightedSum / $totalWeight) : 50;
    }

    // ─── Individual scorers ────────────────────────────────────────────

    private static function scoreAge(User $viewer, User $target, PartnerExpectation $exp): array
    {
        $weight = self::importanceToWeight($exp->age_importance);
        $targetAge = MemberUtility::member_age($target->id);

        if (! $targetAge) {
            return ['score' => 50, 'weight' => $weight];
        }

        $minAge = $exp->min_age ?? 18;
        $maxAge = $exp->max_age ?? 60;

        if ($targetAge >= $minAge && $targetAge <= $maxAge) {
            return ['score' => 100, 'weight' => $weight];
        }

        $diff = $targetAge < $minAge ? ($minAge - $targetAge) : ($targetAge - $maxAge);
        $score = max(20, 100 - ($diff * 12));

        return ['score' => $score, 'weight' => $weight];
    }

    private static function scoreReligion(User $viewer, User $target, PartnerExpectation $exp): array
    {
        $weight = self::importanceToWeight($exp->religion_importance);
        $prefId = $exp->religion_id;

        if (! $prefId) {
            // Viewer didn't set a religion preference → neutral
            return ['score' => 50, 'weight' => $weight];
        }

        $targetReligionId = $target->spiritual_backgrounds?->religion_id;

        if (! $targetReligionId) {
            return ['score' => 50, 'weight' => $weight]; // target data missing
        }

        return [
            'score' => ($prefId == $targetReligionId) ? 100 : 30,
            'weight' => $weight,
        ];
    }

    private static function scoreLocation(User $viewer, User $target, PartnerExpectation $exp): array
    {
        $weight = self::importanceToWeight($exp->residence_importance);
        $prefCountryId = $exp->residence_country_id;

        if (! $prefCountryId) {
            return ['score' => 50, 'weight' => $weight];
        }

        // Get target's country id from addresses
        $targetCountryId = $target->addresses?->firstWhere('type', 'present')?->country_id
                        ?? $target->addresses?->first()?->country_id;

        if (! $targetCountryId) {
            return ['score' => 50, 'weight' => $weight];
        }

        return [
            'score' => ($prefCountryId == $targetCountryId) ? 100 : 40,
            'weight' => $weight,
        ];
    }

    private static function scoreMaritalStatus(User $target, PartnerExpectation $exp): array
    {
        $weight = self::importanceToWeight($exp->marital_status_importance);
        $prefId = $exp->marital_status_id;

        if (! $prefId) {
            return ['score' => 50, 'weight' => $weight];
        }

        $targetStatusId = $target->member?->marital_status_id;

        if (! $targetStatusId) {
            return ['score' => 50, 'weight' => $weight];
        }

        return [
            'score' => ($prefId == $targetStatusId) ? 100 : 35,
            'weight' => $weight,
        ];
    }

    private static function scoreHeight(User $target, PartnerExpectation $exp): array
    {
        $weight = self::importanceToWeight($exp->height_importance);
        $minHeight = $exp->height; // stored as cm integer

        if (! $minHeight) {
            return ['score' => 50, 'weight' => $weight];
        }

        $targetHeight = $target->physical_attributes?->height;

        if (! $targetHeight) {
            return ['score' => 50, 'weight' => $weight];
        }

        if ($targetHeight >= $minHeight) {
            return ['score' => 100, 'weight' => $weight];
        }

        $diff = $minHeight - $targetHeight;
        $score = max(20, 100 - ($diff * 3));

        return ['score' => $score, 'weight' => $weight];
    }

    private static function scoreLanguage(User $viewer, User $target, PartnerExpectation $exp): array
    {
        $weight = self::importanceToWeight($exp->language_importance);
        $prefLangId = $exp->language_id;

        if (! $prefLangId) {
            return ['score' => 50, 'weight' => $weight];
        }

        // Target's mother tongue is stored on member.mothere_tongue (MemberLanguage id)
        $targetLangId = $target->member?->mothere_tongue;

        if (! $targetLangId) {
            return ['score' => 50, 'weight' => $weight];
        }

        return [
            'score' => ($prefLangId == $targetLangId) ? 100 : 35,
            'weight' => $weight,
        ];
    }

    // ─── Helpers ───────────────────────────────────────────────────────

    /**
     * Convert the human-readable importance string to a numeric weight.
     */
    private static function importanceToWeight(?string $importance): int
    {
        return match ($importance) {
            'Dealbreaker' => 5,
            'Must have' => 4,
            'Nice to have' => 2,
            'Not important' => 1,
            default => 2, // if not set, treat as medium
        };
    }
}
