<?php

namespace App\Http\Resources\SupportTicket;

use App\Models\User;
use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SupportTicketReply extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  Request  $request
     * @return array|Arrayable|\JsonSerializable
     */
    public function toArray($request)
    {
        return [
            'reply' => str_replace('&amp;', '&', str_replace('&nbsp;', ' ', strip_tags($this->reply))),
            'replied_user_image' => uploaded_asset(User::find($this->replied_user_id)->photo),
            'reply_attachment' => uploaded_asset($this->attachments),
            'created_at' => $this->created_at,
        ];
    }
}
