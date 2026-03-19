import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../theme/app_colors.dart';
import '../theme/app_decorations.dart';
import '../providers/discovery_provider.dart';
import '../widgets/profile_card.dart';
import '../widgets/dmb_tab_bar.dart';
import '../widgets/dmb_text_field.dart';
import '../widgets/loading_shimmer.dart';
import '../widgets/empty_state.dart';
import '../widgets/dmb_modal.dart';

/// Discovery screen — matches DiscoveryView.tsx with tabs, search, grid
class DiscoveryScreen extends ConsumerStatefulWidget {
  const DiscoveryScreen({super.key});

  @override
  ConsumerState<DiscoveryScreen> createState() => _DiscoveryScreenState();
}

class _DiscoveryScreenState extends ConsumerState<DiscoveryScreen> {
  final _searchController = TextEditingController();
  final _scrollController = ScrollController();
  bool _showSearch = false;

  @override
  void initState() {
    super.initState();
    // Load initial data
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(discoveryProvider.notifier).loadDiscovery();
    });

    // Infinite scroll
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      ref.read(discoveryProvider.notifier).loadMore();
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(discoveryProvider);
    final tabs = ['All', 'Verified', 'Unverified'];
    final tabIndex = state.activeTab == 'verified'
        ? 1
        : state.activeTab == 'unverified'
            ? 2
            : 0;

    return Column(
      children: [
        // Search bar
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
          child: Row(
            children: [
              Expanded(
                child: AnimatedCrossFade(
                  firstChild: GestureDetector(
                    onTap: () => setState(() => _showSearch = true),
                    child: Container(
                      height: 40,
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(
                        color: AppColors.slate100,
                        borderRadius: BorderRadius.circular(AppDecorations.radiusXl),
                      ),
                      child: const Row(
                        children: [
                          Icon(LucideIcons.search, size: 18, color: AppColors.slate400),
                          SizedBox(width: 8),
                          Text(
                            'Search profiles...',
                            style: TextStyle(fontSize: 14, color: AppColors.slate400),
                          ),
                        ],
                      ),
                    ),
                  ),
                  secondChild: Row(
                    children: [
                      Expanded(
                        child: SizedBox(
                          height: 40,
                          child: TextField(
                            controller: _searchController,
                            autofocus: true,
                            decoration: InputDecoration(
                              hintText: 'Search by name, profession...',
                              prefixIcon: const Icon(LucideIcons.search, size: 18),
                              suffixIcon: IconButton(
                                icon: const Icon(LucideIcons.x, size: 18),
                                onPressed: () {
                                  _searchController.clear();
                                  setState(() => _showSearch = false);
                                  ref.read(discoveryProvider.notifier).clearSearch();
                                },
                              ),
                              contentPadding: const EdgeInsets.symmetric(vertical: 8),
                            ),
                            onSubmitted: (q) {
                              if (q.trim().isNotEmpty) {
                                ref.read(discoveryProvider.notifier).search(q.trim());
                              }
                            },
                          ),
                        ),
                      ),
                    ],
                  ),
                  crossFadeState: _showSearch
                      ? CrossFadeState.showSecond
                      : CrossFadeState.showFirst,
                  duration: const Duration(milliseconds: 200),
                ),
              ),
            ],
          ),
        ),

        // Tab bar
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: DmbTabBar(
            tabs: tabs,
            selectedIndex: tabIndex,
            onTabChanged: (index) {
              final tab = index == 1
                  ? 'verified'
                  : index == 2
                      ? 'unverified'
                      : 'all';
              ref.read(discoveryProvider.notifier).setActiveTab(tab);
            },
          ),
        ),

        // Content
        Expanded(
          child: state.isLoading
              ? ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: 5,
                  itemBuilder: (_, __) => const Padding(
                    padding: EdgeInsets.only(bottom: 16),
                    child: ProfileCardShimmer(),
                  ),
                )
              : state.allProfiles.isEmpty &&
                      state.agentPicks.isEmpty &&
                      state.highIntent.isEmpty
                  ? EmptyState(
                      icon: LucideIcons.compass,
                      title: 'No profiles found',
                      subtitle: 'Try adjusting your search or filters',
                      actionText: 'Refresh',
                      onAction: () =>
                          ref.read(discoveryProvider.notifier).loadDiscovery(refresh: true),
                    )
                  : RefreshIndicator(
                      color: AppColors.primary,
                      onRefresh: () =>
                          ref.read(discoveryProvider.notifier).loadDiscovery(refresh: true),
                      child: ListView(
                        controller: _scrollController,
                        padding: const EdgeInsets.all(16),
                        children: [
                          // Agent Picks section
                          if (state.agentPicks.isNotEmpty) ...[
                            _SectionHeader(
                              title: 'Agent Picks',
                              icon: LucideIcons.sparkles,
                            ),
                            const SizedBox(height: 8),
                            ...state.agentPicks.map((p) => Padding(
                              padding: const EdgeInsets.only(bottom: 16),
                              child: ProfileCard(
                                profile: p,
                                onTap: () => _openProfile(p.id),
                              ),
                            )),
                          ],

                          // High Intent section
                          if (state.highIntent.isNotEmpty) ...[
                            _SectionHeader(
                              title: 'High Intent',
                              icon: LucideIcons.zap,
                            ),
                            const SizedBox(height: 8),
                            ...state.highIntent.map((p) => Padding(
                              padding: const EdgeInsets.only(bottom: 16),
                              child: ProfileCard(
                                profile: p,
                                onTap: () => _openProfile(p.id),
                              ),
                            )),
                          ],

                          // All Profiles
                          if (state.allProfiles.isNotEmpty) ...[
                            if (state.agentPicks.isNotEmpty || state.highIntent.isNotEmpty)
                              _SectionHeader(
                                title: 'All Profiles',
                                icon: LucideIcons.users,
                              ),
                            const SizedBox(height: 8),
                            ...state.allProfiles.map((p) => Padding(
                              padding: const EdgeInsets.only(bottom: 16),
                              child: ProfileCard(
                                profile: p,
                                onTap: () => _openProfile(p.id),
                              ),
                            )),
                          ],

                          // Loading more indicator
                          if (state.isLoadingMore)
                            const Padding(
                              padding: EdgeInsets.symmetric(vertical: 24),
                              child: Center(
                                child: CircularProgressIndicator(
                                  color: AppColors.primary,
                                  strokeWidth: 2,
                                ),
                              ),
                            ),

                          // Bottom padding
                          const SizedBox(height: 16),
                        ],
                      ),
                    ),
        ),
      ],
    );
  }

  void _openProfile(String profileId) {
    showDmbFullModal(
      context: context,
      builder: (context) => _ProfileDetailPlaceholder(profileId: profileId),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  final IconData icon;

  const _SectionHeader({required this.title, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Icon(icon, size: 18, color: AppColors.primary),
          const SizedBox(width: 8),
          Text(
            title,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: AppColors.slate900,
            ),
          ),
        ],
      ),
    );
  }
}

/// Temporary placeholder — will be replaced with full ProfileDetailModal
class _ProfileDetailPlaceholder extends StatelessWidget {
  final String profileId;

  const _ProfileDetailPlaceholder({required this.profileId});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(LucideIcons.user, size: 48, color: AppColors.primary),
            const SizedBox(height: 16),
            Text(
              'Profile #$profileId',
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: AppColors.slate900,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Full profile detail modal coming soon',
              style: TextStyle(color: AppColors.slate500),
            ),
          ],
        ),
      ),
    );
  }
}
