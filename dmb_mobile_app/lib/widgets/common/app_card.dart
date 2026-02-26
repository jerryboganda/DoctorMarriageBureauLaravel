import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../core/theme/theme.dart';
import '../../core/constants/app_constants.dart';

/// App Card - Base card component with DMB styling
/// Equivalent to React's card component styles
class AppCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final VoidCallback? onTap;
  final bool isSelected;
  final bool showBorder;
  final Color? backgroundColor;
  final double? borderRadius;
  final BoxShadow? shadow;

  const AppCard({
    super.key,
    required this.child,
    this.padding,
    this.margin,
    this.onTap,
    this.isSelected = false,
    this.showBorder = true,
    this.backgroundColor,
    this.borderRadius,
    this.shadow,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: margin,
      decoration: BoxDecoration(
        color: backgroundColor ?? AppColors.surface,
        borderRadius: BorderRadius.circular(borderRadius ?? AppRadius.lg),
        border: showBorder
            ? Border.all(
                color: isSelected ? AppColors.primary : AppColors.border,
                width: isSelected ? 2 : 1,
              )
            : null,
        boxShadow: shadow != null ? [shadow!] : null,
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(borderRadius ?? AppRadius.lg),
          child: Padding(
            padding: padding ?? const EdgeInsets.all(AppSpacing.md),
            child: child,
          ),
        ),
      ),
    );
  }
}

/// Avatar component with online indicator
class AppAvatar extends StatelessWidget {
  final String? imageUrl;
  final String? name;
  final double size;
  final bool isOnline;
  final bool showOnlineIndicator;
  final bool isVerified;
  final VoidCallback? onTap;

  const AppAvatar({
    super.key,
    this.imageUrl,
    this.name,
    this.size = 48,
    this.isOnline = false,
    this.showOnlineIndicator = false,
    this.isVerified = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    Widget avatar = Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: AppColors.slate200,
        border: Border.all(
          color: AppColors.border,
          width: 2,
        ),
      ),
      child: ClipOval(
        child: imageUrl != null && imageUrl!.isNotEmpty
            ? CachedNetworkImage(
                imageUrl: imageUrl!,
                fit: BoxFit.cover,
                placeholder: (context, url) => _buildPlaceholder(),
                errorWidget: (context, url, error) => _buildPlaceholder(),
              )
            : _buildPlaceholder(),
      ),
    );

    if (showOnlineIndicator || isVerified) {
      avatar = Stack(
        children: [
          avatar,
          if (showOnlineIndicator)
            Positioned(
              right: 0,
              bottom: 0,
              child: Container(
                width: size * 0.25,
                height: size * 0.25,
                decoration: BoxDecoration(
                  color: isOnline ? AppColors.online : AppColors.offline,
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: AppColors.surface,
                    width: 2,
                  ),
                ),
              ),
            ),
          if (isVerified)
            Positioned(
              right: 0,
              bottom: 0,
              child: Container(
                padding: const EdgeInsets.all(2),
                decoration: const BoxDecoration(
                  color: AppColors.surface,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.verified,
                  size: size * 0.3,
                  color: AppColors.success,
                ),
              ),
            ),
        ],
      );
    }

    if (onTap != null) {
      return GestureDetector(
        onTap: onTap,
        child: avatar,
      );
    }

    return avatar;
  }

  Widget _buildPlaceholder() {
    if (name != null && name!.isNotEmpty) {
      final initials = name!
          .split(' ')
          .take(2)
          .map((e) => e.isNotEmpty ? e[0].toUpperCase() : '')
          .join();
      return Center(
        child: Text(
          initials,
          style: AppTypography.titleMedium.copyWith(
            color: AppColors.textSecondary,
            fontSize: size * 0.35,
          ),
        ),
      );
    }
    return Icon(
      Icons.person,
      size: size * 0.5,
      color: AppColors.textMuted,
    );
  }
}

/// Badge component for status indicators
class AppBadge extends StatelessWidget {
  final String label;
  final AppBadgeVariant variant;
  final IconData? icon;
  final bool showDot;

  const AppBadge({
    super.key,
    required this.label,
    this.variant = AppBadgeVariant.neutral,
    this.icon,
    this.showDot = false,
  });

  const AppBadge.success({
    super.key,
    required this.label,
    this.icon,
    this.showDot = false,
  }) : variant = AppBadgeVariant.success;

  const AppBadge.error({
    super.key,
    required this.label,
    this.icon,
    this.showDot = false,
  }) : variant = AppBadgeVariant.error;

  const AppBadge.warning({
    super.key,
    required this.label,
    this.icon,
    this.showDot = false,
  }) : variant = AppBadgeVariant.warning;

  const AppBadge.info({
    super.key,
    required this.label,
    this.icon,
    this.showDot = false,
  }) : variant = AppBadgeVariant.info;

  const AppBadge.primary({
    super.key,
    required this.label,
    this.icon,
    this.showDot = false,
  }) : variant = AppBadgeVariant.primary;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: AppSpacing.xs,
      ),
      decoration: BoxDecoration(
        color: _getBackgroundColor(),
        borderRadius: BorderRadius.circular(AppRadius.full),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (showDot) ...[
            Container(
              width: 6,
              height: 6,
              decoration: BoxDecoration(
                color: _getForegroundColor(),
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: AppSpacing.xs),
          ],
          if (icon != null) ...[
            Icon(
              icon,
              size: 12,
              color: _getForegroundColor(),
            ),
            const SizedBox(width: AppSpacing.xs),
          ],
          Text(
            label,
            style: AppTypography.badge.copyWith(
              color: _getForegroundColor(),
            ),
          ),
        ],
      ),
    );
  }

  Color _getBackgroundColor() {
    return switch (variant) {
      AppBadgeVariant.neutral => AppColors.slate100,
      AppBadgeVariant.primary => AppColors.primaryLight,
      AppBadgeVariant.success => AppColors.successLight,
      AppBadgeVariant.error => AppColors.errorLight,
      AppBadgeVariant.warning => AppColors.warningLight,
      AppBadgeVariant.info => AppColors.infoLight,
      AppBadgeVariant.premium => AppColors.premiumLight,
    };
  }

  Color _getForegroundColor() {
    return switch (variant) {
      AppBadgeVariant.neutral => AppColors.textSecondary,
      AppBadgeVariant.primary => AppColors.primary,
      AppBadgeVariant.success => AppColors.successDark,
      AppBadgeVariant.error => AppColors.errorDark,
      AppBadgeVariant.warning => AppColors.warningDark,
      AppBadgeVariant.info => AppColors.infoDark,
      AppBadgeVariant.premium => AppColors.premium,
    };
  }
}

enum AppBadgeVariant {
  neutral,
  primary,
  success,
  error,
  warning,
  info,
  premium,
}

/// Match percentage indicator
class AppMatchIndicator extends StatelessWidget {
  final int percentage;
  final double size;
  final bool showLabel;

  const AppMatchIndicator({
    super.key,
    required this.percentage,
    this.size = 60,
    this.showLabel = true,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        SizedBox(
          width: size,
          height: size,
          child: Stack(
            fit: StackFit.expand,
            children: [
              CircularProgressIndicator(
                value: percentage / 100,
                strokeWidth: 4,
                backgroundColor: AppColors.slate200,
                valueColor: AlwaysStoppedAnimation<Color>(
                  _getColor(),
                ),
              ),
              Center(
                child: Text(
                  '$percentage%',
                  style: AppTypography.titleMedium.copyWith(
                    color: _getColor(),
                    fontWeight: FontWeight.bold,
                    fontSize: size * 0.25,
                  ),
                ),
              ),
            ],
          ),
        ),
        if (showLabel) ...[
          const SizedBox(height: AppSpacing.xs),
          Text(
            'Match',
            style: AppTypography.caption.copyWith(
              color: AppColors.textMuted,
            ),
          ),
        ],
      ],
    );
  }

  Color _getColor() {
    if (percentage >= 80) return AppColors.success;
    if (percentage >= 60) return AppColors.primary;
    if (percentage >= 40) return AppColors.warning;
    return AppColors.textMuted;
  }
}

/// Chip/Tag component
class AppChip extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback? onTap;
  final IconData? icon;
  final bool showClose;
  final VoidCallback? onClose;

  const AppChip({
    super.key,
    required this.label,
    this.isSelected = false,
    this.onTap,
    this.icon,
    this.showClose = false,
    this.onClose,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppRadius.full),
        child: Container(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.md,
            vertical: AppSpacing.sm,
          ),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.primaryLight : AppColors.slate100,
            borderRadius: BorderRadius.circular(AppRadius.full),
            border: Border.all(
              color: isSelected ? AppColors.primary : Colors.transparent,
              width: 1,
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null) ...[
                Icon(
                  icon,
                  size: 16,
                  color: isSelected ? AppColors.primary : AppColors.textSecondary,
                ),
                const SizedBox(width: AppSpacing.xs),
              ],
              Text(
                label,
                style: AppTypography.labelMedium.copyWith(
                  color: isSelected ? AppColors.primary : AppColors.textPrimary,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                ),
              ),
              if (showClose) ...[
                const SizedBox(width: AppSpacing.xs),
                GestureDetector(
                  onTap: onClose,
                  child: Icon(
                    Icons.close,
                    size: 16,
                    color: isSelected ? AppColors.primary : AppColors.textSecondary,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
