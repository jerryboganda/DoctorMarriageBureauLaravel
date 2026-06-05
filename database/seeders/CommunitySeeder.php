<?php

namespace Database\Seeders;

use App\Models\Community;
use App\Models\CommunityMembership;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CommunitySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $communities = [
            [
                'name' => 'Doctors of Lahore',
                'type' => 'region',
                'description' => 'Exclusive network for medical professionals practicing in Lahore.',
                'is_private' => false,
            ],
            [
                'name' => 'AKU Alumni Network',
                'type' => 'alumni',
                'description' => 'Verified alumni of Aga Khan University.',
                'is_private' => true,
            ],
            [
                'name' => 'Arain Doctors Family',
                'type' => 'culture',
                'description' => 'Connecting Arain medical families globally.',
                'is_private' => true,
            ],
            [
                'name' => 'Cardiology Society Pakistan',
                'type' => 'specialty',
                'description' => 'For cardiologists and cardiac surgeons seeking partners.',
                'is_private' => false,
            ],
        ];

        foreach ($communities as $community) {
            Community::updateOrCreate(
                ['slug' => Str::slug($community['name'])],
                $community
            );
        }

        $user = User::where('user_type', 'member')->first();
        if (! $user) {
            return;
        }

        $joinedCommunity = Community::where('slug', Str::slug('Doctors of Lahore'))->first();
        if ($joinedCommunity) {
            CommunityMembership::updateOrCreate(
                ['community_id' => $joinedCommunity->id, 'user_id' => $user->id],
                [
                    'status' => 'joined',
                    'role' => 'member',
                    'requested_at' => now()->subDays(3),
                    'approved_at' => now()->subDays(2),
                ]
            );
        }

        $pendingCommunity = Community::where('slug', Str::slug('AKU Alumni Network'))->first();
        if ($pendingCommunity) {
            CommunityMembership::updateOrCreate(
                ['community_id' => $pendingCommunity->id, 'user_id' => $user->id],
                [
                    'status' => 'pending',
                    'role' => 'member',
                    'requested_at' => now()->subDay(),
                    'approved_at' => null,
                ]
            );
        }
    }
}
