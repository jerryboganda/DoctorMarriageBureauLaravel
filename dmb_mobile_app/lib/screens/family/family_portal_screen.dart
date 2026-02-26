import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/core.dart';

/// Family Portal Screen - Family profile, guardians, approvals
/// Transpiled from FamilyPortalView.tsx
class FamilyPortalScreen extends ConsumerWidget {
  const FamilyPortalScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
        title: const Text('Family Portal'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () {
              // TODO: Add family member
            },
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.md),
        children: [
          // Header Card
          Container(
            padding: const EdgeInsets.all(AppSpacing.lg),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)],
              ),
              borderRadius: BorderRadius.circular(AppRadius.xl),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.sm,
                        vertical: AppSpacing.xxs,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(AppRadius.full),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.family_restroom,
                              size: 14, color: Colors.white),
                          const SizedBox(width: AppSpacing.xxs),
                          Text(
                            'FAMILY CIRCLE',
                            style: AppTypography.labelSmall.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.md),
                Text(
                  'Kumar Family',
                  style: AppTypography.headlineMedium.copyWith(
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  '3 members connected',
                  style: AppTypography.bodyMedium.copyWith(
                    color: Colors.white.withOpacity(0.8),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: AppSpacing.xl),

          // Family Members Section
          Text(
            'Family Members',
            style: AppTypography.titleLarge,
          ),
          const SizedBox(height: AppSpacing.md),

          _FamilyMemberCard(
            name: 'Mr. Suresh Kumar',
            relation: 'Father',
            role: 'Primary Guardian',
            status: 'Active',
            avatarColor: Colors.blue,
          ),
          _FamilyMemberCard(
            name: 'Mrs. Meera Kumar',
            relation: 'Mother',
            role: 'Guardian',
            status: 'Active',
            avatarColor: Colors.purple,
          ),
          _FamilyMemberCard(
            name: 'Dr. Priya Kumar',
            relation: 'Sister',
            role: 'Advisor',
            status: 'Pending Invite',
            avatarColor: Colors.pink,
          ),

          const SizedBox(height: AppSpacing.xl),

          // Pending Approvals Section
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Pending Approvals',
                style: AppTypography.titleLarge,
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.sm,
                  vertical: AppSpacing.xxs,
                ),
                decoration: BoxDecoration(
                  color: AppColors.warning.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(AppRadius.full),
                ),
                child: Text(
                  '2',
                  style: AppTypography.labelMedium.copyWith(
                    color: AppColors.warning,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),

          _ApprovalCard(
            profileName: 'Dr. Aditi Sharma',
            specialty: 'Cardiology',
            requestedBy: 'Rajesh (You)',
            matchPercentage: 98,
          ),
          _ApprovalCard(
            profileName: 'Dr. Rohan Gupta',
            specialty: 'Orthopedics',
            requestedBy: 'Matchmaker',
            matchPercentage: 85,
          ),

          const SizedBox(height: AppSpacing.xl),

          // Family Settings
          Text(
            'Settings',
            style: AppTypography.titleLarge,
          ),
          const SizedBox(height: AppSpacing.md),

          _SettingTile(
            icon: Icons.visibility_outlined,
            title: 'Profile Visibility',
            subtitle: 'Family can view all profiles',
          ),
          _SettingTile(
            icon: Icons.notifications_outlined,
            title: 'Notifications',
            subtitle: 'Notify family of new matches',
          ),
          _SettingTile(
            icon: Icons.approval_outlined,
            title: 'Approval Workflow',
            subtitle: 'Require family approval for proposals',
          ),

          const SizedBox(height: AppSpacing.xxl),
        ],
      ),
    );
  }
}

class _FamilyMemberCard extends StatelessWidget {
  final String name;
  final String relation;
  final String role;
  final String status;
  final Color avatarColor;

  const _FamilyMemberCard({
    required this.name,
    required this.relation,
    required this.role,
    required this.status,
    required this.avatarColor,
  });

  @override
  Widget build(BuildContext context) {
    final isPending = status == 'Pending Invite';

    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.sm),
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(
          color: isPending ? AppColors.warning : AppColors.border,
        ),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 24,
            backgroundColor: avatarColor.withOpacity(0.1),
            child: Text(
              name.substring(0, 1),
              style: AppTypography.titleMedium.copyWith(
                color: avatarColor,
              ),
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: AppTypography.titleSmall),
                Text(
                  '$relation • $role',
                  style: AppTypography.bodySmall.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.sm,
              vertical: AppSpacing.xxs,
            ),
            decoration: BoxDecoration(
              color: isPending
                  ? AppColors.warning.withOpacity(0.1)
                  : AppColors.success.withOpacity(0.1),
              borderRadius: BorderRadius.circular(AppRadius.full),
            ),
            child: Text(
              status,
              style: AppTypography.labelSmall.copyWith(
                color: isPending ? AppColors.warning : AppColors.success,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ApprovalCard extends StatelessWidget {
  final String profileName;
  final String specialty;
  final String requestedBy;
  final int matchPercentage;

  const _ApprovalCard({
    required this.profileName,
    required this.specialty,
    required this.requestedBy,
    required this.matchPercentage,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.sm),
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: AppColors.warning),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 24,
                backgroundColor: AppColors.slate100,
                child: const Icon(Icons.person, color: AppColors.slate400),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(profileName, style: AppTypography.titleSmall),
                    Text(
                      specialty,
                      style: AppTypography.bodySmall.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.sm,
                  vertical: AppSpacing.xxs,
                ),
                decoration: BoxDecoration(
                  color: AppColors.primaryLight,
                  borderRadius: BorderRadius.circular(AppRadius.full),
                ),
                child: Text(
                  '$matchPercentage%',
                  style: AppTypography.labelMedium.copyWith(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'Requested by: $requestedBy',
            style: AppTypography.caption,
          ),
          const SizedBox(height: AppSpacing.md),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () {},
                  child: const Text('Decline'),
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: ElevatedButton(
                  onPressed: () {},
                  child: const Text('Approve'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _SettingTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;

  const _SettingTile({
    required this.icon,
    required this.title,
    required this.subtitle,
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
        leading: Icon(icon, color: AppColors.textSecondary),
        title: Text(title, style: AppTypography.bodyMedium),
        subtitle: Text(
          subtitle,
          style: AppTypography.bodySmall.copyWith(
            color: AppColors.textSecondary,
          ),
        ),
        trailing: Switch(
          value: true,
          onChanged: (value) {},
          activeColor: AppColors.primary,
        ),
      ),
    );
  }
}
