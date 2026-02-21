<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ProgressionStage;
use App\Models\MemberProgression;
use App\Models\ProgressionEvent;
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

        // 2. Create Dummy Progression for a logged in user (assuming user ID 1 exists, or find one)
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
