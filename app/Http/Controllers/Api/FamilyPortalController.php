<?php

namespace App\Http\Controllers\Api;

use App\Events\FamilyUpdated;
use App\Http\Controllers\Controller;
use App\Models\Family;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class FamilyPortalController extends Controller
{
    /**
     * Get family portal data for the current user.
     */
    public function index()
    {
        $user = auth()->user();
        $family = Family::with(['guardians', 'photos', 'approvals.targetUser'])->firstOrCreate(
            ['user_id' => $user->id],
            ['father' => ''] // Default values if creating
        );

        return response()->json([
            'result' => true,
            'data' => $family,
        ]);
    }

    /**
     * Update family details.
     */
    public function update(Request $request)
    {
        $user = auth()->user();
        $family = Family::where('user_id', $user->id)->firstOrFail();

        $family->update($request->only([
            'father', 'mother', 'sibling',
            'father_occupation', 'mother_occupation',
            'about_parents', 'about_siblings', 'about_relatives',
            'about_description', 'location_city', 'location_country',
            'tradition_level', 'affluence_level', 'interests',
        ]));

        broadcast(new FamilyUpdated($user->id, $family));

        return response()->json(['result' => true, 'message' => 'Family details updated', 'data' => $family]);
    }

    /**
     * Add a guardian.
     */
    public function addGuardian(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'relationship' => 'required|string',
            'email' => 'nullable|email',
        ]);

        $user = auth()->user();
        $family = Family::where('user_id', $user->id)->firstOrFail();

        $guardian = $family->guardians()->create($request->all());

        $family->load(['guardians', 'photos', 'approvals.targetUser']);
        broadcast(new FamilyUpdated($user->id, $family));

        return response()->json(['result' => true, 'message' => 'Guardian added', 'data' => $guardian]);
    }

    /**
     * Update a guardian.
     */
    public function updateGuardian(Request $request, $id)
    {
        $user = auth()->user();
        $family = Family::where('user_id', $user->id)->firstOrFail();
        $guardian = $family->guardians()->findOrFail($id);

        $guardian->update($request->all());

        $family->load(['guardians', 'photos', 'approvals.targetUser']);
        broadcast(new FamilyUpdated($user->id, $family));

        return response()->json(['result' => true, 'message' => 'Guardian updated', 'data' => $guardian]);
    }

    /**
     * Delete a guardian.
     */
    public function deleteGuardian($id)
    {
        $user = auth()->user();
        $family = Family::where('user_id', $user->id)->firstOrFail();
        $guardian = $family->guardians()->findOrFail($id);

        $guardian->delete();

        $family->load(['guardians', 'photos', 'approvals.targetUser']);
        broadcast(new FamilyUpdated($user->id, $family));

        return response()->json(['result' => true, 'message' => 'Guardian removed']);
    }

    /**
     * Upload a family photo.
     */
    public function uploadPhoto(Request $request)
    {
        $request->validate([
            'photo' => 'required|image|max:10240', // 10MB max
        ]);

        $user = auth()->user();
        $family = Family::where('user_id', $user->id)->firstOrFail();

        if ($request->hasFile('photo')) {
            $path = $request->file('photo')->store('uploads/family_photos', 'public');

            $photo = $family->photos()->create([
                'photo_path' => $path,
                'caption' => $request->caption,
                'sort_order' => $family->photos()->count(),
            ]);

            $family->load(['guardians', 'photos', 'approvals.targetUser']);
            broadcast(new FamilyUpdated($user->id, $family));

            return response()->json(['result' => true, 'message' => 'Photo uploaded', 'data' => $photo]);
        }

        return response()->json(['result' => false, 'message' => 'No photo uploaded']);
    }

    /**
     * Delete a family photo.
     */
    public function deletePhoto($id)
    {
        $user = auth()->user();
        $family = Family::where('user_id', $user->id)->firstOrFail();
        $photo = $family->photos()->findOrFail($id);

        // Optional: Delete file from storage
        // Storage::disk('public')->delete($photo->photo_path);

        $photo->delete();

        $family->load(['guardians', 'photos', 'approvals.targetUser']);
        broadcast(new FamilyUpdated($user->id, $family));

        return response()->json(['result' => true, 'message' => 'Photo removed']);
    }
}
