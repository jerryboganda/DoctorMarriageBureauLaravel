<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Controller;
use App\Http\Requests\AuthRequest;
use App\Http\Resources\Profile\MaritialStatusResource;
use App\Models\EmailTemplate;
use App\Models\MaritalStatus;
use App\Models\Member;
use App\Models\Notification;
use App\Models\Package;
use App\Models\User;
use App\Models\UserTwoFactorSetting;
use App\Notifications\AppEmailVerificationNotification;
use App\Notifications\DbStoreNotification;
use App\Notifications\VerificationCode;
use App\Services\MemberService;
use App\Services\UserService;
use App\Utility\EmailUtility;
use App\Utility\PhoneUtility;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\PersonalAccessToken;
use Socialite;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use App\Rules\RecaptchaRule;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * Registration using api
     */
    public function signup(AuthRequest $request)
    {
        // Verification is handled by frontend before API call
        // Both email and phone are required fields, so proceed with registration

        $user_service = new UserService();
        $user = $user_service->store($request->safe()->except(['gender', 'birthday', 'on_behalves_id', 'date_of_birth', 'on_behalf']));

        $package = Package::where('id', 1)->first();
        $member_service = new MemberService();
        $request->merge(['user_id' => $user->id]);
        $member = $member_service->store($request->only(['gender', 'birthday', 'on_behalves_id', 'user_id']), $package);

        if (addon_activation('otp_system') && $request->phone != null) {
            try {
                // Generate verification code for the user
                $verificationCode = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
                $user->verification_code = $verificationCode;
                $user->save();

                // Send SMS verification code
                $smsBody = 'Your Doctor Marriage Bureau verification code is ' . $verificationCode;

                // Check SMS provider status - either from settings or .env
                $nexmoActive = get_setting('nexmo_activation') == 1 || (env('NEXMO_KEY') && env('NEXMO_SECRET'));
                $twilioActive = get_setting('twillo_activation') == 1 || (env('TWILIO_SID') && env('TWILIO_AUTH_TOKEN'));
                $sslActive = get_setting('ssl_wireless_activation') == 1 || (env('SSL_SMS_API_TOKEN') && env('SSL_SMS_SID'));
                $fast2smsActive = get_setting('fast2sms_activation') == 1 || env('AUTH_KEY');

                \Log::info('=== OTP VERIFICATION ===');
                \Log::info('SMS Code for Testing: ' . $verificationCode . ' - Phone: ' . $request->phone);
                \Log::info('Timestamp: ' . now()->format('Y-m-d H:i:s'));

                // If no SMS provider is active, log the SMS instead of sending
                if (!$nexmoActive && !$twilioActive && !$sslActive && !$fast2smsActive) {
                    \Log::info('SMS (No Provider Active): To ' . $request->phone . ' - Code: ' . $verificationCode . ' - Message: ' . $smsBody);
                    \Log::info('=== END OTP VERIFICATION ===');
                } else {
                    if (function_exists('sendSMS')) {
                        $smsResult = sendSMS($request->phone, env('APP_NAME'), $smsBody, null);
                        \Log::info('SMS Result: ' . json_encode($smsResult));
                    }
                }
            } catch (\Exception $e) {
                \Log::error('OTP sending failed during registration: ' . $e->getMessage());
                // Continue registration even if OTP fails
            }
        }
        // Email to member
        if ($request->email != null && env('MAIL_USERNAME') != null) {
            $account_oppening_email = EmailTemplate::where('identifier', 'account_oppening_email')->first();
            if ($account_oppening_email->status == 1) {
                try {
                    EmailUtility::account_oppening_email($user->id, $request->password);
                } catch (\Exception $e) {
                }
            }
        }

        try {
            $notify_type = 'member_registration';
            $id = unique_notify_id();
            $notify_by = $user->id;
            $info_id = $user->id;
            $message = translate('A new member has been registered to your system. Name: ') . $user->first_name . ' ' . $user->last_name;
            $route = route('members.index', $user->membership);

            Notification::send(User::where('user_type', 'admin')->first(), new DbStoreNotification($notify_type, $id, $notify_by, $info_id, $message, $route));
        } catch (\Exception $e) {
            // dd($e);
        }

        if (env('MAIL_USERNAME') != null && get_email_template('account_opening_email_to_admin', 'status') == 1) {
            $admin = User::where('user_type', 'admin')->first();
            EmailUtility::account_opening_email_to_admin($user, $admin);
        }
        // Set email_verified_at and approve user since verification is handled in frontend
        $user->email_verified_at = date('Y-m-d H:m:s');
        $user->approved = 1; // Auto-approve since verification is handled in frontend
        $user->save();

        
        // ===== Referral System Integration =====
        try {
            $referralService = new \App\Services\ReferralService();

            // Auto-generate referral code for the new user
            \App\Models\ReferralCode::getOrCreateForUser($user->id);

            // If a referral code was provided during signup, process the referral
            $referralCodeInput = $request->input('referral_code');
            if (!empty($referralCodeInput) && !empty($user->referred_by)) {
                $referralResult = $referralService->createReferral($user->referred_by, $user->id, $request->ip());
                if ($referralResult['success']) {
                    \Log::info("Referral created successfully for user {$user->id} referred by {$user->referred_by}");
                }
            }
        } catch (\Exception $e) {
            \Log::error("Referral processing error during signup: " . $e->getMessage());
            // Don't fail registration if referral processing fails
        }
        // ===== End Referral System Integration =====

        return $this->authResponse($user, $request);
    }

    /**
     * Login using api
     */

    public function signin(Request $request)
    {
        // Accept both 'email_or_phone' and 'email' for backward compatibility
        $identifier = $request->email_or_phone ?? $request->email ?? $request->phone;

        $normalizedPhone = PhoneUtility::normalize($identifier);

        // Debug logging
        \Log::info('=== SIGNIN ATTEMPT ===');
        \Log::info('Identifier: ' . $identifier);
        \Log::info('Normalized Phone: ' . $normalizedPhone);

        $user = User::where(function ($query) use ($identifier, $normalizedPhone) {
            $query->where('email', $identifier)
                ->orWhere('phone', $identifier)
                ->orWhere('phone', $normalizedPhone);
        })->whereNull('deleted_at')->first();

        if ($user != null) {
            \Log::info('User found: ID=' . $user->id . ', Email=' . $user->email . ', Phone=' . $user->phone);
            \Log::info('Password hash in DB: ' . substr($user->password, 0, 20) . '...');

            if (Hash::check($request->password, $user->password)) {
                \Log::info('Password check PASSED');
                $twoFactor = UserTwoFactorSetting::getOrCreate($user->id);
                if ($twoFactor->is_enabled) {
                    $user->two_factor_pending = true;
                    $user->two_factor_token = Str::random(64);
                    $user->two_factor_token_expires_at = now()->addMinutes(10);
                    $user->save();

                    return response()->json([
                        'result' => true,
                        'two_factor_required' => true,
                        'two_factor_token' => $user->two_factor_token,
                        'expires_at' => $user->two_factor_token_expires_at?->toISOString(),
                        'message' => 'Two-factor verification required.',
                    ]);
                }
                return $this->authResponse($user, $request);
            }
            \Log::warning('Password check FAILED for user ID=' . $user->id);
            return response()->json(['result' => false, 'message' => translate('Unauthorized'), 'user' => null], 401);
        }
        \Log::warning('No user found for identifier: ' . $identifier);
        return response()->json(['result' => false, 'message' => translate('User not found'), 'user' => null], 401);
    }

    /**
     * Social Login
     */
    /**
     * Social Login
     */
    public function socialLogin(Request $request)
    {
        $provider = $request->social_provider;
        $token = $request->access_token;

        if (!$provider || !$token) {
            return response()->json(['result' => false, 'message' => translate('Invalid Request')], 400);
        }

        try {
            if ($provider == 'google') {
                // Try Socialite first, then fallback to direct API call
                try {
                    $socialUser = Socialite::driver('google')->stateless()->userFromToken($token);
                } catch (\Exception $e) {
                    // Fallback: Call Google's userinfo API directly
                    \Log::info('Socialite failed, trying direct Google API: ' . $e->getMessage());
                    $client = new \GuzzleHttp\Client();
                    $response = $client->get('https://www.googleapis.com/oauth2/v3/userinfo', [
                        'headers' => [
                            'Authorization' => 'Bearer ' . $token,
                        ],
                    ]);
                    $googleUser = json_decode($response->getBody()->getContents());

                    if (!$googleUser || !isset($googleUser->sub)) {
                        throw new \Exception('Invalid Google token response');
                    }

                    // Create a simple user object matching Socialite's interface
                    $socialUser = new \stdClass();
                    $socialUser->id = $googleUser->sub;
                    $socialUser->email = $googleUser->email ?? null;
                    $socialUser->name = $googleUser->name ?? 'User';
                }
            } elseif ($provider == 'facebook') {
                $socialUser = Socialite::driver('facebook')->stateless()->userFromToken($token);
            } else {
                return response()->json(['result' => false, 'message' => translate('Provider not supported')], 400);
            }
        } catch (\Exception $e) {
            \Log::error('Social Login Error: ' . $e->getMessage());
            \Log::error('Social Login Stack: ' . $e->getTraceAsString());
            return response()->json(['result' => false, 'message' => translate('Unauthorized: Invalid Token'), 'user' => null], 401);
        }

        // 1. Try to find by Provider ID
        $socialId = is_object($socialUser) && method_exists($socialUser, 'getId') ? $socialUser->getId() : ($socialUser->id ?? null);
        $socialEmail = is_object($socialUser) && method_exists($socialUser, 'getEmail') ? $socialUser->getEmail() : ($socialUser->email ?? null);
        $socialName = is_object($socialUser) && method_exists($socialUser, 'getName') ? $socialUser->getName() : ($socialUser->name ?? 'User');

        $user = User::where('provider_id', $socialId)->first();

        // 2. If not found, try to find by Email
        if (!$user) {
            $user = User::where('email', $socialEmail)->first();
            if ($user) {
                // Link existing account
                $user->provider_id = $socialId;
                $user->email_verified_at = $user->email_verified_at ?? now();
                $user->save();
            }
        }

        if ($user) {
            // Login existing user
            if ($user->approved == 0) {
                return response()->json(['result' => false, 'message' => translate('Please wait for admin approval'), 'user' => null], 401);
            }
            return $this->authResponse($user, $request);
        }

        // 3. Create New User
        $newUser = new User;
        $newUser->first_name = $socialName;
        $newUser->email = $socialEmail;
        $newUser->email_verified_at = date('Y-m-d H:m:s');
        $newUser->provider_id = $socialId;
        $newUser->code = unique_code();
        $newUser->membership = 1;
        $newUser->approved = get_setting('member_verification') == 1 ? 0 : 1;
        $newUser->save();

        $member = new Member;
        $member->user_id = $newUser->id;
        $member->gender = null;
        $member->on_behalves_id = null;
        $member->birthday = null;

        $package = Package::where('id', 1)->first();
        if ($package) {
            $member->current_package_id = $package->id;
            $member->remaining_interest = $package->express_interest;
            $member->remaining_photo_gallery = $package->photo_gallery;
            $member->remaining_contact_view = $package->contact;
            $member->remaining_profile_viewer_view = $package->profile_viewers_view;
            $member->remaining_profile_image_view = $package->profile_image_view;
            $member->remaining_gallery_image_view = $package->gallery_image_view;
            $member->auto_profile_match = $package->auto_profile_match;
            $member->package_validity = Date('Y-m-d', strtotime($package->validity . " days"));
        }
        $member->save();

        if ($newUser->approved == 0) {
            return response()->json(['result' => false, 'message' => translate('Please wait for admin approval'), 'user' => null], 401);
        } else {
            return $this->authResponse($newUser, $request);
        }
    }

    /**
     * Log Out using api
     */

    public function logout(Request $request)
    {
        $user = auth()->user();
        $user
            ->tokens()
            ->where('id', $user->currentAccessToken()->id)
            ->delete();
        return $this->success_message('Successfully logged out');
    }

    /**
     * Log in success
     */

    protected function authResponse($user, ?Request $request = null)
    {
        $member = $user->member;
        $maritial_status = $member ? MaritalStatus::where('id', $member->marital_status_id)->first() : null;
        $tokenResult = $user->createToken('API Token');
        if ($request) {
            $this->attachTokenMetadata($tokenResult->accessToken, $request);
        }
        $token = $tokenResult->plainTextToken;
        $age = ($member && $member->birthday) ? Carbon::parse($member->birthday)->age : null;

        return response()->json([
            'result' => true,
            'message' => translate('Successfully logged in'),
            'access_token' => $token,
            'token_type' => 'Bearer',
            'expires_at' => null,
            'user' => [
                'id' => $user->id,
                'type' => $user->user_type,
                'name' => $user->first_name . ' ' . $user->last_name,
                'membership' => $user->membership,
                'email_verified_at' => $user->email_verified_at,
                'photo_approved' => $user->photo_approved,
                'blocked' => $user->blocked,
                'deactivated' => $user->deactivated,
                'approved' => $user->approved,
                'email' => $user->email,
                'birthday' => $age,
                'height' => $user->physical_attributes ? $user->physical_attributes->height : 0,
                'marital_status_id' => $maritial_status ? new MaritialStatusResource($maritial_status) : null,
                'avatar' => uploaded_asset($user->photo) ?? '',
                'avatar_original' => uploaded_asset($user->photo) ?? '',
                'phone' => $user->phone ?? '',
                'code' => $user->code,
            ],
        ]);
    }

    protected function attachTokenMetadata(PersonalAccessToken $token, Request $request): void
    {
        $token->update([
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'logged_in_at' => now(),
            'is_current' => true,
        ]);
    }

    /**
     * Forgot password request from forgot password form
     * generate a code and send it via email or phone
     */

    public function forgotPassword(Request $request)
    {
        // Auto-detect method and identifier
        $identifier = $request->email_or_phone ?? $request->email ?? $request->phone;
        $method = $request->send_code_by;

        if (!$identifier) {
            return response()->json([
                'result' => false,
                'message' => 'Email or phone number is required',
            ], 400);
        }

        $normalizedPhone = PhoneUtility::normalize($identifier);

        // Auto-detect method if not explicitly provided
        if (!$method) {
            if (filter_var($identifier, FILTER_VALIDATE_EMAIL)) {
                $method = 'email';
            } else {
                $method = 'phone';
                $identifier = $normalizedPhone;
            }
        } else if ($method === 'phone') {
            $identifier = $normalizedPhone;
        }

        // Find user based on method
        if ($method === 'email') {
            $this->validate($request, [
                'email_or_phone' => 'required|email',
            ]);
            $user = User::where('email', $identifier)->first();
        } else {
            // Phone method
            $this->validate($request, [
                'email_or_phone' => 'required',
            ]);

            $phone = PhoneUtility::normalize($identifier);

            $user = User::where('phone', $phone)->whereNull('deleted_at')->first();
            if (!$user) {
                $user = User::where('phone', ltrim($phone, '+'))->whereNull('deleted_at')->first();
            }
        }

        if (!$user) {
            return response()->json([
                'result' => false,
                'message' => 'User not found with the provided ' . ($method === 'email' ? 'email address' : 'phone number'),
            ], 404);
        }

        // Generate 6-digit verification code
        $verificationCode = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
        $user->verification_code = $verificationCode;
        $user->save();

        if ($method === 'phone') {
            try {
                $phone = $user->phone;
                $smsBody = 'Your Doctor Marriage Bureau verification code is ' . $verificationCode . '. Do not share this code with anyone.';

                // Check SMS provider status
                $nexmoActive = get_setting('nexmo_activation') == 1 || (env('NEXMO_KEY') && env('NEXMO_SECRET'));
                $twilioActive = get_setting('twillo_activation') == 1 || (env('TWILIO_SID') && env('TWILIO_AUTH_TOKEN'));
                $sslActive = get_setting('ssl_wireless_activation') == 1 || (env('SSL_SMS_API_TOKEN') && env('SSL_SMS_SID'));
                $fast2smsActive = get_setting('fast2sms_activation') == 1 || env('AUTH_KEY');

                \Log::info('=== FORGOT PASSWORD OTP (Phone) ===');
                \Log::info('Verification Code: ' . $verificationCode);
                \Log::info('Phone: ' . $phone);
                \Log::info('Timestamp: ' . now()->format('Y-m-d H:i:s'));

                // If no SMS provider is active, log for testing
                if (!$nexmoActive && !$twilioActive && !$sslActive && !$fast2smsActive) {
                    \Log::info('SMS (Testing Mode - No Provider Active): ' . $smsBody);
                    \Log::info('=== END FORGOT PASSWORD OTP ===');
                } else {
                    // Try to send SMS using configured provider
                    if (function_exists('sendSMS')) {
                        $smsResult = sendSMS($phone, env('APP_NAME'), $smsBody, null);
                        \Log::info('SMS Result: ' . json_encode($smsResult));
                    }
                }

                return response()->json([
                    'result' => true,
                    'message' => 'Verification code sent to your phone number',
                ], 200);

            } catch (\Exception $e) {
                \Log::error('Phone OTP sending failed: ' . $e->getMessage());
                return response()->json([
                    'result' => false,
                    'message' => 'Failed to send verification code. Please try again.',
                ], 500);
            }
        } else {
            // Email method
            try {
                $emailResult = EmailUtility::password_reset_email($user, $verificationCode);

                if ($emailResult) {
                    \Log::info('Password reset email sent successfully to: ' . $user->email);
                    \Log::info('Verification Code (for testing): ' . $verificationCode);

                    return response()->json([
                        'result' => true,
                        'message' => 'Verification code sent to your email address',
                    ], 200);
                } else {
                    \Log::error('Failed to send password reset email to: ' . $user->email);
                    return response()->json([
                        'result' => false,
                        'message' => 'Failed to send reset code. Please check your SMTP settings or try again later.',
                    ], 500);
                }

            } catch (\Throwable $e) {
                \Log::error('Email sending fatal error: ' . $e->getMessage());
                return response()->json([
                    'result' => false,
                    'message' => 'An internal server error occurred while sending the reset code.',
                ], 500);
            }
        }
    }

    /**
     * Verify registered user first
     * Verify code
     */

    public function verifyCode(Request $request)
    {

        $user = auth()->user();

        $this->validate($request, [
            'verification_code' => 'required',
        ]);
        if ($user && $user->verification_code == $request->verification_code) {
            $user->email_verified_at = Carbon::now();
            $user->verification_code = null;

            $user->save();
            return $this->success_message('Your account is now verified');
        }
        return $this->failure_message('Verification code does not match!!');
    }

    public function resendVerifyCode(Request $request)
    {

        $user = auth()->user();
        // verification code send to user
        $user->verification_code = rand(1000, 999999);
        $user->save();
        try {
            $user->notify(new VerificationCode($user));
        } catch (\Exception $e) {
        }
        return response()->json(
            [
                'result' => true,
                'message' => 'OTP resend successfull.',

            ],
            200
        );
    }

    /**
     * Verify registered user first
     * Reset verification code
     * insert new password
     */

    public function resetPassword(Request $request)
    {
        // Handle parameters from different platforms
        $identifier = $request->email_or_phone ?? $request->email ?? $request->phone;
        $code = $request->code ?? $request->verification_code;
        $method = $request->send_code_by;

        if (!$identifier) {
            return $this->failure_message('Email or phone number is required');
        }

        if (!$code) {
            return $this->failure_message('Verification code is required');
        }

        $this->validate($request, [
            'password' => 'required|string|min:8|confirmed',
        ]);

        $normalizedPhone = PhoneUtility::normalize($identifier);

        // Auto-detect method if not explicitly provided
        if (!$method) {
            if (filter_var($identifier, FILTER_VALIDATE_EMAIL)) {
                $method = 'email';
            } else {
                $method = 'phone';
                $identifier = $normalizedPhone;
            }
        } else if ($method === 'phone') {
            $identifier = $normalizedPhone;
        }

        // Find user based on method
        if ($method === 'email') {
            $user = User::where('email', $identifier)->whereNull('deleted_at')->first();
        } else {
            $user = User::where('phone', $identifier)->whereNull('deleted_at')->first();
            if (!$user) {
                $user = User::where('phone', ltrim($identifier, '+'))->whereNull('deleted_at')->first();
            }
        }

        if (!$user) {
            return $this->failure_message('User not found!!');
        }

        if ($user->verification_code == $code) {
            $user->password = Hash::make($request['password']);
            $user->verification_code = null;
            $user->save();

            return response()->json([
                'result' => true,
                'message' => 'Password has been updated, you can login now'
            ]);
        }
        return $this->failure_message('Verification code does not match.');
    }

    /**
     * Verify Password Reset Code
     */
    public function verifyPasswordResetCode(Request $request)
    {
        $identifier = $request->email_or_phone ?? $request->email ?? $request->phone;
        $code = $request->code ?? $request->verification_code;

        if (!$identifier || !$code) {
            return response()->json([
                'result' => false,
                'message' => 'Identifier and code are required'
            ], 400);
        }

        $normalizedPhone = PhoneUtility::normalize($identifier);

        // Find user by email or phone
        $user = User::where(function ($query) use ($identifier, $normalizedPhone) {
            $query->where('email', $identifier)
                ->orWhere('phone', $identifier)
                ->orWhere('phone', $normalizedPhone)
                ->orWhere('phone', ltrim($normalizedPhone, '+'));
        })->whereNull('deleted_at')->first();

        if (!$user) {
            return response()->json([
                'result' => false,
                'message' => 'User not found'
            ], 404);
        }

        if ($user->verification_code === $code) {
            return response()->json([
                'result' => true,
                'message' => 'Code verified successfully'
            ]);
        }

        return response()->json([
            'result' => false,
            'message' => 'Invalid or expired verification code'
        ], 400);
    }

    public function authData($user)
    {
        // $user = auth()->user();
        $maritial_status = MaritalStatus::where('id', $user->member->marital_status_id)->first();
        $age = Carbon::parse($user->member->birthday)->age;
        return response()->json(
            [
                'id' => $user->id,
                'type' => $user->user_type,
                'name' => $user->first_name . ' ' . $user->last_name,
                'membership' => $user->membership,
                'email_verified_at' => $user->email_verified_at,
                'photo_approved' => $user->photo_approved,
                'blocked' => $user->blocked,
                'deactivated' => $user->deactivated,
                'approved' => $user->approved,
                'email' => $user->email,
                'birthday' => $age,
                'height' => $user->physical_attributes ? $user->physical_attributes->height : 0,
                'marital_status_id' => $maritial_status ? new MaritialStatusResource($maritial_status) : new MaritialStatusResource($maritial_status),
                'avatar' => uploaded_asset($user->photo) ?? '',
                'avatar_original' => uploaded_asset($user->photo) ?? '',
                'phone' => $user->phone ?? '',
            ]
        );
    }

    public function checkedData()
    {
        $user = auth()->user();
        return response()->json(
            [
                'id' => $user->id,
                'type' => $user->user_type,
                'name' => $user->first_name . ' ' . $user->last_name,
                'phone' => $user->phone ?? ''
            ]
        );
    }

    public function getUserByToken()
    {
        $token = PersonalAccessToken::findToken(request()->bearerToken());
        $user = null;
        if ($token) {
            $user = $token->tokenable;
            return $this->authData($user);
        }
        return response()->json(
            ['user' => $user]
        );
    }

    public function update_device_token(Request $request)
    {
        $user = User::find(auth()->user()->id);
        if (!$user) {
            return response()->json([
                'result' => false,
                'message' => translate("User not found.")
            ]);
        }

        $user->fcm_token = $request->device_token;


        $user->save();

        return response()->json([
            'result' => true,
            'message' => translate("device token updated")
        ]);
    }

    /**
     * Send Email Verification Code
     */
    public function sendEmailVerification(Request $request)
    {
        try {
            \Log::info('sendEmailVerification called for: ' . $request->email);

            $validator = Validator::make($request->all(), [
                'email' => 'required|email|max:255'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid email address'
                ], 400);
            }

            $email = $request->email;

            // Check for existing user if intent is signup
            if ($request->intent === 'signup') {
                $existingUser = User::where('email', $email)->whereNull('deleted_at')->first();
                if ($existingUser) {
                    return response()->json([
                        'success' => false,
                        'message' => translate('This email address is already registered. Please login instead.')
                    ], 400);
                }
            }

            // Check if there's already a valid OTP for this email
            $existingCode = \App\Models\VerificationCode::getActiveCode($email, 'email');
            if ($existingCode) {
                \Log::info('Using existing valid OTP for: ' . $email);
                // We'll still try to resend the email to be helpful
                $verificationCode = $existingCode->code;
            } else {
                // Generate 6-digit verification code
                $verificationCode = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);

                // Store verification code in database
                try {
                    \App\Models\VerificationCode::createCode($email, 'email', $verificationCode, 5);
                } catch (\Exception $dbEx) {
                    \Log::error('Database error creating code: ' . $dbEx->getMessage());
                    // If DB fails, we can still try to send the email for testing purposes
                }
            }

            $subject = 'Email Verification Code - ' . env('APP_NAME', 'Matrimonial Site');

            // Always use the blade view as it's more reliable
            Mail::send('emails.email_verification', ['verificationCode' => $verificationCode], function ($message) use ($email, $subject) {
                $fromEmail = env('MAIL_FROM_ADDRESS', 'noreply@example.com');
                $fromName = env('MAIL_FROM_NAME', 'Matrimonial Site');
                $message->from($fromEmail, $fromName)
                    ->to($email)
                    ->subject($subject);
            });

            \Log::info('Email sent successfully to: ' . $email . ' with code: ' . $verificationCode);

            return response()->json([
                'success' => true,
                'message' => 'Verification code sent to your email'
            ]);
        } catch (\Exception $e) {
            \Log::error('CRITICAL Email verification error: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Failed to send verification. Error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Send Phone Verification Code
     */
    public function sendPhoneVerification(Request $request)
    {
        // Prevent concurrent requests with a simple lock
        $lockKey = 'phone_otp_lock_' . $request->phone;
        if (cache()->has($lockKey)) {
            return response()->json([
                'success' => false,
                'message' => 'Request already in progress'
            ], 400);
        }

        // Set lock for 10 seconds
        cache()->put($lockKey, true, 10);

        $validator = Validator::make($request->all(), [
            'phone' => 'required|string|max:20'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid phone number'
            ], 400);
        }

        $phone = $request->phone;

        // Clean phone number: remove non-numeric chars except +
        $phone = preg_replace('/[^\d+]/', '', $phone);

        // Pakistani Number Logic: If starts with 03..., convert to +923...
        if (str_starts_with($phone, '03') && strlen($phone) === 11) {
            $phone = '+92' . substr($phone, 1);
        } elseif (str_starts_with($phone, '3') && strlen($phone) === 10) {
            $phone = '+92' . $phone;
        }

        // Check if phone number already exists for signup intent
        if ($request->intent === 'signup') {
            $existingUser = User::where('phone', $phone)->whereNull('deleted_at')->first();
            if ($existingUser) {
                return response()->json([
                    'success' => false,
                    'message' => translate('This phone number is already registered. Please login instead.')
                ], 400);
            }
        }

        // Check if there's already a valid OTP for this phone
        $existingCode = \App\Models\VerificationCode::getActiveCode($phone, 'phone');

        if ($existingCode) {
            // Return existing valid code instead of generating new one
            \Log::info('Using existing valid OTP for phone: ' . $phone . ' - Code: ' . $existingCode->code);
            return response()->json([
                'success' => true,
                'message' => 'Verification code sent to your phone'
            ]);
        }

        // Generate 6-digit verification code
        $verificationCode = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);

        // Store verification code in database
        \App\Models\VerificationCode::createCode($phone, 'phone', $verificationCode, 5); // 5 minutes expiry

        try {
            // Send SMS verification code using existing SMS utility
            $smsBody = 'Your Doctor Marriage Bureau verification code is ' . $verificationCode;

            // Check SMS provider status - either from settings or .env
            $nexmoActive = get_setting('nexmo_activation') == 1;
            $twilioActive = get_setting('twillo_activation') == 1 || (env('TWILIO_SID') && env('TWILIO_AUTH_TOKEN'));
            $sslActive = get_setting('ssl_wireless_activation') == 1 || (env('SSL_SMS_API_TOKEN') && env('SSL_SMS_SID'));
            $fast2smsActive = get_setting('fast2sms_activation') == 1 || env('AUTH_KEY');

            // Log active SMS provider
            if ($nexmoActive)
                \Log::info('SMS Provider: Nexmo Active');
            elseif ($twilioActive)
                \Log::info('SMS Provider: Twilio Active');
            elseif ($sslActive)
                \Log::info('SMS Provider: SSL Wireless Active');
            elseif ($fast2smsActive)
                \Log::info('SMS Provider: Fast2SMS Active');
            else
                \Log::info('SMS Provider: None Active - Logging only');

            // Always log SMS code for local testing
            \Log::info('=== PHONE VERIFICATION OTP ===');
            \Log::info('SMS Code for Testing: ' . $verificationCode . ' - Phone: ' . $phone);
            \Log::info('Timestamp: ' . now()->format('Y-m-d H:i:s'));

            // If no SMS provider is active, log the SMS instead of sending
            if (!$nexmoActive && !$twilioActive && !$sslActive && !$fast2smsActive) {
                \Log::info('SMS (No Provider Active): To ' . $phone . ' - Code: ' . $verificationCode . ' - Message: ' . $smsBody);
                \Log::info('=== END PHONE VERIFICATION OTP ===');
            } else {
                if (function_exists('sendSMS')) {
                    $smsResult = sendSMS($phone, env('APP_NAME'), $smsBody, null);
                    \Log::info('SMS Result: ' . json_encode($smsResult));
                    \Log::info('SMS sent to: ' . $phone . ' - Code: ' . $verificationCode);
                } else {
                    // Fallback - you can implement your SMS sending logic here
                    \Log::info('SMS function not found. SMS to ' . $phone . ': ' . $smsBody);
                }
            }

            // Release lock
            cache()->forget($lockKey);

            return response()->json([
                'success' => true,
                'message' => 'Verification code sent to your phone'
            ]);
        } catch (\Exception $e) {
            // Release lock on error
            cache()->forget($lockKey);

            \Log::error('Phone verification error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to send verification code. Please try again.'
            ], 500);
        }
    }

    /**
     * Verify Email Code
     */
    public function verifyEmailCode(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'code' => 'required|string|size:6'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid verification data'
            ], 400);
        }

        $email = $request->email;
        $code = $request->code;

        // Use the VerificationCode model to verify the code
        $verification = \App\Models\VerificationCode::verifyCode($email, 'email', $code);

        if (!$verification) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired verification code'
            ], 400);
        }

        // Find existing user by email
        $user = User::where('email', $email)->first();

        if ($user) {
            // Log in the user if they exist
            $user->email_verified_at = Carbon::now();
            $user->approved = 1;
            $user->save();

            return $this->authResponse($user, $request);
        }

        return response()->json([
            'success' => true,
            'result' => true, // React UI check
            'message' => 'Email verified successfully',
            'user' => null // Means proceed to signup
        ]);
    }

    /**
     * Verify Phone Code
     */
    public function verifyPhoneCode(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'phone' => 'required|string',
            'code' => 'required|string|size:6'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid verification data'
            ], 400);
        }

        $phone = PhoneUtility::normalize($request->phone);
        $code = $request->code;

        \Log::info('Phone verification attempt - Phone: ' . $phone . ', Code entered: ' . $code);

        // Use the VerificationCode model to verify the code
        $verification = \App\Models\VerificationCode::verifyCode($phone, 'phone', $code);

        // If not found, try without plus prefix if stored differently
        if (!$verification) {
            $phoneWithoutPlus = ltrim($phone, '+');
            \Log::info('Trying without plus: ' . $phoneWithoutPlus);
            $verification = \App\Models\VerificationCode::verifyCode($phoneWithoutPlus, 'phone', $code);
        }

        if (!$verification) {
            \Log::info('Verification failed: Invalid or expired code for phone: ' . $phone);
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired verification code'
            ], 400);
        }

        // If user is already logged in, we're done (the verification record is updated)
        if (auth()->guard('sanctum')->check()) {
            $user = auth()->guard('sanctum')->user();

            // Sync phone if different
            if ($user->phone !== $phone) {
                // Check if this phone is actually one of the variations verified
                $phoneMatches = ($user->phone === $phone || '+92' . ltrim($user->phone, '0') === $phone || $user->phone === '+92' . ltrim($phone, '0'));
                if (!$phoneMatches) {
                    $user->phone = $phone;
                    $user->save();
                }
            }

            return response()->json([
                'success' => true,
                'result' => true,
                'message' => 'Phone verified successfully',
                'user' => $user
            ]);
        }

        // Find existing user by phone (for Login via OTP)
        $existingUser = User::where('phone', $phone)->whereNull('deleted_at')->first();
        if (!$existingUser) {
            $existingUser = User::where('phone', '+91' . $phone)->whereNull('deleted_at')->first();
        }

        if ($existingUser) {
            // Log in the user if they exist
            $existingUser->email_verified_at = Carbon::now();
            $existingUser->approved = 1;
            $existingUser->save();

            return $this->authResponse($existingUser, $request);
        }

        return response()->json([
            'success' => true,
            'result' => true,
            'message' => 'Phone verified successfully',
            'user' => null
        ]);
    }
}
