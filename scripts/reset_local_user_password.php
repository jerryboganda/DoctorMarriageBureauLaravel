<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$email = $argv[1] ?? null;
$password = $argv[2] ?? null;

if (!$email || !$password) {
    fwrite(STDERR, "Usage: php scripts/reset_local_user_password.php <email> <password>\n");
    exit(1);
}

$user = App\Models\User::where('email', $email)->first();

if (!$user) {
    fwrite(STDERR, "User not found\n");
    exit(1);
}

$user->password = Illuminate\Support\Facades\Hash::make($password);
$user->must_change_password = 0;
$user->save();

echo "Password updated for {$user->email}\n";
