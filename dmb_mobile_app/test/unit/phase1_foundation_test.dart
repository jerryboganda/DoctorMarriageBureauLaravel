import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:dmb_mobile_app/core/core.dart';

/// Phase 1 Foundation Tests
/// Validates theme, colors, typography, and constants are properly configured
void main() {
  group('AppColors', () {
    test('primary color should be correct hex value', () {
      expect(AppColors.primary.value, equals(0xFFD41173));
    });

    test('primary hover should be darker than primary', () {
      expect(AppColors.primaryHover.value, equals(0xFFB30E62));
    });

    test('slate palette should have all shades', () {
      expect(AppColors.slate50, isNotNull);
      expect(AppColors.slate100, isNotNull);
      expect(AppColors.slate200, isNotNull);
      expect(AppColors.slate300, isNotNull);
      expect(AppColors.slate400, isNotNull);
      expect(AppColors.slate500, isNotNull);
      expect(AppColors.slate600, isNotNull);
      expect(AppColors.slate700, isNotNull);
      expect(AppColors.slate800, isNotNull);
      expect(AppColors.slate900, isNotNull);
    });

    test('semantic colors should be defined', () {
      expect(AppColors.success, isNotNull);
      expect(AppColors.error, isNotNull);
      expect(AppColors.warning, isNotNull);
      expect(AppColors.info, isNotNull);
    });

    test('text colors should be defined', () {
      expect(AppColors.textPrimary, isNotNull);
      expect(AppColors.textSecondary, isNotNull);
      expect(AppColors.textMuted, isNotNull);
      expect(AppColors.textOnPrimary, isNotNull);
    });
  });

  group('AppTypography', () {
    test('font family should be Inter', () {
      expect(AppTypography.fontFamily, equals('Inter'));
    });

    test('display styles should have correct sizes', () {
      expect(AppTypography.displayLarge.fontSize, equals(32));
      expect(AppTypography.displayMedium.fontSize, equals(28));
      expect(AppTypography.displaySmall.fontSize, equals(24));
    });

    test('headline styles should have correct sizes', () {
      expect(AppTypography.headlineLarge.fontSize, equals(22));
      expect(AppTypography.headlineMedium.fontSize, equals(20));
      expect(AppTypography.headlineSmall.fontSize, equals(18));
    });

    test('body styles should have correct sizes', () {
      expect(AppTypography.bodyLarge.fontSize, equals(16));
      expect(AppTypography.bodyMedium.fontSize, equals(14));
      expect(AppTypography.bodySmall.fontSize, equals(12));
    });

    test('button styles should have correct sizes', () {
      expect(AppTypography.buttonLarge.fontSize, equals(16));
      expect(AppTypography.buttonMedium.fontSize, equals(14));
      expect(AppTypography.buttonSmall.fontSize, equals(12));
    });
  });

  group('AppConstants', () {
    test('spacing values should follow 4px grid', () {
      expect(AppSpacing.xs, equals(4.0));
      expect(AppSpacing.sm, equals(8.0));
      expect(AppSpacing.md, equals(16.0));
      expect(AppSpacing.lg, equals(24.0));
      expect(AppSpacing.xl, equals(32.0));
    });

    test('radius values should be defined', () {
      expect(AppRadius.none, equals(0.0));
      expect(AppRadius.sm, equals(8.0));
      expect(AppRadius.md, equals(12.0));
      expect(AppRadius.lg, equals(16.0));
      expect(AppRadius.full, equals(9999.0));
    });

    test('app info should be defined', () {
      expect(AppInfo.appName, equals('DMB'));
      expect(AppInfo.fullName, equals('Doctor Marriage Bureau'));
      expect(AppInfo.version, isNotEmpty);
    });

    test('storage keys should be defined', () {
      expect(StorageKeys.accessToken, isNotEmpty);
      expect(StorageKeys.refreshToken, isNotEmpty);
      expect(StorageKeys.userId, isNotEmpty);
    });
  });

  group('AppTheme', () {
    test('light theme should be properly configured', () {
      final theme = AppTheme.lightTheme;
      expect(theme.brightness, equals(Brightness.light));
      expect(theme.useMaterial3, isTrue);
      expect(theme.colorScheme.primary.value, equals(AppColors.primary.value));
    });

    test('dark theme should be properly configured', () {
      final theme = AppTheme.darkTheme;
      expect(theme.brightness, equals(Brightness.dark));
      expect(theme.useMaterial3, isTrue);
    });
  });

  group('AppIcons', () {
    test('navigation icons should be defined', () {
      expect(AppIcons.home, isNotNull);
      expect(AppIcons.search, isNotNull);
      expect(AppIcons.settings, isNotNull);
    });

    test('user icons should be defined', () {
      expect(AppIcons.user, isNotNull);
      expect(AppIcons.users, isNotNull);
      expect(AppIcons.userCheck, isNotNull);
    });

    test('action icons should be defined', () {
      expect(AppIcons.check, isNotNull);
      expect(AppIcons.x, isNotNull);
      expect(AppIcons.plus, isNotNull);
      expect(AppIcons.edit, isNotNull);
    });

    test('getIcon should return correct icon for known name', () {
      expect(AppIcons.getIcon('home'), equals(AppIcons.home));
      expect(AppIcons.getIcon('search'), equals(AppIcons.search));
    });

    test('getIcon should return null for unknown name', () {
      expect(AppIcons.getIcon('unknown_icon_name'), isNull);
    });
  });
}
