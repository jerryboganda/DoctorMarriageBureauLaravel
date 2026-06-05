<?php

use App\Models\City;
use App\Models\State;
use Illuminate\Contracts\Console\Kernel;

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

echo 'State Attributes:'.PHP_EOL;
$state = State::first();
if ($state) {
    print_r($state->getAttributes());
}

echo PHP_EOL.'City Attributes:'.PHP_EOL;
$city = City::first();
if ($city) {
    print_r($city->getAttributes());
}
