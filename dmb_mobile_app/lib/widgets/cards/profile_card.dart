import 'package:flutter/material.dart';

import '../../core/core.dart';
import '../../models/profile_match.dart';

/// Full Profile Card widget - displays detailed profile information
/// Transpiled from ProfileCard.tsx
class ProfileCard extends StatefulWidget {
  final ProfileMatch profile;
  final int? matchPercentage;
  final VoidCallback? onAccept;
  final VoidCallback? onDecline;
  final VoidCallback? onReport;
  final VoidCallback? onTap;

  const ProfileCard({
    super.key,
    required this.profile,
    this.matchPercentage,
    this.onAccept,
    this.onDecline,
    this.onReport,
    this.onTap,
  });

  @override
  State<ProfileCard> createState() => _ProfileCardState();
}

class _ProfileCardState extends State<ProfileCard> {
  bool _accepted = false;
  bool _showMenu = false;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppRadius.xl),
        border: Border.all(color: Colors.white),
        boxShadow: [
          BoxShadow(
            color: AppColors.slate200.withOpacity(0.5),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: [
          _buildCoverSection(),
          _buildContentSection(),
        ],
      ),
    );
  }

  Widget _buildCoverSection() {
    return Container(
      height: 140,
      decoration: BoxDecoration(
        gradient: AppColors.profileCardGradient,
      ),
      child: Stack(
        children: [
          // Match Badge
          Positioned(
            top: AppSpacing.md,
            right: AppSpacing.md,
            child: Container(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.sm,
                vertical: AppSpacing.xs,
              ),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.8),
                borderRadius: BorderRadius.circular(AppRadius.full),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.star,
                    size: 14,
                    color: AppColors.primary,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    '${widget.profile.matchPercentage}% Match',
                    style: AppTypography.labelSmall.copyWith(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
          ),
          // Menu Button
          Positioned(
            top: AppSpacing.md,
            left: AppSpacing.md,
            child: _buildMenuButton(),
          ),
        ],
      ),
    );
  }

  Widget _buildMenuButton() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        GestureDetector(
          onTap: () => setState(() => _showMenu = !_showMenu),
          child: Container(
            padding: const EdgeInsets.all(AppSpacing.sm),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.3),
              borderRadius: BorderRadius.circular(AppRadius.full),
            ),
            child: Icon(
              Icons.more_vert,
              size: 20,
              color: AppColors.slate900,
            ),
          ),
        ),
        if (_showMenu)
          Container(
            margin: const EdgeInsets.only(top: AppSpacing.xs),
            padding: const EdgeInsets.symmetric(vertical: AppSpacing.xs),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(AppRadius.lg),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 10,
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildMenuItem(
                  icon: Icons.flag_outlined,
                  label: 'Report Profile',
                  color: AppColors.error,
                  onTap: () {
                    setState(() => _showMenu = false);
                    widget.onReport?.call();
                  },
                ),
                _buildMenuItem(
                  icon: Icons.shield_outlined,
                  label: 'Block User',
                  onTap: () {
                    setState(() => _showMenu = false);
                  },
                ),
              ],
            ),
          ),
      ],
    );
  }

  Widget _buildMenuItem({
    required IconData icon,
    required String label,
    Color? color,
    VoidCallback? onTap,
  }) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.sm,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 16, color: color ?? AppColors.slate700),
            const SizedBox(width: AppSpacing.sm),
            Text(
              label,
              style: AppTypography.labelMedium.copyWith(
                color: color ?? AppColors.slate700,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContentSection() {
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Avatar positioned above
          Transform.translate(
            offset: const Offset(0, -80),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Container(
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 4),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.1),
                        blurRadius: 8,
                      ),
                    ],
                  ),
                  child: ClipOval(
                    child: widget.profile.avatarUrl != null
                        ? Image.network(
                            widget.profile.avatarUrl!,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) =>
                                _buildAvatarPlaceholder(),
                          )
                        : _buildAvatarPlaceholder(),
                  ),
                ),
              ],
            ),
          ),

          // Header Info - adjusted for avatar offset
          Transform.translate(
            offset: const Offset(0, -60),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        widget.profile.name,
                        style: AppTypography.headlineSmall,
                      ),
                    ),
                    if (widget.profile.isVerified)
                      Container(
                        margin: const EdgeInsets.only(left: AppSpacing.xs),
                        child: Icon(
                          Icons.verified,
                          size: 20,
                          color: Colors.blue,
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: AppSpacing.xxs),
                Text(
                  widget.profile.specialty ?? 'Medical Professional',
                  style: AppTypography.bodyMedium.copyWith(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: AppSpacing.sm),
                Row(
                  children: [
                    Icon(Icons.location_on_outlined,
                        size: 16, color: AppColors.textSecondary),
                    const SizedBox(width: 4),
                    Flexible(
                      child: Text(
                        '${widget.profile.hospital ?? 'Hospital'}, ${widget.profile.location ?? 'Location'}',
                        style: AppTypography.bodySmall.copyWith(
                          color: AppColors.textSecondary,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: AppSpacing.md),
                    Icon(Icons.cake_outlined,
                        size: 16, color: AppColors.textSecondary),
                    const SizedBox(width: 4),
                    Text(
                      '${widget.profile.age ?? 28} Yrs',
                      style: AppTypography.bodySmall.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.lg),

                // Action Buttons
                _buildActionButtons(),

                const SizedBox(height: AppSpacing.lg),
                Divider(color: AppColors.slate100),
                const SizedBox(height: AppSpacing.lg),

                // Bio & Info Grid
                _buildInfoGrid(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAvatarPlaceholder() {
    return Container(
      color: AppColors.slate200,
      child: Icon(
        Icons.person,
        size: 40,
        color: AppColors.slate400,
      ),
    );
  }

  Widget _buildActionButtons() {
    if (_accepted) {
      return Container(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.md,
        ),
        decoration: BoxDecoration(
          color: AppColors.success.withOpacity(0.1),
          borderRadius: BorderRadius.circular(AppRadius.full),
          border: Border.all(color: AppColors.success.withOpacity(0.2)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.check, size: 20, color: AppColors.success),
            const SizedBox(width: AppSpacing.sm),
            Text(
              'Chat Unlocked!',
              style: AppTypography.labelMedium.copyWith(
                color: AppColors.success,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      );
    }

    return Row(
      children: [
        Expanded(
          child: OutlinedButton.icon(
            onPressed: widget.onDecline,
            icon: const Icon(Icons.close, size: 18),
            label: const Text('Decline'),
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(AppRadius.full),
              ),
            ),
          ),
        ),
        const SizedBox(width: AppSpacing.md),
        Expanded(
          flex: 2,
          child: ElevatedButton.icon(
            onPressed: () {
              setState(() => _accepted = true);
              widget.onAccept?.call();
            },
            icon: const Icon(Icons.check, size: 20),
            label: const Text('Accept Proposal'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(AppRadius.full),
              ),
              elevation: 4,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildInfoGrid() {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'ABOUT',
                style: AppTypography.labelSmall.copyWith(
                  color: AppColors.textTertiary,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.2,
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              Text(
                widget.profile.bio ??
                    'Passionate about healthcare and making a difference.',
                style: AppTypography.bodyMedium.copyWith(
                  color: AppColors.slate600,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              Wrap(
                spacing: AppSpacing.xs,
                runSpacing: AppSpacing.xs,
                children:
                    (widget.profile.tags ?? ['Hiking', 'Music', 'Reading'])
                        .map((tag) => _buildTag(tag))
                        .toList(),
              ),
            ],
          ),
        ),
        const SizedBox(width: AppSpacing.lg),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'EDUCATION & CAREER',
                style: AppTypography.labelSmall.copyWith(
                  color: AppColors.textTertiary,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.2,
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              _buildCareerItem(
                icon: Icons.school_outlined,
                title: widget.profile.education?.degree ?? 'MBBS, MD',
                subtitle:
                    widget.profile.education?.institution ?? 'AIIMS Delhi',
              ),
              const SizedBox(height: AppSpacing.sm),
              _buildCareerItem(
                icon: Icons.work_outline,
                title: widget.profile.specialty ?? 'Cardiologist',
                subtitle: '${widget.profile.hospital ?? 'Hospital'} (5 years)',
              ),
              const SizedBox(height: AppSpacing.md),
              Container(
                padding: const EdgeInsets.all(AppSpacing.sm),
                decoration: BoxDecoration(
                  color: AppColors.slate50,
                  borderRadius: BorderRadius.circular(AppRadius.md),
                  border: Border.all(color: AppColors.slate100),
                ),
                child: Row(
                  children: [
                    Icon(Icons.lock_outline,
                        size: 16, color: AppColors.slate400),
                    const SizedBox(width: AppSpacing.sm),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Family Details Hidden',
                            style: AppTypography.labelSmall.copyWith(
                              color: AppColors.slate700,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          Text(
                            'Unlock by accepting request',
                            style: AppTypography.caption.copyWith(
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildTag(String tag) {
    Color bgColor = AppColors.slate50;
    Color textColor = AppColors.slate700;

    if (tag == 'Hiking') {
      bgColor = const Color(0xFFFCE7F3);
      textColor = const Color(0xFFBE185D);
    } else if (tag == 'Music' || tag == 'Classical Music') {
      bgColor = const Color(0xFFF3E8FF);
      textColor = const Color(0xFF7C3AED);
    } else if (tag == 'Vegetarian' || tag == 'Reading') {
      bgColor = const Color(0xFFDBEAFE);
      textColor = const Color(0xFF1D4ED8);
    }

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: AppSpacing.xxs,
      ),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(AppRadius.full),
      ),
      child: Text(
        tag,
        style: AppTypography.labelSmall.copyWith(
          color: textColor,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _buildCareerItem({
    required IconData icon,
    required String title,
    required String subtitle,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: AppColors.slate100,
            shape: BoxShape.circle,
          ),
          child: Icon(icon, size: 16, color: AppColors.slate500),
        ),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: AppTypography.labelMedium.copyWith(
                  color: AppColors.slate900,
                  fontWeight: FontWeight.w600,
                ),
              ),
              Text(
                subtitle,
                style: AppTypography.caption.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
