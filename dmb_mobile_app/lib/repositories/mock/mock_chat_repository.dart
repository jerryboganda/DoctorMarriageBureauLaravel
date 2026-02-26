import 'dart:async';
import '../../models/models.dart';
import '../repository_interfaces.dart';

/// Mock implementation of ChatRepository for development and testing
class MockChatRepository implements ChatRepository {
  /// Mock chats - transpiled from React MOCK_CHATS constant
  static final List<Chat> mockChats = [
    Chat(
      id: '1',
      participants: [
        Participant(
          id: 'p1',
          name: 'Dr. Aditi Sharma',
          avatarUrl:
              'https://lh3.googleusercontent.com/aida-public/AB6AXuDxXuKVKvrrNXYrG-CY1ssc7c8MM0q4JHAY75reeW_PbVx6mcGg2IWd0ZWJJdglbFYo-odqtaxEZSoEU9TDAChhZ_YgCKJmbKtlnAh_bFl1HkS5BrMhak_-V5ms913RD14CEyw6wgE1V_WqRWRfk-k0wfB0jnK_GlS_w980MpPHAm3G_IadeEXaFHmTTiI-TgRihMq1zYSIDjWu19ZqeSkDVEd-WO3R0nFXnsoYA2C3kJqb5DS0_tX8Z12bor2ZslGRfDBc2vmzuMg',
        ),
      ],
      lastMessage: Message(
        id: 'm1',
        senderId: '1',
        text: 'That sounds perfect! Saturday works for me.',
        type: MessageType.text,
        timestamp: '10:42 AM',
        status: MessageStatus.read,
      ),
      unreadCount: 0,
      type: ChatType.direct,
      isOnline: true,
    ),
    Chat(
      id: '2',
      participants: [
        Participant(
          id: 'p2',
          name: 'Dr. Rohan Gupta',
          avatarUrl:
              'https://lh3.googleusercontent.com/aida-public/AB6AXuCRcdeTydgcgnAttlmfU4LLL4vVkwtOHBPd6w3QatUT9cIkbpP_DjfQ9RlvwlJBVXG53Yp1hle3KRcVrHPd95u3mGIknG4fv1yYu7jStC9WvKbCY45OIF04vYYeNPPn3YkTxz1U-5VYb-dWXPjBCCod00I1VgvOH-4ifIV3k6a6jxbnxbSX7R2dWfw2t5vzM82LqXfDWPd9vHmktScUf8EMP2g38LXuffLIFPolBtqNIpOmWEaC0EoQa_hZeTAMERlO-0iWiCGVOHs',
        ),
        Participant(
          id: 'p2m',
          name: 'Mrs. Gupta (Mother)',
          avatarUrl:
              'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200&h=200',
          role: 'Guardian',
        ),
      ],
      lastMessage: Message(
        id: 'm2',
        senderId: '2',
        text: 'Shared a family photo album',
        type: MessageType.system,
        timestamp: 'Yesterday',
        status: MessageStatus.read,
      ),
      unreadCount: 2,
      type: ChatType.group,
    ),
    Chat(
      id: '3',
      participants: [
        Participant(
          id: 'p3',
          name: 'Seema (Matchmaker)',
          avatarUrl:
              'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200&h=200',
          role: 'Agent',
        ),
      ],
      lastMessage: Message(
        id: 'm3',
        senderId: '3',
        text: 'Here are 3 new profiles for your review.',
        type: MessageType.text,
        timestamp: 'Tue',
        status: MessageStatus.read,
      ),
      unreadCount: 0,
      type: ChatType.matchmaker,
    ),
    Chat(
      id: '4',
      participants: [
        Participant(
          id: 'p4',
          name: 'Dr. Emily Chen',
          avatarUrl:
              'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=200&h=200',
        ),
      ],
      lastMessage: Message(
        id: 'm4',
        senderId: '4',
        text: 'Hi Dr. Kumar, interesting profile!',
        type: MessageType.text,
        timestamp: '1 hour ago',
        status: MessageStatus.delivered,
      ),
      unreadCount: 1,
      type: ChatType.direct,
      isRequest: true,
    ),
  ];

  /// Mock messages per chat
  static final Map<String, List<Message>> mockMessages = {
    '1': [
      Message(
        id: 'm1_1',
        senderId: 'user_001',
        text: 'Hi Dr. Sharma, I noticed we have similar research interests.',
        type: MessageType.text,
        timestamp: 'Yesterday, 9:00 AM',
        status: MessageStatus.read,
      ),
      Message(
        id: 'm1_2',
        senderId: '1',
        text:
            'Hello Dr. Kumar! Yes, I read your paper on cardiovascular interventions. Very impressive work!',
        type: MessageType.text,
        timestamp: 'Yesterday, 9:15 AM',
        status: MessageStatus.read,
      ),
      Message(
        id: 'm1_3',
        senderId: 'user_001',
        text: 'Thank you! Would you like to discuss it over coffee sometime?',
        type: MessageType.text,
        timestamp: 'Yesterday, 2:00 PM',
        status: MessageStatus.read,
      ),
      Message(
        id: 'm1_4',
        senderId: '1',
        text: "That sounds perfect! Saturday works for me.",
        type: MessageType.text,
        timestamp: '10:42 AM',
        status: MessageStatus.read,
      ),
    ],
    '2': [
      Message(
        id: 'm2_1',
        senderId: 'p2m',
        text:
            'Hello Dr. Kumar, Rohan has told us a lot about you. We would love to know more about your family.',
        type: MessageType.text,
        timestamp: '2 days ago',
        status: MessageStatus.read,
      ),
      Message(
        id: 'm2_2',
        senderId: 'user_001',
        text:
            "Hello Mrs. Gupta! It's a pleasure to meet you. My family is from Delhi, and my father is a retired professor.",
        type: MessageType.text,
        timestamp: '2 days ago',
        status: MessageStatus.read,
      ),
      Message(
        id: 'm2_3',
        senderId: '2',
        text: 'Shared a family photo album',
        type: MessageType.system,
        timestamp: 'Yesterday',
        status: MessageStatus.read,
      ),
    ],
    '3': [
      Message(
        id: 'm3_1',
        senderId: '3',
        text:
            'Hello Dr. Kumar! I have found some excellent matches for you based on your preferences.',
        type: MessageType.text,
        timestamp: 'Mon',
        status: MessageStatus.read,
      ),
      Message(
        id: 'm3_2',
        senderId: '3',
        text: 'Here are 3 new profiles for your review.',
        type: MessageType.text,
        timestamp: 'Tue',
        status: MessageStatus.read,
      ),
    ],
    '4': [
      Message(
        id: 'm4_1',
        senderId: '4',
        text: 'Hi Dr. Kumar, interesting profile!',
        type: MessageType.text,
        timestamp: '1 hour ago',
        status: MessageStatus.delivered,
      ),
    ],
  };

  final List<Chat> _chats = List.from(mockChats);
  final Map<String, List<Message>> _messages = Map.from(mockMessages);
  final StreamController<Message> _messageStreamController =
      StreamController<Message>.broadcast();
  final StreamController<bool> _typingStreamController =
      StreamController<bool>.broadcast();

  @override
  Future<Result<List<Chat>>> getChats({
    int page = 1,
    int limit = 20,
  }) async {
    await _simulateNetworkDelay();

    final startIndex = (page - 1) * limit;
    if (startIndex >= _chats.length) {
      return Result.success([]);
    }

    final endIndex = (startIndex + limit).clamp(0, _chats.length);
    return Result.success(_chats.sublist(startIndex, endIndex));
  }

  @override
  Future<Result<Chat>> getChatById(String id) async {
    await _simulateNetworkDelay(milliseconds: 300);

    final chat = _chats.firstWhere(
      (c) => c.id == id,
      orElse: () => Chat.empty(),
    );

    if (chat.id.isEmpty) {
      return Result.failure('Chat not found');
    }

    return Result.success(chat);
  }

  @override
  Future<Result<Chat>> getOrCreateChat(String userId) async {
    await _simulateNetworkDelay();

    // Try to find existing chat
    final existingChat = _chats.firstWhere(
      (c) => c.participants.any((p) => p.id == userId),
      orElse: () => Chat.empty(),
    );

    if (existingChat.id.isNotEmpty) {
      return Result.success(existingChat);
    }

    // Create new chat
    final newChat = Chat(
      id: 'chat_${DateTime.now().millisecondsSinceEpoch}',
      participants: [
        Participant(
          id: userId,
          name: 'New Connection',
          avatarUrl: '',
        ),
      ],
      type: ChatType.direct,
      unreadCount: 0,
    );

    _chats.add(newChat);
    _messages[newChat.id] = [];

    return Result.success(newChat);
  }

  @override
  Future<Result<List<Message>>> getMessages({
    required String chatId,
    int page = 1,
    int limit = 50,
  }) async {
    await _simulateNetworkDelay();

    final messages = _messages[chatId] ?? [];
    final startIndex = (page - 1) * limit;

    if (startIndex >= messages.length) {
      return Result.success([]);
    }

    final endIndex = (startIndex + limit).clamp(0, messages.length);
    return Result.success(messages.sublist(startIndex, endIndex));
  }

  @override
  Future<Result<Message>> sendMessage({
    required String chatId,
    required String content,
    MessageType type = MessageType.text,
  }) async {
    await _simulateNetworkDelay(milliseconds: 300);

    final message = Message(
      id: 'msg_${DateTime.now().millisecondsSinceEpoch}',
      senderId: 'user_001',
      text: content,
      type: type,
      timestamp: _formatTimestamp(DateTime.now()),
      status: MessageStatus.sent,
    );

    if (_messages.containsKey(chatId)) {
      _messages[chatId]!.add(message);
    } else {
      _messages[chatId] = [message];
    }

    // Update chat's last message
    final chatIndex = _chats.indexWhere((c) => c.id == chatId);
    if (chatIndex != -1) {
      _chats[chatIndex] = _chats[chatIndex].copyWith(lastMessage: message);
    }

    // Emit message to stream
    _messageStreamController.add(message);

    // Simulate delivery after a short delay
    Future.delayed(const Duration(seconds: 1), () {
      final updatedMessage = message.copyWith(status: MessageStatus.delivered);
      _messageStreamController.add(updatedMessage);
    });

    return Result.success(message);
  }

  @override
  Future<Result<Message>> sendImageMessage({
    required String chatId,
    required String imagePath,
  }) async {
    await _simulateNetworkDelay(milliseconds: 1500);

    final message = Message(
      id: 'msg_${DateTime.now().millisecondsSinceEpoch}',
      senderId: 'user_001',
      text: imagePath,
      type: MessageType.image,
      timestamp: _formatTimestamp(DateTime.now()),
      status: MessageStatus.sent,
    );

    if (_messages.containsKey(chatId)) {
      _messages[chatId]!.add(message);
    } else {
      _messages[chatId] = [message];
    }

    _messageStreamController.add(message);

    return Result.success(message);
  }

  @override
  Future<Result<void>> markAsRead(String chatId) async {
    await _simulateNetworkDelay(milliseconds: 200);

    final chatIndex = _chats.indexWhere((c) => c.id == chatId);
    if (chatIndex != -1) {
      _chats[chatIndex] = _chats[chatIndex].copyWith(unreadCount: 0);
    }

    return Result.success(null);
  }

  @override
  Future<Result<void>> deleteMessage({
    required String chatId,
    required String messageId,
  }) async {
    await _simulateNetworkDelay(milliseconds: 300);

    if (_messages.containsKey(chatId)) {
      _messages[chatId]!.removeWhere((m) => m.id == messageId);
    }

    return Result.success(null);
  }

  @override
  Future<Result<void>> deleteChat(String chatId) async {
    await _simulateNetworkDelay();

    _chats.removeWhere((c) => c.id == chatId);
    _messages.remove(chatId);

    return Result.success(null);
  }

  @override
  Future<Result<void>> muteChat({
    required String chatId,
    required Duration duration,
  }) async {
    await _simulateNetworkDelay(milliseconds: 300);

    final chatIndex = _chats.indexWhere((c) => c.id == chatId);
    if (chatIndex != -1) {
      _chats[chatIndex] = _chats[chatIndex].copyWith(isMuted: true);
    }

    return Result.success(null);
  }

  @override
  Future<Result<void>> unmuteChat(String chatId) async {
    await _simulateNetworkDelay(milliseconds: 300);

    final chatIndex = _chats.indexWhere((c) => c.id == chatId);
    if (chatIndex != -1) {
      _chats[chatIndex] = _chats[chatIndex].copyWith(isMuted: false);
    }

    return Result.success(null);
  }

  @override
  Future<Result<int>> getUnreadCount() async {
    await _simulateNetworkDelay(milliseconds: 200);

    final totalUnread =
        _chats.fold<int>(0, (sum, chat) => sum + chat.unreadCount);
    return Result.success(totalUnread);
  }

  @override
  Stream<Message> streamMessages(String chatId) {
    return _messageStreamController.stream.where(
      (message) => _messages[chatId]?.any((m) => m.id == message.id) ?? false,
    );
  }

  @override
  Stream<bool> streamTypingIndicator(String chatId) {
    return _typingStreamController.stream;
  }

  @override
  Future<void> sendTypingIndicator(String chatId) async {
    _typingStreamController.add(true);
    await Future.delayed(const Duration(seconds: 3));
    _typingStreamController.add(false);
  }

  @override
  Future<Result<String>> initiateVideoCall(String chatId) async {
    await _simulateNetworkDelay();
    return Result.success(
        'call_video_${DateTime.now().millisecondsSinceEpoch}');
  }

  @override
  Future<Result<String>> initiateVoiceCall(String chatId) async {
    await _simulateNetworkDelay();
    return Result.success(
        'call_voice_${DateTime.now().millisecondsSinceEpoch}');
  }

  String _formatTimestamp(DateTime dateTime) {
    final hour = dateTime.hour;
    final minute = dateTime.minute.toString().padLeft(2, '0');
    final period = hour >= 12 ? 'PM' : 'AM';
    final displayHour = hour > 12 ? hour - 12 : (hour == 0 ? 12 : hour);
    return '$displayHour:$minute $period';
  }

  Future<void> _simulateNetworkDelay({int milliseconds = 800}) async {
    await Future.delayed(Duration(milliseconds: milliseconds));
  }

  /// Dispose stream controllers
  void dispose() {
    _messageStreamController.close();
    _typingStreamController.close();
  }
}
