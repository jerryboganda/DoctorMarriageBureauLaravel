<?php
// Simple script to reset a user's password
// Run: php reset_user_pwd.php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;

$email = 'mindreader420123@gmail.com';
$newPassword = 'test1234';

$user = User::where('email', $email)->first();

if ($user) {
    $user->password = Hash::make($newPassword);
    $user->save();
    echo "Password reset successfully for: " . $user->email . "\n";
    echo "New password: " . $newPassword . "\n";
} else {
    echo "User not found: " . $email . "\n";
}
