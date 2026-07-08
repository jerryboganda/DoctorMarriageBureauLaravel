<?php

namespace App\Http\Controllers\Api;

use App\Models\TrustedContact;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class RuntimeController extends Controller
{
    public function health()
    {
        return response()->json([
            'status' => 'ok',
            'time' => now()->toIso8601String(),
            'app' => config('app.name'),
        ]);
    }

    public function verifyTrustedContact($token)
    {
        $contact = TrustedContact::verifyWithToken($token);
        if ($contact) {
            return response()->json(['success' => true, 'message' => 'Contact verified successfully.']);
        }

        return response()->json(['success' => false, 'message' => 'Invalid or expired token.'], 400);
    }

    public function googleRecaptcha()
    {
        return view('frontend.google_recaptcha.app_recaptcha');
    }

    public function heartbeat()
    {
        $expiresAt = Carbon::now()->addMinutes(3);
        Cache::put('user-is-online-'.auth()->id(), true, $expiresAt);

        return response()->json(['result' => true]);
    }

    public function userOnlineStatus(Request $request)
    {
        $userIds = $request->input('user_ids', []);
        $statuses = [];
        foreach ($userIds as $uid) {
            $statuses[$uid] = Cache::has('user-is-online-'.$uid) ? 1 : 0;
        }

        return response()->json(['result' => true, 'data' => $statuses]);
    }
}
