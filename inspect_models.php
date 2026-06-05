<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Schema;

$columns = Schema::getColumnListing('members');
echo "Members columns:\n";
print_r($columns);

$columns = Schema::getColumnListing('careers');
echo "\nCareers columns:\n";
print_r($columns);

$columns = Schema::getColumnListing('educations');
echo "\nEducations columns:\n";
print_r($columns);
