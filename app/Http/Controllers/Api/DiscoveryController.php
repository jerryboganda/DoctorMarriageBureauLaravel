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
        $opposite_gender = ($user->member->gender == 1) ? 2 : 1;

        // Base query for members of opposite gender
        $base_query = User::where('user_type', 'member')
            ->where('id', '!=', $user->id)
            ->where('blocked', 0)
            ->where('deactivated', 0)
            ->where('approved', 1)
            ->whereHas('member', function($q) use ($opposite_gender) {
                $q->where('gender', $opposite_gender)
                  ->where('is_visible', 1);
            });

        // Matchmaker Picks
        $agent_picks = (clone $base_query)
            ->whereHas('member', function($q) {
                $q->where('is_agent_pick', 1);
            })
            ->limit(10)
            ->get();

        // High Intent
        $high_intent = (clone $base_query)
            ->whereHas('member', function($q) {
                $q->where('is_high_intent', 1);
            })
            ->limit(10)
            ->get();

        // Recently Active
        $recently_active = (clone $base_query)
            ->orderBy('last_login_at', 'desc')
            ->limit(10)
            ->get();

        return response()->json([
            'result' => true,
            'data' => [
                'agent_picks' => ActiveUserResource::collection($agent_picks),
                'high_intent' => ActiveUserResource::collection($high_intent),
                'recently_active' => ActiveUserResource::collection($recently_active),
            ]
        ]);
    }

    public function search(Request $request)
    {
        $user = auth()->user();
        $opposite_gender = ($user->member->gender == 1) ? 2 : 1;
        $q = $request->query('q');
        
        // Filter parameters
        $age_min = $request->query('age_min');
        $age_max = $request->query('age_max');
        $religion = $request->query('religion');
        $profession = $request->query('profession');

        $query = User::where('user_type', 'member')
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
