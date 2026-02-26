import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../repositories/repositories.dart';

/// Repository providers for dependency injection
/// These can be overridden in tests or to swap implementations

/// Auth repository provider
/// Returns mock implementation for development, swap to real API for production
final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return MockAuthRepository();
});

/// Profile repository provider
final profileRepositoryProvider = Provider<ProfileRepository>((ref) {
  return MockProfileRepository();
});

/// Chat repository provider
final chatRepositoryProvider = Provider<ChatRepository>((ref) {
  return MockChatRepository();
});

/// Notification repository provider
final notificationRepositoryProvider = Provider<NotificationRepository>((ref) {
  return MockNotificationRepository();
});

/// Proposal repository provider
final proposalRepositoryProvider = Provider<ProposalRepository>((ref) {
  return MockProposalRepository();
});

/// Subscription repository provider
final subscriptionRepositoryProvider = Provider<SubscriptionRepository>((ref) {
  return MockSubscriptionRepository();
});
