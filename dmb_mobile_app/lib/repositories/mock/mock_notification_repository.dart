import '../../models/models.dart';
import '../repository_interfaces.dart';

/// Mock implementation of NotificationRepository for development and testing
class MockNotificationRepository implements NotificationRepository {
  /// Mock notifications
  static final List<AppNotification> mockNotifications = [
    AppNotification(
      id: 'n1',
      type: NotificationType.match,
      title: "It's a Match!",
      body: 'You and Dr. Aditi Sharma have liked each other!',
      timestamp:
          DateTime.now().subtract(const Duration(minutes: 5)).toIso8601String(),
      isRead: false,
      avatarUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuDxXuKVKvrrNXYrG-CY1ssc7c8MM0q4JHAY75reeW_PbVx6mcGg2IWd0ZWJJdglbFYo-odqtaxEZSoEU9TDAChhZ_YgCKJmbKtlnAh_bFl1HkS5BrMhak_-V5ms913RD14CEyw6wgE1V_WqRWRfk-k0wfB0jnK_GlS_w980MpPHAm3G_IadeEXaFHmTTiI-TgRihMq1zYSIDjWu19ZqeSkDVEd-WO3R0nFXnsoYA2C3kJqb5DS0_tX8Z12bor2ZslGRfDBc2vmzuMg',
      actionUrl: '/chat/1',
    ),
    AppNotification(
      id: 'n2',
      type: NotificationType.message,
      title: 'New Message',
      body: 'Dr. Emily Chen sent you a message',
      timestamp:
          DateTime.now().subtract(const Duration(hours: 1)).toIso8601String(),
      isRead: false,
      avatarUrl:
          'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=200&h=200',
      actionUrl: '/chat/4',
    ),
    AppNotification(
      id: 'n3',
      type: NotificationType.profileView,
      title: 'Profile View',
      body: 'Dr. Raj Patel viewed your profile',
      timestamp:
          DateTime.now().subtract(const Duration(hours: 2)).toIso8601String(),
      isRead: true,
      avatarUrl:
          'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200&h=200',
    ),
    AppNotification(
      id: 'n4',
      type: NotificationType.proposal,
      title: 'New Proposal',
      body: 'Dr. Rohan Gupta has sent you a proposal',
      timestamp:
          DateTime.now().subtract(const Duration(days: 1)).toIso8601String(),
      isRead: true,
      avatarUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuCRcdeTydgcgnAttlmfU4LLL4vVkwtOHBPd6w3QatUT9cIkbpP_DjfQ9RlvwlJBVXG53Yp1hle3KRcVrHPd95u3mGIknG4fv1yYu7jStC9WvKbCY45OIF04vYYeNPPn3YkTxz1U-5VYb-dWXPjBCCod00I1VgvOH-4ifIV3k6a6jxbnxbSX7R2dWfw2t5vzM82LqXfDWPd9vHmktScUf8EMP2g38LXuffLIFPolBtqNIpOmWEaC0EoQa_hZeTAMERlO-0iWiCGVOHs',
      actionUrl: '/proposals',
    ),
    AppNotification(
      id: 'n5',
      type: NotificationType.verification,
      title: 'Verification Complete',
      body: 'Your profile has been verified successfully!',
      timestamp:
          DateTime.now().subtract(const Duration(days: 2)).toIso8601String(),
      isRead: true,
    ),
    AppNotification(
      id: 'n6',
      type: NotificationType.system,
      title: 'Profile Update',
      body: 'Your profile visibility has been updated',
      timestamp:
          DateTime.now().subtract(const Duration(days: 3)).toIso8601String(),
      isRead: true,
    ),
    AppNotification(
      id: 'n7',
      type: NotificationType.reminder,
      title: 'Complete Your Profile',
      body: 'Add more photos to get 50% more matches!',
      timestamp:
          DateTime.now().subtract(const Duration(days: 5)).toIso8601String(),
      isRead: true,
    ),
    AppNotification(
      id: 'n8',
      type: NotificationType.promotion,
      title: 'Premium Sale!',
      body: 'Get 30% off on annual subscription - Limited time offer',
      timestamp:
          DateTime.now().subtract(const Duration(days: 7)).toIso8601String(),
      isRead: true,
    ),
  ];

  final List<AppNotification> _notifications = List.from(mockNotifications);
  Map<String, bool> _settings = {
    'matches': true,
    'messages': true,
    'profileViews': true,
    'proposals': true,
    'promotions': false,
    'reminders': true,
  };

  @override
  Future<Result<List<AppNotification>>> getNotifications({
    int page = 1,
    int limit = 20,
  }) async {
    await _simulateNetworkDelay();

    final startIndex = (page - 1) * limit;
    if (startIndex >= _notifications.length) {
      return Result.success([]);
    }

    final endIndex = (startIndex + limit).clamp(0, _notifications.length);
    return Result.success(_notifications.sublist(startIndex, endIndex));
  }

  @override
  Future<Result<int>> getUnreadCount() async {
    await _simulateNetworkDelay(milliseconds: 200);

    final count = _notifications.where((n) => !n.isRead).length;
    return Result.success(count);
  }

  @override
  Future<Result<void>> markAsRead(String notificationId) async {
    await _simulateNetworkDelay(milliseconds: 300);

    final index = _notifications.indexWhere((n) => n.id == notificationId);
    if (index != -1) {
      _notifications[index] = _notifications[index].markAsRead();
    }

    return Result.success(null);
  }

  @override
  Future<Result<void>> markAllAsRead() async {
    await _simulateNetworkDelay();

    for (var i = 0; i < _notifications.length; i++) {
      _notifications[i] = _notifications[i].markAsRead();
    }

    return Result.success(null);
  }

  @override
  Future<Result<void>> deleteNotification(String notificationId) async {
    await _simulateNetworkDelay(milliseconds: 300);

    _notifications.removeWhere((n) => n.id == notificationId);
    return Result.success(null);
  }

  @override
  Future<Result<void>> deleteAllNotifications() async {
    await _simulateNetworkDelay();

    _notifications.clear();
    return Result.success(null);
  }

  @override
  Future<Result<void>> updateNotificationSettings({
    required Map<String, bool> settings,
  }) async {
    await _simulateNetworkDelay();

    _settings = {..._settings, ...settings};
    return Result.success(null);
  }

  @override
  Future<Result<Map<String, bool>>> getNotificationSettings() async {
    await _simulateNetworkDelay();
    return Result.success(Map.from(_settings));
  }

  @override
  Future<Result<void>> registerPushToken(String token) async {
    await _simulateNetworkDelay();
    // Mock token registration
    return Result.success(null);
  }

  @override
  Stream<AppNotification> streamNotifications() async* {
    // Simulate real-time notification stream
    await Future.delayed(const Duration(seconds: 5));

    yield AppNotification(
      id: 'n_stream_${DateTime.now().millisecondsSinceEpoch}',
      type: NotificationType.profileView,
      title: 'New Profile View',
      body: 'Someone viewed your profile',
      timestamp: DateTime.now().toIso8601String(),
      isRead: false,
    );
  }

  Future<void> _simulateNetworkDelay({int milliseconds = 800}) async {
    await Future.delayed(Duration(milliseconds: milliseconds));
  }
}

/// Mock implementation of ProposalRepository for development and testing
class MockProposalRepository implements ProposalRepository {
  /// Mock proposals
  static final List<Proposal> mockProposals = [
    Proposal(
      id: 'prop1',
      fromUserId: '2',
      toUserId: 'user_001',
      fromUserName: 'Dr. Rohan Gupta',
      fromUserAvatar:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuCRcdeTydgcgnAttlmfU4LLL4vVkwtOHBPd6w3QatUT9cIkbpP_DjfQ9RlvwlJBVXG53Yp1hle3KRcVrHPd95u3mGIknG4fv1yYu7jStC9WvKbCY45OIF04vYYeNPPn3YkTxz1U-5VYb-dWXPjBCCod00I1VgvOH-4ifIV3k6a6jxbnxbSX7R2dWfw2t5vzM82LqXfDWPd9vHmktScUf8EMP2g38LXuffLIFPolBtqNIpOmWEaC0EoQa_hZeTAMERlO-0iWiCGVOHs',
      fromUserSpecialty: 'MS Orthopedics - Spine Specialist',
      message:
          'Dear Dr. Kumar, I am impressed by your profile and would like to take our connection to the next level. My family is interested in arranging a formal meeting.',
      status: ProposalStatus.pending,
      createdAt:
          DateTime.now().subtract(const Duration(days: 1)).toIso8601String(),
    ),
  ];

  final List<Proposal> _receivedProposals = List.from(mockProposals);
  final List<Proposal> _sentProposals = [];

  @override
  Future<Result<Proposal>> sendProposal({
    required String toUserId,
    String? message,
  }) async {
    await _simulateNetworkDelay();

    final proposal = Proposal(
      id: 'prop_${DateTime.now().millisecondsSinceEpoch}',
      fromUserId: 'user_001',
      toUserId: toUserId,
      fromUserName: 'Dr. Rajesh Kumar',
      fromUserAvatar:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuAzaeWWENYBM2epJ60q01dnFi4yz9YiDXwYV1EcDpGsU1Z-chVQmIqfs1U7m1enVrZEgaqiAL48Wvmleo4yRa9cBGga6j-LEf-P3Ho0KsEw9xfZSyQG3wNMsUkO8ogL8vk2iDwFJm5NtbsXMNvmPodIL3nQnT0M5IGF8jTeSkGjKhPNKnO9QwlZhliJ15ahx-2B289fTui5atTjNPc5CzfxkbA2dzyZDiVpuHek_5h9OrbVpmGA-mfOhwW7KtWkAG1b2ulDY4C42bM',
      fromUserSpecialty: 'MD Gen. Medicine',
      message: message,
      status: ProposalStatus.pending,
      createdAt: DateTime.now().toIso8601String(),
    );

    _sentProposals.add(proposal);
    return Result.success(proposal);
  }

  @override
  Future<Result<List<Proposal>>> getSentProposals() async {
    await _simulateNetworkDelay();
    return Result.success(_sentProposals);
  }

  @override
  Future<Result<List<Proposal>>> getReceivedProposals() async {
    await _simulateNetworkDelay();
    return Result.success(_receivedProposals);
  }

  @override
  Future<Result<Proposal>> acceptProposal(String proposalId) async {
    await _simulateNetworkDelay();

    final index = _receivedProposals.indexWhere((p) => p.id == proposalId);
    if (index == -1) {
      return Result.failure('Proposal not found');
    }

    final updatedProposal = _receivedProposals[index].copyWith(
      status: ProposalStatus.accepted,
      respondedAt: DateTime.now().toIso8601String(),
    );
    _receivedProposals[index] = updatedProposal;

    return Result.success(updatedProposal);
  }

  @override
  Future<Result<Proposal>> declineProposal({
    required String proposalId,
    String? reason,
  }) async {
    await _simulateNetworkDelay();

    final index = _receivedProposals.indexWhere((p) => p.id == proposalId);
    if (index == -1) {
      return Result.failure('Proposal not found');
    }

    final updatedProposal = _receivedProposals[index].copyWith(
      status: ProposalStatus.declined,
      respondedAt: DateTime.now().toIso8601String(),
      declineReason: reason,
    );
    _receivedProposals[index] = updatedProposal;

    return Result.success(updatedProposal);
  }

  @override
  Future<Result<void>> withdrawProposal(String proposalId) async {
    await _simulateNetworkDelay();

    final index = _sentProposals.indexWhere((p) => p.id == proposalId);
    if (index == -1) {
      return Result.failure('Proposal not found');
    }

    _sentProposals[index] = _sentProposals[index].copyWith(
      status: ProposalStatus.withdrawn,
    );

    return Result.success(null);
  }

  @override
  Future<Result<Proposal>> getProposalById(String proposalId) async {
    await _simulateNetworkDelay(milliseconds: 400);

    final allProposals = [..._receivedProposals, ..._sentProposals];
    final proposal = allProposals.firstWhere(
      (p) => p.id == proposalId,
      orElse: () => Proposal(
        id: '',
        fromUserId: '',
        toUserId: '',
        fromUserName: '',
        fromUserAvatar: '',
        fromUserSpecialty: '',
        status: ProposalStatus.pending,
        createdAt: '',
      ),
    );

    if (proposal.id.isEmpty) {
      return Result.failure('Proposal not found');
    }

    return Result.success(proposal);
  }

  Future<void> _simulateNetworkDelay({int milliseconds = 800}) async {
    await Future.delayed(Duration(milliseconds: milliseconds));
  }
}

/// Mock implementation of SubscriptionRepository for development and testing
class MockSubscriptionRepository implements SubscriptionRepository {
  /// Mock subscription plans
  static final List<SubscriptionPlan> mockPlans = [
    SubscriptionPlan(
      id: 'basic',
      name: 'Basic',
      description: 'Get started with essential features',
      monthlyPrice: 0,
      quarterlyPrice: 0,
      yearlyPrice: 0,
      features: [
        'Browse profiles',
        'Send 5 likes per day',
        'Basic filters',
        'Limited messaging',
      ],
    ),
    SubscriptionPlan(
      id: 'premium',
      name: 'Premium',
      description: 'Unlock the full dating experience',
      monthlyPrice: 999,
      quarterlyPrice: 2499,
      yearlyPrice: 7999,
      features: [
        'Unlimited likes',
        'Unlimited messaging',
        'See who liked you',
        'Advanced filters',
        'Priority support',
        'Profile boost (1/month)',
        'Read receipts',
      ],
      isPopular: true,
      badge: 'Most Popular',
    ),
    SubscriptionPlan(
      id: 'elite',
      name: 'Elite',
      description: 'Premium + Personal matchmaking',
      monthlyPrice: 2999,
      quarterlyPrice: 7999,
      yearlyPrice: 24999,
      features: [
        'All Premium features',
        'Personal matchmaker',
        'Verified badge',
        'Background verification',
        'Family portal access',
        'Video call feature',
        'Profile boost (5/month)',
        'Priority listing',
      ],
      isPremium: true,
      badge: 'Best Value',
    ),
  ];

  SubscriptionPlan? _currentSubscription;
  List<Map<String, dynamic>> _paymentMethods = [
    {
      'id': 'pm_1',
      'type': 'card',
      'last4': '4242',
      'brand': 'Visa',
      'expiryMonth': 12,
      'expiryYear': 2025,
      'isDefault': true,
    },
  ];

  @override
  Future<Result<List<SubscriptionPlan>>> getPlans() async {
    await _simulateNetworkDelay();
    return Result.success(mockPlans);
  }

  @override
  Future<Result<SubscriptionPlan?>> getCurrentSubscription() async {
    await _simulateNetworkDelay();
    return Result.success(_currentSubscription);
  }

  @override
  Future<Result<void>> subscribe({
    required String planId,
    required BillingCycle cycle,
    required String paymentMethodId,
  }) async {
    await _simulateNetworkDelay(milliseconds: 1500);

    final plan = mockPlans.firstWhere(
      (p) => p.id == planId,
      orElse: () => SubscriptionPlan(
        id: '',
        name: '',
        description: '',
        monthlyPrice: 0,
        quarterlyPrice: 0,
        yearlyPrice: 0,
        features: [],
      ),
    );

    if (plan.id.isEmpty) {
      return Result.failure('Plan not found');
    }

    _currentSubscription = plan;
    return Result.success(null);
  }

  @override
  Future<Result<void>> cancelSubscription() async {
    await _simulateNetworkDelay();

    _currentSubscription = null;
    return Result.success(null);
  }

  @override
  Future<Result<void>> changePlan({
    required String newPlanId,
  }) async {
    await _simulateNetworkDelay();

    final plan = mockPlans.firstWhere(
      (p) => p.id == newPlanId,
      orElse: () => SubscriptionPlan(
        id: '',
        name: '',
        description: '',
        monthlyPrice: 0,
        quarterlyPrice: 0,
        yearlyPrice: 0,
        features: [],
      ),
    );

    if (plan.id.isEmpty) {
      return Result.failure('Plan not found');
    }

    _currentSubscription = plan;
    return Result.success(null);
  }

  @override
  Future<Result<List<Map<String, dynamic>>>> getPaymentHistory() async {
    await _simulateNetworkDelay();

    return Result.success([
      {
        'id': 'pay_1',
        'amount': 7999,
        'currency': 'INR',
        'status': 'succeeded',
        'planName': 'Premium Yearly',
        'date':
            DateTime.now().subtract(const Duration(days: 30)).toIso8601String(),
      },
      {
        'id': 'pay_2',
        'amount': 999,
        'currency': 'INR',
        'status': 'succeeded',
        'planName': 'Premium Monthly',
        'date':
            DateTime.now().subtract(const Duration(days: 60)).toIso8601String(),
      },
    ]);
  }

  @override
  Future<Result<String>> addPaymentMethod({
    required Map<String, dynamic> paymentDetails,
  }) async {
    await _simulateNetworkDelay();

    final methodId = 'pm_${DateTime.now().millisecondsSinceEpoch}';
    _paymentMethods.add({
      'id': methodId,
      ...paymentDetails,
      'isDefault': false,
    });

    return Result.success(methodId);
  }

  @override
  Future<Result<void>> removePaymentMethod(String paymentMethodId) async {
    await _simulateNetworkDelay();

    _paymentMethods.removeWhere((m) => m['id'] == paymentMethodId);
    return Result.success(null);
  }

  @override
  Future<Result<List<Map<String, dynamic>>>> getPaymentMethods() async {
    await _simulateNetworkDelay();
    return Result.success(List.from(_paymentMethods));
  }

  @override
  Future<Result<Map<String, dynamic>>> applyPromoCode(String code) async {
    await _simulateNetworkDelay();

    // Mock promo codes
    final promoCodes = {
      'WELCOME20': {
        'discount': 20,
        'type': 'percent',
        'description': '20% off first subscription'
      },
      'PREMIUM50': {
        'discount': 50,
        'type': 'percent',
        'description': '50% off premium plan'
      },
      'FLAT500': {'discount': 500, 'type': 'fixed', 'description': '₹500 off'},
    };

    if (promoCodes.containsKey(code.toUpperCase())) {
      return Result.success(promoCodes[code.toUpperCase()]!);
    }

    return Result.failure('Invalid promo code');
  }

  Future<void> _simulateNetworkDelay({int milliseconds = 800}) async {
    await Future.delayed(Duration(milliseconds: milliseconds));
  }
}
