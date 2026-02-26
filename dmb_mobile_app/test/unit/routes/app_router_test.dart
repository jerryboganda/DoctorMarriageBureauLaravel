import 'package:flutter_test/flutter_test.dart';
import 'package:dmb_mobile_app/routes/route_names.dart';
import 'package:dmb_mobile_app/routes/app_router.dart';

void main() {
  group('AppRouter', () {
    test('appRouterProvider should exist', () {
      // Verify the provider can be imported
      expect(appRouterProvider, isNotNull);
    });
  });

  group('AppRouter Route Structure', () {
    test('welcome route should exist', () {
      expect(RouteNames.welcome, isNotNull);
      expect(RouteNames.welcome, equals('/welcome'));
    });

    test('main shell routes should be defined', () {
      // Dashboard is root
      expect(RouteNames.dashboard, equals('/'));

      // Other main routes
      expect(RouteNames.discovery, equals('/discovery'));
      expect(RouteNames.messages, equals('/messages'));
      expect(RouteNames.progression, equals('/progression'));
      expect(RouteNames.profile, equals('/profile'));
    });

    test('drawer routes should be defined', () {
      expect(RouteNames.settings, equals('/settings'));
      expect(RouteNames.notifications, equals('/notifications'));
      expect(RouteNames.family, equals('/family'));
      expect(RouteNames.communities, equals('/communities'));
    });

    test('nested chat route should be generated correctly', () {
      expect(RouteNames.chatDetail('user-123'), equals('/messages/user-123'));
      expect(RouteNames.chatDetail('abc'), equals('/messages/abc'));
    });

    test('all primary routes should start with /', () {
      expect(RouteNames.welcome, startsWith('/'));
      expect(RouteNames.dashboard, startsWith('/'));
      expect(RouteNames.discovery, startsWith('/'));
      expect(RouteNames.messages, startsWith('/'));
      expect(RouteNames.progression, startsWith('/'));
      expect(RouteNames.profile, startsWith('/'));
    });

    test('all secondary routes should start with /', () {
      expect(RouteNames.settings, startsWith('/'));
      expect(RouteNames.notifications, startsWith('/'));
      expect(RouteNames.family, startsWith('/'));
      expect(RouteNames.communities, startsWith('/'));
    });
  });
}
