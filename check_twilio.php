<?php
include 'vendor/autoload.php';
$app = include_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "Twillo Activation: " . get_setting('twillo_activation') . "\n";
echo "TWILIO_SID: " . (env('TWILIO_SID') ? 'SET' : 'MISSING') . "\n";
echo "TWILIO_AUTH_TOKEN: " . (env('TWILIO_AUTH_TOKEN') ? 'SET' : 'MISSING') . "\n";
echo "VALID_TWILLO_NUMBER: " . (env('VALID_TWILLO_NUMBER') ? 'SET' : 'MISSING') . "\n";
