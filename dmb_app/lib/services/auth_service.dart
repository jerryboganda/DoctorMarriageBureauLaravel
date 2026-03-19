import 'api_service.dart';
import '../models/user.dart';

/// Auth service — mirrors authStore.ts checkAuth/logout + AuthModal.tsx flows
class AuthService {
  final ApiService _api;

  AuthService(this._api);

  /// Check auth by token — maps checkAuth() from authStore.ts
  Future<User?> checkAuth() async {
    try {
      final response = await _api.get('/user-by-token');
      final data = response.data;
      // Resolve user: response can be {id:...} or {user:{id:...}}
      final userData = data is Map<String, dynamic> && data.containsKey('id')
          ? data
          : (data is Map<String, dynamic> ? data['user'] : null);
      if (userData != null && userData['id'] != null) {
        return User.fromJson(userData);
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  /// Login with email/phone + password
  Future<AuthResult> login({
    required String identifier,
    required String password,
  }) async {
    try {
      final response = await _api.post('/signin', data: {
        'email': identifier.contains('@') ? identifier : null,
        'phone': !identifier.contains('@') ? identifier : null,
        'password': password,
      });

      final data = response.data;

      // Check for 2FA challenge
      if (data['requires_2fa'] == true || data['two_factor'] == true) {
        return AuthResult(
          requires2FA: true,
          userId: data['user_id'] ?? data['id'],
          twoFactorMethod: data['method'] ?? 'email',
        );
      }

      // Success — extract token and user
      final token = data['token'] ?? data['access_token'];
      if (token != null) {
        await _api.saveToken(token.toString());
      }

      final userData = data['user'] ?? data;
      final user = userData != null && userData['id'] != null
          ? User.fromJson(userData)
          : null;

      return AuthResult(user: user, token: token?.toString());
    } catch (e) {
      return AuthResult(error: _extractError(e));
    }
  }

  /// Signup
  Future<AuthResult> signup({
    required String firstName,
    required String lastName,
    required String email,
    required String phone,
    required String password,
    required String gender,
    String? referralCode,
  }) async {
    try {
      final response = await _api.post('/signup', data: {
        'first_name': firstName,
        'last_name': lastName,
        'email': email,
        'phone': phone,
        'password': password,
        'password_confirmation': password,
        'gender': gender,
        if (referralCode != null && referralCode.isNotEmpty)
          'referral_code': referralCode,
      });

      final data = response.data;
      final token = data['token'] ?? data['access_token'];
      if (token != null) {
        await _api.saveToken(token.toString());
      }

      final userData = data['user'] ?? data;
      final user = userData != null && userData['id'] != null
          ? User.fromJson(userData)
          : null;

      return AuthResult(
        user: user,
        token: token?.toString(),
        message: data['message'],
      );
    } catch (e) {
      return AuthResult(error: _extractError(e));
    }
  }

  /// Social login (Google/Facebook)
  Future<AuthResult> socialLogin({
    required String provider, // 'google' or 'facebook'
    required String token,
  }) async {
    try {
      final response = await _api.post('/social-login', data: {
        'social_provider': provider,
        'token': token,
      });

      final data = response.data;
      final authToken = data['token'] ?? data['access_token'];
      if (authToken != null) {
        await _api.saveToken(authToken.toString());
      }

      final userData = data['user'] ?? data;
      final user = userData != null && userData['id'] != null
          ? User.fromJson(userData)
          : null;

      return AuthResult(user: user, token: authToken?.toString());
    } catch (e) {
      return AuthResult(error: _extractError(e));
    }
  }

  /// Verify OTP (email or phone)
  Future<AuthResult> verifyEmailCode({
    required String email,
    required String code,
  }) async {
    try {
      final response = await _api.post('/verify-email-code', data: {
        'email': email,
        'code': code,
      });
      return AuthResult(message: response.data['message'] ?? 'Verified');
    } catch (e) {
      return AuthResult(error: _extractError(e));
    }
  }

  Future<AuthResult> verifyPhoneCode({
    required String phone,
    required String code,
  }) async {
    try {
      final response = await _api.post('/verify-phone-code', data: {
        'phone': phone,
        'code': code,
      });
      return AuthResult(message: response.data['message'] ?? 'Verified');
    } catch (e) {
      return AuthResult(error: _extractError(e));
    }
  }

  /// Send verification codes
  Future<AuthResult> sendEmailVerification(String email) async {
    try {
      final response = await _api.post('/send-email-verification', data: {
        'email': email,
      });
      return AuthResult(message: response.data['message'] ?? 'Code sent');
    } catch (e) {
      return AuthResult(error: _extractError(e));
    }
  }

  Future<AuthResult> sendPhoneVerification(String phone) async {
    try {
      final response = await _api.post('/send-phone-verification', data: {
        'phone': phone,
      });
      return AuthResult(message: response.data['message'] ?? 'Code sent');
    } catch (e) {
      return AuthResult(error: _extractError(e));
    }
  }

  /// 2FA challenge
  Future<AuthResult> verify2FA({
    required int userId,
    required String code,
  }) async {
    try {
      final response = await _api.post('/auth/2fa/challenge', data: {
        'user_id': userId,
        '2fa_code': code,
      });
      final data = response.data;
      final token = data['token'] ?? data['access_token'];
      if (token != null) {
        await _api.saveToken(token.toString());
      }
      final userData = data['user'] ?? data;
      final user = userData != null && userData['id'] != null
          ? User.fromJson(userData)
          : null;
      return AuthResult(user: user, token: token?.toString());
    } catch (e) {
      return AuthResult(error: _extractError(e));
    }
  }

  /// Forgot password
  Future<AuthResult> forgotPassword(String email) async {
    try {
      final response = await _api.post('/forgot/password', data: {
        'email': email,
      });
      return AuthResult(message: response.data['message'] ?? 'Reset code sent');
    } catch (e) {
      return AuthResult(error: _extractError(e));
    }
  }

  /// Reset password
  Future<AuthResult> resetPassword({
    required String code,
    required String password,
  }) async {
    try {
      final response = await _api.post('/reset/password', data: {
        'code': code,
        'password': password,
        'password_confirmation': password,
      });
      return AuthResult(message: response.data['message'] ?? 'Password reset');
    } catch (e) {
      return AuthResult(error: _extractError(e));
    }
  }

  /// Logout
  Future<void> logout() async {
    try {
      await _api.post('/logout');
    } finally {
      await _api.clearToken();
    }
  }

  /// Check if member is approved
  Future<Map<String, dynamic>> checkApproval() async {
    try {
      final response = await _api.get('/member/is-approved');
      return response.data is Map<String, dynamic>
          ? response.data
          : {'approved': false};
    } catch (_) {
      return {'approved': false};
    }
  }

  /// Validate referral code during signup
  Future<AuthResult> validateSignupCode(String code) async {
    try {
      final response = await _api.post('/referral/validate-signup-code', data: {
        'code': code,
      });
      return AuthResult(
        message: response.data['message'] ?? 'Valid',
        data: response.data,
      );
    } catch (e) {
      return AuthResult(error: _extractError(e));
    }
  }

  String _extractError(dynamic error) {
    if (error is Exception) {
      try {
        final dioError = error as dynamic;
        final data = dioError.response?.data;
        if (data is Map<String, dynamic>) {
          // Check for validation errors
          if (data['errors'] != null) {
            final errors = data['errors'] as Map<String, dynamic>;
            return errors.values
                .expand((v) => v is List ? v : [v])
                .join('\n');
          }
          return data['message'] ?? 'Something went wrong';
        }
      } catch (_) {}
    }
    return 'Something went wrong. Please try again.';
  }
}

class AuthResult {
  final User? user;
  final String? token;
  final String? error;
  final String? message;
  final bool requires2FA;
  final int? userId;
  final String? twoFactorMethod;
  final Map<String, dynamic>? data;

  const AuthResult({
    this.user,
    this.token,
    this.error,
    this.message,
    this.requires2FA = false,
    this.userId,
    this.twoFactorMethod,
    this.data,
  });

  bool get isSuccess => error == null;
  bool get hasUser => user != null;
}
