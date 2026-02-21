<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ProfileUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $userId;
    public string $section;
    public array $data;
    public ?int $qualityScore;

    /**
     * Create a new event instance.
     *
     * @param int $userId The user whose profile was updated
     * @param string $section The section that was updated (basics, lifestyle, career, family, preferences, media, visibility)
     * @param array $data The updated data for that section
     * @param int|null $qualityScore The recalculated quality score (optional)
     */
    public function __construct(int $userId, string $section, array $data, ?int $qualityScore = null)
    {
        $this->userId = $userId;
        $this->section = $section;
        $this->data = $data;
        $this->qualityScore = $qualityScore;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('profile.' . $this->userId),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'profile.updated';
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'user_id' => $this->userId,
            'section' => $this->section,
            'data' => $this->data,
            'quality_score' => $this->qualityScore,
            'updated_at' => now()->toISOString(),
        ];
    }
}
