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


        // Safely decode attachment IDs — ensure it's always an array for whereIn()
        $attachmentIds = null;
        if ($this->attachment) {
            $decoded = json_decode($this->attachment, true);
            if (is_array($decoded)) {
                $attachmentIds = array_values(array_filter($decoded));
            } elseif (is_numeric($decoded)) {
                $attachmentIds = [(int) $decoded];
            }
        }

        return [
            'id' => $this->id,
            'chat_thread_id' => $this->chat_thread_id,
            'sender_user_id' => $this->sender_user_id,
            'message' => $this->message,
            'attachment' => (!empty($attachmentIds)) ? UploadResource::collection(Upload::whereIn('id', $attachmentIds)->get()) : null,
            'seen' => $this->seen,
            'created_at' => $this->created_at->toDateTimeString(),
            'created_at_human' => $this->created_at->diffForHumans(),
        ];
    }
}
