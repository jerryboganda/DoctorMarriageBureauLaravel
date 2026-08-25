<?php

namespace App\Http\Controllers\Api\Payment;

use App\Http\Controllers\Api\AddonPurchaseController;
use App\Http\Controllers\Api\Controller;
use App\Http\Controllers\Api\PackageController;
use App\Http\Controllers\Api\WalletController;
use App\Models\AddonProduct;
use App\Models\Package;
use App\Models\User;
use App\Services\CouponService;
use Illuminate\Http\Request;
use Paystack;

class PaystackController extends Controller
{
    public function redirectToGateway(Request $request)
    {
        $user = User::where('id', $request->user_id)->first();
        $request->email = $user->email;
        $request->payment_type = $request->payment_type;
        $request->payment_method = $request->payment_method;
        $request->package_id = 0;
        $request->addon_id = 0;
        $request->user_id = $request->user_id;

        $amount = (float) $request->amount;
        $originalAmount = $amount;
        $discountAmount = 0;
        $couponId = null;
        $couponCode = $request->coupon_code;
        $purchaseType = null;

        if ($request->payment_type == 'package_payment' && isset($request->package_id)) {
            $package = Package::find($request->package_id);
            if ($package) {
                $request->package_id = $package->id;
                $amount = (float) $package->price;
                $purchaseType = 'package';
            }
        } elseif ($request->payment_type == 'addon_payment' && isset($request->addon_id)) {
            $addon = AddonProduct::find($request->addon_id);
            if ($addon) {
                $request->addon_id = $addon->id;
                $amount = (float) $addon->price;
                $purchaseType = 'addon';
            }
        }

        $originalAmount = $amount;
        if (! empty($request->coupon_code) && $purchaseType) {
            $couponService = new CouponService;
            $couponResult = $couponService->validateCode($request->coupon_code, $user, $originalAmount, $purchaseType);
            if ($couponResult['valid']) {
                $couponId = $couponResult['coupon']->id;
                $couponCode = $couponResult['coupon']->code;
                $discountAmount = $couponResult['discount_amount'];
                $amount = $couponResult['final_amount'];
            }
        }

        $request->amount = round($amount * 100);
        $request->original_amount = $originalAmount;
        $request->discount_amount = $discountAmount;
        $request->coupon_id = $couponId;
        $request->coupon_code = $couponCode;
        $request->currency = env('PAYSTACK_CURRENCY_CODE', 'NGN');
        $request->reference = Paystack::genTranxRef();

        return Paystack::getAuthorizationUrl()->redirectNow();
    }

    /**
     * Obtain Paystack payment information
     *
     * @return void
     */
    public function handleGatewayCallback(Request $request)
    {
        if ($request->payment_type) {
            $payment = Paystack::getPaymentData();
            $payment_detalis = json_encode($payment);
            if (! empty($payment['data']) && $payment['data']['status'] == 'success') {
                $finalAmount = isset($payment['data']['amount']) ? ($payment['data']['amount'] / 100) : $request->amount;
                $originalAmount = $request->original_amount ?? $finalAmount;
                $discountAmount = $request->discount_amount ?? max($originalAmount - $finalAmount, 0);
                $payment_data = [
                    'package_id' => $request->package_id,
                    'addon_id' => $request->addon_id,
                    'payment_method' => $request->payment_method,
                    'amount' => $finalAmount,
                    'original_amount' => $originalAmount,
                    'discount_amount' => $discountAmount,
                    'coupon_id' => $request->coupon_id ?? null,
                    'coupon_code' => $request->coupon_code ?? null,
                ];
                if ($request->payment_type == 'package_payment') {
                    $packagePaymentController = new PackageController;

                    return $packagePaymentController->package_payment_done($request->user_id, $payment_data, $payment_detalis);
                } elseif ($request->payment_type == 'addon_payment') {
                    $addonPurchaseController = new AddonPurchaseController;

                    return $addonPurchaseController->addon_payment_done($request->user_id, $payment_data, $payment_detalis);
                } elseif ($request->payment_type == 'wallet_payment') {
                    $walletController = new WalletController;

                    return $walletController->wallet_payment_done($request->user_id, $payment_data, $payment_detalis);
                }
            }

            return response()->json(['result' => false, 'message' => translate('Payment cancelled')]);
        }
    }
}
