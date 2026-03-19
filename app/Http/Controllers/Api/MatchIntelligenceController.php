<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Member;
use App\Models\PartnerExpectation;
use App\Models\PhysicalAttribute;
use App\Models\SpiritualBackground;
use App\Models\Lifestyle;
use App\Models\Career;
use App\Models\Education;
use App\Models\Country;
use App\Models\Religion;
use App\Models\MaritalStatus;
use App\Models\MemberLanguage;
use App\Utility\MemberUtility;
use Illuminate\Http\Request;
use Carbon\Carbon;
use DB;

class MatchIntelligenceController extends Controller
{
    /**
     * Default score when data is missing (moderate penalty).
     */
    private const MISSING_DATA_SCORE = 50;

    /**
     * Default total when no expectations exist at all.
     */
    private const NO_EXPECTATIONS_TOTAL = 50;

    public function show(Request $request, $id)
    {
        $viewer = auth()->user();
        $target = User::with([
            'member.marital_status',
            'physical_attributes',
            'spiritual_backgrounds.religion',
            'career',
            'education',
            'addresses.country',
            'partner_expectations',
        ])->findOrFail($id);

        // Also eager-load viewer relations we'll need
        $viewer->load([
            'member.marital_status',
            'physical_attributes',
            'spiritual_backgrounds.religion',
            'career',
            'education',
            'addresses.country',
            'partner_expectations',
        ]);

        // Get partner expectations
        $viewerExpectations = $viewer->partner_expectations;
        $targetExpectations = $target->partner_expectations;

        // Calculate individual category scores
        $categories = [];
        $topReasons = [];
        $frictionPoints = [];

        // 1. Age Compatibility
        $ageScore = $this->calculateAgeScore($viewer, $target, $viewerExpectations);
        $categories[] = ['name' => 'Age Compatibility', 'score' => $ageScore['score'], 'weight' => $ageScore['weight']];
        if ($ageScore['match']) $topReasons[] = $ageScore['reason'];
        if ($ageScore['friction']) $frictionPoints[] = $ageScore['friction'];

        // 2. Medical Career Compatibility
        $careerScore = $this->calculateCareerScore($viewer, $target, $viewerExpectations);
        $categories[] = ['name' => 'Medical Career', 'score' => $careerScore['score'], 'weight' => $careerScore['weight']];
        if ($careerScore['match']) $topReasons[] = $careerScore['reason'];
        if ($careerScore['friction']) $frictionPoints[] = $careerScore['friction'];

        // 3. Religion/Spiritual Compatibility
        $religionScore = $this->calculateReligionScore($viewer, $target, $viewerExpectations);
        $categories[] = ['name' => 'Religious Values', 'score' => $religionScore['score'], 'weight' => $religionScore['weight']];
        if ($religionScore['match']) $topReasons[] = $religionScore['reason'];
        if ($religionScore['friction']) $frictionPoints[] = $religionScore['friction'];

        // 4. Location Compatibility
        $locationScore = $this->calculateLocationScore($viewer, $target, $viewerExpectations);
        $categories[] = ['name' => 'Location Match', 'score' => $locationScore['score'], 'weight' => $locationScore['weight']];
        if ($locationScore['match']) $topReasons[] = $locationScore['reason'];
        if ($locationScore['friction']) $frictionPoints[] = $locationScore['friction'];

        // 5. Education Compatibility
        $educationScore = $this->calculateEducationScore($viewer, $target, $viewerExpectations);
        $categories[] = ['name' => 'Educational Background', 'score' => $educationScore['score'], 'weight' => $educationScore['weight']];
        if ($educationScore['match']) $topReasons[] = $educationScore['reason'];
        if ($educationScore['friction']) $frictionPoints[] = $educationScore['friction'];

        // 6. Height Compatibility
        $heightScore = $this->calculateHeightScore($viewer, $target, $viewerExpectations);
        $categories[] = ['name' => 'Physical Preferences', 'score' => $heightScore['score'], 'weight' => $heightScore['weight']];
        if (!empty($heightScore['match'])) $topReasons[] = $heightScore['reason'] ?? null;
        if ($heightScore['friction']) $frictionPoints[] = $heightScore['friction'];

        // 7. Marital Status Compatibility
        $maritalScore = $this->calculateMaritalStatusScore($viewer, $target, $viewerExpectations);
        $categories[] = ['name' => 'Marital Status', 'score' => $maritalScore['score'], 'weight' => $maritalScore['weight']];
        if ($maritalScore['match']) $topReasons[] = $maritalScore['reason'];
        if ($maritalScore['friction']) $frictionPoints[] = $maritalScore['friction'];

        // 8. Family Values
        $familyScore = $this->calculateFamilyScore($viewer, $target, $viewerExpectations);
        $categories[] = ['name' => 'Family Values', 'score' => $familyScore['score'], 'weight' => $familyScore['weight']];
        if ($familyScore['match']) $topReasons[] = $familyScore['reason'];
        if ($familyScore['friction']) $frictionPoints[] = $familyScore['friction'];

        // 9. Language Compatibility (NEW)
        $languageScore = $this->calculateLanguageScore($viewer, $target, $viewerExpectations);
        $categories[] = ['name' => 'Language', 'score' => $languageScore['score'], 'weight' => $languageScore['weight']];
        if ($languageScore['match']) $topReasons[] = $languageScore['reason'];
        if ($languageScore['friction']) $frictionPoints[] = $languageScore['friction'];

        // Calculate overall score (weighted average)
        $totalScore = $this->calculateTotalScore($categories);

        // Calculate mutual fit
        $youMeetThem = $this->calculateHowWellYouMeetTheirCriteria($viewer, $targetExpectations);
        $theyMeetYou = $this->calculateHowWellYouMeetTheirCriteria($target, $viewerExpectations);

        // Generate agent notes based on profiles
        $agentNotes = $this->generateAgentNotes($target, $totalScore, $topReasons, $frictionPoints);

        // Clean arrays
        $topReasons = array_values(array_slice(array_filter($topReasons), 0, 5));
        $frictionPoints = array_values(array_slice(array_filter($frictionPoints), 0, 3));

        return response()->json([
            'success' => true,
            'data' => [
                'totalScore' => $totalScore,
                'categories' => $categories,
                'mutualFit' => [
                    'youMeetThem' => $youMeetThem,
                    'theyMeetYou' => $theyMeetYou,
                ],
                'topReasons' => $topReasons,
                'frictionPoints' => $frictionPoints,
                'agentNotes' => $agentNotes,
                'behavioralReason' => $this->getBehavioralInsight($viewer, $target),
                'generatedAt' => now()->toIso8601String()
            ]
        ]);
    }

    // ─── Age ──────────────────────────────────────────────────────────

    private function calculateAgeScore($viewer, $target, ?PartnerExpectation $viewerExp): array
    {
        $targetAge = $target->member?->birthday
            ? Carbon::parse($target->member->birthday)->age
            : null;

        $weight = $this->formatWeight($viewerExp?->age_importance);

        if (!$targetAge) {
            return ['score' => self::MISSING_DATA_SCORE, 'weight' => $weight, 'match' => false, 'reason' => null, 'friction' => 'Age information not available'];
        }

        $minAge = $viewerExp?->min_age;
        $maxAge = $viewerExp?->max_age;

        // If viewer hasn't set age preferences, return neutral
        if (!$minAge && !$maxAge) {
            return ['score' => self::MISSING_DATA_SCORE, 'weight' => $weight, 'match' => false, 'reason' => null, 'friction' => null];
        }

        $minAge = $minAge ?? 18;
        $maxAge = $maxAge ?? 60;

        if ($targetAge >= $minAge && $targetAge <= $maxAge) {
            return [
                'score' => 100,
                'weight' => $weight,
                'match' => true,
                'reason' => "Age is within your preferred range ({$minAge}-{$maxAge} years)",
                'friction' => null,
            ];
        }

        $diff = $targetAge < $minAge ? ($minAge - $targetAge) : ($targetAge - $maxAge);
        $score = max(20, 100 - ($diff * 12));

        return [
            'score' => $score,
            'weight' => $weight,
            'match' => false,
            'reason' => null,
            'friction' => "Age ({$targetAge}) is " . ($targetAge < $minAge ? 'below' : 'above') . " your preference ({$minAge}-{$maxAge})",
        ];
    }

    // ─── Career ───────────────────────────────────────────────────────

    private function calculateCareerScore($viewer, $target, ?PartnerExpectation $viewerExp): array
    {
        $viewerCareer = $viewer->career->first();
        $targetCareer = $target->career->first();

        // Use a medium weight by default; no _importance column for career exists yet
        $weight = 'Medium';

        if (!$targetCareer) {
            return ['score' => self::MISSING_DATA_SCORE, 'weight' => $weight, 'match' => false, 'reason' => null, 'friction' => 'Limited career information available'];
        }

        if (!$viewerCareer) {
            return ['score' => self::MISSING_DATA_SCORE, 'weight' => $weight, 'match' => false, 'reason' => null, 'friction' => null];
        }

        // Both have careers
        $score = 70;
        $match = false;
        $reason = null;
        $friction = null;

        $viewerSpec = strtolower($viewerCareer->designation ?? '');
        $targetSpec = strtolower($targetCareer->designation ?? '');

        $medicalTerms = ['doctor', 'surgeon', 'physician', 'dentist', 'medical', 'hospital', 'clinic', 'healthcare', 'nurse', 'pharma'];
        $viewerIsMedical = false;
        $targetIsMedical = false;

        foreach ($medicalTerms as $term) {
            if (str_contains($viewerSpec, $term) || str_contains(strtolower($viewerCareer->company ?? ''), $term)) {
                $viewerIsMedical = true;
            }
            if (str_contains($targetSpec, $term) || str_contains(strtolower($targetCareer->company ?? ''), $term)) {
                $targetIsMedical = true;
            }
        }

        if ($viewerIsMedical && $targetIsMedical) {
            $score = 95;
            $match = true;
            $reason = "Both are in the medical field";
        } elseif ($viewerIsMedical || $targetIsMedical) {
            $score = 75;
        }

        return ['score' => $score, 'weight' => $weight, 'match' => $match, 'reason' => $reason, 'friction' => $friction];
    }

    // ─── Religion ─────────────────────────────────────────────────────

    private function calculateReligionScore($viewer, $target, ?PartnerExpectation $viewerExp): array
    {
        $weight = $this->formatWeight($viewerExp?->religion_importance);
        $prefReligionId = $viewerExp?->religion_id;

        // If no preference set, return neutral
        if (!$prefReligionId) {
            return ['score' => self::MISSING_DATA_SCORE, 'weight' => $weight, 'match' => false, 'reason' => null, 'friction' => null];
        }

        $targetReligionId = $target->spiritual_backgrounds?->religion_id;

        if (!$targetReligionId) {
            return ['score' => self::MISSING_DATA_SCORE, 'weight' => $weight, 'match' => false, 'reason' => null, 'friction' => 'Religion information not available'];
        }

        if ($prefReligionId == $targetReligionId) {
            $targetReligionName = $target->spiritual_backgrounds?->religion?->name ?? 'Same religion';
            return [
                'score' => 100,
                'weight' => $weight,
                'match' => true,
                'reason' => "Shared religious background ({$targetReligionName})",
                'friction' => null,
            ];
        }

        $importance = $viewerExp?->religion_importance ?? 'Nice to have';
        $score = ($importance === 'Dealbreaker') ? 20 : (($importance === 'Must have') ? 30 : 50);

        return [
            'score' => $score,
            'weight' => $weight,
            'match' => false,
            'reason' => null,
            'friction' => ($importance === 'Dealbreaker' || $importance === 'Must have')
                ? "Different religious backgrounds"
                : null,
        ];
    }

    // ─── Location ─────────────────────────────────────────────────────

    private function calculateLocationScore($viewer, $target, ?PartnerExpectation $viewerExp): array
    {
        $weight = $this->formatWeight($viewerExp?->residence_importance);
        $prefCountryId = $viewerExp?->residence_country_id;

        if (!$prefCountryId) {
            return ['score' => self::MISSING_DATA_SCORE, 'weight' => $weight, 'match' => false, 'reason' => null, 'friction' => null];
        }

        $targetCountryId = $target->addresses?->firstWhere('type', 'present')?->country_id
                        ?? $target->addresses?->first()?->country_id;

        if (!$targetCountryId) {
            return ['score' => self::MISSING_DATA_SCORE, 'weight' => $weight, 'match' => false, 'reason' => null, 'friction' => 'Location information not available'];
        }

        if ($prefCountryId == $targetCountryId) {
            $countryName = $target->addresses?->firstWhere('type', 'present')?->country?->name
                        ?? $target->addresses?->first()?->country?->name
                        ?? 'same country';
            return [
                'score' => 100,
                'weight' => $weight,
                'match' => true,
                'reason' => "Both located in {$countryName}",
                'friction' => null,
            ];
        }

        $importance = $viewerExp?->residence_importance ?? 'Nice to have';
        $score = ($importance === 'Dealbreaker') ? 25 : (($importance === 'Must have') ? 35 : 50);

        return [
            'score' => $score,
            'weight' => $weight,
            'match' => false,
            'reason' => null,
            'friction' => ($importance === 'Dealbreaker' || $importance === 'Must have')
                ? "Located in different countries"
                : null,
        ];
    }

    // ─── Education ────────────────────────────────────────────────────

    private function calculateEducationScore($viewer, $target, ?PartnerExpectation $viewerExp): array
    {
        $viewerEdu = $viewer->education->first();
        $targetEdu = $target->education->first();

        $weight = 'Medium'; // No _importance column for education yet

        if (!$targetEdu) {
            return ['score' => self::MISSING_DATA_SCORE, 'weight' => $weight, 'match' => false, 'reason' => null, 'friction' => 'Education information not available'];
        }

        if (!$viewerEdu) {
            return ['score' => self::MISSING_DATA_SCORE, 'weight' => $weight, 'match' => false, 'reason' => null, 'friction' => null];
        }

        $score = 70;
        $match = false;
        $reason = null;
        $friction = null;

        $viewerDegree = strtolower($viewerEdu->degree ?? '');
        $targetDegree = strtolower($targetEdu->degree ?? '');

        $medicalDegrees = ['mbbs', 'md', 'ms', 'bds', 'mds', 'phd', 'fcps', 'mrcp', 'frcs', 'do', 'dnb'];
        $viewerMedDegree = false;
        $targetMedDegree = false;

        foreach ($medicalDegrees as $deg) {
            if (str_contains($viewerDegree, $deg)) $viewerMedDegree = true;
            if (str_contains($targetDegree, $deg)) $targetMedDegree = true;
        }

        if ($viewerMedDegree && $targetMedDegree) {
            $score = 95;
            $match = true;
            $reason = "Both have medical degrees";
        } elseif ($targetMedDegree) {
            $score = 80;
            $match = true;
            $reason = "Has a medical degree";
        }

        return ['score' => $score, 'weight' => $weight, 'match' => $match, 'reason' => $reason, 'friction' => $friction];
    }

    // ─── Height ───────────────────────────────────────────────────────

    private function calculateHeightScore($viewer, $target, ?PartnerExpectation $viewerExp): array
    {
        $weight = $this->formatWeight($viewerExp?->height_importance);
        $minHeight = $viewerExp?->height;

        if (!$minHeight) {
            return ['score' => self::MISSING_DATA_SCORE, 'weight' => $weight, 'match' => false, 'reason' => null, 'friction' => null];
        }

        $targetHeight = $target->physical_attributes?->height;

        if (!$targetHeight) {
            return ['score' => self::MISSING_DATA_SCORE, 'weight' => $weight, 'match' => false, 'reason' => null, 'friction' => 'Height information not available'];
        }

        if ($targetHeight >= $minHeight) {
            return ['score' => 100, 'weight' => $weight, 'match' => true, 'reason' => 'Meets your height preference', 'friction' => null];
        }

        $diff = $minHeight - $targetHeight;
        $score = max(20, 100 - ($diff * 3));

        return [
            'score' => $score,
            'weight' => $weight,
            'match' => false,
            'reason' => null,
            'friction' => $diff > 5 ? "Height is below your preference" : null,
        ];
    }

    // ─── Marital Status ───────────────────────────────────────────────

    private function calculateMaritalStatusScore($viewer, $target, ?PartnerExpectation $viewerExp): array
    {
        $weight = $this->formatWeight($viewerExp?->marital_status_importance);
        $expectedMaritalId = $viewerExp?->marital_status_id;

        $targetStatusName = $target->member?->marital_status?->name ?? null;

        if (!$expectedMaritalId) {
            // No preference set → neutral
            return ['score' => self::MISSING_DATA_SCORE, 'weight' => $weight, 'match' => false, 'reason' => null, 'friction' => null];
        }

        if (!$targetStatusName) {
            return ['score' => self::MISSING_DATA_SCORE, 'weight' => $weight, 'match' => false, 'reason' => null, 'friction' => 'Marital status not available'];
        }

        $targetStatusId = $target->member?->marital_status_id;

        if ($expectedMaritalId == $targetStatusId) {
            return [
                'score' => 100,
                'weight' => $weight,
                'match' => true,
                'reason' => "Marital status matches your preference ({$targetStatusName})",
                'friction' => null,
            ];
        }

        $importance = $viewerExp?->marital_status_importance ?? 'Nice to have';
        $score = ($importance === 'Dealbreaker') ? 20 : (($importance === 'Must have') ? 35 : 50);

        return [
            'score' => $score,
            'weight' => $weight,
            'match' => false,
            'reason' => null,
            'friction' => ($importance === 'Dealbreaker' || $importance === 'Must have')
                ? "Marital status doesn't match your preference"
                : null,
        ];
    }

    // ─── Family Values ────────────────────────────────────────────────

    private function calculateFamilyScore($viewer, $target, ?PartnerExpectation $viewerExp): array
    {
        $weight = 'Medium'; // No _importance column for family yet
        $expectedFamilyValue = $viewerExp?->family_value_id;

        if (!$expectedFamilyValue) {
            return ['score' => self::MISSING_DATA_SCORE, 'weight' => $weight, 'match' => false, 'reason' => null, 'friction' => null];
        }

        $targetFamily = DB::table('families')->where('user_id', $target->id)->first();

        if (!$targetFamily) {
            return ['score' => self::MISSING_DATA_SCORE, 'weight' => $weight, 'match' => false, 'reason' => null, 'friction' => 'Family information not available'];
        }

        $targetFamilyValue = $targetFamily->family_value_id ?? null;

        if (!$targetFamilyValue) {
            return ['score' => self::MISSING_DATA_SCORE, 'weight' => $weight, 'match' => false, 'reason' => null, 'friction' => null];
        }

        if ($expectedFamilyValue == $targetFamilyValue) {
            return [
                'score' => 95,
                'weight' => $weight,
                'match' => true,
                'reason' => "Compatible family values and traditions",
                'friction' => null,
            ];
        }

        return ['score' => 45, 'weight' => $weight, 'match' => false, 'reason' => null, 'friction' => null];
    }

    // ─── Language (NEW) ───────────────────────────────────────────────

    private function calculateLanguageScore($viewer, $target, ?PartnerExpectation $viewerExp): array
    {
        $weight = $this->formatWeight($viewerExp?->language_importance);
        $prefLangId = $viewerExp?->language_id;

        if (!$prefLangId) {
            return ['score' => self::MISSING_DATA_SCORE, 'weight' => $weight, 'match' => false, 'reason' => null, 'friction' => null];
        }

        // Target's mother tongue is stored on member.mothere_tongue (MemberLanguage id)
        $targetLangId = $target->member?->mothere_tongue;

        if (!$targetLangId) {
            return ['score' => self::MISSING_DATA_SCORE, 'weight' => $weight, 'match' => false, 'reason' => null, 'friction' => 'Language information not available'];
        }

        if ($prefLangId == $targetLangId) {
            $langName = MemberLanguage::find($targetLangId)?->name ?? 'same language';
            return [
                'score' => 100,
                'weight' => $weight,
                'match' => true,
                'reason' => "Speaks your preferred language ({$langName})",
                'friction' => null,
            ];
        }

        $importance = $viewerExp?->language_importance ?? 'Nice to have';
        $score = ($importance === 'Dealbreaker') ? 20 : (($importance === 'Must have') ? 30 : 50);

        return [
            'score' => $score,
            'weight' => $weight,
            'match' => false,
            'reason' => null,
            'friction' => ($importance === 'Dealbreaker' || $importance === 'Must have')
                ? "Different preferred languages"
                : null,
        ];
    }

    // ─── Total Score ──────────────────────────────────────────────────

    private function calculateTotalScore(array $categories): int
    {
        $weightMultipliers = ['High' => 3, 'Medium' => 2, 'Low' => 1];
        $totalWeight = 0;
        $weightedSum = 0;

        foreach ($categories as $cat) {
            $mult = $weightMultipliers[$cat['weight']] ?? 2;
            $weightedSum += $cat['score'] * $mult;
            $totalWeight += $mult;
        }

        return $totalWeight > 0 ? (int) round($weightedSum / $totalWeight) : self::NO_EXPECTATIONS_TOTAL;
    }

    // ─── Mutual Fit ───────────────────────────────────────────────────

    /**
     * How well does $person meet the expectations set by $expectations owner?
     * Returns 0–100. If no expectations exist → 50 (unknown, not a free pass).
     */
    private function calculateHowWellYouMeetTheirCriteria(User $person, ?PartnerExpectation $theirExpectations): int
    {
        if (!$theirExpectations) {
            return self::MISSING_DATA_SCORE; // Was hardcoded 85, now 50
        }

        $scores = [];

        // Age
        $age = $person->member?->birthday ? Carbon::parse($person->member->birthday)->age : null;
        $minAge = $theirExpectations->min_age;
        $maxAge = $theirExpectations->max_age;
        if ($minAge || $maxAge) {
            if ($age) {
                $min = $minAge ?? 18;
                $max = $maxAge ?? 60;
                if ($age >= $min && $age <= $max) {
                    $scores[] = 100;
                } else {
                    $diff = $age < $min ? ($min - $age) : ($age - $max);
                    $scores[] = max(20, 100 - ($diff * 12));
                }
            } else {
                $scores[] = self::MISSING_DATA_SCORE;
            }
        }

        // Height
        $minHeight = $theirExpectations->height;
        if ($minHeight) {
            $personHeight = $person->physical_attributes?->height;
            if ($personHeight) {
                $scores[] = ($personHeight >= $minHeight) ? 100 : max(20, 100 - (($minHeight - $personHeight) * 3));
            } else {
                $scores[] = self::MISSING_DATA_SCORE;
            }
        }

        // Religion
        if ($theirExpectations->religion_id) {
            $personReligionId = $person->spiritual_backgrounds?->religion_id;
            if ($personReligionId) {
                $scores[] = ($personReligionId == $theirExpectations->religion_id) ? 100 : 30;
            } else {
                $scores[] = self::MISSING_DATA_SCORE;
            }
        }

        // Location
        if ($theirExpectations->residence_country_id) {
            $personCountryId = $person->addresses?->firstWhere('type', 'present')?->country_id
                            ?? $person->addresses?->first()?->country_id;
            if ($personCountryId) {
                $scores[] = ($personCountryId == $theirExpectations->residence_country_id) ? 100 : 40;
            } else {
                $scores[] = self::MISSING_DATA_SCORE;
            }
        }

        // Marital Status
        if ($theirExpectations->marital_status_id) {
            $personStatusId = $person->member?->marital_status_id;
            if ($personStatusId) {
                $scores[] = ($personStatusId == $theirExpectations->marital_status_id) ? 100 : 35;
            } else {
                $scores[] = self::MISSING_DATA_SCORE;
            }
        }

        // Language
        if ($theirExpectations->language_id) {
            $personLangId = $person->member?->mothere_tongue;
            if ($personLangId) {
                $scores[] = ($personLangId == $theirExpectations->language_id) ? 100 : 35;
            } else {
                $scores[] = self::MISSING_DATA_SCORE;
            }
        }

        return count($scores) > 0
            ? (int) round(array_sum($scores) / count($scores))
            : self::MISSING_DATA_SCORE;
    }

    // ─── Helpers ──────────────────────────────────────────────────────

    private function generateAgentNotes($target, int $score, array $reasons, array $frictions): string
    {
        $targetName = $target->first_name ?? 'This match';

        if ($score >= 85) {
            return "Excellent compatibility! {$targetName} aligns strongly with your preferences across multiple key areas.";
        } elseif ($score >= 70) {
            return "{$targetName} shows strong potential with good alignment on core values and lifestyle preferences.";
        } elseif ($score >= 55) {
            return "Moderate compatibility with {$targetName}. Consider reviewing the detailed breakdown to understand key differences.";
        } else {
            return "Lower compatibility score with {$targetName}. Review the friction points to make an informed decision.";
        }
    }

    private function getBehavioralInsight($viewer, $target): string
    {
        $targetSpec = $target->member?->specialization
                   ?? $target->career->first()?->designation
                   ?? 'medical';
        return "Both users show interest in profiles within the {$targetSpec} specialty.";
    }

    /**
     * Convert the user-facing importance string to a display weight.
     */
    private function formatWeight(?string $importance): string
    {
        return match ($importance) {
            'Dealbreaker', 'Must have' => 'High',
            'Nice to have'             => 'Medium',
            'Not important'            => 'Low',
            default                    => 'Medium',
        };
    }
}
