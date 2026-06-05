<?php

namespace App\Http\Resources;

use App\Http\Resources\SupportTicket\SupportTicketReply;
use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SupportTicketResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  Request  $request
     * @return array|Arrayable|\JsonSerializable
     */
    public function toArray($request)
    {
        // Map status for display (capitalized for React Panel compatibility)
        $statusMapDisplay = [
            0 => 'Open',
            1 => 'Resolved',
            2 => 'Closed',
        ];

        // Map status for mobile app (lowercase)
        $statusMapMobile = [
            0 => 'open',
            1 => 'resolved',
            2 => 'closed',
        ];

        // Get last reply date
        $lastReply = $this->supportTicketReplies->last();

        return [
            'id' => $this->id,
            'ticket_id' => $this->ticket_id,
            'status' => $statusMapDisplay[$this->status] ?? 'Open',  // Capitalized for React Panel
            'status_key' => $statusMapMobile[$this->status] ?? 'open',  // Lowercase for Mobile App
            'subject' => $this->subject,
            'category' => $this->supportCategory->name ?? 'General',
            'support_category_name' => $this->supportCategory->name ?? 'General',  // Legacy
            'priority' => $this->priority ?? 'medium',
            'attachments' => uploaded_asset($this->attachments),
            'description' => str_replace('&amp;', '&', str_replace('&nbsp;', ' ', strip_tags($this->description))),
            'created_at' => $this->created_at ? $this->created_at->toISOString() : null,
            'updated_at' => $this->updated_at ? $this->updated_at->toISOString() : null,
            'last_reply_at' => $lastReply ? $lastReply->created_at->toISOString() : null,
            'unread_count' => $this->supportTicketReplies->where('is_read', false)->count(),
            'reply' => SupportTicketReply::collection($this->supportTicketReplies),
        ];
    }
}
