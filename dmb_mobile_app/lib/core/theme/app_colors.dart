import 'package:flutter/material.dart';

/// DMB App Color Palette
/// Transpiled from React Tailwind CSS configuration
class AppColors {
  AppColors._();

  // ============================================
  // PRIMARY BRAND COLORS
  // ============================================

  /// Primary brand color - #d41173
  static const Color primary = Color(0xFFD41173);

  /// Primary hover state
  static const Color primaryHover = Color(0xFFB30E62);

  /// Primary light variant
  static const Color primaryLight = Color(0xFFFCE7F3);

  /// Primary with opacity for shadows
  static Color primaryShadow = primary.withOpacity(0.3);

  // ============================================
  // SLATE PALETTE (Neutral Grays)
  // ============================================

  static const Color slate50 = Color(0xFFF8FAFC);
  static const Color slate100 = Color(0xFFF1F5F9);
  static const Color slate200 = Color(0xFFE2E8F0);
  static const Color slate300 = Color(0xFFCBD5E1);
  static const Color slate400 = Color(0xFF94A3B8);
  static const Color slate500 = Color(0xFF64748B);
  static const Color slate600 = Color(0xFF475569);
  static const Color slate700 = Color(0xFF334155);
  static const Color slate800 = Color(0xFF1E293B);
  static const Color slate900 = Color(0xFF0F172A);
  static const Color slate950 = Color(0xFF020617);

  // ============================================
  // SEMANTIC COLORS
  // ============================================

  // Success (Green)
  static const Color success = Color(0xFF16A34A);
  static const Color successLight = Color(0xFFDCFCE7);
  static const Color successDark = Color(0xFF15803D);

  // Error (Red)
  static const Color error = Color(0xFFDC2626);
  static const Color errorLight = Color(0xFFFEE2E2);
  static const Color errorDark = Color(0xFFB91C1C);

  // Warning (Orange)
  static const Color warning = Color(0xFFEA580C);
  static const Color warningLight = Color(0xFFFFF7ED);
  static const Color warningDark = Color(0xFFC2410C);

  // Info (Blue)
  static const Color info = Color(0xFF2563EB);
  static const Color infoLight = Color(0xFFDBEAFE);
  static const Color infoDark = Color(0xFF1D4ED8);

  // Pending/Highlight (Yellow)
  static const Color pending = Color(0xFFCA8A04);
  static const Color pendingLight = Color(0xFFFEF9C3);

  // Premium (Purple)
  static const Color premium = Color(0xFF7C3AED);
  static const Color premiumLight = Color(0xFFF3E8FF);

  // Secondary (Amber/Gold for agent picks)
  static const Color secondary = Color(0xFFD97706);
  static const Color secondaryLight = Color(0xFFFEF3C7);
  static const Color secondaryDark = Color(0xFFB45309);

  // Purple (for badges/highlights)
  static const Color purple = Color(0xFF9333EA);
  static const Color purpleLight = Color(0xFFF3E8FF);
  static const Color purpleDark = Color(0xFF7E22CE);

  // ============================================
  // BACKGROUND COLORS
  // ============================================

  static const Color background = Color(0xFFF8F6F7);
  static const Color backgroundLight = Color(0xFFFFFFFF);
  static const Color backgroundDark = Color(0xFF0F172A);

  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceVariant = Color(0xFFF1F5F9);

  // ============================================
  // TEXT COLORS
  // ============================================

  static const Color textPrimary = Color(0xFF0F172A);
  static const Color textSecondary = Color(0xFF475569);
  static const Color textMuted = Color(0xFF64748B);
  static const Color textDisabled = Color(0xFF94A3B8);
  static const Color textOnPrimary = Color(0xFFFFFFFF);
  static const Color textTertiary = Color(0xFF94A3B8);

  // ============================================
  // BORDER COLORS
  // ============================================

  static const Color border = Color(0xFFE2E8F0);
  static const Color borderLight = Color(0xFFF1F5F9);
  static const Color borderFocused = Color(0xFFD41173);
  static const Color divider = Color(0xFFE2E8F0);

  // ============================================
  // OVERLAY COLORS
  // ============================================

  static Color overlay = Colors.black.withOpacity(0.6);
  static Color overlayLight = Colors.black.withOpacity(0.3);

  // ============================================
  // ONLINE/STATUS COLORS
  // ============================================

  static const Color online = Color(0xFF22C55E);
  static const Color offline = Color(0xFF94A3B8);
  static const Color away = Color(0xFFEAB308);
  static const Color busy = Color(0xFFEF4444);

  // ============================================
  // GRADIENT DEFINITIONS
  // ============================================

  static const LinearGradient primaryGradient = LinearGradient(
    colors: [primary, Color(0xFFE91E8C)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  /// Profile card gradient background
  static const LinearGradient profileCardGradient = LinearGradient(
    colors: [primary, Color(0xFFE91E8C), Color(0xFFF472B6)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient darkGradient = LinearGradient(
    colors: [slate900, slate800],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  static const LinearGradient premiumGradient = LinearGradient(
    colors: [premium, Color(0xFFA855F7)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // ============================================
  // MATERIAL COLOR SWATCH
  // ============================================

  static const MaterialColor primarySwatch = MaterialColor(
    0xFFD41173,
    <int, Color>{
      50: Color(0xFFFCE7F3),
      100: Color(0xFFFBCFE8),
      200: Color(0xFFF9A8D4),
      300: Color(0xFFF472B6),
      400: Color(0xFFEC4899),
      500: Color(0xFFD41173),
      600: Color(0xFFB30E62),
      700: Color(0xFF9D174D),
      800: Color(0xFF831843),
      900: Color(0xFF500724),
    },
  );
}
