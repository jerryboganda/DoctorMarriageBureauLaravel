import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../theme/app_colors.dart';
import '../theme/app_decorations.dart';
import '../providers/auth_provider.dart';
import '../providers/notification_provider.dart';
import '../widgets/sidebar_drawer.dart';
import '../widgets/floating_contact_button.dart';
import '../config/constants.dart';
import '../services/api_service.dart';

/// App shell — Scaffold + Drawer + Bottom Nav matching App.tsx layout
class AppShell extends ConsumerStatefulWidget {
  final Widget child;

  const AppShell({super.key, required this.child});

  @override
  ConsumerState<AppShell> createState() => _AppShellState();
}

class _AppShellState extends ConsumerState<AppShell> with WidgetsBindingObserver {
  Timer? _heartbeatTimer;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _startHeartbeat();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _heartbeatTimer?.cancel();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _sendHeartbeat();
      _startHeartbeat();
    } else if (state == AppLifecycleState.paused) {
      _heartbeatTimer?.cancel();
    }
  }

  void _startHeartbeat() {
    _heartbeatTimer?.cancel();
    _sendHeartbeat();
    _heartbeatTimer = Timer.periodic(
      const Duration(milliseconds: AppConstants.heartbeatIntervalMs),
      (_) => _sendHeartbeat(),
    );
  }

  Future<void> _sendHeartbeat() async {
    try {
      final api = ref.read(apiServiceProvider);
      await api.post('/member/heartbeat');
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final currentPath = GoRouterState.of(context).uri.path;
    final notifState = ref.watch(notificationProvider);
    final unreadCount = notifState.notifications
        .where((n) => n.readAt == null || n.readAt == 'New')
        .length;

    return Scaffold(
      appBar: AppBar(
        title: Text(_getTitle(currentPath)),
        leading: Builder(
          builder: (context) => IconButton(
            icon: const Icon(LucideIcons.menu, size: 24),
            onPressed: () => Scaffold.of(context).openDrawer(),
          ),
        ),
        actions: [
          // Notification bell with badge
          Stack(
            children: [
              IconButton(
                icon: const Icon(LucideIcons.bell, size: 22),
                onPressed: () => context.go('/notifications'),
              ),
              if (unreadCount > 0)
                Positioned(
                  right: 8,
                  top: 8,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(
                      color: AppColors.error,
                      shape: BoxShape.circle,
                    ),
                    constraints: const BoxConstraints(
                      minWidth: 16,
                      minHeight: 16,
                    ),
                    child: Text(
                      unreadCount > 9 ? '9+' : '$unreadCount',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 9,
                        fontWeight: FontWeight.w600,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(width: 4),
        ],
        elevation: 0,
        scrolledUnderElevation: 1,
      ),
      drawer: SidebarDrawer(
        currentRoute: currentPath,
        onNavigate: (route) => context.go(route),
      ),
      body: widget.child,
      floatingActionButton: const FloatingContactButton(),
      bottomNavigationBar: _BottomNav(
        currentPath: currentPath,
        onTap: (route) => context.go(route),
      ),
    );
  }

  String _getTitle(String path) {
    switch (path) {
      case '/discovery':
        return 'Discovery';
      case '/dashboard':
        return 'Proposals';
      case '/messages':
        return 'Messages';
      case '/profile-edit':
        return 'Edit Profile';
      case '/settings':
        return 'Settings';
      case '/notifications':
        return 'Notifications';
      case '/family':
        return 'Family Portal';
      case '/communities':
        return 'Communities';
      case '/progression':
        return 'My Journey';
      case '/referral':
        return 'Referrals';
      default:
        return 'DMB';
    }
  }
}

class _BottomNav extends StatelessWidget {
  final String currentPath;
  final ValueChanged<String> onTap;

  const _BottomNav({required this.currentPath, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: AppDecorations.bottomNavHeight,
      decoration: const BoxDecoration(
        color: AppColors.white,
        boxShadow: [
          BoxShadow(
            color: Color(0x1A000000),
            blurRadius: 10,
            offset: Offset(0, -2),
          ),
        ],
      ),
      child: Row(
        children: [
          _NavItem(
            icon: LucideIcons.compass,
            label: 'Discover',
            isActive: currentPath == '/discovery',
            onTap: () => onTap('/discovery'),
          ),
          _NavItem(
            icon: LucideIcons.heart,
            label: 'Proposals',
            isActive: currentPath == '/dashboard',
            onTap: () => onTap('/dashboard'),
          ),
          _NavItem(
            icon: LucideIcons.messageSquare,
            label: 'Messages',
            isActive: currentPath == '/messages',
            onTap: () => onTap('/messages'),
          ),
          _NavItem(
            icon: LucideIcons.userCircle,
            label: 'Profile',
            isActive: currentPath == '/profile-edit',
            onTap: () => onTap('/profile-edit'),
          ),
          _NavItem(
            icon: LucideIcons.settings,
            label: 'Settings',
            isActive: currentPath == '/settings',
            onTap: () => onTap('/settings'),
          ),
        ],
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isActive;
  final VoidCallback onTap;

  const _NavItem({
    required this.icon,
    required this.label,
    required this.isActive,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        behavior: HitTestBehavior.opaque,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 22,
              color: isActive ? AppColors.primary : AppColors.slate400,
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: TextStyle(
                fontSize: 10,
                fontWeight: isActive ? FontWeight.w600 : FontWeight.w500,
                color: isActive ? AppColors.primary : AppColors.slate400,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
