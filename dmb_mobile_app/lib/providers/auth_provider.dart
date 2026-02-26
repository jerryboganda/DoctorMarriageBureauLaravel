import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/models.dart';
import '../repositories/repositories.dart';
import 'repository_providers.dart';

/// Authentication state
enum AuthStatus {
  initial,
  loading,
  authenticated,
  unauthenticated,
  error,
}

/// Auth state model
class AuthState {
  final AuthStatus status;
  final User? user;
  final String? error;

  const AuthState({
    this.status = AuthStatus.initial,
    this.user,
    this.error,
  });

  AuthState copyWith({
    AuthStatus? status,
    User? user,
    String? error,
  }) {
    return AuthState(
      status: status ?? this.status,
      user: user ?? this.user,
      error: error,
    );
  }

  bool get isAuthenticated => status == AuthStatus.authenticated;
  bool get isLoading => status == AuthStatus.loading;
}

/// Auth notifier - manages authentication state
/// Transpiled from React: multiple useState hooks in App.tsx related to auth
class AuthNotifier extends StateNotifier<AuthState> {
  final AuthRepository _authRepository;

  AuthNotifier(this._authRepository) : super(const AuthState()) {
    _checkAuthStatus();
  }

  /// Check if user is already authenticated on app start
  Future<void> _checkAuthStatus() async {
    state = state.copyWith(status: AuthStatus.loading);

    final isAuthed = await _authRepository.isAuthenticated();
    if (isAuthed) {
      final result = await _authRepository.getCurrentUser();
      result.fold(
        onSuccess: (user) {
          state = state.copyWith(
            status: user != null
                ? AuthStatus.authenticated
                : AuthStatus.unauthenticated,
            user: user,
          );
        },
        onFailure: (error) {
          state = state.copyWith(
            status: AuthStatus.unauthenticated,
            error: error,
          );
        },
      );
    } else {
      state = state.copyWith(status: AuthStatus.unauthenticated);
    }
  }

  /// Sign in with email and password
  Future<bool> signIn({
    required String email,
    required String password,
  }) async {
    state = state.copyWith(status: AuthStatus.loading);

    final result = await _authRepository.signIn(
      email: email,
      password: password,
    );

    return result.fold(
      onSuccess: (user) {
        state = state.copyWith(
          status: AuthStatus.authenticated,
          user: user,
        );
        return true;
      },
      onFailure: (error) {
        state = state.copyWith(
          status: AuthStatus.error,
          error: error,
        );
        return false;
      },
    );
  }

  /// Sign in with phone number (request OTP)
  Future<bool> signInWithPhone(String phoneNumber) async {
    state = state.copyWith(status: AuthStatus.loading);

    final result = await _authRepository.signInWithPhone(
      phoneNumber: phoneNumber,
    );

    return result.fold(
      onSuccess: (_) {
        state = state.copyWith(status: AuthStatus.unauthenticated);
        return true;
      },
      onFailure: (error) {
        state = state.copyWith(
          status: AuthStatus.error,
          error: error,
        );
        return false;
      },
    );
  }

  /// Verify OTP code
  Future<bool> verifyOtp({
    required String phoneNumber,
    required String otp,
  }) async {
    state = state.copyWith(status: AuthStatus.loading);

    final result = await _authRepository.verifyOtp(
      phoneNumber: phoneNumber,
      otp: otp,
    );

    return result.fold(
      onSuccess: (user) {
        state = state.copyWith(
          status: AuthStatus.authenticated,
          user: user,
        );
        return true;
      },
      onFailure: (error) {
        state = state.copyWith(
          status: AuthStatus.error,
          error: error,
        );
        return false;
      },
    );
  }

  /// Register a new user
  Future<bool> register({
    required String email,
    required String password,
    required String fullName,
    required String phoneNumber,
  }) async {
    state = state.copyWith(status: AuthStatus.loading);

    final result = await _authRepository.register(
      email: email,
      password: password,
      fullName: fullName,
      phoneNumber: phoneNumber,
    );

    return result.fold(
      onSuccess: (user) {
        state = state.copyWith(
          status: AuthStatus.authenticated,
          user: user,
        );
        return true;
      },
      onFailure: (error) {
        state = state.copyWith(
          status: AuthStatus.error,
          error: error,
        );
        return false;
      },
    );
  }

  /// Sign out
  Future<void> signOut() async {
    state = state.copyWith(status: AuthStatus.loading);

    await _authRepository.signOut();
    state = const AuthState(status: AuthStatus.unauthenticated);
  }

  /// Update user profile
  Future<bool> updateProfile(User user) async {
    final result = await _authRepository.updateProfile(user: user);

    return result.fold(
      onSuccess: (updatedUser) {
        state = state.copyWith(user: updatedUser);
        return true;
      },
      onFailure: (error) {
        state = state.copyWith(error: error);
        return false;
      },
    );
  }

  /// Clear error
  void clearError() {
    state = state.copyWith(error: null);
  }

  /// Request password reset
  Future<bool> requestPasswordReset(String email) async {
    final result = await _authRepository.requestPasswordReset(email: email);
    return result.isSuccess;
  }
}

/// Auth state provider
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final authRepository = ref.watch(authRepositoryProvider);
  return AuthNotifier(authRepository);
});

/// Auth state provider alias - for router access
/// This provides direct access to the AuthState without the notifier
final authStateProvider = Provider<AuthState>((ref) {
  return ref.watch(authProvider);
});

/// Current user provider - convenience provider
final currentUserProvider = Provider<User?>((ref) {
  return ref.watch(authProvider).user;
});

/// Is authenticated provider
final isAuthenticatedProvider = Provider<bool>((ref) {
  return ref.watch(authProvider).isAuthenticated;
});
