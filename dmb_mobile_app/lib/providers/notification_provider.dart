import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/models.dart';
import '../repositories/repositories.dart';
import 'repository_providers.dart';

/// Notifications state
class NotificationsState {
  final List<AppNotification> notifications;
  final bool isLoading;
  final String? error;

  const NotificationsState({
    this.notifications = const [],
    this.isLoading = false,
    this.error,
  });

  NotificationsState copyWith({
    List<AppNotification>? notifications,
    bool? isLoading,
    String? error,
  }) {
    return NotificationsState(
      notifications: notifications ?? this.notifications,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }

  /// Get unread notifications
  List<AppNotification> get unreadNotifications =>
      notifications.where((n) => !n.isRead).toList();

  /// Unread count
  int get unreadCount => unreadNotifications.length;

  /// Get notifications by type
  List<AppNotification> getByType(NotificationType type) =>
      notifications.where((n) => n.type == type).toList();
}

/// Notifications notifier - manages notification list
/// Transpiled from React: NotificationsView.tsx state management
class NotificationsNotifier extends StateNotifier<NotificationsState> {
  final NotificationRepository _notificationRepository;

  NotificationsNotifier(this._notificationRepository)
      : super(const NotificationsState()) {
    loadNotifications();
  }

  /// Load all notifications
  Future<void> loadNotifications() async {
    state = state.copyWith(isLoading: true);

    final result = await _notificationRepository.getNotifications();

    result.fold(
      onSuccess: (notifications) {
        state = state.copyWith(
          notifications: notifications,
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

  /// Mark notification as read
  Future<void> markAsRead(String notificationId) async {
    await _notificationRepository.markAsRead(notificationId);

    final updatedNotifications = state.notifications.map((n) {
      if (n.id == notificationId) {
        return n.markAsRead();
      }
      return n;
    }).toList();

    state = state.copyWith(notifications: updatedNotifications);
  }

  /// Mark all notifications as read
  Future<void> markAllAsRead() async {
    await _notificationRepository.markAllAsRead();

    final updatedNotifications =
        state.notifications.map((n) => n.markAsRead()).toList();
    state = state.copyWith(notifications: updatedNotifications);
  }

  /// Delete a notification
  Future<void> deleteNotification(String notificationId) async {
    await _notificationRepository.deleteNotification(notificationId);

    final updatedNotifications =
        state.notifications.where((n) => n.id != notificationId).toList();
    state = state.copyWith(notifications: updatedNotifications);
  }

  /// Delete all notifications
  Future<void> deleteAllNotifications() async {
    await _notificationRepository.deleteAllNotifications();
    state = state.copyWith(notifications: []);
  }

  /// Refresh notifications
  Future<void> refresh() async {
    await loadNotifications();
  }

  /// Clear error
  void clearError() {
    state = state.copyWith(error: null);
  }
}

/// Notifications provider
final notificationsProvider =
    StateNotifierProvider<NotificationsNotifier, NotificationsState>((ref) {
  final notificationRepository = ref.watch(notificationRepositoryProvider);
  return NotificationsNotifier(notificationRepository);
});

/// Notification unread count provider
final notificationUnreadCountProvider = Provider<int>((ref) {
  return ref.watch(notificationsProvider).unreadCount;
});

/// Notification settings state
class NotificationSettingsState {
  final Map<String, bool> settings;
  final bool isLoading;
  final String? error;

  const NotificationSettingsState({
    this.settings = const {},
    this.isLoading = false,
    this.error,
  });

  NotificationSettingsState copyWith({
    Map<String, bool>? settings,
    bool? isLoading,
    String? error,
  }) {
    return NotificationSettingsState(
      settings: settings ?? this.settings,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

/// Notification settings notifier
class NotificationSettingsNotifier
    extends StateNotifier<NotificationSettingsState> {
  final NotificationRepository _notificationRepository;

  NotificationSettingsNotifier(this._notificationRepository)
      : super(const NotificationSettingsState()) {
    loadSettings();
  }

  /// Load notification settings
  Future<void> loadSettings() async {
    state = state.copyWith(isLoading: true);

    final result = await _notificationRepository.getNotificationSettings();

    result.fold(
      onSuccess: (settings) {
        state = state.copyWith(
          settings: settings,
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

  /// Update a single setting
  Future<void> updateSetting(String key, bool value) async {
    final updatedSettings = {...state.settings, key: value};
    state = state.copyWith(settings: updatedSettings);

    await _notificationRepository.updateNotificationSettings(
      settings: {key: value},
    );
  }

  /// Update multiple settings
  Future<void> updateSettings(Map<String, bool> settings) async {
    final updatedSettings = {...state.settings, ...settings};
    state = state.copyWith(settings: updatedSettings);

    await _notificationRepository.updateNotificationSettings(
        settings: settings);
  }
}

/// Notification settings provider
final notificationSettingsProvider = StateNotifierProvider<
    NotificationSettingsNotifier, NotificationSettingsState>((ref) {
  final notificationRepository = ref.watch(notificationRepositoryProvider);
  return NotificationSettingsNotifier(notificationRepository);
});
