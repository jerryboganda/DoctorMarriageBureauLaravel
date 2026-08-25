<?php

namespace App\Http\Controllers\Api;

use App\Services\CouponService;
use Illuminate\Http\Request;

class CouponController extends Controller
{
    public function validateCode(Request $request)
    {
        $this->validate($request, [
            'code' => 'required|string',
        ]);

        $user = auth()->user();
        $amount = $request->has('amount') ? (float) $request->amount : null;
        $purchaseType = $request->purchase_type ?? 'any';

        $couponService = new CouponService;
        $result = $couponService->validateCode($request->code, $user, $amount, $purchaseType);

        if (! $result['valid']) {
            return $this->failure_message($result['message']);
        }

        $coupon = $result['coupon'];

        return $this->response_data([
            'code' => $coupon->code,
            'discount_type' => $coupon->discount_type,
            'discount_value' => $coupon->discount_value,
            'discount_amount' => $result['discount_amount'],
            'final_amount' => $result['final_amount'],
            'min_amount' => $coupon->min_amount,
            'applicable_to' => $coupon->applicable_to,
        ]);
    }
}
