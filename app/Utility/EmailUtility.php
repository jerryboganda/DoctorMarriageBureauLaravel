<?php

namespace App\Utility;

use App\Models\Package;
use App\Models\User;
use App\Notifications\EmailNotification;
use Auth;
use Notification;

class EmailUtility
{
    public static function fromAddress(): string
    {
        $address = trim((string) (config('mail.from.address') ?? env('MAIL_FROM_ADDRESS')));

        if ($address !== '' && strtolower($address) !== 'null') {
            return $address;
        }

        return 'noreply@doctormarriagebureau.com.pk';
    }

    public static function fromName(): string
    {
        $name = trim((string) (config('mail.from.name') ?? env('MAIL_FROM_NAME') ?? env('APP_NAME')));

        if ($name !== '' && strtolower($name) !== 'null') {
            return $name;
        }

        return 'Doctor Marriage Bureau';
    }

    public static function account_oppening_email($user_id = '', $pass = '')
    {
        $user = User::where('id', $user_id)->first();
        $subject = get_email_template('account_oppening_email', 'subject');
        $account_type = $user->membership == 1 ? 'Free' : 'Premium';
        $email_body = get_email_template('account_oppening_email', 'body');
        $email_body = str_replace('[[name]]', $user->first_name.' '.$user->last_name, $email_body);
        $email_body = str_replace('[[sitename]]', get_setting('website_name'), $email_body);
        $email_body = str_replace('[[account_type]]', $account_type, $email_body);
        $email_body = str_replace('[[email]]', $user->email, $email_body);
        $email_body = str_replace('[[password]]', $pass, $email_body);
        $email_body = str_replace('[[url]]', 'https://panel.doctormarriagebureau.com.pk/', $email_body);
        $email_body = str_replace('[[from]]', self::fromName(), $email_body);

        try {
            Notification::send($user, new EmailNotification($subject, $email_body));
        } catch (\Throwable $e) {
            // \Log::error('Email notification failed: ' . $e->getMessage());
        }
    }

    public static function account_opening_email_to_admin($user = '', $admin = '')
    {
        $subject = get_email_template('account_opening_email_to_admin', 'subject');
        $email_body = get_email_template('account_opening_email_to_admin', 'body');
        $email_body = str_replace('[[member_name]]', $user->first_name.' '.$user->last_name, $email_body);
        $email_body = str_replace('[[email]]', $user->email, $email_body);
        $email_body = str_replace('[[profile_link]]', env('APP_URL').'/admin/members/'.$user->id, $email_body);
        $email_body = str_replace('[[from]]', self::fromName(), $email_body);

        try {
            Notification::send($admin, new EmailNotification($subject, $email_body));
        } catch (\Throwable $e) {
            // \Log::error('Admin email notification failed: ' . $e->getMessage());
        }
    }

    public static function member_verification_email($user, $status)
    {
        $subject = get_email_template('member_verification_email', 'subject');
        $email_body = get_email_template('member_verification_email', 'body');
        $email_body = str_replace('[[name]]', $user->first_name.' '.$user->last_name, $email_body);
        $email_body = str_replace('[[status]]', $status, $email_body);
        $email_body = str_replace('[[from]]', self::fromName(), $email_body);

        try {
            Notification::send($user, new EmailNotification($subject, $email_body));
        } catch (\Throwable $e) {
            // \Log::error('Member verification email failed: ' . $e->getMessage());
        }
    }

    public static function staff_account_opening_email($user = '', $pass = '', $role_name = '')
    {
        $subject = get_email_template('staff_account_opening_email', 'subject');
        $email_body = get_email_template('staff_account_opening_email', 'body');
        $email_body = str_replace('[[name]]', $user->first_name.' '.$user->last_name, $email_body);
        $email_body = str_replace('[[site_name]]', get_setting('website_name'), $email_body);
        $email_body = str_replace('[[role_type]]', $role_name, $email_body);
        $email_body = str_replace('[[email]]', $user->email, $email_body);
        $email_body = str_replace('[[password]]', $pass, $email_body);
        $email_body = str_replace('[[url]]', 'https://panel.doctormarriagebureau.com.pk/', $email_body);
        $email_body = str_replace('[[from]]', self::fromName(), $email_body);

        try {
            Notification::send($user, new EmailNotification($subject, $email_body));
        } catch (\Throwable $e) {
            // \Log::error('Staff email notification failed: ' . $e->getMessage());
        }
    }

    public static function package_purchase_email($user = '', $package_payment = '')
    {
        $account_type = $package_payment->package_id == 1 ? 'Free' : 'Preminum';
        $package_name = Package::where('id', $package_payment->package_id)->first()->name;
        $subject = get_email_template('package_purchase_email', 'subject');
        $email_body = get_email_template('package_purchase_email', 'body');
        $email_body = str_replace('[[name]]', $user->first_name.' '.$user->last_name, $email_body);
        $email_body = str_replace('[[site_name]]', get_setting('website_name'), $email_body);
        $email_body = str_replace('[[account_type]]', $account_type, $email_body);
        $email_body = str_replace('[[payment_code]]', $package_payment->payment_code, $email_body);
        $email_body = str_replace('[[package]]', $package_name, $email_body);
        $email_body = str_replace('[[amount]]', $package_payment->amount, $email_body);
        $email_body = str_replace('[[from]]', self::fromName(), $email_body);

        try {
            Notification::send($user, new EmailNotification($subject, $email_body));
        } catch (\Throwable $e) {
            // \Log::error('Package purchase email failed: ' . $e->getMessage());
        }
    }

    public static function manual_payment_approval_email($user = '', $package_payment = '')
    {
        $account_type = $package_payment->package_id == 1 ? 'Free' : 'Preminum';
        $package_name = Package::where('id', $package_payment->package_id)->first()->name;
        $subject = get_email_template('manual_payment_approval_email', 'subject');
        $email_body = get_email_template('manual_payment_approval_email', 'body');
        $email_body = str_replace('[[name]]', $user->first_name.' '.$user->last_name, $email_body);
        $email_body = str_replace('[[account_type]]', $account_type, $email_body);
        $email_body = str_replace('[[payment_code]]', $package_payment->payment_code, $email_body);
        $email_body = str_replace('[[package]]', $package_name, $email_body);
        $email_body = str_replace('[[amount]]', $package_payment->amount, $email_body);
        $email_body = str_replace('[[from]]', self::fromName(), $email_body);

        try {
            Notification::send($user, new EmailNotification($subject, $email_body));
        } catch (\Throwable $e) {
            // \Log::error('Manual payment approval email failed: ' . $e->getMessage());
        }
    }

    public static function email_on_accepting_interest($user = '', $interest = '')
    {
        $subject = get_email_template('email_on_accepting_interest', 'subject');
        $email_body = get_email_template('email_on_accepting_interest', 'body');
        $email_body = str_replace('[[name]]', $user->first_name.' '.$user->last_name, $email_body);
        $email_body = str_replace('[[member_name]]', $interest->user->first_name.' '.$interest->user->last_name, $email_body);
        $email_body = str_replace('[[from]]', self::fromName(), $email_body);

        try {
            Notification::send($user, new EmailNotification($subject, $email_body));
        } catch (\Throwable $e) {
            // \Log::error('Accepting interest email failed: ' . $e->getMessage());
        }
    }

    public static function password_reset_email($user = '', $code = '')
    {
        // Guard: ensure we have a valid user with an email address
        if (! $user || empty($user->email)) {
            \Log::warning('Password reset email skipped: user is null or has no email address.', [
                'user_id' => $user ? ($user->id ?? 'unknown') : 'null',
            ]);

            return false;
        }

        // Bypass Notification system check forced to TRUE for debugging
        // MOVED TO TOP to avoid any DB/ENV hangs before this point
        if (config('mail.default') === 'log' || env('MAIL_MAILER') === 'log') {
            \Log::info('=== MOCKED EMAIL SENT (LOG DRIVER) ===');
            \Log::info('To: '.($user->email ?? 'Unknown'));
            \Log::info('Code: '.$code);
            \Log::info('=== END MOCKED EMAIL ===');

            return true;
        }

        $subject = get_email_template('password_reset_email', 'subject');
        $email_body = get_email_template('password_reset_email', 'body');
        $email_body = str_replace('[[name]]', ($user->first_name ?? '').' '.($user->last_name ?? ''), $email_body);
        $email_body = str_replace('[[code]]', $code, $email_body);
        $email_body = str_replace('[[from]]', self::fromName(), $email_body);

        try {
            // Add explicit timeout for Brevo SMTP
            config(['mail.mailers.smtp.timeout' => 30]);

            \Log::info('=== PASSWORD RESET EMAIL ATTEMPT ===');
            \Log::info('To: '.$user->email);
            \Log::info('SMTP Host: '.env('MAIL_HOST'));
            \Log::info('SMTP Port: '.env('MAIL_PORT'));

            // Notification::send($user, new EmailNotification($subject, $email_body));
            // Switched to Mail facade to align with working Mobile App logic (Port 465/SSL Google)
            \Mail::send('emails.index', ['email_body' => $email_body], function ($message) use ($user, $subject) {
                $fromEmail = self::fromAddress();
                $fromName = self::fromName();
                $message->to($user->email, ($user->first_name ?? '').' '.($user->last_name ?? ''))
                    ->subject($subject)
                    ->from($fromEmail, $fromName);
            });

            \Log::info('=== PASSWORD RESET EMAIL SENT SUCCESSFULLY ===');

            return true;
        } catch (\Throwable $e) {
            \Log::error('Password reset email failed: '.$e->getMessage());
            \Log::error('Full trace: '.$e->getTraceAsString());

            return false;
        }
    }

    public static function email_on_request($user, $identifier)
    {
        $auth_user = Auth::user();
        $subject = get_email_template($identifier, 'subject');
        $email_body = get_email_template($identifier, 'body');
        $email_body = str_replace('[[name]]', $user->first_name.' '.$user->last_name, $email_body);
        $email_body = str_replace('[[member_name]]', $auth_user->first_name.' '.$auth_user->last_name, $email_body);
        $email_body = str_replace('[[from]]', self::fromName(), $email_body);
        try {
            Notification::send($user, new EmailNotification($subject, $email_body));
        } catch (\Throwable $e) {
            // \Log::error('Email on request failed: ' . $e->getMessage());
        }
    }

    public static function email_on_accept_request($notify_user, $identifier)
    {
        $auth_user = Auth::user();
        $subject = get_email_template($identifier, 'subject');
        $email_body = get_email_template($identifier, 'body');
        $email_body = str_replace('[[name]]', $notify_user->first_name.' '.$notify_user->last_name, $email_body);
        $email_body = str_replace('[[member_name]]', $auth_user->first_name.' '.$auth_user->last_name, $email_body);
        $email_body = str_replace('[[from]]', self::fromName(), $email_body);
        try {
            Notification::send($notify_user, new EmailNotification($subject, $email_body));
        } catch (\Throwable $e) {
            // \Log::error('Email on accept request failed: ' . $e->getMessage());
        }
    }
}
