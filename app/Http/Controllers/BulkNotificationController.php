<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Member;
use App\Models\Package;
use App\Models\Country;
use App\Models\State;
use App\Models\City;
use App\Models\Religion;
use App\Models\MaritalStatus;
use App\Models\Address;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class BulkNotificationController extends Controller
{
    /**
     * Show the bulk notification form with all filter options.
     */
    public function index()
    {
        $packages = Package::whereNull('deleted_at')->get();
        $countries = Country::whereNull('deleted_at')->orderBy('name')->get();
        $religions = Religion::whereNull('deleted_at')->orderBy('name')->get();
        $maritalStatuses = MaritalStatus::whereNull('deleted_at')->orderBy('name')->get();
        $users = User::where('user_type', 'member')
            ->whereNull('deleted_at')
            ->orderBy('first_name')
            ->select('id', 'first_name', 'last_name', 'email', 'phone')
            ->get();

        // Recent bulk notification logs
        $logs = DB::table('bulk_notification_logs')
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get();

        return view('admin.marketing.bulk_notifications', compact(
            'packages', 'countries', 'religions', 'maritalStatuses', 'users', 'logs'
        ));
    }

    /**
     * Get states by country (AJAX).
     */
    public function getStates(Request $request)
    {
        $states = State::where('country_id', $request->country_id)
            ->whereNull('deleted_at')
            ->orderBy('name')
            ->get(['id', 'name']);
        return response()->json($states);
    }

    /**
     * Get cities by state (AJAX).
     */
    public function getCities(Request $request)
    {
        $cities = City::where('state_id', $request->state_id)
            ->whereNull('deleted_at')
            ->orderBy('name')
            ->get(['id', 'name']);
        return response()->json($cities);
    }

    /**
     * Preview count of matching users.
     */
    public function previewCount(Request $request)
    {
        $query = $this->buildFilteredQuery($request);
        $count = $query->count();
        return response()->json(['count' => $count]);
    }

    /**
     * Send bulk notifications based on filters.
     */
    public function send(Request $request)
    {
        $request->validate([
            'title'     => 'required|string|max:255',
            'body'      => 'required|string|max:10000',
            'channels'  => 'required|array|min:1',
            'channels.*' => 'in:email,sms,whatsapp,push',
        ]);

        $channels = $request->channels;
        $title = $request->title;
        $body = $request->body;

        // Build the filtered user query
        $users = $this->buildFilteredQuery($request)->get();

        $stats = [
            'total_targeted' => $users->count(),
            'email_sent' => 0,
            'email_failed' => 0,
            'sms_sent' => 0,
            'sms_failed' => 0,
            'push_sent' => 0,
            'push_failed' => 0,
            'whatsapp_links' => [],
        ];

        if ($users->isEmpty()) {
            flash(translate('No matching members found for the selected filters.'))->warning();
            return redirect()->route('admin.bulk_notifications.index');
        }

        foreach ($users as $user) {
            $name = trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? '')) ?: 'Member';

            // --- EMAIL ---
            if (in_array('email', $channels)) {
                if (!empty($user->email)) {
                    try {
                        Mail::send('emails.index', ['email_body' => $body], function ($message) use ($user, $title, $name) {
                            $message->to($user->email, $name)
                                ->subject($title)
                                ->from(\App\Utility\EmailUtility::fromAddress(), \App\Utility\EmailUtility::fromName());
                        });
                        $stats['email_sent']++;
                    } catch (\Throwable $e) {
                        Log::error("Bulk notification email failed for user #{$user->id}: " . $e->getMessage());
                        $stats['email_failed']++;
                    }
                }
            }

            // --- SMS ---
            if (in_array('sms', $channels)) {
                if (!empty($user->phone)) {
                    try {
                        $smsText = $title . "\n\n" . strip_tags($body);
                        sendSMS($user->phone, env('APP_NAME'), $smsText, '');
                        $stats['sms_sent']++;
                    } catch (\Throwable $e) {
                        Log::error("Bulk notification SMS failed for user #{$user->id}: " . $e->getMessage());
                        $stats['sms_failed']++;
                    }
                }
            }

            // --- PUSH NOTIFICATION (via Soketi WebSocket + Database) ---
            if (in_array('push', $channels)) {
                try {
                    $notifyId = unique_notify_id();
                    \Illuminate\Support\Facades\Notification::send($user, new \App\Notifications\DbStoreNotification(
                        'admin_notification',
                        $notifyId,
                        $user->id,
                        auth()->id(),
                        strip_tags($body),
                        'notifications',
                        $title
                    ));

                    broadcast(new \App\Events\NotificationReceived($user->id, [
                        'type'    => 'admin_notification',
                        'title'   => $title,
                        'body'    => strip_tags($body),
                        'message' => strip_tags($body),
                        'sent_by' => auth()->user()->first_name . ' ' . auth()->user()->last_name,
                    ]));

                    $stats['push_sent']++;
                } catch (\Throwable $e) {
                    Log::error("Bulk notification push failed for user #{$user->id}: " . $e->getMessage());
                    $stats['push_failed']++;
                }
            }

            // --- WHATSAPP ---
            if (in_array('whatsapp', $channels)) {
                $waDigits = $this->normalizeWhatsappPhone($user->phone);
                if ($waDigits) {
                    $waMessage = "*{$title}*\n\n" . strip_tags($body);
                    $stats['whatsapp_links'][] = [
                        'name' => $name,
                        'phone' => $user->phone,
                        'link' => 'https://web.whatsapp.com/send?phone=' . $waDigits . '&text=' . urlencode($waMessage),
                    ];
                }
            }
        }

        // Log this bulk notification
        DB::table('bulk_notification_logs')->insert([
            'admin_id' => auth()->id(),
            'title' => $title,
            'channels' => implode(',', $channels),
            'filters_summary' => $this->buildFiltersSummary($request),
            'total_targeted' => $stats['total_targeted'],
            'email_sent' => $stats['email_sent'],
            'email_failed' => $stats['email_failed'],
            'sms_sent' => $stats['sms_sent'],
            'sms_failed' => $stats['sms_failed'],
            'push_sent' => $stats['push_sent'],
            'push_failed' => $stats['push_failed'],
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Build result message
        $messages = [];
        if (in_array('email', $channels)) {
            $messages[] = "Email {$stats['email_sent']}/{$stats['email_failed']}";
        }
        if (in_array('sms', $channels)) {
            $messages[] = "SMS {$stats['sms_sent']}/{$stats['sms_failed']}";
        }
        if (in_array('push', $channels)) {
            $messages[] = "Push {$stats['push_sent']}/{$stats['push_failed']}";
        }
        if (in_array('whatsapp', $channels)) {
            $messages[] = 'WhatsApp ' . count($stats['whatsapp_links']);
        }

        $resultMsg = "Sent to {$stats['total_targeted']} members | " . implode(' | ', $messages);

        // If there are WhatsApp links, store in session for display
        if (!empty($stats['whatsapp_links'])) {
            session()->flash('whatsapp_links', $stats['whatsapp_links']);
        }

        flash($resultMsg)->success();
        return redirect()->route('admin.bulk_notifications.index');
    }

    /**
     * Build filtered user query based on request parameters.
     */
    private function buildFilteredQuery(Request $request)
    {
        $query = User::where('user_type', 'member')
            ->whereNull('users.deleted_at');

        // --- Target Mode ---
        $targetMode = $request->input('target_mode', 'all');

        if ($targetMode === 'individual') {
            $userIds = $request->input('user_ids', []);
            if (!empty($userIds)) {
                $query->whereIn('users.id', $userIds);
            } else {
                $query->whereRaw('1 = 0'); // no results
            }
            return $query;
        }

        // --- From here: "filtered" mode ---

        // Membership filter
        if ($request->filled('membership')) {
            $query->where('users.membership', $request->membership);
        }

        // Package filter
        if ($request->filled('package_id')) {
            $query->whereHas('member', function ($q) use ($request) {
                $q->where('current_package_id', $request->package_id);
            });
        }

        // Gender filter
        if ($request->filled('gender')) {
            $query->whereHas('member', function ($q) use ($request) {
                $q->where('gender', $request->gender);
            });
        }

        // Marital Status filter
        if ($request->filled('marital_status_id')) {
            $query->whereHas('member', function ($q) use ($request) {
                $q->where('marital_status_id', $request->marital_status_id);
            });
        }

        // Country filter (via addresses)
        if ($request->filled('country_id')) {
            $query->whereHas('addresses', function ($q) use ($request) {
                $q->where('type', 'present')->where('country_id', $request->country_id);
            });
        }

        // State filter
        if ($request->filled('state_id')) {
            $query->whereHas('addresses', function ($q) use ($request) {
                $q->where('type', 'present')->where('state_id', $request->state_id);
            });
        }

        // City filter
        if ($request->filled('city_id')) {
            $query->whereHas('addresses', function ($q) use ($request) {
                $q->where('type', 'present')->where('city_id', $request->city_id);
            });
        }

        // Religion filter (via spiritual_backgrounds)
        if ($request->filled('religion_id')) {
            $query->whereExists(function ($q) use ($request) {
                $q->select(DB::raw(1))
                    ->from('spiritual_backgrounds')
                    ->whereColumn('spiritual_backgrounds.user_id', 'users.id')
                    ->where('spiritual_backgrounds.religion_id', $request->religion_id)
                    ->whereNull('spiritual_backgrounds.deleted_at');
            });
        }

        // Approved/Unapproved filter
        if ($request->filled('approved')) {
            $query->where('users.approved', $request->approved);
        }

        // Blocked filter
        if ($request->filled('blocked')) {
            $query->where('users.blocked', $request->blocked);
        }

        // Deactivated filter
        if ($request->filled('deactivated')) {
            $query->where('users.deactivated', $request->deactivated);
        }

        // Has Photo filter
        if ($request->filled('has_photo')) {
            if ($request->has_photo == '1') {
                $query->whereNotNull('users.photo')->where('users.photo', '!=', '');
            } else {
                $query->where(function ($q) {
                    $q->whereNull('photo')->orWhere('photo', '');
                });
            }
        }

        // Has Email filter
        if ($request->filled('has_email')) {
            if ($request->has_email == '1') {
                $query->whereNotNull('users.email')->where('users.email', '!=', '');
            } else {
                $query->where(function ($q) {
                    $q->whereNull('email')->orWhere('email', '');
                });
            }
        }

        // Has Phone filter
        if ($request->filled('has_phone')) {
            if ($request->has_phone == '1') {
                $query->whereNotNull('users.phone')->where('users.phone', '!=', '');
            } else {
                $query->where(function ($q) {
                    $q->whereNull('phone')->orWhere('phone', '');
                });
            }
        }

        // Onboarding Completed filter
        if ($request->filled('onboarding_completed')) {
            $query->whereHas('member', function ($q) use ($request) {
                $q->where('onboarding_completed', $request->onboarding_completed);
            });
        }

        // Age Range filter
        if ($request->filled('age_from') || $request->filled('age_to')) {
            $query->whereHas('member', function ($q) use ($request) {
                if ($request->filled('age_from')) {
                    $q->where('birthday', '<=', now()->subYears((int) $request->age_from));
                }
                if ($request->filled('age_to')) {
                    $q->where('birthday', '>=', now()->subYears((int) $request->age_to));
                }
            });
        }

        // Registered date range filter
        if ($request->filled('registered_from')) {
            $query->where('users.created_at', '>=', $request->registered_from);
        }
        if ($request->filled('registered_to')) {
            $query->where('users.created_at', '<=', $request->registered_to . ' 23:59:59');
        }

        // Marriage Timeline filter
        if ($request->filled('marriage_timeline')) {
            $query->whereHas('member', function ($q) use ($request) {
                $q->where('marriage_timeline', $request->marriage_timeline);
            });
        }

        // Seriousness Level filter
        if ($request->filled('seriousness_level')) {
            $query->whereHas('member', function ($q) use ($request) {
                $q->where('seriousness_level', $request->seriousness_level);
            });
        }

        return $query;
    }

    /**
     * Build a human-readable summary of the applied filters.
     */
    private function buildFiltersSummary(Request $request): string
    {
        $parts = [];
        $targetMode = $request->input('target_mode', 'all');

        if ($targetMode === 'individual') {
            $count = count($request->input('user_ids', []));
            $parts[] = "Individual ({$count} users)";
        } else {
            if ($request->filled('membership')) {
                $parts[] = 'Membership: ' . ($request->membership == 1 ? 'Free' : 'Premium');
            }
            if ($request->filled('gender')) {
                $parts[] = 'Gender: ' . ucfirst($request->gender);
            }
            if ($request->filled('package_id')) {
                $pkg = Package::find($request->package_id);
                $parts[] = 'Package: ' . ($pkg->name ?? $request->package_id);
            }
            if ($request->filled('country_id')) {
                $c = Country::find($request->country_id);
                $parts[] = 'Country: ' . ($c->name ?? $request->country_id);
            }
            if ($request->filled('state_id')) {
                $s = State::find($request->state_id);
                $parts[] = 'State: ' . ($s->name ?? $request->state_id);
            }
            if ($request->filled('city_id')) {
                $ci = City::find($request->city_id);
                $parts[] = 'City: ' . ($ci->name ?? $request->city_id);
            }
            if ($request->filled('religion_id')) {
                $r = Religion::find($request->religion_id);
                $parts[] = 'Religion: ' . ($r->name ?? $request->religion_id);
            }
            if ($request->filled('marital_status_id')) {
                $ms = MaritalStatus::find($request->marital_status_id);
                $parts[] = 'Marital: ' . ($ms->name ?? $request->marital_status_id);
            }
            if ($request->filled('age_from') || $request->filled('age_to')) {
                $parts[] = 'Age: ' . ($request->age_from ?? '?') . '-' . ($request->age_to ?? '?');
            }
            if ($request->filled('approved')) {
                $parts[] = 'Approved: ' . ($request->approved ? 'Yes' : 'No');
            }
            if ($request->filled('deactivated')) {
                $parts[] = 'Deactivated: ' . ($request->deactivated ? 'Yes' : 'No');
            }
            if ($request->filled('has_photo')) {
                $parts[] = 'Photo: ' . ($request->has_photo ? 'Yes' : 'No');
            }
            if ($request->filled('onboarding_completed')) {
                $parts[] = 'Onboarded: ' . ($request->onboarding_completed ? 'Yes' : 'No');
            }
            if ($request->filled('marriage_timeline')) {
                $parts[] = 'Timeline: ' . $request->marriage_timeline;
            }
            if ($request->filled('seriousness_level')) {
                $parts[] = 'Seriousness: ' . $request->seriousness_level;
            }
        }

        return empty($parts) ? 'All Members' : implode(' | ', $parts);
    }

    /**
     * Normalize phone number to WhatsApp-compatible format.
     */
    private function normalizeWhatsappPhone(?string $rawPhone): ?string
    {
        $phone = trim((string) $rawPhone);
        if ($phone === '') {
            return null;
        }

        $phone = str_replace([' ', '-', '(', ')', '.'], '', $phone);
        if (strpos($phone, '00') === 0) {
            $phone = '+' . substr($phone, 2);
        }

        $normalized = null;
        if (strpos($phone, '+') === 0) {
            $digits = preg_replace('/\D+/', '', substr($phone, 1));
            $normalized = $digits !== '' ? ('+' . $digits) : null;
        } else {
            $digits = preg_replace('/\D+/', '', $phone);
            if (strlen($digits) === 11 && strpos($digits, '03') === 0) {
                $normalized = '+92' . substr($digits, 1);
            } elseif (strlen($digits) === 10 && strpos($digits, '3') === 0) {
                $normalized = '+92' . $digits;
            } elseif (strlen($digits) === 11 && strpos($digits, '0') === 0) {
                $normalized = '+92' . substr($digits, 1);
            } elseif (strlen($digits) === 10) {
                $normalized = '+92' . $digits;
            } elseif (strlen($digits) > 10 && strlen($digits) <= 15) {
                $normalized = '+' . $digits;
            }
        }

        if ($normalized === null) {
            return null;
        }

        $waDigits = ltrim($normalized, '+');
        if (!ctype_digit($waDigits) || strlen($waDigits) < 10 || strlen($waDigits) > 15) {
            return null;
        }

        return $waDigits;
    }
}
