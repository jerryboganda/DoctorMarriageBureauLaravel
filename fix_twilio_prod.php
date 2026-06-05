<?php

include 'vendor/autoload.php';
$app = include_once 'bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

use App\Models\Setting;
use Illuminate\Contracts\Console\Kernel;

// Ensure Twilio is activated
$setting = Setting::where('type', 'twillo_activation')->first();
if (! $setting) {
    $setting = new Setting;
    $setting->type = 'twillo_activation';
}
$setting->value = '1';
$setting->save();

echo "Twilio activation set to 1.\n";

// Check current values
echo "Current Settings:\n";
echo 'Twillo Activation: '.get_setting('twillo_activation')."\n";
echo 'TWILIO_SID: '.(env('TWILIO_SID') ? 'SET' : 'MISSING')."\n";
