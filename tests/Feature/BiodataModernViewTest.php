<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class BiodataModernViewTest extends TestCase
{
    public function test_biodata_view_renders_correct_height_and_hides_never_habits(): void
    {
        Cache::shouldReceive('remember')->andReturn(collect());

        $user = $this->makeUser(
            height: 5.68,
            diet: 'Halal (Standard)',
            smoke: 'Never',
            drink: 'Never'
        );

        $html = view('pdf.biodata_modern', ['user' => $user])->render();

        $this->assertStringContainsString("5'8\"", $html);
        $this->assertStringContainsString('Halal (Standard)', $html);
        $this->assertStringNotContainsString('Smokes', $html);
        $this->assertStringNotContainsString('Drinks', $html);
        $this->assertStringNotContainsString("0'2\"", $html);
    }

    public function test_biodata_view_renders_occasional_and_regular_habits(): void
    {
        Cache::shouldReceive('remember')->andReturn(collect());

        $user = $this->makeUser(
            height: 170,
            diet: null,
            smoke: 'Occasionally',
            drink: 'Regularly'
        );

        $html = view('pdf.biodata_modern', ['user' => $user])->render();

        $this->assertStringContainsString("5'7\"", $html);
        $this->assertStringContainsString('Smokes Occasionally', $html);
        $this->assertStringContainsString('Drinks', $html);
        $this->assertStringNotContainsString('Not Specified', $html);
    }

    private function makeUser(float $height, ?string $diet, ?string $smoke, ?string $drink): object
    {
        $user = new \stdClass();
        $user->id = 20;
        $user->first_name = 'Muhammad';
        $user->last_name = 'Mutayyab';
        $user->photo = null;

        $user->education = collect([
            (object) ['degree' => 'MBBS', 'end' => 2022],
        ]);

        $user->career = collect([
            (object) ['designation' => 'Doctor', 'company' => 'Private clinic', 'end' => 2024],
        ]);

        $user->families = (object) [
            'father_name' => 'Father',
            'father_profession' => 'Business',
            'mother_name' => 'Mother',
            'mother_profession' => 'Homemaker',
            'sibling_details' => '2 brothers',
            'family_type' => 'nuclear',
        ];

        $user->addresses = collect([
            (object) [
                'type' => 'present',
                'city' => (object) ['name' => 'Faisalabad'],
                'country' => (object) ['name' => 'Pakistan'],
            ],
        ]);

        $user->spiritual_backgrounds = (object) [
            'religion' => (object) ['name' => 'Muslim'],
            'caste' => (object) ['name' => 'Arain'],
            'ethnicity' => 'Sunni',
            'family_value' => (object) ['name' => 'Religious'],
        ];

        $user->lifestyles = (object) [
            'diet' => $diet,
            'smoke' => $smoke,
            'drink' => $drink,
        ];

        $user->physical_attributes = (object) [
            'height' => $height,
        ];

        $user->member = (object) [
            'birthday' => '2001-05-30',
            'marital_status' => (object) ['name' => 'Single'],
            'mothereTongue' => (object) ['name' => 'Urdu'],
            'introduction' => 'Profile intro',
            'education' => null,
            'designation' => null,
            'company' => null,
            'annual_salary_range' => (object) ['name' => '5-8 Lakh'],
        ];

        return $user;
    }
}

