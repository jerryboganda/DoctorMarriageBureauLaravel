import 'dart:io';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/chat.dart';
import '../services/chat_service.dart';
import 'auth_provider.dart';

class ChatState {
  final List<ChatThread> threads;
  final List<ChatMessage>? activeChat;
  final int? activeChatId;
  final bool loadingList;
  final bool loadingChat;
  final bool sending;
  final String? error;
  final Map<int, int> onlineStatuses;
  final String searchQuery;

  const ChatState({
    this.threads = const [],
    this.activeChat,
    this.activeChatId,
    this.loadingList = false,
    this.loadingChat = false,
    this.sending = false,
    this.error,
    this.onlineStatuses = const {},
    this.searchQuery = '',
  });

  /// Filtered threads based on search query
  List<ChatThread> get filteredThreads {
    if (searchQuery.isEmpty) return threads;
    final q = searchQuery.toLowerCase();
    return threads.where((t) {
      final name = t.participants.isNotEmpty
          ? t.participants.first.name.toLowerCase()
          : '';
      final lastMsg = t.lastMessage?.text?.toLowerCase() ?? '';
      return name.contains(q) || lastMsg.contains(q);
    }).toList();
  }

  ChatState copyWith({
    List<ChatThread>? threads,
    List<ChatMessage>? Function()? activeChat,
    int? Function()? activeChatId,
    bool? loadingList,
    bool? loadingChat,
    bool? sending,
    String? error,
    Map<int, int>? onlineStatuses,
    String? searchQuery,
  }) {
    return ChatState(
      threads: threads ?? this.threads,
      activeChat: activeChat != null ? activeChat() : this.activeChat,
      activeChatId: activeChatId != null ? activeChatId() : this.activeChatId,
      loadingList: loadingList ?? this.loadingList,
      loadingChat: loadingChat ?? this.loadingChat,
      sending: sending ?? this.sending,
      error: error,
      onlineStatuses: onlineStatuses ?? this.onlineStatuses,
      searchQuery: searchQuery ?? this.searchQuery,
    );
  }
}

class ChatNotifier extends StateNotifier<ChatState> {
  final ChatService _service;
  final Ref _ref;

  ChatNotifier(this._service, this._ref) : super(const ChatState());

  int get _myUserId => _ref.read(authProvider).user?.id ?? 0;

  /// Load all chat threads — GET /member/chat-list
  Future<void> loadThreads() async {
    if (state.loadingList) return;
    state = state.copyWith(loadingList: true, error: null);

    try {
      final threads = await _service.getChatList(_myUserId);
      state = state.copyWith(
        threads: threads,
        loadingList: false,
      );
    } catch (e) {
      state = state.copyWith(
        loadingList: false,
        error: 'Failed to load conversations',
      );
    }
  }

  /// Load messages for a specific thread — GET /member/chat-view/{threadId}
  Future<void> loadChat(int threadId) async {
    state = state.copyWith(
      loadingChat: true,
      activeChatId: () => threadId,
      error: null,
    );

    try {
      final result = await _service.getChatView(threadId, _myUserId);
      state = state.copyWith(
        activeChat: () => result.messages,
        activeChatId: () => threadId,
        loadingChat: false,
      );
    } catch (e) {
      state = state.copyWith(
        loadingChat: false,
        error: 'Failed to load chat',
      );
    }
  }

  /// Send a message — POST /member/chat-reply
  /// Optimistically adds the message to activeChat before the API call.
  Future<bool> sendMessage(String message, {File? attachment}) async {
    final threadId = state.activeChatId;
    if (threadId == null) return false;

    // Optimistic message
    final optimistic = ChatMessage(
      id: 'temp_${DateTime.now().millisecondsSinceEpoch}',
      senderId: 'me',
      text: message,
      type: attachment != null ? 'image' : 'text',
      timestamp: DateTime.now().toIso8601String(),
      status: 'sending',
    );

    final currentChat = state.activeChat ?? [];
    state = state.copyWith(
      sending: true,
      activeChat: () => [optimistic, ...currentChat],
    );

    try {
      final sent = await _service.sendMessage(
        threadId: threadId,
        message: message,
        attachment: attachment,
        myUserId: _myUserId,
      );

      // Replace optimistic message with server response
      final updated = (state.activeChat ?? []).map((m) {
        if (m.id == optimistic.id && sent != null) return sent;
        return m;
      }).toList();

      state = state.copyWith(
        sending: false,
        activeChat: () => updated,
      );
      return true;
    } catch (_) {
      // Remove optimistic message on failure
      final reverted = (state.activeChat ?? [])
          .where((m) => m.id != optimistic.id)
          .toList();
      state = state.copyWith(
        sending: false,
        activeChat: () => reverted,
        error: 'Failed to send message',
      );
      return false;
    }
  }

  /// Share biodata in chat — POST /member/chat/share-biodata
  Future<bool> shareBiodata(int threadId) async {
    state = state.copyWith(sending: true, error: null);

    try {
      final msg = await _service.shareBiodata(
        threadId: threadId,
        myUserId: _myUserId,
      );

      if (msg != null && state.activeChatId == threadId) {
        final currentChat = state.activeChat ?? [];
        state = state.copyWith(
          sending: false,
          activeChat: () => [msg, ...currentChat],
        );
      } else {
        state = state.copyWith(sending: false);
      }
      return true;
    } catch (_) {
      state = state.copyWith(
        sending: false,
        error: 'Failed to share biodata',
      );
      return false;
    }
  }

  /// Filter threads locally by search query
  void searchThreads(String query) {
    state = state.copyWith(searchQuery: query);
  }

  /// Clear search
  void clearSearch() {
    state = state.copyWith(searchQuery: '');
  }

  /// Update online statuses — POST /member/user-online-status
  Future<void> updateOnlineStatuses() async {
    try {
      final api = _ref.read(apiServiceProvider);
      final response = await api.post('/member/user-online-status');
      final data = response.data;
      if (data is Map<String, dynamic>) {
        final statuses = <int, int>{};
        data.forEach((key, value) {
          final id = int.tryParse(key);
          if (id != null && value is int) {
            statuses[id] = value;
          }
        });
        state = state.copyWith(onlineStatuses: statuses);
      }
    } catch (_) {
      // Silently fail — online status is non-critical
    }
  }

  /// Add an incoming message (e.g. from push / WebSocket)
  void addIncomingMessage(ChatMessage msg) {
    if (state.activeChat == null) return;
    // Only add if the message belongs to the active chat thread
    final currentChat = state.activeChat!;
    // Avoid duplicates
    if (currentChat.any((m) => m.id == msg.id)) return;
    state = state.copyWith(
      activeChat: () => [msg, ...currentChat],
    );
  }
}

// ── Providers ──

final chatServiceProvider = Provider<ChatService>((ref) {
  return ChatService(ref.read(apiServiceProvider));
});

final chatProvider = StateNotifierProvider<ChatNotifier, ChatState>((ref) {
  return ChatNotifier(ref.read(chatServiceProvider), ref);
});
