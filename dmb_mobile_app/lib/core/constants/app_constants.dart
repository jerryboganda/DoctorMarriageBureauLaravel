import 'package:flutter/animation.dart';

/// App Constants
/// Centralized configuration values for the DMB app
///
/// Spacing constants following 4px grid system
class AppSpacing {
  AppSpacing._();

  static const double xxs = 2.0;
  static const double xs = 4.0;
  static const double sm = 8.0;
  static const double md = 16.0;
  static const double lg = 24.0;
  static const double xl = 32.0;
  static const double xxl = 48.0;
  static const double xxxl = 64.0;
}

/// Border radius constants
class AppRadius {
  AppRadius._();

  static const double none = 0.0;
  static const double xs = 4.0;
  static const double sm = 8.0;
  static const double md = 12.0;
  static const double lg = 16.0;
  static const double xl = 24.0;
  static const double xxl = 32.0;
  static const double full = 9999.0; // Pill shape
}

/// Breakpoints for responsive design
class AppBreakpoints {
  AppBreakpoints._();

  static const double mobile = 0;
  static const double tablet = 600;
  static const double desktop = 1024;
  static const double wide = 1440;
}

/// Animation durations
class AppDurations {
  AppDurations._();

  static const Duration instant = Duration.zero;
  static const Duration fast = Duration(milliseconds: 150);
  static const Duration normal = Duration(milliseconds: 300);
  static const Duration slow = Duration(milliseconds: 500);
  static const Duration verySlow = Duration(milliseconds: 800);
}

/// Animation curves
class AppCurves {
  AppCurves._();

  static const Curve standard = Curves.easeInOut;
  static const Curve enter = Curves.easeOut;
  static const Curve exit = Curves.easeIn;
  static const Curve bounce = Curves.elasticOut;
  static const Curve spring = Curves.fastOutSlowIn;
}

/// API Endpoints (placeholder)
class ApiEndpoints {
  ApiEndpoints._();

  static const String baseUrl = 'https://api.dmb.com/v1';

  // Auth
  static const String login = '/auth/login';
  static const String logout = '/auth/logout';
  static const String verifyOtp = '/auth/verify-otp';
  static const String refreshToken = '/auth/refresh';

  // Profiles
  static const String profiles = '/profiles';
  static const String profile = '/profiles/{id}';
  static const String myProfile = '/profiles/me';

  // Matches
  static const String matches = '/matches';
  static const String matchIntelligence = '/matches/{id}/intelligence';

  // Proposals
  static const String proposals = '/proposals';
  static const String proposal = '/proposals/{id}';

  // Chats
  static const String chats = '/chats';
  static const String messages = '/chats/{id}/messages';

  // Subscriptions
  static const String subscriptions = '/subscriptions';
  static const String plans = '/subscriptions/plans';
}

/// Storage keys for local persistence
class StorageKeys {
  StorageKeys._();

  static const String accessToken = 'access_token';
  static const String refreshToken = 'refresh_token';
  static const String userId = 'user_id';
  static const String userProfile = 'user_profile';
  static const String onboardingCompleted = 'onboarding_completed';
  static const String themeMode = 'theme_mode';
  static const String notificationsEnabled = 'notifications_enabled';
  static const String biometricsEnabled = 'biometrics_enabled';
}

/// App metadata
class AppInfo {
  AppInfo._();

  static const String appName = 'DMB';
  static const String fullName = 'Doctor Marriage Bureau';
  static const String tagline = 'Find Your Perfect Match';
  static const String version = '1.0.0';
  static const String buildNumber = '1';

  // Support
  static const String supportEmail = 'support@dmb.com';
  static const String privacyPolicyUrl = 'https://dmb.com/privacy';
  static const String termsOfServiceUrl = 'https://dmb.com/terms';
}

/// Validation constants
class ValidationConstants {
  ValidationConstants._();

  static const int minPasswordLength = 8;
  static const int maxPasswordLength = 128;
  static const int otpLength = 6;
  static const int phoneNumberLength = 10;
  static const int maxBioLength = 500;
  static const int minAge = 18;
  static const int maxAge = 80;
}

/// Asset paths
class AssetPaths {
  AssetPaths._();

  static const String images = 'assets/images';
  static const String icons = 'assets/icons';
  static const String fonts = 'assets/fonts';

  // Specific assets
  static const String logo = '$images/logo.png';
  static const String logoWhite = '$images/logo_white.png';
  static const String onboarding1 = '$images/onboarding_1.png';
  static const String onboarding2 = '$images/onboarding_2.png';
  static const String onboarding3 = '$images/onboarding_3.png';
  static const String placeholderAvatar = '$images/placeholder_avatar.png';
  static const String emptyState = '$images/empty_state.png';
  static const String errorState = '$images/error_state.png';
}
