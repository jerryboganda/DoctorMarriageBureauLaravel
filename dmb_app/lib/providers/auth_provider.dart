import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/user.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';

/// Gate states — maps GateState from App.tsx
enum GateState {
  gateLoading,
  needsOnboarding,
  needsVerification,
  verificationPending,
  gateUnlocked,
}

class AuthState {
  final User? user;
  final bool isAuthenticated;
  final bool isLoading;
  final GateState gateState;

  const AuthState({
    this.user,
    this.isAuthenticated = false,
    this.isLoading = true,
    this.gateState = GateState.gateLoading,
  });

  AuthState copyWith({
    User? user,
    bool? isAuthenticated,
    bool? isLoading,
    GateState? gateState,
  }) {
    return AuthState(
      user: user ?? this.user,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      isLoading: isLoading ?? this.isLoading,
      gateState: gateState ?? this.gateState,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthService _authService;
  final ApiService _apiService;

  AuthNotifier(this._authService, this._apiService) : super(const AuthState()) {
    // Wire up auth reset callback
    _apiService.onAuthReset = _handleAuthReset;
  }

  void _handleAuthReset() {
    state = const AuthState(
      isAuthenticated: false,
      isLoading: false,
      gateState: GateState.gateLoading,
    );
  }

  /// Check auth on app start — maps checkAuth from authStore.ts
  Future<void> checkAuth() async {
    state = state.copyWith(isLoading: true);
    final user = await _authService.checkAuth();
    if (user != null) {
      state = state.copyWith(
        user: user,
        isAuthenticated: true,
        isLoading: false,
      );
      await _resolveGateState(user);
    } else {
      state = const AuthState(isAuthenticated: false, isLoading: false);
    }
  }

  /// Resolve gate state after login/auth check
  Future<void> _resolveGateState(User user) async {
    state = state.copyWith(gateState: GateState.gateLoading);

    // Check if user needs onboarding (no profile data yet)
    if (user.approved == false && user.emailVerifiedAt == null) {
      state = state.copyWith(gateState: GateState.needsOnboarding);
      return;
    }

    // Check approval status
    try {
      final approval = await _authService.checkApproval();
      final isApproved = approval['approved'] == true || approval['approved'] == 1;
      final verificationPending = approval['verification_pending'] == true;

      if (!isApproved && !verificationPending) {
        state = state.copyWith(gateState: GateState.needsVerification);
      } else if (verificationPending) {
        state = state.copyWith(gateState: GateState.verificationPending);
      } else {
        state = state.copyWith(gateState: GateState.gateUnlocked);
      }
    } catch (_) {
      // If approval check fails, allow through
      state = state.copyWith(gateState: GateState.gateUnlocked);
    }
  }

  /// Set user after successful login/signup
  Future<void> setUser(User user) async {
    state = state.copyWith(
      user: user,
      isAuthenticated: true,
      isLoading: false,
    );
    await _resolveGateState(user);
  }

  /// Update user data (e.g., after avatar upload)
  void updateUser(User user) {
    state = state.copyWith(user: user);
  }

  /// Set gate state manually (e.g., after onboarding completion)
  void setGateState(GateState gateState) {
    state = state.copyWith(gateState: gateState);
  }

  /// Logout
  Future<void> logout() async {
    await _authService.logout();
    state = const AuthState(isAuthenticated: false, isLoading: false);
  }
}

// ── Providers ──

final apiServiceProvider = Provider<ApiService>((ref) {
  return ApiService();
});

final authServiceProvider = Provider<AuthService>((ref) {
  return AuthService(ref.read(apiServiceProvider));
});

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(
    ref.read(authServiceProvider),
    ref.read(apiServiceProvider),
  );
});
