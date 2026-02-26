import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../providers/providers.dart';
import '../screens/auth/welcome_screen.dart';
import '../screens/dashboard/dashboard_screen.dart';
import '../screens/discovery/discovery_screen.dart';
import '../screens/messages/messages_screen.dart';
import '../screens/messages/chat_detail_screen.dart';
import '../screens/progression/progression_screen.dart';
import '../screens/profile/profile_screen.dart';
import '../screens/settings/settings_screen.dart';
import '../screens/notifications/notifications_screen.dart';
import '../screens/family/family_portal_screen.dart';
import '../screens/communities/communities_screen.dart';
import '../widgets/navigation/main_shell.dart';
import '../widgets/modals/auth_modal.dart';
import '../widgets/modals/onboarding_modal.dart';
import 'route_names.dart';

/// Global navigator keys for shell navigation
final GlobalKey<NavigatorState> _rootNavigatorKey =
    GlobalKey<NavigatorState>(debugLabel: 'root');
final GlobalKey<NavigatorState> _shellNavigatorKey =
    GlobalKey<NavigatorState>(debugLabel: 'shell');

/// Custom page for dialog routes in GoRouter
class DialogPage<T> extends Page<T> {
  final WidgetBuilder builder;

  const DialogPage({
    required this.builder,
    super.key,
    super.name,
  });

  @override
  Route<T> createRoute(BuildContext context) {
    return DialogRoute<T>(
      context: context,
      settings: this,
      builder: builder,
      barrierDismissible: false,
    );
  }
}

/// GoRouter provider with auth redirect
final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);

  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    debugLogDiagnostics: true,
    initialLocation: RouteNames.dashboard,

    // Auth redirect guard
    redirect: (context, state) {
      final isAuthenticated = authState.isAuthenticated;
      final isOnAuthRoute = state.matchedLocation == RouteNames.welcome;

      // If not authenticated and not on auth route, redirect to welcome
      if (!isAuthenticated && !isOnAuthRoute) {
        return RouteNames.welcome;
      }

      // If authenticated and on auth route, redirect to dashboard
      if (isAuthenticated && isOnAuthRoute) {
        return RouteNames.dashboard;
      }

      return null;
    },

    routes: [
      // Auth route (outside shell)
      GoRoute(
        path: RouteNames.welcome,
        name: 'welcome',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const WelcomeScreen(),
      ),

      // Main shell with bottom navigation
      StatefulShellRoute.indexedStack(
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state, navigationShell) {
          return MainShell(navigationShell: navigationShell);
        },
        branches: [
          // Branch 0: Dashboard (Home/Proposals)
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: RouteNames.dashboard,
                name: 'dashboard',
                builder: (context, state) => const DashboardScreen(),
              ),
            ],
          ),

          // Branch 1: Discovery
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: RouteNames.discovery,
                name: 'discovery',
                builder: (context, state) => const DiscoveryScreen(),
              ),
            ],
          ),

          // Branch 2: Messages (with nested chat detail)
          StatefulShellBranch(
            navigatorKey: _shellNavigatorKey,
            routes: [
              GoRoute(
                path: RouteNames.messages,
                name: 'messages',
                builder: (context, state) => const MessagesScreen(),
                routes: [
                  GoRoute(
                    path: ':chatId',
                    name: 'chatDetail',
                    builder: (context, state) {
                      final chatId = state.pathParameters['chatId']!;
                      return ChatDetailScreen(chatId: chatId);
                    },
                  ),
                ],
              ),
            ],
          ),

          // Branch 3: Journey/Progression
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: RouteNames.progression,
                name: 'progression',
                builder: (context, state) => const ProgressionScreen(),
              ),
            ],
          ),

          // Branch 4: Profile
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: RouteNames.profile,
                name: 'profile',
                builder: (context, state) => const ProfileScreen(),
              ),
            ],
          ),
        ],
      ),

      // Settings (full-screen, outside shell)
      GoRoute(
        path: RouteNames.settings,
        name: 'settings',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const SettingsScreen(),
      ),

      // Notifications (full-screen, outside shell)
      GoRoute(
        path: RouteNames.notifications,
        name: 'notifications',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const NotificationsScreen(),
      ),

      // Family Portal (full-screen, outside shell)
      GoRoute(
        path: RouteNames.family,
        name: 'family',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const FamilyPortalScreen(),
      ),

      // Communities (full-screen, outside shell)
      GoRoute(
        path: RouteNames.communities,
        name: 'communities',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const CommunitiesScreen(),
      ),

      // Auth Modal (dialog route)
      GoRoute(
        path: RouteNames.authModal,
        name: 'authModal',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => DialogPage(
          builder: (context) => AuthModal(
            onClose: () => context.pop(),
            onLogin: () {
              context.pop();
              context.push(RouteNames.onboardingModal);
            },
          ),
        ),
      ),

      // Onboarding Modal (dialog route)
      GoRoute(
        path: RouteNames.onboardingModal,
        name: 'onboardingModal',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => DialogPage(
          builder: (context) => OnboardingModal(
            onClose: () => context.pop(),
            onComplete: () {
              context.pop();
              context.go(RouteNames.dashboard);
            },
          ),
        ),
      ),
    ],

    // Error page
    errorBuilder: (context, state) => Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            Text('Page not found: ${state.matchedLocation}'),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => context.go(RouteNames.dashboard),
              child: const Text('Go Home'),
            ),
          ],
        ),
      ),
    ),
  );
});
