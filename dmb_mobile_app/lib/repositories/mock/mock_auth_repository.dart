import '../../models/models.dart';
import '../repository_interfaces.dart';

/// Mock implementation of AuthRepository for development and testing
class MockAuthRepository implements AuthRepository {
  User? _currentUser;
  bool _isAuthenticated = false;

  /// Default mock user - transpiled from React CURRENT_USER constant
  static final User mockCurrentUser = User(
    id: 'user_001',
    name: 'Dr. Rajesh Kumar',
    email: 'rajesh.kumar@example.com',
    phone: '+919876543210',
    specialty: 'MD Gen. Medicine',
    avatarUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAzaeWWENYBM2epJ60q01dnFi4yz9YiDXwYV1EcDpGsU1Z-chVQmIqfs1U7m1enVrZEgaqiAL48Wvmleo4yRa9cBGga6j-LEf-P3Ho0KsEw9xfZSyQG3wNMsUkO8ogL8vk2iDwFJm5NtbsXMNvmPodIL3nQnT0M5IGF8jTeSkGjKhPNKnO9QwlZhliJ15ahx-2B289fTui5atTjNPc5CzfxkbA2dzyZDiVpuHek_5h9OrbVpmGA-mfOhwW7KtWkAG1b2ulDY4C42bM',
    isVerified: true,
    isPremium: true,
    createdAt: '2024-01-15T10:30:00Z',
  );

  @override
  Future<Result<User>> signIn({
    required String email,
    required String password,
  }) async {
    await _simulateNetworkDelay();

    // Mock validation
    if (email.isEmpty || password.isEmpty) {
      return Result.failure('Email and password are required');
    }

    if (password.length < 6) {
      return Result.failure('Invalid credentials');
    }

    _currentUser = mockCurrentUser;
    _isAuthenticated = true;
    return Result.success(_currentUser!);
  }

  @override
  Future<Result<void>> signInWithPhone({
    required String phoneNumber,
  }) async {
    await _simulateNetworkDelay();

    if (phoneNumber.length < 10) {
      return Result.failure('Invalid phone number');
    }

    // OTP sent successfully
    return Result.success(null);
  }

  @override
  Future<Result<User>> verifyOtp({
    required String phoneNumber,
    required String otp,
  }) async {
    await _simulateNetworkDelay();

    // Mock OTP verification - accept "123456" as valid
    if (otp != '123456') {
      return Result.failure('Invalid OTP');
    }

    _currentUser = mockCurrentUser;
    _isAuthenticated = true;
    return Result.success(_currentUser!);
  }

  @override
  Future<Result<User>> register({
    required String email,
    required String password,
    required String fullName,
    required String phoneNumber,
  }) async {
    await _simulateNetworkDelay();

    if (email.isEmpty || password.isEmpty || fullName.isEmpty) {
      return Result.failure('All fields are required');
    }

    final newUser = User(
      id: 'user_new_${DateTime.now().millisecondsSinceEpoch}',
      name: fullName,
      email: email,
      phone: phoneNumber,
      isVerified: false,
      isPremium: false,
      createdAt: DateTime.now().toIso8601String(),
    );

    _currentUser = newUser;
    _isAuthenticated = true;
    return Result.success(newUser);
  }

  @override
  Future<Result<void>> signOut() async {
    await _simulateNetworkDelay(milliseconds: 300);
    _currentUser = null;
    _isAuthenticated = false;
    return Result.success(null);
  }

  @override
  Future<Result<User?>> getCurrentUser() async {
    await _simulateNetworkDelay(milliseconds: 200);
    return Result.success(_currentUser);
  }

  @override
  Future<bool> isAuthenticated() async {
    await _simulateNetworkDelay(milliseconds: 100);
    return _isAuthenticated;
  }

  @override
  Future<Result<String>> refreshToken() async {
    await _simulateNetworkDelay();
    if (!_isAuthenticated) {
      return Result.failure('Not authenticated');
    }
    return Result.success(
        'mock_token_${DateTime.now().millisecondsSinceEpoch}');
  }

  @override
  Future<Result<void>> requestPasswordReset({
    required String email,
  }) async {
    await _simulateNetworkDelay();
    if (email.isEmpty) {
      return Result.failure('Email is required');
    }
    return Result.success(null);
  }

  @override
  Future<Result<void>> resetPassword({
    required String token,
    required String newPassword,
  }) async {
    await _simulateNetworkDelay();
    if (newPassword.length < 6) {
      return Result.failure('Password must be at least 6 characters');
    }
    return Result.success(null);
  }

  @override
  Future<Result<String>> enableTwoFactor() async {
    await _simulateNetworkDelay();
    // Return mock QR code data
    return Result.success(
        'otpauth://totp/DMB:user@example.com?secret=MOCK_SECRET');
  }

  @override
  Future<Result<void>> verifyTwoFactor({
    required String code,
  }) async {
    await _simulateNetworkDelay();
    if (code.length != 6) {
      return Result.failure('Invalid code format');
    }
    return Result.success(null);
  }

  @override
  Future<Result<User>> updateProfile({
    required User user,
  }) async {
    await _simulateNetworkDelay();
    _currentUser = user;
    return Result.success(user);
  }

  @override
  Future<Result<String>> uploadProfilePhoto({
    required String filePath,
  }) async {
    await _simulateNetworkDelay(milliseconds: 1500);
    // Return mock uploaded URL
    return Result.success(
        'https://example.com/photos/${DateTime.now().millisecondsSinceEpoch}.jpg');
  }

  @override
  Future<Result<void>> deleteAccount({
    required String password,
  }) async {
    await _simulateNetworkDelay();
    if (password.isEmpty) {
      return Result.failure('Password is required');
    }
    _currentUser = null;
    _isAuthenticated = false;
    return Result.success(null);
  }

  /// Helper to simulate network delay
  Future<void> _simulateNetworkDelay({int milliseconds = 800}) async {
    await Future.delayed(Duration(milliseconds: milliseconds));
  }
}
