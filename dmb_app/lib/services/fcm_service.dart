import 'dart:io';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'api_service.dart';

/// Top-level background handler — must be a top-level function per Firebase docs.
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  // Background messages are handled by the OS notification tray by default.
}

/// Firebase Cloud Messaging service for push notifications.
class FcmService {
  // Singleton
  static final FcmService _instance = FcmService._internal();
  factory FcmService() => _instance;
  FcmService._internal();

  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  bool _initialized = false;

  bool get isInitialized => _initialized;

  /// Initialize Firebase and request notification permissions.
  Future<void> init() async {
    if (_initialized) return;

    await Firebase.initializeApp();

    // Request permissions (iOS / macOS / web — Android grants by default < 13).
    await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );

    _initialized = true;
  }

  /// Retrieve the current FCM device token.
  Future<String?> getToken() async {
    return _messaging.getToken();
  }

  /// Register the device token with the backend.
  Future<void> registerToken(ApiService api) async {
    final token = await getToken();
    if (token == null) return;

    final device = Platform.isIOS ? 'ios' : 'android';

    try {
      await api.post('/member/fcm-token', data: {
        'token': token,
        'device': device,
      });
    } catch (_) {
      // Silently fail — token registration is best-effort.
    }
  }

  /// Listen for foreground messages.
  void setupForegroundHandler(Function(RemoteMessage) onMessage) {
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      onMessage(message);
    });
  }

  /// Register the static background handler.
  void setupBackgroundHandler() {
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
  }

  /// Handle notification taps (app opened from notification).
  void setupNotificationTap(Function(RemoteMessage) onTap) {
    // When app is in background and user taps the notification:
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      onTap(message);
    });

    // When app was terminated and opened via notification:
    _messaging.getInitialMessage().then((RemoteMessage? message) {
      if (message != null) {
        onTap(message);
      }
    });
  }
}
