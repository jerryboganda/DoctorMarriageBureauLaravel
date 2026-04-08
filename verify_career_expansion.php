<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = App\Models\User::where('first_name', 'LIKE', '%Faisal%')->first();
if (!$user) {
    echo "User not found." . PHP_EOL;
    exit;
}

// Simulate the logic in update_full_profile_react
$careerData = [
    'education' => 'PhD in Artificial Intelligence',
    'institution' => 'Antigravity University',
    'educationStart' => '2020',
    'educationEnd' => '2024',
    'isHighestDegree' => true,
    'designation' => 'Principal AI Researcher',
    'company' => 'DeepMind',
    'careerStart' => '2024',
    'careerEnd' => null,
    'careerPresent' => true,
    'workLocationType' => 'remote'
];

DB::table('careers')->updateOrInsert(
    ['user_id' => $user->id, 'present' => 1],
    [
        'designation' => $careerData['designation'] ?? null,
        'company' => $careerData['company'] ?? null,
        'work_location_type' => $careerData['workLocationType'] ?? null,
        'start' => (int) $careerData['careerStart'],
        'end' => $careerData['careerEnd'] ? (int) $careerData['careerEnd'] : null,
        'present' => !empty($careerData['careerPresent']) ? 1 : 0,
        'updated_at' => now(),
    ]
);

DB::table('education')->updateOrInsert(
    ['user_id' => $user->id, 'present' => 1],
    [
        'degree' => $careerData['education'] ?? null,
        'institution' => $careerData['institution'] ?? null,
        'start' => (int) $careerData['educationStart'],
        'end' => (int) $careerData['educationEnd'],
        'is_highest_degree' => !empty($careerData['isHighestDegree']) ? 1 : 0,
        'updated_at' => now(),
    ]
);

echo "Persistence check completed for User ID: " . $user->id . PHP_EOL;
$edu = DB::table('education')->where('user_id', $user->id)->first();
$car = DB::table('careers')->where('user_id', $user->id)->first();

echo "Education Goal: PhD, University: " . ($edu->institution ?? 'N/A') . PHP_EOL;
echo "Career Goal: Researcher, Company: " . ($car->company ?? 'N/A') . PHP_EOL;
