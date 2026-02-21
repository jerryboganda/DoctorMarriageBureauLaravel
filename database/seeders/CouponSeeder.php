<?php

namespace Database\Seeders;

use App\Models\Coupon;
use Illuminate\Database\Seeder;

class CouponSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $coupons = [
            [
                'code' => 'WELCOME10',
                'name' => 'Welcome 10% Off',
                'description' => '10% off on any package purchase.',
                'discount_type' => 'percent',
                'discount_value' => 10,
                'min_amount' => null,
                'max_redemptions' => 500,
                'per_user_limit' => 1,
                'applicable_to' => 'package',
                'starts_at' => null,
                'expires_at' => null,
                'is_active' => true,
            ],
            [
                'code' => 'ADDON5',
                'name' => 'Flat 5 Off Add-ons',
                'description' => 'Save 5 on any add-on purchase.',
                'discount_type' => 'amount',
                'discount_value' => 5,
                'min_amount' => 10,
                'max_redemptions' => 200,
                'per_user_limit' => 2,
                'applicable_to' => 'addon',
                'starts_at' => null,
                'expires_at' => null,
                'is_active' => true,
            ],
            [
                'code' => 'MATCH50',
                'name' => 'Flat 50 Off',
                'description' => 'Save 50 on any purchase above 500.',
                'discount_type' => 'amount',
                'discount_value' => 50,
                'min_amount' => 500,
                'max_redemptions' => 100,
                'per_user_limit' => 1,
                'applicable_to' => 'any',
                'starts_at' => null,
                'expires_at' => null,
                'is_active' => true,
            ],
        ];

        foreach ($coupons as $coupon) {
            Coupon::updateOrCreate(
                ['code' => $coupon['code']],
                $coupon
            );
        }
    }
}
