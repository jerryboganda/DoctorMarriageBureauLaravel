<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class ApiMessagingEntitlement
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (!$user || (int) $user->membership !== 2) {
            return response()->json([
                'result' => false,
                'code' => 'SUBSCRIPTION_REQUIRED',
                'message' => 'Messaging is a premium feature. Please subscribe to a premium package.',
            ], 403);
        }

        return $next($request);
    }
}
