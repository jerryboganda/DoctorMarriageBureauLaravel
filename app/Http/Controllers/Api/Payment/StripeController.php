<?php

namespace App\Http\Controllers\Api\Payment;

use App\Http\Controllers\Api\AddonPurchaseController;
use App\Http\Controllers\Api\Controller;
use App\Http\Controllers\Api\PackageController;
use App\Http\Controllers\Api\WalletController;
use App\Models\AddonProduct;
use App\Models\Currency;
use App\Models\Package;
use App\Models\User;
use App\Services\CouponService;
use Illuminate\Http\Request;
use Stripe\Checkout\Session;
use Stripe\Stripe;

class StripeController extends Controller
{
    public function stripe(Request $request)
    {
        $data['payment_type'] = $request->payment_type;
        $data['amount'] = $request->amount;
        $data['payment_method'] = $request->payment_method;
        $data['user_id'] = auth()->user()->id;
        $data['package_id'] = 0;
        $data['addon_id'] = 0;
        $data['original_amount'] = null;
        $data['discount_amount'] = null;
        $data['coupon_id'] = null;
        $data['coupon_code'] = $request->coupon_code;

        $amount = (float) $request->amount;
        $purchaseType = null;

        if ($request->payment_type == 'package_payment') {
            $package = Package::find($request->package_id);
            if ($package) {
                $data['package_id'] = $package->id;
                $amount = (float) $package->price;
                $purchaseType = 'package';
            }
        } elseif ($request->payment_type == 'addon_payment') {
            $addon = AddonProduct::find($request->addon_id);
            if ($addon) {
                $data['addon_id'] = $addon->id;
                $amount = (float) $addon->price;
                $purchaseType = 'addon';
            }
        }

        $originalAmount = $amount;
        if (! empty($request->coupon_code) && $purchaseType) {
            $couponService = new CouponService;
            $couponResult = $couponService->validateCode($request->coupon_code, auth()->user(), $originalAmount, $purchaseType);
            if ($couponResult['valid']) {
                $data['coupon_id'] = $couponResult['coupon']->id;
                $data['coupon_code'] = $couponResult['coupon']->code;
                $data['discount_amount'] = $couponResult['discount_amount'];
                $data['original_amount'] = $originalAmount;
                $amount = $couponResult['final_amount'];
            }
        } else {
            $data['original_amount'] = $originalAmount;
            $data['discount_amount'] = 0;
        }

        $data['amount'] = $amount;

        return view('frontend.payment_gateway.stripe_app', $data);
    }

    public function create_checkout_session(Request $request)
    {
        $amount = 0;
        $resolvedAmount = (float) $request->amount;
        $purchaseType = null;
        $originalAmount = $resolvedAmount;
        $discountAmount = 0;
        $couponId = null;
        $couponCode = $request->coupon_code;

        if ($request->payment_type == 'package_payment') {
            $package = Package::find($request->package_id);
            if ($package) {
                $originalAmount = (float) $package->price;
                $resolvedAmount = $originalAmount;
                $purchaseType = 'package';
            }
        } elseif ($request->payment_type == 'addon_payment') {
            $addon = AddonProduct::find($request->addon_id);
            if ($addon) {
                $originalAmount = (float) $addon->price;
                $resolvedAmount = $originalAmount;
                $purchaseType = 'addon';
            }
        }

        if (! empty($request->coupon_code) && $purchaseType) {
            $couponUser = User::find($request->user_id);
            if ($couponUser) {
                $couponService = new CouponService;
                $couponResult = $couponService->validateCode($request->coupon_code, $couponUser, $originalAmount, $purchaseType);
                if ($couponResult['valid']) {
                    $couponId = $couponResult['coupon']->id;
                    $couponCode = $couponResult['coupon']->code;
                    $discountAmount = $couponResult['discount_amount'];
                    $resolvedAmount = $couponResult['final_amount'];
                }
            }
        }

        if ($request->payment_type) {
            $amount = round($resolvedAmount * 100);
        }

        $data = [];

        $data['payment_type'] = $request->payment_type;
        $data['amount'] = $resolvedAmount;
        $data['payment_method'] = $request->payment_method;
        $data['package_id'] = $request->package_id;
        $data['addon_id'] = $request->addon_id;
        $data['user_id'] = $request->user_id;
        $data['original_amount'] = $originalAmount;
        $data['discount_amount'] = $discountAmount;
        $data['coupon_id'] = $couponId;
        $data['coupon_code'] = $couponCode;

        Stripe::setApiKey(env('STRIPE_SECRET'));

        $session = Session::create([
            'payment_method_types' => ['card'],
            'line_items' => [
                [
                    'price_data' => [
                        'currency' => Currency::findOrFail(get_setting('system_default_currency'))->code,
                        'product_data' => [
                            'name' => 'Payment',
                        ],
                        'unit_amount' => $amount,
                    ],
                    'quantity' => 1,
                ],
            ],
            'mode' => 'payment',
            'success_url' => route('api.stripe.success', $data),
            'cancel_url' => route('api.stripe.cancel'),
        ]);

        return response()->json(['id' => $session->id, 'status' => 200]);
    }

    //
    public function success(Request $request)
    {
        $payment_data = [
            'package_id' => $request->package_id,
            'addon_id' => $request->addon_id,
            'payment_method' => $request->payment_method,
            'amount' => $request->amount,
            'original_amount' => $request->original_amount ?? $request->amount,
            'discount_amount' => $request->discount_amount ?? 0,
            'coupon_id' => $request->coupon_id ?? null,
            'coupon_code' => $request->coupon_code ?? null,
        ];
        try {
            $payment = ['status' => 'Success'];
            if ($request->payment_type) {
                if ($request->payment_type == 'package_payment') {
                    $packagePaymentController = new PackageController;

                    return $packagePaymentController->package_payment_done($request->user_id, $payment_data, json_encode($payment));
                } elseif ($request->payment_type == 'addon_payment') {
                    $addonPurchaseController = new AddonPurchaseController;

                    return $addonPurchaseController->addon_payment_done($request->user_id, $payment_data, json_encode($payment));
                } elseif ($request->payment_type == 'wallet_payment') {
                    $walletController = new WalletController;

                    return $walletController->wallet_payment_done($request->user_id, $payment_data, json_encode($payment));
                }
            }
        } catch (\Exception $e) {
            return response()->json(['result' => false, 'message' => translate('Payment is unsuccessful')]);
        }
    }

    public function cancel(Request $request)
    {
        return response()->json(['result' => false, 'message' => translate('Payment is cancelled')]);
    }
}
