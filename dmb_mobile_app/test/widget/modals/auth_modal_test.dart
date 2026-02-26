import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:dmb_mobile_app/widgets/modals/auth_modal.dart';
import 'package:dmb_mobile_app/core/theme/app_colors.dart';

void main() {
  group('AuthModal Widget Tests', () {
    late bool onCloseCalled;
    late bool onLoginCalled;

    setUp(() {
      onCloseCalled = false;
      onLoginCalled = false;
    });

    Widget createTestWidget() {
      return ProviderScope(
        child: MaterialApp(
          theme: ThemeData(
            colorScheme: ColorScheme.light(primary: AppColors.primary),
          ),
          home: Scaffold(
            body: Builder(
              builder: (context) => Center(
                child: ElevatedButton(
                  onPressed: () {
                    showDialog(
                      context: context,
                      builder: (_) => AuthModal(
                        onClose: () => onCloseCalled = true,
                        onLogin: () => onLoginCalled = true,
                      ),
                    );
                  },
                  child: const Text('Open Modal'),
                ),
              ),
            ),
          ),
        ),
      );
    }

    // Helper to set larger screen size for modal testing
    Future<void> setLargeScreen(WidgetTester tester) async {
      await tester.binding.setSurfaceSize(const Size(800, 1000));
      addTearDown(() => tester.binding.setSurfaceSize(null));
    }

    testWidgets('displays secure login header', (tester) async {
      await setLargeScreen(tester);
      await tester.pumpWidget(createTestWidget());
      await tester.tap(find.text('Open Modal'));
      await tester.pumpAndSettle();

      expect(find.text('Secure Login'), findsOneWidget);
      expect(
        find.text('Trusted Matrimony for Medical Professionals'),
        findsOneWidget,
      );
    });

    testWidgets('shows role selection step initially', (tester) async {
      await setLargeScreen(tester);
      await tester.pumpWidget(createTestWidget());
      await tester.tap(find.text('Open Modal'));
      await tester.pumpAndSettle();

      expect(find.text('Who is logging in?'), findsOneWidget);
      expect(find.text('Candidate'), findsOneWidget);
      expect(find.text('Parent / Guardian'), findsOneWidget);
      expect(find.text('Matchmaker / Agent'), findsOneWidget);
    });

    testWidgets('navigates to input step when role is selected',
        (tester) async {
      await setLargeScreen(tester);
      await tester.pumpWidget(createTestWidget());
      await tester.tap(find.text('Open Modal'));
      await tester.pumpAndSettle();

      // Tap on Candidate role
      await tester.tap(find.text('Candidate'));
      await tester.pumpAndSettle();

      // Should show input step
      expect(find.text('Mobile'), findsOneWidget);
      expect(find.text('Email'), findsOneWidget);
      expect(find.text('Mobile Number'), findsOneWidget);
    });

    testWidgets('can switch between phone and email method', (tester) async {
      await setLargeScreen(tester);
      await tester.pumpWidget(createTestWidget());
      await tester.tap(find.text('Open Modal'));
      await tester.pumpAndSettle();

      // Go to input step
      await tester.tap(find.text('Candidate'));
      await tester.pumpAndSettle();

      // Should start with phone
      expect(find.text('Mobile Number'), findsOneWidget);

      // Switch to email
      await tester.tap(find.text('Email'));
      await tester.pumpAndSettle();

      expect(find.text('Email Address'), findsOneWidget);
    });

    testWidgets('shows validation error for short phone number',
        (tester) async {
      await setLargeScreen(tester);
      await tester.pumpWidget(createTestWidget());
      await tester.tap(find.text('Open Modal'));
      await tester.pumpAndSettle();

      // Go to input step
      await tester.tap(find.text('Candidate'));
      await tester.pumpAndSettle();

      // Enter short phone number
      final phoneField = find.byType(TextField);
      await tester.enterText(phoneField, '12345');
      await tester.pumpAndSettle();

      // Try to submit
      await tester.tap(find.text('Send Code'));
      await tester.pumpAndSettle();

      // Should show validation error
      expect(
        find.text('Please enter a valid 10-digit mobile number'),
        findsOneWidget,
      );
    });

    testWidgets('shows validation error for invalid email', (tester) async {
      await setLargeScreen(tester);
      await tester.pumpWidget(createTestWidget());
      await tester.tap(find.text('Open Modal'));
      await tester.pumpAndSettle();

      // Go to input step
      await tester.tap(find.text('Candidate'));
      await tester.pumpAndSettle();

      // Switch to email
      await tester.tap(find.text('Email'));
      await tester.pumpAndSettle();

      // Enter invalid email
      final emailField = find.byType(TextField);
      await tester.enterText(emailField, 'invalidemail');
      await tester.pumpAndSettle();

      // Try to submit
      await tester.tap(find.text('Continue'));
      await tester.pumpAndSettle();

      // Should show validation error
      expect(
        find.text('Please enter a valid email address'),
        findsOneWidget,
      );
    });

    testWidgets('can close modal with close button', (tester) async {
      await setLargeScreen(tester);
      await tester.pumpWidget(createTestWidget());
      await tester.tap(find.text('Open Modal'));
      await tester.pumpAndSettle();

      // Find and tap close button
      await tester.tap(find.byIcon(Icons.close));
      await tester.pumpAndSettle();

      expect(onCloseCalled, isTrue);
    });

    testWidgets('shows trust footer', (tester) async {
      await setLargeScreen(tester);
      await tester.pumpWidget(createTestWidget());
      await tester.tap(find.text('Open Modal'));
      await tester.pumpAndSettle();

      expect(
        find.text('256-bit Encrypted • ISO 27001 Certified'),
        findsOneWidget,
      );
    });
  });

  group('AuthStep Enum', () {
    test('has all expected steps', () {
      expect(AuthStep.values.length, equals(6));
      expect(AuthStep.values, contains(AuthStep.role));
      expect(AuthStep.values, contains(AuthStep.input));
      expect(AuthStep.values, contains(AuthStep.otp));
      expect(AuthStep.values, contains(AuthStep.magicLink));
      expect(AuthStep.values, contains(AuthStep.password));
      expect(AuthStep.values, contains(AuthStep.mfa));
    });
  });

  group('UserRole Enum', () {
    test('has all expected roles', () {
      expect(UserRole.values.length, equals(3));
      expect(UserRole.values, contains(UserRole.candidate));
      expect(UserRole.values, contains(UserRole.guardian));
      expect(UserRole.values, contains(UserRole.agent));
    });
  });

  group('AuthMethod Enum', () {
    test('has phone and email methods', () {
      expect(AuthMethod.values.length, equals(2));
      expect(AuthMethod.values, contains(AuthMethod.phone));
      expect(AuthMethod.values, contains(AuthMethod.email));
    });
  });
}
