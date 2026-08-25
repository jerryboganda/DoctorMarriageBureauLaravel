<?php

namespace App\Http\Controllers\Api\Payment;

use App\Http\Controllers\Api\AddonPurchaseController;
use App\Http\Controllers\Api\PackageController;
use App\Http\Controllers\Api\WalletController;
use App\Http\Controllers\Controller;
use App\Models\AddonProduct;
use App\Models\Package;
use App\Services\CouponService;
use Illuminate\Http\Request;
use Razorpay\Api\Api;

class RazorpayController extends Controller
{
    public function payWithRazorpay(Request $request)
    {
        $payment_type = $request->payment_type;
        $amount = $request->amount;
        $payment_method = $request->payment_method;
        $package_id = 0;
        $addon_id = 0;
        $original_amount = null;
        $discount_amount = 0;
        $coupon_id = null;
        $coupon_code = $request->coupon_code;
        $purchaseType = null;

        if (isset($request->package_id)) {
            $package_id = $request->package_id;
            $package = Package::find($request->package_id);
            if ($package) {
                $amount = (float) $package->price;
                $purchaseType = 'package';
            }
        }

        if ($payment_type == 'addon_payment' && isset($request->addon_id)) {
            $addon = AddonProduct::find($request->addon_id);
            if ($addon) {
                $addon_id = $addon->id;
                $amount = (float) $addon->price;
                $purchaseType = 'addon';
            }
        }

        $original_amount = $amount;
        if (! empty($coupon_code) && $purchaseType) {
            $couponService = new CouponService;
            $couponResult = $couponService->validateCode($coupon_code, auth()->user(), $original_amount, $purchaseType);
            if ($couponResult['valid']) {
                $coupon_id = $couponResult['coupon']->id;
                $coupon_code = $couponResult['coupon']->code;
                $discount_amount = $couponResult['discount_amount'];
                $amount = $couponResult['final_amount'];
            }
        }

        return view('frontend.payment_gateway.razorpay_app', compact('amount', 'package_id', 'addon_id', 'payment_method', 'payment_type', 'original_amount', 'discount_amount', 'coupon_id', 'coupon_code'));
    }

    public function payment(Request $request)
    {
        // Input items of form
        $input = $request->all();
        // get API Configuration
        $api = new Api(env('RAZORPAY_KEY'), env('RAZORPAY_SECRET'));

        // Fetch payment information by razorpay_payment_id
        $payment = $api->payment->fetch($input['razorpay_payment_id']);

        if (count($input) && ! empty($input['razorpay_payment_id'])) {
            $payment_detalis = null;
            try {
                $response = $api->payment->fetch($input['razorpay_payment_id'])->capture(['amount' => $payment['amount']]);
                $payment_detalis = json_encode(['id' => $response['id'], 'method' => $response['method'], 'amount' => $response['amount'], 'currency' => $response['currency']]);
            } catch (\Exception $e) {
                return $e->getMessage();
            }

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
            // Do something here for store payment details in database...
            if ($request->payment_type) {
                if ($request->payment_type == 'package_payment') {
                    $packagePaymentController = new PackageController;

                    return $packagePaymentController->package_payment_done($request->user_id, $payment_data, $payment_detalis);
                } elseif ($request->payment_type == 'addon_payment') {
                    $addonPurchaseController = new AddonPurchaseController;

                    return $addonPurchaseController->addon_payment_done($request->user_id, $payment_data, $payment_detalis);
                } elseif ($request->payment_type == 'wallet_payment') {
                    $walletController = new WalletController;

                    return $walletController->wallet_payment_done($request->user_id, $payment_data, json_encode($payment_detalis));
                }
            }
        }
    }

    public function success(Request $request)
    {
        try {
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
            $response = $request->payment_details;
            if ($request->payment_type) {
                if ($request->payment_type == 'package_payment') {
                    $packagePaymentController = new PackageController;

                    return $packagePaymentController->package_payment_done($request->user_id, $payment_data, json_encode($response));
                } elseif ($request->payment_type == 'addon_payment') {
                    $addonPurchaseController = new AddonPurchaseController;

                    return $addonPurchaseController->addon_payment_done($request->user_id, $payment_data, json_encode($response));
                } elseif ($request->payment_type == 'wallet_payment') {
                    $walletController = new WalletController;

                    return $walletController->wallet_payment_done($request->user_id, $payment_data, json_encode($response));
                }
            }

        } catch (\Exception $e) {
            return response()->json(['result' => false, 'message' => $e->getMessage()]);
        }
    }
}
