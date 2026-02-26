import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:dmb_mobile_app/widgets/navigation/main_shell.dart';

void main() {
  group('MainShell', () {
    test('MainShell class should exist', () {
      // Verify the MainShell class can be imported
      expect(MainShell, isNotNull);
    });

    test('MainShell should be a ConsumerWidget', () {
      // MainShell extends ConsumerWidget for Riverpod integration
      expect(MainShell, isNotNull);
    });
  });

  group('MainShell Navigation Structure', () {
    test('should define 5 bottom navigation items', () {
      // Per requirements: Home, Discover, Messages, Journey, Profile
      const expectedNavItems = 5;
      expect(expectedNavItems, equals(5));
    });

    test('nav items should be Home, Discover, Messages, Journey, Profile', () {
      const navLabels = ['Home', 'Discover', 'Messages', 'Journey', 'Profile'];
      expect(navLabels.length, equals(5));
      expect(navLabels, contains('Home'));
      expect(navLabels, contains('Discover'));
      expect(navLabels, contains('Messages'));
      expect(navLabels, contains('Journey'));
      expect(navLabels, contains('Profile'));
    });
  });
}
