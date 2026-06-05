<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;

try {
    DB::statement("ALTER TABLE members MODIFY seriousness_level ENUM('marriage', 'exploring', 'casual') NULL DEFAULT 'marriage'");
    echo "Successfully updated seriousness_level to be nullable.\n";
} catch (Exception $e) {
    echo 'Error: '.$e->getMessage()."\n";
}
