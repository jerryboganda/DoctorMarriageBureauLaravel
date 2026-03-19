import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../theme/app_colors.dart';
import '../theme/app_decorations.dart';
import '../providers/auth_provider.dart';
import '../utils/avatar_resolver.dart';
import 'dmb_avatar.dart';
import 'dmb_badge.dart';

/// Sidebar drawer matching Sidebar.tsx — nav items, avatar upload, counts
class SidebarDrawer extends ConsumerWidget {
  final String currentRoute;
  final ValueChanged<String> onNavigate;
  final VoidCallback? onUpgrade;

  const SidebarDrawer({
    super.key,
    required this.currentRoute,
    required this.onNavigate,
    this.onUpgrade,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final user = authState.user;

    return Drawer(
      child: SafeArea(
        child: Column(
          children: [
            // Profile header
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  DmbAvatar(
                    imageUrl: resolveAvatarUrl(user?.avatar),
                    size: AppDecorations.avatarSidebar,
                    showBorder: true,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    user?.name ?? 'Welcome',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: AppColors.slate900,
                    ),
                  ),
                  const SizedBox(height: 4),
                  if (user?.isPremium == true)
                    const DmbBadge(
                      text: 'Premium Member',
                      variant: BadgeVariant.primary,
                      icon: LucideIcons.crown,
                    )
                  else
                    GestureDetector(
                      onTap: onUpgrade,
                      child: const DmbBadge(
                        text: 'Upgrade to Premium',
                        variant: BadgeVariant.warning,
                        icon: LucideIcons.sparkles,
                      ),
                    ),
                ],
              ),
            ),

            const Divider(height: 1),

            // Navigation items
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(vertical: 8),
                children: [
                  _NavItem(
                    icon: LucideIcons.compass,
                    label: 'Discovery',
                    route: '/discovery',
                    currentRoute: currentRoute,
                    onTap: () => _navigate(context, '/discovery'),
                  ),
                  _NavItem(
                    icon: LucideIcons.userCheck,
                    label: 'Proposals',
                    route: '/dashboard',
                    currentRoute: currentRoute,
                    onTap: () => _navigate(context, '/dashboard'),
                  ),
                  _NavItem(
                    icon: LucideIcons.messageSquare,
                    label: 'Messages',
                    route: '/messages',
                    currentRoute: currentRoute,
                    onTap: () => _navigate(context, '/messages'),
                  ),
                  _NavItem(
                    icon: LucideIcons.bell,
                    label: 'Notifications',
                    route: '/notifications',
                    currentRoute: currentRoute,
                    onTap: () => _navigate(context, '/notifications'),
                  ),

                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: Text(
                      'My Profile',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: AppColors.slate400,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),

                  _NavItem(
                    icon: LucideIcons.userCircle,
                    label: 'Edit Profile',
                    route: '/profile-edit',
                    currentRoute: currentRoute,
                    onTap: () => _navigate(context, '/profile-edit'),
                  ),
                  _NavItem(
                    icon: LucideIcons.shieldCheck,
                    label: 'Settings',
                    route: '/settings',
                    currentRoute: currentRoute,
                    onTap: () => _navigate(context, '/settings'),
                  ),

                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: Text(
                      'Social',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: AppColors.slate400,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),

                  _NavItem(
                    icon: LucideIcons.heart,
                    label: 'Family Portal',
                    route: '/family',
                    currentRoute: currentRoute,
                    onTap: () => _navigate(context, '/family'),
                  ),
                  _NavItem(
                    icon: LucideIcons.globe,
                    label: 'Communities',
                    route: '/communities',
                    currentRoute: currentRoute,
                    onTap: () => _navigate(context, '/communities'),
                  ),
                  _NavItem(
                    icon: LucideIcons.route,
                    label: 'My Journey',
                    route: '/progression',
                    currentRoute: currentRoute,
                    onTap: () => _navigate(context, '/progression'),
                  ),
                  _NavItem(
                    icon: LucideIcons.gift,
                    label: 'Referrals',
                    route: '/referral',
                    currentRoute: currentRoute,
                    onTap: () => _navigate(context, '/referral'),
                  ),
                ],
              ),
            ),

            // Logout button
            const Divider(height: 1),
            Padding(
              padding: const EdgeInsets.all(16),
              child: _NavItem(
                icon: LucideIcons.logOut,
                label: 'Logout',
                route: '',
                currentRoute: currentRoute,
                isLogout: true,
                onTap: () async {
                  Navigator.of(context).pop(); // Close drawer
                  await ref.read(authProvider.notifier).logout();
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _navigate(BuildContext context, String route) {
    Navigator.of(context).pop(); // Close drawer
    onNavigate(route);
  }
}

class _NavItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final String route;
  final String currentRoute;
  final VoidCallback onTap;
  final int? count;
  final bool isLogout;

  const _NavItem({
    required this.icon,
    required this.label,
    required this.route,
    required this.currentRoute,
    required this.onTap,
    this.count,
    this.isLogout = false,
  });

  bool get isActive => route.isNotEmpty && currentRoute == route;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 1),
      child: Material(
        color: isActive ? AppColors.primary5 : Colors.transparent,
        borderRadius: BorderRadius.circular(AppDecorations.radiusLg),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(AppDecorations.radiusLg),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            child: Row(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: isActive
                        ? AppColors.primary10
                        : isLogout
                            ? const Color(0x1ADC2626)
                            : AppColors.slate100,
                    borderRadius: BorderRadius.circular(AppDecorations.radiusLg),
                  ),
                  child: Icon(
                    icon,
                    size: 16,
                    color: isActive
                        ? AppColors.primary
                        : isLogout
                            ? AppColors.error
                            : AppColors.slate500,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    label,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: isActive ? FontWeight.w600 : FontWeight.w500,
                      color: isActive
                          ? AppColors.primary
                          : isLogout
                              ? AppColors.error
                              : AppColors.slate700,
                    ),
                  ),
                ),
                if (count != null && count! > 0)
                  CountBadge(count: count!),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
