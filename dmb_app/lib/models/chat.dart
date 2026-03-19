/// Maps Chat and Message interfaces from types.ts
class ChatMessage {
  final String id;
  final String senderId;
  final String? text;
  final String type; // 'text', 'image', 'voice', 'system', 'prompt', 'call_log', 'file'
  final String timestamp;
  final String status; // 'sent', 'delivered', 'read'
  final bool isSensitive;
  final String? mediaUrl;
  final String? duration;
  final String? fileName;

  const ChatMessage({
    required this.id,
    required this.senderId,
    this.text,
    this.type = 'text',
    required this.timestamp,
    this.status = 'sent',
    this.isSensitive = false,
    this.mediaUrl,
    this.duration,
    this.fileName,
  });

  bool get isMe => senderId == 'me';
  bool get isSystem => type == 'system' || type == 'prompt';

  factory ChatMessage.fromApi(Map<String, dynamic> json, int myUserId) {
    return ChatMessage(
      id: (json['id'] ?? '').toString(),
      senderId: json['user_id']?.toString() == myUserId.toString() ? 'me' : json['user_id'].toString(),
      text: json['message'] ?? json['text'],
      type: json['type'] ?? 'text',
      timestamp: json['created_at'] ?? json['timestamp'] ?? '',
      status: json['status'] ?? 'sent',
      isSensitive: json['is_sensitive'] == true,
      mediaUrl: json['attachment'] ?? json['media_url'] ?? json['mediaUrl'],
      duration: json['duration'],
      fileName: json['file_name'] ?? json['fileName'],
    );
  }
}

class ChatParticipant {
  final String name;
  final String avatarUrl;
  final String? role;

  const ChatParticipant({
    required this.name,
    required this.avatarUrl,
    this.role,
  });
}

class ChatThread {
  final String id;
  final List<ChatParticipant> participants;
  final ChatMessage? lastMessage;
  final int unreadCount;
  final String type; // 'direct', 'group', 'matchmaker'
  final bool isRequest;
  final bool isOnline;
  final bool typing;

  const ChatThread({
    required this.id,
    this.participants = const [],
    this.lastMessage,
    this.unreadCount = 0,
    this.type = 'direct',
    this.isRequest = false,
    this.isOnline = false,
    this.typing = false,
  });

  factory ChatThread.fromApi(Map<String, dynamic> json, int myUserId) {
    final sender = json['sender_user'] as Map<String, dynamic>? ?? {};
    final receiver = json['receiver_user'] as Map<String, dynamic>? ?? {};
    final otherUser = sender['id']?.toString() == myUserId.toString() ? receiver : sender;

    final chats = json['chats'] as List? ?? [];
    ChatMessage? lastMsg;
    if (chats.isNotEmpty) {
      lastMsg = ChatMessage.fromApi(chats.last as Map<String, dynamic>, myUserId);
    } else if (json['latest_message'] != null) {
      lastMsg = ChatMessage.fromApi(json['latest_message'], myUserId);
    }

    return ChatThread(
      id: (json['id'] ?? json['thread_code'] ?? '').toString(),
      participants: [
        ChatParticipant(
          name: otherUser['name'] ?? '${otherUser['first_name'] ?? ''} ${otherUser['last_name'] ?? ''}'.trim(),
          avatarUrl: (otherUser['avatar'] ?? otherUser['photo'] ?? '').toString(),
          role: otherUser['type'],
        ),
      ],
      lastMessage: lastMsg,
      unreadCount: json['unread_count'] ?? 0,
      type: json['type'] ?? 'direct',
      isRequest: json['is_request'] == true,
      isOnline: json['is_online'] == true,
      typing: false,
    );
  }
}
