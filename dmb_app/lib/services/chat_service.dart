import 'dart:io';
import 'package:dio/dio.dart';
import 'api_service.dart';
import '../models/chat.dart';

class ChatService {
  final ApiService _api;

  ChatService(this._api);

  /// Get chat thread list — GET /member/chat-list
  Future<List<ChatThread>> getChatList(int myUserId) async {
    final response = await _api.get('/member/chat-list');
    final data = response.data;
    final list = data['data'] ?? data;
    if (list is! List) return [];
    return list.map<ChatThread>((t) => ChatThread.fromApi(t, myUserId)).toList();
  }

  /// Get chat thread messages — GET /member/chat-view/{id}
  Future<ChatViewResult> getChatView(int threadId, int myUserId) async {
    final response = await _api.get('/member/chat-view/$threadId');
    final data = response.data;
    final thread = data['data'] ?? data;

    final chats = thread['chats'] as List? ?? [];
    final messages = chats
        .map<ChatMessage>((m) => ChatMessage.fromApi(m, myUserId))
        .toList();

    return ChatViewResult(
      threadId: threadId,
      messages: messages,
      otherUser: thread['other_user'] ?? thread['receiver_user'] ?? thread['sender_user'] ?? {},
    );
  }

  /// Send message — POST /member/chat-reply
  Future<ChatMessage?> sendMessage({
    required int threadId,
    required String message,
    File? attachment,
    required int myUserId,
  }) async {
    Response response;
    if (attachment != null) {
      final formData = FormData.fromMap({
        'chat_thread_id': threadId,
        'message': message,
        'attachment': await MultipartFile.fromFile(attachment.path),
      });
      response = await _api.dio.post(
        '/member/chat-reply',
        data: formData,
        options: Options(headers: {'Content-Type': 'multipart/form-data'}),
      );
    } else {
      response = await _api.post('/member/chat-reply', data: {
        'chat_thread_id': threadId,
        'message': message,
      });
    }

    final data = response.data;
    final msgData = data['data'] ?? data;
    if (msgData is Map<String, dynamic>) {
      return ChatMessage.fromApi(msgData, myUserId);
    }
    return null;
  }

  /// Load older messages — POST /member/chat/old-messages
  Future<List<ChatMessage>> loadOlderMessages({
    required int firstMessageId,
    required int myUserId,
  }) async {
    final response = await _api.post('/member/chat/old-messages', data: {
      'first_message_id': firstMessageId,
    });
    final data = response.data;
    final list = data['data'] ?? data;
    if (list is! List) return [];
    return list.map<ChatMessage>((m) => ChatMessage.fromApi(m, myUserId)).toList();
  }

  /// Share biodata in chat — POST /member/chat/share-biodata
  Future<ChatMessage?> shareBiodata({
    required int threadId,
    required int myUserId,
  }) async {
    final response = await _api.post('/member/chat/share-biodata', data: {
      'chat_thread_id': threadId,
    });
    final data = response.data;
    final msgData = data['data'] ?? data;
    if (msgData is Map<String, dynamic>) {
      return ChatMessage.fromApi(msgData, myUserId);
    }
    return null;
  }
}

class ChatViewResult {
  final int threadId;
  final List<ChatMessage> messages;
  final Map<String, dynamic> otherUser;

  const ChatViewResult({
    required this.threadId,
    required this.messages,
    required this.otherUser,
  });
}
