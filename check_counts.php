<?php

use App\Models\Caste;
use App\Models\FamilyValue;
use App\Models\MaritalStatus;
use App\Models\MemberLanguage;
use App\Models\Religion;
use Illuminate\Contracts\Console\Kernel;

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

echo 'Religions count: '.Religion::count().PHP_EOL;
echo 'Castes count: '.Caste::count().PHP_EOL;
echo 'Marital Status count: '.MaritalStatus::count().PHP_EOL;
echo 'Family Values count: '.FamilyValue::count().PHP_EOL;
echo 'Languages count: '.MemberLanguage::count().PHP_EOL;
