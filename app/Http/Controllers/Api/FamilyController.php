<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Family;
use App\Models\FamilyApproval;
use App\Models\FamilyGuardian;
use App\Models\FamilyPhoto;
use App\Utility\EmailUtility;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;

class FamilyController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        if (! $user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $family = Family::firstOrCreate(
            ['user_id' => $user->id],
            [
                'about_description' => 'We are a respectable family with traditional values.',
                'tradition_level' => 'Modern with Traditional Roots',
                'affluence_level' => 'Upper Middle Class',
                'interests' => ['Traveling', 'Education'],
            ]
        );

        $owner = FamilyGuardian::where('family_id', $family->id)
            ->where('user_id', $user->id)
            ->first();

        if (! $owner) {
            $ownerName = trim(($user->first_name ?? '').' '.($user->last_name ?? ''));
            if ($ownerName === '') {
                $ownerName = $user->name ?? $user->email ?? 'Owner';
            }

            FamilyGuardian::create([
                'family_id' => $family->id,
                'user_id' => $user->id,
                'name' => $ownerName,
                'relationship' => 'Self',
                'phone' => $user->phone ?? null,
                'email' => $user->email ?? null,
                'is_primary_contact' => true,
            ]);
        }

        $profile = [
            'description' => $family->about_description,
            'traditionLevel' => $family->tradition_level,
            'affluenceLevel' => $family->affluence_level,
            'interests' => $family->interests ?? [],
            'photos' => $family->photos()->get()->map(function (FamilyPhoto $photo) {
                $path = $photo->photo_path;
                $url = $path;
                if ($path && strpos($path, 'http') !== 0) {
                    $url = Storage::disk('public')->url($path);
                }

                return [
                    'id' => $photo->id,
                    'url' => $url,
                ];
            }),
        ];

        $guardians = $family->guardians()->get()->map(function (FamilyGuardian $guardian) use ($user) {
            $isSelf = $guardian->user_id && (int) $guardian->user_id === (int) $user->id;

            return [
                'id' => $guardian->id,
                'name' => $guardian->name,
                'role' => $guardian->relationship,
                'email' => $guardian->email,
                'phone' => $guardian->phone,
                'status' => $guardian->user_id ? 'Verified' : 'Pending',
                'isOwner' => $isSelf,
                'isPrimaryContact' => (bool) $guardian->is_primary_contact,
                'permissions' => $isSelf ? [] : ['View', 'Comment'],
            ];
        });

        $approvals = $family->approvals()->with('targetUser.member')->get()->map(function (FamilyApproval $approval) {
            $target = $approval->targetUser;
            $member = $target?->member;
            $specialty = $member?->specialization ?? $member?->designation ?? '';
            $city = $target?->addresses()
                ->where('type', 'present')
                ->with('city')
                ->first()
                ?->city
                ?->name ?? 'Unknown City';
            $status = $approval->status ?: 'pending';
            $targetName = trim(($target?->first_name ?? '').' '.($target?->last_name ?? ''));
            if ($targetName === '') {
                $targetName = $target?->name ?? 'Unknown';
            }

            $photoUrl = null;
            if ($target?->photo) {
                $photoUrl = uploaded_asset($target->photo);
            }
            if (! $photoUrl) {
                $photoUrl = gender_avatar($member);
            }

            return [
                'id' => $approval->id,
                'name' => $targetName,
                'desc' => trim($specialty.' - '.$city),
                'status' => ucfirst($status),
                'img' => $photoUrl,
                'time' => $approval->created_at?->diffForHumans() ?? '',
                'approved' => $status === 'approved',
            ];
        });

        return response()->json([
            'profile' => $profile,
            'guardians' => $guardians,
            'approvals' => $approvals,
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = Auth::user();
        $family = Family::where('user_id', $user->id)->firstOrFail();

        $family->update([
            'about_description' => $request->description,
            'tradition_level' => $request->traditionLevel,
            'affluence_level' => $request->affluenceLevel,
            'interests' => $request->interests,
        ]);

        return response()->json(['message' => 'Family profile updated successfully']);
    }

    public function addGuardian(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'relationship' => 'required|string',
            'email' => 'nullable|email',
            'phone' => 'nullable|string',
            'is_primary_contact' => 'nullable|boolean',
        ]);

        $user = Auth::user();
        $family = Family::where('user_id', $user->id)->firstOrFail();

        $guardian = $family->guardians()->create([
            'name' => $request->name,
            'relationship' => $request->relationship,
            'email' => $request->email,
            'phone' => $request->phone,
            'is_primary_contact' => (bool) $request->is_primary_contact,
        ]);

        if ($guardian->is_primary_contact) {
            $family->guardians()
                ->where('id', '!=', $guardian->id)
                ->update(['is_primary_contact' => false]);
        }

        // Send invitation email to the guardian if they have an email
        if ($guardian->email) {
            try {
                $memberName = trim(($user->first_name ?? '').' '.($user->last_name ?? ''));
                if ($memberName === '') {
                    $memberName = $user->name ?? 'A member';
                }

                Mail::send('emails.guardian_invitation', [
                    'guardianName' => $guardian->name,
                    'memberName' => $memberName,
                    'relationship' => $guardian->relationship,
                    'portalUrl' => 'https://panel.doctormarriagebureau.com.pk',
                ], function ($message) use ($guardian, $memberName) {
                    $message->to($guardian->email, $guardian->name)
                        ->from(EmailUtility::fromAddress(), EmailUtility::fromName())
                        ->subject("Family Guardian Invitation — {$memberName} added you on Doctor Marriage Bureau");
                });

                Log::info("Guardian invitation email sent to {$guardian->email} for user {$user->id}");
            } catch (\Exception $e) {
                Log::error('Failed to send guardian invitation email: '.$e->getMessage());
                // Don't fail the request if email fails — guardian is already saved
            }
        }

        return response()->json(['message' => 'Guardian added successfully'.($guardian->email ? '. Invitation email sent!' : '')]);
    }

    public function updateGuardian(Request $request, $id)
    {
        $request->validate([
            'name' => 'sometimes|string',
            'relationship' => 'sometimes|string',
            'email' => 'nullable|email',
            'phone' => 'nullable|string',
            'is_primary_contact' => 'nullable|boolean',
        ]);

        $user = Auth::user();
        $family = Family::where('user_id', $user->id)->firstOrFail();
        $guardian = $family->guardians()->findOrFail($id);

        $guardian->update($request->only(['name', 'relationship', 'email', 'phone', 'is_primary_contact']));

        if ($request->has('is_primary_contact') && $request->boolean('is_primary_contact')) {
            $family->guardians()
                ->where('id', '!=', $guardian->id)
                ->update(['is_primary_contact' => false]);
        }

        return response()->json(['message' => 'Guardian updated successfully']);
    }

    public function deleteGuardian($id)
    {
        $user = Auth::user();
        $family = Family::where('user_id', $user->id)->firstOrFail();
        $guardian = $family->guardians()->findOrFail($id);

        // Cannot remove yourself
        if ($guardian->user_id && (int) $guardian->user_id === (int) $user->id) {
            return response()->json(['message' => 'You cannot remove yourself from the family portal'], 422);
        }

        // If removing the primary contact, reassign primary to the owner
        if ($guardian->is_primary_contact) {
            $family->guardians()
                ->where('user_id', $user->id)
                ->update(['is_primary_contact' => true]);
        }

        $guardian->delete();

        return response()->json(['message' => 'Guardian removed successfully']);
    }

    public function uploadPhoto(Request $request)
    {
        $request->validate([
            'photo' => 'required|image|max:10240',
            'caption' => 'nullable|string',
        ]);

        $user = Auth::user();
        $family = Family::where('user_id', $user->id)->firstOrFail();

        $path = $request->file('photo')->store('uploads/family_photos', 'public');
        $photo = $family->photos()->create([
            'photo_path' => $path,
            'caption' => $request->caption,
            'sort_order' => $family->photos()->count(),
        ]);

        return response()->json([
            'message' => 'Photo uploaded successfully',
            'photo' => [
                'id' => $photo->id,
                'url' => Storage::disk('public')->url($path),
            ],
        ]);
    }

    public function deletePhoto($id)
    {
        $user = Auth::user();
        $family = Family::where('user_id', $user->id)->firstOrFail();
        $photo = $family->photos()->findOrFail($id);

        if ($photo->photo_path) {
            Storage::disk('public')->delete($photo->photo_path);
        }

        $photo->delete();

        return response()->json(['message' => 'Photo removed successfully']);
    }

    public function approve(Request $request, $id)
    {
        $user = Auth::user();
        $family = Family::where('user_id', $user->id)->firstOrFail();
        $approval = $family->approvals()->findOrFail($id);

        $approval->status = 'approved';
        $approval->responded_at = now();
        $approval->save();

        return response()->json(['message' => 'Approval updated']);
    }

    public function reject(Request $request, $id)
    {
        $user = Auth::user();
        $family = Family::where('user_id', $user->id)->firstOrFail();
        $approval = $family->approvals()->findOrFail($id);

        $approval->status = 'rejected';
        $approval->responded_at = now();
        $approval->save();

        return response()->json(['message' => 'Approval updated']);
    }
}
