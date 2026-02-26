import '../models/models.dart';

/// Result wrapper for repository operations
/// Provides type-safe error handling without exceptions
class Result<T> {
  final T? data;
  final String? error;
  final bool isSuccess;

  const Result._({
    this.data,
    this.error,
    required this.isSuccess,
  });

  factory Result.success(T data) {
    return Result._(data: data, isSuccess: true);
  }

  factory Result.failure(String error) {
    return Result._(error: error, isSuccess: false);
  }

  /// Map success value to another type
  Result<R> map<R>(R Function(T data) mapper) {
    if (isSuccess && data != null) {
      return Result.success(mapper(data as T));
    }
    return Result.failure(error ?? 'Unknown error');
  }

  /// Handle both success and failure cases
  R fold<R>({
    required R Function(T data) onSuccess,
    required R Function(String error) onFailure,
  }) {
    if (isSuccess && data != null) {
      return onSuccess(data as T);
    }
    return onFailure(error ?? 'Unknown error');
  }

  /// Get data or throw
  T getOrThrow() {
    if (isSuccess && data != null) {
      return data as T;
    }
    throw Exception(error ?? 'Unknown error');
  }

  /// Get data or default value
  T getOrElse(T defaultValue) {
    if (isSuccess && data != null) {
      return data as T;
    }
    return defaultValue;
  }
}

/// Authentication repository interface
/// Handles user authentication, registration, and session management
abstract class AuthRepository {
  /// Sign in with email and password
  Future<Result<User>> signIn({
    required String email,
    required String password,
  });

  /// Sign in with phone number (OTP)
  Future<Result<void>> signInWithPhone({
    required String phoneNumber,
  });

  /// Verify OTP code
  Future<Result<User>> verifyOtp({
    required String phoneNumber,
    required String otp,
  });

  /// Register a new user
  Future<Result<User>> register({
    required String email,
    required String password,
    required String fullName,
    required String phoneNumber,
  });

  /// Sign out current user
  Future<Result<void>> signOut();

  /// Get current user
  Future<Result<User?>> getCurrentUser();

  /// Check if user is authenticated
  Future<bool> isAuthenticated();

  /// Refresh authentication token
  Future<Result<String>> refreshToken();

  /// Request password reset
  Future<Result<void>> requestPasswordReset({
    required String email,
  });

  /// Reset password with token
  Future<Result<void>> resetPassword({
    required String token,
    required String newPassword,
  });

  /// Enable two-factor authentication
  Future<Result<String>> enableTwoFactor();

  /// Verify two-factor code
  Future<Result<void>> verifyTwoFactor({
    required String code,
  });

  /// Update user profile
  Future<Result<User>> updateProfile({
    required User user,
  });

  /// Upload profile photo
  Future<Result<String>> uploadProfilePhoto({
    required String filePath,
  });

  /// Delete account
  Future<Result<void>> deleteAccount({
    required String password,
  });
}

/// Profile repository interface
/// Handles profile discovery, matching, and preferences
abstract class ProfileRepository {
  /// Get discovery profiles
  Future<Result<List<ProfileMatch>>> getDiscoveryProfiles({
    int page = 1,
    int limit = 10,
    Map<String, dynamic>? filters,
  });

  /// Get profile by ID
  Future<Result<ProfileMatch>> getProfileById(String id);

  /// Get user's matches
  Future<Result<List<ProfileMatch>>> getMatches({
    int page = 1,
    int limit = 20,
  });

  /// Like a profile
  Future<Result<void>> likeProfile(String profileId);

  /// Super like a profile
  Future<Result<void>> superLikeProfile(String profileId);

  /// Pass on a profile
  Future<Result<void>> passProfile(String profileId);

  /// Undo last action
  Future<Result<void>> undoLastAction();

  /// Get match intelligence for a profile
  Future<Result<MatchIntelligence>> getMatchIntelligence(String profileId);

  /// Update match preferences
  Future<Result<void>> updateMatchPreferences({
    required Map<String, dynamic> preferences,
  });

  /// Get match preferences
  Future<Result<Map<String, dynamic>>> getMatchPreferences();

  /// Report a profile
  Future<Result<void>> reportProfile({
    required String profileId,
    required String reason,
    String? details,
  });

  /// Block a profile
  Future<Result<void>> blockProfile(String profileId);

  /// Unblock a profile
  Future<Result<void>> unblockProfile(String profileId);

  /// Get blocked profiles
  Future<Result<List<ProfileMatch>>> getBlockedProfiles();

  /// Get who liked you (premium feature)
  Future<Result<List<ProfileMatch>>> getWhoLikedYou();

  /// Boost profile visibility
  Future<Result<void>> boostProfile();
}

/// Chat repository interface
/// Handles messaging, conversations, and real-time communication
abstract class ChatRepository {
  /// Get all chats
  Future<Result<List<Chat>>> getChats({
    int page = 1,
    int limit = 20,
  });

  /// Get chat by ID
  Future<Result<Chat>> getChatById(String id);

  /// Get or create chat with user
  Future<Result<Chat>> getOrCreateChat(String userId);

  /// Get messages for a chat
  Future<Result<List<Message>>> getMessages({
    required String chatId,
    int page = 1,
    int limit = 50,
  });

  /// Send a text message
  Future<Result<Message>> sendMessage({
    required String chatId,
    required String content,
    MessageType type = MessageType.text,
  });

  /// Send an image message
  Future<Result<Message>> sendImageMessage({
    required String chatId,
    required String imagePath,
  });

  /// Mark messages as read
  Future<Result<void>> markAsRead(String chatId);

  /// Delete a message
  Future<Result<void>> deleteMessage({
    required String chatId,
    required String messageId,
  });

  /// Delete entire chat
  Future<Result<void>> deleteChat(String chatId);

  /// Mute chat notifications
  Future<Result<void>> muteChat({
    required String chatId,
    required Duration duration,
  });

  /// Unmute chat
  Future<Result<void>> unmuteChat(String chatId);

  /// Get unread count
  Future<Result<int>> getUnreadCount();

  /// Stream messages for real-time updates
  Stream<Message> streamMessages(String chatId);

  /// Stream typing indicator
  Stream<bool> streamTypingIndicator(String chatId);

  /// Send typing indicator
  Future<void> sendTypingIndicator(String chatId);

  /// Initiate video call
  Future<Result<String>> initiateVideoCall(String chatId);

  /// Initiate voice call
  Future<Result<String>> initiateVoiceCall(String chatId);
}

/// Notification repository interface
/// Handles push notifications and in-app notifications
abstract class NotificationRepository {
  /// Get all notifications
  Future<Result<List<AppNotification>>> getNotifications({
    int page = 1,
    int limit = 20,
  });

  /// Get unread notification count
  Future<Result<int>> getUnreadCount();

  /// Mark notification as read
  Future<Result<void>> markAsRead(String notificationId);

  /// Mark all notifications as read
  Future<Result<void>> markAllAsRead();

  /// Delete a notification
  Future<Result<void>> deleteNotification(String notificationId);

  /// Delete all notifications
  Future<Result<void>> deleteAllNotifications();

  /// Update notification settings
  Future<Result<void>> updateNotificationSettings({
    required Map<String, bool> settings,
  });

  /// Get notification settings
  Future<Result<Map<String, bool>>> getNotificationSettings();

  /// Register push token
  Future<Result<void>> registerPushToken(String token);

  /// Stream real-time notifications
  Stream<AppNotification> streamNotifications();
}

/// Proposal repository interface
/// Handles marriage proposals and family portal features
abstract class ProposalRepository {
  /// Send a proposal
  Future<Result<Proposal>> sendProposal({
    required String toUserId,
    String? message,
  });

  /// Get sent proposals
  Future<Result<List<Proposal>>> getSentProposals();

  /// Get received proposals
  Future<Result<List<Proposal>>> getReceivedProposals();

  /// Accept a proposal
  Future<Result<Proposal>> acceptProposal(String proposalId);

  /// Decline a proposal
  Future<Result<Proposal>> declineProposal({
    required String proposalId,
    String? reason,
  });

  /// Withdraw a proposal
  Future<Result<void>> withdrawProposal(String proposalId);

  /// Get proposal by ID
  Future<Result<Proposal>> getProposalById(String proposalId);
}

/// Subscription repository interface
/// Handles subscription plans, payments, and premium features
abstract class SubscriptionRepository {
  /// Get available subscription plans
  Future<Result<List<SubscriptionPlan>>> getPlans();

  /// Get current subscription
  Future<Result<SubscriptionPlan?>> getCurrentSubscription();

  /// Subscribe to a plan
  Future<Result<void>> subscribe({
    required String planId,
    required BillingCycle cycle,
    required String paymentMethodId,
  });

  /// Cancel subscription
  Future<Result<void>> cancelSubscription();

  /// Change subscription plan
  Future<Result<void>> changePlan({
    required String newPlanId,
  });

  /// Get payment history
  Future<Result<List<Map<String, dynamic>>>> getPaymentHistory();

  /// Add payment method
  Future<Result<String>> addPaymentMethod({
    required Map<String, dynamic> paymentDetails,
  });

  /// Remove payment method
  Future<Result<void>> removePaymentMethod(String paymentMethodId);

  /// Get saved payment methods
  Future<Result<List<Map<String, dynamic>>>> getPaymentMethods();

  /// Apply promo code
  Future<Result<Map<String, dynamic>>> applyPromoCode(String code);
}
