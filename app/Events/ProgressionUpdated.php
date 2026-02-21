<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use App\Models\MemberProgression;

class ProgressionUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $progression;
    public $updatedBy;

    /**
     * Create a new event instance.
     */
    public function __construct(MemberProgression $progression, int $updatedBy)
    {
        $this->progression = $progression->load(['stage', 'user', 'partner']);
        $this->updatedBy = $updatedBy;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        // Broadcast to both users in the progression
        return [
            new PrivateChannel('progression.' . $this->progression->user_id),
            new PrivateChannel('progression.' . $this->progression->partner_id),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'progression.updated';
    }

    /**
     * Get the data to broadcast.
     *
     * @return array
     */
    public function broadcastWith(): array
    {
        $partner = $this->progression->user_id == $this->updatedBy 
            ? $this->progression->partner 
            : $this->progression->user;

        return [
            'progression_id' => $this->progression->id,
            'stage' => [
                'slug' => $this->progression->stage?->slug,
                'name' => $this->progression->stage?->name,
                'progress_percent' => $this->progression->stage?->progress_percent,
            ],
            'total_progress_percent' => $this->progression->total_progress_percent,
            'updated_by' => $this->updatedBy,
            'status' => $this->progression->status,
            'partner' => [
                'id' => $partner->id,
                'name' => $partner->first_name . ' ' . $partner->last_name,
            ],
            'updated_at' => $this->progression->updated_at->toIso8601String(),
        ];
    }
}
