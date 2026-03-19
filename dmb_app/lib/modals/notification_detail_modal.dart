import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../models/notification_model.dart';
import '../theme/app_colors.dart';
import '../theme/app_decorations.dart';
import '../widgets/dmb_avatar.dart';
import '../widgets/dmb_button.dart';

// ---------------------------------------------------------------------------
// Show helper
// ---------------------------------------------------------------------------

Future<void> showNotificationDetailModal(
  BuildContext context, {
  required AppNotification notification,
  bool isLoading = false,
  bool showOpenAction = false,
  VoidCallback? onClose,
  VoidCallback? onOpenRelated,
}) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => NotificationDetailModal(
      notification: notification,
      isLoading: isLoading,
      showOpenAction: showOpenAction,
      onClose: onClose ?? () => Navigator.of(context).pop(),
      onOpenRelated: onOpenRelated,
    ),
  );
}

// ---------------------------------------------------------------------------
// Notification type label/icon mapping
// ---------------------------------------------------------------------------

class _NotifTypeMeta {
  final String label;
  final IconData icon;
  const _NotifTypeMeta(this.label, this.icon);
}

_NotifTypeMeta _resolveTypeMeta(String type) {
  switch (type) {
    case 'express_interest':
      return const _NotifTypeMeta('Proposal', LucideIcons.heart);
    case 'accept_interest':
      return const _NotifTypeMeta('Accepted Proposal', LucideIcons.heartHandshake);
    case 'reject_interest':
    case 'interest_rejected':
      return const _NotifTypeMeta('Rejected Proposal', LucideIcons.heartOff);
    case 'profile_viewed':
    case 'profile_view':
      return const _NotifTypeMeta('Profile Views', LucideIcons.eye);
    case 'gallery_image_view':
    case 'profile_picture_view':
      return const _NotifTypeMeta('Gallery Views', LucideIcons.image);
    case 'chat_message':
    case 'new_message':
      return const _NotifTypeMeta('Messages', LucideIcons.messageSquare);
    default:
      return const _NotifTypeMeta('Updates', LucideIcons.bell);
  }
}

// ---------------------------------------------------------------------------
// Widget
// ---------------------------------------------------------------------------

class NotificationDetailModal extends StatelessWidget {
  final AppNotification notification;
  final bool isLoading;
  final bool showOpenAction;
  final VoidCallback onClose;
  final VoidCallback? onOpenRelated;

  const NotificationDetailModal({
    super.key,
    required this.notification,
    this.isLoading = false,
    this.showOpenAction = false,
    required this.onClose,
    this.onOpenRelated,
  });

  @override
  Widget build(BuildContext context) {
    final height = MediaQuery.of(context).size.height * 0.92;
    final typeMeta = _resolveTypeMeta(notification.type);

    return Container(
      height: height,
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: const BorderRadius.vertical(
          top: Radius.circular(AppDecorations.radiusXxl),
        ),
      ),
      child: Column(
        children: [
          // Drag handle
          Container(
            margin: const EdgeInsets.only(top: 12, bottom: 8),
            width: 36,
            height: 4,
            decoration: BoxDecoration(
              color: AppColors.slate300,
              borderRadius: BorderRadius.circular(2),
            ),
          ),

          // Header
          _buildHeader(context),

          // Scrollable content
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Image + metadata card
                  _buildMetadataCard(typeMeta),

                  const SizedBox(height: 24),

                  // Full details section
                  _buildDetailsSection(),
                ],
              ),
            ),
          ),

          // Footer
          _buildFooter(context),
        ],
      ),
    );
  }

  // ── Header ──

  Widget _buildHeader(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: AppColors.slate100)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'NOTIFICATION DETAIL',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: AppColors.primary,
                    letterSpacing: 1.2,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  notification.title ?? 'Notification',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: AppColors.slate900,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          GestureDetector(
            onTap: onClose,
            child: Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: AppColors.slate100,
                borderRadius: BorderRadius.circular(AppDecorations.radiusFull),
              ),
              child: const Icon(LucideIcons.x, size: 18, color: AppColors.slate400),
            ),
          ),
        ],
      ),
    );
  }

  // ── Metadata card ──

  Widget _buildMetadataCard(_NotifTypeMeta typeMeta) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.primary5,
        borderRadius: BorderRadius.circular(AppDecorations.radiusXxl),
        border: Border.all(color: AppColors.primary10),
      ),
      child: Column(
        children: [
          // Photo + badges
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 16),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Photo
                Container(
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: AppColors.primary, width: 2),
                  ),
                  child: DmbAvatar(
                    imageUrl: notification.image,
                    size: 64,
                  ),
                ),
                const SizedBox(width: 16),

                // Badges
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Type badge
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 5,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.primary10,
                          borderRadius: BorderRadius.circular(AppDecorations.radiusFull),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(typeMeta.icon, size: 13, color: AppColors.primary),
                            const SizedBox(width: 6),
                            Text(
                              typeMeta.label,
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: AppColors.primary,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 8),

                      // Read status badge
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 5,
                        ),
                        decoration: BoxDecoration(
                          color: notification.isRead
                              ? const Color(0xFFDCFCE7) // green-100
                              : const Color(0xFFFEF3C7), // amber-100
                          borderRadius: BorderRadius.circular(AppDecorations.radiusFull),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              notification.isRead
                                  ? LucideIcons.checkCircle2
                                  : LucideIcons.clock,
                              size: 12,
                              color: notification.isRead
                                  ? AppColors.success
                                  : const Color(0xFFD97706), // amber-600
                            ),
                            const SizedBox(width: 5),
                            Text(
                              notification.isRead ? 'Read' : 'Unread',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: notification.isRead
                                    ? AppColors.success
                                    : const Color(0xFFD97706),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Grid: time + sender
          Container(
            padding: const EdgeInsets.all(16),
            decoration: const BoxDecoration(
              border: Border(
                top: BorderSide(color: AppColors.slate200, width: 0.5),
              ),
            ),
            child: Row(
              children: [
                // Time received
                Expanded(
                  child: Row(
                    children: [
                      const Icon(LucideIcons.clock, size: 14, color: AppColors.slate400),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Received',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w500,
                                color: AppColors.slate400,
                                letterSpacing: 0.5,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              _formatDate(notification.createdAt),
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: AppColors.slate700,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                Container(
                  width: 1,
                  height: 32,
                  color: AppColors.slate200,
                ),
                const SizedBox(width: 16),

                // Sender name
                Expanded(
                  child: Row(
                    children: [
                      const Icon(LucideIcons.user, size: 14, color: AppColors.slate400),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'From',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w500,
                                color: AppColors.slate400,
                                letterSpacing: 0.5,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              notification.senderName ?? 'System',
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: AppColors.slate700,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── Details section ──

  Widget _buildDetailsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Label
        Row(
          children: const [
            Icon(LucideIcons.info, size: 16, color: AppColors.primary),
            SizedBox(width: 8),
            Text(
              'FULL DETAILS',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: AppColors.primary,
                letterSpacing: 1.2,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),

        // Full message
        if (isLoading)
          const Center(
            child: Padding(
              padding: EdgeInsets.all(32),
              child: CircularProgressIndicator(
                color: AppColors.primary,
                strokeWidth: 2.5,
              ),
            ),
          )
        else
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.slate50,
              borderRadius: BorderRadius.circular(AppDecorations.radiusXl),
              border: Border.all(color: AppColors.slate100),
            ),
            child: Text(
              notification.message ?? 'No additional details available.',
              style: const TextStyle(
                fontSize: 14,
                color: AppColors.slate700,
                height: 1.6,
              ),
            ),
          ),
      ],
    );
  }

  // ── Footer ──

  Widget _buildFooter(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
      decoration: const BoxDecoration(
        color: AppColors.slate50,
        border: Border(top: BorderSide(color: AppColors.slate100)),
      ),
      child: Row(
        children: [
          Expanded(
            child: DmbButton(
              text: 'Close',
              variant: DmbButtonVariant.secondary,
              onPressed: onClose,
            ),
          ),
          if (showOpenAction && onOpenRelated != null) ...[
            const SizedBox(width: 12),
            Expanded(
              child: DmbButton(
                text: 'Open Related Page',
                icon: LucideIcons.externalLink,
                onPressed: () {
                  onClose();
                  onOpenRelated!();
                },
              ),
            ),
          ],
        ],
      ),
    );
  }

  // ── Helpers ──

  String _formatDate(String dateStr) {
    if (dateStr.isEmpty) return 'Unknown';
    try {
      final dt = DateTime.parse(dateStr);
      final now = DateTime.now();
      final diff = now.difference(dt);

      if (diff.inMinutes < 1) return 'Just now';
      if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
      if (diff.inHours < 24) return '${diff.inHours}h ago';
      if (diff.inDays < 7) return '${diff.inDays}d ago';

      return '${dt.day}/${dt.month}/${dt.year}';
    } catch (_) {
      return dateStr;
    }
  }
}
