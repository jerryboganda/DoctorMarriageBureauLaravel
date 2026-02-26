import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/core.dart';
import '../../providers/providers.dart';
import '../../routes/route_names.dart';

/// App Drawer widget - transpiled from Sidebar.tsx
/// Contains navigation menu, user profile summary, and upgrade banner
class AppDrawer extends ConsumerWidget {
  const AppDrawer({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentUser = ref.watch(currentUserProvider);

    return Drawer(
      child: SafeArea(
        child: Column(
          children: [
            // Brand Header
            _buildBrandHeader(context),

            const Divider(height: 1),

            // User Profile Summary
            _buildUserProfile(context, currentUser),

            const Divider(height: 1),

            // Navigation Menu
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
                children: [
                  // Menu Section
                  _buildSectionHeader(context, 'MENU'),

                  _NavItem(
                    icon: Icons.explore_outlined,
                    label: 'Discovery',
                    onTap: () {
                      Navigator.pop(context);
                      context.go(RouteNames.discovery);
                    },
                  ),

                  _NavItem(
                    icon: Icons.how_to_reg_outlined,
                    label: 'Matchmaker',
                    badge: '2',
                    onTap: () {
                      Navigator.pop(context);
                      context.go(RouteNames.discovery);
                    },
                  ),

                  _NavItem(
                    icon: Icons.favorite_outline,
                    label: 'Proposals',
                    badge: '3',
                    onTap: () {
                      Navigator.pop(context);
                      context.go(RouteNames.dashboard);
                    },
                  ),

                  _NavItem(
                    icon: Icons.chat_bubble_outline,
                    label: 'Messages',
                    badge: '1',
                    onTap: () {
                      Navigator.pop(context);
                      context.go(RouteNames.messages);
                    },
                  ),

                  _NavItem(
                    icon: Icons.timeline_outlined,
                    label: 'Journey & Events',
                    onTap: () {
                      Navigator.pop(context);
                      context.go(RouteNames.progression);
                    },
                  ),

                  _NavItem(
                    icon: Icons.family_restroom_outlined,
                    label: 'Family Portal',
                    badge: 'New',
                    badgeColor: AppColors.info,
                    onTap: () {
                      Navigator.pop(context);
                      context.push(RouteNames.family);
                    },
                  ),

                  _NavItem(
                    icon: Icons.public_outlined,
                    label: 'Communities',
                    onTap: () {
                      Navigator.pop(context);
                      context.push(RouteNames.communities);
                    },
                  ),

                  const SizedBox(height: AppSpacing.lg),

                  // Settings Section
                  _buildSectionHeader(context, 'SETTINGS'),

                  _NavItem(
                    icon: Icons.notifications_outlined,
                    label: 'Notifications',
                    badge: '6',
                    onTap: () {
                      Navigator.pop(context);
                      context.push(RouteNames.notifications);
                    },
                  ),

                  _NavItem(
                    icon: Icons.person_outline,
                    label: 'My Profile',
                    badge: '65%',
                    onTap: () {
                      Navigator.pop(context);
                      context.go(RouteNames.profile);
                    },
                  ),

                  _NavItem(
                    icon: Icons.verified_user_outlined,
                    label: 'Account & Identity',
                    onTap: () {
                      Navigator.pop(context);
                      context.push(RouteNames.settings);
                    },
                  ),

                  _NavItem(
                    icon: Icons.settings_outlined,
                    label: 'Preferences',
                    onTap: () {
                      Navigator.pop(context);
                      context.push(RouteNames.settings);
                    },
                  ),
                ],
              ),
            ),

            // Upgrade Banner
            _buildUpgradeBanner(context, ref),

            const Divider(height: 1),

            // Sign Out
            _buildSignOut(context, ref),
          ],
        ),
      ),
    );
  }

  Widget _buildBrandHeader(BuildContext context) {
    return InkWell(
      onTap: () {
        Navigator.pop(context);
        context.go(RouteNames.dashboard);
      },
      child: Container(
        height: 72,
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: AppColors.primaryLight,
                borderRadius: BorderRadius.circular(AppRadius.full),
              ),
              child: const Icon(
                Icons.favorite,
                color: AppColors.primary,
                size: 24,
              ),
            ),
            const SizedBox(width: AppSpacing.md),
            RichText(
              text: TextSpan(
                style: AppTypography.headlineMedium.copyWith(
                  color: AppColors.textPrimary,
                  fontWeight: FontWeight.w700,
                ),
                children: const [
                  TextSpan(text: 'DMB'),
                  TextSpan(
                    text: '.',
                    style: TextStyle(color: AppColors.primary),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildUserProfile(BuildContext context, dynamic user) {
    return Container(
      margin: const EdgeInsets.all(AppSpacing.md),
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.slate50,
        borderRadius: BorderRadius.circular(AppRadius.lg),
      ),
      child: Row(
        children: [
          // Avatar with online indicator
          Stack(
            children: [
              CircleAvatar(
                radius: 24,
                backgroundImage: user?.avatarUrl != null
                    ? NetworkImage(user!.avatarUrl)
                    : null,
                backgroundColor: AppColors.slate200,
                child: user?.avatarUrl == null
                    ? const Icon(Icons.person, color: AppColors.slate400)
                    : null,
              ),
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
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  user?.name ?? 'Guest User',
                  style: AppTypography.titleSmall,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  user?.specialty ?? 'Complete your profile',
                  style: AppTypography.bodySmall.copyWith(
                    color: AppColors.textSecondary,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(BuildContext context, String title) {
    return Padding(
      padding: const EdgeInsets.only(
        left: AppSpacing.lg,
        right: AppSpacing.lg,
        top: AppSpacing.sm,
        bottom: AppSpacing.xs,
      ),
      child: Text(
        title,
        style: AppTypography.labelSmall.copyWith(
          color: AppColors.textMuted,
          letterSpacing: 1.2,
        ),
      ),
    );
  }

  Widget _buildUpgradeBanner(BuildContext context, WidgetRef ref) {
    return Container(
      margin: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppColors.slate900, AppColors.slate800],
        ),
        borderRadius: BorderRadius.circular(AppRadius.lg),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.2),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Stack(
        children: [
          // Crown icon background
          Positioned(
            top: 0,
            right: 0,
            child: Opacity(
              opacity: 0.1,
              child: Icon(
                Icons.workspace_premium,
                size: 64,
                color: Colors.white,
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(
                      Icons.workspace_premium,
                      size: 18,
                      color: Colors.amber.shade400,
                    ),
                    const SizedBox(width: AppSpacing.xs),
                    Text(
                      'PREMIUM',
                      style: AppTypography.labelSmall.copyWith(
                        color: Colors.amber.shade400,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1.2,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  'Upgrade Plan',
                  style: AppTypography.titleSmall.copyWith(
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  'Get unlimited likes & see who viewed you.',
                  style: AppTypography.bodySmall.copyWith(
                    color: AppColors.slate300,
                  ),
                ),
                const SizedBox(height: AppSpacing.md),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pop(context);
                      // TODO: Show subscription modal
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: AppColors.slate900,
                      padding:
                          const EdgeInsets.symmetric(vertical: AppSpacing.sm),
                    ),
                    child: Text(
                      'View Plans',
                      style: AppTypography.labelMedium.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSignOut(BuildContext context, WidgetRef ref) {
    return InkWell(
      onTap: () async {
        Navigator.pop(context);
        await ref.read(authProvider.notifier).signOut();
        if (context.mounted) {
          context.go(RouteNames.welcome);
        }
      },
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Row(
          children: [
            const Icon(
              Icons.logout_outlined,
              color: AppColors.textSecondary,
              size: 20,
            ),
            const SizedBox(width: AppSpacing.sm),
            Text(
              'Sign Out',
              style: AppTypography.bodyMedium.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Individual navigation item in the drawer
class _NavItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final String? badge;
  final Color badgeColor;
  final VoidCallback onTap;

  const _NavItem({
    required this.icon,
    required this.label,
    this.badge,
    this.badgeColor = AppColors.primary,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: AppColors.textSecondary),
      title: Text(label, style: AppTypography.bodyMedium),
      trailing: badge != null
          ? Container(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.sm,
                vertical: AppSpacing.xxs,
              ),
              decoration: BoxDecoration(
                color: badgeColor,
                borderRadius: BorderRadius.circular(AppRadius.full),
              ),
              child: Text(
                badge!,
                style: AppTypography.labelSmall.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.w700,
                ),
              ),
            )
          : null,
      onTap: onTap,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppRadius.full),
      ),
      contentPadding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.xxs,
      ),
    );
  }
}
