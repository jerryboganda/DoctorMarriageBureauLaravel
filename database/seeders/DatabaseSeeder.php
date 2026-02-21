<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            AdminUserSeeder::class,
            ProgressionSeeder::class,
            ProfileOptionValueSeeder::class,
            AnnualSalaryRangeSeeder::class,
            ReligionCasteSeeder::class,
            OnBehalfSeeder::class,
            AddonProductSeeder::class,
            CouponSeeder::class,
            CommunitySeeder::class,
        ]);
    }
}
