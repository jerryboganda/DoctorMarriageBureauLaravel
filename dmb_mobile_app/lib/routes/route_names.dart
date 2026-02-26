/// Route path constants for GoRouter navigation
class RouteNames {
  RouteNames._();

  // Auth routes
  static const String welcome = '/welcome';
  static const String authModal = '/auth';
  static const String onboardingModal = '/onboarding';

  // Main shell routes (bottom nav tabs)
  static const String dashboard = '/';
  static const String discovery = '/discovery';
  static const String messages = '/messages';
  static const String progression = '/progression';
  static const String profile = '/profile';

  // Full-screen routes (outside shell, accessed via drawer)
  static const String settings = '/settings';
  static const String notifications = '/notifications';
  static const String family = '/family';
  static const String communities = '/communities';

  // Nested routes
  static String chatDetail(String chatId) => '/messages/$chatId';

  // Dialog routes
  static const String proposalDialog = 'proposal';
  static const String declineDialog = 'decline';
  static const String matchIntelligenceDialog = 'match-intelligence';
  static const String matchTunerDialog = 'match-tuner';
  static const String subscriptionDialog = 'subscription';
  static const String paymentDialog = 'payment';
  static const String callDialog = 'call';
  static const String reportDialog = 'report';
  static const String onboardingDialog = 'onboarding';
  static const String verificationDialog = 'verification';
  static const String twoFactorDialog = 'two-factor';
}
