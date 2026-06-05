<?php

namespace App\Http\Resources;

use App\Http\Resources\Chat\ChatViewResource;
use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChatResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  Request  $request
     * @return array|Arrayable|\JsonSerializable
     */
    public function toArray($request)
    {
        $chats = $this->chats()->orderBy('created_at')->orderBy('id')->get();

        return [
            'thread_id' => $this->id,
            'receiver_name' => $this->receiver->first_name.' '.$this->receiver->last_name,
            'receiver_photo' => $this->receiver->photo != null ? uploaded_asset($this->receiver->photo) : gender_avatar($this->receiver?->member),
            'sender_name' => $this->sender->first_name.' '.$this->sender->last_name,
            'auth_user_photo' => uploaded_asset(auth()->user()->photo) !== null ? uploaded_asset(auth()->user()->photo) : gender_avatar(auth()->user()?->member),
            'messages' => ChatViewResource::collection($chats),
        ];
    }
}
