<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;
use App\Models\User;
use App\Models\UserTwoFactorSetting;
use App\Models\TrustedContact;
use App\Models\StepUpAuthToken;
use App\Events\AccountUpdated;
use Laravel\Sanctum\PersonalAccessToken;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;

class AccountSecurityController extends Controller
{
    /**
     * Get full account security status
     */
    public function getSecurityStatus(Request $request): JsonResponse
    {
        $user = Auth::user();

        return response()->json([
            'success' => true,
            'data' => [
                'credentials' => $this->getCredentialStatus($user),
                'two_factor' => $this->getTwoFactorStatus($user),
                'devices' => $this->getDeviceSessions($user, $request),
                'trusted_contacts' => $this->getTrustedContacts($user),
                'recovery_options' => $this->getRecoveryOptions($user),
            ],
        ]);
    }

    /**
     * Get credential verification status
     */
    protected function getCredentialStatus(User $user): array
    {
        $member = $user->member;

        // Use the User model robust check for phone verification status
        $phoneVerified = $user->isPhoneVerified();
        $phoneVerifiedAt = $user->phone_verified_at;

        return [
            'email' => [
                'value' => $this->maskEmail($user->email),
                'raw' => $user->email, // Needed for verification API
                'verified' => (bool) $user->email_verified_at,
                'verified_at' => $user->email_verified_at?->toISOString(),
            ],
            'phone' => [
                'value' => $this->maskPhone($member->phone ?? $user->phone ?? null),
                'raw' => $member->phone ?? $user->phone ?? null, // Needed for verification API
                'verified' => $phoneVerified,
                'verified_at' => $phoneVerifiedAt ? $phoneVerifiedAt->toISOString() : null,
            ],
            'social_logins' => $this->getSocialLogins($user),
        ];
    }

    /**
     * Get linked social logins
     */
    protected function getSocialLogins(User $user): array
    {
        $logins = [];

        // The schema uses a single provider_id column
        // Check if user has a linked social account
        if (!empty($user->provider_id)) {
            // Since we only store provider_id without provider name,
            // we can indicate there's a linked social account
            $logins[] = [
                'provider' => 'social',
                'connected' => true,
                'email' => $user->email,
            ];
        }

        return $logins;
    }

    /**
     * Get 2FA status
     */
    protected function getTwoFactorStatus(User $user): array
    {
        $settings = UserTwoFactorSetting::getOrCreate($user->id);

        return [
            'enabled' => $settings->is_enabled,
            'method' => $settings->method,
            'confirmed_at' => $settings->confirmed_at?->toISOString(),
            'backup_phone' => $settings->masked_backup_phone,
            'recovery_codes_remaining' => count($settings->getRecoveryCodes()),
            'is_locked' => $settings->isLocked(),
            'locked_until' => $settings->locked_until?->toISOString(),
        ];
    }

    /**
     * Get active device sessions
     */
    protected function getDeviceSessions(User $user, Request $request): array
    {
        $currentTokenId = $user->currentAccessToken()?->id;

        $tokens = PersonalAccessToken::where('tokenable_type', get_class($user))
            ->where('tokenable_id', $user->id)
            ->orderBy('last_used_at', 'desc')
            ->get();

        return $tokens->map(function ($token) use ($currentTokenId) {
            return [
                'id' => $token->id,
                'device_name' => $token->device_name ?? $this->parseDeviceName($token->user_agent),
                'device_type' => $token->device_type ?? 'unknown',
                'browser' => $token->browser ?? $this->parseBrowser($token->user_agent),
                'os' => $token->os ?? $this->parseOS($token->user_agent),
                'location' => $this->formatLocation($token),
                'ip_address' => $this->maskIp($token->ip_address),
                'is_current' => $token->id === $currentTokenId,
                'last_used_at' => $token->last_used_at?->toISOString(),
                'logged_in_at' => $token->logged_in_at?->toISOString() ?? $token->created_at->toISOString(),
            ];
        })->toArray();
    }

    /**
     * Get trusted contacts
     */
    protected function getTrustedContacts(User $user): array
    {
        return TrustedContact::getForUser($user->id)
            ->map(fn($c) => $c->toApiResponse())
            ->toArray();
    }

    /**
     * Get recovery options
     */
    protected function getRecoveryOptions(User $user): array
    {
        $trustedCount = TrustedContact::where('user_id', $user->id)
            ->where('is_verified', true)
            ->count();

        return [
            'email_recovery' => (bool) $user->email_verified_at,
            'phone_recovery' => (bool) ($user->phone ?? $user->member?->phone),
            'trusted_contacts' => $trustedCount,
            'security_questions' => false, // Not implemented
        ];
    }

    // ==================== DEVICE MANAGEMENT ====================

    /**
     * Revoke a specific device session
     */
    public function revokeDevice(Request $request, int $tokenId): JsonResponse
    {
        $user = Auth::user();
        $currentTokenId = $user->currentAccessToken()?->id;

        if ($tokenId === $currentTokenId) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot revoke current session. Use logout instead.',
            ], 400);
        }

        $token = PersonalAccessToken::where('tokenable_type', get_class($user))
            ->where('tokenable_id', $user->id)
            ->where('id', $tokenId)
            ->first();

        if (!$token) {
            return response()->json([
                'success' => false,
                'message' => 'Device session not found.',
            ], 404);
        }

        $token->delete();

        broadcast(new AccountUpdated($user->id, 'device_revoked', [
            'token_id' => $tokenId,
        ]))->toOthers();

        return response()->json([
            'success' => true,
            'message' => 'Device session revoked successfully.',
        ]);
    }

    /**
     * Revoke all other device sessions
     */
    public function revokeOtherDevices(Request $request): JsonResponse
    {
        $user = Auth::user();
        $currentTokenId = $user->currentAccessToken()?->id;

        $count = PersonalAccessToken::where('tokenable_type', get_class($user))
            ->where('tokenable_id', $user->id)
            ->where('id', '!=', $currentTokenId)
            ->delete();

        broadcast(new AccountUpdated($user->id, 'devices_revoked', [
            'count' => $count,
        ]))->toOthers();

        return response()->json([
            'success' => true,
            'message' => "Successfully signed out of {$count} other device(s).",
            'count' => $count,
        ]);
    }

    // ==================== TWO-FACTOR AUTHENTICATION ====================

    /**
     * Setup 2FA - Generate secret and QR code
     */
    public function setup2FA(Request $request): JsonResponse
    {
        $user = Auth::user();
        $settings = UserTwoFactorSetting::getOrCreate($user->id);

        if ($settings->is_enabled) {
            return response()->json([
                'success' => false,
                'message' => 'Two-factor authentication is already enabled.',
            ], 400);
        }

        $request->validate([
            'method' => 'sometimes|in:app,sms,email',
        ]);

        $method = $request->input('method', 'app');
        $settings->update(['method' => $method]);

        $response = [
            'success' => true,
            'method' => $method,
        ];

        if ($method === 'app') {
            // Generate TOTP secret
            $secret = $settings->generateSecret();
            $qrCodeUri = $settings->getQrCodeUri('Doctor Marriage Bureau');

            // Generate QR code SVG
            $renderer = new ImageRenderer(
                new RendererStyle(200),
                new SvgImageBackEnd()
            );
            $writer = new Writer($renderer);
            $qrCodeSvg = $writer->writeString($qrCodeUri);

            $response['secret'] = $secret;
            $response['qr_code'] = 'data:image/svg+xml;base64,' . base64_encode($qrCodeSvg);
            $response['manual_entry_key'] = chunk_split($secret, 4, ' ');
        }

        return response()->json($response);
    }

    /**
     * Verify and enable 2FA
     */
    public function verify2FA(Request $request): JsonResponse
    {
        $user = Auth::user();
        $settings = UserTwoFactorSetting::getOrCreate($user->id);

        if ($settings->is_enabled) {
            return response()->json([
                'success' => false,
                'message' => 'Two-factor authentication is already enabled.',
            ], 400);
        }

        $request->validate([
            'code' => 'required|string|size:6',
        ]);

        if (!$settings->verifyCode($request->code)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid verification code.',
                'is_locked' => $settings->isLocked(),
            ], 400);
        }

        // Enable 2FA and generate recovery codes
        $settings->enable();
        $recoveryCodes = $settings->generateRecoveryCodes();

        broadcast(new AccountUpdated($user->id, '2fa_enabled', [
            'method' => $settings->method,
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Two-factor authentication enabled successfully.',
            'recovery_codes' => $recoveryCodes,
        ]);
    }

    /**
     * Disable 2FA (requires step-up auth)
     */
    public function disable2FA(Request $request): JsonResponse
    {
        $user = Auth::user();
        $settings = UserTwoFactorSetting::getOrCreate($user->id);

        if (!$settings->is_enabled) {
            return response()->json([
                'success' => false,
                'message' => 'Two-factor authentication is not enabled.',
            ], 400);
        }

        $request->validate([
            'step_up_token' => 'required|string',
        ]);

        // Verify step-up authentication
        $stepUp = StepUpAuthToken::getByToken($request->step_up_token);
        if (!$stepUp || !$stepUp->isComplete() || $stepUp->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Step-up authentication required.',
            ], 403);
        }

        $settings->disable();
        $stepUp->invalidate();

        broadcast(new AccountUpdated($user->id, '2fa_disabled', []));

        return response()->json([
            'success' => true,
            'message' => 'Two-factor authentication disabled successfully.',
        ]);
    }

    /**
     * Regenerate recovery codes
     */
    public function regenerateRecoveryCodes(Request $request): JsonResponse
    {
        $user = Auth::user();
        $settings = UserTwoFactorSetting::getOrCreate($user->id);

        if (!$settings->is_enabled) {
            return response()->json([
                'success' => false,
                'message' => 'Two-factor authentication is not enabled.',
            ], 400);
        }

        $request->validate([
            'code' => 'required|string|size:6',
        ]);

        if (!$settings->verifyCode($request->code)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid verification code.',
            ], 400);
        }

        $recoveryCodes = $settings->generateRecoveryCodes();

        return response()->json([
            'success' => true,
            'recovery_codes' => $recoveryCodes,
        ]);
    }

    /**
     * Verify 2FA code during login
     */
    public function challenge2FA(Request $request): JsonResponse
    {
        $request->validate([
            'two_factor_token' => 'required|string',
            'code' => 'required|string',
        ]);

        $user = User::where('two_factor_token', $request->two_factor_token)
            ->where('two_factor_pending', true)
            ->where('two_factor_token_expires_at', '>', now())
            ->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired session.',
            ], 400);
        }

        $settings = UserTwoFactorSetting::getOrCreate($user->id);

        // Try TOTP code first
        $verified = $settings->verifyCode($request->code);

        // If not, try recovery code
        if (!$verified && strlen($request->code) > 6) {
            $verified = $settings->useRecoveryCode($request->code);
        }

        if (!$verified) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid verification code.',
                'is_locked' => $settings->isLocked(),
            ], 400);
        }

        // Clear pending state
        $user->update([
            'two_factor_pending' => false,
            'two_factor_token' => null,
            'two_factor_token_expires_at' => null,
        ]);

        // Create access token
        $token = $user->createToken('auth_token');

        // Update token with device info
        $this->updateTokenWithDeviceInfo($token->accessToken, $request);

        return response()->json([
            'success' => true,
            'access_token' => $token->plainTextToken,
            'token_type' => 'Bearer',
        ]);
    }

    // ==================== TRUSTED CONTACTS ====================

    /**
     * Add a trusted contact
     */
    public function addTrustedContact(Request $request): JsonResponse
    {
        $user = Auth::user();

        $request->validate([
            'name' => 'required|string|max:255',
            'relationship' => 'required|in:' . implode(',', TrustedContact::RELATIONSHIPS),
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'can_recover_account' => 'sometimes|boolean',
            'notify_on_login' => 'sometimes|boolean',
        ]);

        if (!$request->email && !$request->phone) {
            return response()->json([
                'success' => false,
                'message' => 'Either email or phone is required.',
            ], 422);
        }

        try {
            $contact = TrustedContact::addContact($user->id, $request->all());
            $contact->sendVerification();

            broadcast(new AccountUpdated($user->id, 'trusted_contact_added', [
                'contact' => $contact->toApiResponse(),
            ]));

            return response()->json([
                'success' => true,
                'message' => 'Trusted contact added. Verification sent.',
                'data' => $contact->toApiResponse(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Remove a trusted contact
     */
    public function removeTrustedContact(Request $request, int $contactId): JsonResponse
    {
        $user = Auth::user();

        $contact = TrustedContact::where('id', $contactId)
            ->where('user_id', $user->id)
            ->first();

        if (!$contact) {
            return response()->json([
                'success' => false,
                'message' => 'Trusted contact not found.',
            ], 404);
        }

        $contact->delete();

        broadcast(new AccountUpdated($user->id, 'trusted_contact_removed', [
            'contact_id' => $contactId,
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Trusted contact removed.',
        ]);
    }

    /**
     * Resend verification to trusted contact
     */
    public function resendTrustedContactVerification(Request $request, int $contactId): JsonResponse
    {
        $user = Auth::user();

        $contact = TrustedContact::where('id', $contactId)
            ->where('user_id', $user->id)
            ->where('is_verified', false)
            ->first();

        if (!$contact) {
            return response()->json([
                'success' => false,
                'message' => 'Trusted contact not found or already verified.',
            ], 404);
        }

        $contact->sendVerification();

        return response()->json([
            'success' => true,
            'message' => 'Verification resent.',
        ]);
    }

    // ==================== STEP-UP AUTHENTICATION ====================

    /**
     * Initiate step-up authentication
     */
    public function initiateStepUp(Request $request): JsonResponse
    {
        $user = Auth::user();

        $request->validate([
            'purpose' => 'required|in:' . implode(',', StepUpAuthToken::PURPOSES),
        ]);

        $stepUp = StepUpAuthToken::createSession(
            $user->id,
            $request->purpose,
            $request->ip()
        );

        return response()->json([
            'success' => true,
            'data' => $stepUp->toApiResponse(),
        ]);
    }

    /**
     * Verify password for step-up auth
     */
    public function verifyStepUpPassword(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'required|string',
            'password' => 'required|string',
        ]);

        $stepUp = StepUpAuthToken::getByToken($request->token);
        if (!$stepUp) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired session.',
            ], 400);
        }

        if ((int) $stepUp->user_id !== (int) auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired session.',
            ], 403);
        }

        if (!$stepUp->verifyPassword($request->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid password.',
            ], 400);
        }

        // Generate and send OTP
        $otp = $stepUp->generateOtp();

        $user = auth()->user();
        if ($user && $user->email) {
            try {
                Mail::raw('Your Doctor Marriage Bureau verification code is ' . $otp, function ($message) use ($user) {
                    $message->to($user->email)
                        ->subject('Security verification code');
                });
            } catch (\Throwable $e) {
                \Log::error('Step-up OTP email failed: ' . $e->getMessage());

                return response()->json([
                    'success' => false,
                    'message' => 'Unable to send verification email. Please try again.',
                ], 500);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Password verified. Verification code sent to your email.',
            'data' => $stepUp->toApiResponse(),
        ]);
    }

    /**
     * Verify OTP for step-up auth
     */
    public function verifyStepUpOtp(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'required|string',
            'otp' => 'required|string|size:6',
        ]);

        $stepUp = StepUpAuthToken::getByToken($request->token);
        if (!$stepUp) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired session.',
            ], 400);
        }

        if ((int) $stepUp->user_id !== (int) auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired session.',
            ], 403);
        }

        if (!$stepUp->verifyOtp($request->otp)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid OTP.',
                'remaining_attempts' => max(0, StepUpAuthToken::MAX_OTP_ATTEMPTS - $stepUp->otp_attempts),
            ], 400);
        }

        return response()->json([
            'success' => true,
            'message' => 'Step-up authentication complete.',
            'data' => $stepUp->toApiResponse(),
        ]);
    }

    // ==================== HELPER METHODS ====================

    /**
     * Update token with device information
     */
    protected function updateTokenWithDeviceInfo(PersonalAccessToken $token, Request $request): void
    {
        $userAgent = $request->userAgent();
        $ip = $request->ip();

        $token->update([
            'device_name' => $this->parseDeviceName($userAgent),
            'device_type' => $this->parseDeviceType($userAgent),
            'browser' => $this->parseBrowser($userAgent),
            'os' => $this->parseOS($userAgent),
            'ip_address' => $ip,
            'user_agent' => $userAgent,
            'logged_in_at' => now(),
            // GeoIP lookup would go here
            'location_city' => $this->getLocationFromIp($ip)['city'] ?? null,
            'location_country' => $this->getLocationFromIp($ip)['country'] ?? null,
        ]);
    }

    protected function parseDeviceName(?string $userAgent): string
    {
        if (!$userAgent)
            return 'Unknown Device';

        if (stripos($userAgent, 'iPhone') !== false)
            return 'iPhone';
        if (stripos($userAgent, 'iPad') !== false)
            return 'iPad';
        if (stripos($userAgent, 'Android') !== false) {
            if (preg_match('/Android.*?;\s*([^)]+)\)/', $userAgent, $matches)) {
                return trim(explode('Build', $matches[1])[0]);
            }
            return 'Android Device';
        }
        if (stripos($userAgent, 'Macintosh') !== false)
            return 'MacBook/iMac';
        if (stripos($userAgent, 'Windows') !== false)
            return 'Windows PC';
        if (stripos($userAgent, 'Linux') !== false)
            return 'Linux PC';

        return 'Unknown Device';
    }

    protected function parseDeviceType(?string $userAgent): string
    {
        if (!$userAgent)
            return 'unknown';

        if (preg_match('/Mobile|Android.*Mobile|iPhone|iPod/', $userAgent))
            return 'mobile';
        if (preg_match('/iPad|Android(?!.*Mobile)|Tablet/', $userAgent))
            return 'tablet';

        return 'desktop';
    }

    protected function parseBrowser(?string $userAgent): string
    {
        if (!$userAgent)
            return 'Unknown';

        if (stripos($userAgent, 'Edg') !== false)
            return 'Microsoft Edge';
        if (stripos($userAgent, 'Chrome') !== false)
            return 'Chrome';
        if (stripos($userAgent, 'Safari') !== false && stripos($userAgent, 'Chrome') === false)
            return 'Safari';
        if (stripos($userAgent, 'Firefox') !== false)
            return 'Firefox';
        if (stripos($userAgent, 'Opera') !== false || stripos($userAgent, 'OPR') !== false)
            return 'Opera';

        return 'Unknown';
    }

    protected function parseOS(?string $userAgent): string
    {
        if (!$userAgent)
            return 'Unknown';

        if (stripos($userAgent, 'Windows NT 10') !== false)
            return 'Windows 10/11';
        if (stripos($userAgent, 'Windows') !== false)
            return 'Windows';
        if (stripos($userAgent, 'Mac OS X') !== false)
            return 'macOS';
        if (stripos($userAgent, 'iPhone') !== false || stripos($userAgent, 'iPad') !== false)
            return 'iOS';
        if (stripos($userAgent, 'Android') !== false)
            return 'Android';
        if (stripos($userAgent, 'Linux') !== false)
            return 'Linux';

        return 'Unknown';
    }

    protected function getLocationFromIp(?string $ip): array
    {
        if (!$ip || $ip === '127.0.0.1' || $ip === '::1') {
            return ['city' => 'Local', 'country' => 'Development'];
        }

        // TODO: Integrate MaxMind GeoLite2
        // For now, return placeholder
        return ['city' => null, 'country' => null];
    }

    protected function formatLocation($token): string
    {
        $parts = array_filter([
            $token->location_city,
            $token->location_country,
        ]);

        return implode(', ', $parts) ?: 'Unknown Location';
    }

    protected function maskEmail(?string $email): ?string
    {
        if (!$email)
            return null;

        $parts = explode('@', $email);
        if (count($parts) !== 2)
            return '***@***';

        $local = $parts[0];
        $domain = $parts[1];

        $maskedLocal = substr($local, 0, 2) . str_repeat('*', max(0, strlen($local) - 2));

        return $maskedLocal . '@' . $domain;
    }

    protected function maskPhone(?string $phone): ?string
    {
        if (!$phone)
            return null;

        $len = strlen($phone);
        if ($len <= 4)
            return str_repeat('*', $len);

        return '+XX XXXXX ' . substr($phone, -5);
    }

    protected function maskIp(?string $ip): ?string
    {
        if (!$ip)
            return null;

        $parts = explode('.', $ip);
        if (count($parts) === 4) {
            return $parts[0] . '.' . $parts[1] . '.***.' . $parts[3];
        }

        return $ip;
    }
}
