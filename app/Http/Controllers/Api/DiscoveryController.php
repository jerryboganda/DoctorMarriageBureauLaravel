<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ActiveUserResource;
use App\Models\Member;
use App\Models\User;
use Illuminate\Http\Request;
use Carbon\Carbon;

class DiscoveryController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();

        if (!$user->member) {
            return response()->json([
                'result' => false,
                'error_code' => 'profile_incomplete',
                'message' => translate('Please complete your profile setup before browsing profiles.'),
            ], 400);
        }

        $opposite_gender = ($user->member->gender == 1) ? 2 : 1;

        // Base query for members of opposite gender
        $base_query = User::with([
                'member',
                'career',
                'education',
                'physical_attributes',
                'spiritual_backgrounds.religion',
                'spiritual_backgrounds.caste',
                'addresses.country',
                'partner_expectations',
            ])
            ->where('user_type', 'member')
            ->where('id', '!=', $user->id)
            ->where('blocked', 0)
            ->where('deactivated', 0)
            ->where('approved', 1)
            ->whereHas('member', function($q) use ($opposite_gender) {
                $q->where('gender', $opposite_gender)
                  ->where('is_visible', 1);
            });

        // Matchmaker Picks (featured section, limit 10)
        $agent_picks = (clone $base_query)
            ->whereHas('member', function($q) {
                $q->where('is_agent_pick', 1);
            })
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        // High Intent (featured section, limit 10)
        $high_intent = (clone $base_query)
            ->whereHas('member', function($q) {
                $q->where('is_high_intent', 1);
            })
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        // All Profiles - paginated, 20 per page, consistent ordering
        $all_profiles = (clone $base_query)
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'result' => true,
            'data' => [
                'agent_picks' => ActiveUserResource::collection($agent_picks),
                'high_intent' => ActiveUserResource::collection($high_intent),
                'all_profiles' => ActiveUserResource::collection($all_profiles->items()),
                'cache_version' => now()->toIso8601String(),
            ],
            'pagination' => [
                'current_page' => $all_profiles->currentPage(),
                'last_page' => $all_profiles->lastPage(),
                'per_page' => $all_profiles->perPage(),
                'total' => $all_profiles->total(),
                'from' => $all_profiles->firstItem(),
                'to' => $all_profiles->lastItem(),
            ]
        ]);
    }

    public function search(Request $request)
    {
        $user = auth()->user();

        if (!$user->member) {
            return response()->json([
                'result' => false,
                'error_code' => 'profile_incomplete',
                'message' => translate('Please complete your profile setup before searching profiles.'),
            ], 400);
        }

        $opposite_gender = ($user->member->gender == 1) ? 2 : 1;
        $q = $request->query('q');
        
        // Filter parameters
        $age_min = $request->query('age_min');
        $age_max = $request->query('age_max');
        $religion = $request->query('religion');
        $profession = $request->query('profession');

        $query = User::with([
                'member',
                'career',
                'education',
                'physical_attributes',
                'spiritual_backgrounds.religion',
                'spiritual_backgrounds.caste',
                'addresses.country',
                'partner_expectations',
            ])
            ->where('user_type', 'member')
            ->where('id', '!=', $user->id)
            ->where('blocked', 0)
            ->where('deactivated', 0)
            ->where('approved', 1)
            ->whereHas('member', function($q) use ($opposite_gender, $age_min, $age_max) {
                $q->where('gender', $opposite_gender)
                  ->where('is_visible', 1);
                
                if ($age_min) {
                    $q->where('birthday', '<=', now()->subYears($age_min)->format('Y-m-d'));
                }
                if ($age_max) {
                    $q->where('birthday', '>=', now()->subYears($age_max + 1)->format('Y-m-d'));
                }
            });

        if ($q) {
            $query->where(function($sub) use ($q) {
                $sub->where('first_name', 'LIKE', "%$q%")
                    ->orWhere('last_name', 'LIKE', "%$q%")
                    ->orWhere('code', 'LIKE', "%$q%")
                    ->orWhere('email', 'LIKE', "%$q%");
            });
        }

        // Additional Filters (Religion/Profession)
        if ($religion) {
            $query->whereHas('spiritual_backgrounds.religion', function($sub) use ($religion) {
                $sub->where('name', 'LIKE', "%$religion%");
            });
        }

        if ($profession) {
            $query->whereHas('career', function($sub) use ($profession) {
                $sub->where('designation', 'LIKE', "%$profession%");
            });
        }

        $results = $query->paginate(20);

        return ActiveUserResource::collection($results)->additional([
            'result' => true
        ]);
    }
}
