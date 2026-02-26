import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/core.dart';
import '../../models/models.dart';
import '../../providers/providers.dart';
import '../../routes/route_names.dart';
import '../../widgets/widgets.dart';

/// Messages tab filter
enum MessagesTab { primary, requests }

/// Messages Screen - Chat list view
/// Transpiled from MessagesView.tsx
class MessagesScreen extends ConsumerStatefulWidget {
  const MessagesScreen({super.key});

  @override
  ConsumerState<MessagesScreen> createState() => _MessagesScreenState();
}

class _MessagesScreenState extends ConsumerState<MessagesScreen> {
  final _searchController = TextEditingController();
  MessagesTab _activeTab = MessagesTab.primary;
  String? _selectedChatId;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final chatsState = ref.watch(chatsProvider);
    final isWideScreen = MediaQuery.of(context).size.width > 600;

    if (chatsState.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (chatsState.error != null) {
      return Center(child: Text('Error: ${chatsState.error}'));
    }

    return _buildContent(chatsState.chats, isWideScreen);
  }

  Widget _buildContent(List<Chat> chats, bool isWideScreen) {
    // Filter chats by tab
    final displayedChats = chats.where((c) {
      if (_activeTab == MessagesTab.requests) {
        return c.isRequest;
      }
      return !c.isRequest;
    }).toList();

    final requestCount = chats.where((c) => c.isRequest).length;

    if (isWideScreen) {
      // Two-column layout for tablets
      return Row(
        children: [
          // Chat List
          SizedBox(
            width: 320,
            child: _buildChatList(displayedChats, requestCount),
          ),
          // Chat Detail
          Expanded(
            child: _selectedChatId != null
                ? _buildChatDetail(
                    chats.firstWhere((c) => c.id == _selectedChatId))
                : _buildEmptyState(),
          ),
        ],
      );
    }

    // Mobile: only chat list
    return _buildChatList(displayedChats, requestCount);
  }

  Widget _buildChatList(List<Chat> chats, int requestCount) {
    return Column(
      children: [
        // Header & Search
        Container(
          padding: const EdgeInsets.all(AppSpacing.md),
          decoration: BoxDecoration(
            color: Colors.white,
            border: Border(bottom: BorderSide(color: AppColors.slate100)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Messages', style: AppTypography.headlineSmall),
              const SizedBox(height: AppSpacing.md),
              TextField(
                controller: _searchController,
                decoration: InputDecoration(
                  hintText: 'Search conversations...',
                  hintStyle: AppTypography.bodySmall.copyWith(
                    color: AppColors.slate400,
                  ),
                  prefixIcon:
                      Icon(Icons.search, size: 20, color: AppColors.slate400),
                  filled: true,
                  fillColor: AppColors.slate100,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(AppRadius.md),
                    borderSide: BorderSide.none,
                  ),
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.md,
                    vertical: AppSpacing.sm,
                  ),
                  isDense: true,
                ),
              ),
            ],
          ),
        ),

        // Tabs
        Container(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.sm,
            vertical: AppSpacing.xs,
          ),
          decoration: BoxDecoration(
            color: Colors.white,
            border: Border(bottom: BorderSide(color: AppColors.slate100)),
          ),
          child: Row(
            children: [
              _buildTabButton('Primary', MessagesTab.primary),
              const SizedBox(width: AppSpacing.xs),
              _buildTabButton('Requests', MessagesTab.requests,
                  badgeCount: requestCount),
            ],
          ),
        ),

        // Chat List
        Expanded(
          child: chats.isEmpty
              ? _buildEmptyList()
              : ListView.builder(
                  itemCount: chats.length,
                  itemBuilder: (context, index) {
                    final chat = chats[index];
                    return ChatListItem(
                      chat: chat,
                      isSelected: chat.id == _selectedChatId,
                      onTap: () {
                        final isWide = MediaQuery.of(context).size.width > 600;
                        if (isWide) {
                          setState(() => _selectedChatId = chat.id);
                        } else {
                          context.go(RouteNames.chatDetail(chat.id));
                        }
                      },
                    );
                  },
                ),
        ),
      ],
    );
  }

  Widget _buildTabButton(String label, MessagesTab tab, {int? badgeCount}) {
    final isActive = _activeTab == tab;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _activeTab = tab),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
          decoration: BoxDecoration(
            color: isActive ? AppColors.slate900 : Colors.transparent,
            borderRadius: BorderRadius.circular(AppRadius.sm),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                label,
                style: AppTypography.labelSmall.copyWith(
                  color: isActive ? Colors.white : AppColors.slate500,
                  fontWeight: FontWeight.w700,
                ),
              ),
              if (badgeCount != null && badgeCount > 0) ...[
                const SizedBox(width: 6),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(AppRadius.full),
                  ),
                  child: Text(
                    '$badgeCount',
                    style: AppTypography.caption.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                      fontSize: 9,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyList() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.chat_bubble_outline, size: 48, color: AppColors.slate300),
          const SizedBox(height: AppSpacing.md),
          Text(
            _activeTab == MessagesTab.requests
                ? 'No message requests'
                : 'No conversations yet',
            style:
                AppTypography.titleMedium.copyWith(color: AppColors.slate500),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            'Start a conversation from Discovery',
            style: AppTypography.caption.copyWith(color: AppColors.slate400),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Container(
      color: AppColors.slate50,
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: AppColors.slate100,
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.forum_outlined,
                  size: 32, color: AppColors.slate400),
            ),
            const SizedBox(height: AppSpacing.md),
            Text(
              'Select a conversation',
              style: AppTypography.titleMedium.copyWith(
                color: AppColors.slate500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildChatDetail(Chat chat) {
    final participant =
        chat.participants.isNotEmpty ? chat.participants.first : null;

    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFF0F2F5),
        border: Border(left: BorderSide(color: AppColors.slate200)),
      ),
      child: Column(
        children: [
          // Header
          Container(
            height: 64,
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border(bottom: BorderSide(color: AppColors.slate200)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.02),
                  blurRadius: 4,
                ),
              ],
            ),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppColors.slate200,
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: participant != null && participant.avatarUrl.isNotEmpty
                      ? Image.network(participant.avatarUrl, fit: BoxFit.cover)
                      : Icon(Icons.person, color: AppColors.slate400),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            participant?.name ?? 'Unknown',
                            style: AppTypography.titleSmall,
                          ),
                          if (chat.type == ChatType.matchmaker)
                            Container(
                              margin: const EdgeInsets.only(left: 8),
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
                      Text(
                        chat.isOnline ? 'Online' : 'Last seen recently',
                        style: AppTypography.caption.copyWith(
                          color: chat.isOnline
                              ? AppColors.success
                              : AppColors.slate500,
                          fontWeight:
                              chat.isOnline ? FontWeight.w600 : FontWeight.w400,
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: () {},
                  icon: Icon(Icons.phone, color: AppColors.slate500),
                ),
                IconButton(
                  onPressed: () {},
                  icon: Icon(Icons.videocam, color: AppColors.slate500),
                ),
                IconButton(
                  onPressed: () {},
                  icon: Icon(Icons.shield_outlined, color: AppColors.slate500),
                ),
              ],
            ),
          ),

          // Messages Area
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(AppSpacing.md),
              children: [
                // Encryption Notice
                Center(
                  child: Container(
                    margin: const EdgeInsets.only(bottom: AppSpacing.lg),
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.sm,
                      vertical: AppSpacing.xs,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.warning.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(AppRadius.full),
                      border:
                          Border.all(color: AppColors.warning.withOpacity(0.2)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.lock_outline,
                            size: 10, color: AppColors.warning),
                        const SizedBox(width: 4),
                        Text(
                          'Messages are end-to-end encrypted',
                          style: AppTypography.caption.copyWith(
                            color: AppColors.warning,
                            fontSize: 10,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                // Sample Messages
                _buildMessageBubble(
                  text: 'Hi! I reviewed your profile. Impressive work!',
                  isMe: false,
                  time: '10:30 AM',
                ),
                _buildMessageBubble(
                  text: "Thank you! I'm glad you found it interesting.",
                  isMe: true,
                  time: '10:35 AM',
                ),
                _buildMessageBubble(
                  text: 'Would love to chat more about our shared interests.',
                  isMe: false,
                  time: '10:36 AM',
                ),
                _buildMessageBubble(
                  text: 'That sounds perfect! Saturday works for me.',
                  isMe: true,
                  time: '10:42 AM',
                ),
              ],
            ),
          ),

          // Input Area
          Container(
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border(top: BorderSide(color: AppColors.slate200)),
            ),
            child: Column(
              children: [
                // Quick Actions
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _buildToolPill(Icons.auto_awesome, 'Icebreaker'),
                      _buildToolPill(
                          Icons.check_circle_outline, 'Dealbreaker Check'),
                      _buildToolPill(Icons.calendar_today, 'Schedule Call'),
                      _buildToolPill(
                          Icons.description_outlined, 'Share Biodata'),
                    ],
                  ),
                ),
                const SizedBox(height: AppSpacing.sm),

                // Input
                Container(
                  padding: const EdgeInsets.all(AppSpacing.sm),
                  decoration: BoxDecoration(
                    color: AppColors.slate100,
                    borderRadius: BorderRadius.circular(AppRadius.xl),
                  ),
                  child: Row(
                    children: [
                      IconButton(
                        onPressed: () {},
                        icon: Icon(Icons.add, color: AppColors.slate500),
                        iconSize: 20,
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                      ),
                      const SizedBox(width: AppSpacing.sm),
                      Expanded(
                        child: TextField(
                          decoration: InputDecoration(
                            hintText: 'Type a message...',
                            hintStyle: AppTypography.bodySmall.copyWith(
                              color: AppColors.slate400,
                            ),
                            border: InputBorder.none,
                            isDense: true,
                            contentPadding: EdgeInsets.zero,
                          ),
                        ),
                      ),
                      IconButton(
                        onPressed: () {},
                        icon: Icon(Icons.image_outlined,
                            color: AppColors.slate500),
                        iconSize: 20,
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                      ),
                      const SizedBox(width: AppSpacing.xs),
                      IconButton(
                        onPressed: () {},
                        icon:
                            Icon(Icons.mic_outlined, color: AppColors.slate500),
                        iconSize: 20,
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
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

  Widget _buildToolPill(IconData icon, String label) {
    return Container(
      margin: const EdgeInsets.only(right: AppSpacing.xs),
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: AppSpacing.xs,
      ),
      decoration: BoxDecoration(
        color: AppColors.slate50,
        borderRadius: BorderRadius.circular(AppRadius.full),
        border: Border.all(color: AppColors.slate200),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: AppColors.slate600),
          const SizedBox(width: 4),
          Text(
            label,
            style: AppTypography.caption.copyWith(
              color: AppColors.slate600,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessageBubble({
    required String text,
    required bool isMe,
    required String time,
  }) {
    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: AppSpacing.sm),
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.sm,
        ),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.7,
        ),
        decoration: BoxDecoration(
          color: isMe ? AppColors.primary : Colors.white,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: Radius.circular(isMe ? 16 : 4),
            bottomRight: Radius.circular(isMe ? 4 : 16),
          ),
          boxShadow: [
            if (!isMe)
              BoxShadow(
                color: Colors.black.withOpacity(0.03),
                blurRadius: 4,
              ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              text,
              style: AppTypography.bodySmall.copyWith(
                color: isMe ? Colors.white : AppColors.slate900,
              ),
            ),
            const SizedBox(height: 4),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  time,
                  style: AppTypography.caption.copyWith(
                    color: isMe
                        ? Colors.white.withOpacity(0.7)
                        : AppColors.slate400,
                    fontSize: 10,
                  ),
                ),
                if (isMe) ...[
                  const SizedBox(width: 4),
                  Icon(
                    Icons.done_all,
                    size: 12,
                    color: Colors.white.withOpacity(0.7),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
}
