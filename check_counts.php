<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo 'Religions count: ' . App\Models\Religion::count() . PHP_EOL;
echo 'Castes count: ' . App\Models\Caste::count() . PHP_EOL;
echo 'Marital Status count: ' . App\Models\MaritalStatus::count() . PHP_EOL;
echo 'Family Values count: ' . App\Models\FamilyValue::count() . PHP_EOL;
echo 'Languages count: ' . App\Models\MemberLanguage::count() . PHP_EOL;
