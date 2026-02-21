<?php

namespace App\Http\Resources\Chat;

use App\Http\Resources\Media\UploadResource;
use App\Models\Upload;
use Illuminate\Http\Resources\Json\JsonResource;

class ChatViewResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array|\Illuminate\Contracts\Support\Arrayable|\JsonSerializable
     */
    public function toArray($request)
    {


        return [
            'id' => $this->id,
            'chat_thread_id' => $this->chat_thread_id,
            'sender_user_id' => $this->sender_user_id,
            'message' => $this->message,
            'attachment' => json_decode($this->attachment) != null ? UploadResource::collection(Upload::whereIn('id', json_decode($this->attachment))->get()) : null,
            'seen' => $this->seen,
            'created_at' => $this->created_at->toDateTimeString(),
            'created_at_human' => $this->created_at->diffForHumans(),
        ];
    }
}
