import 'package:flutter_test/flutter_test.dart';
import 'package:dmb_mobile_app/models/models.dart';
import 'package:dmb_mobile_app/repositories/repositories.dart';

/// Phase 2: Data Layer Unit Tests
/// Tests for models, repositories, and data serialization
void main() {
  group('Phase 2: Data Layer Tests', () {
    group('User Model', () {
      test('should create user with required fields', () {
        const user = User(
          id: 'user_001',
          name: 'Dr. Rajesh Kumar',
          email: 'rajesh@example.com',
        );

        expect(user.id, 'user_001');
        expect(user.name, 'Dr. Rajesh Kumar');
        expect(user.email, 'rajesh@example.com');
        expect(user.isVerified, false);
        expect(user.isPremium, false);
      });

      test('should create user from JSON', () {
        final json = {
          'id': 'user_002',
          'name': 'Dr. Test User',
          'email': 'test@example.com',
          'phone': '+919876543210',
          'specialty': 'MD Cardiology',
          'isVerified': true,
          'isPremium': true,
        };

        final user = User.fromJson(json);

        expect(user.id, 'user_002');
        expect(user.name, 'Dr. Test User');
        expect(user.email, 'test@example.com');
        expect(user.phone, '+919876543210');
        expect(user.specialty, 'MD Cardiology');
        expect(user.isVerified, true);
        expect(user.isPremium, true);
      });

      test('should convert user to JSON', () {
        const user = User(
          id: 'user_003',
          name: 'Dr. JSON Test',
          email: 'json@example.com',
          isVerified: true,
        );

        final json = user.toJson();

        expect(json['id'], 'user_003');
        expect(json['name'], 'Dr. JSON Test');
        expect(json['email'], 'json@example.com');
        expect(json['isVerified'], true);
      });

      test('should support copyWith', () {
        const user = User(
          id: 'user_004',
          name: 'Dr. Original',
          email: 'original@example.com',
        );

        final updated = user.copyWith(name: 'Dr. Updated');

        expect(user.name, 'Dr. Original');
        expect(updated.name, 'Dr. Updated');
        expect(updated.id, user.id);
        expect(updated.email, user.email);
      });

      test('should have correct equality (Equatable)', () {
        const user1 =
            User(id: 'user_005', name: 'Dr. Equal', email: 'equal@example.com');
        const user2 =
            User(id: 'user_005', name: 'Dr. Equal', email: 'equal@example.com');
        const user3 = User(
            id: 'user_006', name: 'Dr. Different', email: 'diff@example.com');

        expect(user1, equals(user2));
        expect(user1, isNot(equals(user3)));
      });

      test('should create empty user with factory', () {
        final emptyUser = User.empty();

        expect(emptyUser.id, '');
        expect(emptyUser.name, '');
        expect(emptyUser.email, '');
      });
    });

    group('ProfileMatch Model', () {
      test('should create profile match with all fields', () {
        const profile = ProfileMatch(
          id: 'profile_001',
          name: 'Dr. Aditi Sharma',
          specialty: 'Cardiology',
          age: 29,
          matchPercentage: 98,
          isVerified: true,
        );

        expect(profile.id, 'profile_001');
        expect(profile.name, 'Dr. Aditi Sharma');
        expect(profile.specialty, 'Cardiology');
        expect(profile.age, 29);
        expect(profile.matchPercentage, 98);
        expect(profile.isVerified, true);
      });

      test('should create profile from JSON with nested objects', () {
        final json = {
          'id': 'profile_002',
          'name': 'Dr. Test Profile',
          'specialty': 'Orthopedics',
          'age': 32,
          'matchPercentage': 85,
          'education': {
            'degree': 'MS Orthopedics',
            'institution': 'AIIMS Delhi',
          },
          'career': {
            'position': 'Senior Consultant',
            'institution': 'Apollo Hospital',
            'duration': '5 Yrs',
          },
        };

        final profile = ProfileMatch.fromJson(json);

        expect(profile.id, 'profile_002');
        expect(profile.education?.degree, 'MS Orthopedics');
        expect(profile.education?.institution, 'AIIMS Delhi');
        expect(profile.career?.position, 'Senior Consultant');
        expect(profile.career?.duration, '5 Yrs');
      });

      test('should handle tags list correctly', () {
        const profile = ProfileMatch(
          id: 'profile_003',
          name: 'Dr. Tags Test',
          tags: ['Hiking', 'Music', 'Vegetarian'],
        );

        expect(profile.tags, hasLength(3));
        expect(profile.tags, contains('Hiking'));
        expect(profile.tags, contains('Music'));
      });

      test('should create empty profile with factory', () {
        final emptyProfile = ProfileMatch.empty();

        expect(emptyProfile.id, '');
        expect(emptyProfile.name, '');
        expect(emptyProfile.matchPercentage, 0);
      });
    });

    group('MatchIntelligence Model', () {
      test('should create match intelligence with categories', () {
        const intelligence = MatchIntelligence(
          totalScore: 98,
          categories: [
            MatchCategory(
                name: 'Lifestyle', score: 99, weight: MatchWeight.high),
            MatchCategory(name: 'Career', score: 95, weight: MatchWeight.high),
            MatchCategory(
                name: 'Family', score: 90, weight: MatchWeight.medium),
          ],
          mutualFit: MutualFit(youMeetThem: 95, theyMeetYou: 100),
        );

        expect(intelligence.totalScore, 98);
        expect(intelligence.categories, hasLength(3));
        expect(intelligence.mutualFit?.youMeetThem, 95);
        expect(intelligence.mutualFit?.theyMeetYou, 100);
      });

      test('should parse match weight from string', () {
        expect(MatchWeight.fromString('High'), MatchWeight.high);
        expect(MatchWeight.fromString('high'), MatchWeight.high);
        expect(MatchWeight.fromString('Medium'), MatchWeight.medium);
        expect(MatchWeight.fromString('Low'), MatchWeight.low);
        expect(
            MatchWeight.fromString('invalid'), MatchWeight.medium); // default
      });

      test('should serialize and deserialize correctly', () {
        const original = MatchIntelligence(
          totalScore: 88,
          categories: [
            MatchCategory(name: 'Values', score: 90, weight: MatchWeight.high),
          ],
          topReasons: ['Reason 1', 'Reason 2'],
          frictionPoints: ['Friction 1'],
        );

        final json = original.toJson();
        final restored = MatchIntelligence.fromJson(json);

        expect(restored.totalScore, original.totalScore);
        expect(restored.categories.length, original.categories.length);
        expect(restored.topReasons, original.topReasons);
        expect(restored.frictionPoints, original.frictionPoints);
      });
    });

    group('Chat Model', () {
      test('should create chat with participants', () {
        const chat = Chat(
          id: 'chat_001',
          participants: [
            Participant(
                id: 'p1',
                name: 'Dr. Aditi Sharma',
                avatarUrl: 'https://example.com/avatar.jpg'),
          ],
          type: ChatType.direct,
          unreadCount: 0,
        );

        expect(chat.id, 'chat_001');
        expect(chat.participants, hasLength(1));
        expect(chat.type, ChatType.direct);
        expect(chat.unreadCount, 0);
      });

      test('should parse chat type from string', () {
        expect(ChatType.fromString('direct'), ChatType.direct);
        expect(ChatType.fromString('group'), ChatType.group);
        expect(ChatType.fromString('matchmaker'), ChatType.matchmaker);
        expect(ChatType.fromString('invalid'), ChatType.direct); // default
      });

      test('should handle last message correctly', () {
        const message = Message(
          id: 'm1',
          senderId: 'user_001',
          text: 'Hello!',
          type: MessageType.text,
          timestamp: '10:42 AM',
          status: MessageStatus.read,
        );

        const chat = Chat(
          id: 'chat_002',
          participants: [],
          lastMessage: message,
          type: ChatType.direct,
          unreadCount: 0,
        );

        expect(chat.lastMessage, isNotNull);
        expect(chat.lastMessage?.text, 'Hello!');
        expect(chat.lastMessage?.status, MessageStatus.read);
      });

      test('should create empty chat with factory', () {
        final emptyChat = Chat.empty();

        expect(emptyChat.id, '');
        expect(emptyChat.participants, isEmpty);
      });
    });

    group('Message Model', () {
      test('should create message with all fields', () {
        const message = Message(
          id: 'msg_001',
          senderId: 'user_001',
          text: 'Test message',
          type: MessageType.text,
          timestamp: '10:30 AM',
          status: MessageStatus.sent,
        );

        expect(message.id, 'msg_001');
        expect(message.text, 'Test message');
        expect(message.type, MessageType.text);
        expect(message.status, MessageStatus.sent);
      });

      test('should parse message type from string', () {
        expect(MessageType.fromString('text'), MessageType.text);
        expect(MessageType.fromString('image'), MessageType.image);
        expect(MessageType.fromString('system'), MessageType.system);
        expect(MessageType.fromString('invalid'), MessageType.text); // default
      });

      test('should parse message status from string', () {
        expect(MessageStatus.fromString('sent'), MessageStatus.sent);
        expect(MessageStatus.fromString('delivered'), MessageStatus.delivered);
        expect(MessageStatus.fromString('read'), MessageStatus.read);
        expect(MessageStatus.fromString('failed'), MessageStatus.failed);
      });
    });

    group('AppNotification Model', () {
      test('should create notification with all fields', () {
        final notification = AppNotification(
          id: 'n1',
          type: NotificationType.match,
          title: "It's a Match!",
          body: 'You and Dr. Aditi have liked each other!',
          timestamp: DateTime.now().toIso8601String(),
          isRead: false,
        );

        expect(notification.id, 'n1');
        expect(notification.type, NotificationType.match);
        expect(notification.isRead, false);
      });

      test('should mark notification as read', () {
        const notification = AppNotification(
          id: 'n2',
          type: NotificationType.message,
          title: 'New Message',
          body: 'You have a new message',
          timestamp: '2024-01-15T10:30:00Z',
          isRead: false,
        );

        final readNotification = notification.markAsRead();

        expect(notification.isRead, false);
        expect(readNotification.isRead, true);
      });

      test('should parse notification type from string', () {
        expect(NotificationType.fromString('match'), NotificationType.match);
        expect(
            NotificationType.fromString('message'), NotificationType.message);
        expect(
            NotificationType.fromString('proposal'), NotificationType.proposal);
        expect(NotificationType.fromString('invalid'), NotificationType.system);
      });
    });

    group('Proposal Model', () {
      test('should create proposal with all fields', () {
        const proposal = Proposal(
          id: 'prop_001',
          fromUserId: 'user_001',
          toUserId: 'user_002',
          fromUserName: 'Dr. Rajesh Kumar',
          fromUserAvatar: 'https://example.com/avatar.jpg',
          fromUserSpecialty: 'MD Gen. Medicine',
          status: ProposalStatus.pending,
          createdAt: '2024-01-15T10:30:00Z',
        );

        expect(proposal.id, 'prop_001');
        expect(proposal.status, ProposalStatus.pending);
        expect(proposal.isPending, true);
        expect(proposal.isAccepted, false);
        expect(proposal.isDeclined, false);
      });

      test('should parse proposal status from string', () {
        expect(ProposalStatus.fromString('pending'), ProposalStatus.pending);
        expect(ProposalStatus.fromString('accepted'), ProposalStatus.accepted);
        expect(ProposalStatus.fromString('declined'), ProposalStatus.declined);
        expect(
            ProposalStatus.fromString('withdrawn'), ProposalStatus.withdrawn);
      });
    });

    group('SubscriptionPlan Model', () {
      test('should create subscription plan with pricing', () {
        const plan = SubscriptionPlan(
          id: 'premium',
          name: 'Premium',
          description: 'Full access',
          monthlyPrice: 999,
          quarterlyPrice: 2499,
          yearlyPrice: 7999,
          features: ['Feature 1', 'Feature 2'],
          isPopular: true,
        );

        expect(plan.id, 'premium');
        expect(plan.monthlyPrice, 999);
        expect(plan.quarterlyPrice, 2499);
        expect(plan.yearlyPrice, 7999);
        expect(plan.isPopular, true);
      });

      test('should get price for billing cycle', () {
        const plan = SubscriptionPlan(
          id: 'test',
          name: 'Test',
          description: 'Test plan',
          monthlyPrice: 100,
          quarterlyPrice: 250,
          yearlyPrice: 800,
          features: [],
        );

        expect(plan.getPriceForCycle(BillingCycle.monthly), 100);
        expect(plan.getPriceForCycle(BillingCycle.quarterly), 250);
        expect(plan.getPriceForCycle(BillingCycle.yearly), 800);
      });

      test('should calculate yearly savings percentage', () {
        const plan = SubscriptionPlan(
          id: 'savings',
          name: 'Savings Test',
          description: 'Test savings',
          monthlyPrice: 100,
          quarterlyPrice: 250,
          yearlyPrice: 800,
          features: [],
        );

        // Monthly * 12 = 1200, yearly = 800, savings = 400/1200 = 33%
        expect(plan.yearlySavingsPercent, 33);
      });
    });

    group('Result Wrapper', () {
      test('should create success result', () {
        final result = Result.success('test data');

        expect(result.isSuccess, true);
        expect(result.data, 'test data');
        expect(result.error, isNull);
      });

      test('should create failure result', () {
        final result = Result<String>.failure('Error message');

        expect(result.isSuccess, false);
        expect(result.data, isNull);
        expect(result.error, 'Error message');
      });

      test('should map success result', () {
        final result = Result.success(10);
        final mapped = result.map((data) => data * 2);

        expect(mapped.isSuccess, true);
        expect(mapped.data, 20);
      });

      test('should fold result correctly', () {
        final successResult = Result.success(42);
        final failureResult = Result<int>.failure('Error');

        final successValue = successResult.fold(
          onSuccess: (data) => 'Success: $data',
          onFailure: (error) => 'Failed: $error',
        );

        final failureValue = failureResult.fold(
          onSuccess: (data) => 'Success: $data',
          onFailure: (error) => 'Failed: $error',
        );

        expect(successValue, 'Success: 42');
        expect(failureValue, 'Failed: Error');
      });

      test('should get data or throw', () {
        final successResult = Result.success('data');
        final failureResult = Result<String>.failure('Error');

        expect(successResult.getOrThrow(), 'data');
        expect(() => failureResult.getOrThrow(), throwsA(isA<Exception>()));
      });

      test('should get data or else', () {
        final successResult = Result.success('data');
        final failureResult = Result<String>.failure('Error');

        expect(successResult.getOrElse('default'), 'data');
        expect(failureResult.getOrElse('default'), 'default');
      });
    });

    group('Mock Repository Tests', () {
      test('MockAuthRepository should sign in successfully', () async {
        final authRepo = MockAuthRepository();

        final result = await authRepo.signIn(
          email: 'test@example.com',
          password: 'password123',
        );

        expect(result.isSuccess, true);
        expect(result.data, isNotNull);
        expect(result.data?.name, 'Dr. Rajesh Kumar');
      });

      test('MockAuthRepository should fail with empty credentials', () async {
        final authRepo = MockAuthRepository();

        final result = await authRepo.signIn(
          email: '',
          password: '',
        );

        expect(result.isSuccess, false);
        expect(result.error, 'Email and password are required');
      });

      test('MockProfileRepository should return discovery profiles', () async {
        final profileRepo = MockProfileRepository();

        final result = await profileRepo.getDiscoveryProfiles();

        expect(result.isSuccess, true);
        expect(result.data, isNotEmpty);
        expect(result.data?.first.name, contains('Dr.'));
      });

      test('MockChatRepository should return chats', () async {
        final chatRepo = MockChatRepository();

        final result = await chatRepo.getChats();

        expect(result.isSuccess, true);
        expect(result.data, isNotEmpty);
      });

      test('MockNotificationRepository should return notifications', () async {
        final notificationRepo = MockNotificationRepository();

        final result = await notificationRepo.getNotifications();

        expect(result.isSuccess, true);
        expect(result.data, isNotEmpty);
      });

      test('MockSubscriptionRepository should return plans', () async {
        final subscriptionRepo = MockSubscriptionRepository();

        final result = await subscriptionRepo.getPlans();

        expect(result.isSuccess, true);
        expect(result.data, hasLength(3)); // Basic, Premium, Elite
      });
    });
  });
}
