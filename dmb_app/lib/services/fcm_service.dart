/// FcmService — stubbed for web build.
/// firebase_core and firebase_messaging are disabled in pubspec.yaml for web compatibility.
/// Re-enable the dependencies and this implementation for mobile/FCM builds.
library fcm_service;

import 'api_service.dart';

class FcmService {
  static final FcmService _instance = FcmService._();
  factory FcmService() => _instance;
  FcmService._();

  Future<void> init() async {
    // Stub: Firebase not configured for web build
  }

  Future<String?> getToken() async {
    return null;
  }

  Future<void> registerToken(ApiService api) async {
    // Stub
  }

  Future<void> setupForegroundHandler(
      void Function(dynamic) onMessage) async {
    // Stub
  }

  void setupBackgroundHandler() {
    // Stub
  }

  Future<void> setupNotificationTap(
      void Function(dynamic) onTap) async {
    // Stub
  }
}
