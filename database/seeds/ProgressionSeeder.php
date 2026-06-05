<?php

use Illuminate\Database\Seeder;

class ProgressionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        app(Database\Seeders\ProgressionSeeder::class)->run();
    }
}
