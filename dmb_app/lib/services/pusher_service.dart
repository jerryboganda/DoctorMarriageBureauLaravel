/// PusherService — stubbed for web build.
/// pusher_channels_flutter is disabled in pubspec.yaml for web compatibility.
/// Re-enable the dependency and uncomment the implementation for mobile builds.
library pusher_service;

class PusherService {
  static final PusherService _instance = PusherService._();
  factory PusherService() => _instance;
  PusherService._();

  bool _initialized = false;

  Future<void> init(String authToken) async {
    // Stub: no-op for web build
    _initialized = true;
  }

  Future<void> subscribeToPrivateChannel(String channelName) async {
    // Stub: use polling fallback on web
  }

  void bindEvent(String channelName, String eventName,
      void Function(dynamic) callback) {
    // Stub
  }

  void unbindEvent(String channelName, String eventName) {
    // Stub
  }

  Future<void> unsubscribe(String channelName) async {
    // Stub
  }

  Future<void> disconnect() async {
    // Stub
  }

  void dispose() {
    // Stub
  }
}
