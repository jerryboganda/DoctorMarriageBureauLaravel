<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Providers\RouteServiceProvider;
use App\Services\ReferralService;
use Carbon\Carbon;
use Illuminate\Foundation\Auth\VerifiesEmails;
use Illuminate\Http\Request;

class VerificationController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Email Verification Controller
    |--------------------------------------------------------------------------
    |
    | This controller is responsible for handling email verification for any
    | user that recently registered with the application. Emails may also
    | be re-sent if the user didn't receive the original email message.
    |
    */

    use VerifiesEmails;

    /**
     * Where to redirect users after verification.
     *
     * @var string
     */
    protected $redirectTo = RouteServiceProvider::HOME;

    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware('signed')->only('verify');
        $this->middleware('throttle:6,1')->only('verify', 'resend');
    }

    public function show(Request $request)
    {
        if ($request->user()->email != null) {
            return $request->user()->hasVerifiedEmail()
                            ? redirect($this->redirectPath())
                            : view('auth.verify');
        } else {
            // For phone-only users, redirect to verification page
            // The OTP will be sent via the existing notification system
            return redirect()->route('verification');
        }
    }

    public function resend(Request $request)
    {
        if ($request->user()->hasVerifiedEmail()) {
            return redirect($this->redirectPath());
        }

        $request->user()->sendEmailVerificationNotification();

        return back()->with('resent', true);
    }

    public function verification_confirmation($code)
    {
        $user = User::where('verification_code', $code)->first();
        if ($user != null) {
            $user->email_verified_at = Carbon::now();
            $user->save();

            try {
                (new ReferralService)->checkAndQualifyReferral($user->id);
            } catch (\Exception $e) {
                \Log::error('Referral qualification check failed after web email verification: '.$e->getMessage(), ['user_id' => $user->id]);
            }

            auth()->login($user, true);
            flash(translate('Your email has been verified successfully'))->success();
        } else {
            flash(translate('Sorry, we could not verifiy you. Please try again'))->error();
        }

        return redirect()->route('dashboard');
    }
}
