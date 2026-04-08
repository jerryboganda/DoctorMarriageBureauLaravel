<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ActiveUserResource;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class DiscoveryController extends Controller
{
    private function isTruthyQueryFlag(Request $request, string $key): bool
    {
        $value = strtolower(trim((string) $request->query($key, '')));
        return in_array($value, ['yes', 'true', '1', 'on'], true);
    }

    private function buildBaseQuery(Request $request): Builder
    {
        $user = auth()->user();
        $memberGender = $user?->member?->gender;
        $opposite_gender = ($memberGender == 1) ? 2 : 1;

        $query = User::with([
                'member',
                'career',
                'education',
                'physical_attributes',
                'spiritual_backgrounds.religion',
                'spiritual_backgrounds.sect',
                'spiritual_backgrounds.caste',
                'addresses.country',
            ])
            ->where('user_type', 'member')
            ->where('id', '!=', $user?->id)
            ->where('blocked', 0)
            ->where('deactivated', 0)
            ->where('approved', 1)
            ->whereHas('member', function($q) use ($opposite_gender) {
                $q->where('gender', $opposite_gender)
                  ->where('is_visible', 1);
            });

        if ($this->isTruthyQueryFlag($request, 'verified')) {
            $query->where('verification_info', '!=', '')
                  ->whereNotNull('verification_info');
        } elseif (in_array(strtolower(trim((string) $request->query('verified', ''))), ['no', 'false', '0', 'off'], true)) {
            $query->where(function($q) {
                $q->whereNull('verification_info')
                  ->orWhere('verification_info', '');
            });
        }

        if ($this->isTruthyQueryFlag($request, 'bookmarked')) {
            $query->whereHas('shortlist', function ($shortlistQuery) use ($user) {
                $shortlistQuery->where('shortlisted_by', $user->id);
            });
        }

        return $query;
    }

    public function index(Request $request)
    {
        $base_query = $this->buildBaseQuery($request);

        $agent_picks = collect();
        $high_intent = collect();

        if (!$request->has('verified') && !$this->isTruthyQueryFlag($request, 'bookmarked')) {
            $agent_picks = (clone $base_query)
                ->whereHas('member', function($q) {
                    $q->where('is_agent_pick', 1);
                })
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get();

            $high_intent = (clone $base_query)
                ->whereHas('member', function($q) {
                    $q->where('is_high_intent', 1);
                })
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get();
        }

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
            ],
        ]);
    }

    public function search(Request $request)
    {
        $query = $this->buildBaseQuery($request);

        $q = trim((string) $request->query('q', ''));
        $age_min = $request->query('age_min');
        $age_max = $request->query('age_max');
        $religion = trim((string) $request->query('religion', ''));
        $sect = trim((string) $request->query('sect', ''));
        $caste = trim((string) $request->query('caste', ''));
        $country = trim((string) $request->query('country', ''));
        $job_title_id = trim((string) $request->query('job_title_id', ''));
        $profession = trim((string) $request->query('profession', ''));

        if ($age_min !== null && $age_min !== '') {
            $query->whereHas('member', function($memberQuery) use ($age_min) {
                $memberQuery->where('birthday', '<=', now()->subYears((int) $age_min)->format('Y-m-d'));
            });
        }

        if ($age_max !== null && $age_max !== '') {
            $query->whereHas('member', function($memberQuery) use ($age_max) {
                $memberQuery->where('birthday', '>=', now()->subYears(((int) $age_max) + 1)->format('Y-m-d'));
            });
        }

        if ($q !== '') {
            $query->where(function($sub) use ($q) {
                $sub->where('first_name', 'LIKE', "%{$q}%")
                    ->orWhere('last_name', 'LIKE', "%{$q}%")
                    ->orWhere('code', 'LIKE', "%{$q}%")
                    ->orWhere('email', 'LIKE', "%{$q}%");
            });
        }

        if ($religion !== '') {
            if (is_numeric($religion)) {
                $query->whereHas('spiritual_backgrounds', function($sub) use ($religion) {
                    $sub->where('religion_id', (int) $religion);
                });
            } else {
                $query->whereHas('spiritual_backgrounds.religion', function($sub) use ($religion) {
                    $sub->where('name', 'LIKE', "%{$religion}%");
                });
            }
        }

        if ($sect !== '') {
            if (is_numeric($sect)) {
                $query->whereHas('spiritual_backgrounds', function($sub) use ($sect) {
                    $sub->where('sect_id', (int) $sect);
                });
            } else {
                $query->whereHas('spiritual_backgrounds.sect', function($sub) use ($sect) {
                    $sub->where('name', 'LIKE', "%{$sect}%");
                });
            }
        }

        if ($caste !== '') {
            if (is_numeric($caste)) {
                $query->whereHas('spiritual_backgrounds', function($sub) use ($caste) {
                    $sub->where('caste_id', (int) $caste);
                });
            } else {
                $query->whereHas('spiritual_backgrounds.caste', function($sub) use ($caste) {
                    $sub->where('name', 'LIKE', "%{$caste}%");
                });
            }
        }

        if ($country !== '') {
            if (is_numeric($country)) {
                $query->whereHas('addresses', function($sub) use ($country) {
                    $sub->where('country_id', (int) $country);
                });
            } else {
                $query->whereHas('addresses.country', function($sub) use ($country) {
                    $sub->where('name', 'LIKE', "%{$country}%")
                        ->orWhere('code', 'LIKE', "%{$country}%");
                });
            }
        }

        if ($profession !== '') {
            $query->whereHas('career', function($sub) use ($profession) {
                $sub->where('designation', 'LIKE', "%{$profession}%");
            });
        }

        if ($job_title_id !== '') {
            if (is_numeric($job_title_id)) {
                $query->whereHas('career', function($sub) use ($job_title_id) {
                    $sub->where('job_title_id', (int) $job_title_id);
                });
            } else {
                $query->whereHas('career.jobTitle', function($sub) use ($job_title_id) {
                    $sub->where('name', 'LIKE', "%{$job_title_id}%");
                });
            }
        }

        $results = $query->paginate(20);

        $items = collect($results->items())->map(function ($item) use ($request) {
            return (new ActiveUserResource($item))->resolve($request);
        })->values();

        return response()->json([
            'result' => true,
            'data' => $items,
            'pagination' => [
                'current_page' => $results->currentPage(),
                'last_page' => $results->lastPage(),
                'per_page' => $results->perPage(),
                'total' => $results->total(),
                'from' => $results->firstItem(),
                'to' => $results->lastItem(),
            ],
        ]);
    }
}
