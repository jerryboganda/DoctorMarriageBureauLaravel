<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\Member;
use App\Models\Address;
use App\Models\SpiritualBackground;
use App\Models\PhysicalAttribute;
use App\Models\ProfileCompletionReminderSetting;
use App\Models\ProfileCompletionReminderLog;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class SendProfileCompletionReminders extends Command
{
    protected $signature = 'reminders:profile-completion';
    protected $description = 'Send email reminders to members whose profile completion is below the configured threshold';

    public function handle(): int
    {
        $settings = ProfileCompletionReminderSetting::getSettings();

        if (!$settings->is_enabled) {
            $this->info('Profile completion reminders are disabled.');
            return 0;
        }

        $threshold = $settings->threshold_percent;
        $intervalDays = $settings->interval_days;
        $maxReminders = $settings->max_reminders;
        $subject = $settings->email_subject ?: 'Complete Your Profile - Doctor Marriage Bureau';

        // Default email body if not set
        $bodyTemplate = $settings->email_body ?: $this->getDefaultBody();

        // Get all active (non-blocked, non-deactivated, approved) members with emails
        $users = User::where('user_type', 'member')
            ->where('approved', 1)
            ->where('blocked', 0)
            ->where('deactivated', 0)
            ->whereNotNull('email')
            ->where('email', '!=', '')
            ->whereNull('deleted_at')
            ->get();

        $sentCount = 0;
        $skippedCount = 0;
        $errorCount = 0;

        foreach ($users as $user) {
            try {
                $member = Member::where('user_id', $user->id)->first();
                if (!$member) {
                    continue;
                }

                // Calculate profile completion
                $percentage = $this->calculateProfileCompletion($user, $member);

                // Skip if above threshold
                if ($percentage >= $threshold) {
                    continue;
                }

                // Check max reminders
                $totalSent = ProfileCompletionReminderLog::where('user_id', $user->id)
                    ->where('status', 'sent')
                    ->count();

                if ($totalSent >= $maxReminders) {
                    $skippedCount++;
                    continue;
                }

                // Check interval — has a reminder been sent in the last X days?
                $lastReminder = ProfileCompletionReminderLog::where('user_id', $user->id)
                    ->where('status', 'sent')
                    ->orderBy('sent_at', 'desc')
                    ->first();

                if ($lastReminder && $lastReminder->sent_at->diffInDays(now()) < $intervalDays) {
                    $skippedCount++;
                    continue;
                }

                // Build email body with placeholders
                $name = trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? '')) ?: 'Member';
                $link = 'https://panel.doctormarriagebureau.com.pk/profile-settings';

                $emailBody = str_replace(
                    ['{name}', '{percentage}', '{link}'],
                    [$name, $percentage . '%', '<a href="' . $link . '" style="color: #fff; background-color: #e74c3c; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Complete My Profile</a>'],
                    $bodyTemplate
                );

                // Send email using the same pattern as the rest of the app
                Mail::send('emails.index', ['email_body' => $emailBody], function ($message) use ($user, $subject, $name) {
                    $message->to($user->email, $name)
                        ->subject($subject)
                        ->from(\App\Utility\EmailUtility::fromAddress(), \App\Utility\EmailUtility::fromName());
                });

                // Log success
                ProfileCompletionReminderLog::create([
                    'user_id' => $user->id,
                    'profile_percentage' => $percentage,
                    'sent_at' => now(),
                    'status' => 'sent',
                ]);

                $sentCount++;

            } catch (\Exception $e) {
                // Log failure
                ProfileCompletionReminderLog::create([
                    'user_id' => $user->id,
                    'profile_percentage' => $percentage ?? 0,
                    'sent_at' => now(),
                    'status' => 'failed',
                    'error_message' => substr($e->getMessage(), 0, 500),
                ]);

                Log::error("Profile completion reminder failed for user #{$user->id}: " . $e->getMessage());
                $errorCount++;
            }
        }

        $this->info("Profile completion reminders: {$sentCount} sent, {$skippedCount} skipped, {$errorCount} failed.");
        return 0;
    }

    /**
     * Calculate profile completion using the same logic as ProfileController::getProfileCompletionData()
     */
    private function calculateProfileCompletion(User $user, Member $member): int
    {
        $presentAddress = Address::where('user_id', $user->id)->where('type', 'present')->first();
        $spiritual = SpiritualBackground::where('user_id', $user->id)->first();
        $career = DB::table('careers')
            ->where('user_id', $user->id)
            ->whereNull('deleted_at')
            ->orderByDesc('present')
            ->orderByDesc('updated_at')
            ->first();
        $education = DB::table('education')
            ->where('user_id', $user->id)
            ->whereNull('deleted_at')
            ->orderByDesc('is_highest_degree')
            ->orderByDesc('updated_at')
            ->first();
        $physical = PhysicalAttribute::where('user_id', $user->id)->first();

        // Step 1: Personal (5 fields)
        $fields = [
            trim((string) $user->first_name) !== '',
            trim((string) $user->last_name) !== '',
            !empty($member->gender),
            !empty($member->birthday),
            !empty($member->marital_status_id),
        ];

        // Step 2: Location & Religion (5 fields)
        $fields = array_merge($fields, [
            $presentAddress && !empty($presentAddress->country_id),
            $presentAddress && !empty($presentAddress->state_id),
            $presentAddress && !empty($presentAddress->city_id),
            $spiritual && !empty($spiritual->religion_id),
            $spiritual && !empty($spiritual->caste_id),
        ]);

        // Step 3: Career & Education (5 fields)
        $fields = array_merge($fields, [
            $career && trim((string) ($career->designation ?? '')) !== '',
            $career && trim((string) ($career->company ?? '')) !== '',
            $education && trim((string) ($education->degree ?? '')) !== '',
            $education && trim((string) ($education->institution ?? '')) !== '',
            !empty($member->annual_salary_range_id),
        ]);

        // Step 4: Appearance (3 fields)
        $fields = array_merge($fields, [
            $physical && $physical->height !== null && $physical->height !== '',
            $physical && $physical->weight !== null && $physical->weight !== '',
            $physical && trim((string) ($physical->complexion ?? '')) !== '',
        ]);

        // Step 5: About Me (1 field)
        $fields[] = trim((string) ($member->introduction ?? '')) !== '';

        // Step 6: Photo (1 field)
        $fields[] = !empty($user->photo);

        $total = count($fields);
        $filled = count(array_filter($fields));

        return $total > 0 ? (int) round(($filled / $total) * 100) : 0;
    }

    /**
     * Default HTML email body template with placeholders.
     */
    private function getDefaultBody(): string
    {
        return '
        <div style="font-family: \'Segoe UI\', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Doctor Marriage Bureau</h1>
                <p style="color: #fce4e4; margin: 8px 0 0; font-size: 14px;">Your profile needs attention</p>
            </div>
            <div style="padding: 30px 25px;">
                <p style="font-size: 16px; color: #333;">Dear <strong>{name}</strong>,</p>
                <p style="font-size: 15px; color: #555; line-height: 1.6;">
                    We noticed your profile is only <strong style="color: #e74c3c; font-size: 18px;">{percentage}</strong> complete.
                    A complete profile significantly increases your chances of finding the right match.
                </p>
                <div style="background: #fef5f5; border-left: 4px solid #e74c3c; padding: 15px; margin: 20px 0; border-radius: 4px;">
                    <p style="margin: 0; color: #555; font-size: 14px;">
                        <strong>Did you know?</strong> Members with 90%+ profile completion receive <strong>3x more interest</strong> from potential matches!
                    </p>
                </div>
                <div style="text-align: center; margin: 30px 0;">
                    {link}
                </div>
                <p style="font-size: 14px; color: #777; margin-top: 25px;">
                    Best regards,<br>
                    <strong>Doctor Marriage Bureau Team</strong>
                </p>
            </div>
            <div style="background: #f8f8f8; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #eee;">
                <p style="margin: 0; font-size: 12px; color: #999;">
                    This is an automated reminder. If you have already completed your profile, please ignore this email.
                </p>
            </div>
        </div>';
    }
}
