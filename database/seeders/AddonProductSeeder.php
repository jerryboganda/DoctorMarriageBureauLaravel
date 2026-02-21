<?php

namespace Database\Seeders;

use App\Models\AddonProduct;
use Illuminate\Database\Seeder;

class AddonProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $addons = [
            [
                'name' => 'Profile Boost',
                'slug' => 'profile-boost',
                'description' => 'Get featured in discovery for 7 days.',
                'price' => 9.99,
                'badge' => 'Popular',
                'metadata' => ['duration_days' => 7],
                'is_active' => true,
            ],
            [
                'name' => 'Verified Badge',
                'slug' => 'verified-badge',
                'description' => 'Priority verification review for your profile.',
                'price' => 14.99,
                'badge' => 'Priority',
                'metadata' => ['verification_priority' => true],
                'is_active' => true,
            ],
            [
                'name' => 'Spotlight Match',
                'slug' => 'spotlight-match',
                'description' => 'Showcase your profile on the home feed for 24 hours.',
                'price' => 6.99,
                'badge' => 'Limited',
                'metadata' => ['duration_hours' => 24],
                'is_active' => true,
            ],
            [
                'name' => 'DM Credits',
                'slug' => 'dm-credits',
                'description' => 'Unlock 10 priority direct messages.',
                'price' => 4.99,
                'badge' => null,
                'metadata' => ['credits' => 10],
                'is_active' => true,
            ],
        ];

        foreach ($addons as $addon) {
            AddonProduct::updateOrCreate(
                ['slug' => $addon['slug']],
                $addon
            );
        }
    }
}
