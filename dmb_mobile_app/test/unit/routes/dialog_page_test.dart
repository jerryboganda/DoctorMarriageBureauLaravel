import 'package:flutter_test/flutter_test.dart';
import 'package:dmb_mobile_app/routes/app_router.dart';
import 'package:flutter/material.dart';

void main() {
  group('DialogPage', () {
    test('creates a DialogPage with builder', () {
      final page = DialogPage(
        builder: (context) => const Text('Test Dialog'),
        key: const ValueKey('test'),
        name: 'testDialog',
      );

      expect(page.builder, isNotNull);
      expect(page.key, equals(const ValueKey('test')));
      expect(page.name, equals('testDialog'));
    });

    testWidgets('createRoute returns a DialogRoute', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Builder(
            builder: (context) {
              final page = DialogPage(
                builder: (dialogContext) => const AlertDialog(
                  title: Text('Test'),
                ),
              );

              final route = page.createRoute(context);
              expect(route, isA<DialogRoute>());
              return const SizedBox();
            },
          ),
        ),
      );
    });
  });
}
