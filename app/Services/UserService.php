<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserService
{
    public function store(array $data)
    {
        $collection = collect($data);
        $password = Hash::make($data['password']);
        $code = unique_code();
        $approved = 0;
        $verification_code = random_int(100000, 999999);
        $referred_by = null;

        $membership = 1; // Default membership
        $user_type = 'member'; // Default user type

        $data = $collection->merge(compact('password', 'code', 'approved', 'verification_code', 'membership', 'user_type'))->toArray();

        // Remove referral_code from data before creating user - it's not a column in users table
        // Referral processing is handled by AuthController via ReferralService
        unset($data['referral_code']);

        return User::create($data);
    }
}
