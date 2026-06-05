<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SupportTicket extends Model
{
    protected $guarded = [];

    public function supportCategory()
    {
        return $this->belongsTo(SupportCategory::class);
    }

    public function supportTicketReplies()
    {
        return $this->hasMany(SupportTicketReply::class);
    }
}
