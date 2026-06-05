<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Artisan;

$seeders = [
    'ProfileOptionValueSeeder',
    'ReligionCasteSeeder',
    'AnnualSalaryRangeSeeder',
    'OnBehalfSeeder',
];

foreach ($seeders as $seeder) {
    echo "Running $seeder...\n";
    try {
        Artisan::call('db:seed', ['--class' => $seeder, '--force' => true]);
        echo Artisan::output();
        echo "Done.\n\n";
    } catch (Exception $e) {
        echo 'Error: '.$e->getMessage()."\n\n";
    }
}
