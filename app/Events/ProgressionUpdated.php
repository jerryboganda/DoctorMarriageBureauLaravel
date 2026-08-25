<?php

namespace App\Events;

use App\Models\MemberProgression;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ProgressionUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $progression;

    public $updatedBy;

    public $section;

    /**
     * Create a new event instance.
     */
    public function __construct(MemberProgression $progression, int $updatedBy, string $section = 'stage')
    {
        $this->progression = $progression->load([
            'stage',
            'user',
            'partner',
            'checklistItems',
            'notes',
            'venues',
            'budgetItems',
            'events',
            'settings',
        ]);
        $this->updatedBy = $updatedBy;
        $this->section = $section;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        // Broadcast to both users in the progression
        return [
            new PrivateChannel('progression.'.$this->progression->user_id),
            new PrivateChannel('progression.'.$this->progression->partner_id),
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
     */
    public function broadcastWith(): array
    {
        $partner = $this->progression->user_id == $this->updatedBy
            ? $this->progression->partner
            : $this->progression->user;

        return [
            'progression_id' => $this->progression->id,
            'section' => $this->section,
            'stage' => [
                'slug' => $this->progression->stage?->slug,
                'name' => $this->progression->stage?->name,
                'progress_percent' => $this->progression->stage?->progress_percent,
            ],
            'total_progress_percent' => $this->progression->total_progress_percent,
            'checklist_completed' => $this->progression->checklistItems->where('is_completed', true)->count(),
            'checklist_total' => $this->progression->checklistItems->count(),
            'notes_total' => $this->progression->notes->count(),
            'venues_total' => $this->progression->venues->count(),
            'events_total' => $this->progression->events->count(),
            'updated_by' => $this->updatedBy,
            'status' => $this->progression->status,
            'settings' => [
                'share_calendar_busy' => $this->progression->settings?->share_calendar_busy,
                'auto_detect_timezone' => $this->progression->settings?->auto_detect_timezone,
                'timezone' => $this->progression->settings?->timezone,
                'budget_target' => $this->progression->settings?->budget_target,
            ],
            'partner' => [
                'id' => $partner->id,
                'name' => $partner->first_name.' '.$partner->last_name,
            ],
            'updated_at' => $this->progression->updated_at->toIso8601String(),
        ];
    }
}
