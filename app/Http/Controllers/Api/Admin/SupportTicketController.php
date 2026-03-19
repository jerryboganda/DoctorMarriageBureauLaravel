<?php

namespace App\Http\Controllers\Api\Admin;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SupportTicketController extends BaseAdminController
{
    public function active(Request $request)
    {
        $query = DB::table('support_tickets')->where('status', 0)->orderByDesc('id');
        return $this->ok($this->paginateQuery($request, $query));
    }

    public function myTickets(Request $request)
    {
        $query = DB::table('support_tickets')
            ->where('assigned_user_id', $request->user()->id)
            ->orderByDesc('id');

        return $this->ok($this->paginateQuery($request, $query));
    }

    public function solved(Request $request)
    {
        $query = DB::table('support_tickets')->where('status', 1)->orderByDesc('id');
        return $this->ok($this->paginateQuery($request, $query));
    }

    public function reply(Request $request, $id)
    {
        $ticket = DB::table('support_tickets')->where('id', $id)->first();
        if (!$ticket) {
            return $this->fail('Ticket not found', 404);
        }

        $replyId = DB::table('support_ticket_replies')->insertGetId([
            'support_ticket_id' => $id,
            'replied_user_id' => $request->user()->id,
            'reply' => $request->get('reply', ''),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $reply = DB::table('support_ticket_replies')->where('id', $replyId)->first();

        return $this->ok($reply, 'Reply sent');
    }

    public function settings()
    {
        return $this->ok([
            'categories' => DB::table('support_categories')->orderBy('name')->get(),
            'default_ticket_assigned_user' => get_setting('default_ticket_assigned_user'),
        ]);
    }

    public function updateSettings(Request $request)
    {
        if ($request->filled('default_ticket_assigned_user')) {
            DB::table('settings')->updateOrInsert(
                ['type' => 'default_ticket_assigned_user'],
                [
                    'value' => (string) $request->default_ticket_assigned_user,
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }

        return $this->ok(null, 'Support settings updated');
    }
}
