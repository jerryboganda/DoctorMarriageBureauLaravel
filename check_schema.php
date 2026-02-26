<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Users table columns ===\n";
$cols = Schema::getColumnListing('users');
echo implode(', ', $cols) . "\n";

echo "\n=== Check profile_completion_reminder_settings table ===\n";
echo Schema::hasTable('profile_completion_reminder_settings') ? 'EXISTS' : 'DOES NOT EXIST';
echo "\n";

echo "\n=== Check deactivated column ===\n";
$sample = App\Models\User::where('deactivated', 1)->count();
echo "Deactivated users count: " . $sample . "\n";

echo "\n=== Check blocked column ===\n";
$blocked = App\Models\User::where('blocked', 1)->count();
echo "Blocked users count: " . $blocked . "\n";

echo "\n=== Members below 80% completion (sample) ===\n";
$members = App\Models\User::where('user_type', 'member')
    ->where('deactivated', 0)
    ->where('blocked', 0)
    ->whereNotNull('email')
    ->take(5)
    ->get(['id', 'first_name', 'email']);
foreach ($members as $m) {
    echo "ID: {$m->id}, Name: {$m->first_name}, Email: {$m->email}\n";
}

echo "\n=== Cron setup check ===\n";
echo "Docker crontab:\n";
echo shell_exec('crontab -l 2>&1');
