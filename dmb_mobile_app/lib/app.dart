import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/core.dart';
import 'routes/app_router.dart';

/// DMB App - Main Application Widget
/// This is the root widget that configures theme and navigation
class DMBApp extends ConsumerWidget {
  const DMBApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(appRouterProvider);

    return MaterialApp.router(
      title: AppInfo.fullName,
      debugShowCheckedModeBanner: false,

      // Theme Configuration
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.light, // TODO: Make dynamic with Riverpod

      // GoRouter Configuration
      routerConfig: router,
    );
  }
}
