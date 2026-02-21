<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\UserNotificationPreference;
use App\Models\User;
use App\Models\ExpressInterest;
use App\Models\Chat;
use App\Models\ProfileViewer;
use Illuminate\Support\Facades\DB;
use App\Events\NotificationReceived;
use Carbon\Carbon;

class NotificationCenterController extends Controller
{
    /**
     * Get paginated notifications with unread count.
     */
    public function feed(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = auth()->user();
        
        $notifications = $user->notifications()
            ->orderBy('created_at', 'desc')
            ->paginate(20);
        
        $unreadCount = $user->unreadNotifications()->count();
        
        // Transform notifications
        $items = collect($notifications->items())->map(function ($notification) {
            $data = is_array($notification->data) ? $notification->data : json_decode($notification->data, true) ?? [];
            return [
                'id' => $notification->id,
                'type' => $notification->notification_type ?? $this->inferType($data),
                'title' => $data['title'] ?? 'Notification',
                'desc' => $data['message'] ?? $data['body'] ?? '',
                'time' => $notification->created_at->diffForHumans(),
                'read' => !is_null($notification->read_at),
                'avatar' => $data['avatar'] ?? null,
                'action' => $data['action'] ?? null,
                'action_url' => $data['action_url'] ?? null,
                'data' => $data,
            ];
        });
        
        return response()->json([
            'result' => true,
            'notifications' => [
                'data' => $items,
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
                'total' => $notifications->total(),
            ],
            'unread_count' => $unreadCount,
        ]);
    }

    /**
     * Get "While you were away" recap stats.
     */
    public function recap()
    {
        $user = auth()->user();
        $lastLogin = $user->last_login_at ?? $user->updated_at ?? Carbon::now()->subDay();
        
        // Count new likes since last login
        $newLikes = ExpressInterest::where('user_id', $user->id)
            ->where('created_at', '>', $lastLogin)
            ->count();
        
        // Count new messages since last login
        $newMessages = Chat::where('receiver_id', $user->id)
            ->where('created_at', '>', $lastLogin)
            ->count();
        
        // Count profile views since last login
        $profileViews = ProfileViewer::where('user_id', $user->id)
            ->where('created_at', '>', $lastLogin)
            ->count();
        
        return response()->json([
            'result' => true,
            'recap' => [
                'new_likes' => $newLikes,
                'new_messages' => $newMessages,
                'profile_views' => $profileViews,
                'since' => Carbon::parse($lastLogin)->diffForHumans(),
            ]
        ]);
    }

    /**
     * Get user's notification preferences.
     */
    public function getPreferences()
    {
        $user = auth()->user();
        
        $preferences = UserNotificationPreference::firstOrCreate(
            ['user_id' => $user->id],
            [
                'email_digest' => true,
                'whatsapp' => true,
                'push_notifications' => true,
                'sms' => false,
                'weekly_digest' => true,
                'profile_snoozed' => false,
            ]
        );
        
        // Auto-wake check
        if ($preferences->shouldAutoWake()) {
            $preferences->update([
                'profile_snoozed' => false,
                'snooze_until' => null,
            ]);
        }
        
        return response()->json([
            'result' => true,
            'preferences' => $preferences,
        ]);
    }

    /**
     * Update notification preferences.
     */
    public function updatePreferences(Request $request)
    {
        $user = auth()->user();
        
        $preferences = UserNotificationPreference::firstOrCreate(
            ['user_id' => $user->id]
        );
        
        $preferences->update($request->only([
            'email_digest',
            'whatsapp',
            'push_notifications',
            'sms',
            'weekly_digest',
        ]));
        
        broadcast(new NotificationReceived($user->id, [
            'type' => 'preferences_updated',
            'preferences' => $preferences->fresh(),
        ]))->toOthers();
        
        return response()->json([
            'result' => true,
            'message' => 'Preferences updated',
            'preferences' => $preferences->fresh(),
        ]);
    }

    /**
     * Toggle profile snooze status.
     */
    public function toggleSnooze(Request $request)
    {
        $user = auth()->user();
        
        $preferences = UserNotificationPreference::firstOrCreate(
            ['user_id' => $user->id]
        );
        
        $snoozeDays = $request->input('days', 7);
        $shouldSnooze = !$preferences->profile_snoozed;
        
        $preferences->update([
            'profile_snoozed' => $shouldSnooze,
            'snooze_until' => $shouldSnooze ? now()->addDays($snoozeDays) : null,
        ]);
        
        broadcast(new NotificationReceived($user->id, [
            'type' => 'snooze_updated',
            'profile_snoozed' => $preferences->profile_snoozed,
            'snooze_until' => $preferences->snooze_until,
        ]))->toOthers();
        
        return response()->json([
            'result' => true,
            'message' => $shouldSnooze ? 'Profile snoozed' : 'Profile reactivated',
            'preferences' => $preferences->fresh(),
        ]);
    }

    /**
     * Mark notifications as read.
     */
    public function markAsRead(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = auth()->user();
        $notificationIds = $request->input('ids', []);
        
        if (empty($notificationIds)) {
            // Mark all as read
            $user->unreadNotifications->markAsRead();
        } else {
            // Mark specific ones as read
            $user->notifications()
                ->whereIn('id', $notificationIds)
                ->update(['read_at' => now()]);
        }
        
        $unreadCount = $user->unreadNotifications()->count();
        
        broadcast(new NotificationReceived($user->id, [
            'type' => 'read_status_updated',
            'unread_count' => $unreadCount,
        ]))->toOthers();
        
        return response()->json([
            'result' => true,
            'message' => 'Marked as read',
            'unread_count' => $unreadCount,
        ]);
    }

    /**
     * Infer notification type from data.
     */
    private function inferType(array $data): string
    {
        $title = strtolower($data['title'] ?? '');
        
        if (str_contains($title, 'match')) return 'match';
        if (str_contains($title, 'expir')) return 'expiry';
        if (str_contains($title, 'search')) return 'search_alert';
        if (str_contains($title, 'verif') || str_contains($title, 'security')) return 'safety';
        if (str_contains($title, 'view')) return 'profile_view';
        
        return 'system';
    }
}
