import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../theme/app_colors.dart';
import '../theme/app_decorations.dart';
import '../models/chat.dart';
import '../services/chat_service.dart';
import '../providers/auth_provider.dart';
import '../utils/avatar_resolver.dart';
import '../utils/date_helpers.dart';
import '../widgets/dmb_avatar.dart';
import '../widgets/dmb_badge.dart';
import '../widgets/loading_shimmer.dart';
import '../widgets/empty_state.dart';

/// Chat list screen — thread list matching MessagesView.tsx
class ChatListScreen extends ConsumerStatefulWidget {
  const ChatListScreen({super.key});

  @override
  ConsumerState<ChatListScreen> createState() => _ChatListScreenState();
}

class _ChatListScreenState extends ConsumerState<ChatListScreen> {
  List<ChatThread> _threads = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadThreads();
  }

  Future<void> _loadThreads() async {
    setState(() => _isLoading = true);
    try {
      final api = ref.read(apiServiceProvider);
      final chatService = ChatService(api);
      final userId = ref.read(authProvider).user?.id ?? 0;
      final threads = await chatService.getChatList(userId);
      setState(() {
        _threads = threads;
        _isLoading = false;
      });
    } catch (_) {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return ListView.builder(
        itemCount: 8,
        itemBuilder: (_, __) => const ListItemShimmer(),
      );
    }

    if (_threads.isEmpty) {
      return const EmptyState(
        icon: LucideIcons.messageSquare,
        title: 'No conversations yet',
        subtitle: 'Start chatting by accepting a proposal',
      );
    }

    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: _loadThreads,
      child: ListView.builder(
        itemCount: _threads.length,
        itemBuilder: (context, index) {
          final thread = _threads[index];
          return _ChatThreadTile(
            thread: thread,
            onTap: () => context.go('/messages/${thread.id}'),
          );
        },
      ),
    );
  }
}

class _ChatThreadTile extends StatelessWidget {
  final ChatThread thread;
  final VoidCallback onTap;

  const _ChatThreadTile({required this.thread, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final participant = thread.participants.isNotEmpty
        ? thread.participants.first
        : null;
    final name = participant?.name ?? 'Unknown';
    final avatar = participant?.avatarUrl;
    final lastMsg = thread.lastMessage;

    return Material(
      color: thread.unreadCount > 0 ? AppColors.primary5 : Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: [
              DmbAvatar(
                imageUrl: avatar,
                size: 48,
                showOnlineIndicator: true,
                isOnline: thread.isOnline,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            name,
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: thread.unreadCount > 0
                                  ? FontWeight.w700
                                  : FontWeight.w600,
                              color: AppColors.slate900,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (lastMsg != null)
                          Text(
                            DateHelpers.timeAgo(lastMsg.timestamp),
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.slate400,
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        if (thread.typing)
                          const Text(
                            'Typing...',
                            style: TextStyle(
                              fontSize: 13,
                              fontStyle: FontStyle.italic,
                              color: AppColors.primary,
                            ),
                          )
                        else
                          Expanded(
                            child: Text(
                              lastMsg?.text ?? '',
                              style: TextStyle(
                                fontSize: 13,
                                color: thread.unreadCount > 0
                                    ? AppColors.slate700
                                    : AppColors.slate500,
                                fontWeight: thread.unreadCount > 0
                                    ? FontWeight.w500
                                    : FontWeight.w400,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        if (thread.unreadCount > 0)
                          CountBadge(count: thread.unreadCount),
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
}
