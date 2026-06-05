<?php

use App\Http\Controllers\Api\ProfileDropdownController;
use App\Http\Resources\Profile\StateResource;
use App\Models\State;
use Illuminate\Contracts\Console\Kernel;

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

$countryId = 166; // Pakistan ID found previously
$states = State::where('country_id', $countryId)->get();

echo "States for Pakistan (ID: $countryId): ".$states->count().PHP_EOL;
foreach ($states->take(5) as $state) {
    echo '- '.$state->name.' (ID: '.$state->id.')'.PHP_EOL;
}

// Check with the actual controller logic
$controller = new ProfileDropdownController;
$response = $controller->state_list($countryId);

echo 'Controller Response count: '.count($response).PHP_EOL;

// Check if StateResource wraps data
$stateResource = new StateResource($states->first());
echo 'Sample Resource Structure:'.PHP_EOL;
print_r($stateResource->toArray(request()));
