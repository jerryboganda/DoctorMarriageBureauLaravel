<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\AuthRequest;
use App\Http\Resources\Profile\MaritialStatusResource;
use App\Models\EmailTemplate;
use App\Models\MaritalStatus;
use App\Models\Member;
use App\Models\Notification;
use App\Models\Package;
use App\Models\ReferralCode;
use App\Models\User;
use App\Models\UserTwoFactorSetting;
use App\Notifications\DbStoreNotification;
use App\Notifications\VerificationCode;
use App\Services\MemberService;
use App\Services\ReferralService;
use App\Services\UserService;
use App\Utility\EmailUtility;
use App\Utility\MemberUtility;
use App\Utility\PhoneUtility;
use Carbon\Carbon;
use GuzzleHttp\Client;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Laravel\Sanctum\PersonalAccessToken;
use Socialite;

class AuthController extends Controller
{
    /**
     * Registration using api
     */
    public function signup(AuthRequest $request)
    {
        $email = (string) $request->email;
        $verifiedEmail = \App\Models\VerificationCode::where('identifier', $email)
            ->where('type', 'email')
            ->where('verified', true)
            ->where('expires_at', '>', Carbon::now()->subMinutes(30))
            ->latest()
            ->first();

        if (! $verifiedEmail) {
            return response()->json([
                'result' => false,
                'message' => 'Please verify your email address before signup.',
            ], 422);
        }

        $user_service = new UserService;
        $user = $user_service->store($request->safe()->except(['gender', 'birthday', 'on_behalves_id', 'date_of_birth', 'on_behalf']));

        $package = Package::where('id', 1)->first();
        $member_service = new MemberService;
        $request->merge(['user_id' => $user->id]);
        $memberData = $request->only(['gender', 'birthday', 'on_behalves_id', 'user_id']);
        $memberData['birthday'] = $request->filled('date_of_birth')
            ? date('Y-m-d', strtotime((string) $request->input('date_of_birth')))
            : null;
        $member = $member_service->store($memberData, $package);

        // SMS delivery is intentionally disabled. Email verification is enforced
        // server-side before signup.
        // Email to member
        if ($request->email != null && EmailUtility::isConfigured()) {
            $account_oppening_email = EmailTemplate::where('identifier', 'account_oppening_email')->first();
            if ($account_oppening_email?->status == 1) {
                try {
                    EmailUtility::account_oppening_email($user->id, $request->password);
                } catch (\Exception $e) {
                }
            }
        }

        try {
            $notify_type = 'member_registration';
            $id = null;
            $notify_by = $user->id;
            $info_id = $user->id;
            $message = translate('A new member has been registered to your system. Name: ').$user->first_name.' '.$user->last_name;
            $route = route('members.index', $user->membership);

            Notification::send(User::where('user_type', 'admin')->first(), new DbStoreNotification($notify_type, $id, $notify_by, $info_id, $message, $route));
        } catch (\Exception $e) {
            // dd($e);
        }

        if (EmailUtility::isConfigured() && get_email_template('account_opening_email_to_admin', 'status') == 1) {
            $admin = User::where('user_type', 'admin')->first();
            EmailUtility::account_opening_email_to_admin($user, $admin);
        }
        $user->email_verified_at = Carbon::now();
        $user->approved = get_setting('member_verification') == 1 ? 0 : 1;
        $user->save();

        // ===== Referral System Integration =====
        try {
            $referralService = new ReferralService;

            // Auto-generate referral code for the new user
            ReferralCode::getOrCreateForUser($user->id);

            // If a referral code was provided during signup, process the referral
            $referralCodeInput = $request->input('referral_code');
            if (! empty($referralCodeInput)) {
                $referralResult = $referralService->createReferral($user->id, $referralCodeInput, 'link', [
                    'ip' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                ]);

                if (empty($referralResult['success'])) {
                    \Log::warning("Referral code could not be applied during signup for user {$user->id}: ".($referralResult['message'] ?? 'Unknown error'));
                } else {
                    \Log::info("Referral created successfully for user {$user->id}");
                }
            }
        } catch (\Exception $e) {
            \Log::error('Referral processing error during signup: '.$e->getMessage());
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
        $password = (string) ($request->password ?? '');

        if (empty($identifier) || $password === '') {
            return response()->json([
                'result' => false,
                'code' => 'MISSING_LOGIN_FIELDS',
                'message' => 'Please enter both your email or phone and password.',
                'user' => null,
            ], 422);
        }

        $normalizedPhone = PhoneUtility::normalize($identifier);

        $user = User::where(function ($query) use ($identifier, $normalizedPhone) {
            $query->where('email', $identifier)
                ->orWhere('phone', $identifier)
                ->orWhere('phone', $normalizedPhone);
        })->whereNull('deleted_at')->first();

        if ($user != null) {
            if (empty($user->password)) {
                return response()->json([
                    'result' => false,
                    'code' => 'PASSWORD_NOT_SET',
                    'message' => 'This account was created with social login. Please use Google login or ask admin to set a password for your account.',
                    'user' => null,
                ], 401);
            }

            if (Hash::check($password, $user->password)) {
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

            return response()->json([
                'result' => false,
                'code' => 'INVALID_PASSWORD',
                'message' => 'The password you entered is incorrect. Please try again.',
                'user' => null,
            ], 401);
        }

        return response()->json([
            'result' => false,
            'code' => 'ACCOUNT_NOT_FOUND',
            'message' => 'No account was found with this email or phone number.',
            'user' => null,
        ], 401);
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

        if (! $provider || ! $token) {
            return response()->json(['result' => false, 'message' => translate('Invalid Request')], 400);
        }

        try {
            if ($provider == 'google') {
                // Try Socialite first, then fallback to direct API call
                try {
                    $socialUser = Socialite::driver('google')->stateless()->userFromToken($token);
                } catch (\Exception $e) {
                    // Fallback: Call Google's userinfo API directly
                    \Log::info('Socialite failed, trying direct Google API: '.$e->getMessage());
                    $client = new Client;
                    $response = $client->get('https://www.googleapis.com/oauth2/v3/userinfo', [
                        'headers' => [
                            'Authorization' => 'Bearer '.$token,
                        ],
                    ]);
                    $googleUser = json_decode($response->getBody()->getContents());

                    if (! $googleUser || ! isset($googleUser->sub)) {
                        throw new \Exception('Invalid Google token response');
                    }

                    // Create a simple user object matching Socialite's interface
                    $socialUser = new \stdClass;
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
            \Log::error('Social Login Error: '.$e->getMessage());
            \Log::error('Social Login Stack: '.$e->getTraceAsString());

            return response()->json([
                'result' => false,
                'code' => 'INVALID_OR_EXPIRED_TOKEN',
                'message' => 'Your login session is invalid or expired. Please sign in again.',
                'user' => null,
            ], 401);
        }

        // 1. Try to find by Provider ID
        $socialId = is_object($socialUser) && method_exists($socialUser, 'getId') ? $socialUser->getId() : ($socialUser->id ?? null);
        $socialEmail = is_object($socialUser) && method_exists($socialUser, 'getEmail') ? $socialUser->getEmail() : ($socialUser->email ?? null);
        $socialName = is_object($socialUser) && method_exists($socialUser, 'getName') ? $socialUser->getName() : ($socialUser->name ?? 'User');

        $user = User::where('provider_id', $socialId)->whereNull('deleted_at')->first();

        // 2. If not found, try to find by Email
        if (! $user) {
            $user = User::where('email', $socialEmail)->whereNull('deleted_at')->first();
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

        ReferralCode::getOrCreateForUser($newUser->id);

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
            $member->package_validity = date('Y-m-d', strtotime($package->validity.' days'));
        }
        $member->save();

        try {
            $referralCodeInput = $request->input('referral_code');
            if (! empty($referralCodeInput)) {
                $referralService = new ReferralService;
                $referralResult = $referralService->createReferral($newUser->id, $referralCodeInput, 'link', [
                    'ip' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'source' => 'social_login',
                ]);

                if (empty($referralResult['success'])) {
                    \Log::warning("Referral code could not be applied during social signup for user {$newUser->id}: ".($referralResult['message'] ?? 'Unknown error'));
                }
            }
        } catch (\Exception $e) {
            \Log::error('Referral processing error during social login signup: '.$e->getMessage());
        }

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
        $age = MemberUtility::member_age($user->id);

        return response()->json([
            'result' => true,
            'message' => translate('Successfully logged in'),
            'access_token' => $token,
            'token_type' => 'Bearer',
            'expires_at' => null,
            'user' => [
                'id' => $user->id,
                'type' => $user->user_type,
                'name' => $user->first_name.' '.$user->last_name,
                'membership' => $user->membership,
                'email_verified_at' => $user->email_verified_at,
                'photo_approved' => $user->photo_approved,
                'blocked' => $user->blocked,
                'deactivated' => $user->deactivated,
                'approved' => $user->approved,
                'must_change_password' => (bool) $user->must_change_password,
                'email' => $user->email,
                'birthday' => $member?->birthday ?? null,
                'age' => $age,
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
        $email = $request->email_or_phone ?? $request->email;

        if (! $email || ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return response()->json([
                'result' => false,
                'message' => 'Password reset is email-only. Please enter your email address.',
            ], 422);
        }

        $user = User::where('email', $email)->whereNull('deleted_at')->first();

        if (! $user) {
            return response()->json([
                'result' => false,
                'message' => 'User not found with the provided email address',
            ], 404);
        }

        if (Cache::get('password_reset_attempts:'.$email, 0) >= 5) {
            return response()->json([
                'result' => false,
                'message' => 'Too many reset attempts. Please try again later.',
            ], 429);
        }

        $verificationCode = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $user->verification_code = $verificationCode;
        $user->save();
        \App\Models\VerificationCode::createCode($email, 'password_reset', $verificationCode, 15);
        Cache::put('password_reset_attempts:'.$email, Cache::get('password_reset_attempts:'.$email, 0) + 1, now()->addMinutes(15));

        try {
            $emailResult = EmailUtility::password_reset_email($user, $verificationCode);

            if ($emailResult) {
                \Log::info('Password reset email sent successfully to: '.$user->email);

                return response()->json([
                    'result' => true,
                    'message' => 'Verification code sent to your email address',
                ], 200);
            }

            \Log::error('Failed to send password reset email to: '.$user->email);

            return response()->json([
                'result' => false,
                'message' => 'Failed to send reset code. Please check your SMTP settings or try again later.',
            ], 500);
        } catch (\Throwable $e) {
            \Log::error('Email sending fatal error: '.$e->getMessage());

            return response()->json([
                'result' => false,
                'message' => 'An internal server error occurred while sending the reset code.',
            ], 500);
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
        $email = $request->email_or_phone ?? $request->email;
        $code = $request->code ?? $request->verification_code;

        if (! $email || ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $this->failure_message('Password reset is email-only. Please enter your email address.');
        }

        if (! $code) {
            return $this->failure_message('Verification code is required');
        }

        $this->validate($request, [
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::where('email', $email)->whereNull('deleted_at')->first();

        if (! $user) {
            return $this->failure_message('No account was found with the provided email address.');
        }

        $validCode = \App\Models\VerificationCode::verifyCode($email, 'password_reset', $code)
            || hash_equals((string) $user->verification_code, (string) $code);

        if ($validCode) {
            $user->password = Hash::make($request['password']);
            $user->verification_code = null;
            $user->save();
            Cache::forget('password_reset_attempts:'.$email);

            return response()->json([
                'result' => true,
                'message' => 'Password has been updated, you can login now',
            ]);
        }

        return $this->failure_message('Verification code does not match.');
    }

    /**
     * Verify Password Reset Code
     */
    public function verifyPasswordResetCode(Request $request)
    {
        $email = $request->email_or_phone ?? $request->email;
        $code = $request->code ?? $request->verification_code;

        if (! $email || ! $code) {
            return response()->json([
                'result' => false,
                'message' => 'Email and code are required',
            ], 400);
        }

        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return response()->json([
                'result' => false,
                'message' => 'Password reset is email-only. Please enter your email address.',
            ], 422);
        }

        $user = User::where('email', $email)->whereNull('deleted_at')->first();

        if (! $user) {
            return response()->json([
                'result' => false,
                'message' => 'User not found',
            ], 404);
        }

        $verification = \App\Models\VerificationCode::where('identifier', $email)
            ->where('type', 'password_reset')
            ->where('code', $code)
            ->where('expires_at', '>', Carbon::now())
            ->latest()
            ->first();

        if ($verification || hash_equals((string) $user->verification_code, (string) $code)) {
            return response()->json([
                'result' => true,
                'message' => 'Code verified successfully',
            ]);
        }

        return response()->json([
            'result' => false,
            'message' => 'Invalid or expired verification code',
        ], 400);
    }

    public function authData($user)
    {
        // $user = auth()->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $member = $user->member;
        $maritial_status = $member ? MaritalStatus::where('id', $member->marital_status_id)->first() : null;

        return response()->json(
            [
                'id' => $user->id,
                'type' => $user->user_type,
                'name' => $user->first_name.' '.$user->last_name,
                'membership' => $user->membership,
                'email_verified_at' => $user->email_verified_at,
                'photo_approved' => $user->photo_approved,
                'blocked' => $user->blocked,
                'deactivated' => $user->deactivated,
                'approved' => $user->approved,
                'must_change_password' => (bool) ($user->must_change_password ?? false),
                'email' => $user->email,
                'birthday' => $member?->birthday ?? null,
                'age' => MemberUtility::member_age($user->id),
                'height' => $user->physical_attributes ? $user->physical_attributes->height : 0,
                'marital_status_id' => $maritial_status ? new MaritialStatusResource($maritial_status) : new MaritialStatusResource($maritial_status),
                'avatar' => uploaded_asset($user->photo) ?? '',
                'avatar_original' => uploaded_asset($user->photo) ?? '',
                'phone' => $user->phone ?? '',
                'is_visible' => (bool) ($member->is_visible ?? true),
                'incognito' => MemberUtility::member_is_incognito($user->id),
                'travel_mode' => (bool) ($member->travel_mode ?? false),
                'travel_city' => $member->travel_city ?? null,
                'travel_country' => $member->travel_country ?? null,
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
                'name' => $user->first_name.' '.$user->last_name,
                'phone' => $user->phone ?? '',
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
        if (! $user) {
            return response()->json([
                'result' => false,
                'message' => translate('User not found.'),
            ]);
        }

        $user->fcm_token = $request->device_token;

        $user->save();

        return response()->json([
            'result' => true,
            'message' => translate('device token updated'),
        ]);
    }

    /**
     * Send Email Verification Code
     */
    public function sendEmailVerification(Request $request)
    {
        try {
            \Log::info('sendEmailVerification called for: '.$request->email);

            $validator = Validator::make($request->all(), [
                'email' => 'required|email|max:255',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid email address',
                ], 400);
            }

            $email = $request->email;

            // Check for existing user if intent is signup
            if ($request->intent === 'signup') {
                $existingUser = User::where('email', $email)->whereNull('deleted_at')->first();
                if ($existingUser) {
                    return response()->json([
                        'success' => false,
                        'message' => translate('This email address is already registered. Please login instead.'),
                    ], 400);
                }
            }

            // Check if there's already a valid OTP for this email
            $existingCode = \App\Models\VerificationCode::getActiveCode($email, 'email');
            if ($existingCode) {
                \Log::info('Using existing valid email verification code for: '.$email);
                // We'll still try to resend the email to be helpful
                $verificationCode = $existingCode->code;
            } else {
                // Generate 6-digit verification code
                $verificationCode = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

                // Store verification code in database
                try {
                    \App\Models\VerificationCode::createCode($email, 'email', $verificationCode, 5);
                } catch (\Exception $dbEx) {
                    \Log::error('Database error creating code: '.$dbEx->getMessage());
                    // If DB fails, we can still try to send the email for testing purposes
                }
            }

            $subject = 'Email Verification Code - '.env('APP_NAME', 'Matrimonial Site');

            // Always use the blade view as it's more reliable
            Mail::send('emails.email_verification', ['verificationCode' => $verificationCode], function ($message) use ($email, $subject) {
                $fromEmail = EmailUtility::fromAddress();
                $fromName = EmailUtility::fromName();
                $message->from($fromEmail, $fromName)
                    ->to($email)
                    ->subject($subject);
            });

            \Log::info('Email verification code sent successfully to: '.$email);

            return response()->json([
                'success' => true,
                'message' => 'Verification code sent to your email',
            ]);
        } catch (\Exception $e) {
            \Log::error('CRITICAL Email verification error: '.$e->getMessage());
            \Log::error($e->getTraceAsString());

            return response()->json([
                'success' => false,
                'message' => 'Failed to send verification. Error: '.$e->getMessage(),
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
            'code' => 'required|string|size:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid verification data',
            ], 400);
        }

        $email = $request->email;
        $code = $request->code;

        // Use the VerificationCode model to verify the code
        $verification = \App\Models\VerificationCode::verifyCode($email, 'email', $code);

        if (! $verification) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired verification code',
            ], 400);
        }

        // Find existing user by email
        $user = User::where('email', $email)->whereNull('deleted_at')->first();

        if ($user) {
            // Log in the user if they exist
            $user->email_verified_at = Carbon::now();
            $user->approved = 1;
            $user->save();

            try {
                (new ReferralService)->checkAndQualifyReferral($user->id);
            } catch (\Exception $e) {
                \Log::error('Referral qualification check failed after email verification: '.$e->getMessage(), ['user_id' => $user->id]);
            }

            return $this->authResponse($user, $request);
        }

        return response()->json([
            'success' => true,
            'result' => true, // React UI check
            'message' => 'Email verified successfully',
            'user' => null, // Means proceed to signup
        ]);
    }
}
