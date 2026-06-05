<?php

namespace Tests\Feature;

use App\Http\Controllers\SettingController;
use App\Mail\EmailManager;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class SmtpSettingsTest extends TestCase
{
    public function test_smtp_settings_form_does_not_render_stored_password(): void
    {
        $view = file_get_contents(resource_path('views/admin/settings/smtp_settings.blade.php'));

        $this->assertStringContainsString('type="password"', $view);
        $this->assertStringContainsString('name="MAIL_PASSWORD" value=""', $view);
        $this->assertStringNotContainsString("env('MAIL_PASSWORD')", $view);
    }

    public function test_smtp_update_writes_modern_brevo_settings_and_preserves_blank_password(): void
    {
        $controller = new TestableSettingController;

        $request = Request::create('/admin/smtp-settings', 'POST', [
            'MAIL_DRIVER' => 'smtp',
            'MAIL_HOST' => 'smtp-relay.brevo.com',
            'MAIL_PORT' => '587',
            'MAIL_USERNAME' => 'smtp-login@example.com',
            'MAIL_PASSWORD' => '',
            'MAIL_ENCRYPTION' => 'tls',
            'MAIL_FROM_ADDRESS' => 'noreply@doctormarriagebureau.com.pk',
            'MAIL_FROM_NAME' => 'Doctor Marriage Bureau',
        ]);

        $controller->smtp_settings_update($request);

        $this->assertSame('smtp', $controller->writes['MAIL_MAILER']);
        $this->assertSame('smtp', $controller->writes['MAIL_DRIVER']);
        $this->assertSame('smtp-relay.brevo.com', $controller->writes['MAIL_HOST']);
        $this->assertSame('587', $controller->writes['MAIL_PORT']);
        $this->assertSame('smtp-login@example.com', $controller->writes['MAIL_USERNAME']);
        $this->assertSame('tls', $controller->writes['MAIL_ENCRYPTION']);
        $this->assertSame('noreply@doctormarriagebureau.com.pk', $controller->writes['MAIL_FROM_ADDRESS']);
        $this->assertSame('Doctor Marriage Bureau', $controller->writes['MAIL_FROM_NAME']);
        $this->assertArrayNotHasKey('MAIL_PASSWORD', $controller->writes);
        $this->assertTrue($controller->cacheCleared);
    }

    public function test_smtp_update_rejects_invalid_port_and_from_address(): void
    {
        $this->expectException(ValidationException::class);

        $controller = new TestableSettingController;
        $request = Request::create('/admin/smtp-settings', 'POST', [
            'MAIL_DRIVER' => 'smtp',
            'MAIL_HOST' => 'smtp-relay.brevo.com',
            'MAIL_PORT' => '99999',
            'MAIL_USERNAME' => 'smtp-login@example.com',
            'MAIL_ENCRYPTION' => 'tls',
            'MAIL_FROM_ADDRESS' => 'not-an-email',
            'MAIL_FROM_NAME' => 'Doctor Marriage Bureau',
        ]);

        $controller->smtp_settings_update($request);
    }

    public function test_smtp_test_sends_synchronous_mailable(): void
    {
        Mail::fake();

        config([
            'mail.from.address' => 'noreply@doctormarriagebureau.com.pk',
            'mail.from.name' => 'Doctor Marriage Bureau',
        ]);

        $response = $this
            ->withoutMiddleware()
            ->from('/admin/smtp-settings')
            ->post('/admin/test/smtp', ['email' => 'admin@example.com']);

        $response->assertRedirect('/admin/smtp-settings');

        Mail::assertSent(EmailManager::class, function (EmailManager $mail) {
            return $mail->hasTo('admin@example.com')
                && $mail->array['from'] === 'noreply@doctormarriagebureau.com.pk'
                && $mail->array['from_name'] === 'Doctor Marriage Bureau'
                && $mail->array['view'] === 'emails.index';
        });
    }
}

class TestableSettingController extends SettingController
{
    public array $writes = [];

    public bool $cacheCleared = false;

    public function overWriteEnvFile($type, $val)
    {
        $this->writes[$type] = $val;
    }

    protected function clearMailConfigurationCache(): void
    {
        $this->cacheCleared = true;
    }
}
