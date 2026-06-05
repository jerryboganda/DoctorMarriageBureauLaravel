<?php

namespace App\Http\Middleware;

use Auth;
use Cache;
use Carbon\Carbon;
use Closure;
use Illuminate\Http\Request;

class LastUserActivity
{
    /**
     * Handle an incoming request.
     *
     * @param  Request  $request
     * @return mixed
     */
    public function handle($request, Closure $next)
    {
        // Check user is online or offline
        if (Auth::check()) {
            $expiresAt = Carbon::now()->addMinutes(3);
            Cache::put('user-is-online-'.Auth::user()->id, true, $expiresAt);
        }

        return $next($request);
    }
}
