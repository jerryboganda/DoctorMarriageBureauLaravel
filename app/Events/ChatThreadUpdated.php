<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Broadcast to BOTH participants of a thread whenever a new message is sent.
 * This allows the thread list sidebar to update in real-time without polling.
 */
class ChatThreadUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $threadId;

    public int $senderUserId;

    public int $receiverUserId;

    public string $lastMessage;

    public string $lastMessageTime;

    public function __construct(int $threadId, int $senderUserId, int $receiverUserId, string $lastMessage)
    {
        $this->threadId = $threadId;
        $this->senderUserId = $senderUserId;
        $this->receiverUserId = $receiverUserId;
        $this->lastMessage = mb_substr($lastMessage, 0, 100);
        $this->lastMessageTime = 'Just now';
    }

    /**
     * Broadcast on both users' personal channels so the thread list updates
     * even when they are viewing a DIFFERENT chat.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.chat.'.$this->senderUserId),
            new PrivateChannel('user.chat.'.$this->receiverUserId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'thread.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'thread_id' => $this->threadId,
            'sender_user_id' => $this->senderUserId,
            'last_message' => $this->lastMessage,
            'last_message_time' => $this->lastMessageTime,
        ];
    }
}
