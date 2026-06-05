<?php

namespace App\Http\Controllers;

use App\Models\Package;
use App\Models\Referral;
use App\Models\ReferralAuditLog;
use App\Models\ReferralReward;
use App\Models\ReferralRule;
use App\Models\ReferralSetting;
use App\Services\ReferralService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class ReferralController extends Controller
{
    protected $referralService;

    public function __construct()
    {
        $this->referralService = new ReferralService;
    }

    // ══════════════════════════════════════════════════════════════
    //  ADMIN: Dashboard
    // ══════════════════════════════════════════════════════════════

    public function dashboard()
    {
        $analytics = $this->referralService->getAnalytics(30);
        $settings = ReferralSetting::instance();
        $recentReferrals = Referral::with(['referrer', 'referred'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        return view('admin.referral.dashboard', compact('analytics', 'settings', 'recentReferrals'));
    }

    // ══════════════════════════════════════════════════════════════
    //  ADMIN: Settings
    // ══════════════════════════════════════════════════════════════

    public function settings()
    {
        $settings = ReferralSetting::instance();
        $rules = ReferralRule::orderBy('created_at', 'desc')->get();

        return view('admin.referral.settings', compact('settings', 'rules'));
    }

    public function updateSettings(Request $request)
    {
        $request->validate([
            'referral_enabled' => 'required|boolean',
            'code_format' => 'required|in:alphanumeric_6,alphanumeric_8,alphanumeric_10,numeric_8',
            'allow_code_regeneration' => 'required|boolean',
            'allow_post_signup_apply' => 'required|boolean',
            'default_rule_id' => 'nullable|exists:referral_rules,id',
            'max_referrals_per_ip_per_day' => 'required|integer|min:1|max:100',
            'max_referrals_per_device_per_day' => 'required|integer|min:1|max:100',
            'cooldown_minutes' => 'required|integer|min:0|max:1440',
            'block_same_email_domain' => 'required|boolean',
            // Popup settings
            'popup_enabled' => 'required|boolean',
            'popup_headline' => 'required|string|max:255',
            'popup_body' => 'required|string|max:2000',
            'popup_cta_text' => 'required|string|max:100',
            'popup_bonus_days' => 'required|integer|min:1|max:365',
            'popup_show_frequency' => 'required|string|in:every_login,once_per_session,once_per_day,once_ever',
            'popup_delay_seconds' => 'required|integer|min:0|max:60',
        ]);

        $settings = ReferralSetting::instance();
        $before = $settings->toArray();

        $settings->update([
            'referral_enabled' => $request->referral_enabled,
            'code_format' => $request->code_format,
            'allow_code_regeneration' => $request->allow_code_regeneration,
            'allow_post_signup_apply' => $request->allow_post_signup_apply,
            'default_rule_id' => $request->default_rule_id,
            'anti_fraud_settings' => [
                'max_referrals_per_ip_per_day' => (int) $request->max_referrals_per_ip_per_day,
                'max_referrals_per_device_per_day' => (int) $request->max_referrals_per_device_per_day,
                'cooldown_minutes' => (int) $request->cooldown_minutes,
                'block_same_email_domain' => (bool) $request->block_same_email_domain,
            ],
            // Popup settings
            'popup_enabled' => (bool) $request->popup_enabled,
            'popup_headline' => $request->popup_headline,
            'popup_body' => $request->popup_body,
            'popup_cta_text' => $request->popup_cta_text,
            'popup_bonus_days' => (int) $request->popup_bonus_days,
            'popup_show_frequency' => $request->popup_show_frequency,
            'popup_delay_seconds' => (int) $request->popup_delay_seconds,
        ]);

        ReferralAuditLog::log('admin', auth()->id(), 'settings_updated', 'referral_settings', $settings->id, $before, $settings->toArray());

        Cache::forget('referral_settings');

        flash(translate('Referral settings updated successfully'))->success();

        return redirect()->back();
    }

    // ══════════════════════════════════════════════════════════════
    //  ADMIN: Rules CRUD
    // ══════════════════════════════════════════════════════════════

    public function rules()
    {
        $rules = ReferralRule::orderBy('created_at', 'desc')->get();
        $packages = Package::where('active', 1)->whereNull('deleted_at')->get();

        return view('admin.referral.rules', compact('rules', 'packages'));
    }

    public function storeRule(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'trigger_threshold' => 'required|integer|min:1|max:1000',
            'qualification_mode' => 'required|in:registration_only,email_verified,identity_verified,paid_subscription,active_days',
            'active_days' => 'nullable|integer|min:1|max:365',
            'reward_type' => 'required|in:package_upgrade',
            'target_package_id' => 'required|exists:packages,id',
            'upgrade_duration_days' => 'required|integer|min:1|max:3650',
            'is_permanent' => 'nullable|boolean',
            'per_user_limit' => 'required|in:once,monthly,unlimited',
            'starts_at' => 'nullable|date',
            'ends_at' => 'nullable|date|after_or_equal:starts_at',
        ]);

        $rule = ReferralRule::create([
            'name' => $request->name,
            'is_active' => true,
            'trigger_threshold' => $request->trigger_threshold,
            'qualification_mode' => $request->qualification_mode,
            'qualification_params' => [
                'active_days' => $request->active_days ?? 0,
            ],
            'reward_type' => $request->reward_type,
            'reward_params' => [
                'target_package_id' => (int) $request->target_package_id,
                'upgrade_duration_days' => (int) $request->upgrade_duration_days,
                'is_permanent' => (bool) ($request->is_permanent ?? false),
            ],
            'per_user_limit' => $request->per_user_limit,
            'starts_at' => $request->starts_at,
            'ends_at' => $request->ends_at,
        ]);

        ReferralAuditLog::log('admin', auth()->id(), 'rule_created', 'referral_rule', $rule->id, null, $rule->toArray());

        flash(translate('Referral rule created successfully'))->success();

        return redirect()->back();
    }

    public function updateRule(Request $request, $id)
    {
        $rule = ReferralRule::findOrFail($id);
        $before = $rule->toArray();

        $request->validate([
            'name' => 'required|string|max:255',
            'is_active' => 'required|boolean',
            'trigger_threshold' => 'required|integer|min:1|max:1000',
            'qualification_mode' => 'required|in:registration_only,email_verified,identity_verified,paid_subscription,active_days',
            'active_days' => 'nullable|integer|min:1|max:365',
            'target_package_id' => 'required|exists:packages,id',
            'upgrade_duration_days' => 'required|integer|min:1|max:3650',
            'is_permanent' => 'nullable|boolean',
            'per_user_limit' => 'required|in:once,monthly,unlimited',
            'starts_at' => 'nullable|date',
            'ends_at' => 'nullable|date|after_or_equal:starts_at',
        ]);

        $rule->update([
            'name' => $request->name,
            'is_active' => $request->is_active,
            'trigger_threshold' => $request->trigger_threshold,
            'qualification_mode' => $request->qualification_mode,
            'qualification_params' => [
                'active_days' => $request->active_days ?? 0,
            ],
            'reward_params' => [
                'target_package_id' => (int) $request->target_package_id,
                'upgrade_duration_days' => (int) $request->upgrade_duration_days,
                'is_permanent' => (bool) ($request->is_permanent ?? false),
            ],
            'per_user_limit' => $request->per_user_limit,
            'starts_at' => $request->starts_at,
            'ends_at' => $request->ends_at,
        ]);

        ReferralAuditLog::log('admin', auth()->id(), 'rule_updated', 'referral_rule', $rule->id, $before, $rule->toArray());

        flash(translate('Referral rule updated successfully'))->success();

        return redirect()->back();
    }

    public function destroyRule($id)
    {
        $rule = ReferralRule::findOrFail($id);

        // Check if rule has rewards
        if ($rule->rewards()->exists()) {
            flash(translate('Cannot delete rule with existing rewards. Deactivate it instead.'))->error();

            return redirect()->back();
        }

        ReferralAuditLog::log('admin', auth()->id(), 'rule_deleted', 'referral_rule', $rule->id, $rule->toArray(), null);
        $rule->delete();

        flash(translate('Referral rule deleted successfully'))->success();

        return redirect()->back();
    }

    // ══════════════════════════════════════════════════════════════
    //  ADMIN: Referrals List
    // ══════════════════════════════════════════════════════════════

    public function referrals(Request $request)
    {
        $query = Referral::with(['referrer', 'referred', 'referralCode']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('referrer', function ($q2) use ($search) {
                    $q2->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                })->orWhereHas('referred', function ($q2) use ($search) {
                    $q2->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            });
        }

        if ($request->filled('date_from')) {
            $query->where('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->where('created_at', '<=', $request->date_to.' 23:59:59');
        }

        $referrals = $query->orderBy('created_at', 'desc')->paginate(20);

        return view('admin.referral.referrals', compact('referrals'));
    }

    public function invalidateReferral(Request $request, $id)
    {
        $request->validate([
            'reason' => 'nullable|string|max:500',
        ]);

        try {
            $this->referralService->adminInvalidateReferral($id, auth()->id(), $request->reason);
            flash(translate('Referral invalidated successfully'))->success();
        } catch (\Exception $e) {
            flash(translate('Error: ').$e->getMessage())->error();
        }

        return redirect()->back();
    }

    // ══════════════════════════════════════════════════════════════
    //  ADMIN: Rewards
    // ══════════════════════════════════════════════════════════════

    public function rewards(Request $request)
    {
        $query = ReferralReward::with(['user', 'rule']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $rewards = $query->orderBy('created_at', 'desc')->paginate(20);

        return view('admin.referral.rewards', compact('rewards'));
    }

    public function reverseReward(Request $request, $id)
    {
        $request->validate([
            'reason' => 'nullable|string|max:500',
        ]);

        try {
            $this->referralService->adminReverseReward($id, auth()->id(), $request->reason);
            flash(translate('Reward reversed successfully'))->success();
        } catch (\Exception $e) {
            flash(translate('Error: ').$e->getMessage())->error();
        }

        return redirect()->back();
    }

    // ══════════════════════════════════════════════════════════════
    //  ADMIN: Audit Logs
    // ══════════════════════════════════════════════════════════════

    public function auditLogs(Request $request)
    {
        $query = ReferralAuditLog::orderBy('created_at', 'desc');

        if ($request->filled('action')) {
            $query->where('action', $request->action);
        }

        $logs = $query->paginate(30);

        return view('admin.referral.audit_logs', compact('logs'));
    }

    // ══════════════════════════════════════════════════════════════
    //  ADMIN: Backfill
    // ══════════════════════════════════════════════════════════════

    public function backfillCodes()
    {
        $count = $this->referralService->backfillReferralCodes();
        flash(translate('Referral codes generated for ').$count.translate(' users'))->success();

        return redirect()->back();
    }
}
