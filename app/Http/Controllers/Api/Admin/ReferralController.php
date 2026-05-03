<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\Referral;
use App\Models\ReferralAuditLog;
use App\Models\ReferralReward;
use App\Models\ReferralRule;
use App\Models\ReferralSetting;
use Illuminate\Http\Request;

class ReferralController extends BaseAdminController
{
    public function dashboard()
    {
        return $this->ok([
            'total_referrals' => Referral::count(),
            'successful_referrals' => Referral::where('status', 'qualified')->count(),
            'total_rewards' => ReferralReward::count(),
            'applied_rewards' => ReferralReward::where('status', 'applied')->count(),
        ]);
    }

    public function settings()
    {
        return $this->ok(ReferralSetting::instance());
    }

    public function updateSettings(Request $request)
    {
        $settings = ReferralSetting::instance();
        $settings->fill($request->all());
        $settings->save();

        return $this->ok($settings, 'Referral settings updated');
    }

    public function rules(Request $request)
    {
        $query = ReferralRule::query()->orderByDesc('id');
        return $this->ok($this->paginateQuery($request, $query));
    }

    public function storeRule(Request $request)
    {
        $rule = ReferralRule::create($request->all());
        return $this->ok($rule, 'Rule created');
    }

    public function showRule($id)
    {
        $rule = ReferralRule::findOrFail($id);
        return $this->ok($rule);
    }

    public function updateRule(Request $request, $id)
    {
        $rule = ReferralRule::findOrFail($id);
        $rule->fill($request->all());
        $rule->save();

        return $this->ok($rule, 'Rule updated');
    }

    public function destroyRule($id)
    {
        $rule = ReferralRule::findOrFail($id);
        $rule->delete();

        return $this->ok(null, 'Rule deleted');
    }

    public function referrals(Request $request)
    {
        $query = Referral::with(['referrer', 'referred', 'rule'])->orderByDesc('id');
        return $this->ok($this->paginateQuery($request, $query));
    }

    public function invalidateReferral($id)
    {
        $referral = Referral::findOrFail($id);
        $referral->status = 'invalid';
        $referral->save();

        return $this->ok($referral, 'Referral invalidated');
    }

    public function rewards(Request $request)
    {
        $query = ReferralReward::with(['user', 'rule'])->orderByDesc('id');
        return $this->ok($this->paginateQuery($request, $query));
    }

    public function reverseReward(Request $request, $id)
    {
        $reward = ReferralReward::findOrFail($id);
        $reward->reverseReward($request->user()->id ?? null, $request->get('reason'));

        return $this->ok($reward->fresh(), 'Reward reversed');
    }

    public function auditLogs(Request $request)
    {
        $query = ReferralAuditLog::query()->orderByDesc('id');
        return $this->ok($this->paginateQuery($request, $query));
    }

    public function backfillCodes()
    {
        return $this->ok(null, 'Backfill job queued');
    }
}
