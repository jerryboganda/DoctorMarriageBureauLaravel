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
use App\Utility\MemberUtility;
use Illuminate\Http\Request;
use Carbon\Carbon;
use DB;

class MatchIntelligenceController extends Controller
{
    public function show(Request $request, $id)
    {
        $viewer = auth()->user();
        $target = User::with(['member', 'physical_attributes', 'spiritual_backgrounds', 'career', 'education'])->findOrFail($id);
        
        // Get both users' profiles
        $viewerMember = $viewer->member;
        $targetMember = $target->member;
        
        // Get partner expectations
        $viewerExpectations = PartnerExpectation::where('user_id', $viewer->id)->first();
        $targetExpectations = PartnerExpectation::where('user_id', $target->id)->first();
        
        // Calculate individual category scores
        $categories = [];
        $topReasons = [];
        $frictionPoints = [];
        
        // 1. Age Compatibility
        $ageScore = $this->calculateAgeScore($viewer, $target, $viewerExpectations, $targetExpectations);
        $categories[] = ['name' => 'Age Compatibility', 'score' => $ageScore['score'], 'weight' => $ageScore['weight']];
        if ($ageScore['match']) $topReasons[] = $ageScore['reason'];
        if ($ageScore['friction']) $frictionPoints[] = $ageScore['friction'];
        
        // 2. Medical Career Compatibility
        $careerScore = $this->calculateCareerScore($viewer, $target);
        $categories[] = ['name' => 'Medical Career', 'score' => $careerScore['score'], 'weight' => 'High'];
        if ($careerScore['match']) $topReasons[] = $careerScore['reason'];
        if ($careerScore['friction']) $frictionPoints[] = $careerScore['friction'];
        
        // 3. Religion/Spiritual Compatibility
        $religionScore = $this->calculateReligionScore($viewer, $target, $viewerExpectations, $targetExpectations);
        $categories[] = ['name' => 'Religious Values', 'score' => $religionScore['score'], 'weight' => $religionScore['weight']];
        if ($religionScore['match']) $topReasons[] = $religionScore['reason'];
        if ($religionScore['friction']) $frictionPoints[] = $religionScore['friction'];
        
        // 4. Location Compatibility
        $locationScore = $this->calculateLocationScore($viewer, $target, $viewerExpectations, $targetExpectations);
        $categories[] = ['name' => 'Location Match', 'score' => $locationScore['score'], 'weight' => $locationScore['weight']];
        if ($locationScore['match']) $topReasons[] = $locationScore['reason'];
        if ($locationScore['friction']) $frictionPoints[] = $locationScore['friction'];
        
        // 5. Education Compatibility
        $educationScore = $this->calculateEducationScore($viewer, $target);
        $categories[] = ['name' => 'Educational Background', 'score' => $educationScore['score'], 'weight' => 'Medium'];
        if ($educationScore['match']) $topReasons[] = $educationScore['reason'];
        
        // 6. Height Compatibility
        $heightScore = $this->calculateHeightScore($viewer, $target, $viewerExpectations, $targetExpectations);
        $categories[] = ['name' => 'Physical Preferences', 'score' => $heightScore['score'], 'weight' => $heightScore['weight']];
        if ($heightScore['friction']) $frictionPoints[] = $heightScore['friction'];
        
        // 7. Marital Status Compatibility
        $maritalScore = $this->calculateMaritalStatusScore($viewer, $target, $viewerExpectations, $targetExpectations);
        $categories[] = ['name' => 'Marital Status', 'score' => $maritalScore['score'], 'weight' => $maritalScore['weight']];
        if ($maritalScore['match']) $topReasons[] = $maritalScore['reason'];
        if ($maritalScore['friction']) $frictionPoints[] = $maritalScore['friction'];
        
        // 8. Family Values
        $familyScore = $this->calculateFamilyScore($viewer, $target, $viewerExpectations, $targetExpectations);
        $categories[] = ['name' => 'Family Values', 'score' => $familyScore['score'], 'weight' => 'High'];
        if ($familyScore['match']) $topReasons[] = $familyScore['reason'];
        
        // Calculate overall score (weighted average)
        $totalScore = $this->calculateTotalScore($categories);
        
        // Calculate mutual fit
        $youMeetThem = $this->calculateHowWellYouMeetTheirCriteria($viewer, $target, $targetExpectations);
        $theyMeetYou = $this->calculateHowWellYouMeetTheirCriteria($target, $viewer, $viewerExpectations);
        
        // Generate agent notes based on profiles
        $agentNotes = $this->generateAgentNotes($viewer, $target, $totalScore, $topReasons, $frictionPoints);
        
        // Limit to top 5 reasons and friction points
        $topReasons = array_slice(array_filter($topReasons), 0, 5);
        $frictionPoints = array_slice(array_filter($frictionPoints), 0, 3);
        
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
    
    private function calculateAgeScore($viewer, $target, $viewerExp, $targetExp)
    {
        $viewerAge = $viewer->member?->birthday ? Carbon::parse($viewer->member->birthday)->age : null;
        $targetAge = $target->member?->birthday ? Carbon::parse($target->member->birthday)->age : null;
        
        if (!$viewerAge || !$targetAge) {
            return ['score' => 70, 'weight' => 'Medium', 'match' => false, 'reason' => null, 'friction' => null];
        }
        
        $score = 100;
        $match = false;
        $friction = null;
        $weight = $viewerExp?->age_importance ?? 'Dealbreaker';
        
        // Check if target meets viewer's age preference
        $minAge = $viewerExp?->min_age ?? 18;
        $maxAge = $viewerExp?->max_age ?? 60;
        
        if ($targetAge >= $minAge && $targetAge <= $maxAge) {
            $match = true;
            $reason = "Age is within your preferred range ({$minAge}-{$maxAge} years)";
        } else {
            $diff = $targetAge < $minAge ? $minAge - $targetAge : $targetAge - $maxAge;
            $score = max(50, 100 - ($diff * 10));
            $reason = null;
            $friction = "Age ({$targetAge}) is " . ($targetAge < $minAge ? 'below' : 'above') . " your preference";
        }
        
        return ['score' => $score, 'weight' => $this->formatWeight($weight), 'match' => $match, 'reason' => $reason ?? null, 'friction' => $friction];
    }
    
    private function calculateCareerScore($viewer, $target)
    {
        $viewerCareer = $viewer->career()->latest()->first();
        $targetCareer = $target->career()->latest()->first();
        
        $score = 75; // Base score
        $match = false;
        $reason = null;
        $friction = null;
        
        if ($viewerCareer && $targetCareer) {
            // Both have careers - good match
            $score = 85;
            
            // Check if same field/specialty
            $viewerSpec = strtolower($viewerCareer->designation ?? '');
            $targetSpec = strtolower($targetCareer->designation ?? '');
            
            $medicalTerms = ['doctor', 'surgeon', 'physician', 'dentist', 'medical', 'hospital', 'clinic', 'healthcare'];
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
            }
        } elseif (!$targetCareer) {
            $score = 60;
            $friction = "Limited career information available";
        }
        
        return ['score' => $score, 'match' => $match, 'reason' => $reason, 'friction' => $friction];
    }
    
    private function calculateReligionScore($viewer, $target, $viewerExp, $targetExp)
    {
        $viewerReligion = MemberUtility::member_religion($viewer->id);
        $targetReligion = MemberUtility::member_religion($target->id);
        
        $weight = $viewerExp?->religion_importance ?? 'Must have';
        $score = 70;
        $match = false;
        $reason = null;
        $friction = null;
        
        if (!$viewerReligion || !$targetReligion || $viewerReligion == 'N/A' || $targetReligion == 'N/A') {
            return ['score' => 75, 'weight' => $this->formatWeight($weight), 'match' => false, 'reason' => null, 'friction' => null];
        }
        
        if (strtolower($viewerReligion) === strtolower($targetReligion)) {
            $score = 100;
            $match = true;
            $reason = "Shared religious background ({$targetReligion})";
        } else {
            $score = $weight === 'Dealbreaker' ? 30 : 60;
            if ($weight === 'Dealbreaker' || $weight === 'Must have') {
                $friction = "Different religious backgrounds";
            }
        }
        
        return ['score' => $score, 'weight' => $this->formatWeight($weight), 'match' => $match, 'reason' => $reason, 'friction' => $friction];
    }
    
    private function calculateLocationScore($viewer, $target, $viewerExp, $targetExp)
    {
        $viewerCountry = MemberUtility::member_country($viewer->id);
        $targetCountry = MemberUtility::member_country($target->id);
        
        $weight = $viewerExp?->residence_importance ?? 'Nice to have';
        $score = 75;
        $match = false;
        $reason = null;
        $friction = null;
        
        if ($viewerCountry && $targetCountry && strtolower($viewerCountry) === strtolower($targetCountry)) {
            $score = 100;
            $match = true;
            $reason = "Both located in {$targetCountry}";
        } elseif (!$viewerCountry || !$targetCountry) {
            $score = 70;
        } else {
            $score = 60;
            if ($weight === 'Dealbreaker' || $weight === 'Must have') {
                $friction = "Located in different countries";
            }
        }
        
        return ['score' => $score, 'weight' => $this->formatWeight($weight), 'match' => $match, 'reason' => $reason, 'friction' => $friction];
    }
    
    private function calculateEducationScore($viewer, $target)
    {
        $viewerEdu = $viewer->education()->latest()->first();
        $targetEdu = $target->education()->latest()->first();
        
        $score = 75;
        $match = false;
        $reason = null;
        
        if ($viewerEdu && $targetEdu) {
            $score = 85;
            
            // Check for similar education level/institution type
            $viewerDegree = strtolower($viewerEdu->degree ?? '');
            $targetDegree = strtolower($targetEdu->degree ?? '');
            
            $medicalDegrees = ['mbbs', 'md', 'ms', 'bds', 'mds', 'phd', 'fcps', 'mrcp', 'frcs'];
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
            }
        }
        
        return ['score' => $score, 'match' => $match, 'reason' => $reason];
    }
    
    private function calculateHeightScore($viewer, $target, $viewerExp, $targetExp)
    {
        $targetPhysical = PhysicalAttribute::where('user_id', $target->id)->first();
        $targetHeight = $targetPhysical?->height;
        $minHeight = $viewerExp?->height;
        
        $weight = $viewerExp?->height_importance ?? 'Nice to have';
        $score = 80;
        $friction = null;
        
        if ($targetHeight && $minHeight) {
            if ($targetHeight >= $minHeight) {
                $score = 100;
            } else {
                $diff = $minHeight - $targetHeight;
                $score = max(50, 100 - ($diff * 2));
                if ($diff > 10) {
                    $friction = "Height is below your preference";
                }
            }
        }
        
        return ['score' => $score, 'weight' => $this->formatWeight($weight), 'friction' => $friction];
    }
    
    private function calculateMaritalStatusScore($viewer, $target, $viewerExp, $targetExp)
    {
        $targetMarital = $target->member?->marital_status?->name ?? 'Unknown';
        $expectedMaritalId = $viewerExp?->marital_status_id;
        
        $weight = $viewerExp?->marital_status_importance ?? 'Dealbreaker';
        $score = 80;
        $match = false;
        $reason = null;
        $friction = null;
        
        if ($expectedMaritalId) {
            $expectedMarital = MaritalStatus::find($expectedMaritalId)?->name;
            if ($expectedMarital && strtolower($targetMarital) === strtolower($expectedMarital)) {
                $score = 100;
                $match = true;
                $reason = "Marital status matches your preference";
            } else {
                $score = $weight === 'Dealbreaker' ? 40 : 65;
                if ($weight === 'Dealbreaker') {
                    $friction = "Marital status doesn't match preference";
                }
            }
        } elseif (strtolower($targetMarital) === 'single' || strtolower($targetMarital) === 'never married') {
            $score = 100;
            $match = true;
            $reason = "Never married";
        }
        
        return ['score' => $score, 'weight' => $this->formatWeight($weight), 'match' => $match, 'reason' => $reason, 'friction' => $friction];
    }
    
    private function calculateFamilyScore($viewer, $target, $viewerExp, $targetExp)
    {
        $viewerFamily = DB::table('families')->where('user_id', $viewer->id)->first();
        $targetFamily = DB::table('families')->where('user_id', $target->id)->first();
        
        $score = 75;
        $match = false;
        $reason = null;
        
        if ($viewerFamily && $targetFamily) {
            $score = 85;
            
            // Check family value compatibility
            $expectedFamilyValue = $viewerExp?->family_value_id;
            $targetFamilyValue = $targetFamily->family_value_id ?? null;
            
            if ($expectedFamilyValue && $targetFamilyValue && $expectedFamilyValue == $targetFamilyValue) {
                $score = 95;
                $match = true;
                $reason = "Compatible family values and traditions";
            }
        }
        
        return ['score' => $score, 'match' => $match, 'reason' => $reason];
    }
    
    private function calculateTotalScore($categories)
    {
        $weightMultipliers = ['High' => 3, 'Medium' => 2, 'Low' => 1];
        $totalWeight = 0;
        $weightedSum = 0;
        
        foreach ($categories as $cat) {
            $mult = $weightMultipliers[$cat['weight']] ?? 2;
            $weightedSum += $cat['score'] * $mult;
            $totalWeight += $mult;
        }
        
        return $totalWeight > 0 ? round($weightedSum / $totalWeight) : 75;
    }
    
    private function calculateHowWellYouMeetTheirCriteria($you, $them, $theirExpectations)
    {
        if (!$theirExpectations) return 85;
        
        $scores = [];
        
        // Age check
        $yourAge = $you->member?->birthday ? Carbon::parse($you->member->birthday)->age : null;
        $minAge = $theirExpectations->min_age ?? 18;
        $maxAge = $theirExpectations->max_age ?? 60;
        
        if ($yourAge) {
            $scores[] = ($yourAge >= $minAge && $yourAge <= $maxAge) ? 100 : 60;
        }
        
        // Height check
        $yourPhysical = PhysicalAttribute::where('user_id', $you->id)->first();
        $minHeight = $theirExpectations->height;
        if ($yourPhysical?->height && $minHeight) {
            $scores[] = ($yourPhysical->height >= $minHeight) ? 100 : 70;
        }
        
        // Religion check
        $yourReligion = MemberUtility::member_religion($you->id);
        $theirReligionPref = $theirExpectations->religion_id ? Religion::find($theirExpectations->religion_id)?->name : null;
        if ($yourReligion && $theirReligionPref) {
            $scores[] = (strtolower($yourReligion) === strtolower($theirReligionPref)) ? 100 : 50;
        }
        
        // Location check
        $yourCountry = MemberUtility::member_country($you->id);
        $theirCountryPref = $theirExpectations->residence_country_id ? Country::find($theirExpectations->residence_country_id)?->name : null;
        if ($yourCountry && $theirCountryPref) {
            $scores[] = (strtolower($yourCountry) === strtolower($theirCountryPref)) ? 100 : 65;
        }
        
        return count($scores) > 0 ? round(array_sum($scores) / count($scores)) : 80;
    }
    
    private function generateAgentNotes($viewer, $target, $score, $reasons, $frictions)
    {
        $targetName = $target->first_name ?? 'This match';
        
        if ($score >= 90) {
            return "Excellent compatibility! {$targetName} aligns strongly with your preferences across multiple key areas.";
        } elseif ($score >= 80) {
            return "{$targetName} shows strong potential with good alignment on core values and lifestyle preferences.";
        } elseif ($score >= 70) {
            return "Moderate compatibility with {$targetName}. Consider reviewing the detailed breakdown to understand key differences.";
        } else {
            return "Lower compatibility score. Review the friction points to make an informed decision.";
        }
    }
    
    private function getBehavioralInsight($viewer, $target)
    {
        $targetSpec = $target->member?->specialization ?? $target->career()->latest()->first()?->designation ?? 'medical';
        return "Both users show interest in profiles within the {$targetSpec} specialty.";
    }
    
    private function formatWeight($importance)
    {
        $map = [
            'Dealbreaker' => 'High',
            'Must have' => 'High',
            'Nice to have' => 'Medium',
            'Not important' => 'Low',
        ];
        return $map[$importance] ?? 'Medium';
    }
}
