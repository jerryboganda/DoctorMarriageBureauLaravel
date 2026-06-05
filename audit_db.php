<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;

$tables = [
    'profile_option_values',
    'religions',
    'castes',
    'sub_castes',
    'member_languages',
    'countries',
    'states',
    'cities',
    'marital_statuses',
    'on_behalves',
    'annual_salary_ranges',
];

echo "Database Table Audit:\n";
echo str_repeat('-', 30)."\n";

foreach ($tables as $table) {
    try {
        $count = DB::table($table)->count();
        echo sprintf("%-25s: %d rows\n", $table, $count);
    } catch (Exception $e) {
        echo sprintf("%-25s: TABLE MISSING or ERROR (%s)\n", $table, $e->getMessage());
    }
}
