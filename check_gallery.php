<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

// Check user photo format
$user = DB::table('users')->where('id', 2)->first(['id', 'photo']);
echo "User 2 photo: " . ($user->photo ?? 'null') . "\n";
echo "uploaded_asset result: " . uploaded_asset($user->photo) . "\n";
