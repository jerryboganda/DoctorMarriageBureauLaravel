<?php

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\ProgressionStage;

class ProgressionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Disable foreign key checks to allow truncation
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        
        ProgressionStage::truncate();

        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $stages = [
            [
                'name' => 'Start',
                'slug' => 'start',
                'order' => 1,
                'progress_percent' => 0,
            ],
            [
                'name' => 'Interacting',
                'slug' => 'interacting',
                'order' => 2,
                'progress_percent' => 10,
            ],
            [
                'name' => 'First Meeting',
                'slug' => 'first_meeting',
                'order' => 3,
                'progress_percent' => 30,
            ],
            [
                'name' => 'Exclusive',
                'slug' => 'exclusive',
                'order' => 4,
                'progress_percent' => 50,
            ],
            [
                'name' => 'Courtship',
                'slug' => 'courtship',
                'order' => 5,
                'progress_percent' => 75,
            ],
             [
                'name' => 'Engaged',
                'slug' => 'engaged',
                'order' => 6,
                'progress_percent' => 90,
            ],
             [
                'name' => 'Married',
                'slug' => 'married',
                'order' => 7,
                'progress_percent' => 100,
            ],
        ];

        foreach ($stages as $stage) {
            ProgressionStage::create($stage);
        }
    }
}
