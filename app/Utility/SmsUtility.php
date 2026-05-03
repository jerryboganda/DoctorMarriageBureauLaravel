<?php
namespace App\Utility;

use Illuminate\Support\Facades\Log;

class SmsUtility
{
    private static function disabled(string $identifier): bool
    {
        Log::info('SMS utility call skipped because SMS is disabled.', [
            'identifier' => $identifier,
        ]);

        return false;
    }

    public static function mobile_number_verification($user = '')
    {
        return self::disabled('mobile_number_verification');
    }

    public static function account_opening_by_admin($user = '', $pass = '')
    {
        return self::disabled('account_opening_by_admin');
    }

    public static function account_approval($user = '')
    {
        return self::disabled('account_approval');
    }

    public static function staff_account_opening($user = '', $pass = '', $role_name = '')
    {
        return self::disabled('staff_account_opening');
    }

    public static function manual_payment_approval($user = '',  $package_payment = '')
    {
        return self::disabled('manual_payment_approval');
    }

    public static function password_reset($user = '', $code = '')
    {
        return self::disabled('password_reset');
    }

    public static function sms_on_request($user, $identifier)
    {
        return self::disabled($identifier);
    }

    public static function sms_on_accept_request($notify_user, $identifier)
    {
        return self::disabled($identifier);
    }
}
