import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/notification_model.dart';
import '../services/notification_service.dart';
import 'auth_provider.dart';

class NotificationState {
  final List<AppNotification> notifications;
  final bool loading;
  final String? error;
  final AppNotification? selectedNotification;
  final bool detailLoading;

  const NotificationState({
    this.notifications = const [],
    this.loading = false,
    this.error,
    this.selectedNotification,
    this.detailLoading = false,
  });

  /// Computed unread count
  int get unreadCount => notifications.where((n) => !n.isRead).length;

  NotificationState copyWith({
    List<AppNotification>? notifications,
    bool? loading,
    String? error,
    AppNotification? Function()? selectedNotification,
    bool? detailLoading,
  }) {
    return NotificationState(
      notifications: notifications ?? this.notifications,
      loading: loading ?? this.loading,
      error: error,
      selectedNotification: selectedNotification != null
          ? selectedNotification()
          : this.selectedNotification,
      detailLoading: detailLoading ?? this.detailLoading,
    );
  }
}

class NotificationNotifier extends StateNotifier<NotificationState> {
  final NotificationService _service;

  NotificationNotifier(this._service) : super(const NotificationState());

  /// Load notifications — GET /member/notifications
  Future<void> loadNotifications({int page = 1}) async {
    if (state.loading) return;
    state = state.copyWith(loading: true, error: null);

    try {
      final result = await _service.getNotifications(page: page);
      state = state.copyWith(
        notifications: result.notifications,
        loading: false,
      );
    } catch (e) {
      state = state.copyWith(
        loading: false,
        error: 'Failed to load notifications',
      );
    }
  }

  /// Mark a single notification as read — GET /member/notification/{id}
  /// Updates local state to reflect read status.
  Future<void> markAsRead(String id) async {
    try {
      final api = _service;
      // Use the detail endpoint which also marks as read
      await api.getNotification(id);

      final updated = state.notifications.map((n) {
        if (n.id == id) {
          return AppNotification(
            id: n.id,
            type: n.type,
            title: n.title,
            message: n.message,
            image: n.image,
            actionUrl: n.actionUrl,
            senderId: n.senderId,
            senderName: n.senderName,
            isRead: true,
            createdAt: n.createdAt,
            data: n.data,
          );
        }
        return n;
      }).toList();

      state = state.copyWith(notifications: updated);
    } catch (_) {
      // Silently fail — non-critical operation
    }
  }

  /// Mark all notifications as read — GET /member/mark-all-as-read
  Future<void> markAllAsRead() async {
    try {
      await _service.markAllAsRead();

      final updated = state.notifications.map((n) {
        return AppNotification(
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          image: n.image,
          actionUrl: n.actionUrl,
          senderId: n.senderId,
          senderName: n.senderName,
          isRead: true,
          createdAt: n.createdAt,
          data: n.data,
        );
      }).toList();

      state = state.copyWith(notifications: updated);
    } catch (_) {
      // Silently fail
    }
  }

  /// Load notification detail — GET /member/notifications/{id}
  Future<void> loadDetail(String id) async {
    state = state.copyWith(detailLoading: true, error: null);

    try {
      final notif = await _service.getNotification(id);
      state = state.copyWith(
        selectedNotification: () => notif,
        detailLoading: false,
      );

      // Also mark as read locally
      if (notif != null) {
        final updated = state.notifications.map((n) {
          if (n.id == id) {
            return AppNotification(
              id: n.id,
              type: n.type,
              title: n.title,
              message: n.message,
              image: n.image,
              actionUrl: n.actionUrl,
              senderId: n.senderId,
              senderName: n.senderName,
              isRead: true,
              createdAt: n.createdAt,
              data: n.data,
            );
          }
          return n;
        }).toList();
        state = state.copyWith(notifications: updated);
      }
    } catch (e) {
      state = state.copyWith(
        detailLoading: false,
        error: 'Failed to load notification',
      );
    }
  }

  /// Clear selected notification
  void clearSelection() {
    state = state.copyWith(selectedNotification: () => null);
  }

  /// Add a notification from real-time (push / WebSocket)
  void addNotification(AppNotification notif) {
    // Avoid duplicates
    if (state.notifications.any((n) => n.id == notif.id)) return;
    state = state.copyWith(
      notifications: [notif, ...state.notifications],
    );
  }
}

// ── Providers ──

final notificationServiceProvider = Provider<NotificationService>((ref) {
  return NotificationService(ref.read(apiServiceProvider));
});

final notificationProvider =
    StateNotifierProvider<NotificationNotifier, NotificationState>((ref) {
  return NotificationNotifier(ref.read(notificationServiceProvider));
});
