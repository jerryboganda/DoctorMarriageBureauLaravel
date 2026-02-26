import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/core.dart';

/// Notifications Screen - Activity feed
/// Transpiled from NotificationsView.tsx
class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Mock notifications
    final notifications = [
      _Notification(
        type: 'match',
        title: 'New Match!',
        message: 'You matched with Dr. Aditi Sharma (98% compatibility)',
        time: '2 hours ago',
        isRead: false,
        icon: Icons.favorite,
        iconColor: AppColors.primary,
      ),
      _Notification(
        type: 'view',
        title: 'Profile View',
        message: 'Dr. Raj Patel viewed your profile',
        time: '3 hours ago',
        isRead: false,
        icon: Icons.visibility,
        iconColor: AppColors.info,
      ),
      _Notification(
        type: 'message',
        title: 'New Message',
        message: 'Dr. Emily Chen sent you a message',
        time: '5 hours ago',
        isRead: false,
        icon: Icons.chat_bubble,
        iconColor: AppColors.success,
      ),
      _Notification(
        type: 'like',
        title: 'Profile Liked',
        message: 'Dr. Priya Singh liked your profile',
        time: 'Yesterday',
        isRead: true,
        icon: Icons.thumb_up,
        iconColor: AppColors.warning,
      ),
      _Notification(
        type: 'system',
        title: 'Profile Tip',
        message: 'Add a bio to increase your match rate by 40%',
        time: 'Yesterday',
        isRead: true,
        icon: Icons.lightbulb,
        iconColor: AppColors.slate500,
      ),
      _Notification(
        type: 'verified',
        title: 'Verification Complete',
        message: 'Your medical license has been verified',
        time: '2 days ago',
        isRead: true,
        icon: Icons.verified,
        iconColor: AppColors.success,
      ),
    ];

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
        title: const Text('Notifications'),
        actions: [
          TextButton(
            onPressed: () {
              // TODO: Mark all as read
            },
            child: Text(
              'Mark all read',
              style: AppTypography.labelMedium.copyWith(
                color: AppColors.primary,
              ),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter Tabs
          Padding(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Row(
              children: [
                _buildFilterChip('All', true),
                const SizedBox(width: AppSpacing.sm),
                _buildFilterChip('Unread', false),
                const SizedBox(width: AppSpacing.sm),
                _buildFilterChip('Matches', false),
                const SizedBox(width: AppSpacing.sm),
                _buildFilterChip('Messages', false),
              ],
            ),
          ),

          // Notifications List
          Expanded(
            child: ListView.separated(
              itemCount: notifications.length,
              separatorBuilder: (context, index) => const Divider(height: 1),
              itemBuilder: (context, index) {
                final notification = notifications[index];
                return _NotificationTile(notification: notification);
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, bool isSelected) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.sm,
      ),
      decoration: BoxDecoration(
        color: isSelected ? AppColors.slate900 : Colors.white,
        borderRadius: BorderRadius.circular(AppRadius.full),
        border: Border.all(
          color: isSelected ? AppColors.slate900 : AppColors.border,
        ),
      ),
      child: Text(
        label,
        style: AppTypography.labelMedium.copyWith(
          color: isSelected ? Colors.white : AppColors.textSecondary,
        ),
      ),
    );
  }
}

class _NotificationTile extends StatelessWidget {
  final _Notification notification;

  const _NotificationTile({required this.notification});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: notification.isRead
          ? Colors.white
          : AppColors.primaryLight.withOpacity(0.3),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.sm,
        ),
        leading: Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: notification.iconColor.withOpacity(0.1),
            shape: BoxShape.circle,
          ),
          child: Icon(
            notification.icon,
            color: notification.iconColor,
            size: 24,
          ),
        ),
        title: Row(
          children: [
            Expanded(
              child: Text(
                notification.title,
                style: AppTypography.titleSmall.copyWith(
                  fontWeight:
                      notification.isRead ? FontWeight.w500 : FontWeight.w700,
                ),
              ),
            ),
            if (!notification.isRead)
              Container(
                width: 8,
                height: 8,
                decoration: const BoxDecoration(
                  color: AppColors.primary,
                  shape: BoxShape.circle,
                ),
              ),
          ],
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: AppSpacing.xxs),
            Text(
              notification.message,
              style: AppTypography.bodySmall.copyWith(
                color: AppColors.textSecondary,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: AppSpacing.xs),
            Text(
              notification.time,
              style: AppTypography.caption,
            ),
          ],
        ),
        onTap: () {
          // TODO: Navigate to relevant screen
        },
      ),
    );
  }
}

class _Notification {
  final String type;
  final String title;
  final String message;
  final String time;
  final bool isRead;
  final IconData icon;
  final Color iconColor;

  _Notification({
    required this.type,
    required this.title,
    required this.message,
    required this.time,
    required this.isRead,
    required this.icon,
    required this.iconColor,
  });
}
