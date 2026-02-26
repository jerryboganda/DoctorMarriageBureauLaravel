import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/core.dart';

/// Communities Screen - Community networks and groups
/// Transpiled from CommunityView.tsx
class CommunitiesScreen extends ConsumerWidget {
  const CommunitiesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
        title: const Text('Communities'),
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () {},
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.md),
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(AppSpacing.lg),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF10B981), Color(0xFF059669)],
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
                          const Icon(Icons.public,
                              size: 14, color: Colors.white),
                          const SizedBox(width: AppSpacing.xxs),
                          Text(
                            'NETWORK',
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
                  'Connect with Communities',
                  style: AppTypography.headlineMedium.copyWith(
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  'Join groups based on profession, interests, and values',
                  style: AppTypography.bodyMedium.copyWith(
                    color: Colors.white.withOpacity(0.8),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: AppSpacing.xl),

          // Your Communities
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Your Communities',
                style: AppTypography.titleLarge,
              ),
              TextButton(
                onPressed: () {},
                child: Text(
                  'See All',
                  style: AppTypography.labelMedium.copyWith(
                    color: AppColors.primary,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),

          SizedBox(
            height: 140,
            child: ListView(
              scrollDirection: Axis.horizontal,
              children: const [
                _CommunityChip(
                  name: 'Medical Professionals',
                  members: 12500,
                  icon: Icons.local_hospital,
                  color: Color(0xFF3B82F6),
                  isJoined: true,
                ),
                _CommunityChip(
                  name: 'Delhi Doctors',
                  members: 3200,
                  icon: Icons.location_city,
                  color: Color(0xFFF59E0B),
                  isJoined: true,
                ),
                _CommunityChip(
                  name: 'AIIMS Alumni',
                  members: 8900,
                  icon: Icons.school,
                  color: Color(0xFF8B5CF6),
                  isJoined: true,
                ),
              ],
            ),
          ),

          const SizedBox(height: AppSpacing.xl),

          // Suggested Communities
          Text(
            'Suggested for You',
            style: AppTypography.titleLarge,
          ),
          const SizedBox(height: AppSpacing.md),

          _SuggestedCommunityCard(
            name: 'Cardiologists Network',
            description:
                'A community for cardiac specialists to connect and find matches within the profession',
            members: 5600,
            icon: Icons.favorite,
            color: Colors.red,
          ),
          _SuggestedCommunityCard(
            name: 'Research Academics',
            description:
                'Connect with doctors passionate about clinical research',
            members: 2100,
            icon: Icons.science,
            color: Colors.teal,
          ),
          _SuggestedCommunityCard(
            name: 'Vegetarian Doctors',
            description:
                'For medical professionals who follow a vegetarian lifestyle',
            members: 4300,
            icon: Icons.eco,
            color: Colors.green,
          ),
          _SuggestedCommunityCard(
            name: 'Classical Music Lovers',
            description: 'Doctors who appreciate classical music and arts',
            members: 1800,
            icon: Icons.music_note,
            color: Colors.purple,
          ),

          const SizedBox(height: AppSpacing.xxl),
        ],
      ),
    );
  }
}

class _CommunityChip extends StatelessWidget {
  final String name;
  final int members;
  final IconData icon;
  final Color color;
  final bool isJoined;

  const _CommunityChip({
    required this.name,
    required this.members,
    required this.icon,
    required this.color,
    required this.isJoined,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 160,
      margin: const EdgeInsets.only(right: AppSpacing.md),
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(AppRadius.md),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            name,
            style: AppTypography.labelLarge,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const Spacer(),
          Row(
            children: [
              Icon(Icons.people_outline, size: 14, color: AppColors.textMuted),
              const SizedBox(width: AppSpacing.xxs),
              Text(
                '${(members / 1000).toStringAsFixed(1)}k',
                style: AppTypography.caption,
              ),
              const Spacer(),
              if (isJoined)
                const Icon(Icons.check_circle,
                    size: 16, color: AppColors.success),
            ],
          ),
        ],
      ),
    );
  }
}

class _SuggestedCommunityCard extends StatelessWidget {
  final String name;
  final String description;
  final int members;
  final IconData icon;
  final Color color;

  const _SuggestedCommunityCard({
    required this.name,
    required this.description,
    required this.members,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.md),
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(AppRadius.md),
            ),
            child: Icon(icon, color: color, size: 28),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: AppTypography.titleSmall),
                const SizedBox(height: AppSpacing.xxs),
                Text(
                  description,
                  style: AppTypography.bodySmall.copyWith(
                    color: AppColors.textSecondary,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: AppSpacing.xs),
                Row(
                  children: [
                    Icon(Icons.people_outline,
                        size: 14, color: AppColors.textMuted),
                    const SizedBox(width: AppSpacing.xxs),
                    Text(
                      '${(members / 1000).toStringAsFixed(1)}k members',
                      style: AppTypography.caption,
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
          OutlinedButton(
            onPressed: () {},
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.md,
                vertical: AppSpacing.sm,
              ),
            ),
            child: const Text('Join'),
          ),
        ],
      ),
    );
  }
}
