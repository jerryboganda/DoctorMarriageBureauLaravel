<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$states = App\Models\State::where('country_id', 166)->get();
echo "Found " . $states->count() . " states for Pakistan (ID 166):" . PHP_EOL;
foreach ($states as $s) {
    echo "- " . $s->name . " (ID: " . $s->id . ")" . PHP_EOL;
}
