<div class="chat-message chat-message-right" data-chat-id="{{ $chat->id }}">
    <div class="chat-message-body">
        {!! nl2br(e($chat->message)) !!}
    </div>

    @if (! empty($chat->attachment))
        <div class="chat-message-attachment" data-attachment="{{ e($chat->attachment) }}"></div>
    @endif
</div>
