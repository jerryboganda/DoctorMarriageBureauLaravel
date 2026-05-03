<?php

namespace App\Http\Controllers\Api;

use App\Models\User;
use App\Models\Wallet;
use App\Models\Referral;
use App\Models\ReferralCode;
use Illuminate\Http\Request;
use App\Http\Controllers\Api\Controller;
use App\Http\Resources\ReferralResource;
use App\Http\Resources\ReferralEarningsResource;

class ReferralController extends Controller
{
    public function index()
    {
        if (addon_activation('referral_system')) {
            $referred_users = Referral::where('referrer_user_id', auth()->user()->id)
                ->with('referred')
                ->orderBy('id', 'desc')
                ->paginate(10);
            return ReferralResource::collection($referred_users)->additional([
                'result' => true
            ]);
        }
        return response()->json(['result' => false, 'message' => translate('You are not authorized to access!!')], 403);
    }

    public function referral_code()
    {
        if (addon_activation('referral_system')) {
            $user = auth()->user();
            $referralCode = ReferralCode::getOrCreateForUser($user->id);
            $data['referral_code'] = $referralCode->code;
            $data['referral_link'] = $referralCode->getReferralLink();
            return $this->response_data($data);
        }
        return response()->json(['result' => false, 'message' => translate('You are not authorized to access!!')], 403);
    }

    public function referral_earnings()
    {
        if (addon_activation('referral_system')) {
            $referral_earnings = Wallet::orderBy('id', 'desc')->where('payment_method', 'reffered_commission')->where('user_id', auth()->user()->id)->paginate(10);
            return ReferralEarningsResource::collection($referral_earnings)->additional([
                'result' => true
            ]);
        }
        return response()->json(['result' => false, 'message' => translate('You are not authorized to access!!')], 403);
    }
    public function referral_check()
    {
        $data = array();
        $auth_user = auth()->user();
        $hasReferral = Referral::where('referred_user_id', $auth_user->id)
            ->whereIn('status', ['pending', 'qualified'])
            ->exists();

        if (addon_activation('referral_system') && $hasReferral && $auth_user->referral_comission == 0) {
            $data['referral_discount_type'] = get_setting('referral_user_package_purchase_discount_type');
            $data['referral_discount_amount'] = get_setting('referral_user_package_purchase_discount');
        }
        return empty($data) ? $this->failure_data($data) : $this->response_data($data);
    }
}
