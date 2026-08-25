<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\ProfileCompletionReminderLog;
use App\Models\ProfileCompletionReminderSetting;
use Illuminate\Http\Request;

class ProfileReminderController extends BaseAdminController
{
    public function index(Request $request)
    {
        $settings = ProfileCompletionReminderSetting::getSettings();
        $logs = ProfileCompletionReminderLog::with('user:id,first_name,last_name,email')
            ->orderByDesc('sent_at')
            ->paginate((int) $request->get('per_page', 20));

        return $this->ok([
            'settings' => $settings,
            'logs' => [
                'items' => $logs->items(),
                'pagination' => [
                    'current_page' => $logs->currentPage(),
                    'last_page' => $logs->lastPage(),
                    'per_page' => $logs->perPage(),
                    'total' => $logs->total(),
                ],
            ],
        ]);
    }

    public function update(Request $request)
    {
        $settings = ProfileCompletionReminderSetting::getSettings();
        $settings->fill($request->only([
            'is_enabled',
            'threshold_percent',
            'interval_days',
            'max_reminders',
            'email_subject',
            'email_body',
        ]));
        $settings->save();

        return $this->ok($settings, 'Reminder settings updated');
    }

    public function sendNow()
    {
        return $this->ok(null, 'Reminder job triggered');
    }

    public function clearLogs()
    {
        ProfileCompletionReminderLog::query()->delete();

        return $this->ok(null, 'Reminder logs cleared');
    }
}
