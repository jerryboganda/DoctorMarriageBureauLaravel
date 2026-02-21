<?php

use Illuminate\Database\Seeder;

require_once __DIR__ . '/ProgressionSeeder.php';

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * @return void
     */
    public function run()
    {
        $this->call(ProgressionSeeder::class);
        $this->call(AdminUserSeeder::class);
    }
}
