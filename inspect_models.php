<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

$columns = Schema::getColumnListing('members');
echo "Members columns:\n";
print_r($columns);

$columns = Schema::getColumnListing('careers');
echo "\nCareers columns:\n";
print_r($columns);

$columns = Schema::getColumnListing('educations');
echo "\nEducations columns:\n";
print_r($columns);
