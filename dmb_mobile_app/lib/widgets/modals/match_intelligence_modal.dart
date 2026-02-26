import 'package:flutter/material.dart';

import '../../core/core.dart';
import '../../models/profile_match.dart';

/// Match Intelligence Modal - AI compatibility analysis
/// Transpiled from MatchIntelligenceModal.tsx
class MatchIntelligenceModal extends StatefulWidget {
  final ProfileMatch profile;
  final VoidCallback? onSendProposal;

  const MatchIntelligenceModal({
    super.key,
    required this.profile,
    this.onSendProposal,
  });

  static Future<void> show(BuildContext context, ProfileMatch profile) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => MatchIntelligenceModal(profile: profile),
    );
  }

  @override
  State<MatchIntelligenceModal> createState() => _MatchIntelligenceModalState();
}

class _MatchIntelligenceModalState extends State<MatchIntelligenceModal> {
  bool _showFriction = false;

  MatchIntelligence get data =>
      widget.profile.intelligence ??
      const MatchIntelligence(
        totalScore: 85,
        categories: [
          MatchCategory(
              name: 'Lifestyle & Values', score: 82, weight: MatchWeight.high),
          MatchCategory(
              name: 'Career Ambition', score: 90, weight: MatchWeight.high),
          MatchCategory(
              name: 'Family Background', score: 75, weight: MatchWeight.medium),
        ],
        mutualFit: MutualFit(youMeetThem: 80, theyMeetYou: 85),
        topReasons: ['Similar medical specialties', 'Regional compatibility'],
        frictionPoints: [
          'Age gap slightly outside preference',
          'Different weekend habits'
        ],
      );

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.9,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.xl)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(
              border: Border(bottom: BorderSide(color: AppColors.slate100)),
            ),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: AppColors.primary.withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(Icons.psychology, color: AppColors.primary),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Matchmaking Intelligence',
                        style: AppTypography.titleMedium,
                      ),
                      Text(
                        'AI Analysis • Just now',
                        style: AppTypography.caption.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close),
                  color: AppColors.slate400,
                ),
              ],
            ),
          ),

          // Content
          Flexible(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Column(
                children: [
                  // Score Circle
                  _buildScoreCircle(),
                  const SizedBox(height: AppSpacing.lg),

                  // Category Breakdown
                  _buildCategoryBreakdown(),
                  const SizedBox(height: AppSpacing.lg),

                  // Mutual Fit
                  _buildMutualFit(),
                  const SizedBox(height: AppSpacing.lg),

                  // Top Reasons
                  _buildTopReasons(),
                  const SizedBox(height: AppSpacing.lg),

                  // Friction Points
                  _buildFrictionPoints(),

                  // Agent Notes
                  if (data.agentNotes != null) ...[
                    const SizedBox(height: AppSpacing.lg),
                    _buildAgentNotes(),
                  ],
                ],
              ),
            ),
          ),

          // Footer
          Container(
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(
              color: AppColors.slate50,
              border: Border(top: BorderSide(color: AppColors.slate100)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Close'),
                ),
                const SizedBox(width: AppSpacing.sm),
                ElevatedButton(
                  onPressed: () {
                    widget.onSendProposal?.call();
                    Navigator.pop(context);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                  ),
                  child: const Text('Send Proposal'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildScoreCircle() {
    return Center(
      child: SizedBox(
        width: 160,
        height: 160,
        child: Stack(
          alignment: Alignment.center,
          children: [
            SizedBox(
              width: 160,
              height: 160,
              child: CircularProgressIndicator(
                value: data.totalScore / 100,
                strokeWidth: 8,
                backgroundColor: AppColors.slate100,
                valueColor: AlwaysStoppedAnimation(AppColors.primary),
              ),
            ),
            Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  '${data.totalScore}%',
                  style: AppTypography.headlineLarge.copyWith(
                    fontWeight: FontWeight.w900,
                  ),
                ),
                Text(
                  'COMPATIBLE',
                  style: AppTypography.caption.copyWith(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 1.5,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCategoryBreakdown() {
    return Column(
      children: data.categories.map((cat) {
        return Padding(
          padding: const EdgeInsets.only(bottom: AppSpacing.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    cat.name,
                    style: AppTypography.labelSmall.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  Text(
                    '${cat.score}%',
                    style: AppTypography.labelSmall.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.xxs),
              ClipRRect(
                borderRadius: BorderRadius.circular(AppRadius.full),
                child: LinearProgressIndicator(
                  value: cat.score / 100,
                  backgroundColor: AppColors.slate100,
                  valueColor: AlwaysStoppedAnimation(AppColors.slate800),
                  minHeight: 6,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                'Weight: ${cat.weight.value}',
                style: AppTypography.caption.copyWith(
                  color: AppColors.slate400,
                  fontSize: 10,
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  Widget _buildMutualFit() {
    final fit = data.mutualFit;
    if (fit == null) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.slate50,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: AppColors.slate100),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Icon(Icons.swap_horiz, size: 18, color: AppColors.slate500),
              const SizedBox(width: AppSpacing.xs),
              Text(
                'Mutual Preference Fit',
                style: AppTypography.labelMedium.copyWith(
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          Row(
            children: [
              Expanded(
                child: Column(
                  children: [
                    Text(
                      '${fit.youMeetThem}%',
                      style: AppTypography.headlineSmall.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    Text(
                      'You meet their criteria',
                      style: AppTypography.caption.copyWith(
                        color: AppColors.textSecondary,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
              Container(
                width: 1,
                height: 32,
                color: AppColors.slate200,
              ),
              Expanded(
                child: Column(
                  children: [
                    Text(
                      '${fit.theyMeetYou}%',
                      style: AppTypography.headlineSmall.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    Text(
                      'They meet your criteria',
                      style: AppTypography.caption.copyWith(
                        color: AppColors.textSecondary,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTopReasons() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(Icons.bolt, size: 16, color: Colors.amber),
            const SizedBox(width: AppSpacing.xs),
            Text(
              "Top 5 Reasons you're compatible",
              style: AppTypography.labelMedium.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.sm),
        ...?data.topReasons?.map((reason) => Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.xs),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.check_circle, size: 16, color: AppColors.success),
                  const SizedBox(width: AppSpacing.xs),
                  Expanded(
                    child: Text(reason, style: AppTypography.bodySmall),
                  ),
                ],
              ),
            )),
      ],
    );
  }

  Widget _buildFrictionPoints() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                Icon(Icons.warning_amber, size: 16, color: AppColors.warning),
                const SizedBox(width: AppSpacing.xs),
                Text(
                  'Potential Friction Points',
                  style: AppTypography.labelMedium.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
            TextButton(
              onPressed: () => setState(() => _showFriction = !_showFriction),
              child: Text(_showFriction ? 'Hide' : 'View (Opt-in)'),
            ),
          ],
        ),
        AnimatedOpacity(
          opacity: _showFriction ? 1.0 : 0.3,
          duration: const Duration(milliseconds: 300),
          child: ImageFiltered(
            imageFilter: _showFriction
                ? const ColorFilter.mode(Colors.transparent, BlendMode.dst)
                : const ColorFilter.mode(Colors.white, BlendMode.modulate),
            child: Column(
              children: data.frictionPoints?.map((point) {
                    return Padding(
                      padding: const EdgeInsets.only(bottom: AppSpacing.xs),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            width: 6,
                            height: 6,
                            margin: const EdgeInsets.only(top: 6),
                            decoration: BoxDecoration(
                              color: AppColors.warning,
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: AppSpacing.sm),
                          Expanded(
                            child: Text(
                              point,
                              style: AppTypography.bodySmall.copyWith(
                                color: AppColors.slate600,
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                  }).toList() ??
                  [],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildAgentNotes() {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.purple.withOpacity(0.05),
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: AppColors.purple.withOpacity(0.1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.verified_user, size: 16, color: AppColors.purple),
              const SizedBox(width: AppSpacing.xs),
              Text(
                "Matchmaker's Note",
                style: AppTypography.labelMedium.copyWith(
                  color: AppColors.purple,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            '"${data.agentNotes}"',
            style: AppTypography.bodySmall.copyWith(
              color: AppColors.purpleDark,
              fontStyle: FontStyle.italic,
            ),
          ),
        ],
      ),
    );
  }
}
