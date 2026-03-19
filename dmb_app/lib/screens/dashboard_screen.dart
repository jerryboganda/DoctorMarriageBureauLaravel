import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../theme/app_colors.dart';
import '../providers/interest_provider.dart';
import '../widgets/profile_card.dart';
import '../widgets/dmb_tab_bar.dart';
import '../widgets/loading_shimmer.dart';
import '../widgets/empty_state.dart';

/// Dashboard screen — received/sent proposals matching App.tsx dashboard section
class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  int _tabIndex = 0; // 0=received, 1=sent

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(interestProvider.notifier).loadReceived();
      ref.read(interestProvider.notifier).loadSent();
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(interestProvider);

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
          child: DmbTabBar(
            tabs: const ['Received', 'Sent'],
            selectedIndex: _tabIndex,
            onTabChanged: (i) => setState(() => _tabIndex = i),
            counts: [
              state.receivedInterests.length,
              state.sentInterests.length,
            ],
          ),
        ),
        Expanded(
          child: _tabIndex == 0
              ? _buildReceivedTab(state)
              : _buildSentTab(state),
        ),
      ],
    );
  }

  Widget _buildReceivedTab(InterestState state) {
    if (state.isLoadingReceived) {
      return ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: 3,
        itemBuilder: (_, __) => const Padding(
          padding: EdgeInsets.only(bottom: 16),
          child: ProfileCardShimmer(),
        ),
      );
    }

    if (state.receivedInterests.isEmpty) {
      return const EmptyState(
        icon: LucideIcons.inbox,
        title: 'No proposals yet',
        subtitle: 'When someone sends you an interest, it will appear here',
      );
    }

    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: () => ref.read(interestProvider.notifier).loadReceived(),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: state.receivedInterests.length,
        itemBuilder: (context, index) {
          final interest = state.receivedInterests[index];
          if (interest.profile == null) return const SizedBox.shrink();
          return Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: ProfileCard(
              profile: interest.profile!,
              interestId: interest.id,
              showActions: interest.isPending,
              onAccept: () => ref.read(interestProvider.notifier)
                  .acceptProposal(interest.id, interest.interestedBy),
              onDecline: () => ref.read(interestProvider.notifier)
                  .rejectProposal(interest.id, interest.interestedBy),
            ),
          );
        },
      ),
    );
  }

  Widget _buildSentTab(InterestState state) {
    if (state.isLoadingSent) {
      return ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: 3,
        itemBuilder: (_, __) => const Padding(
          padding: EdgeInsets.only(bottom: 16),
          child: ProfileCardShimmer(),
        ),
      );
    }

    if (state.sentInterests.isEmpty) {
      return const EmptyState(
        icon: LucideIcons.send,
        title: 'No proposals sent',
        subtitle: 'Browse profiles and send your first proposal',
      );
    }

    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: () => ref.read(interestProvider.notifier).loadSent(),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: state.sentInterests.length,
        itemBuilder: (context, index) {
          final interest = state.sentInterests[index];
          if (interest.profile == null) return const SizedBox.shrink();
          return Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: ProfileCard(
              profile: interest.profile!,
              onTap: () {},
            ),
          );
        },
      ),
    );
  }
}
