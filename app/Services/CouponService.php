<?php

namespace App\Services;

use App\Models\Coupon;
use App\Models\CouponRedemption;
use App\Models\User;

class CouponService
{
    public function validateCode(?string $code, User $user, ?float $amount, string $purchaseType): array
    {
        $normalized = strtoupper(trim((string) $code));

        if ($normalized === '') {
            return [
                'valid' => false,
                'message' => 'Invalid coupon code.',
            ];
        }

        $coupon = Coupon::whereRaw('UPPER(code) = ?', [$normalized])->first();

        if (! $coupon || ! $coupon->is_active) {
            return [
                'valid' => false,
                'message' => 'Coupon not found or inactive.',
            ];
        }

        $now = now();
        if ($coupon->starts_at && $now->lt($coupon->starts_at)) {
            return [
                'valid' => false,
                'message' => 'Coupon is not active yet.',
            ];
        }

        if ($coupon->expires_at && $now->gt($coupon->expires_at)) {
            return [
                'valid' => false,
                'message' => 'Coupon has expired.',
            ];
        }

        if ($coupon->max_redemptions !== null && $coupon->used_count >= $coupon->max_redemptions) {
            return [
                'valid' => false,
                'message' => 'Coupon redemption limit reached.',
            ];
        }

        if ($coupon->per_user_limit !== null) {
            $userCount = CouponRedemption::where('coupon_id', $coupon->id)
                ->where('user_id', $user->id)
                ->count();

            if ($userCount >= $coupon->per_user_limit) {
                return [
                    'valid' => false,
                    'message' => 'Coupon already used.',
                ];
            }
        }

        if ($purchaseType && $purchaseType !== 'any' && $coupon->applicable_to !== 'any' && $coupon->applicable_to !== $purchaseType) {
            return [
                'valid' => false,
                'message' => 'Coupon not applicable for this purchase.',
            ];
        }

        $discountAmount = 0.0;
        $finalAmount = $amount;

        if ($amount !== null) {
            if ($coupon->min_amount !== null && $amount < $coupon->min_amount) {
                return [
                    'valid' => false,
                    'message' => 'Cart total does not meet minimum required.',
                ];
            }

            if ($coupon->discount_type === 'percent') {
                $discountAmount = ($amount * $coupon->discount_value) / 100;
            } else {
                $discountAmount = $coupon->discount_value;
            }

            if ($discountAmount > $amount) {
                $discountAmount = $amount;
            }

            $discountAmount = round($discountAmount, 2);
            $finalAmount = round(max($amount - $discountAmount, 0), 2);
        }

        return [
            'valid' => true,
            'coupon' => $coupon,
            'discount_amount' => $discountAmount,
            'final_amount' => $finalAmount,
        ];
    }

    public function recordRedemption(Coupon $coupon, User $user, float $originalAmount, float $discountAmount, float $finalAmount, array $context = []): CouponRedemption
    {
        $query = CouponRedemption::where('coupon_id', $coupon->id)
            ->where('user_id', $user->id);

        if (! empty($context['package_payment_id'])) {
            $query->where('package_payment_id', $context['package_payment_id']);
        }

        if (! empty($context['addon_purchase_id'])) {
            $query->where('addon_purchase_id', $context['addon_purchase_id']);
        }

        $existing = $query->first();
        if ($existing) {
            return $existing;
        }

        $redemption = new CouponRedemption;
        $redemption->coupon_id = $coupon->id;
        $redemption->user_id = $user->id;
        $redemption->code = $coupon->code;
        $redemption->purchase_type = $context['purchase_type'] ?? null;
        $redemption->package_payment_id = $context['package_payment_id'] ?? null;
        $redemption->addon_purchase_id = $context['addon_purchase_id'] ?? null;
        $redemption->original_amount = $originalAmount;
        $redemption->discount_amount = $discountAmount;
        $redemption->final_amount = $finalAmount;
        $redemption->redeemed_at = now();
        $redemption->save();

        $coupon->increment('used_count');

        return $redemption;
    }
}
