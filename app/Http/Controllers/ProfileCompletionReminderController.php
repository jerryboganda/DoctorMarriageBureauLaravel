<?php

namespace App\Http\Controllers;

use App\Models\ProfileCompletionReminderSetting;
use App\Models\ProfileCompletionReminderLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;

class ProfileCompletionReminderController extends Controller
{
    /**
     * Show the settings page with recent logs.
     */
    public function index()
    {
        $settings = ProfileCompletionReminderSetting::getSettings();

        $logs = ProfileCompletionReminderLog::with('user')
            ->orderBy('sent_at', 'desc')
            ->paginate(25);

        $stats = [
            'total_sent' => ProfileCompletionReminderLog::where('status', 'sent')->count(),
            'total_failed' => ProfileCompletionReminderLog::where('status', 'failed')->count(),
            'sent_today' => ProfileCompletionReminderLog::where('status', 'sent')
                ->whereDate('sent_at', today())
                ->count(),
            'unique_users_reminded' => ProfileCompletionReminderLog::where('status', 'sent')
                ->distinct('user_id')
                ->count('user_id'),
        ];

        return view('admin.profile_completion_reminders.index', compact('settings', 'logs', 'stats'));
    }

    /**
     * Update reminder settings.
     */
    public function update(Request $request)
    {
        $request->validate([
            'threshold_percent' => 'required|integer|min:10|max:100',
            'interval_days' => 'required|integer|min:1|max:90',
            'max_reminders' => 'required|integer|min:1|max:100',
            'email_subject' => 'required|string|max:255',
            'email_body' => 'nullable|string|max:10000',
        ]);

        $settings = ProfileCompletionReminderSetting::getSettings();

        $settings->update([
            'is_enabled' => $request->has('is_enabled') ? 1 : 0,
            'threshold_percent' => $request->threshold_percent,
            'interval_days' => $request->interval_days,
            'max_reminders' => $request->max_reminders,
            'email_subject' => $request->email_subject,
            'email_body' => $request->email_body,
        ]);

        flash(translate('Reminder settings updated successfully.'))->success();
        return redirect()->route('admin.profile_completion_reminders.index');
    }

    /**
     * Manually trigger sending reminders now.
     */
    public function sendNow()
    {
        try {
            Artisan::call('reminders:profile-completion');
            $output = Artisan::output();
            flash(translate('Reminders sent successfully! ') . $output)->success();
        } catch (\Exception $e) {
            flash(translate('Failed to send reminders: ') . $e->getMessage())->error();
        }

        return redirect()->route('admin.profile_completion_reminders.index');
    }

    /**
     * Clear all reminder logs.
     */
    public function clearLogs()
    {
        ProfileCompletionReminderLog::truncate();
        flash(translate('All reminder logs have been cleared.'))->success();
        return redirect()->route('admin.profile_completion_reminders.index');
    }
}
