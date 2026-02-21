<?php

namespace Database\Seeders;

use App\Models\ProfileOptionValue;
use Illuminate\Database\Seeder;

class ProfileOptionValueSeeder extends Seeder
{
    public function run(): void
    {
        $groups = [
            'gender' => [
                ['value' => 'Male', 'label' => 'Male'],
                ['value' => 'Female', 'label' => 'Female'],
            ],
            'marriage_timeline' => [
                ['value' => 'immediate', 'label' => 'Immediately (0-6 months)'],
                ['value' => '6_months', 'label' => 'Soon (6-12 months)'],
                ['value' => '1_year', 'label' => 'Within 1 year'],
                ['value' => '2_years', 'label' => 'Within 2 years'],
                ['value' => 'casual', 'label' => 'Looking casually'],
                ['value' => 'optional', 'label' => 'Optional'],
            ],
            'relocation_willingness' => [
                ['value' => 'international', 'label' => 'Willing to relocate internationally'],
                ['value' => 'within_country', 'label' => 'Willing to relocate within country'],
                ['value' => 'within_state', 'label' => 'Willing to relocate within state'],
                ['value' => 'not_willing', 'label' => 'Not willing to relocate'],
                ['value' => 'optional', 'label' => 'Optional'],
            ],
            'seriousness_level' => [
                ['value' => 'marriage', 'label' => 'Marriage'],
                ['value' => 'exploring', 'label' => 'Exploring'],
                ['value' => 'casual', 'label' => 'Casual'],
                ['value' => 'optional', 'label' => 'Optional'],
            ],
            'diet' => [
                ['value' => 'Halal (Strict)', 'label' => 'Halal (Strict)'],
                ['value' => 'Halal (Standard)', 'label' => 'Halal (Standard)'],
                ['value' => 'Vegetarian', 'label' => 'Vegetarian'],
                ['value' => 'Vegan', 'label' => 'Vegan'],
                ['value' => 'No Preference', 'label' => 'No Preference'],
            ],
            'drink' => [
                ['value' => 'Never', 'label' => 'Never'],
                ['value' => 'Occasionally', 'label' => 'Occasionally'],
                ['value' => 'Regularly', 'label' => 'Regularly'],
            ],
            'smoke' => [
                ['value' => 'Never', 'label' => 'Never'],
                ['value' => 'Occasionally', 'label' => 'Occasionally'],
                ['value' => 'Regularly', 'label' => 'Regularly'],
            ],
            'property' => [
                ['value' => 'Own Home', 'label' => 'Own Home'],
                ['value' => 'Rented', 'label' => 'Rented'],
            ],
            'living_with' => [
                ['value' => 'With Parents', 'label' => 'With Parents'],
                ['value' => 'Alone', 'label' => 'Alone'],
                ['value' => 'With Roommates', 'label' => 'With Roommates'],
            ],
            'sleep_schedule' => [
                ['value' => 'early_bird', 'label' => 'Early Bird'],
                ['value' => 'night_owl', 'label' => 'Night Owl'],
                ['value' => 'flexible', 'label' => 'Flexible'],
            ],
            'work_location_type' => [
                ['value' => 'on_site', 'label' => 'On-site'],
                ['value' => 'remote', 'label' => 'Remote'],
                ['value' => 'hybrid', 'label' => 'Hybrid'],
            ],
            'family_type' => [
                ['value' => 'nuclear', 'label' => 'Nuclear Family'],
                ['value' => 'joint', 'label' => 'Joint Family'],
                ['value' => 'extended', 'label' => 'Extended Family'],
            ],
            'immigration_status' => [
                ['value' => 'citizen', 'label' => 'Citizen'],
                ['value' => 'dual_national', 'label' => 'Dual National'],
                ['value' => 'work_visa', 'label' => 'Work Visa'],
                ['value' => 'student_visa', 'label' => 'Student Visa'],
                ['value' => 'permanent_resident', 'label' => 'Permanent Resident'],
            ],
            'personal_values' => [
                ['value' => 'Moderately Religious', 'label' => 'Moderately Religious'],
                ['value' => 'Very Religious', 'label' => 'Very Religious'],
                ['value' => 'Spiritual', 'label' => 'Spiritual'],
                ['value' => 'Not Religious', 'label' => 'Not Religious'],
                ['value' => 'Optional', 'label' => 'Optional'],
            ],
            'community_values' => [
                ['value' => 'Traditional', 'label' => 'Traditional'],
                ['value' => 'Modern', 'label' => 'Modern'],
                ['value' => 'Islamic', 'label' => 'Islamic'],
                ['value' => 'Social', 'label' => 'Social'],
                ['value' => 'Optional', 'label' => 'Optional'],
            ],
        ];

        foreach ($groups as $group => $items) {
            foreach ($items as $index => $item) {
                ProfileOptionValue::updateOrCreate(
                    ['group' => $group, 'value' => $item['value']],
                    [
                        'label' => $item['label'],
                        'sort_order' => $index,
                        'is_active' => true,
                    ]
                );
            }
        }
    }
}
