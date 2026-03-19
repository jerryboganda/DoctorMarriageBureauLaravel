import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../models/profile_match.dart';
import '../theme/app_colors.dart';
import '../theme/app_decorations.dart';
import '../utils/avatar_resolver.dart';
import 'dmb_avatar.dart';
import 'dmb_badge.dart';

/// Profile card matching ProfileCard.tsx — cover gradient, avatar, match %, badges
class ProfileCard extends StatelessWidget {
  final ProfileMatch profile;
  final int? interestId;
  final VoidCallback? onTap;
  final VoidCallback? onAccept;
  final VoidCallback? onDecline;
  final bool showActions;

  const ProfileCard({
    super.key,
    required this.profile,
    this.interestId,
    this.onTap,
    this.onAccept,
    this.onDecline,
    this.showActions = false,
  });

  @override
  Widget build(BuildContext context) {
    final avatarUrl = resolveAvatarUrl(profile.avatarUrl);

    // Pick gradient colors
    final gradientIndex = profile.id.hashCode.abs() % AppColors.cardGradients.length;
    final gradientColors = AppColors.cardGradients[gradientIndex];

    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(AppDecorations.radiusXl),
          boxShadow: AppDecorations.cardShadow,
          border: Border.all(color: AppColors.white),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Cover gradient area
            Container(
              height: 128,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: gradientColors,
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: Stack(
                children: [
                  // Match percentage badge
                  Positioned(
                    top: 12,
                    right: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.white.withOpacity(0.8),
                        borderRadius: BorderRadius.circular(AppDecorations.radiusFull),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(LucideIcons.star, size: 14, color: AppColors.primary),
                          const SizedBox(width: 4),
                          Text(
                            '${profile.matchPercentage.toInt()}% Match',
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: AppColors.primary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  // Agent pick / High intent badges
                  if (profile.isAgentPick || profile.isHighIntent)
                    Positioned(
                      top: 12,
                      left: 12,
                      child: Row(
                        children: [
                          if (profile.isAgentPick)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: AppColors.primary,
                                borderRadius: BorderRadius.circular(AppDecorations.radiusFull),
                              ),
                              child: const Text(
                                'Agent Pick',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.white,
                                ),
                              ),
                            ),
                          if (profile.isHighIntent) ...[
                            if (profile.isAgentPick) const SizedBox(width: 4),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: AppColors.success,
                                borderRadius: BorderRadius.circular(AppDecorations.radiusFull),
                              ),
                              child: const Text(
                                'High Intent',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.white,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                ],
              ),
            ),

            // Content area
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Avatar overlapping cover
                  Transform.translate(
                    offset: const Offset(0, -40),
                    child: Container(
                      padding: const EdgeInsets.all(3),
                      decoration: const BoxDecoration(
                        color: AppColors.white,
                        shape: BoxShape.circle,
                      ),
                      child: DmbAvatar(
                        imageUrl: avatarUrl,
                        size: 80,
                        showOnlineIndicator: true,
                        isOnline: profile.isOnline,
                      ),
                    ),
                  ),

                  // Negative margin compensation
                  Transform.translate(
                    offset: const Offset(0, -24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Name + verified badge
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                profile.name,
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.slate900,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            if (profile.isVerified) ...[
                              const SizedBox(width: 6),
                              const VerifiedBadge(size: 20),
                            ],
                          ],
                        ),

                        const SizedBox(height: 2),

                        // Specialty
                        Text(
                          profile.specialty.isNotEmpty ? profile.specialty : 'Member',
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                            color: AppColors.primary,
                          ),
                        ),

                        const SizedBox(height: 8),

                        // Location + Age row
                        Row(
                          children: [
                            if (profile.location.isNotEmpty) ...[
                              Icon(LucideIcons.mapPin, size: 14, color: AppColors.slate400),
                              const SizedBox(width: 4),
                              Flexible(
                                child: Text(
                                  profile.location,
                                  style: const TextStyle(fontSize: 13, color: AppColors.slate500),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                            if (profile.age > 0) ...[
                              const SizedBox(width: 12),
                              Icon(LucideIcons.cake, size: 14, color: AppColors.slate400),
                              const SizedBox(width: 4),
                              Text(
                                '${profile.age} yrs',
                                style: const TextStyle(fontSize: 13, color: AppColors.slate500),
                              ),
                            ],
                          ],
                        ),

                        // Education
                        if (profile.education != null) ...[
                          const SizedBox(height: 6),
                          Row(
                            children: [
                              Icon(LucideIcons.graduationCap, size: 14, color: AppColors.slate400),
                              const SizedBox(width: 4),
                              Expanded(
                                child: Text(
                                  '${profile.education!.degree} - ${profile.education!.institution}',
                                  style: const TextStyle(fontSize: 13, color: AppColors.slate500),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ],

                        // Career
                        if (profile.career != null) ...[
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              Icon(LucideIcons.briefcase, size: 14, color: AppColors.slate400),
                              const SizedBox(width: 4),
                              Expanded(
                                child: Text(
                                  '${profile.career!.position} at ${profile.career!.institution}',
                                  style: const TextStyle(fontSize: 13, color: AppColors.slate500),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ],

                        // Travel mode
                        if (profile.travelMode && profile.travelCity != null) ...[
                          const SizedBox(height: 8),
                          DmbBadge(
                            text: 'Visiting ${profile.travelCity}',
                            variant: BadgeVariant.info,
                            icon: LucideIcons.plane,
                          ),
                        ],

                        // Accept/Decline buttons for proposal cards
                        if (showActions && interestId != null) ...[
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              Expanded(
                                child: _ActionButton(
                                  icon: LucideIcons.check,
                                  label: 'Accept',
                                  color: AppColors.success,
                                  onTap: onAccept,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: _ActionButton(
                                  icon: LucideIcons.x,
                                  label: 'Decline',
                                  color: AppColors.error,
                                  onTap: onDecline,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback? onTap;

  const _ActionButton({
    required this.icon,
    required this.label,
    required this.color,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: color.withOpacity(0.1),
      borderRadius: BorderRadius.circular(AppDecorations.radiusLg),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppDecorations.radiusLg),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 10),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 16, color: color),
              const SizedBox(width: 4),
              Text(
                label,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: color,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
