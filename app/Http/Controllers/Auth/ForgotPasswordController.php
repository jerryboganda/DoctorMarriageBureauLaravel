<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Foundation\Auth\SendsPasswordResetEmails;
use App\Utility\EmailUtility;
use App\Utility\SmsUtility;
use Illuminate\Http\Request;
use App\Models\User;

class ForgotPasswordController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Password Reset Controller
    |--------------------------------------------------------------------------
    |
    | This controller is responsible for handling password reset emails and
    | includes a trait which assists in sending these notifications from
    | your application to your users. Feel free to explore this trait.
    |
    */

    use SendsPasswordResetEmails;

    /**
     * Send a reset link to the given user.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse|\Illuminate\Http\JsonResponse
     */

    public function sendResetLinkEmail(Request $request)
    {
        if (filter_var($request->email, FILTER_VALIDATE_EMAIL)) {
            $user = User::where('email', $request->email)->whereNull('deleted_at')->first();
            if ($user != null) {
                $user->verification_code = rand(100000,999999);
                $user->save();

                EmailUtility::password_reset_email($user, $user->verification_code);
                return view('auth.passwords.reset', ['email' => $request->email]);
            }
            else {
                return view('auth.passwords.email')
                    ->with('password_error', translate('No account exists with this email'))
                    ->with('oldEmail', $request->email);
            }
        }
        else{
            $user = User::where('phone', $request->email)->whereNull('deleted_at')->first();
            if ($user != null) {
                $user->verification_code = rand(100000,999999);
                $user->save();

                SmsUtility::password_reset($user , $user->verification_code);
                return view('addons.otp_systems.frontend.auth.passwords.reset_with_phone');
            }
            else {
                return view('auth.passwords.email')
                    ->with('password_error', translate('No account exists with this phone number'))
                    ->with('oldEmail', $request->email);
            }
        }
    }
}
