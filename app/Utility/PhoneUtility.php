<?php

namespace App\Utility;

class PhoneUtility
{
    /**
     * Normalize phone number to +92XXX... format for Pakistan.
     * Returns the same string if it doesn't match the pattern.
     */
    public static function normalize($phone)
    {
        if (empty($phone)) {
            return $phone;
        }

        // Remove spaces, dashes, or parentheses
        $phone = preg_replace('/[\s\-\(\)]+/', '', $phone);

        // Handle 03XXXXXXXXX (11 digits starting with 0)
        if (preg_match('/^03\d{9}$/', $phone)) {
            return '+92'.substr($phone, 1);
        }

        // Handle 92XXXXXXXXX (11 digits starting with 92)
        if (preg_match('/^923\d{9}$/', $phone)) {
            return '+'.$phone;
        }

        // Handle +92XXXXXXXXX (already correct)
        if (preg_match('/^\+923\d{9}$/', $phone)) {
            return $phone;
        }

        return $phone;
    }
}
