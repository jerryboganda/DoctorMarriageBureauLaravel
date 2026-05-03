<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Foundation\Auth\SendsPasswordResetEmails;
use App\Utility\EmailUtility;
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
        $email = $request->email;

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return view('auth.passwords.email')
                ->with('password_error', translate('Password reset is email-only. Please enter your email address.'))
                ->with('oldEmail', $email);
        }

        $user = User::where('email', $email)->whereNull('deleted_at')->first();
        if ($user != null) {
            $user->verification_code = rand(100000,999999);
            $user->save();

            EmailUtility::password_reset_email($user, $user->verification_code);
            return view('auth.passwords.reset', ['email' => $email]);
        }

        return view('auth.passwords.email')
            ->with('password_error', translate('No account exists with this email'))
            ->with('oldEmail', $email);
    }
}
