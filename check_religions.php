<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo 'Religions count: ' . App\Models\Religion::count() . PHP_EOL;
echo 'Castes count: ' . App\Models\Caste::count() . PHP_EOL;

echo "--- Religions Sample ---" . PHP_EOL;
print_r(App\Models\Religion::limit(10)->get()->toArray());

echo "--- Castes Sample ---" . PHP_EOL;
print_r(App\Models\Caste::limit(10)->get()->toArray());
