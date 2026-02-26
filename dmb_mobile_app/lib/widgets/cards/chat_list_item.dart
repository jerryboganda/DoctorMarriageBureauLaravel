import 'package:flutter/material.dart';

import '../../core/core.dart';
import '../../models/models.dart';

/// Chat list item widget for Messages view
/// Transpiled from MessagesView.tsx chat items
class ChatListItem extends StatelessWidget {
  final Chat chat;
  final bool isSelected;
  final VoidCallback? onTap;

  const ChatListItem({
    super.key,
    required this.chat,
    this.isSelected = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color:
          isSelected ? AppColors.primary.withOpacity(0.05) : Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(AppSpacing.md),
          decoration: BoxDecoration(
            border: Border(
              left: isSelected
                  ? BorderSide(color: AppColors.primary, width: 4)
                  : BorderSide.none,
              bottom: BorderSide(color: AppColors.slate50, width: 1),
            ),
          ),
          child: Row(
            children: [
              // Avatar
              Stack(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: AppColors.slate200,
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: _buildAvatar(),
                  ),
                  if (chat.isOnline)
                    Positioned(
                      bottom: 0,
                      right: 0,
                      child: Container(
                        width: 12,
                        height: 12,
                        decoration: BoxDecoration(
                          color: AppColors.success,
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 2),
                        ),
                      ),
                    ),
                ],
              ),

              const SizedBox(width: AppSpacing.md),

              // Content
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Row(
                            children: [
                              Flexible(
                                child: Text(
                                  _getChatName(),
                                  style: AppTypography.titleSmall.copyWith(
                                    fontWeight: chat.unreadCount > 0
                                        ? FontWeight.w700
                                        : FontWeight.w600,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              if (chat.type == ChatType.matchmaker)
                                Container(
                                  margin: const EdgeInsets.only(left: 6),
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 6,
                                    vertical: 2,
                                  ),
                                  decoration: BoxDecoration(
                                    color: AppColors.purple.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Text(
                                    'Agent',
                                    style: AppTypography.caption.copyWith(
                                      color: AppColors.purple,
                                      fontWeight: FontWeight.w700,
                                      fontSize: 9,
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ),
                        Text(
                          chat.lastMessage?.timestamp ?? '',
                          style: AppTypography.caption.copyWith(
                            color: AppColors.textTertiary,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            _getLastMessagePreview(),
                            style: AppTypography.bodySmall.copyWith(
                              color: chat.unreadCount > 0
                                  ? AppColors.slate800
                                  : AppColors.textSecondary,
                              fontWeight: chat.unreadCount > 0
                                  ? FontWeight.w600
                                  : FontWeight.w400,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (chat.unreadCount > 0)
                          Container(
                            margin: const EdgeInsets.only(left: 8),
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: AppColors.primary,
                              borderRadius:
                                  BorderRadius.circular(AppRadius.full),
                            ),
                            child: Text(
                              '${chat.unreadCount}',
                              style: AppTypography.caption.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.w700,
                                fontSize: 10,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAvatar() {
    if (chat.type == ChatType.group && chat.participants.length >= 2) {
      // Grid of two participants
      return Row(
        children: [
          Expanded(
            child: _buildParticipantImage(0),
          ),
          Expanded(
            child: _buildParticipantImage(1),
          ),
        ],
      );
    }

    // Single participant
    if (chat.participants.isNotEmpty &&
        chat.participants.first.avatarUrl.isNotEmpty) {
      return Image.network(
        chat.participants.first.avatarUrl,
        fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => _buildAvatarPlaceholder(),
      );
    }
    return _buildAvatarPlaceholder();
  }

  Widget _buildParticipantImage(int index) {
    if (index < chat.participants.length) {
      final participant = chat.participants[index];
      if (participant.avatarUrl.isNotEmpty) {
        return Image.network(
          participant.avatarUrl,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => _buildAvatarPlaceholder(),
        );
      }
    }
    return _buildAvatarPlaceholder();
  }

  Widget _buildAvatarPlaceholder() {
    IconData icon;
    switch (chat.type) {
      case ChatType.group:
        icon = Icons.people;
      case ChatType.matchmaker:
        icon = Icons.support_agent;
      default:
        icon = Icons.person;
    }
    return Container(
      color: AppColors.slate200,
      child: Center(
        child: Icon(icon, size: 20, color: AppColors.slate400),
      ),
    );
  }

  String _getChatName() {
    if (chat.type == ChatType.group) {
      return 'Family Group';
    }
    if (chat.participants.isNotEmpty) {
      return chat.participants.first.name;
    }
    return 'Unknown';
  }

  String _getLastMessagePreview() {
    final lastMessage = chat.lastMessage;
    if (lastMessage == null) return '';

    String prefix = '';
    if (lastMessage.senderId == 'me') {
      prefix = 'You: ';
    }
    return '$prefix${lastMessage.text}';
  }
}
