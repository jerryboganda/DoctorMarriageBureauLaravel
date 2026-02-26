import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/core.dart';
import '../../models/profile_match.dart';
import '../../providers/providers.dart';
import '../../widgets/widgets.dart';

/// Dashboard filter type
enum DashboardFilter { all, highCompatibility, recent, agentPicks, family }

/// Dashboard Screen - Home/Proposals view
/// Transpiled from App.tsx dashboard view with ProfileCard display
class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  DashboardFilter _activeFilter = DashboardFilter.all;
  String? _expandedProfileId;

  @override
  Widget build(BuildContext context) {
    final profilesAsync = ref.watch(profilesProvider);

    return RefreshIndicator(
      onRefresh: () async => ref.refresh(profilesProvider),
      child: CustomScrollView(
        slivers: [
          // Welcome Banner
          SliverToBoxAdapter(
            child: _buildWelcomeBanner(),
          ),

          // Quick Stats
          SliverToBoxAdapter(
            child: _buildQuickStats(),
          ),

          // Filter Tabs
          SliverToBoxAdapter(
            child: Container(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.md,
                vertical: AppSpacing.sm,
              ),
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    _FilterChip(
                      label: 'All Proposals',
                      isSelected: _activeFilter == DashboardFilter.all,
                      onTap: () =>
                          setState(() => _activeFilter = DashboardFilter.all),
                    ),
                    const SizedBox(width: AppSpacing.xs),
                    _FilterChip(
                      label: 'High Compatibility',
                      isSelected:
                          _activeFilter == DashboardFilter.highCompatibility,
                      onTap: () => setState(() =>
                          _activeFilter = DashboardFilter.highCompatibility),
                    ),
                    const SizedBox(width: AppSpacing.xs),
                    _FilterChip(
                      label: 'Recent',
                      isSelected: _activeFilter == DashboardFilter.recent,
                      onTap: () => setState(
                          () => _activeFilter = DashboardFilter.recent),
                    ),
                    const SizedBox(width: AppSpacing.xs),
                    _FilterChip(
                      label: 'Agent Picks',
                      isSelected: _activeFilter == DashboardFilter.agentPicks,
                      onTap: () => setState(
                          () => _activeFilter = DashboardFilter.agentPicks),
                      hasIcon: true,
                    ),
                    const SizedBox(width: AppSpacing.xs),
                    _FilterChip(
                      label: 'Family Added',
                      isSelected: _activeFilter == DashboardFilter.family,
                      onTap: () => setState(
                          () => _activeFilter = DashboardFilter.family),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Profile Cards
          profilesAsync.when(
            data: (profiles) => _buildProfileList(profiles),
            loading: () => const SliverFillRemaining(
              child: Center(child: CircularProgressIndicator()),
            ),
            error: (err, _) => SliverFillRemaining(
              child: Center(child: Text('Error: $err')),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildWelcomeBanner() {
    return Container(
      margin: const EdgeInsets.all(AppSpacing.md),
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        gradient: AppColors.primaryGradient,
        borderRadius: BorderRadius.circular(AppRadius.lg),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Good morning, Dr. Kumar!',
                  style:
                      AppTypography.titleMedium.copyWith(color: Colors.white),
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  'You have 5 new matches waiting for you',
                  style: AppTypography.bodySmall.copyWith(
                    color: Colors.white.withOpacity(0.9),
                  ),
                ),
                const SizedBox(height: AppSpacing.md),
                OutlinedButton(
                  onPressed: () {},
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    side: const BorderSide(color: Colors.white),
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.md,
                      vertical: AppSpacing.sm,
                    ),
                  ),
                  child: const Text('View Matches'),
                ),
              ],
            ),
          ),
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.favorite, size: 40, color: Colors.white),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickStats() {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.sm,
      ),
      child: Row(
        children: [
          _buildStatCard(
              'New Matches', '12', Icons.favorite, AppColors.primary),
          const SizedBox(width: AppSpacing.sm),
          _buildStatCard(
              'Active Chats', '8', Icons.chat_bubble, AppColors.info),
          const SizedBox(width: AppSpacing.sm),
          _buildStatCard(
              'Profile Views', '47', Icons.visibility, AppColors.secondary),
        ],
      ),
    );
  }

  Widget _buildStatCard(
      String label, String value, IconData icon, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(AppRadius.md),
          border: Border.all(color: AppColors.slate200),
        ),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(icon, size: 16, color: color),
                const SizedBox(width: 4),
                Text(
                  value,
                  style: AppTypography.titleMedium.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.xxs),
            Text(
              label,
              style: AppTypography.caption
                  .copyWith(color: AppColors.textSecondary),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileList(List<ProfileMatch> profiles) {
    if (profiles.isEmpty) {
      return SliverFillRemaining(
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.search_off, size: 64, color: AppColors.slate300),
              const SizedBox(height: AppSpacing.md),
              Text('No proposals found', style: AppTypography.titleMedium),
              Text(
                'Check back later for new matches',
                style: AppTypography.bodySmall
                    .copyWith(color: AppColors.textSecondary),
              ),
            ],
          ),
        ),
      );
    }

    return SliverPadding(
      padding: const EdgeInsets.all(AppSpacing.md),
      sliver: SliverList.separated(
        itemCount: profiles.length,
        separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.md),
        itemBuilder: (context, index) {
          final profile = profiles[index];
          final isExpanded = _expandedProfileId == profile.id;

          if (isExpanded) {
            return ProfileCard(
              profile: profile,
              matchPercentage: 85 + (index * 3) % 15,
              onAccept: () => _handleAccept(profile),
              onDecline: () => _handleDecline(profile),
              onTap: () => setState(() => _expandedProfileId = null),
            );
          }

          return _ProfileTeaserCard(
            profile: profile,
            matchPercentage: 85 + (index * 3) % 15,
            isAgentPick: index % 3 == 0,
            onTap: () => setState(() => _expandedProfileId = profile.id),
          );
        },
      ),
    );
  }

  void _handleAccept(ProfileMatch profile) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Sent interest to ${profile.name}'),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _handleDecline(ProfileMatch profile) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Declined ${profile.name}'),
        behavior: SnackBarBehavior.floating,
      ),
    );
    setState(() => _expandedProfileId = null);
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback? onTap;
  final bool hasIcon;

  const _FilterChip({
    required this.label,
    required this.isSelected,
    this.onTap,
    this.hasIcon = false,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
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
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  ),
                ]
              : null,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (hasIcon) ...[
              Icon(
                Icons.auto_awesome,
                size: 14,
                color: isSelected ? Colors.white : AppColors.textSecondary,
              ),
              const SizedBox(width: 4),
            ],
            Text(
              label,
              style: AppTypography.labelMedium.copyWith(
                color: isSelected ? Colors.white : AppColors.textSecondary,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProfileTeaserCard extends StatelessWidget {
  final ProfileMatch profile;
  final int matchPercentage;
  final bool isAgentPick;
  final VoidCallback? onTap;

  const _ProfileTeaserCard({
    required this.profile,
    required this.matchPercentage,
    this.isAgentPick = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(AppRadius.lg),
          border: Border.all(color: AppColors.slate200),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.03),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            // Avatar
            Stack(
              children: [
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(AppRadius.md),
                    color: AppColors.slate100,
                  ),
                  child: profile.avatarUrl != null
                      ? ClipRRect(
                          borderRadius: BorderRadius.circular(AppRadius.md),
                          child: Image.network(profile.avatarUrl!,
                              fit: BoxFit.cover),
                        )
                      : Icon(Icons.person, size: 28, color: AppColors.slate400),
                ),
                if (isAgentPick)
                  Positioned(
                    top: -4,
                    right: -4,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: AppColors.secondary,
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 2),
                      ),
                      child: Icon(Icons.auto_awesome,
                          size: 10, color: Colors.white),
                    ),
                  ),
              ],
            ),

            const SizedBox(width: AppSpacing.md),

            // Info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          profile.name,
                          style: AppTypography.titleSmall,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (profile.isVerified)
                        Icon(Icons.verified, size: 16, color: AppColors.info),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${profile.specialty ?? 'Medical Professional'} • ${profile.age ?? 28}',
                    style: AppTypography.bodySmall.copyWith(
                      color: AppColors.textSecondary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: AppSpacing.sm,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: matchPercentage >= 90
                              ? AppColors.success.withOpacity(0.1)
                              : AppColors.primary.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(AppRadius.full),
                        ),
                        child: Text(
                          '$matchPercentage% Match',
                          style: AppTypography.caption.copyWith(
                            color: matchPercentage >= 90
                                ? AppColors.success
                                : AppColors.primary,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      const SizedBox(width: AppSpacing.xs),
                      if (profile.location != null)
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.location_on,
                                size: 12, color: AppColors.slate400),
                            const SizedBox(width: 2),
                            Text(
                              profile.location!,
                              style: AppTypography.caption.copyWith(
                                color: AppColors.slate500,
                              ),
                            ),
                          ],
                        ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(width: AppSpacing.sm),

            // Quick actions
            Column(
              children: [
                _QuickActionButton(
                  icon: Icons.favorite,
                  color: AppColors.primary,
                  onTap: () {},
                ),
                const SizedBox(height: AppSpacing.xs),
                _QuickActionButton(
                  icon: Icons.close,
                  color: AppColors.slate400,
                  onTap: () {},
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _QuickActionButton extends StatelessWidget {
  final IconData icon;
  final Color color;
  final VoidCallback? onTap;

  const _QuickActionButton({
    required this.icon,
    required this.color,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 32,
        height: 32,
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, size: 16, color: color),
      ),
    );
  }
}
