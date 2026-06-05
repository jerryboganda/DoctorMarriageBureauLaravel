<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SupportTicketReply extends Model
{
    protected $guarded = [];

    public function supportTicket()
    {
        return $this->belongsTo(SupportTicket::class);
    }

    public function repliedUser()
    {
        return $this->belongsTo(User::class, 'replied_user_id');
    }
}
