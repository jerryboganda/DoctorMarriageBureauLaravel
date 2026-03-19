import 'package:flutter/material.dart';
import 'app_colors.dart';

class AppTypography {
  static const String fontFamilyEn = 'Inter';
  static const String fontFamilyUr = 'NotoSansArabic';

  static String fontFamily(String locale) =>
      locale == 'ur' ? fontFamilyUr : fontFamilyEn;

  // text-[10px] — micro badges
  static TextStyle micro(String locale) => TextStyle(
    fontFamily: fontFamily(locale),
    fontSize: 10,
    fontWeight: FontWeight.w400,
    color: AppColors.slate500,
  );

  // text-xs (12px) — labels, helper text
  static TextStyle xs(String locale) => TextStyle(
    fontFamily: fontFamily(locale),
    fontSize: 12,
    fontWeight: FontWeight.w400,
    color: AppColors.slate500,
  );

  // text-sm (14px) — body secondary
  static TextStyle sm(String locale) => TextStyle(
    fontFamily: fontFamily(locale),
    fontSize: 14,
    fontWeight: FontWeight.w400,
    color: AppColors.slate600,
  );

  // text-base (16px) — body text
  static TextStyle base(String locale) => TextStyle(
    fontFamily: fontFamily(locale),
    fontSize: 16,
    fontWeight: FontWeight.w400,
    color: AppColors.slate900,
  );

  // text-lg (18px) — section headers
  static TextStyle lg(String locale) => TextStyle(
    fontFamily: fontFamily(locale),
    fontSize: 18,
    fontWeight: FontWeight.w600,
    color: AppColors.slate900,
  );

  // text-xl (20px) — screen titles
  static TextStyle xl(String locale) => TextStyle(
    fontFamily: fontFamily(locale),
    fontSize: 20,
    fontWeight: FontWeight.w700,
    color: AppColors.slate900,
  );

  // text-2xl (24px) — large headings
  static TextStyle xxl(String locale) => TextStyle(
    fontFamily: fontFamily(locale),
    fontSize: 24,
    fontWeight: FontWeight.w700,
    color: AppColors.slate900,
  );
}
