<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\ChatRequest;
use App\Http\Resources\Chat\ChatViewResource;
use App\Http\Resources\ChatResource;
use App\Http\Resources\ChatThreadResource;
use App\Models\Chat;
use App\Models\ChatThread;
use App\Models\Upload;
use App\Services\ChatService;
use App\Services\MemberCommunicationLimitService;
use Illuminate\Http\Request;
use PDF;

class ChatController extends Controller
{
    private function communicationLimits(): MemberCommunicationLimitService
    {
        return new MemberCommunicationLimitService;
    }

    private function ensureMessagingEntitlement()
    {
        $user = auth()->user();
        $limits = $this->communicationLimits();

        if ($limits->isVerified($user) && (int) $user->membership !== 2) {
            return $limits->subscriptionRequiredResponse();
        }

        return null;
    }

    private function ensureCanSendMessage()
    {
        $user = auth()->user();
        $limits = $this->communicationLimits();

        if ($limits->isVerified($user)) {
            return $limits->ensureCanSendVerifiedFreeMessage($user);
        }

        return $limits->ensureCanSendMessage($user);
    }

    /**
     * List all chat threads for the authenticated user.
     * OPTIMISED: only loads the LAST message per thread (not all messages).
     */
    public function chat_list()
    {
        if ($entitlementError = $this->ensureMessagingEntitlement()) {
            return $entitlementError;
        }

        $userId = auth()->id();

        $chatThreads = ChatThread::with([
            'sender:id,first_name,last_name,photo',
            'receiver:id,first_name,last_name,photo',
            'latestChat',                       // only the newest message
        ])
            ->withCount([
                // unseen messages sent by the OTHER user
                'chats as unseen_message_count' => function ($q) use ($userId) {
                    $q->where('sender_user_id', '!=', $userId)
                        ->where('seen', 0);
                },
                // did I ever reply?
                'chats as my_message_count' => function ($q) use ($userId) {
                    $q->where('sender_user_id', $userId);
                },
                // did the other person ever send?
                'chats as other_message_count' => function ($q) use ($userId) {
                    $q->where('sender_user_id', '!=', $userId);
                },
            ])
            ->where(function ($query) use ($userId) {
                $query->where('sender_user_id', $userId)
                    ->orWhere('receiver_user_id', $userId);
            })
            ->orderByDesc(
                Chat::select('created_at')
                    ->whereColumn('chat_thread_id', 'chat_threads.id')
                    ->latest('created_at')
                    ->latest('id')
                    ->limit(1)
            )
            ->orderByDesc('updated_at')
            ->get();

        return ChatThreadResource::collection($chatThreads)->additional([
            'result' => true,
        ]);
    }

    /**
     * View a specific chat thread with all messages.
     */
    public function chat_view($id)
    {
        if ($entitlementError = $this->ensureMessagingEntitlement()) {
            return $entitlementError;
        }

        $chatThread = ChatThread::with([
            'sender:id,first_name,last_name,photo',
            'receiver:id,first_name,last_name,photo',
            'chats' => function ($query) {
                $query->orderBy('created_at')->orderBy('id');
            },
        ])->findOrFail($id);

        if (auth()->id() !== $chatThread->sender_user_id && auth()->id() !== $chatThread->receiver_user_id) {
            return response()->json([
                'result' => false,
                'message' => 'Unauthorized access to this chat thread.',
            ], 403);
        }

        // Mark incoming messages as seen
        $updated = Chat::where('chat_thread_id', $chatThread->id)
            ->where('sender_user_id', '!=', auth()->id())
            ->where('seen', 0)
            ->update(['seen' => 1]);

        // Ensure updated seen state is reflected in response.
        $chatThread->load(['chats' => function ($query) {
            $query->orderBy('created_at')->orderBy('id');
        }]);

        return (new ChatResource($chatThread))->additional([
            'result' => true,
        ]);
    }

    /**
     * Paginated older messages for infinite scroll.
     */
    public function get_old_messages(Request $request)
    {
        if ($entitlementError = $this->ensureMessagingEntitlement()) {
            return $entitlementError;
        }

        $chat = Chat::findOrFail($request->first_message_id);
        $thread = ChatThread::where('id', $chat->chat_thread_id)
            ->where(function ($query) {
                $query->where('sender_user_id', auth()->id())
                    ->orWhere('receiver_user_id', auth()->id());
            })
            ->first();

        if (! $thread) {
            return response()->json([
                'result' => false,
                'message' => 'Chat thread not found.',
            ], 404);
        }

        $chats = Chat::where('chat_thread_id', $chat->chat_thread_id)
            ->where(function ($query) use ($chat) {
                $query->where('created_at', '<', $chat->created_at)
                    ->orWhere(function ($q) use ($chat) {
                        $q->where('created_at', $chat->created_at)
                            ->where('id', '<', $chat->id);
                    });
            })
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->limit(20)
            ->get()
            ->reverse()
            ->values();

        if ($chats->isNotEmpty()) {
            return response()->json([
                'result' => true,
                'messages' => ChatViewResource::collection($chats),
                'first_message_id' => $chats->first()->id,
            ]);
        }

        return response()->json([
            'result' => false,
            'messages' => [],
            'first_message_id' => 0,
        ]);
    }

    /**
     * Send a chat message (text + optional attachments).
     */
    public function chat_reply(ChatRequest $request)
    {
        if ($entitlementError = $this->ensureCanSendMessage()) {
            return $entitlementError;
        }

        $chatThread = ChatThread::findOrFail($request->chat_thread_id);
        if (auth()->id() !== $chatThread->sender_user_id && auth()->id() !== $chatThread->receiver_user_id) {
            return response()->json([
                'result' => false,
                'message' => 'Unauthorized access to this chat thread.',
            ], 403);
        }

        $attachments = [];
        if ($request->hasFile('attachment')) {
            foreach ($request->file('attachment') as $file) {
                $attachments[] = upload_api_file($file);
            }
        }

        $chatService = new ChatService;
        $newChat = $chatService->store($request->except(['_token']), $attachments);
        $this->communicationLimits()->recordMessageSent(auth()->user());

        return response()->json([
            'result' => true,
            'message' => 'Data inserted successfully!',
            'data' => new ChatViewResource($newChat),
        ]);
    }

    /**
     * Share biodata (PDF) in a chat.
     */
    public function share_biodata(Request $request)
    {
        if ($entitlementError = $this->ensureCanSendMessage()) {
            return $entitlementError;
        }

        $request->validate([
            'chat_thread_id' => 'required|exists:chat_threads,id',
        ]);

        $chatThread = ChatThread::findOrFail($request->chat_thread_id);
        if (auth()->id() !== $chatThread->sender_user_id && auth()->id() !== $chatThread->receiver_user_id) {
            return response()->json([
                'result' => false,
                'message' => 'Unauthorized access to this chat thread.',
            ], 403);
        }

        $user = auth()->user();
        if (! $user) {
            abort(401);
        }

        $pdf = PDF::loadView('pdf.biodata_modern', compact('user'), [], [
            'margin_left' => 5,
            'margin_right' => 5,
            'margin_top' => 5,
            'margin_bottom' => 5,
        ]);
        $pdfContent = $pdf->output();

        $filename = 'biodata_'.$user->id.'_'.time().'_'.uniqid().'.pdf';
        $destinationPath = public_path('uploads/all');
        if (! file_exists($destinationPath)) {
            mkdir($destinationPath, 0777, true);
        }
        $filePath = $destinationPath.'/'.$filename;
        file_put_contents($filePath, $pdfContent);

        $upload = Upload::create([
            'file_original_name' => 'Biodata-'.($user->first_name ?? 'User'),
            'file_name' => 'uploads/all/'.$filename,
            'user_id' => $user->id,
            'extension' => 'pdf',
            'type' => 'document',
            'file_size' => strlen($pdfContent),
        ]);

        $chatService = new ChatService;
        $newChat = $chatService->store([
            'chat_thread_id' => $request->chat_thread_id,
            'message' => "📄 I've shared my biodata/profile details with you. You can view my full profile for more information.",
        ], [$upload->id]);
        $this->communicationLimits()->recordMessageSent($user);

        return response()->json([
            'result' => true,
            'message' => 'Biodata shared successfully!',
            'data' => new ChatViewResource($newChat),
        ]);
    }
}
