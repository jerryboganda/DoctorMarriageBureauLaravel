<?php

namespace App\Http\Controllers\Api;

use App\Events\ProgressionUpdated;
use App\Http\Controllers\Controller;
use App\Models\MemberProgression;
use App\Models\ProgressionBudgetItem;
use App\Models\ProgressionChecklistItem;
use App\Models\ProgressionEvent;
use App\Models\ProgressionNote;
use App\Models\ProgressionSetting;
use App\Models\ProgressionStage;
use App\Models\ProgressionVenue;
use App\Models\User;
use App\Utility\MemberUtility;
use Illuminate\Http\Request;

class ProgressionController extends Controller
{
    public function getStages()
    {
        $stages = ProgressionStage::orderBy('order', 'asc')->get();

        return response()->json([
            'result' => true,
            'stages' => $stages,
        ]);
    }

    public function getActiveProgressions()
    {
        $userId = auth()->id();

        $progressions = MemberProgression::where(function ($query) use ($userId) {
            $query->where('user_id', $userId)->orWhere('partner_id', $userId);
        })
            ->where('status', 'active')
            ->with([
                'stage',
                'user.career',
                'partner.career',
                'user.addresses.city',
                'partner.addresses.city',
                'checklistItems',
                'events',
            ])
            ->orderByDesc('updated_at')
            ->get();

        return response()->json([
            'result' => true,
            'tracks' => $progressions->map(fn (MemberProgression $progression) => $this->buildTrackSummary($progression, $userId))->values(),
        ]);
    }

    public function startProgression(Request $request)
    {
        $data = $request->validate([
            'partner_id' => 'required|exists:users,id',
        ]);

        $userId = auth()->id();
        $partnerId = (int) $data['partner_id'];

        if ($partnerId === $userId) {
            return response()->json([
                'result' => false,
                'message' => 'You cannot start a progression with yourself.',
            ], 422);
        }

        $progression = $this->resolveSharedProgression($userId, $partnerId);
        if (! $progression) {
            $startStage = ProgressionStage::orderBy('order', 'asc')->first();
            $progression = MemberProgression::create([
                'user_id' => $userId,
                'partner_id' => $partnerId,
                'current_stage_id' => $startStage?->id,
                'status' => 'active',
                'total_progress_percent' => $startStage?->progress_percent ?? 0,
            ]);
            $progression->settings()->create([
                'share_calendar_busy' => true,
                'auto_detect_timezone' => true,
                'timezone' => config('app.timezone'),
                'budget_target' => null,
            ]);
            $progression->load($this->progressionRelations());
        }

        $this->broadcastProgressionUpdate($progression, $userId, 'start');

        return response()->json([
            'result' => true,
            'message' => 'Progression started successfully.',
            'data' => $this->buildProgressionPayload($progression, $userId),
        ]);
    }

    public function getProgression($id)
    {
        $viewerId = auth()->id();
        $partnerId = (int) $id;

        $partner = User::find($partnerId);
        if (! $partner) {
            return response()->json(['result' => false, 'message' => 'Partner not found'], 404);
        }

        $progression = $this->resolveSharedProgression($viewerId, $partnerId);
        if (! $progression) {
            return response()->json(['result' => false, 'message' => 'Progression not found'], 404);
        }

        return response()->json([
            'result' => true,
            'data' => $this->buildProgressionPayload($progression, $viewerId),
        ]);
    }

    public function updateStage(Request $request, $id)
    {
        $data = $request->validate([
            'stage_slug' => 'required|exists:progression_stages,slug',
        ]);

        $progression = $this->resolveProgressionById((int) $id);
        if (! $progression) {
            return response()->json(['result' => false, 'message' => 'Progression not found'], 404);
        }

        if (! $this->isParticipant($progression, auth()->id())) {
            return response()->json(['result' => false, 'message' => 'Unauthorized'], 403);
        }

        $stage = ProgressionStage::where('slug', $data['stage_slug'])->firstOrFail();
        $progression->update([
            'current_stage_id' => $stage->id,
            'total_progress_percent' => $stage->progress_percent,
        ]);

        $this->broadcastProgressionUpdate($progression->fresh($this->progressionRelations()), auth()->id(), 'stage');

        return response()->json([
            'result' => true,
            'message' => 'Stage updated successfully',
            'data' => $this->buildProgressionPayload($progression->fresh($this->progressionRelations()), auth()->id()),
        ]);
    }

    public function storeItem(Request $request, $id)
    {
        $progression = $this->resolveProgressionById((int) $id);
        if (! $progression) {
            return response()->json(['result' => false, 'message' => 'Progression not found'], 404);
        }

        if (! $this->isParticipant($progression, auth()->id())) {
            return response()->json(['result' => false, 'message' => 'Unauthorized'], 403);
        }

        $kind = (string) $request->input('kind', '');
        $userId = auth()->id();

        switch ($kind) {
            case 'checklist':
                $payload = $request->validate([
                    'title' => 'required|string|max:255',
                    'sort_order' => 'nullable|integer|min:0',
                ]);
                ProgressionChecklistItem::create([
                    'member_progression_id' => $progression->id,
                    'title' => $payload['title'],
                    'sort_order' => $payload['sort_order'] ?? $this->nextSortOrder($progression, ProgressionChecklistItem::class),
                    'created_by' => $userId,
                    'updated_by' => $userId,
                ]);
                $section = 'checklist';
                break;

            case 'note':
                $payload = $request->validate([
                    'note' => 'required|string|max:5000',
                ]);
                ProgressionNote::create([
                    'member_progression_id' => $progression->id,
                    'author_id' => $userId,
                    'note_type' => 'family_feedback',
                    'note' => $payload['note'],
                ]);
                $section = 'notes';
                break;

            case 'venue':
                $payload = $request->validate([
                    'name' => 'required|string|max:255',
                    'venue_type' => 'nullable|string|max:255',
                    'estimated_cost' => 'nullable|numeric|min:0',
                    'rating' => 'nullable|numeric|min:0|max:5',
                    'status' => 'nullable|in:shortlisted,visited,confirmed,rejected',
                    'notes' => 'nullable|string|max:5000',
                    'visited_at' => 'nullable|date',
                ]);
                ProgressionVenue::create([
                    'member_progression_id' => $progression->id,
                    'name' => $payload['name'],
                    'venue_type' => $payload['venue_type'] ?? null,
                    'estimated_cost' => $payload['estimated_cost'] ?? null,
                    'rating' => $payload['rating'] ?? null,
                    'status' => $payload['status'] ?? 'shortlisted',
                    'notes' => $payload['notes'] ?? null,
                    'visited_at' => $payload['visited_at'] ?? null,
                ]);
                $section = 'venues';
                break;

            case 'budget':
                $payload = $request->validate([
                    'label' => 'required|string|max:255',
                    'amount' => 'required|numeric|min:0',
                    'category' => 'nullable|string|max:255',
                    'status' => 'nullable|in:planned,reserved,spent,paid',
                    'notes' => 'nullable|string|max:5000',
                ]);
                ProgressionBudgetItem::create([
                    'member_progression_id' => $progression->id,
                    'label' => $payload['label'],
                    'amount' => $payload['amount'],
                    'category' => $payload['category'] ?? null,
                    'status' => $payload['status'] ?? 'planned',
                    'notes' => $payload['notes'] ?? null,
                ]);
                $section = 'budget';
                break;

            case 'event':
                $payload = $request->validate([
                    'title' => 'required|string|max:255',
                    'event_at' => 'required|date',
                    'location' => 'nullable|string|max:255',
                    'status' => 'nullable|in:scheduled,completed,cancelled',
                    'notes' => 'nullable|string|max:5000',
                ]);
                ProgressionEvent::create([
                    'member_progression_id' => $progression->id,
                    'title' => $payload['title'],
                    'event_at' => $payload['event_at'],
                    'location' => $payload['location'] ?? null,
                    'status' => $payload['status'] ?? 'scheduled',
                    'notes' => $payload['notes'] ?? null,
                ]);
                $section = 'events';
                break;

            default:
                return response()->json([
                    'result' => false,
                    'message' => 'Invalid progression item type.',
                ], 422);
        }

        $progression = $progression->fresh($this->progressionRelations());
        $this->broadcastProgressionUpdate($progression, $userId, $section);

        return response()->json([
            'result' => true,
            'message' => 'Progression item saved.',
            'data' => $this->buildProgressionPayload($progression, $userId),
        ]);
    }

    public function updateItem(Request $request, $id, $itemId)
    {
        $progression = $this->resolveProgressionById((int) $id);
        if (! $progression) {
            return response()->json(['result' => false, 'message' => 'Progression not found'], 404);
        }

        if (! $this->isParticipant($progression, auth()->id())) {
            return response()->json(['result' => false, 'message' => 'Unauthorized'], 403);
        }

        $kind = (string) $request->input('kind', '');
        $userId = auth()->id();

        switch ($kind) {
            case 'checklist':
                $item = ProgressionChecklistItem::where('member_progression_id', $progression->id)->findOrFail($itemId);
                $payload = $request->validate([
                    'title' => 'sometimes|required|string|max:255',
                    'is_completed' => 'sometimes|boolean',
                    'sort_order' => 'sometimes|integer|min:0',
                ]);
                $updates = ['updated_by' => $userId];
                if (array_key_exists('title', $payload)) {
                    $updates['title'] = $payload['title'];
                }
                if (array_key_exists('sort_order', $payload)) {
                    $updates['sort_order'] = $payload['sort_order'];
                }
                if (array_key_exists('is_completed', $payload)) {
                    $updates['is_completed'] = (bool) $payload['is_completed'];
                    $updates['completed_at'] = $payload['is_completed'] ? now() : null;
                }
                $item->update($updates);
                $section = 'checklist';
                break;

            case 'note':
                $item = ProgressionNote::where('member_progression_id', $progression->id)->findOrFail($itemId);
                $payload = $request->validate([
                    'note' => 'required|string|max:5000',
                ]);
                $item->update(['note' => $payload['note']]);
                $section = 'notes';
                break;

            case 'venue':
                $item = ProgressionVenue::where('member_progression_id', $progression->id)->findOrFail($itemId);
                $payload = $request->validate([
                    'name' => 'sometimes|required|string|max:255',
                    'venue_type' => 'nullable|string|max:255',
                    'estimated_cost' => 'nullable|numeric|min:0',
                    'rating' => 'nullable|numeric|min:0|max:5',
                    'status' => 'nullable|in:shortlisted,visited,confirmed,rejected',
                    'notes' => 'nullable|string|max:5000',
                    'visited_at' => 'nullable|date',
                ]);
                $item->update($payload);
                $section = 'venues';
                break;

            case 'budget':
                $item = ProgressionBudgetItem::where('member_progression_id', $progression->id)->findOrFail($itemId);
                $payload = $request->validate([
                    'label' => 'sometimes|required|string|max:255',
                    'amount' => 'sometimes|required|numeric|min:0',
                    'category' => 'nullable|string|max:255',
                    'status' => 'nullable|in:planned,reserved,spent,paid',
                    'notes' => 'nullable|string|max:5000',
                ]);
                $item->update($payload);
                $section = 'budget';
                break;

            case 'event':
                $item = ProgressionEvent::where('member_progression_id', $progression->id)->findOrFail($itemId);
                $payload = $request->validate([
                    'title' => 'sometimes|required|string|max:255',
                    'event_at' => 'sometimes|required|date',
                    'location' => 'nullable|string|max:255',
                    'status' => 'nullable|in:scheduled,completed,cancelled',
                    'notes' => 'nullable|string|max:5000',
                ]);
                $item->update($payload);
                $section = 'events';
                break;

            default:
                return response()->json([
                    'result' => false,
                    'message' => 'Invalid progression item type.',
                ], 422);
        }

        $progression = $progression->fresh($this->progressionRelations());
        $this->broadcastProgressionUpdate($progression, $userId, $section);

        return response()->json([
            'result' => true,
            'message' => 'Progression item updated.',
            'data' => $this->buildProgressionPayload($progression, $userId),
        ]);
    }

    public function deleteItem(Request $request, $id, $itemId)
    {
        $progression = $this->resolveProgressionById((int) $id);
        if (! $progression) {
            return response()->json(['result' => false, 'message' => 'Progression not found'], 404);
        }

        if (! $this->isParticipant($progression, auth()->id())) {
            return response()->json(['result' => false, 'message' => 'Unauthorized'], 403);
        }

        $kind = (string) $request->input('kind', '');
        $userId = auth()->id();

        switch ($kind) {
            case 'checklist':
                ProgressionChecklistItem::where('member_progression_id', $progression->id)->whereKey($itemId)->delete();
                $section = 'checklist';
                break;
            case 'note':
                ProgressionNote::where('member_progression_id', $progression->id)->whereKey($itemId)->delete();
                $section = 'notes';
                break;
            case 'venue':
                ProgressionVenue::where('member_progression_id', $progression->id)->whereKey($itemId)->delete();
                $section = 'venues';
                break;
            case 'budget':
                ProgressionBudgetItem::where('member_progression_id', $progression->id)->whereKey($itemId)->delete();
                $section = 'budget';
                break;
            case 'event':
                ProgressionEvent::where('member_progression_id', $progression->id)->whereKey($itemId)->delete();
                $section = 'events';
                break;
            default:
                return response()->json([
                    'result' => false,
                    'message' => 'Invalid progression item type.',
                ], 422);
        }

        $progression = $progression->fresh($this->progressionRelations());
        $this->broadcastProgressionUpdate($progression, $userId, $section);

        return response()->json([
            'result' => true,
            'message' => 'Progression item deleted.',
            'data' => $this->buildProgressionPayload($progression, $userId),
        ]);
    }

    public function updateSettings(Request $request, $id)
    {
        $progression = $this->resolveProgressionById((int) $id);
        if (! $progression) {
            return response()->json(['result' => false, 'message' => 'Progression not found'], 404);
        }

        if (! $this->isParticipant($progression, auth()->id())) {
            return response()->json(['result' => false, 'message' => 'Unauthorized'], 403);
        }

        $payload = $request->validate([
            'share_calendar_busy' => 'required|boolean',
            'auto_detect_timezone' => 'required|boolean',
            'timezone' => 'nullable|string|max:120',
            'budget_target' => 'nullable|numeric|min:0',
        ]);

        $settings = $progression->settings()->updateOrCreate(
            ['member_progression_id' => $progression->id],
            [
                'share_calendar_busy' => $payload['share_calendar_busy'],
                'auto_detect_timezone' => $payload['auto_detect_timezone'],
                'timezone' => $payload['timezone'] ?? null,
                'budget_target' => $payload['budget_target'] ?? null,
            ]
        );

        $progression = $progression->fresh($this->progressionRelations());
        $this->broadcastProgressionUpdate($progression, auth()->id(), 'settings');

        return response()->json([
            'result' => true,
            'message' => 'Progression settings updated.',
            'data' => $this->buildProgressionPayload($progression, auth()->id()),
        ]);
    }

    private function buildTrackSummary(MemberProgression $progression, int $viewerId): array
    {
        $progression->loadMissing($this->progressionRelations());
        $partner = $this->resolvePartner($progression, $viewerId);
        $career = $this->firstCareer($partner);
        $address = $this->firstAddress($partner);
        $nextAction = $this->deriveNextAction($progression);

        return [
            'id' => (string) $progression->id,
            'partner_id' => $partner?->id,
            'profile' => [
                'id' => $partner?->id,
                'name' => $this->fullName($partner),
                'avatarUrl' => $partner?->photo ? uploaded_asset($partner->photo) : null,
                'profilePhotoBlur' => MemberUtility::member_profile_photo_blur($partner?->id ?? 0),
                'specialty' => $career?->designation,
                'hospital' => $career?->company,
                'location' => $address?->city?->name,
            ],
            'stage' => $progression->stage?->slug ?? 'start',
            'stageLabel' => $progression->stage?->name ?? 'Start',
            'progress' => (int) ($progression->total_progress_percent ?? $progression->stage?->progress_percent ?? 0),
            'lastInteraction' => $progression->updated_at?->diffForHumans(),
            'nextAction' => $nextAction,
        ];
    }

    private function buildProgressionPayload(MemberProgression $progression, int $viewerId): array
    {
        $progression->loadMissing($this->progressionRelations());
        $partner = $this->resolvePartner($progression, $viewerId);
        $career = $this->firstCareer($partner);
        $address = $this->firstAddress($partner);
        $stage = $progression->stage;

        $checklistItems = $progression->checklistItems->sortBy(['sort_order', 'id'])->values()->map(function (ProgressionChecklistItem $item) {
            return [
                'id' => $item->id,
                'title' => $item->title,
                'is_completed' => (bool) $item->is_completed,
                'completed_at' => optional($item->completed_at)->toIso8601String(),
                'sort_order' => (int) $item->sort_order,
            ];
        })->all();

        $notes = $progression->notes->sortByDesc('created_at')->values()->map(function (ProgressionNote $note) {
            return [
                'id' => $note->id,
                'author_id' => $note->author_id,
                'note_type' => $note->note_type,
                'note' => $note->note,
                'created_at' => optional($note->created_at)->toIso8601String(),
            ];
        })->all();

        $venues = $progression->venues->sortByDesc('created_at')->values()->map(function (ProgressionVenue $venue) {
            return [
                'id' => $venue->id,
                'name' => $venue->name,
                'venue_type' => $venue->venue_type,
                'estimated_cost' => $venue->estimated_cost,
                'rating' => $venue->rating,
                'status' => $venue->status,
                'visited_at' => optional($venue->visited_at)->toIso8601String(),
                'notes' => $venue->notes,
            ];
        })->all();

        $budgetItems = $progression->budgetItems->sortByDesc('created_at')->values()->map(function (ProgressionBudgetItem $budgetItem) {
            return [
                'id' => $budgetItem->id,
                'label' => $budgetItem->label,
                'amount' => $budgetItem->amount,
                'category' => $budgetItem->category,
                'status' => $budgetItem->status,
                'notes' => $budgetItem->notes,
            ];
        })->all();

        $events = $progression->events->sortBy('event_at')->values()->map(function (ProgressionEvent $event) {
            return [
                'id' => $event->id,
                'title' => $event->title,
                'event_at' => optional($event->event_at)->toIso8601String(),
                'location' => $event->location,
                'status' => $event->status,
                'notes' => $event->notes,
            ];
        })->all();

        $settings = $progression->settings ?? new ProgressionSetting([
            'share_calendar_busy' => true,
            'auto_detect_timezone' => true,
            'timezone' => config('app.timezone'),
            'budget_target' => null,
        ]);

        $spentEstimate = collect($budgetItems)
            ->filter(fn ($item) => in_array($item['status'], ['spent', 'paid'], true))
            ->sum('amount');

        $targetBudget = $settings->budget_target ?? collect($budgetItems)->sum('amount');

        return [
            'id' => (string) $progression->id,
            'partner_id' => $partner?->id,
            'status' => $progression->status,
            'current_stage_id' => $progression->current_stage_id,
            'next_steps' => $progression->next_steps,
            'stage' => $stage ? [
                'id' => $stage->id,
                'slug' => $stage->slug,
                'name' => $stage->name,
                'progress_percent' => (int) $stage->progress_percent,
            ] : null,
            'profile' => [
                'id' => $partner?->id,
                'name' => $this->fullName($partner),
                'avatarUrl' => $partner?->photo ? uploaded_asset($partner->photo) : null,
                'profilePhotoBlur' => MemberUtility::member_profile_photo_blur($partner?->id ?? 0),
                'specialty' => $career?->designation,
                'hospital' => $career?->company,
                'location' => $address?->city?->name,
            ],
            'events' => $events,
            'checklist_items' => $checklistItems,
            'family_notes' => $notes,
            'venues' => $venues,
            'budget' => [
                'target_budget' => $targetBudget ? (float) $targetBudget : null,
                'spent_estimate' => (float) $spentEstimate,
                'items' => $budgetItems,
            ],
            'settings' => [
                'share_calendar_busy' => (bool) $settings->share_calendar_busy,
                'auto_detect_timezone' => (bool) $settings->auto_detect_timezone,
                'timezone' => $settings->timezone ?? config('app.timezone'),
                'budget_target' => $settings->budget_target !== null ? (float) $settings->budget_target : null,
            ],
            'summary' => [
                'checklist_total' => count($checklistItems),
                'checklist_completed' => collect($checklistItems)->where('is_completed', true)->count(),
                'notes_count' => count($notes),
                'venues_count' => count($venues),
                'events_count' => count($events),
            ],
            'last_updated_at' => optional($progression->updated_at)->toIso8601String(),
            'last_interaction' => optional($progression->updated_at)->diffForHumans(),
            'progress' => (int) ($progression->total_progress_percent ?? $stage?->progress_percent ?? 0),
            'next_action' => $this->deriveNextAction($progression),
        ];
    }

    private function progressionRelations(): array
    {
        return [
            'stage',
            'user.career',
            'partner.career',
            'user.addresses.city',
            'partner.addresses.city',
            'checklistItems',
            'notes',
            'venues',
            'budgetItems',
            'events',
            'settings',
        ];
    }

    private function resolveSharedProgression(int $userId, int $partnerId): ?MemberProgression
    {
        return MemberProgression::where(function ($query) use ($userId, $partnerId) {
            $query->where('user_id', $userId)->where('partner_id', $partnerId);
        })->orWhere(function ($query) use ($userId, $partnerId) {
            $query->where('user_id', $partnerId)->where('partner_id', $userId);
        })->with($this->progressionRelations())->first();
    }

    private function resolveProgressionById(int $progressionId): ?MemberProgression
    {
        return MemberProgression::with($this->progressionRelations())->find($progressionId);
    }

    private function isParticipant(MemberProgression $progression, int $userId): bool
    {
        return (int) $progression->user_id === $userId || (int) $progression->partner_id === $userId;
    }

    private function resolvePartner(MemberProgression $progression, int $viewerId): ?User
    {
        return (int) $progression->user_id === $viewerId ? $progression->partner : $progression->user;
    }

    private function firstCareer(?User $user)
    {
        if (! $user) {
            return null;
        }

        if ($user->relationLoaded('career')) {
            return $user->career->first();
        }

        return $user->career()->first();
    }

    private function firstAddress(?User $user)
    {
        if (! $user) {
            return null;
        }

        if ($user->relationLoaded('addresses')) {
            return $user->addresses->where('type', 'present')->first() ?? $user->addresses->first();
        }

        return $user->addresses()->with('city')->where('type', 'present')->first()
            ?? $user->addresses()->with('city')->first();
    }

    private function fullName(?User $user): string
    {
        if (! $user) {
            return 'Unknown';
        }

        return trim(($user->first_name ?? '').' '.($user->last_name ?? '')) ?: 'Unknown';
    }

    private function deriveNextAction(MemberProgression $progression): ?string
    {
        if (! empty($progression->next_steps)) {
            return $progression->next_steps;
        }

        $incompleteChecklist = $progression->checklistItems->firstWhere('is_completed', false);
        if ($incompleteChecklist) {
            return $incompleteChecklist->title;
        }

        $nextEvent = $progression->events->sortBy('event_at')->first();
        if ($nextEvent) {
            return $nextEvent->title;
        }

        return 'Add the next milestone';
    }

    private function broadcastProgressionUpdate(?MemberProgression $progression, ?int $userId, string $section): void
    {
        if (! $progression) {
            return;
        }

        try {
            event(new ProgressionUpdated($progression, $userId, $section));
        } catch (\Throwable $exception) {
            \Log::warning('Progression broadcast failed: '.$exception->getMessage(), [
                'progression_id' => $progression->id,
                'user_id' => $userId,
                'section' => $section,
            ]);
        }
    }

    private function nextSortOrder(MemberProgression $progression, string $modelClass): int
    {
        $query = $modelClass::where('member_progression_id', $progression->id);
        $max = (int) ($query->max('sort_order') ?? 0);

        return $max + 1;
    }
}
