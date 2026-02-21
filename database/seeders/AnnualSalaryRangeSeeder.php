<?php

namespace Database\Seeders;

use App\Models\AnnualSalaryRange;
use Illuminate\Database\Seeder;

class AnnualSalaryRangeSeeder extends Seeder
{
    public function run(): void
    {
        $ranges = [
            ['min' => 0, 'max' => 1000000],
            ['min' => 1000000, 'max' => 3000000],
            ['min' => 3000000, 'max' => 5000000],
            ['min' => 5000000, 'max' => 8000000],
            ['min' => 8000000, 'max' => 12000000],
            ['min' => 12000000, 'max' => 20000000],
            ['min' => 20000000, 'max' => 50000000],
        ];

        foreach ($ranges as $range) {
            AnnualSalaryRange::updateOrCreate(
                ['min_salary' => $range['min'], 'max_salary' => $range['max']],
                ['min_salary' => $range['min'], 'max_salary' => $range['max']]
            );
        }
    }
}
