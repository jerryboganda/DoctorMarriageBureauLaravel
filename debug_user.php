<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = App\Models\User::where('first_name', 'LIKE', '%Faisal%')->first();
if ($user) {
    echo "User ID: " . $user->id . PHP_EOL;
    echo "Email: " . $user->email . PHP_EOL;
    echo "Email Verified At: " . ($user->email_verified_at ?: 'NULL') . PHP_EOL;
    echo "User Type: " . $user->user_type . PHP_EOL;
    echo "Blocked: " . $user->blocked . PHP_EOL;
    echo "Approved: " . $user->approved . PHP_EOL;
} else {
    echo "User not found." . PHP_EOL;
}
