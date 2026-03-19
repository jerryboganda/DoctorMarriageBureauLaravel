<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\SmsTemplate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OtpController extends BaseAdminController
{
    public function templates(Request $request)
    {
        $query = SmsTemplate::query()->orderByDesc('id');
        if ($search = $request->get('search')) {
            $query->where('identifier', 'like', '%' . $search . '%')
                ->orWhere('subject', 'like', '%' . $search . '%')
                ->orWhere('sms_body', 'like', '%' . $search . '%');
        }

        return $this->ok($this->paginateQuery($request, $query));
    }

    public function storeTemplate(Request $request)
    {
        $template = SmsTemplate::create($request->all());
        return $this->ok($template, 'SMS template created');
    }

    public function updateTemplate(Request $request, $id)
    {
        $template = SmsTemplate::findOrFail($id);
        $template->fill($request->all());
        $template->save();

        return $this->ok($template, 'SMS template updated');
    }

    public function showTemplate($id)
    {
        $template = SmsTemplate::findOrFail($id);
        return $this->ok($template);
    }

    public function destroyTemplate($id)
    {
        $template = SmsTemplate::findOrFail($id);
        $template->delete();
        return $this->ok(null, 'SMS template deleted');
    }

    public function credentials()
    {
        $keys = [
            'otp.nexmo_key',
            'otp.nexmo_secret',
            'otp.twilio_sid',
            'otp.twilio_token',
            'otp.twilio_from',
            'otp.ssl_api_token',
            'otp.ssl_sid',
            'otp.fast2sms_auth_key',
        ];

        $rows = DB::table('settings')->whereIn('type', $keys)->pluck('value', 'type')->toArray();
        return $this->ok($rows);
    }

    public function updateCredentials(Request $request)
    {
        foreach ($request->all() as $key => $value) {
            $key = (string) $key;
            $type = str_starts_with($key, 'otp.') ? $key : ('otp.' . $key);

            DB::table('settings')->updateOrInsert(
                ['type' => $type],
                [
                    'value' => is_scalar($value) ? (string) $value : json_encode($value),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }

        return $this->ok(null, 'OTP credentials updated');
    }

    public function sendSms(Request $request)
    {
        $request->validate([
            'phone' => 'required|string|max:30',
            'message' => 'required|string|max:1000',
        ]);

        $sent = false;
        if (function_exists('sendSMS')) {
            try {
                sendSMS($request->phone, env('APP_NAME'), $request->message, null);
                $sent = true;
            } catch (\Throwable $e) {
                Log::warning('OTP send SMS failed: ' . $e->getMessage());
            }
        }

        if (!$sent) {
            Log::info('SMS fallback log', [
                'phone' => $request->phone,
                'message' => $request->message,
            ]);
        }

        return $this->ok([
            'sent' => $sent,
        ], $sent ? 'SMS sent successfully' : 'SMS logged (provider unavailable)');
    }
}
