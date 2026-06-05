<?php

namespace App\Http\Controllers\Api\Payment;

use App\Http\Controllers\Api\AddonPurchaseController;
use App\Http\Controllers\Api\Controller;
use App\Http\Controllers\Api\PackageController;
use App\Http\Controllers\Api\WalletController;
use App\Models\AddonProduct;
use App\Models\Package;
use App\Models\Transaction;
use App\Models\User;
use App\Services\CouponService;
use Illuminate\Http\Request;
use PaytmWallet;

class PaytmController extends Controller
{
    public function index(Request $request)
    {
        $package_id = 0;
        $addon_id = 0;
        $amount = (float) $request->amount;
        $purchaseType = null;
        $originalAmount = $amount;
        $discountAmount = 0;
        $couponId = null;
        $couponCode = $request->coupon_code;

        if ($request->payment_type == 'package_payment' && isset($request->package_id)) {
            $package = Package::find($request->package_id);
            if ($package) {
                $package_id = $package->id;
                $amount = (float) $package->price;
                $purchaseType = 'package';
            }
        } elseif ($request->payment_type == 'addon_payment' && isset($request->addon_id)) {
            $addon = AddonProduct::find($request->addon_id);
            if ($addon) {
                $addon_id = $addon->id;
                $amount = (float) $addon->price;
                $purchaseType = 'addon';
            }
        }

        $originalAmount = $amount;
        if (! empty($request->coupon_code) && $purchaseType) {
            $couponService = new CouponService;
            $couponResult = $couponService->validateCode($request->coupon_code, auth()->user(), $originalAmount, $purchaseType);
            if ($couponResult['valid']) {
                $couponId = $couponResult['coupon']->id;
                $couponCode = $couponResult['coupon']->code;
                $discountAmount = $couponResult['discount_amount'];
                $amount = $couponResult['final_amount'];
            }
        }

        if ($request->payment_type) {
            $payment_data = [
                'package_id' => $package_id,
                'addon_id' => $addon_id,
                'payment_method' => $request->payment_method,
                'amount' => $amount,
                'original_amount' => $originalAmount,
                'discount_amount' => $discountAmount,
                'coupon_id' => $couponId,
                'coupon_code' => $couponCode,
            ];

            $transaction = new Transaction;
            $transaction->user_id = auth()->user()->id;
            $transaction->gateway = 'paytm';
            $transaction->payment_type = $request->payment_type;
            $transaction->additional_content = json_encode($payment_data);
            $transaction->save();

            if (auth()->user()->phone != null) {
                $payment = PaytmWallet::with('receive');
                $payment->prepare([
                    'order' => $transaction->id,
                    'user' => auth()->user()->id,
                    'mobile_number' => auth()->user()->phone,
                    'email' => auth()->user()->email,
                    'amount' => $amount,
                    'callback_url' => route('api.paytm.callback'),
                ]);

                return $payment->receive();
            } else {
                return $this->failure_message('Please add phone number to your profile');
            }
        }
    }

    public function callback(Request $request)
    {
        $transaction = PaytmWallet::with('receive');

        $response = $transaction->response(); // To get raw response as array
        // Check out response parameters sent by paytm here -> http://paywithpaytm.com/developer/paytm_api_doc?target=interpreting-response-sent-by-paytm

        if ($transaction->isSuccessful()) {
            $transaction = Transaction::findOrFail($response['ORDERID']);
            auth()->login(User::findOrFail($transaction->user_id));
            if ($transaction->payment_type == 'package_payment') {
                return (new PackageController)->package_payment_done($transaction->user_id, json_decode($transaction->additional_content, true), json_encode($response));
            } elseif ($transaction->payment_type == 'addon_payment') {
                return (new AddonPurchaseController)->addon_payment_done($transaction->user_id, json_decode($transaction->additional_content, true), json_encode($response));
            } elseif ($transaction->payment_type == 'wallet_payment') {
                auth()->login(User::findOrFail($transaction->user_id));

                return (new WalletController)->wallet_payment_done($transaction->user_id, json_decode($transaction->additional_content, true), json_encode($response));
            }

            return response()->json(['result' => false, 'message' => translate('Payment failed')]);
        }
    }
}
