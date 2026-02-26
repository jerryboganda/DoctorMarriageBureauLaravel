<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$u = App\Models\User::where('email', 'mindreader420123@gmail.com')->first();
echo "User ID: " . $u->id . "\n";

// Fix existing broken notification: update data to include title, fix notify_by, and reset read_at
$existingNotif = App\Models\Notification::where('notifiable_id', $u->id)
    ->where('id', 1678)
    ->first();

if ($existingNotif) {
    $data = json_decode($existingNotif->data, true);
    // Fix: set notify_by to user's own ID (so their photo displays), set title
    $data['notify_by'] = $u->id;
    $data['title'] = $data['title'] ?? 'Admin Notification';
    $existingNotif->data = json_encode($data);
    $existingNotif->read_at = null; // Mark as unread so user can see it
    $existingNotif->save();
    echo "Fixed notification 1678: updated notify_by to {$u->id}, added title, reset read_at\n";
}

// Verify the fix by testing NotificationResource
$testNotif = App\Models\Notification::find(1678);
if ($testNotif) {
    try {
        $resource = new App\Http\Resources\NotificationResource($testNotif);
        $resolved = $resource->resolve();
        echo "Resource OK: " . json_encode($resolved, JSON_PRETTY_PRINT) . "\n";
    } catch (\Throwable $e) {
        echo "STILL CRASHING: " . $e->getMessage() . "\n";
    }
}

echo "Done.\n";
