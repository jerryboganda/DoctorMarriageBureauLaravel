<?php

use App\Models\ExpressInterest;
use App\Models\User;
use Illuminate\Contracts\Console\Kernel;

// Debug proposals for mindreader_420@yahoo.com
require_once __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

$user = User::where('email', 'mindreader_420@yahoo.com')->first();
if (! $user) {
    echo "User not found\n";
    exit;
}
echo "User ID: {$user->id}, Name: {$user->first_name} {$user->last_name}\n\n";

// Received interests (where this user is the target)
$received = ExpressInterest::where('user_id', $user->id)->get();
echo "=== RECEIVED INTERESTS (user_id = {$user->id}) ===\n";
echo 'Count: '.$received->count()."\n";
foreach ($received as $r) {
    $sender = User::find($r->interested_by);
    $senderName = $sender ? "{$sender->first_name} {$sender->last_name}" : 'DELETED';
    echo "  ID: {$r->id} | From: {$senderName} (user #{$r->interested_by}) | Status: {$r->status} | Created: {$r->created_at}\n";
}

echo "\n=== SENT INTERESTS (interested_by = {$user->id}) ===\n";
$sent = ExpressInterest::where('interested_by', $user->id)->get();
echo 'Count: '.$sent->count()."\n";
foreach ($sent as $s) {
    $target = User::find($s->user_id);
    $targetName = $target ? "{$target->first_name} {$target->last_name}" : 'DELETED';
    echo "  ID: {$s->id} | To: {$targetName} (user #{$s->user_id}) | Status: {$s->status} | Created: {$s->created_at}\n";
}
