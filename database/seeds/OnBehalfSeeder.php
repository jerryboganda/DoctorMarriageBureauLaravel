<?php

use App\Models\OnBehalf;
use Illuminate\Database\Seeder;

class OnBehalfSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run()
    {
        $on_behalves = [
            'Myself',
            'My Son',
            'My Daughter',
            'My Brother',
            'My Sister',
            'My Friend',
            'My Client',
        ];

        foreach ($on_behalves as $name) {
            OnBehalf::updateOrCreate(['name' => $name]);
        }
    }
}
