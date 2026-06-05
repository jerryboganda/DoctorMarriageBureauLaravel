<?php

namespace App\Http\Controllers\Api\Payment;

use App\Http\Controllers\Api\AddonPurchaseController;
use App\Http\Controllers\Api\Controller;
use App\Http\Controllers\Api\PackageController;
use App\Http\Controllers\Api\WalletController;
use App\Models\AddonProduct;
use App\Models\Currency;
use App\Models\Package;
use App\Services\CouponService;
use Illuminate\Http\Request;
use PayPalCheckoutSdk\Core\PayPalHttpClient;
use PayPalCheckoutSdk\Core\ProductionEnvironment;
use PayPalCheckoutSdk\Core\SandboxEnvironment;
use PayPalCheckoutSdk\Orders\OrdersCaptureRequest;
use PayPalCheckoutSdk\Orders\OrdersCreateRequest;
use PayPalHttp\HttpException;

class PaypalController extends Controller
{
    public function pay(Request $request)
    {
        $auth_user = auth()->user();
        $clientId = env('PAYPAL_CLIENT_ID');
        $clientSecret = env('PAYPAL_CLIENT_SECRET');

        if (get_setting('paypal_sandbox') == 1) {
            $environment = new SandboxEnvironment($clientId, $clientSecret);
        } else {
            $environment = new ProductionEnvironment($clientId, $clientSecret);
        }
        $client = new PayPalHttpClient($environment);
        $data = [];
        $data['payment_type'] = $request->payment_type;
        $data['amount'] = $request->amount;
        $data['payment_method'] = $request->payment_method;
        $data['user_id'] = $request->user_id;
        $data['package_id'] = 0;
        $data['addon_id'] = 0;
        $data['original_amount'] = null;
        $data['discount_amount'] = null;
        $data['coupon_id'] = null;
        $data['coupon_code'] = $request->coupon_code;

        $amount = (float) $request->amount;
        if ($data['payment_type'] == 'package_payment') {
            $package = Package::where('id', $request->package_id)->first();
            if (! $package) {
                return response()->json(['result' => false, 'message' => 'Invalid package.']);
            }
            $data['package_id'] = $package->id;
            $amount = (float) $package->price;
        } elseif ($data['payment_type'] == 'addon_payment') {
            $addon = AddonProduct::where('id', $request->addon_id)->first();
            if (! $addon) {
                return response()->json(['result' => false, 'message' => 'Invalid add-on.']);
            }
            $data['addon_id'] = $addon->id;
            $amount = (float) $addon->price;
        }

        if ($data['payment_type'] == 'package_payment') {
            if (addon_activation('referral_system') && $auth_user->referred_by != null && $auth_user->referral_comission == 0) {
                $referral_discount_amount = get_setting('referral_user_package_purchase_discount');
                $discount_type = get_setting('referral_user_package_purchase_discount_type');
                if ($discount_type == 'percent') {
                    $amount = $amount - ($package->price * $referral_discount_amount) / 100;
                } else {
                    $amount = $amount - $referral_discount_amount;
                }

            }
        }

        $originalAmount = $amount;
        if (! empty($request->coupon_code) && in_array($data['payment_type'], ['package_payment', 'addon_payment'], true)) {
            $couponService = new CouponService;
            $purchaseType = $data['payment_type'] === 'addon_payment' ? 'addon' : 'package';
            $couponResult = $couponService->validateCode($request->coupon_code, $auth_user, $originalAmount, $purchaseType);
            if (! $couponResult['valid']) {
                return response()->json(['result' => false, 'message' => $couponResult['message']]);
            }
            $data['coupon_id'] = $couponResult['coupon']->id;
            $data['coupon_code'] = $couponResult['coupon']->code;
            $data['discount_amount'] = $couponResult['discount_amount'];
            $data['original_amount'] = $originalAmount;
            $amount = $couponResult['final_amount'];
        } else {
            $data['original_amount'] = $originalAmount;
            $data['discount_amount'] = 0;
        }

        $data['amount'] = $amount;

        $request = new OrdersCreateRequest;
        $request->prefer('return=representation');
        $request->body = [
            'intent' => 'CAPTURE',
            'purchase_units' => [[
                'reference_id' => rand(000000, 999999),
                'amount' => [
                    'value' => $amount,
                    'currency_code' => Currency::findOrFail(get_setting('system_default_currency'))->code,
                ],
            ]],
            'application_context' => [
                'cancel_url' => route('api.paypal.cancel'),
                'return_url' => route('api.paypal.done', $data),
            ],
        ];

        try {
            // Call API with your client and get a response for your call
            $response = $client->execute($request);

            // If call returns body in response, you can get the deserialized version from the result attribute of the response
            return response()->json(['result' => true, 'url' => $response->result->links[1]->href, 'message' => 'Found redirect url']);
        } catch (HttpException $ex) {
            return response()->json(['result' => false, 'url' => '', 'message' => 'Could not find redirect url']);
        }
    }

    public function getDone(Request $request)
    {
        // Creating an environment
        $clientId = env('PAYPAL_CLIENT_ID');
        $clientSecret = env('PAYPAL_CLIENT_SECRET');

        if (get_setting('paypal_sandbox') == 1) {
            $environment = new SandboxEnvironment($clientId, $clientSecret);
        } else {
            $environment = new ProductionEnvironment($clientId, $clientSecret);
        }
        $client = new PayPalHttpClient($environment);

        // $response->result->id gives the orderId of the order created above

        $ordersCaptureRequest = new OrdersCaptureRequest($request->token);
        $ordersCaptureRequest->prefer('return=representation');
        try {
            // Call API with your client and get a response for your call
            $response = $client->execute($ordersCaptureRequest);

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

            if ($request->payment_type) {
                if ($request->payment_type == 'package_payment') {
                    $packagePaymentController = new PackageController;

                    return $packagePaymentController->package_payment_done($request->user_id, $payment_data, json_encode($response));
                } elseif ($request->payment_type == 'addon_payment') {
                    $addonPaymentController = new AddonPurchaseController;

                    return $addonPaymentController->addon_payment_done($request->user_id, $payment_data, json_encode($response));
                } elseif ($request->payment_type == 'wallet_payment') {
                    $walletController = new WalletController;

                    return $walletController->wallet_payment_done($request->user_id, $payment_data, json_encode($response));
                }
            }
        } catch (HttpException $ex) {
            return response()->json(['result' => false, 'message' => translate('Payment failed')]);
        }
    }

    public function getCancel(Request $request)
    {
        return response()->json(['result' => true, 'message' => translate('Payment failed or got cancelled')]);
    }
}
