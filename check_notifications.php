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

// Check admin user (ID 6 = notify_by)
$admin = App\Models\User::find(6);
echo "\nAdmin user (ID 6): " . ($admin ? $admin->email : 'NOT FOUND') . "\n";
echo "Admin has member: " . ($admin && $admin->member ? 'yes (gender=' . $admin->member->gender . ')' : 'NO MEMBER RECORD') . "\n";

// Try to call the NotificationResource on the notification to see if it crashes
echo "\n=== Testing NotificationResource ===\n";
$testNotif = App\Models\Notification::find(1678);
if ($testNotif) {
    try {
        $resource = new App\Http\Resources\NotificationResource($testNotif);
        echo "Resource output: " . json_encode($resource->resolve()) . "\n";
    } catch (\Throwable $e) {
        echo "CRASH: " . $e->getMessage() . "\n";
        echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
    }
}

// Check error log for admin_notification or NotificationResource errors
echo "\n=== Laravel Log errors (last 200 lines, filtered) ===\n";
$logFile = storage_path('logs/laravel.log');
if (file_exists($logFile)) {
    $lines = file($logFile);
    $last200 = array_slice($lines, -200);
    foreach ($last200 as $line) {
        if (stripos($line, 'notification') !== false || stripos($line, 'Error') !== false || stripos($line, 'exception') !== false) {
            echo $line;
        }
    }
}
