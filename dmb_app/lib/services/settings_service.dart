import 'api_service.dart';

/// Account security and settings service — 2FA, devices, support, deactivation.
class SettingsService {
  final ApiService _api;

  SettingsService(this._api);

  // ── Profile settings ──

  /// Get profile settings — GET /member/profile-settings
  Future<Map<String, dynamic>> getProfileSettings() async {
    final response = await _api.get('/member/profile-settings');
    return response.data is Map<String, dynamic> ? response.data : {};
  }

  // ── Two-factor authentication ──

  /// Set up 2FA — POST /auth/2fa/setup
  Future<Map<String, dynamic>> setup2FA(String method) async {
    final response = await _api.post('/auth/2fa/setup', data: {
      'method': method,
    });
    return response.data is Map<String, dynamic> ? response.data : {};
  }

  /// Verify 2FA setup — POST /auth/2fa/verify
  Future<Map<String, dynamic>> verify2FA(String code) async {
    final response = await _api.post('/auth/2fa/verify', data: {
      'code': code,
    });
    return response.data is Map<String, dynamic> ? response.data : {};
  }

  /// Disable 2FA — POST /auth/2fa/disable
  Future<Map<String, dynamic>> disable2FA() async {
    final response = await _api.post('/auth/2fa/disable');
    return response.data is Map<String, dynamic> ? response.data : {};
  }

  /// Challenge 2FA (during login flow) — POST /auth/2fa/challenge
  Future<Map<String, dynamic>> challenge2FA(String code) async {
    final response = await _api.post('/auth/2fa/challenge', data: {
      'code': code,
    });
    return response.data is Map<String, dynamic> ? response.data : {};
  }

  // ── Device management ──

  /// Get logged-in devices — GET /member/devices
  Future<List<Map<String, dynamic>>> getDevices() async {
    final response = await _api.get('/member/devices');
    final data = response.data;
    final list = data['data'] ?? data;
    if (list is List) {
      return list.cast<Map<String, dynamic>>();
    }
    return [];
  }

  /// Remove a device session — DELETE /member/device/{id}
  Future<Map<String, dynamic>> removeDevice(int id) async {
    final response = await _api.delete('/member/device/$id');
    return response.data is Map<String, dynamic> ? response.data : {};
  }

  // ── Account actions ──

  /// Deactivate account — POST /member/deactivate
  Future<Map<String, dynamic>> deactivateAccount(String reason) async {
    final response = await _api.post('/member/deactivate', data: {
      'reason': reason,
    });
    return response.data is Map<String, dynamic> ? response.data : {};
  }

  /// Delete account permanently — POST /member/delete-account
  Future<Map<String, dynamic>> deleteAccount(String password) async {
    final response = await _api.post('/member/delete-account', data: {
      'password': password,
    });
    return response.data is Map<String, dynamic> ? response.data : {};
  }

  // ── Notification preferences ──

  /// Update notification preferences — POST /member/notification-preferences
  Future<Map<String, dynamic>> updateNotificationPreferences(
    Map<String, dynamic> prefs,
  ) async {
    final response = await _api.post('/member/notification-preferences', data: prefs);
    return response.data is Map<String, dynamic> ? response.data : {};
  }

  // ── Support tickets ──

  /// Get support tickets — GET /member/support-ticket
  Future<List<Map<String, dynamic>>> getSupportTickets() async {
    final response = await _api.get('/member/support-ticket');
    final data = response.data;
    final list = data['data'] ?? data;
    if (list is List) {
      return list.cast<Map<String, dynamic>>();
    }
    return [];
  }

  /// Create a support ticket — POST /member/support-ticket
  Future<Map<String, dynamic>> createSupportTicket(
    String category,
    String subject,
    String message,
  ) async {
    final response = await _api.post('/member/support-ticket', data: {
      'category': category,
      'subject': subject,
      'message': message,
    });
    return response.data is Map<String, dynamic> ? response.data : {};
  }

  /// Get support ticket categories — GET /member/support-ticket/categories
  Future<List<Map<String, dynamic>>> getSupportCategories() async {
    final response = await _api.get('/member/support-ticket/categories');
    final data = response.data;
    final list = data['data'] ?? data;
    if (list is List) {
      return list.cast<Map<String, dynamic>>();
    }
    return [];
  }

  /// Reply to a support ticket — POST /member/ticket-reply
  Future<Map<String, dynamic>> replyToTicket(int ticketId, String message) async {
    final response = await _api.post('/member/ticket-reply', data: {
      'ticket_id': ticketId,
      'message': message,
    });
    return response.data is Map<String, dynamic> ? response.data : {};
  }
}
