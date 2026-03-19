import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../utils/avatar_resolver.dart';

/// Circle avatar with fallback + online indicator dot
class DmbAvatar extends StatelessWidget {
  final String? imageUrl;
  final double size;
  final bool showOnlineIndicator;
  final bool isOnline;
  final bool showBorder;
  final VoidCallback? onTap;

  const DmbAvatar({
    super.key,
    this.imageUrl,
    this.size = 48,
    this.showOnlineIndicator = false,
    this.isOnline = false,
    this.showBorder = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final url = resolveAvatarUrl(imageUrl);

    return GestureDetector(
      onTap: onTap,
      child: SizedBox(
        width: size,
        height: size,
        child: Stack(
          children: [
            Container(
              width: size,
              height: size,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: showBorder
                    ? Border.all(color: AppColors.primary, width: 2)
                    : null,
              ),
              child: ClipOval(
                child: CachedNetworkImage(
                  imageUrl: url,
                  width: size,
                  height: size,
                  fit: BoxFit.cover,
                  placeholder: (context, url) => Container(
                    color: AppColors.slate200,
                    child: Icon(
                      Icons.person,
                      size: size * 0.5,
                      color: AppColors.slate400,
                    ),
                  ),
                  errorWidget: (context, url, error) => Container(
                    color: AppColors.slate200,
                    child: Icon(
                      Icons.person,
                      size: size * 0.5,
                      color: AppColors.slate400,
                    ),
                  ),
                ),
              ),
            ),
            if (showOnlineIndicator && isOnline)
              Positioned(
                right: 0,
                bottom: 0,
                child: Container(
                  width: size * 0.25,
                  height: size * 0.25,
                  decoration: BoxDecoration(
                    color: AppColors.success,
                    shape: BoxShape.circle,
                    border: Border.all(color: AppColors.white, width: 2),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
