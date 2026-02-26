import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:dmb_mobile_app/widgets/modals/onboarding_modal.dart';
import 'package:dmb_mobile_app/core/theme/app_colors.dart';

void main() {
  group('OnboardingModal Widget Tests', () {
    late bool onCloseCalled;
    late bool onCompleteCalled;

    setUp(() {
      onCloseCalled = false;
      onCompleteCalled = false;
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
                      builder: (_) => OnboardingModal(
                        onClose: () => onCloseCalled = true,
                        onComplete: () => onCompleteCalled = true,
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

    testWidgets('displays profile setup header', (tester) async {
      await tester.pumpWidget(createTestWidget());
      await tester.tap(find.text('Open Modal'));
      await tester.pumpAndSettle();

      expect(find.text('Profile Setup'), findsOneWidget);
    });

    testWidgets('shows step 1 persona selection initially', (tester) async {
      await tester.pumpWidget(createTestWidget());
      await tester.tap(find.text('Open Modal'));
      await tester.pumpAndSettle();

      expect(find.text('Welcome to DMB.'), findsOneWidget);
      expect(find.text('Candidate'), findsOneWidget);
      expect(find.text('Family Member'), findsOneWidget);
      expect(find.text('Matchmaker'), findsOneWidget);
    });

    testWidgets('can select persona and navigate to step 2', (tester) async {
      await tester.pumpWidget(createTestWidget());
      await tester.tap(find.text('Open Modal'));
      await tester.pumpAndSettle();

      // Select Candidate persona
      await tester.tap(find.text('Candidate'));
      await tester.pumpAndSettle();

      // Navigate to next step
      await tester.tap(find.text('Continue'));
      await tester.pumpAndSettle();

      // Should show step 2 - import method
      expect(find.text('Import Profile Data'), findsOneWidget);
      expect(find.text('Paste WhatsApp Biodata'), findsOneWidget);
      expect(find.text('Upload Biodata PDF'), findsOneWidget);
      expect(find.text('Start from Scratch'), findsOneWidget);
    });

    testWidgets('can navigate back from step 2', (tester) async {
      await tester.pumpWidget(createTestWidget());
      await tester.tap(find.text('Open Modal'));
      await tester.pumpAndSettle();

      // Go to step 2
      await tester.tap(find.text('Continue'));
      await tester.pumpAndSettle();

      // Go back
      await tester.tap(find.text('Back'));
      await tester.pumpAndSettle();

      // Should be on step 1 again
      expect(find.text('Welcome to DMB.'), findsOneWidget);
    });

    testWidgets('step 3 shows essential profile fields', (tester) async {
      await tester.pumpWidget(createTestWidget());
      await tester.tap(find.text('Open Modal'));
      await tester.pumpAndSettle();

      // Navigate to step 2
      await tester.tap(find.text('Continue'));
      await tester.pumpAndSettle();

      // Navigate to step 3
      await tester.tap(find.text('Continue'));
      await tester.pumpAndSettle();

      // Should show essential fields
      expect(find.text('The Essentials'), findsOneWidget);
      expect(find.text('First Name'), findsOneWidget);
      expect(find.text('Last Name'), findsOneWidget);
      expect(find.text('Specialty'), findsOneWidget);
      expect(find.text('Date of Birth'), findsOneWidget);
    });

    testWidgets('step 4 shows final declarations', (tester) async {
      await tester.pumpWidget(createTestWidget());
      await tester.tap(find.text('Open Modal'));
      await tester.pumpAndSettle();

      // Navigate through all steps
      await tester.tap(find.text('Continue'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Continue'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Continue'));
      await tester.pumpAndSettle();

      // Should show declarations
      expect(find.text('Final Declarations'), findsOneWidget);
      expect(find.text('Complete & Continue'), findsOneWidget);
    });

    testWidgets('can close modal with cancel button on step 1', (tester) async {
      await tester.pumpWidget(createTestWidget());
      await tester.tap(find.text('Open Modal'));
      await tester.pumpAndSettle();

      // Tap cancel
      await tester.tap(find.text('Cancel'));
      await tester.pumpAndSettle();

      expect(onCloseCalled, isTrue);
    });

    testWidgets('can close modal with X button', (tester) async {
      await tester.pumpWidget(createTestWidget());
      await tester.tap(find.text('Open Modal'));
      await tester.pumpAndSettle();

      // Find and tap close button
      await tester.tap(find.byIcon(Icons.close));
      await tester.pumpAndSettle();

      expect(onCloseCalled, isTrue);
    });

    testWidgets('shows stepper with progress indicators', (tester) async {
      await tester.pumpWidget(createTestWidget());
      await tester.tap(find.text('Open Modal'));
      await tester.pumpAndSettle();

      // Should show auth completed and verification pending labels
      expect(find.text('Auth'), findsOneWidget);
      expect(find.text('Verification'), findsOneWidget);
    });
  });

  group('UserPersona Enum', () {
    test('has all expected personas', () {
      expect(UserPersona.values.length, equals(3));
      expect(UserPersona.values, contains(UserPersona.candidate));
      expect(UserPersona.values, contains(UserPersona.family));
      expect(UserPersona.values, contains(UserPersona.agent));
    });
  });

  group('ImportMethod Enum', () {
    test('has all expected import methods', () {
      expect(ImportMethod.values.length, equals(3));
      expect(ImportMethod.values, contains(ImportMethod.whatsapp));
      expect(ImportMethod.values, contains(ImportMethod.pdf));
      expect(ImportMethod.values, contains(ImportMethod.manual));
    });
  });
}
