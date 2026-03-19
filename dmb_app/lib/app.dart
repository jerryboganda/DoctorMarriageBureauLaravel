import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:go_router/go_router.dart';

import 'theme/app_theme.dart';
import 'providers/auth_provider.dart';
import 'providers/locale_provider.dart';

import 'screens/welcome_screen.dart';
import 'screens/auth_screen.dart';
import 'screens/app_shell.dart';
import 'screens/discovery_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/chat_list_screen.dart';
import 'screens/chat_detail_screen.dart';
import 'screens/profile_edit_screen.dart';
import 'screens/settings_screen.dart';
import 'screens/notifications_screen.dart';
import 'screens/family_portal_screen.dart';
import 'screens/community_screen.dart';
import 'screens/progression_screen.dart';
import 'screens/referral_screen.dart';

/// GoRouter configuration matching React App.tsx navigation
final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/discovery',
    redirect: (context, state) {
      final isAuth = authState.isAuthenticated;
      final isLoading = authState.isLoading;
      final path = state.uri.path;

      // While loading auth, don't redirect
      if (isLoading) return null;

      // Public routes
      final publicRoutes = ['/welcome', '/auth'];
      final isPublicRoute = publicRoutes.contains(path);

      // Not authenticated -> go to welcome
      if (!isAuth && !isPublicRoute) return '/welcome';

      // Authenticated but on public route -> go to discovery
      if (isAuth && isPublicRoute) return '/discovery';

      return null;
    },
    routes: [
      GoRoute(
        path: '/welcome',
        builder: (context, state) => const WelcomeScreen(),
      ),
      GoRoute(
        path: '/auth',
        builder: (context, state) => const AuthScreen(),
      ),

      // Main app with shell (drawer + bottom nav)
      ShellRoute(
        builder: (context, state, child) => AppShell(child: child),
        routes: [
          GoRoute(
            path: '/discovery',
            builder: (context, state) => const DiscoveryScreen(),
          ),
          GoRoute(
            path: '/dashboard',
            builder: (context, state) => const DashboardScreen(),
          ),
          GoRoute(
            path: '/messages',
            builder: (context, state) => const ChatListScreen(),
          ),
          GoRoute(
            path: '/profile-edit',
            builder: (context, state) => const ProfileEditScreen(),
          ),
          GoRoute(
            path: '/settings',
            builder: (context, state) => const SettingsScreen(),
          ),
          GoRoute(
            path: '/notifications',
            builder: (context, state) => const NotificationsScreen(),
          ),
          GoRoute(
            path: '/family',
            builder: (context, state) => const FamilyPortalScreen(),
          ),
          GoRoute(
            path: '/communities',
            builder: (context, state) => const CommunityScreen(),
          ),
          GoRoute(
            path: '/progression',
            builder: (context, state) => const ProgressionScreen(),
          ),
          GoRoute(
            path: '/referral',
            builder: (context, state) => const ReferralScreen(),
          ),
        ],
      ),

      // Chat detail (outside shell for full-screen)
      GoRoute(
        path: '/messages/:threadId',
        builder: (context, state) => ChatDetailScreen(
          threadId: state.pathParameters['threadId']!,
        ),
      ),
    ],
  );
});

/// Root app widget
class DmbApp extends ConsumerWidget {
  const DmbApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    final localeState = ref.watch(localeProvider);

    return Directionality(
      textDirection: localeState.textDirection,
      child: MaterialApp.router(
        title: 'Doctor Marriage Bureau',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light(locale: localeState.languageCode),
        routerConfig: router,
        locale: localeState.locale,
        supportedLocales: const [
          Locale('en'),
          Locale('ur'),
        ],
        localizationsDelegates: const [
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
      ),
    );
  }
}
