import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/core.dart';

/// Match Insights Panel - transpiled from RightSidebar.tsx
/// Shows compatibility analytics and recent activity on Dashboard
class MatchInsightsPanel extends ConsumerWidget {
  const MatchInsightsPanel({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Drawer(
      width: 340,
      child: SafeArea(
        child: Column(
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Match Insights',
                    style: AppTypography.headlineSmall,
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),

            const Divider(height: 1),

            // Content
            Expanded(
              child: ListView(
                padding: const EdgeInsets.all(AppSpacing.lg),
                children: [
                  // Vitals Check Section
                  _buildVitalsCheck(context),

                  const SizedBox(height: AppSpacing.xl),

                  // Recent Activity Section
                  _buildRecentActivity(context),

                  const SizedBox(height: AppSpacing.xl),

                  // Quick Tip Card
                  _buildQuickTip(context),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildVitalsCheck(BuildContext context) {
    // Mock compatibility metrics
    final metrics = [
      _CompatibilityMetric(
          label: 'Shift Compatibility',
          percentage: 88,
          color: AppColors.primary),
      _CompatibilityMetric(
          label: 'Research Interests',
          percentage: 92,
          color: AppColors.primary),
      _CompatibilityMetric(
          label: 'Lifestyle Goals', percentage: 74, color: AppColors.warning),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Vitals Check',
              style: AppTypography.titleLarge,
            ),
            IconButton(
              icon: const Icon(Icons.info_outline, size: 18),
              color: AppColors.primary,
              onPressed: () {
                // TODO: Show info dialog
              },
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.md),
        Container(
          padding: const EdgeInsets.all(AppSpacing.lg),
          decoration: BoxDecoration(
            color: AppColors.slate50,
            borderRadius: BorderRadius.circular(AppRadius.lg),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                "Based on Dr. Aditi's Profile",
                style: AppTypography.bodySmall.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),

              const SizedBox(height: AppSpacing.lg),

              // Metrics
              ...metrics.map((metric) => Padding(
                    padding: const EdgeInsets.only(bottom: AppSpacing.lg),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              metric.label,
                              style: AppTypography.bodyMedium,
                            ),
                            Text(
                              '${metric.percentage}%',
                              style: AppTypography.labelLarge,
                            ),
                          ],
                        ),
                        const SizedBox(height: AppSpacing.xs),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(AppRadius.full),
                          child: LinearProgressIndicator(
                            value: metric.percentage / 100,
                            backgroundColor: AppColors.slate200,
                            valueColor:
                                AlwaysStoppedAnimation<Color>(metric.color),
                            minHeight: 8,
                          ),
                        ),
                      ],
                    ),
                  )),

              const Divider(),
              const SizedBox(height: AppSpacing.sm),

              // Summary
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(
                    Icons.check_circle,
                    color: AppColors.success,
                    size: 18,
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: Text(
                      'Strong match for long-term career planning and family values.',
                      style: AppTypography.bodySmall.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildRecentActivity(BuildContext context) {
    // Mock activity items
    final activities = [
      _ActivityItem(
        type: 'view',
        user: 'Dr. Raj Patel',
        message: null,
        time: '12 mins ago',
      ),
      _ActivityItem(
        type: 'message',
        user: 'Dr. Emily Chen',
        message: '"Hello Dr. Kumar, I saw your research paper on..."',
        time: '1 hour ago',
      ),
      _ActivityItem(
        type: 'update',
        user: null,
        message: 'Profile visibility updated',
        time: 'Yesterday',
      ),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Recent Activity',
          style: AppTypography.titleLarge,
        ),

        const SizedBox(height: AppSpacing.md),

        // Timeline
        Container(
          decoration: const BoxDecoration(
            border: Border(
              left: BorderSide(
                color: AppColors.slate100,
                width: 2,
              ),
            ),
          ),
          child: Column(
            children: activities.map((activity) {
              Color dotColor;
              switch (activity.type) {
                case 'view':
                  dotColor = AppColors.primary;
                  break;
                case 'message':
                  dotColor = AppColors.info;
                  break;
                default:
                  dotColor = AppColors.slate300;
              }

              return Padding(
                padding: const EdgeInsets.only(
                  left: AppSpacing.lg,
                  bottom: AppSpacing.lg,
                ),
                child: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    // Dot indicator
                    Positioned(
                      left: -AppSpacing.lg - 7,
                      top: 4,
                      child: Container(
                        width: 12,
                        height: 12,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: dotColor,
                            width: 2,
                          ),
                        ),
                      ),
                    ),

                    // Content
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (activity.type == 'view')
                          RichText(
                            text: TextSpan(
                              style: AppTypography.bodyMedium.copyWith(
                                color: AppColors.textPrimary,
                              ),
                              children: [
                                TextSpan(
                                  text: activity.user,
                                  style: const TextStyle(
                                      fontWeight: FontWeight.w700),
                                ),
                                const TextSpan(text: ' viewed your profile'),
                              ],
                            ),
                          ),
                        if (activity.type == 'message') ...[
                          RichText(
                            text: TextSpan(
                              style: AppTypography.bodyMedium.copyWith(
                                color: AppColors.textPrimary,
                              ),
                              children: [
                                const TextSpan(text: 'New message from '),
                                TextSpan(
                                  text: activity.user,
                                  style: const TextStyle(
                                      fontWeight: FontWeight.w700),
                                ),
                              ],
                            ),
                          ),
                          if (activity.message != null) ...[
                            const SizedBox(height: AppSpacing.xs),
                            Container(
                              padding: const EdgeInsets.all(AppSpacing.sm),
                              decoration: BoxDecoration(
                                color: AppColors.slate50,
                                borderRadius:
                                    BorderRadius.circular(AppRadius.md),
                              ),
                              child: Text(
                                activity.message!,
                                style: AppTypography.bodySmall.copyWith(
                                  color: AppColors.textSecondary,
                                  fontStyle: FontStyle.italic,
                                ),
                              ),
                            ),
                          ],
                        ],
                        if (activity.type == 'update')
                          Text(
                            activity.message ?? '',
                            style: AppTypography.bodyMedium,
                          ),
                        const SizedBox(height: AppSpacing.xs),
                        Text(
                          activity.time,
                          style: AppTypography.caption,
                        ),
                      ],
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
        ),
      ],
    );
  }

  Widget _buildQuickTip(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppColors.primary.withOpacity(0.1),
            Colors.transparent,
          ],
        ),
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(
          color: AppColors.primary.withOpacity(0.2),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.lightbulb_outline,
                color: AppColors.primary,
                size: 20,
              ),
              const SizedBox(width: AppSpacing.sm),
              Text(
                'Profile Tip',
                style: AppTypography.titleSmall.copyWith(
                  color: AppColors.primary,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'Doctors with a complete "Hobbies" section get 40% more interest. Add yours today!',
            style: AppTypography.bodySmall.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}

/// Internal model for compatibility metrics
class _CompatibilityMetric {
  final String label;
  final int percentage;
  final Color color;

  _CompatibilityMetric({
    required this.label,
    required this.percentage,
    required this.color,
  });
}

/// Internal model for activity items
class _ActivityItem {
  final String type;
  final String? user;
  final String? message;
  final String time;

  _ActivityItem({
    required this.type,
    this.user,
    this.message,
    required this.time,
  });
}
