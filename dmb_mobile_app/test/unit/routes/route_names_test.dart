import 'package:flutter_test/flutter_test.dart';
import 'package:dmb_mobile_app/routes/route_names.dart';

void main() {
  group('RouteNames', () {
    test('should have correct welcome route path', () {
      expect(RouteNames.welcome, '/welcome');
    });

    test('should have correct dashboard route path', () {
      expect(RouteNames.dashboard, '/');
    });

    test('should have correct discovery route path', () {
      expect(RouteNames.discovery, '/discovery');
    });

    test('should have correct messages route path', () {
      expect(RouteNames.messages, '/messages');
    });

    test('should have correct progression route path', () {
      expect(RouteNames.progression, '/progression');
    });

    test('should have correct profile route path', () {
      expect(RouteNames.profile, '/profile');
    });

    test('should have correct settings route path', () {
      expect(RouteNames.settings, '/settings');
    });

    test('should have correct notifications route path', () {
      expect(RouteNames.notifications, '/notifications');
    });

    test('should have correct family route path', () {
      expect(RouteNames.family, '/family');
    });

    test('should have correct communities route path', () {
      expect(RouteNames.communities, '/communities');
    });

    test('should generate correct chat detail route with ID', () {
      expect(RouteNames.chatDetail('123'), '/messages/123');
    });

    test('all routes should start with /', () {
      expect(RouteNames.welcome, startsWith('/'));
      expect(RouteNames.dashboard, startsWith('/'));
      expect(RouteNames.discovery, startsWith('/'));
      expect(RouteNames.messages, startsWith('/'));
      expect(RouteNames.progression, startsWith('/'));
      expect(RouteNames.profile, startsWith('/'));
      expect(RouteNames.settings, startsWith('/'));
      expect(RouteNames.notifications, startsWith('/'));
      expect(RouteNames.family, startsWith('/'));
      expect(RouteNames.communities, startsWith('/'));
    });
  });
}
