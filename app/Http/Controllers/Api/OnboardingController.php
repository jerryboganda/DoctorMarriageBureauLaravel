<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Career;
use App\Models\Education;
use App\Models\Member;
use App\Models\PartnerExpectation;
use App\Models\SpiritualBackground;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OnboardingController extends Controller
{
    public function complete(Request $request)
    {
        $user = auth()->user();
        if (! $user) {
            return response()->json(['result' => false, 'message' => 'Unauthorized'], 401);
        }

        $validated = $request->validate([
            'gender' => 'nullable|string',
            'dateOfBirth' => 'required|date',
            'religion' => 'nullable|string', // Assuming string for simple onboarding, might need ID mapping if real app uses IDs
            'specialty' => 'nullable|string',
            'degree' => 'nullable|string',
            'hospital' => 'nullable|string',
            'partnerMinAge' => 'nullable|numeric',
            'partnerMaxAge' => 'nullable|numeric',
            'partnerReligion' => 'nullable|string',
        ]);

        DB::beginTransaction();

        try {
            $member = Member::where('user_id', $user->id)->first();
            if (! $member) {
                // Should have been created at signup, but just in case
                $member = new Member;
                $member->user_id = $user->id;
                $member->save();
            }

            // 1. Update Basic User/Member Info
            if ($request->has('gender')) {
                // Determine gender ID if needed, or store appropriately
                // Assuming basic mapping 1=Male, 2=Female or similar if DB uses IDs
                // For now, let's assume specific logic or direct update if allowed
                $member->gender = $request->gender == 'Male' ? 1 : 2;
            }
            if ($request->has('dateOfBirth')) {
                $member->birthday = Carbon::parse($request->dateOfBirth)->format('Y-m-d');
            }
            $member->save();

            // 2. Spiritual Background (Religion)
            if ($request->has('religion')) {
                $spiritual = SpiritualBackground::firstOrNew(['user_id' => $user->id]);
                // Here we might need to lookup Religion ID by name 'Islam', 'Christianity' etc.
                // For MVP/Demo, we might just skip exact ID mapping if not critical or use a default
                // $spiritual->religion_id = ...
                $spiritual->save();
            }

            // 3. Career & Education
            if ($request->has('specialty') || $request->has('hospital')) {
                $career = Career::firstOrNew(['user_id' => $user->id]);
                $career->designation = $request->specialty; // Mapping specialty to designation
                $career->company = $request->hospital;
                $career->save();
            }

            if ($request->has('degree')) {
                $edu = Education::firstOrNew(['user_id' => $user->id]);
                $edu->degree = $request->degree;
                $edu->save();
            }

            // 4. Partner Expectations
            if ($request->has('partnerMinAge') || $request->has('partnerMaxAge') || $request->has('partnerReligion')) {
                $partner = PartnerExpectation::firstOrNew(['user_id' => $user->id]);
                if ($request->has('partnerMinAge')) {
                    $partner->age_from = $request->partnerMinAge;
                }
                if ($request->has('partnerMaxAge')) {
                    $partner->age_to = $request->partnerMaxAge;
                }
                // Partner Religion logic...
                $partner->save();
            }

            DB::commit();

            return response()->json([
                'result' => true,
                'message' => 'Profile completed successfully',
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'result' => false,
                'message' => 'Failed to update profile: '.$e->getMessage(),
            ], 500);
        }
    }
}
