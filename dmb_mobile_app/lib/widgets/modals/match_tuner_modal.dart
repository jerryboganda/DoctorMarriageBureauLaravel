import 'package:flutter/material.dart';

import '../../core/core.dart';

/// Match Tuner Modal - Quick preference refinement wizard
/// Transpiled from MatchTunerModal.tsx
class MatchTunerModal extends StatefulWidget {
  final VoidCallback? onComplete;

  const MatchTunerModal({
    super.key,
    this.onComplete,
  });

  static Future<void> show(BuildContext context) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const MatchTunerModal(),
    );
  }

  @override
  State<MatchTunerModal> createState() => _MatchTunerModalState();
}

class _MatchTunerModalState extends State<MatchTunerModal> {
  int _step = 1;
  static const _totalSteps = 3;

  final _step1Options = [
    'Smoking',
    'Dietary Restrictions',
    'Relocation',
    'Career Ambition',
    'None'
  ];
  final _step2Options = [
    'Established Specialist',
    'Resident / In-training',
    'Medical Student',
    'Non-medical accepted'
  ];
  final _step3Options = [
    'High - Joint Family',
    'Moderate - Frequent visits',
    'Low - Independent living'
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.75,
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
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Match Tuner', style: AppTypography.titleLarge),
                      Text(
                        'Quickly refine your recommendations.',
                        style: AppTypography.bodySmall.copyWith(
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
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 300),
                transitionBuilder: (child, animation) {
                  return SlideTransition(
                    position: Tween<Offset>(
                      begin: const Offset(1, 0),
                      end: Offset.zero,
                    ).animate(animation),
                    child: FadeTransition(opacity: animation, child: child),
                  );
                },
                child: _buildStepContent(),
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
            child: Center(
              child: Text(
                'Step $_step of $_totalSteps',
                style: AppTypography.caption.copyWith(
                  color: AppColors.slate400,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStepContent() {
    switch (_step) {
      case 1:
        return _buildStep(
          key: const ValueKey(1),
          title: "What's your biggest dealbreaker?",
          options: _step1Options,
          onSelect: (opt) => setState(() => _step = 2),
          showArrow: true,
        );
      case 2:
        return _buildStep(
          key: const ValueKey(2),
          title: 'Ideal partner career level?',
          options: _step2Options,
          onSelect: (opt) => setState(() => _step = 3),
          showArrow: true,
        );
      case 3:
        return _buildStep(
          key: const ValueKey(3),
          title: 'Family involvement level?',
          options: _step3Options,
          onSelect: (opt) {
            widget.onComplete?.call();
            Navigator.pop(context);
          },
          showArrow: false,
        );
      default:
        return const SizedBox.shrink();
    }
  }

  Widget _buildStep({
    required Key key,
    required String title,
    required List<String> options,
    required Function(String) onSelect,
    required bool showArrow,
  }) {
    return Column(
      key: key,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: AppTypography.titleSmall.copyWith(
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        ...options.map((opt) => _buildOptionButton(
              opt,
              () => onSelect(opt),
              showArrow,
            )),
      ],
    );
  }

  Widget _buildOptionButton(String label, VoidCallback onTap, bool showArrow) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        margin: const EdgeInsets.only(bottom: AppSpacing.sm),
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(AppRadius.lg),
          border: Border.all(color: AppColors.slate200),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: AppTypography.bodyMedium.copyWith(
                fontWeight: FontWeight.w500,
              ),
            ),
            Icon(
              showArrow ? Icons.chevron_right : Icons.check,
              color: AppColors.primary,
              size: 18,
            ),
          ],
        ),
      ),
    );
  }
}
