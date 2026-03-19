import 'package:flutter/material.dart';
import 'app_colors.dart';

class AppDecorations {
  // Border radii
  static const double radiusMd = 6.0;
  static const double radiusLg = 8.0;
  static const double radiusXl = 12.0;
  static const double radiusXxl = 16.0;
  static const double radiusFull = 9999.0;

  // Shadows matching Tailwind
  static const List<BoxShadow> shadowSm = [
    BoxShadow(color: Color(0x0D000000), blurRadius: 2, offset: Offset(0, 1)),
  ];

  static const List<BoxShadow> shadowMd = [
    BoxShadow(color: Color(0x1A000000), blurRadius: 6, offset: Offset(0, 2)),
  ];

  static const List<BoxShadow> shadowLg = [
    BoxShadow(color: Color(0x1A000000), blurRadius: 15, offset: Offset(0, 10)),
  ];

  static const List<BoxShadow> shadowXl = [
    BoxShadow(color: Color(0x1A000000), blurRadius: 25, offset: Offset(0, 20)),
  ];

  // Card shadow: shadow-lg shadow-slate-200/50
  static const List<BoxShadow> cardShadow = [
    BoxShadow(color: AppColors.cardShadow, blurRadius: 15, offset: Offset(0, 10)),
  ];

  // Standard card decoration
  static BoxDecoration card({Color? color}) => BoxDecoration(
    color: color ?? AppColors.white,
    borderRadius: BorderRadius.circular(radiusXl),
    boxShadow: cardShadow,
  );

  // Modal decoration
  static BoxDecoration modal() => BoxDecoration(
    color: AppColors.white,
    borderRadius: const BorderRadius.vertical(top: Radius.circular(radiusXxl)),
    boxShadow: shadowXl,
  );

  // Input decoration (border + radius)
  static BoxDecoration input({bool focused = false, bool error = false}) =>
      BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(radiusXl),
        border: Border.all(
          color: error
              ? AppColors.error
              : focused
                  ? AppColors.primary
                  : AppColors.slate200,
          width: focused ? 2 : 1,
        ),
      );

  // Spacing constants (matching Tailwind)
  static const double sp1 = 4;
  static const double sp2 = 8;
  static const double sp3 = 12;
  static const double sp4 = 16;
  static const double sp5 = 20;
  static const double sp6 = 24;
  static const double sp8 = 32;

  // Component sizes
  static const double headerHeight = 64;
  static const double sidebarWidth = 280;
  static const double avatarSidebar = 96;
  static const double avatarCard = 48;
  static const double buttonHeight = 44;
  static const double inputHeight = 44;
  static const double bottomNavHeight = 56;
}
