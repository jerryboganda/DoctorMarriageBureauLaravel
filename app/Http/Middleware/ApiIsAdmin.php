<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class ApiIsAdmin
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if ($user && in_array($user->user_type, ['admin', 'staff'], true)) {
            return $next($request);
        }

        return response()->json([
            'result' => false,
            'message' => 'Unauthorized',
        ], 403);
    }
}
