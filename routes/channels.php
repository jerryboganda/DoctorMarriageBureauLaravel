<?php

use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
*/

Broadcast::channel('App.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('progression.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});

Broadcast::channel('family.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});

Broadcast::channel('notifications.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});

Broadcast::channel('profile.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});

Broadcast::channel('account.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});

Broadcast::channel('chat.{threadId}', function ($user, $threadId) {
    $thread = \App\Models\ChatThread::find($threadId);
    if (!$thread) return false;
    return $user->id === $thread->sender_user_id || $user->id === $thread->receiver_user_id;
});

// Personal channel for real-time thread list updates
Broadcast::channel('user.chat.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});
