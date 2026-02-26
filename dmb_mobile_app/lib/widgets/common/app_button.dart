import 'package:flutter/material.dart';
import '../../core/theme/theme.dart';
import '../../core/constants/app_constants.dart';

/// Primary Button - Filled button with primary color
/// Equivalent to React's primary button style
class AppButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final bool isLoading;
  final bool isDisabled;
  final IconData? icon;
  final IconData? suffixIcon;
  final AppButtonSize size;
  final AppButtonVariant variant;
  final double? width;
  final bool isFullWidth;

  const AppButton({
    super.key,
    required this.label,
    this.onPressed,
    this.isLoading = false,
    this.isDisabled = false,
    this.icon,
    this.suffixIcon,
    this.size = AppButtonSize.medium,
    this.variant = AppButtonVariant.primary,
    this.width,
    this.isFullWidth = false,
  });

  /// Convenience constructor for primary filled button
  const AppButton.primary({
    super.key,
    required this.label,
    this.onPressed,
    this.isLoading = false,
    this.isDisabled = false,
    this.icon,
    this.suffixIcon,
    this.size = AppButtonSize.medium,
    this.width,
    this.isFullWidth = false,
  }) : variant = AppButtonVariant.primary;

  /// Convenience constructor for secondary button
  const AppButton.secondary({
    super.key,
    required this.label,
    this.onPressed,
    this.isLoading = false,
    this.isDisabled = false,
    this.icon,
    this.suffixIcon,
    this.size = AppButtonSize.medium,
    this.width,
    this.isFullWidth = false,
  }) : variant = AppButtonVariant.secondary;

  /// Convenience constructor for outline button
  const AppButton.outline({
    super.key,
    required this.label,
    this.onPressed,
    this.isLoading = false,
    this.isDisabled = false,
    this.icon,
    this.suffixIcon,
    this.size = AppButtonSize.medium,
    this.width,
    this.isFullWidth = false,
  }) : variant = AppButtonVariant.outline;

  /// Convenience constructor for ghost/text button
  const AppButton.ghost({
    super.key,
    required this.label,
    this.onPressed,
    this.isLoading = false,
    this.isDisabled = false,
    this.icon,
    this.suffixIcon,
    this.size = AppButtonSize.medium,
    this.width,
    this.isFullWidth = false,
  }) : variant = AppButtonVariant.ghost;

  /// Convenience constructor for danger button
  const AppButton.danger({
    super.key,
    required this.label,
    this.onPressed,
    this.isLoading = false,
    this.isDisabled = false,
    this.icon,
    this.suffixIcon,
    this.size = AppButtonSize.medium,
    this.width,
    this.isFullWidth = false,
  }) : variant = AppButtonVariant.danger;

  @override
  Widget build(BuildContext context) {
    final bool enabled = !isDisabled && !isLoading && onPressed != null;
    
    final EdgeInsetsGeometry padding = _getPadding();
    final double height = _getHeight();
    final TextStyle textStyle = _getTextStyle();
    final double iconSize = _getIconSize();

    Widget child = Row(
      mainAxisSize: MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (isLoading) ...[
          SizedBox(
            width: iconSize,
            height: iconSize,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              valueColor: AlwaysStoppedAnimation<Color>(_getLoadingColor()),
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
        ] else if (icon != null) ...[
          Icon(icon, size: iconSize),
          const SizedBox(width: AppSpacing.sm),
        ],
        Text(label, style: textStyle),
        if (suffixIcon != null && !isLoading) ...[
          const SizedBox(width: AppSpacing.sm),
          Icon(suffixIcon, size: iconSize),
        ],
      ],
    );

    final Widget button = switch (variant) {
      AppButtonVariant.primary => ElevatedButton(
          onPressed: enabled ? onPressed : null,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primary,
            foregroundColor: AppColors.textOnPrimary,
            disabledBackgroundColor: AppColors.slate200,
            disabledForegroundColor: AppColors.textDisabled,
            padding: padding,
            minimumSize: Size(width ?? 0, height),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(AppRadius.full),
            ),
            elevation: 0,
          ),
          child: child,
        ),
      AppButtonVariant.secondary => ElevatedButton(
          onPressed: enabled ? onPressed : null,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.slate900,
            foregroundColor: AppColors.textOnPrimary,
            disabledBackgroundColor: AppColors.slate200,
            disabledForegroundColor: AppColors.textDisabled,
            padding: padding,
            minimumSize: Size(width ?? 0, height),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(AppRadius.lg),
            ),
            elevation: 0,
          ),
          child: child,
        ),
      AppButtonVariant.outline => OutlinedButton(
          onPressed: enabled ? onPressed : null,
          style: OutlinedButton.styleFrom(
            foregroundColor: AppColors.textPrimary,
            disabledForegroundColor: AppColors.textDisabled,
            side: BorderSide(
              color: enabled ? AppColors.border : AppColors.borderLight,
              width: 1.5,
            ),
            padding: padding,
            minimumSize: Size(width ?? 0, height),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(AppRadius.full),
            ),
          ),
          child: child,
        ),
      AppButtonVariant.ghost => TextButton(
          onPressed: enabled ? onPressed : null,
          style: TextButton.styleFrom(
            foregroundColor: AppColors.primary,
            disabledForegroundColor: AppColors.textDisabled,
            padding: padding,
            minimumSize: Size(width ?? 0, height),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(AppRadius.sm),
            ),
          ),
          child: child,
        ),
      AppButtonVariant.danger => ElevatedButton(
          onPressed: enabled ? onPressed : null,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.error,
            foregroundColor: AppColors.textOnPrimary,
            disabledBackgroundColor: AppColors.slate200,
            disabledForegroundColor: AppColors.textDisabled,
            padding: padding,
            minimumSize: Size(width ?? 0, height),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(AppRadius.full),
            ),
            elevation: 0,
          ),
          child: child,
        ),
    };

    if (isFullWidth) {
      return SizedBox(width: double.infinity, child: button);
    }

    return button;
  }

  EdgeInsetsGeometry _getPadding() {
    return switch (size) {
      AppButtonSize.small => const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.sm,
        ),
      AppButtonSize.medium => const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.md,
        ),
      AppButtonSize.large => const EdgeInsets.symmetric(
          horizontal: AppSpacing.xl,
          vertical: AppSpacing.lg,
        ),
    };
  }

  double _getHeight() {
    return switch (size) {
      AppButtonSize.small => 36,
      AppButtonSize.medium => 48,
      AppButtonSize.large => 56,
    };
  }

  TextStyle _getTextStyle() {
    return switch (size) {
      AppButtonSize.small => AppTypography.buttonSmall,
      AppButtonSize.medium => AppTypography.buttonMedium,
      AppButtonSize.large => AppTypography.buttonLarge,
    };
  }

  double _getIconSize() {
    return switch (size) {
      AppButtonSize.small => 16,
      AppButtonSize.medium => 20,
      AppButtonSize.large => 24,
    };
  }

  Color _getLoadingColor() {
    return switch (variant) {
      AppButtonVariant.primary ||
      AppButtonVariant.secondary ||
      AppButtonVariant.danger =>
        AppColors.textOnPrimary,
      AppButtonVariant.outline => AppColors.textPrimary,
      AppButtonVariant.ghost => AppColors.primary,
    };
  }
}

/// Button size variants
enum AppButtonSize { small, medium, large }

/// Button style variants
enum AppButtonVariant { primary, secondary, outline, ghost, danger }

/// Icon Button with circular shape
class AppIconButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onPressed;
  final AppIconButtonSize size;
  final AppIconButtonVariant variant;
  final String? tooltip;
  final bool isLoading;
  final Color? iconColor;
  final Color? backgroundColor;

  const AppIconButton({
    super.key,
    required this.icon,
    this.onPressed,
    this.size = AppIconButtonSize.medium,
    this.variant = AppIconButtonVariant.ghost,
    this.tooltip,
    this.isLoading = false,
    this.iconColor,
    this.backgroundColor,
  });

  @override
  Widget build(BuildContext context) {
    final double buttonSize = _getSize();
    final double iconSize = _getIconSize();

    Widget button = Container(
      width: buttonSize,
      height: buttonSize,
      decoration: BoxDecoration(
        color: backgroundColor ?? _getBackgroundColor(),
        shape: BoxShape.circle,
        border: variant == AppIconButtonVariant.outline
            ? Border.all(color: AppColors.border, width: 1.5)
            : null,
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: isLoading ? null : onPressed,
          borderRadius: BorderRadius.circular(buttonSize / 2),
          child: Center(
            child: isLoading
                ? SizedBox(
                    width: iconSize,
                    height: iconSize,
                    child: const CircularProgressIndicator(strokeWidth: 2),
                  )
                : Icon(
                    icon,
                    size: iconSize,
                    color: iconColor ?? _getIconColor(),
                  ),
          ),
        ),
      ),
    );

    if (tooltip != null) {
      button = Tooltip(message: tooltip!, child: button);
    }

    return button;
  }

  double _getSize() {
    return switch (size) {
      AppIconButtonSize.small => 32,
      AppIconButtonSize.medium => 40,
      AppIconButtonSize.large => 48,
    };
  }

  double _getIconSize() {
    return switch (size) {
      AppIconButtonSize.small => 16,
      AppIconButtonSize.medium => 20,
      AppIconButtonSize.large => 24,
    };
  }

  Color _getBackgroundColor() {
    return switch (variant) {
      AppIconButtonVariant.filled => AppColors.slate100,
      AppIconButtonVariant.primary => AppColors.primary,
      AppIconButtonVariant.ghost => Colors.transparent,
      AppIconButtonVariant.outline => Colors.transparent,
    };
  }

  Color _getIconColor() {
    return switch (variant) {
      AppIconButtonVariant.filled => AppColors.textSecondary,
      AppIconButtonVariant.primary => AppColors.textOnPrimary,
      AppIconButtonVariant.ghost => AppColors.textSecondary,
      AppIconButtonVariant.outline => AppColors.textSecondary,
    };
  }
}

enum AppIconButtonSize { small, medium, large }

enum AppIconButtonVariant { filled, primary, ghost, outline }
