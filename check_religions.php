<?php

use App\Models\Caste;
use App\Models\Religion;
use Illuminate\Contracts\Console\Kernel;

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

echo 'Religions count: '.Religion::count().PHP_EOL;
echo 'Castes count: '.Caste::count().PHP_EOL;

echo '--- Religions Sample ---'.PHP_EOL;
print_r(Religion::limit(10)->get()->toArray());

echo '--- Castes Sample ---'.PHP_EOL;
print_r(Caste::limit(10)->get()->toArray());
