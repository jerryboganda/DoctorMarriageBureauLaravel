<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

function describeTable($table)
{
    echo "--- Table: $table ---" . PHP_EOL;
    $columns = DB::select("DESCRIBE $table");
    foreach ($columns as $column) {
        echo "Field: {$column->Field} | Type: {$column->Type}" . PHP_EOL;
    }
    echo PHP_EOL;
}

describeTable('education');
describeTable('careers');
