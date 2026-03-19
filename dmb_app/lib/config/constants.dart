class AppConstants {
  // Pusher config
  static const String pusherAppKey = '';  // Set from environment
  static const String pusherCluster = 'ap2';

  // Google OAuth
  static const String googleClientId = '';  // Set from environment

  // Heartbeat interval
  static const Duration heartbeatInterval = Duration(minutes: 3);

  // Optimistic update TTL
  static const Duration proposalOptimisticTtl = Duration(seconds: 30);

  // Pagination
  static const int defaultPageSize = 20;

  // Image compression
  static const int maxImageWidth = 1200;
  static const int maxImageHeight = 1200;
  static const int imageQuality = 80;
}
