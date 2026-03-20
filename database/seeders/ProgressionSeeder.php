<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ProgressionStage;
use App\Models\MemberProgression;
use App\Models\ProgressionEvent;
use App\Models\ProgressionChecklistItem;
use App\Models\ProgressionNote;
use App\Models\ProgressionVenue;
use App\Models\ProgressionBudgetItem;
use App\Models\ProgressionSetting;
use App\Models\User;

class ProgressionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // 1. Create Stages
        $stages = [
            ['name' => 'First Meetings', 'order' => 1, 'progress_percent' => 20, 'slug' => 'first-meetings'],
            ['name' => 'Getting to Know', 'order' => 2, 'progress_percent' => 40, 'slug' => 'getting-to-know'],
            ['name' => 'Families Met', 'order' => 3, 'progress_percent' => 60, 'slug' => 'families-met'],
            ['name' => 'exclusive Courtship', 'order' => 4, 'progress_percent' => 80, 'slug' => 'exclusive-courtship'],
            ['name' => 'Engaged', 'order' => 5, 'progress_percent' => 100, 'slug' => 'engaged'],
        ];

        foreach ($stages as $stage) {
            ProgressionStage::firstOrCreate(['slug' => $stage['slug']], $stage);
        }

        if (!app()->environment(['local', 'testing'])) {
            return;
        }

        // 2. Create demo progression data for local/testing only
        $user = User::where('user_type', 'member')->first();
        if (!$user) return; // No users to seed

        $partners = User::where('user_type', 'member')->where('id', '!=', $user->id)->limit(2)->get();

        foreach ($partners as $index => $partner) {
             $stage = ProgressionStage::where('slug', $index == 0 ? 'exclusive-courtship' : 'first-meetings')->first();
             
             $progression = MemberProgression::firstOrCreate([
                 'user_id' => $user->id,
                 'partner_id' => $partner->id
             ], [
                 'current_stage_id' => $stage->id,
                 'status' => 'active',
                 'total_progress_percent' => $stage->progress_percent,
                 'next_steps' => $index == 0 ? 'Plan family dinner' : 'Post-date feedback'
             ]);

             ProgressionSetting::firstOrCreate([
                 'member_progression_id' => $progression->id,
             ], [
                 'share_calendar_busy' => true,
                 'auto_detect_timezone' => true,
                 'timezone' => config('app.timezone'),
                 'budget_target' => $index === 0 ? 1500000 : 500000,
             ]);

             ProgressionChecklistItem::firstOrCreate([
                 'member_progression_id' => $progression->id,
                 'title' => 'Exchange biodata',
             ], [
                 'is_completed' => true,
                 'completed_at' => now()->subDays(6),
                 'sort_order' => 1,
                 'created_by' => $user->id,
                 'updated_by' => $user->id,
             ]);

             ProgressionChecklistItem::firstOrCreate([
                 'member_progression_id' => $progression->id,
                 'title' => 'Schedule family intro',
             ], [
                 'is_completed' => false,
                 'sort_order' => 2,
                 'created_by' => $user->id,
                 'updated_by' => $user->id,
             ]);

             ProgressionNote::firstOrCreate([
                 'member_progression_id' => $progression->id,
                 'note_type' => 'family_feedback',
                 'note' => 'Family liked the profile presentation and wants a deeper conversation.',
             ], [
                 'author_id' => $user->id,
             ]);

             ProgressionVenue::firstOrCreate([
                 'member_progression_id' => $progression->id,
                 'name' => $index == 0 ? 'Pearl Continental, Lahore' : 'Gymkhana Club',
             ], [
                 'venue_type' => $index == 0 ? 'Engagement Venue' : 'Family Lunch',
                 'estimated_cost' => $index == 0 ? 450000 : 150000,
                 'rating' => $index == 0 ? 4.8 : 4.5,
                 'status' => 'shortlisted',
                 'notes' => 'Suggested for planning discussion.',
             ]);

             ProgressionBudgetItem::firstOrCreate([
                 'member_progression_id' => $progression->id,
                 'label' => $index == 0 ? 'Venue Advance' : 'Family Lunch',
             ], [
                 'amount' => $index == 0 ? 30000 : 12000,
                 'category' => 'planning',
                 'status' => 'planned',
                 'notes' => 'Seeded local demo item.',
             ]);

             // Events
             ProgressionEvent::create([
                 'member_progression_id' => $progression->id,
                 'title' => 'Coffee Meetup',
                 'event_at' => now()->addDays(2),
                 'location' => 'Starbucks, CP',
                 'status' => 'scheduled'
             ]);
        }
    }
}
