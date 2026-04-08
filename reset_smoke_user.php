<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->handle(Illuminate\Http\Request::capture());

use App\Models\User;
use App\Models\UserTwoFactorSetting;
use Illuminate\Support\Facades\Hash;

$user = User::where('email', 'smoke.user@example.com')->first();
if ($user) {
    $user->password = Hash::make('password123');
    $user->save();
    
    $settings = UserTwoFactorSetting::where('user_id', $user->id)->first();
    if ($settings) {
        $settings->is_enabled = 0;
        $settings->save();
    }
    echo "Password updated to password123 and 2FA disabled for smoke.user@example.com\n";
} else {
    echo "User smoke.user@example.com not found\n";
}
