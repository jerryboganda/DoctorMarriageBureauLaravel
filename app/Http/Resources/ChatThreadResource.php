<?php

namespace App\Http\Resources;

use App\Models\Member;
use App\Models\Package;
use Cache;
use Carbon\Carbon;
use Illuminate\Http\Resources\Json\JsonResource;

class ChatThreadResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * OPTIMISED: uses withCount aggregates from controller instead of
     * loading + filtering the entire chats collection in memory.
     */
    public function toArray($request)
    {
        $user = auth()->user();
        if ($this->receiver != null && $this->sender != null) {
            $user_to_show = $user->id == $this->sender->id ? 'receiver' : 'sender';
            $member = Member::where('user_id', $this->$user_to_show->id)->first();
            $member_package = $member ? Package::find($member->current_package_id) : null;

            // Use the eager-loaded latestChat (single message) instead of all chats
            $lastChat = $this->relationLoaded('latestChat')
                ? $this->latestChat
                : ($this->relationLoaded('chats') ? $this->chats->sortBy([['created_at', 'asc'], ['id', 'asc']])->values()->last() : null);

            // Use withCount aggregates when available, fallback to collection for backwards compat
            $unseenCount = $this->unseen_message_count ?? ($this->relationLoaded('chats')
                ? $this->chats->where('seen', 0)->where('sender_user_id', '!=', $user->id)->count()
                : 0);

            $meReplied = ($this->my_message_count ?? ($this->relationLoaded('chats')
                ? $this->chats->where('sender_user_id', $user->id)->count()
                : 0)) > 0;

            $otherSent = ($this->other_message_count ?? ($this->relationLoaded('chats')
                ? $this->chats->where('sender_user_id', $this->$user_to_show->id)->count()
                : 0)) > 0;

            $isRequest = (! $meReplied && $otherSent);

            return [
                'id' => $this->id,
                'user_id' => $this->$user_to_show->id,
                'active' => Cache::has('user-is-online-'.$this->$user_to_show->id) ? 1 : 0,
                'blocked_by_user' => $this->blocked_by_user,
                'unseen_message_count' => $unseenCount,
                'member_photo' => $this->$user_to_show->photo != null ? uploaded_asset($this->$user_to_show->photo) : gender_avatar($this->$user_to_show?->member),
                'member_name' => $this->$user_to_show->first_name.' '.$this->$user_to_show->last_name,
                'last_message_time' => $lastChat != null ? Carbon::parse($lastChat->created_at)->diffForHumans() : '',
                'last_message' => $lastChat ? $lastChat->message : '',
                'member_package' => $member_package ? new PackageResource($member_package) : '',
                'is_request' => $isRequest,
            ];
        }

        return [];
    }
}
