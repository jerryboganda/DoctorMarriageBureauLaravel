<?php

namespace App\Http\Controllers\Api;

use App\Models\ReferralCode;
use App\Models\ReferralSetting;
use App\Services\ReferralService;
use Illuminate\Http\Request;

class ReferralApiController extends Controller
{
    protected $referralService;

    public function __construct()
    {
        $this->referralService = new ReferralService;
    }

    /**
     * GET /api/referral/my-stats
     * Returns current user's referral code, link, stats, and progress
     */
    public function myStats(Request $request)
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['result' => false, 'message' => 'Unauthorized'], 401);
        }

        $settings = ReferralSetting::instance();
        if (! $settings->referral_enabled) {
            return response()->json([
                'result' => true,
                'data' => [
                    'referral_enabled' => false,
                    'message' => 'Referral program is currently not available',
                ],
            ]);
        }

        $stats = $this->referralService->getUserReferralStats($user->id);

        return response()->json([
            'result' => true,
            'data' => array_merge($stats, [
                'referral_enabled' => true,
            ]),
        ]);
    }

    /**
     * POST /api/referral/validate-code
     * Validate a referral code without applying it
     */
    public function validateCode(Request $request)
    {
        $request->validate([
            'code' => 'required|string|max:50',
        ]);

        $settings = ReferralSetting::instance();
        if (! $settings->referral_enabled) {
            return response()->json([
                'result' => false,
                'message' => 'Referral program is currently disabled',
            ]);
        }

        $normalized = $this->referralService->normalizeReferralCode($request->code);

        $referralCode = ReferralCode::where('code', $normalized)
            ->where('status', 'active')
            ->first();

        if (! $referralCode) {
            return response()->json([
                'result' => false,
                'message' => 'Invalid or inactive referral code',
            ]);
        }

        $referrer = $referralCode->user;

        return response()->json([
            'result' => true,
            'message' => 'Valid referral code',
            'data' => [
                'referrer_name' => $referrer ? $referrer->first_name : 'A member',
            ],
        ]);
    }

    /**
     * POST /api/referral/regenerate-code
     * Regenerate the user's referral code (if allowed)
     */
    public function regenerateCode(Request $request)
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['result' => false, 'message' => 'Unauthorized'], 401);
        }

        $settings = ReferralSetting::instance();
        if (! $settings->allow_code_regeneration) {
            return response()->json([
                'result' => false,
                'message' => 'Code regeneration is not allowed',
            ]);
        }

        $existingCode = ReferralCode::where('user_id', $user->id)->first();

        if ($existingCode) {
            // Check if code has been used
            if ($existingCode->referrals()->exists()) {
                return response()->json([
                    'result' => false,
                    'message' => 'Cannot regenerate a code that has been used for referrals',
                ]);
            }

            $newCode = ReferralCode::generateCode($settings->code_format);
            $existingCode->update(['code' => $newCode]);

            return response()->json([
                'result' => true,
                'data' => [
                    'code' => $newCode,
                    'referral_link' => $existingCode->getReferralLink(),
                ],
            ]);
        }

        $referralCode = ReferralCode::getOrCreateForUser($user->id);

        return response()->json([
            'result' => true,
            'data' => [
                'code' => $referralCode->code,
                'referral_link' => $referralCode->getReferralLink(),
            ],
        ]);
    }

    /**
     * GET /api/referral/settings-public
     * Return public referral settings for the frontend
     */
    public function publicSettings()
    {
        $settings = ReferralSetting::instance();

        $data = [
            'referral_enabled' => $settings->referral_enabled,
            'allow_code_regeneration' => $settings->allow_code_regeneration,
            'allow_post_signup_apply' => $settings->allow_post_signup_apply,
        ];

        // Include popup config when enabled
        if ($settings->popup_enabled) {
            $rule = $settings->defaultRule;
            $data['popup'] = [
                'enabled' => true,
                'headline' => $settings->popup_headline,
                'body' => $settings->popup_body,
                'cta_text' => $settings->popup_cta_text,
                'bonus_days' => $settings->popup_bonus_days,
                'show_frequency' => $settings->popup_show_frequency,
                'delay_seconds' => $settings->popup_delay_seconds,
                'referrals_needed' => $rule ? $rule->trigger_threshold : 3,
            ];
        } else {
            $data['popup'] = ['enabled' => false];
        }

        return response()->json([
            'result' => true,
            'data' => $data,
        ]);
    }
}
