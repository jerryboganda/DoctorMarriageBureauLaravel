<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "State Attributes:" . PHP_EOL;
$state = App\Models\State::first();
if ($state) {
    print_r($state->getAttributes());
}

echo PHP_EOL . "City Attributes:" . PHP_EOL;
$city = App\Models\City::first();
if ($city) {
    print_r($city->getAttributes());
}