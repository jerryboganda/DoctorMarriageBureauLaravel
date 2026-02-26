import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/core.dart';
import '../../routes/route_names.dart';
import 'app_drawer.dart';
import 'match_insights_panel.dart';

/// Main shell scaffold with bottom navigation
/// Wraps all main app screens with persistent navigation
class MainShell extends ConsumerStatefulWidget {
  final StatefulNavigationShell navigationShell;

  const MainShell({
    super.key,
    required this.navigationShell,
  });

  @override
  ConsumerState<MainShell> createState() => _MainShellState();
}

class _MainShellState extends ConsumerState<MainShell> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  // Bottom nav items matching the 5 shell branches
  static const List<_NavItem> _navItems = [
    _NavItem(
      icon: Icons.favorite_outline,
      activeIcon: Icons.favorite,
      label: 'Home',
    ),
    _NavItem(
      icon: Icons.explore_outlined,
      activeIcon: Icons.explore,
      label: 'Discover',
    ),
    _NavItem(
      icon: Icons.chat_bubble_outline,
      activeIcon: Icons.chat_bubble,
      label: 'Messages',
    ),
    _NavItem(
      icon: Icons.timeline_outlined,
      activeIcon: Icons.timeline,
      label: 'Journey',
    ),
    _NavItem(
      icon: Icons.person_outline,
      activeIcon: Icons.person,
      label: 'Profile',
    ),
  ];

  void _onNavTap(int index) {
    widget.navigationShell.goBranch(
      index,
      initialLocation: index == widget.navigationShell.currentIndex,
    );
  }

  String _getAppBarTitle() {
    switch (widget.navigationShell.currentIndex) {
      case 0:
        return 'Proposals';
      case 1:
        return 'Discovery';
      case 2:
        return 'Messages';
      case 3:
        return 'Journey';
      case 4:
        return 'Profile';
      default:
        return 'DMB';
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDashboard = widget.navigationShell.currentIndex == 0;

    return Scaffold(
      key: _scaffoldKey,

      // App Drawer (left side - transpiled from Sidebar.tsx)
      drawer: const AppDrawer(),

      // Match Insights Panel (right side - only on dashboard)
      endDrawer: isDashboard ? const MatchInsightsPanel() : null,

      // App Bar
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.menu),
          onPressed: () => _scaffoldKey.currentState?.openDrawer(),
        ),
        title: Text(_getAppBarTitle()),
        centerTitle: false,
        actions: [
          // Notifications button
          IconButton(
            icon: Badge(
              isLabelVisible: true,
              label: const Text('6'),
              child: const Icon(Icons.notifications_outlined),
            ),
            onPressed: () => context.push(RouteNames.notifications),
          ),

          // Match Insights button (only on dashboard)
          if (isDashboard)
            IconButton(
              icon: const Icon(Icons.insights_outlined),
              onPressed: () => _scaffoldKey.currentState?.openEndDrawer(),
            ),

          const SizedBox(width: AppSpacing.xs),
        ],
      ),

      // Body - Navigation shell content
      body: widget.navigationShell,

      // Bottom Navigation Bar
      bottomNavigationBar: NavigationBar(
        selectedIndex: widget.navigationShell.currentIndex,
        onDestinationSelected: _onNavTap,
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        destinations: _navItems.map((item) {
          return NavigationDestination(
            icon: Icon(item.icon),
            selectedIcon: Icon(item.activeIcon),
            label: item.label,
          );
        }).toList(),
      ),
    );
  }
}

/// Internal nav item model
class _NavItem {
  final IconData icon;
  final IconData activeIcon;
  final String label;

  const _NavItem({
    required this.icon,
    required this.activeIcon,
    required this.label,
  });
}
