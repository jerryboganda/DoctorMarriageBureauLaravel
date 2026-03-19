import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_decorations.dart';

enum DmbButtonVariant { primary, secondary, outline, danger, ghost }

/// Reusable button matching React frontend button styles with BTN_TAP scale animation
class DmbButton extends StatefulWidget {
  final String text;
  final VoidCallback? onPressed;
  final DmbButtonVariant variant;
  final bool isLoading;
  final bool isFullWidth;
  final IconData? icon;
  final double? height;
  final EdgeInsets? padding;

  const DmbButton({
    super.key,
    required this.text,
    this.onPressed,
    this.variant = DmbButtonVariant.primary,
    this.isLoading = false,
    this.isFullWidth = true,
    this.icon,
    this.height,
    this.padding,
  });

  @override
  State<DmbButton> createState() => _DmbButtonState();
}

class _DmbButtonState extends State<DmbButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _scaleController;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _scaleController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 100),
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.97).animate(
      CurvedAnimation(parent: _scaleController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _scaleController.dispose();
    super.dispose();
  }

  Color get _backgroundColor {
    switch (widget.variant) {
      case DmbButtonVariant.primary:
        return AppColors.primary;
      case DmbButtonVariant.secondary:
        return AppColors.slate100;
      case DmbButtonVariant.outline:
      case DmbButtonVariant.ghost:
        return Colors.transparent;
      case DmbButtonVariant.danger:
        return AppColors.error;
    }
  }

  Color get _foregroundColor {
    switch (widget.variant) {
      case DmbButtonVariant.primary:
      case DmbButtonVariant.danger:
        return AppColors.white;
      case DmbButtonVariant.secondary:
        return AppColors.slate700;
      case DmbButtonVariant.outline:
        return AppColors.primary;
      case DmbButtonVariant.ghost:
        return AppColors.primary;
    }
  }

  Border? get _border {
    if (widget.variant == DmbButtonVariant.outline) {
      return Border.all(color: AppColors.primary, width: 1.5);
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _scaleAnimation,
      builder: (context, child) => Transform.scale(
        scale: _scaleAnimation.value,
        child: child,
      ),
      child: GestureDetector(
        onTapDown: (_) => _scaleController.forward(),
        onTapUp: (_) {
          _scaleController.reverse();
          if (!widget.isLoading) widget.onPressed?.call();
        },
        onTapCancel: () => _scaleController.reverse(),
        child: Container(
          width: widget.isFullWidth ? double.infinity : null,
          height: widget.height ?? AppDecorations.buttonHeight,
          padding: widget.padding ??
              const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          decoration: BoxDecoration(
            color: widget.onPressed == null
                ? AppColors.slate200
                : _backgroundColor,
            borderRadius: BorderRadius.circular(AppDecorations.radiusXl),
            border: _border,
          ),
          child: Center(
            child: widget.isLoading
                ? SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: _foregroundColor,
                    ),
                  )
                : Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (widget.icon != null) ...[
                        Icon(widget.icon, size: 18, color: _foregroundColor),
                        const SizedBox(width: 8),
                      ],
                      Text(
                        widget.text,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: widget.onPressed == null
                              ? AppColors.slate400
                              : _foregroundColor,
                        ),
                      ),
                    ],
                  ),
          ),
        ),
      ),
    );
  }
}
