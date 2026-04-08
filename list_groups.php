<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\ProfileOptionValue;

$groups = ProfileOptionValue::distinct()->pluck('group');
echo "Groups found: " . implode(', ', $groups->toArray()) . "\n";

foreach ($groups as $group) {
    $count = ProfileOptionValue::where('group', $group)->count();
    $activeCount = ProfileOptionValue::where('group', $group)->where('is_active', 1)->count();
    echo "- $group: $count total, $activeCount active\n";
}
