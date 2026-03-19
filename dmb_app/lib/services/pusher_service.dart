import 'package:pusher_channels_flutter/pusher_channels_flutter.dart';
import '../config/api_config.dart';
import '../config/constants.dart';

/// Real-time WebSocket service using Pusher Channels.
///
/// Channel patterns:
///   private-user.chat.{userId}     → thread updates
///   private-chat.{chatId}          → message events
///   private-notifications.{userId} → notification events
class PusherService {
  // Singleton
  static final PusherService _instance = PusherService._internal();
  factory PusherService() => _instance;
  PusherService._internal();

  late PusherChannelsFlutter _pusher;
  bool _initialized = false;
  final Map<String, Function> _eventHandlers = {};

  bool get isInitialized => _initialized;

  /// Initialize Pusher with the user's auth token for private channel auth.
  Future<void> init(String authToken) async {
    if (_initialized) return;

    _pusher = PusherChannelsFlutter.getInstance();

    await _pusher.init(
      apiKey: AppConstants.pusherAppKey,
      cluster: AppConstants.pusherCluster,
      authEndPoint: '${ApiConfig.baseHost}/broadcasting/auth',
      authParams: {
        'headers': {
          'Authorization': 'Bearer $authToken',
          'Accept': 'application/json',
        },
      },
      onConnectionStateChange: _onConnectionStateChange,
      onError: _onError,
      onSubscriptionSucceeded: _onSubscriptionSucceeded,
      onEvent: _onEvent,
    );

    await _pusher.connect();
    _initialized = true;
  }

  /// Subscribe to a private channel (prefixed automatically).
  Future<void> subscribeToPrivateChannel(String channelName) async {
    if (!_initialized) return;
    await _pusher.subscribe(channelName: 'private-$channelName');
  }

  /// Bind an event handler to a specific channel and event.
  void bindEvent(
    String channelName,
    String eventName,
    Function(dynamic) callback,
  ) {
    final key = 'private-$channelName:$eventName';
    _eventHandlers[key] = callback;
  }

  /// Unbind an event handler.
  void unbindEvent(String channelName, String eventName) {
    final key = 'private-$channelName:$eventName';
    _eventHandlers.remove(key);
  }

  /// Unsubscribe from a private channel.
  Future<void> unsubscribe(String channelName) async {
    if (!_initialized) return;
    await _pusher.unsubscribe(channelName: 'private-$channelName');
    // Remove all handlers for this channel
    _eventHandlers.removeWhere(
      (key, _) => key.startsWith('private-$channelName:'),
    );
  }

  /// Disconnect from Pusher entirely.
  Future<void> disconnect() async {
    if (!_initialized) return;
    await _pusher.disconnect();
    _initialized = false;
  }

  /// Cleanup all handlers and disconnect.
  Future<void> dispose() async {
    _eventHandlers.clear();
    await disconnect();
  }

  // ── Private Pusher callbacks ──

  void _onConnectionStateChange(String currentState, String previousState) {
    // Can be extended to expose connection status via a stream.
  }

  void _onError(String message, int? code, dynamic e) {
    // Can be extended with logging / analytics.
  }

  void _onSubscriptionSucceeded(String channelName, dynamic data) {
    // No-op — can be extended if needed.
  }

  void _onEvent(PusherEvent event) {
    final key = '${event.channelName}:${event.eventName}';
    final handler = _eventHandlers[key];
    if (handler != null) {
      handler(event.data);
    }
  }
}
