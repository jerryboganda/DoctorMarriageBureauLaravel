<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FieldVisibilitySetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class DiscoverySettingsController extends Controller
{
    /**
     * Toggle anonymous/visible mode.
     * When anonymous: member is hidden from other users' discovery feeds.
     */
    public function toggleAnonymous(Request $request)
    {
        $user = $request->user();
        $currentIncognito = FieldVisibilitySetting::where('user_id', $user->id)
            ->where('field_name', 'incognito')
            ->value('is_visible');
        $newIncognito = !filter_var($currentIncognito, FILTER_VALIDATE_BOOLEAN);

        FieldVisibilitySetting::setVisibility($user->id, 'incognito', $newIncognito);
        \App\Utility\MemberUtility::resetCaches();

        $snapshot = \App\Utility\MemberUtility::member_visibility_snapshot($user->id);

        return response()->json([
            'success' => true,
            'data' => array_merge($snapshot, [
                'incognito' => (bool) $newIncognito,
            ]),
            'message' => $newIncognito ? 'You are now browsing anonymously.' : 'Anonymous browsing is now off.',
        ]);
    }

    /**
     * Get current anonymous/visible status.
     */
    public function getAnonymousStatus(Request $request)
    {
        $user = $request->user();
        $incognito = FieldVisibilitySetting::where('user_id', $user->id)
            ->where('field_name', 'incognito')
            ->value('is_visible');
        $snapshot = \App\Utility\MemberUtility::member_visibility_snapshot($user->id);

        return response()->json([
            'success' => true,
            'data' => array_merge($snapshot, [
                'incognito' => (bool) filter_var($incognito, FILTER_VALIDATE_BOOLEAN),
            ]),
        ]);
    }

    /**
     * Enable travel mode with a destination city/country.
     */
    public function enableTravelMode(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'city' => 'required|string|max:100',
            'country' => 'required|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Please provide a valid city and country.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $member = $request->user()->member;

        if (!$member) {
            return response()->json(['success' => false, 'message' => 'Member profile not found.'], 404);
        }

        $member->update([
            'travel_mode' => 1,
            'travel_city' => $request->city,
            'travel_country' => $request->country,
        ]);

        return response()->json([
            'success' => true,
            'travel_mode' => true,
            'travel_city' => $request->city,
            'travel_country' => $request->country,
            'message' => "Travel mode enabled. Your profile now shows you're visiting {$request->city}, {$request->country}.",
        ]);
    }

    /**
     * Disable travel mode.
     */
    public function disableTravelMode(Request $request)
    {
        $member = $request->user()->member;

        if (!$member) {
            return response()->json(['success' => false, 'message' => 'Member profile not found.'], 404);
        }

        $member->update([
            'travel_mode' => 0,
            'travel_city' => null,
            'travel_country' => null,
        ]);

        return response()->json([
            'success' => true,
            'travel_mode' => false,
            'travel_city' => null,
            'travel_country' => null,
            'message' => 'Travel mode disabled. Your profile shows your home location.',
        ]);
    }

    /**
     * Get current travel mode status.
     */
    public function getTravelModeStatus(Request $request)
    {
        $member = $request->user()->member;

        return response()->json([
            'success' => true,
            'travel_mode' => (bool) ($member->travel_mode ?? false),
            'travel_city' => $member->travel_city,
            'travel_country' => $member->travel_country,
        ]);
    }
}
