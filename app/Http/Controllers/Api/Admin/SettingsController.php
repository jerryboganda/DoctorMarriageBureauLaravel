<?php

namespace App\Http\Controllers\Api\Admin;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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
        return $this->ok($this->readByPrefix('smtp.'));
    }

    public function updateSmtp(Request $request)
    {
        $this->saveByPrefix('smtp.', $request->all());
        return $this->ok(null, 'SMTP settings updated');
    }

    public function testSmtp(Request $request)
    {
        return $this->ok(['sent' => false], 'SMTP test queued');
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
            ->where('type', 'like', $prefix . '%')
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
                ['type' => $prefix . $normalizedKey],
                [
                    'value' => is_scalar($value) ? (string) $value : json_encode($value),
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }
    }
}
