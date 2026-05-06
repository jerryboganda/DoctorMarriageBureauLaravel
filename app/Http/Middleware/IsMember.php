<?php

namespace App\Http\Middleware;

use Closure;
use Auth;
use Cache;
use Carbon\Carbon;

class IsMember
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle($request, Closure $next)
    {
        // $user = auth()->user();
        // //$user->tokens()->where('id', $user->currentAccessToken()->id)->delete();
        // if ($request->is('api/*') && $user->blocked == 1) {
        //     return response()->json([
        //         'result' => false,
        //         'status' => 'blocked',
        //         'message' => translate('user is banned')
        //     ]);
        // }

        if (Auth::check() && Auth::user()->user_type == 'member') {

            $expiresAt = Carbon::now()->addMinutes(3);
            Cache::put('user-is-online-' . Auth::user()->id, true, $expiresAt);

            // Check deactivated status
            if (Auth::user()->deactivated == 1) {
                Auth::logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();
                flash(translate('Your account has been deactivated by the administrator. Please contact support for assistance.'))->error();
                return redirect()->route('user.login');
            }

            if (Auth::user()->approved == 0 && !$this->isLimitedCommunicationRoute($request)) {
                flash(translate("Please verify your account."));
                return redirect()->route('member.verification');
            } else {
                if (Auth::user()->blocked == 1) {
                    return redirect()->route('user.blocked');
                } else {
                    return $next($request);
                }
            }
        } else {
            session(['link' => url()->current()]);
            return redirect()->route('user.login');
        }
    }

    private function isLimitedCommunicationRoute($request): bool
    {
        $routeName = optional($request->route())->getName();

        return in_array($routeName, [
            'my_interests.index',
            'interest_requests',
            'express-interest.index',
            'express-interest.store',
            'accept_interest',
            'reject_interest',
            'express_interest.accept_all',
            'express_interest.reject_all',
            'all.messages',
            'chat_view',
            'chat.reply',
            'chat_refresh',
            'get-old-message',
        ], true) || $request->is(
            'legacy-api/check-interest-status/*',
            'legacy-api/express-interest',
            'legacy-api/interest/accept',
            'legacy-api/interest/decline'
        );
    }
}
