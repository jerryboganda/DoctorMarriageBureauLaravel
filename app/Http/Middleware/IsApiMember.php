<?php

namespace App\Http\Middleware;

use Cache;
use Carbon\Carbon;
use Closure;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class IsApiMember
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response|RedirectResponse)  $next
     * @return Response|RedirectResponse
     */
    public function handle(Request $request, Closure $next)
    {
        $user = auth()->user();

        // Track online status for API users (cache for 3 minutes)
        if ($user) {
            $expiresAt = Carbon::now()->addMinutes(3);
            Cache::put('user-is-online-'.$user->id, true, $expiresAt);
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
                'message' => translate('Your account has been deactivated by the administrator. Please contact support for assistance.'),
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
                'message' => translate('Your account has been blocked. Please contact support for assistance.'),
            ], 403);
        }

        // Check approved status, but allow limited communication routes to apply their own quotas.
        if ($user->approved == 0 && ! $this->allowsUnverifiedCommunication($request)) {
            return response()->json([
                'result' => false,
                'status' => 'non_verified',
                'message' => translate('User is not verified'),
            ]);
        }

        return $next($request);
    }

    private function allowsUnverifiedCommunication(Request $request): bool
    {
        $path = trim($request->path(), '/');

        return in_array($path, [
            'api/member/chat-list',
            'api/member/chat-reply',
            'api/member/chat/old-messages',
            'api/member/chat/share-biodata',
            'api/member/express-interest',
            'api/express-interest',
        ], true) || preg_match('#^api/member/chat-view/[^/]+$#', $path);
    }
}
