<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ChatThread;
use App\Models\Chat;
use App\Services\MemberCommunicationLimitService;
use Auth;

class ChatController extends Controller
{
    public function index(Request $request)
    {
      $chat_threads = ChatThread::where('sender_user_id', Auth::user()->id)->orWhere('receiver_user_id', Auth::user()->id)->get();
      return view('frontend.member.messages.index', compact('chat_threads'));
    }

    public function chat_view($id)
    {
        // $id is a chat_thread_id, not user_id
        $user = Auth::user();
        
        // Find the chat thread by ID
        $chat_thread = ChatThread::find($id);
        
        if (!$chat_thread) {
            abort(404, 'Chat thread not found');
        }
        
        // Verify that the current user is part of this chat thread
        if ($chat_thread->sender_user_id != $user->id && $chat_thread->receiver_user_id != $user->id) {
            abort(403, 'Unauthorized access to this chat thread');
        }
        
        // Mark messages as seen
        foreach ($chat_thread->chats as $key => $chat) {
            if($chat->sender_user_id != $user->id){
                $chat->seen = 1;
                $chat->save();
            }
        }
        $chats = $chat_thread->chats()->latest()->limit(20)->get();

        return view('frontend.member.messages.messages', compact('chats', 'chat_thread'));
    }

    public function get_old_messages(Request $request)
    {
        $chat = Chat::findOrFail($request->first_message_id);
        $chats = Chat::where('id', '<', $chat->id)->where('chat_thread_id', $chat->chat_thread_id)->latest()->limit(20)->get();
        if(count($chats) > 0){
            return array('messages' => view('frontend.member.messages.messages_part', compact('chats'))->render(),
                         'first_message_id' => $chats->last()->id);
        }
        else {
            return array('messages' => "", 'first_message_id' => 0);
        }
    }

    public function chat_refresh($id)
    {
        $chat_thread = ChatThread::findOrFail($id);
        $chats = $chat_thread->chats()->where('sender_user_id', '!=', Auth::user()->id)->where('seen' , 0)->get();
        foreach ($chats as $key => $value) {
            $value->seen = 1;
            $value->save();
        }

        return array('messages' => view('frontend.member.messages.messages_left_single', compact('chats'))->render(),
                     'count' => count($chats));
    }


    public function chat_reply(Request $request)
    {
        $communicationLimits = new MemberCommunicationLimitService();
        $verificationLimitError = $communicationLimits->ensureCanSendMessage(Auth::user());
        if ($verificationLimitError) {
            if ($request->expectsJson() || $request->ajax()) {
                return $verificationLimitError;
            }

            $payload = $verificationLimitError->getData(true);
            abort(403, $payload['message'] ?? 'Verification required.');
        }

        $chat = new Chat;
        $chat->chat_thread_id = $request->chat_thread_id;
        $chat->sender_user_id = Auth::user()->id;
        $chat->message = $request->message;
        if($request->attachment != null){
            $chat->attachment = json_encode(explode(',', $request->attachment));
        }
        $chat->save();
        $communicationLimits->recordMessageSent(Auth::user());
        return view('frontend.member.messages.messages_right_single', compact('chat'));
    }

    public function interview_status(Request $request)
    {
        $chat_thread = ChatThread::findOrFail($request->chat_thread_id);
        if ($chat_thread->interview == 1) {
            $chat_thread->interview = 0;
        }
        else {
            $chat_thread->interview = 1;
        }
        if ($chat_thread->save()) {
            return 1;
        }
        else {
            return 0;
        }
    }

    public function block_status(Request $request)
    {
        $chat_thread = ChatThread::findOrFail($request->chat_thread_id);
        if ($chat_thread->active == 1) {
            $chat_thread->active = 0;
        }
        else {
            $chat_thread->active = 1;
        }
        if ($chat_thread->save()) {
            return 1;
        }
        else {
            return 0;
        }
    }
}
