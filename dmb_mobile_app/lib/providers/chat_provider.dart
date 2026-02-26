import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/models.dart';
import '../repositories/repositories.dart';
import 'repository_providers.dart';

/// Chat state
class ChatsState {
  final List<Chat> chats;
  final bool isLoading;
  final String? error;

  const ChatsState({
    this.chats = const [],
    this.isLoading = false,
    this.error,
  });

  ChatsState copyWith({
    List<Chat>? chats,
    bool? isLoading,
    String? error,
  }) {
    return ChatsState(
      chats: chats ?? this.chats,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }

  /// Get direct chats
  List<Chat> get directChats =>
      chats.where((c) => c.type == ChatType.direct && !c.isRequest).toList();

  /// Get group chats
  List<Chat> get groupChats =>
      chats.where((c) => c.type == ChatType.group).toList();

  /// Get matchmaker chats
  List<Chat> get matchmakerChats =>
      chats.where((c) => c.type == ChatType.matchmaker).toList();

  /// Get message requests
  List<Chat> get messageRequests => chats.where((c) => c.isRequest).toList();

  /// Total unread count
  int get totalUnreadCount =>
      chats.fold(0, (sum, chat) => sum + chat.unreadCount);
}

/// Chats notifier - manages chat list
/// Transpiled from React: MessagesView.tsx state management
class ChatsNotifier extends StateNotifier<ChatsState> {
  final ChatRepository _chatRepository;

  ChatsNotifier(this._chatRepository) : super(const ChatsState()) {
    loadChats();
  }

  /// Load all chats
  Future<void> loadChats() async {
    state = state.copyWith(isLoading: true);

    final result = await _chatRepository.getChats();

    result.fold(
      onSuccess: (chats) {
        state = state.copyWith(
          chats: chats,
          isLoading: false,
        );
      },
      onFailure: (error) {
        state = state.copyWith(
          isLoading: false,
          error: error,
        );
      },
    );
  }

  /// Mark chat as read
  Future<void> markAsRead(String chatId) async {
    await _chatRepository.markAsRead(chatId);

    final updatedChats = state.chats.map((chat) {
      if (chat.id == chatId) {
        return chat.copyWith(unreadCount: 0);
      }
      return chat;
    }).toList();

    state = state.copyWith(chats: updatedChats);
  }

  /// Delete a chat
  Future<void> deleteChat(String chatId) async {
    await _chatRepository.deleteChat(chatId);

    final updatedChats = state.chats.where((c) => c.id != chatId).toList();
    state = state.copyWith(chats: updatedChats);
  }

  /// Mute a chat
  Future<void> muteChat(String chatId, Duration duration) async {
    await _chatRepository.muteChat(chatId: chatId, duration: duration);

    final updatedChats = state.chats.map((chat) {
      if (chat.id == chatId) {
        return chat.copyWith(isMuted: true);
      }
      return chat;
    }).toList();

    state = state.copyWith(chats: updatedChats);
  }

  /// Unmute a chat
  Future<void> unmuteChat(String chatId) async {
    await _chatRepository.unmuteChat(chatId);

    final updatedChats = state.chats.map((chat) {
      if (chat.id == chatId) {
        return chat.copyWith(isMuted: false);
      }
      return chat;
    }).toList();

    state = state.copyWith(chats: updatedChats);
  }

  /// Refresh chats
  Future<void> refresh() async {
    await loadChats();
  }

  /// Clear error
  void clearError() {
    state = state.copyWith(error: null);
  }
}

/// Chats provider
final chatsProvider = StateNotifierProvider<ChatsNotifier, ChatsState>((ref) {
  final chatRepository = ref.watch(chatRepositoryProvider);
  return ChatsNotifier(chatRepository);
});

/// Chat unread count provider
final chatUnreadCountProvider = Provider<int>((ref) {
  return ref.watch(chatsProvider).totalUnreadCount;
});

/// Single chat state
class ChatDetailState {
  final Chat? chat;
  final List<Message> messages;
  final bool isLoading;
  final bool isSending;
  final bool isTyping;
  final String? error;

  const ChatDetailState({
    this.chat,
    this.messages = const [],
    this.isLoading = false,
    this.isSending = false,
    this.isTyping = false,
    this.error,
  });

  ChatDetailState copyWith({
    Chat? chat,
    List<Message>? messages,
    bool? isLoading,
    bool? isSending,
    bool? isTyping,
    String? error,
  }) {
    return ChatDetailState(
      chat: chat ?? this.chat,
      messages: messages ?? this.messages,
      isLoading: isLoading ?? this.isLoading,
      isSending: isSending ?? this.isSending,
      isTyping: isTyping ?? this.isTyping,
      error: error,
    );
  }
}

/// Chat detail notifier - manages a single chat conversation
class ChatDetailNotifier extends StateNotifier<ChatDetailState> {
  final ChatRepository _chatRepository;
  final String chatId;

  ChatDetailNotifier(this._chatRepository, this.chatId)
      : super(const ChatDetailState()) {
    loadChat();
  }

  /// Load chat and messages
  Future<void> loadChat() async {
    state = state.copyWith(isLoading: true);

    final chatResult = await _chatRepository.getChatById(chatId);
    final messagesResult = await _chatRepository.getMessages(chatId: chatId);

    chatResult.fold(
      onSuccess: (chat) {
        messagesResult.fold(
          onSuccess: (messages) {
            state = state.copyWith(
              chat: chat,
              messages: messages,
              isLoading: false,
            );
          },
          onFailure: (error) {
            state = state.copyWith(
              chat: chat,
              isLoading: false,
              error: error,
            );
          },
        );
      },
      onFailure: (error) {
        state = state.copyWith(
          isLoading: false,
          error: error,
        );
      },
    );
  }

  /// Send a text message
  Future<void> sendMessage(String content) async {
    if (content.trim().isEmpty) return;

    state = state.copyWith(isSending: true);

    final result = await _chatRepository.sendMessage(
      chatId: chatId,
      content: content,
    );

    result.fold(
      onSuccess: (message) {
        state = state.copyWith(
          messages: [...state.messages, message],
          isSending: false,
        );
      },
      onFailure: (error) {
        state = state.copyWith(
          isSending: false,
          error: error,
        );
      },
    );
  }

  /// Send an image message
  Future<void> sendImage(String imagePath) async {
    state = state.copyWith(isSending: true);

    final result = await _chatRepository.sendImageMessage(
      chatId: chatId,
      imagePath: imagePath,
    );

    result.fold(
      onSuccess: (message) {
        state = state.copyWith(
          messages: [...state.messages, message],
          isSending: false,
        );
      },
      onFailure: (error) {
        state = state.copyWith(
          isSending: false,
          error: error,
        );
      },
    );
  }

  /// Delete a message
  Future<void> deleteMessage(String messageId) async {
    await _chatRepository.deleteMessage(chatId: chatId, messageId: messageId);

    final updatedMessages =
        state.messages.where((m) => m.id != messageId).toList();
    state = state.copyWith(messages: updatedMessages);
  }

  /// Mark messages as read
  Future<void> markAsRead() async {
    await _chatRepository.markAsRead(chatId);
  }

  /// Send typing indicator
  Future<void> sendTypingIndicator() async {
    await _chatRepository.sendTypingIndicator(chatId);
  }

  /// Initiate video call
  Future<String?> initiateVideoCall() async {
    final result = await _chatRepository.initiateVideoCall(chatId);
    return result.fold(
      onSuccess: (callId) => callId,
      onFailure: (_) => null,
    );
  }

  /// Initiate voice call
  Future<String?> initiateVoiceCall() async {
    final result = await _chatRepository.initiateVoiceCall(chatId);
    return result.fold(
      onSuccess: (callId) => callId,
      onFailure: (_) => null,
    );
  }

  /// Refresh chat
  Future<void> refresh() async {
    await loadChat();
  }

  /// Clear error
  void clearError() {
    state = state.copyWith(error: null);
  }
}

/// Chat detail provider - family provider for individual chats
final chatDetailProvider =
    StateNotifierProvider.family<ChatDetailNotifier, ChatDetailState, String>(
        (ref, chatId) {
  final chatRepository = ref.watch(chatRepositoryProvider);
  return ChatDetailNotifier(chatRepository, chatId);
});
