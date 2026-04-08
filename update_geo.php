<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Country;
use App\Models\State;
use App\Models\City;
use Illuminate\Support\Facades\DB;

$jsonPath = storage_path('app/geo_combined.json');
if (!file_exists($jsonPath)) {
    die("Error: geo_combined.json not found at $jsonPath\n");
}

echo "Reading JSON file... (this may take a while)\n";
$data = json_decode(file_get_contents($jsonPath), true);
if (!$data) {
    die("Error decoding JSON.\n");
}

echo "Processing " . count($data) . " countries...\n";

foreach ($data as $cData) {
    // 1. Update/Create Country
    $country = Country::updateOrCreate(
        ['code' => $cData['iso2']],
        [
            'name' => $cData['name'],
            'status' => 1
        ]
    );

    echo "Processing States/Cities for " . $country->name . "...\n";

    if (isset($cData['states']) && is_array($cData['states'])) {
        foreach ($cData['states'] as $sData) {
            // 2. Update/Create State
            $state = State::updateOrCreate(
                ['name' => $sData['name'], 'country_id' => $country->id],
                ['updated_at' => now()]
            );

            if (isset($sData['cities']) && is_array($sData['cities'])) {
                $citiesToInsert = [];
                $existingCities = City::where('state_id', $state->id)->pluck('name')->toArray();
                $existingCitiesLower = array_map('strtolower', $existingCities);

                foreach ($sData['cities'] as $cityData) {
                    $cityName = $cityData['name'];
                    if (!in_array(strtolower($cityName), $existingCitiesLower)) {
                        $citiesToInsert[] = [
                            'name' => $cityName,
                            'state_id' => $state->id,
                            'created_at' => now(),
                            'updated_at' => now()
                        ];
                    }

                    // Chunk inserts for performance
                    if (count($citiesToInsert) >= 200) {
                        DB::table('cities')->insert($citiesToInsert);
                        $citiesToInsert = [];
                    }
                }

                if (!empty($citiesToInsert)) {
                    DB::table('cities')->insert($citiesToInsert);
                }
            }
        }
    }
}

echo "\nUpdate Complete!\n";
echo "Total Countries: " . Country::count() . "\n";
echo "Total States: " . State::count() . "\n";
echo "Total Cities: " . City::count() . "\n";
