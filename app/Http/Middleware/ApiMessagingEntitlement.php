<?php

namespace App\Http\Middleware;

use App\Services\MemberCommunicationLimitService;
use Closure;
use Illuminate\Http\Request;

class ApiMessagingEntitlement
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        $limits = new MemberCommunicationLimitService;

        if ($limits->isVerified($user) && (int) $user->membership !== 2) {
            return $limits->subscriptionRequiredResponse();
        }

        return $next($request);
    }
}
