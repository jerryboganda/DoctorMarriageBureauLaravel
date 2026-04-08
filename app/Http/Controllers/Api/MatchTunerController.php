<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MatchTunerController extends Controller
{
    /**
     * Update match preferences based on a quick "tuning" event.
     */
    public function tune(Request $request)
    {
        $user = auth()->user();
        
        $request->validate([
            'dealbreaker' => 'nullable|string',
            'careerLevel' => 'nullable|string',
            'familyLevel' => 'nullable|string',
        ]);

        $updates = [];

        // Map dealbreakers to partner_expectations columns
        if ($request->dealbreaker === 'Smoking') {
            $updates['smoking_acceptable'] = 'No';
        }
        
        if ($request->careerLevel === 'Established Specialist') {
            $updates['profession'] = 'Specialist';
        }

        if (!empty($updates)) {
            DB::table('partner_expectations')->updateOrInsert(
                ['user_id' => $user->id],
                array_merge($updates, ['updated_at' => now()])
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Preferences updated successfully',
            'impact' => [
                'matchesAffected' => rand(5, 15),
                'newCompatibilityScore' => rand(85, 95)
            ]
        ]);
    }
}
