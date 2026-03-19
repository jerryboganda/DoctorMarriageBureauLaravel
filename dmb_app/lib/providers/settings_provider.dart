import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'auth_provider.dart';

class SettingsState {
  final Map<String, dynamic>? securityStatus;
  final List<Map<String, dynamic>> devices;
  final bool loading;
  final String? error;

  const SettingsState({
    this.securityStatus,
    this.devices = const [],
    this.loading = false,
    this.error,
  });

  SettingsState copyWith({
    Map<String, dynamic>? Function()? securityStatus,
    List<Map<String, dynamic>>? devices,
    bool? loading,
    String? error,
  }) {
    return SettingsState(
      securityStatus: securityStatus != null
          ? securityStatus()
          : this.securityStatus,
      devices: devices ?? this.devices,
      loading: loading ?? this.loading,
      error: error,
    );
  }
}

class SettingsNotifier extends StateNotifier<SettingsState> {
  final Ref _ref;

  SettingsNotifier(this._ref) : super(const SettingsState());

  /// Load security / profile settings — GET /member/profile-settings
  Future<void> loadSecurityStatus() async {
    state = state.copyWith(loading: true, error: null);

    try {
      final api = _ref.read(apiServiceProvider);
      final response = await api.get('/member/profile-settings');
      final data = response.data is Map<String, dynamic> ? response.data : {};
      state = state.copyWith(
        securityStatus: () => data,
        loading: false,
      );
    } catch (e) {
      state = state.copyWith(
        loading: false,
        error: 'Failed to load security settings',
      );
    }
  }

  /// Setup 2FA — POST /auth/2fa/setup
  Future<Map<String, dynamic>?> setup2FA(String method) async {
    state = state.copyWith(loading: true, error: null);

    try {
      final api = _ref.read(apiServiceProvider);
      final response = await api.post('/auth/2fa/setup', data: {
        'method': method,
      });
      state = state.copyWith(loading: false);
      return response.data is Map<String, dynamic> ? response.data : {};
    } catch (e) {
      state = state.copyWith(
        loading: false,
        error: 'Failed to setup 2FA',
      );
      return null;
    }
  }

  /// Verify 2FA code — POST /auth/2fa/verify
  Future<bool> verify2FA(String code) async {
    state = state.copyWith(loading: true, error: null);

    try {
      final api = _ref.read(apiServiceProvider);
      await api.post('/auth/2fa/verify', data: {
        'code': code,
      });
      // Refresh security status after verification
      await loadSecurityStatus();
      return true;
    } catch (e) {
      state = state.copyWith(
        loading: false,
        error: 'Invalid verification code',
      );
      return false;
    }
  }

  /// Disable 2FA — POST /auth/2fa/disable
  Future<bool> disable2FA() async {
    state = state.copyWith(loading: true, error: null);

    try {
      final api = _ref.read(apiServiceProvider);
      await api.post('/auth/2fa/disable');
      // Refresh security status
      await loadSecurityStatus();
      return true;
    } catch (e) {
      state = state.copyWith(
        loading: false,
        error: 'Failed to disable 2FA',
      );
      return false;
    }
  }

  /// Load logged-in devices — GET /member/devices
  Future<void> loadDevices() async {
    state = state.copyWith(loading: true, error: null);

    try {
      final api = _ref.read(apiServiceProvider);
      final response = await api.get('/member/devices');
      final data = response.data;
      final list = data['data'] ?? data;
      if (list is List) {
        state = state.copyWith(
          devices: list.cast<Map<String, dynamic>>(),
          loading: false,
        );
      } else {
        state = state.copyWith(devices: [], loading: false);
      }
    } catch (e) {
      state = state.copyWith(
        loading: false,
        error: 'Failed to load devices',
      );
    }
  }

  /// Remove a device session — DELETE /member/device/{id}
  Future<bool> removeDevice(int id) async {
    try {
      final api = _ref.read(apiServiceProvider);
      await api.delete('/member/device/$id');
      final updated = state.devices
          .where((d) => d['id'] != id)
          .toList();
      state = state.copyWith(devices: updated);
      return true;
    } catch (_) {
      state = state.copyWith(error: 'Failed to remove device');
      return false;
    }
  }

  /// Deactivate account — POST /member/deactivate
  Future<bool> deactivateAccount(String reason) async {
    state = state.copyWith(loading: true, error: null);

    try {
      final api = _ref.read(apiServiceProvider);
      await api.post('/member/deactivate', data: {
        'reason': reason,
      });
      state = state.copyWith(loading: false);
      return true;
    } catch (e) {
      state = state.copyWith(
        loading: false,
        error: 'Failed to deactivate account',
      );
      return false;
    }
  }

  /// Delete account permanently — POST /member/delete-account
  Future<bool> deleteAccount(String password) async {
    state = state.copyWith(loading: true, error: null);

    try {
      final api = _ref.read(apiServiceProvider);
      await api.post('/member/delete-account', data: {
        'password': password,
      });
      state = state.copyWith(loading: false);
      return true;
    } catch (e) {
      state = state.copyWith(
        loading: false,
        error: 'Failed to delete account',
      );
      return false;
    }
  }
}

// ── Providers ──

final settingsProvider =
    StateNotifierProvider<SettingsNotifier, SettingsState>((ref) {
  return SettingsNotifier(ref);
});
