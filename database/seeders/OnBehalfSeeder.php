<?php

namespace Database\Seeders;

use App\Models\OnBehalf;
use Illuminate\Database\Seeder;

class OnBehalfSeeder extends Seeder
{
    public function run(): void
    {
        $onBehalves = [
            'Self',
            'Parent',
            'Sibling',
            'Relative',
            'Friend',
            'Guardian',
        ];

        foreach ($onBehalves as $name) {
            OnBehalf::updateOrCreate(['name' => $name], ['name' => $name]);
        }
    }
}
