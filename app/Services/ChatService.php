<?php

namespace App\Services;

use App\Events\ChatThreadUpdated;
use App\Events\MessageSent;
use App\Models\Chat;
use App\Models\ChatThread;

class ChatService
{
    public function store(array $data, $attachments = [])
    {
        $attachmentJson = null;
        if (!empty($attachments)) {
            $attachmentJson = json_encode(array_values($attachments));
        }

        $chat = Chat::create([
            'chat_thread_id' => $data['chat_thread_id'],
            'sender_user_id' => auth()->id(),
            'message' => $data['message'],
            'attachment' => $attachmentJson,
        ]);

        $chat->loadMissing('sender');

        // 1) Broadcast the message to the chat thread channel (existing)
        broadcast(new MessageSent($chat))->toOthers();

        // 2) Broadcast thread-list update to BOTH users' personal channels
        //    so their sidebar refreshes in real-time
        $thread = ChatThread::find($data['chat_thread_id']);
        if ($thread) {
            broadcast(new ChatThreadUpdated(
                $thread->id,
                $thread->sender_user_id,
                $thread->receiver_user_id,
                $data['message'] ?? ''
            ));
        }

        return $chat;
    }
}
