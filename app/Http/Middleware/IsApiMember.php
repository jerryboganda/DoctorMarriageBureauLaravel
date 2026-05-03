<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Auth;
use Cache;
use Carbon\Carbon;

class IsApiMember
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse)  $next
     * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
     */
    public function handle(Request $request, Closure $next)
    {
        $user = auth()->user();

        // Track online status for API users (cache for 3 minutes)
        if ($user) {
            $expiresAt = Carbon::now()->addMinutes(3);
            Cache::put('user-is-online-' . $user->id, true, $expiresAt);
        }

        // Check deactivated users first (across all API routes)
        if ($user->deactivated == 1) {
            // Revoke current token so they can't keep using it
            if ($user->currentAccessToken()) {
                $user->currentAccessToken()->delete();
            }
            return response()->json([
                'result' => false,
                'status' => 'deactivated',
                'code' => 'ACCOUNT_DEACTIVATED',
                'message' => translate('Your account has been deactivated by the administrator. Please contact support for assistance.')
            ], 403);
        }

        // Check blocked users
        if ($user->blocked == 1) {
            if ($user->currentAccessToken()) {
                $user->currentAccessToken()->delete();
            }
            return response()->json([
                'result' => false,
                'status' => 'blocked',
                'code' => 'ACCOUNT_BLOCKED',
                'message' => translate('Your account has been blocked. Please contact support for assistance.')
            ], 403);
        }

        // Check approved status
        if ($user->approved == 0) {
            return response()->json([
                'result' => false,
                'status' => 'non_verified',
                'message' => translate('User is not verified')
            ]);
        }

        return $next($request);
    }
}
