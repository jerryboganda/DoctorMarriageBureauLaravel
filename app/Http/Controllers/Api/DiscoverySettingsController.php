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
        $member = $user->member;

        if (!$member) {
            return response()->json(['success' => false, 'message' => 'Member profile not found.'], 404);
        }

        $newVisible = $member->is_visible ? 0 : 1;
        $member->update(['is_visible' => $newVisible]);

        // Also sync the incognito field visibility setting
        FieldVisibilitySetting::setVisibility($user->id, 'incognito', !$newVisible);

        return response()->json([
            'success' => true,
            'is_visible' => (bool) $newVisible,
            'message' => $newVisible ? 'Your profile is now visible to others.' : 'You are now browsing anonymously.',
        ]);
    }

    /**
     * Get current anonymous/visible status.
     */
    public function getAnonymousStatus(Request $request)
    {
        $member = $request->user()->member;

        return response()->json([
            'success' => true,
            'is_visible' => (bool) ($member->is_visible ?? true),
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
