import 'package:equatable/equatable.dart';

/// Message type enum
enum MessageType {
  text('text'),
  image('image'),
  file('file'),
  system('system'),
  audio('audio'),
  video('video');

  final String value;
  const MessageType(this.value);

  factory MessageType.fromString(String value) {
    return MessageType.values.firstWhere(
      (e) => e.value.toLowerCase() == value.toLowerCase(),
      orElse: () => MessageType.text,
    );
  }
}

/// Message status enum
enum MessageStatus {
  sending('sending'),
  sent('sent'),
  delivered('delivered'),
  read('read'),
  failed('failed');

  final String value;
  const MessageStatus(this.value);

  factory MessageStatus.fromString(String value) {
    return MessageStatus.values.firstWhere(
      (e) => e.value.toLowerCase() == value.toLowerCase(),
      orElse: () => MessageStatus.sent,
    );
  }
}

/// Chat type enum
enum ChatType {
  direct('direct'),
  group('group'),
  matchmaker('matchmaker');

  final String value;
  const ChatType(this.value);

  factory ChatType.fromString(String value) {
    return ChatType.values.firstWhere(
      (e) => e.value.toLowerCase() == value.toLowerCase(),
      orElse: () => ChatType.direct,
    );
  }
}

/// Message model
/// Transpiled from TypeScript: lastMessage: { id: string; senderId: string; text: string; type: string; timestamp: string; status: string }
class Message extends Equatable {
  final String id;
  final String senderId;
  final String text;
  final MessageType type;
  final String timestamp;
  final MessageStatus status;

  const Message({
    required this.id,
    required this.senderId,
    required this.text,
    required this.type,
    required this.timestamp,
    required this.status,
  });

  factory Message.fromJson(Map<String, dynamic> json) {
    return Message(
      id: json['id'] as String? ?? '',
      senderId: json['senderId'] as String? ?? '',
      text: json['text'] as String? ?? json['content'] as String? ?? '',
      type: MessageType.fromString(json['type'] as String? ?? 'text'),
      timestamp: json['timestamp'] as String? ?? '',
      status: MessageStatus.fromString(json['status'] as String? ?? 'sent'),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'senderId': senderId,
      'text': text,
      'type': type.value,
      'timestamp': timestamp,
      'status': status.value,
    };
  }

  Message copyWith({
    String? id,
    String? senderId,
    String? text,
    MessageType? type,
    String? timestamp,
    MessageStatus? status,
  }) {
    return Message(
      id: id ?? this.id,
      senderId: senderId ?? this.senderId,
      text: text ?? this.text,
      type: type ?? this.type,
      timestamp: timestamp ?? this.timestamp,
      status: status ?? this.status,
    );
  }

  /// Alias for text to support both naming conventions
  String get content => text;

  @override
  List<Object?> get props => [id, senderId, text, type, timestamp, status];
}

/// Chat participant model
/// Transpiled from TypeScript: participants: { name: string; avatarUrl: string; role?: string }[]
class Participant extends Equatable {
  final String id;
  final String name;
  final String avatarUrl;
  final String? role;

  const Participant({
    required this.id,
    required this.name,
    required this.avatarUrl,
    this.role,
  });

  factory Participant.fromJson(Map<String, dynamic> json) {
    return Participant(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      avatarUrl: json['avatarUrl'] as String? ?? '',
      role: json['role'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'avatarUrl': avatarUrl,
      if (role != null) 'role': role,
    };
  }

  @override
  List<Object?> get props => [id, name, avatarUrl, role];
}

/// Chat model
/// Transpiled from TypeScript: interface Chat
class Chat extends Equatable {
  final String id;
  final List<Participant> participants;
  final Message? lastMessage;
  final int unreadCount;
  final ChatType type;
  final bool isOnline;
  final bool isRequest;
  final bool isMuted;

  const Chat({
    required this.id,
    this.participants = const [],
    this.lastMessage,
    this.unreadCount = 0,
    this.type = ChatType.direct,
    this.isOnline = false,
    this.isRequest = false,
    this.isMuted = false,
  });

  /// Creates an empty Chat
  factory Chat.empty() {
    return const Chat(
      id: '',
      participants: [],
    );
  }

  factory Chat.fromJson(Map<String, dynamic> json) {
    return Chat(
      id: json['id'] as String? ?? '',
      participants: (json['participants'] as List<dynamic>?)
              ?.map((e) => Participant.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      lastMessage: json['lastMessage'] != null
          ? Message.fromJson(json['lastMessage'] as Map<String, dynamic>)
          : null,
      unreadCount: json['unreadCount'] as int? ?? 0,
      type: ChatType.fromString(json['type'] as String? ?? 'direct'),
      isOnline: json['isOnline'] as bool? ?? false,
      isRequest: json['isRequest'] as bool? ?? false,
      isMuted: json['isMuted'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'participants': participants.map((e) => e.toJson()).toList(),
      if (lastMessage != null) 'lastMessage': lastMessage!.toJson(),
      'unreadCount': unreadCount,
      'type': type.value,
      'isOnline': isOnline,
      'isRequest': isRequest,
      'isMuted': isMuted,
    };
  }

  Chat copyWith({
    String? id,
    List<Participant>? participants,
    Message? lastMessage,
    int? unreadCount,
    ChatType? type,
    bool? isOnline,
    bool? isRequest,
    bool? isMuted,
  }) {
    return Chat(
      id: id ?? this.id,
      participants: participants ?? this.participants,
      lastMessage: lastMessage ?? this.lastMessage,
      unreadCount: unreadCount ?? this.unreadCount,
      type: type ?? this.type,
      isOnline: isOnline ?? this.isOnline,
      isRequest: isRequest ?? this.isRequest,
      isMuted: isMuted ?? this.isMuted,
    );
  }

  /// Get primary participant (for direct chats)
  Participant? get primaryParticipant =>
      participants.isNotEmpty ? participants.first : null;

  /// Get chat display name
  String get displayName {
    if (participants.isEmpty) return 'Unknown';
    if (participants.length == 1) return participants.first.name;
    return participants.map((p) => p.name.split(' ').first).join(', ');
  }

  @override
  List<Object?> get props => [
        id,
        participants,
        lastMessage,
        unreadCount,
        type,
        isOnline,
        isRequest,
        isMuted,
      ];
}
