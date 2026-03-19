import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../theme/app_colors.dart';
import '../theme/app_decorations.dart';
import '../widgets/dmb_button.dart';
import '../providers/auth_provider.dart';

// ---------------------------------------------------------------------------
// Show helper
// ---------------------------------------------------------------------------

Future<void> showMatchTunerModal(
  BuildContext context, {
  VoidCallback? onClose,
}) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => MatchTunerModal(
      onClose: onClose ?? () => Navigator.of(context).pop(),
    ),
  );
}

// ---------------------------------------------------------------------------
// Widget
// ---------------------------------------------------------------------------

class MatchTunerModal extends ConsumerStatefulWidget {
  final VoidCallback onClose;

  const MatchTunerModal({
    super.key,
    required this.onClose,
  });

  @override
  ConsumerState<MatchTunerModal> createState() => _MatchTunerModalState();
}

class _MatchTunerModalState extends ConsumerState<MatchTunerModal> {
  int _step = 1;
  bool _loading = false;
  String? _error;

  final Map<String, String> _selections = {
    'dealbreaker': '',
    'careerLevel': '',
    'familyLevel': '',
  };

  // ── Step definitions ──

  static const _steps = [
    _StepConfig(
      title: 'Dealbreaker',
      subtitle: 'What is your biggest non-negotiable?',
      options: [
        _OptionConfig(icon: LucideIcons.cigarette, label: 'Smoking', value: 'smoking'),
        _OptionConfig(icon: LucideIcons.utensils, label: 'Dietary restrictions', value: 'dietary'),
        _OptionConfig(icon: LucideIcons.mapPin, label: 'Relocation', value: 'relocation'),
        _OptionConfig(icon: LucideIcons.briefcase, label: 'Career ambition', value: 'career_ambition'),
        _OptionConfig(icon: LucideIcons.minusCircle, label: 'None', value: 'none'),
      ],
      selectionKey: 'dealbreaker',
    ),
    _StepConfig(
      title: 'Ideal Career Level',
      subtitle: 'What career stage do you prefer in a partner?',
      options: [
        _OptionConfig(icon: LucideIcons.award, label: 'Established Specialist', value: 'established_specialist'),
        _OptionConfig(icon: LucideIcons.stethoscope, label: 'Resident in Training', value: 'resident_training'),
        _OptionConfig(icon: LucideIcons.graduationCap, label: 'Medical Student', value: 'medical_student'),
        _OptionConfig(icon: LucideIcons.user, label: 'Non-medical Professional', value: 'non_medical'),
      ],
      selectionKey: 'careerLevel',
    ),
    _StepConfig(
      title: 'Family Involvement',
      subtitle: 'How involved should family be in daily life?',
      options: [
        _OptionConfig(icon: LucideIcons.users, label: 'High - Joint family', value: 'high'),
        _OptionConfig(icon: LucideIcons.heart, label: 'Moderate - Regular visits', value: 'moderate'),
        _OptionConfig(icon: LucideIcons.home, label: 'Low - Independent', value: 'low'),
      ],
      selectionKey: 'familyLevel',
    ),
  ];

  Future<void> _handleSelect(String key, String value) async {
    setState(() {
      _selections[key] = value;
    });

    if (_step < 3) {
      // Advance to next step after a brief visual delay
      await Future.delayed(const Duration(milliseconds: 300));
      if (mounted) setState(() => _step++);
      return;
    }

    // Final step — submit
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final api = ref.read(apiServiceProvider);
      await api.post('/match-tuner/tune', data: _selections);

      // Brief "recalculating" display then close
      await Future.delayed(const Duration(seconds: 1));
      if (mounted) {
        widget.onClose();
        Navigator.of(context).pop();
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _error = 'Failed to submit preferences. Please try again.';
          _loading = false;
        });
      }
    }
  }

  void _close() {
    widget.onClose();
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final height = MediaQuery.of(context).size.height * 0.85;

    return Container(
      height: height,
      decoration: const BoxDecoration(
        color: AppColors.white,
        borderRadius:
            BorderRadius.vertical(top: Radius.circular(AppDecorations.radiusXxl)),
      ),
      child: Column(
        children: [
          // Drag handle
          Container(
            margin: const EdgeInsets.only(top: 12, bottom: 8),
            width: 36,
            height: 4,
            decoration: BoxDecoration(
              color: AppColors.slate300,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          _buildHeader(),
          Expanded(child: _buildBody()),
          _buildFooter(),
        ],
      ),
    );
  }

  // ── Header ──

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      decoration: const BoxDecoration(
        color: AppColors.slate50,
        border: Border(bottom: BorderSide(color: AppColors.slate100)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Tune Your Matches',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: AppColors.slate900,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Help us understand your preferences better',
                  style: TextStyle(
                    fontSize: 13,
                    color: AppColors.slate500,
                  ),
                ),
              ],
            ),
          ),
          GestureDetector(
            onTap: _close,
            child: Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: AppColors.slate100,
                borderRadius: BorderRadius.circular(AppDecorations.radiusFull),
              ),
              child: const Icon(LucideIcons.x, size: 18, color: AppColors.slate400),
            ),
          ),
        ],
      ),
    );
  }

  // ── Body ──

  Widget _buildBody() {
    if (_loading) {
      return const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2.5),
            SizedBox(height: 16),
            Text(
              'Recalculating...',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: AppColors.slate700,
              ),
            ),
            SizedBox(height: 4),
            Text(
              'Updating your match preferences',
              style: TextStyle(fontSize: 13, color: AppColors.slate500),
            ),
          ],
        ),
      );
    }

    final stepIdx = _step - 1;
    final config = _steps[stepIdx];

    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 300),
      transitionBuilder: (child, animation) => FadeTransition(
        opacity: animation,
        child: SlideTransition(
          position: Tween<Offset>(
            begin: const Offset(0.05, 0),
            end: Offset.zero,
          ).animate(animation),
          child: child,
        ),
      ),
      child: _buildStepContent(config, key: ValueKey(_step)),
    );
  }

  Widget _buildStepContent(_StepConfig config, {Key? key}) {
    final selectedValue = _selections[config.selectionKey] ?? '';

    return SingleChildScrollView(
      key: key,
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            config.title,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w700,
              color: AppColors.slate900,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            config.subtitle,
            style: const TextStyle(fontSize: 14, color: AppColors.slate500),
          ),
          const SizedBox(height: 24),
          ...config.options.map((opt) {
            final isSelected = selectedValue == opt.value;
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: _buildOptionTile(
                icon: opt.icon,
                label: opt.label,
                isSelected: isSelected,
                onTap: () => _handleSelect(config.selectionKey, opt.value),
              ),
            );
          }),
          if (_error != null) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFFEF2F2),
                borderRadius: BorderRadius.circular(AppDecorations.radiusLg),
                border: Border.all(color: const Color(0xFFFEE2E2)),
              ),
              child: Row(
                children: [
                  const Icon(LucideIcons.alertCircle, size: 14, color: AppColors.error),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _error!,
                      style: const TextStyle(fontSize: 12, color: AppColors.error),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildOptionTile({
    required IconData icon,
    required String label,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary5 : AppColors.white,
          borderRadius: BorderRadius.circular(AppDecorations.radiusXl),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.slate200,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: isSelected ? AppColors.white : AppColors.slate50,
                borderRadius: BorderRadius.circular(AppDecorations.radiusLg),
              ),
              child: Icon(
                icon,
                size: 20,
                color: isSelected ? AppColors.primary : AppColors.slate400,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                  color: isSelected ? AppColors.slate900 : AppColors.slate600,
                ),
              ),
            ),
            if (isSelected)
              const Icon(LucideIcons.checkCircle2, size: 20, color: AppColors.primary),
          ],
        ),
      ),
    );
  }

  // ── Footer ──

  Widget _buildFooter() {
    if (_loading) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
      decoration: const BoxDecoration(
        color: AppColors.slate50,
        border: Border(top: BorderSide(color: AppColors.slate100)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Step indicator dots
          ...List.generate(3, (i) {
            final s = i + 1;
            final isActive = _step == s;
            final isCompleted = _step > s;
            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 3),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                width: isActive ? 24 : 8,
                height: 8,
                decoration: BoxDecoration(
                  color: isActive
                      ? AppColors.primary
                      : isCompleted
                          ? AppColors.primary.withOpacity(0.4)
                          : AppColors.slate200,
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
            );
          }),
          const SizedBox(width: 16),
          Text(
            'Step $_step of 3',
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w500,
              color: AppColors.slate500,
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Internal data classes
// ---------------------------------------------------------------------------

class _StepConfig {
  final String title;
  final String subtitle;
  final List<_OptionConfig> options;
  final String selectionKey;

  const _StepConfig({
    required this.title,
    required this.subtitle,
    required this.options,
    required this.selectionKey,
  });
}

class _OptionConfig {
  final IconData icon;
  final String label;
  final String value;

  const _OptionConfig({
    required this.icon,
    required this.label,
    required this.value,
  });
}
