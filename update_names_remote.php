<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();
foreach(App\Models\Setting::where('value', 'like', '%Active Matrimonial%')->get() as $s) {
    $s->value = str_replace(['Active Matrimonial CMS', 'Active Matrimonial'], 'Doctor Marriage Bureau', $s->value);
    $s->save();
    echo 'Updated: ' . $s->type . PHP_EOL;
}
