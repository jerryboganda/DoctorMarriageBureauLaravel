<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\SmsTemplate;
use Illuminate\Http\Request;

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
        return $this->ok([
            'sms_disabled' => true,
        ], 'SMS/OTP credentials are disabled because verification is email-only.');
    }

    public function updateCredentials(Request $request)
    {
        return response()->json([
            'success' => false,
            'message' => 'SMS/OTP credentials are disabled because verification is email-only.',
        ], 410);
    }

    public function sendSms(Request $request)
    {
        return response()->json([
            'success' => false,
            'sent' => false,
            'message' => 'SMS sending is disabled. Verification and password reset are email-only.',
        ], 410);
    }
}
