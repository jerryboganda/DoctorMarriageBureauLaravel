import 'api_service.dart';
import '../models/notification_model.dart';

class NotificationService {
  final ApiService _api;

  NotificationService(this._api);

  /// Get notifications — GET /member/notifications
  Future<NotificationListResult> getNotifications({int page = 1}) async {
    final response = await _api.get('/member/notifications', queryParameters: {
      'page': page,
    });
    final data = response.data;
    final list = data['data'] ?? data;
    final notifications = <AppNotification>[];
    if (list is List) {
      for (final item in list) {
        notifications.add(AppNotification.fromApi(item));
      }
    }
    final meta = data['meta'] ?? data;
    return NotificationListResult(
      notifications: notifications,
      currentPage: meta['current_page'] ?? page,
      lastPage: meta['last_page'] ?? 1,
      unreadCount: data['unread_count'] ?? 0,
    );
  }

  /// Get single notification — GET /member/notifications/{id}
  Future<AppNotification?> getNotification(String id) async {
    final response = await _api.get('/member/notifications/$id');
    final data = response.data;
    final notifData = data['data'] ?? data;
    if (notifData is Map<String, dynamic>) {
      return AppNotification.fromApi(notifData);
    }
    return null;
  }

  /// Mark all as read — GET /member/mark-all-as-read
  Future<void> markAllAsRead() async {
    await _api.get('/member/mark-all-as-read');
  }
}

class NotificationListResult {
  final List<AppNotification> notifications;
  final int currentPage;
  final int lastPage;
  final int unreadCount;

  const NotificationListResult({
    this.notifications = const [],
    this.currentPage = 1,
    this.lastPage = 1,
    this.unreadCount = 0,
  });
}
