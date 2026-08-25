<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\SettingController as BladeSettingController;
use App\Mail\EmailManager;
use App\Utility\EmailUtility;
use Artisan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class SettingsController extends BaseAdminController
{
    public function general()
    {
        return $this->ok($this->readByPrefix('general.'));
    }

    public function updateGeneral(Request $request)
    {
        $this->saveByPrefix('general.', $request->all());

        return $this->ok(null, 'General settings updated');
    }

    public function smtp()
    {
        return $this->ok([
            'MAIL_MAILER' => config('mail.default', 'smtp'),
            'MAIL_DRIVER' => config('mail.default', 'smtp'),
            'MAIL_HOST' => config('mail.mailers.smtp.host'),
            'MAIL_PORT' => config('mail.mailers.smtp.port'),
            'MAIL_USERNAME' => config('mail.mailers.smtp.username'),
            'MAIL_PASSWORD_CONFIGURED' => EmailUtility::hasSmtpCredentials(),
            'MAIL_ENCRYPTION' => config('mail.mailers.smtp.encryption'),
            'MAIL_FROM_ADDRESS' => config('mail.from.address'),
            'MAIL_FROM_NAME' => config('mail.from.name'),
        ]);
    }

    public function updateSmtp(Request $request)
    {
        $validated = $request->validate([
            'MAIL_DRIVER' => 'nullable|in:smtp',
            'MAIL_MAILER' => 'nullable|in:smtp',
            'MAIL_HOST' => 'required|string|max:255',
            'MAIL_PORT' => 'required|integer|min:1|max:65535',
            'MAIL_USERNAME' => 'required|string|max:255',
            'MAIL_PASSWORD' => 'nullable|string|max:1000',
            'MAIL_ENCRYPTION' => 'required|in:tls,ssl',
            'MAIL_FROM_ADDRESS' => 'required|email|max:255',
            'MAIL_FROM_NAME' => 'required|string|max:255',
        ]);

        $settings = [
            'MAIL_MAILER' => 'smtp',
            'MAIL_DRIVER' => 'smtp',
            'MAIL_HOST' => $validated['MAIL_HOST'],
            'MAIL_PORT' => (string) $validated['MAIL_PORT'],
            'MAIL_USERNAME' => $validated['MAIL_USERNAME'],
            'MAIL_ENCRYPTION' => $validated['MAIL_ENCRYPTION'],
            'MAIL_FROM_ADDRESS' => $validated['MAIL_FROM_ADDRESS'],
            'MAIL_FROM_NAME' => $validated['MAIL_FROM_NAME'],
        ];

        if (! empty($validated['MAIL_PASSWORD'])) {
            $settings['MAIL_PASSWORD'] = $validated['MAIL_PASSWORD'];
        }

        $envWriter = app(BladeSettingController::class);
        foreach ($settings as $key => $value) {
            $envWriter->overWriteEnvFile($key, $value);
        }

        Artisan::call('config:clear');
        Artisan::call('cache:clear');

        return $this->ok(null, 'SMTP settings updated');
    }

    public function testSmtp(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email|max:255',
        ]);

        Mail::to($validated['email'])->send(new EmailManager([
            'view' => 'emails.index',
            'subject' => 'SMTP Test - Doctor Marriage Bureau',
            'from' => EmailUtility::fromAddress(),
            'from_name' => EmailUtility::fromName(),
            'email_body' => 'This is a test email from Doctor Marriage Bureau SMTP settings.',
        ]));

        return $this->ok(['sent' => true], 'SMTP test email sent');
    }

    public function paymentMethods()
    {
        return $this->ok($this->readByPrefix('payment_method.'));
    }

    public function updatePaymentMethods(Request $request)
    {
        $this->saveByPrefix('payment_method.', $request->all());

        return $this->ok(null, 'Payment method settings updated');
    }

    public function thirdParty()
    {
        return $this->ok($this->readByPrefix('third_party.'));
    }

    public function updateThirdParty(Request $request)
    {
        $this->saveByPrefix('third_party.', $request->all());

        return $this->ok(null, 'Third-party settings updated');
    }

    public function socialLogin()
    {
        return $this->ok($this->readByPrefix('social_login.'));
    }

    public function updateSocialLogin(Request $request)
    {
        $this->saveByPrefix('social_login.', $request->all());

        return $this->ok(null, 'Social login settings updated');
    }

    public function fcm()
    {
        return $this->ok($this->readByPrefix('fcm.'));
    }

    public function updateFcm(Request $request)
    {
        $this->saveByPrefix('fcm.', $request->all());

        return $this->ok(null, 'FCM settings updated');
    }

    public function verificationForm()
    {
        return $this->ok($this->readByPrefix('member_verification_form.'));
    }

    public function updateVerificationForm(Request $request)
    {
        $this->saveByPrefix('member_verification_form.', $request->all());

        return $this->ok(null, 'Verification form settings updated');
    }

    public function profileSections()
    {
        return $this->ok($this->readByPrefix('member_profile_sections.'));
    }

    public function updateProfileSections(Request $request)
    {
        $this->saveByPrefix('member_profile_sections.', $request->all());

        return $this->ok(null, 'Profile sections updated');
    }

    public function envUpdate(Request $request)
    {
        $this->saveByPrefix('env.', $request->all());

        return $this->ok(null, 'Environment values stored');
    }

    public function updateActivation(Request $request)
    {
        $this->saveByPrefix('activation.', $request->all());

        return $this->ok(null, 'Activation settings updated');
    }

    protected function readByPrefix(string $prefix): array
    {
        return DB::table('settings')
            ->where('type', 'like', $prefix.'%')
            ->pluck('value', 'type')
            ->toArray();
    }

    protected function saveByPrefix(string $prefix, array $payload): void
    {
        foreach ($payload as $key => $value) {
            $normalizedKey = str_starts_with((string) $key, $prefix)
                ? substr((string) $key, strlen($prefix))
                : (string) $key;

            DB::table('settings')->updateOrInsert(
                ['type' => $prefix.$normalizedKey],
                [
                    'value' => is_scalar($value) ? (string) $value : json_encode($value),
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }
    }
}
