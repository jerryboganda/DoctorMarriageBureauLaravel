<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\MemberProgression;
use App\Models\ProgressionStage;
use App\Models\ProgressionEvent;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use App\Events\ProgressionUpdated;

class ProgressionController extends Controller
{
    // Get all stages configuration
    public function getStages()
    {
        $stages = ProgressionStage::orderBy('order', 'asc')->get();
        return response()->json([
            'result' => true,
            'stages' => $stages
        ]);
    }

    // Get all active progressions for dashboard
    public function getActiveProgressions()
    {
        $userId = auth()->user()->id;
        
        $progressions = MemberProgression::where(function($q) use ($userId) {
            $q->where('user_id', $userId)->orWhere('partner_id', $userId);
        })
        ->where('status', 'active')
        ->with(['user', 'partner', 'stage', 'user.career', 'partner.career', 'user.addresses.city', 'partner.addresses.city'])
        ->get();
        
        $data = $progressions->map(function($p) use ($userId) {
            $partner = $p->user_id == $userId ? $p->partner : $p->user;
            
            $career = $partner->career->first();
            $address = $partner->addresses->where('type', 'present')->first() ?? $partner->addresses->first();
            
            return [
                'id' => (string)$p->id,
                'partner_id' => $partner->id,
                'profile' => [
                    'id' => $partner->id,
                    'name' => $partner->first_name . ' ' . $partner->last_name,
                    'avatarUrl' => $partner->photo ? url('public/' . $partner->photo) : null,
                    'specialty' => $career ? $career->designation : 'Medical Professional',
                    'hospital' => $career ? $career->company : 'City Hospital',
                    'location' => $address ? ($address->city ? $address->city->name : 'New Delhi') : 'New Delhi',
                ],
                'stage' => $p->stage ? $p->stage->slug : 'chatting',
                'stageLabel' => $p->stage ? $p->stage->name : 'Chatting',
                'progress' => $p->total_progress_percent ?? 25,
                'lastInteraction' => $p->updated_at->diffForHumans(),
                'nextAction' => $p->next_steps ?? 'Take the next step',
            ];
        });

        return response()->json([
            'result' => true,
            'tracks' => $data
        ]);
    }

    // Get progression details with a specific partner
    public function getProgression($id)
    {
        $userId = auth()->user()->id;
        $partnerId = $id;

        // Ensure partner exists
        $partner = User::find($partnerId);
        if (!$partner) {
            return response()->json(['result' => false, 'message' => 'Partner not found'], 404);
        }

        // Find or Create Progression
        // Check in both directions logic
        $progression = MemberProgression::where(function($q) use ($userId, $partnerId) {
            $q->where('user_id', $userId)->where('partner_id', $partnerId);
        })->orWhere(function($q) use ($userId, $partnerId) {
            $q->where('user_id', $partnerId)->where('partner_id', $userId);
        })->with(['stage', 'events'])->first();

        if (!$progression) {
            // Auto-create logic
            // Start at the first stage
            $startStage = ProgressionStage::orderBy('order', 'asc')->first();
            
            $progression = MemberProgression::create([
                'user_id' => $userId,
                'partner_id' => $partnerId,
                'current_stage_id' => $startStage ? $startStage->id : null,
                'status' => 'active',
                'total_progress_percent' => $startStage ? $startStage->progress_percent : 0,
            ]);
            
            $progression->load(['stage', 'events']);
        }

        return response()->json([
            'result' => true,
            'data' => $progression
        ]);
    }

    // Update Stage
    public function updateStage(Request $request, $id) {
        $request->validate([
            'stage_slug' => 'required|exists:progression_stages,slug'
        ]);

        $progression = MemberProgression::findOrFail($id);
        
        // Security check
        if ($progression->user_id != auth()->id() && $progression->partner_id != auth()->id()) {
            return response()->json(['result' => false, 'message' => 'Unauthorized'], 403);
        }

        $stage = ProgressionStage::where('slug', $request->stage_slug)->first();

        $progression->update([
            'current_stage_id' => $stage->id,
            'total_progress_percent' => $stage->progress_percent
        ]);

        event(new ProgressionUpdated($progression, auth()->id()));

        return response()->json([
            'result' => true,
            'message' => 'Stage updated successfully',
            'data' => $progression->load(['stage', 'events'])
        ]);
    }
}
