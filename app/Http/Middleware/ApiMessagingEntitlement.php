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
            if ($request->is('api/member/chat-reply') || $request->is('api/member/chat/share-biodata')) {
                if ($allowanceError = $limits->ensureCanSendVerifiedFreeMessage($user)) {
                    return $allowanceError;
                }

                return $next($request);
            }

            return $limits->subscriptionRequiredResponse();
        }

        return $next($request);
    }
}
