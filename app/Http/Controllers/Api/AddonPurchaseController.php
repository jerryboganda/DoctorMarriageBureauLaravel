<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Controller;
use App\Http\Resources\AddonPurchaseResource;
use App\Models\AddonProduct;
use App\Models\AddonPurchase;
use App\Models\Coupon;
use App\Models\ManualPaymentMethod;
use App\Models\User;
use App\Services\CouponService;
use Illuminate\Http\Request;

class AddonPurchaseController extends Controller
{
    public function history()
    {
        $purchases = AddonPurchase::latest()
            ->where('user_id', auth()->user()->id)
            ->with('addon')
            ->paginate(10);

        return AddonPurchaseResource::collection($purchases)->additional([
            'result' => true,
        ]);
    }

    public function purchase(Request $request)
    {
        $this->validate($request, [
            'addon_id' => 'required',
            'payment_method' => 'required',
        ]);

        $user = auth()->user();
        $addon = AddonProduct::where('id', $request->addon_id)
            ->where('is_active', 1)
            ->first();

        if (!$addon) {
            return $this->failure_message('Invalid add-on.');
        }

        $originalAmount = (float) $addon->price;
        $finalAmount = $originalAmount;
        $discountAmount = 0.0;
        $coupon = null;

        if ($request->coupon_code) {
            $couponService = new CouponService();
            $couponResult = $couponService->validateCode($request->coupon_code, $user, $originalAmount, 'addon');
            if (!$couponResult['valid']) {
                return $this->failure_message($couponResult['message']);
            }
            $coupon = $couponResult['coupon'];
            $discountAmount = $couponResult['discount_amount'];
            $finalAmount = $couponResult['final_amount'];
        }

        $paymentData = [
            'addon_id' => $addon->id,
            'payment_method' => $request->payment_method,
            'amount' => $finalAmount,
            'original_amount' => $originalAmount,
            'discount_amount' => $discountAmount,
            'coupon_id' => $coupon ? $coupon->id : null,
            'coupon_code' => $coupon ? $coupon->code : null,
        ];

        if ($request->payment_method == 'wallet') {
            if ($user->balance < $finalAmount) {
                return $this->failure_message('You do not have enough balance.');
            }

            $user->balance = $user->balance - $finalAmount;
            $user->save();

            return $this->addon_payment_done($user->id, $paymentData, null);
        }

        if ($request->payment_method == 'manual_payment') {
            $paymentProof = null;
            if ($request->hasFile('payment_proof')) {
                $paymentProof = upload_api_file($request->file('payment_proof'));
            }

            $manualMethod = ManualPaymentMethod::find($request->manual_payment_id);

            $addonPurchase = new AddonPurchase();
            $addonPurchase->payment_code = date('ymd-His');
            $addonPurchase->user_id = $user->id;
            $addonPurchase->addon_product_id = $addon->id;
            $addonPurchase->payment_method = 'manual_payment';
            $addonPurchase->payment_status = 'Due';
            $addonPurchase->amount = $finalAmount;
            $addonPurchase->original_amount = $originalAmount;
            $addonPurchase->discount_amount = $discountAmount;
            $addonPurchase->coupon_id = $coupon ? $coupon->id : null;
            $addonPurchase->coupon_code = $coupon ? $coupon->code : null;
            $addonPurchase->payment_details = '';
            $addonPurchase->offline_payment = 1;
            $addonPurchase->custom_payment_name = $manualMethod ? $manualMethod->heading : null;
            $addonPurchase->custom_payment_transaction_id = $request->transaction_id;
            $addonPurchase->custom_payment_proof = $paymentProof;
            $addonPurchase->custom_payment_details = $request->payment_details;
            $addonPurchase->save();

            return response()->json(['result' => true, 'message' => translate("Payment completed")]);
        }

        return $this->failure_message('Invalid payment method.');
    }

    public function addon_payment_done($user_id, $payment_data, $payment_details)
    {
        $user = User::where('id', $user_id)->first();

        $addonPurchase = new AddonPurchase();
        $addonPurchase->payment_code = date('ymd-His');
        $addonPurchase->user_id = $user->id;
        $addonPurchase->addon_product_id = $payment_data['addon_id'];
        $addonPurchase->payment_method = $payment_data['payment_method'];
        $addonPurchase->payment_status = 'Paid';
        $addonPurchase->amount = $payment_data['amount'];
        $addonPurchase->original_amount = $payment_data['original_amount'] ?? $payment_data['amount'];
        $addonPurchase->discount_amount = $payment_data['discount_amount'] ?? 0;
        $addonPurchase->coupon_id = $payment_data['coupon_id'] ?? null;
        $addonPurchase->coupon_code = $payment_data['coupon_code'] ?? null;
        $addonPurchase->payment_details = $payment_details;
        $addonPurchase->offline_payment = 2;
        $addonPurchase->save();

        if (!empty($payment_data['coupon_id'])) {
            $couponService = new CouponService();
            $coupon = Coupon::find($payment_data['coupon_id']);
            if ($coupon) {
                $couponService->recordRedemption(
                    $coupon,
                    $user,
                    (float) $addonPurchase->original_amount,
                    (float) $addonPurchase->discount_amount,
                    (float) $addonPurchase->amount,
                    [
                        'purchase_type' => 'addon',
                        'addon_purchase_id' => $addonPurchase->id,
                    ]
                );
            }
        }

        return response()->json(['result' => true, 'message' => translate("Payment completed")]);
    }
}
