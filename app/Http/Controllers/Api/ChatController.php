<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Controller;
use App\Http\Requests\ChatRequest;
use App\Http\Resources\ChatResource;
use App\Http\Resources\ChatThreadResource;
use App\Http\Resources\MatchedProfileResource;
use App\Models\Chat;
use App\Models\ChatThread;
use App\Models\IgnoredUser;
use App\Models\ProfileMatch;
use App\Models\Upload;
use App\Services\ChatService;
use Illuminate\Http\Request;
use PDF;

class ChatController extends Controller
{
    public function chat_list()
    {
        $chat_threads = ChatThread::where('sender_user_id', auth()->user()->id)->orWhere('receiver_user_id', auth()->user()->id)->get();
        return  ChatThreadResource::collection($chat_threads)->additional([
            'result' => true,
        ]);
    }

    public function chat_view($id)
    {
        $chat_thread = ChatThread::findOrFail($id);
        foreach ($chat_thread->chats as $key => $chat) {
            if ($chat->sender_user_id != auth()->user()->id) {
                $chat->seen = 1;
                $chat->save();
            }
        }
        return (new ChatResource($chat_thread))->additional([
                'result' => true
            ]);
    }

    public function get_old_messages(Request $request)
    {
        $chat = Chat::findOrFail($request->first_message_id);
        $chats = Chat::where('id', '<', $chat->id)->where('chat_thread_id', $chat->chat_thread_id)->latest()->limit(20)->get();
        if(count($chats) > 0){
            return response()->json([
                'result' => true,
                'messages' => $chats,
                'first_message_id' => $chats->last()->id
            ]);            
        }
        else {
            return response()->json([
                'result' => false,
                'messages' => "",
                'first_message_id' => 0
            ]);            
        }
    }

    public function chat_reply(ChatRequest $request)
    {
        // image upload
        $attachments = [];
        if ($request->hasFile('attachment')) {
            foreach ($request->file('attachment') as $file) {
                $attachment = upload_api_file($file);
                $attachments[] = $attachment;
            }
        }      

        $chat = new ChatService();
        $new_chat = $chat->store($request->except(['_token']), $attachments);
        return $this->success_message('Data inserted successfully!');
    }

    public function share_biodata(Request $request)
    {
        $request->validate([
            'chat_thread_id' => 'required|exists:chat_threads,id',
        ]);

        $user = auth()->user();
        if (!$user) {
            abort(401);
        }

        // Generate the biodata PDF
        $template = $request->input('template', 'modern');
        $view = 'pdf.biodata_modern';
        if ($template === 'traditional') {
            $view = 'pdf.biodata_traditional';
        } elseif ($template === 'minimalist') {
            $view = 'pdf.biodata_minimalist';
        }

        $pdf = PDF::loadView($view, compact('user'));
        $pdfContent = $pdf->output();

        // Save PDF to uploads folder
        $filename = 'biodata_' . $user->id . '_' . time() . '_' . uniqid() . '.pdf';
        $destinationPath = public_path('uploads/all');
        if (!file_exists($destinationPath)) {
            mkdir($destinationPath, 0777, true);
        }
        $filePath = $destinationPath . '/' . $filename;
        file_put_contents($filePath, $pdfContent);

        // Create Upload record
        $upload = Upload::create([
            'file_original_name' => 'Biodata-' . ($user->first_name ?? 'User'),
            'file_name' => 'uploads/all/' . $filename,
            'user_id' => $user->id,
            'extension' => 'pdf',
            'type' => 'document',
            'file_size' => strlen($pdfContent),
        ]);

        // Send as chat message with attachment
        $message = "📄 I've shared my biodata/profile details with you. You can view my full profile for more information.";
        $attachments = [$upload->id];

        $chatService = new ChatService();
        $chatService->store([
            'chat_thread_id' => $request->chat_thread_id,
            'message' => $message,
        ], $attachments);

        return response()->json([
            'result' => true,
            'message' => 'Biodata shared successfully!',
        ]);
    }
}
