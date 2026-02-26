import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/core.dart';

/// Settings Screen - Account, Privacy, Safety, Billing
/// Transpiled from SettingsView.tsx
class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
        title: const Text('Settings'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.md),
        children: [
          // Account Section
          _buildSectionHeader(context, 'Account'),
          _SettingsTile(
            icon: Icons.person_outline,
            title: 'Personal Information',
            subtitle: 'Name, email, phone number',
            onTap: () {},
          ),
          _SettingsTile(
            icon: Icons.verified_user_outlined,
            title: 'Identity Verification',
            subtitle: 'Document verification status',
            badge: 'Verified',
            badgeColor: AppColors.success,
            onTap: () {},
          ),
          _SettingsTile(
            icon: Icons.security_outlined,
            title: 'Security',
            subtitle: 'Password, 2FA, login activity',
            onTap: () {},
          ),

          const SizedBox(height: AppSpacing.lg),

          // Privacy Section
          _buildSectionHeader(context, 'Privacy'),
          _SettingsTile(
            icon: Icons.visibility_outlined,
            title: 'Profile Visibility',
            subtitle: 'Who can see your profile',
            onTap: () {},
          ),
          _SettingsTile(
            icon: Icons.block_outlined,
            title: 'Blocked Users',
            subtitle: 'Manage blocked profiles',
            onTap: () {},
          ),
          _SettingsTile(
            icon: Icons.do_not_disturb_on_outlined,
            title: 'Hidden Profiles',
            subtitle: 'Profiles you\'ve hidden',
            onTap: () {},
          ),

          const SizedBox(height: AppSpacing.lg),

          // Safety Section
          _buildSectionHeader(context, 'Safety'),
          _SettingsTile(
            icon: Icons.report_outlined,
            title: 'Report a Problem',
            subtitle: 'Report suspicious activity',
            onTap: () {},
          ),
          _SettingsTile(
            icon: Icons.help_outline,
            title: 'Safety Tips',
            subtitle: 'Guidelines for safe matchmaking',
            onTap: () {},
          ),
          _SettingsTile(
            icon: Icons.emergency_outlined,
            title: 'Emergency Contacts',
            subtitle: 'Add trusted contacts',
            onTap: () {},
          ),

          const SizedBox(height: AppSpacing.lg),

          // Billing Section
          _buildSectionHeader(context, 'Subscription & Billing'),
          _SettingsTile(
            icon: Icons.workspace_premium_outlined,
            title: 'Current Plan',
            subtitle: 'Free Plan',
            badge: 'Upgrade',
            badgeColor: AppColors.primary,
            onTap: () {
              // TODO: Show subscription modal
            },
          ),
          _SettingsTile(
            icon: Icons.receipt_long_outlined,
            title: 'Billing History',
            subtitle: 'View past transactions',
            onTap: () {},
          ),
          _SettingsTile(
            icon: Icons.payment_outlined,
            title: 'Payment Methods',
            subtitle: 'Manage payment options',
            onTap: () {},
          ),

          const SizedBox(height: AppSpacing.lg),

          // Preferences Section
          _buildSectionHeader(context, 'Preferences'),
          _SettingsTile(
            icon: Icons.notifications_outlined,
            title: 'Notifications',
            subtitle: 'Push, email, SMS settings',
            onTap: () {},
          ),
          _SettingsTile(
            icon: Icons.language_outlined,
            title: 'Language',
            subtitle: 'English',
            onTap: () {},
          ),
          _SettingsTile(
            icon: Icons.dark_mode_outlined,
            title: 'Appearance',
            subtitle: 'Light mode',
            onTap: () {},
          ),

          const SizedBox(height: AppSpacing.lg),

          // About Section
          _buildSectionHeader(context, 'About'),
          _SettingsTile(
            icon: Icons.info_outline,
            title: 'About DMB',
            subtitle: 'Version 1.0.0',
            onTap: () {},
          ),
          _SettingsTile(
            icon: Icons.description_outlined,
            title: 'Terms of Service',
            onTap: () {},
          ),
          _SettingsTile(
            icon: Icons.privacy_tip_outlined,
            title: 'Privacy Policy',
            onTap: () {},
          ),

          const SizedBox(height: AppSpacing.xl),

          // Danger Zone
          Container(
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(
              color: AppColors.error.withOpacity(0.05),
              borderRadius: BorderRadius.circular(AppRadius.lg),
              border: Border.all(color: AppColors.error.withOpacity(0.2)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Danger Zone',
                  style: AppTypography.titleSmall.copyWith(
                    color: AppColors.error,
                  ),
                ),
                const SizedBox(height: AppSpacing.md),
                _DangerButton(
                  label: 'Deactivate Account',
                  onTap: () {},
                ),
                const SizedBox(height: AppSpacing.sm),
                _DangerButton(
                  label: 'Delete Account',
                  onTap: () {},
                ),
              ],
            ),
          ),

          const SizedBox(height: AppSpacing.xxl),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(BuildContext context, String title) {
    return Padding(
      padding: const EdgeInsets.only(
        left: AppSpacing.xs,
        bottom: AppSpacing.sm,
      ),
      child: Text(
        title,
        style: AppTypography.titleMedium.copyWith(
          color: AppColors.textPrimary,
        ),
      ),
    );
  }
}

class _SettingsTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final String? badge;
  final Color? badgeColor;
  final VoidCallback onTap;

  const _SettingsTile({
    required this.icon,
    required this.title,
    this.subtitle,
    this.badge,
    this.badgeColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.xs),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(color: AppColors.border),
      ),
      child: ListTile(
        leading: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: AppColors.slate50,
            borderRadius: BorderRadius.circular(AppRadius.sm),
          ),
          child: Icon(icon, color: AppColors.textSecondary, size: 20),
        ),
        title: Text(title, style: AppTypography.bodyMedium),
        subtitle: subtitle != null
            ? Text(
                subtitle!,
                style: AppTypography.bodySmall.copyWith(
                  color: AppColors.textSecondary,
                ),
              )
            : null,
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (badge != null)
              Container(
                margin: const EdgeInsets.only(right: AppSpacing.sm),
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.sm,
                  vertical: AppSpacing.xxs,
                ),
                decoration: BoxDecoration(
                  color: badgeColor?.withOpacity(0.1) ?? AppColors.slate100,
                  borderRadius: BorderRadius.circular(AppRadius.full),
                ),
                child: Text(
                  badge!,
                  style: AppTypography.labelSmall.copyWith(
                    color: badgeColor ?? AppColors.textSecondary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            const Icon(Icons.chevron_right, color: AppColors.textMuted),
          ],
        ),
        onTap: onTap,
      ),
    );
  }
}

class _DangerButton extends StatelessWidget {
  final String label;
  final VoidCallback onTap;

  const _DangerButton({
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton(
        onPressed: onTap,
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.error,
          side: BorderSide(color: AppColors.error.withOpacity(0.5)),
          padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
        ),
        child: Text(label),
      ),
    );
  }
}
