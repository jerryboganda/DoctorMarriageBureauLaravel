<?php

namespace App\Http\Controllers\Api;

use App\Models\Community;
use App\Models\CommunityMembership;
use Illuminate\Http\Request;

class CommunityController extends Controller
{
    public function index(Request $request)
    {
        $userId = auth()->user()->id;
        $filter = $request->get('filter', 'all');
        $search = trim((string) $request->get('search', ''));

        $query = Community::where('is_active', 1);
        if ($search !== '') {
            $query->where('name', 'like', '%'.$search.'%');
        }

        $communities = $query
            ->withCount(['memberships as member_count' => function ($q) {
                $q->where('status', 'joined');
            }])
            ->with(['memberships' => function ($q) use ($userId) {
                $q->where('user_id', $userId);
            }])
            ->orderBy('name')
            ->get()
            ->map(function ($community) {
                $membership = $community->memberships->first();
                $status = $membership ? $membership->status : 'none';

                return [
                    'id' => $community->id,
                    'name' => $community->name,
                    'type' => $community->type,
                    'description' => $community->description,
                    'is_private' => $community->is_private,
                    'member_count' => $community->member_count ?? 0,
                    'status' => $status,
                ];
            })
            ->filter(function ($community) use ($filter) {
                if ($filter === 'joined') {
                    return $community['status'] === 'joined';
                }
                if ($filter === 'pending') {
                    return $community['status'] === 'pending';
                }

                return true;
            })
            ->values();

        return $this->response_data($communities);
    }

    public function join(Request $request, int $communityId)
    {
        $user = auth()->user();
        $community = Community::where('id', $communityId)
            ->where('is_active', 1)
            ->first();

        if (! $community) {
            return $this->failure_message('Community not found.');
        }

        $membership = CommunityMembership::firstOrNew([
            'community_id' => $community->id,
            'user_id' => $user->id,
        ]);

        if ($membership->exists && $membership->status === 'joined') {
            return $this->success_message('Already joined.');
        }

        $membership->status = $community->is_private ? 'pending' : 'joined';
        $membership->role = $membership->role ?? 'member';
        $membership->requested_at = now();
        $membership->approved_at = $community->is_private ? null : now();
        $membership->save();

        return response()->json([
            'result' => true,
            'status' => $membership->status,
            'message' => $community->is_private ? 'Join request sent.' : 'Community joined.',
        ]);
    }

    public function leave(Request $request, int $communityId)
    {
        $user = auth()->user();

        $membership = CommunityMembership::where('community_id', $communityId)
            ->where('user_id', $user->id)
            ->first();

        if (! $membership) {
            return $this->failure_message('Membership not found.');
        }

        $membership->delete();

        return $this->success_message('Left community.');
    }

    public function store(Request $request)
    {
        $user = auth()->user();

        // Check if user is verified or premium
        $member = $user->member;
        $isVerified = $user->approved ?? false;
        $isPremium = $member && $member->membership == 2;

        if (! $isVerified && ! $isPremium) {
            return $this->failure_message('Only verified or premium members can create communities.');
        }

        $request->validate([
            'name' => 'required|string|max:100|unique:communities,name',
            'type' => 'required|string|in:region,alumni,culture,specialty,organization',
            'description' => 'nullable|string|max:500',
            'is_private' => 'boolean',
        ]);

        $community = Community::create([
            'name' => $request->name,
            'type' => $request->type,
            'description' => $request->description,
            'is_private' => $request->boolean('is_private', false),
            'is_active' => false, // Requires admin approval
            'created_by' => $user->id,
        ]);

        // Add creator as admin member
        CommunityMembership::create([
            'community_id' => $community->id,
            'user_id' => $user->id,
            'status' => 'joined',
            'role' => 'admin',
            'requested_at' => now(),
            'approved_at' => now(),
        ]);

        return response()->json([
            'result' => true,
            'message' => 'Community created successfully! It will be visible after admin approval.',
            'data' => [
                'id' => $community->id,
                'name' => $community->name,
                'type' => $community->type,
                'description' => $community->description,
                'is_private' => $community->is_private,
                'member_count' => 1,
                'status' => 'joined',
                'pending_approval' => true,
            ],
        ]);
    }
}
