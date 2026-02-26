<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$u = App\Models\User::where('email', 'mindreader420123@gmail.com')->first();
echo "User ID: " . $u->id . "\n";
echo "Has member: " . ($u->member ? 'yes' : 'no') . "\n";

$notifications = App\Models\Notification::where('notifiable_id', $u->id)
    ->latest()
    ->take(10)
    ->get();

echo "Total notifications: " . $notifications->count() . "\n\n";

foreach ($notifications as $n) {
    echo "---\n";
    echo "ID: " . $n->id . "\n";
    echo "Type: " . $n->type . "\n";
    echo "Data: " . $n->data . "\n";
    echo "Read: " . ($n->read_at ?? 'NULL') . "\n";
    echo "Created: " . $n->created_at . "\n";
}

// Also check Laravel log for recent errors
echo "\n=== Recent Laravel Log (last 50 lines) ===\n";
$logFile = storage_path('logs/laravel.log');
if (file_exists($logFile)) {
    $lines = file($logFile);
    $last50 = array_slice($lines, -50);
    echo implode('', $last50);
}
