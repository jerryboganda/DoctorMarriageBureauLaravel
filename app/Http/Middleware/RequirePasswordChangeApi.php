<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class RequirePasswordChangeApi
{
    public function handle(Request $request, Closure $next)
    {
        $user = auth()->user();

        if (! $user || (int) $user->must_change_password !== 1) {
            return $next($request);
        }

        $allowedPaths = [
            'api/member/change/password',
            'api/logout',
            'api/user-by-token',
            'api/account/security-status',
            'api/account/step-up/*',
            'api/account/2fa/*',
        ];

        foreach ($allowedPaths as $path) {
            if ($request->is($path)) {
                return $next($request);
            }
        }

        $warningKey = 'password_change_block:'.$user->id.':'.$request->path();
        if (Cache::add($warningKey, true, now()->addHour())) {
            Log::warning('Blocked API access until password change is completed', [
                'user_id' => $user->id,
                'path' => $request->path(),
                'ip' => $request->ip(),
            ]);
        }

        return response()->json([
            'result' => false,
            'code' => 'PASSWORD_CHANGE_REQUIRED',
            'message' => 'Please change your password before continuing.',
        ], 423);
    }
}
