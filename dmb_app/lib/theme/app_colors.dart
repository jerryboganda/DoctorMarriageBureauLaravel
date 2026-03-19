import 'package:flutter/material.dart';

class AppColors {
  // Primary
  static const Color primary = Color(0xFFD41173);
  static const Color primaryHover = Color(0xFFB00E60);
  static const Color primary10 = Color(0x1AD41173);  // 10% opacity
  static const Color primary5 = Color(0x0DD41173);   // 5% opacity

  // Background
  static const Color backgroundLight = Color(0xFFF8F6F7);
  static const Color backgroundDark = Color(0xFF221019);
  static const Color white = Color(0xFFFFFFFF);

  // Semantic
  static const Color success = Color(0xFF059669);  // emerald-600
  static const Color warning = Color(0xFFF59E0B);  // amber-500
  static const Color error = Color(0xFFDC2626);    // red-600
  static const Color info = Color(0xFF2563EB);     // blue-600

  // Neutrals (Tailwind slate)
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

  // Card shadow color
  static const Color cardShadow = Color(0x80CBD5E1);  // slate-200 at 50%

  // Gradients used on profile cards
  static const List<List<Color>> cardGradients = [
    [Color(0xFFD41173), Color(0xFFFF6B9D)],
    [Color(0xFF7C3AED), Color(0xFFA78BFA)],
    [Color(0xFF2563EB), Color(0xFF60A5FA)],
    [Color(0xFF059669), Color(0xFF34D399)],
    [Color(0xFFDC2626), Color(0xFFF87171)],
    [Color(0xFFD97706), Color(0xFFFBBF24)],
  ];
}
