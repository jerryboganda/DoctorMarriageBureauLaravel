import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../theme/app_colors.dart';
import '../theme/app_decorations.dart';
import '../widgets/dmb_button.dart';

// ---------------------------------------------------------------------------
// Show helper
// ---------------------------------------------------------------------------

Future<void> showPremiumMessagingModal(
  BuildContext context, {
  required VoidCallback onClose,
  required VoidCallback onChooseReferral,
  required VoidCallback onChoosePackage,
}) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => PremiumMessagingModal(
      onClose: onClose,
      onChooseReferral: onChooseReferral,
      onChoosePackage: onChoosePackage,
    ),
  );
}

// ---------------------------------------------------------------------------
// Widget
// ---------------------------------------------------------------------------

class PremiumMessagingModal extends StatefulWidget {
  final VoidCallback onClose;
  final VoidCallback onChooseReferral;
  final VoidCallback onChoosePackage;

  const PremiumMessagingModal({
    super.key,
    required this.onClose,
    required this.onChooseReferral,
    required this.onChoosePackage,
  });

  @override
  State<PremiumMessagingModal> createState() => _PremiumMessagingModalState();
}

enum _PremiumStep { intro, options }

class _PremiumMessagingModalState extends State<PremiumMessagingModal> {
  _PremiumStep _step = _PremiumStep.intro;

  void _close() {
    widget.onClose();
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.white,
        borderRadius:
            BorderRadius.vertical(top: Radius.circular(AppDecorations.radiusXxl)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
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
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 300),
            transitionBuilder: (child, animation) => FadeTransition(
              opacity: animation,
              child: child,
            ),
            child: _step == _PremiumStep.intro
                ? _buildIntroContent(key: const ValueKey('intro'))
                : _buildOptionsContent(key: const ValueKey('options')),
          ),
        ],
      ),
    );
  }

  // ── Intro Step ──

  Widget _buildIntroContent({Key? key}) {
    return Column(
      key: key,
      mainAxisSize: MainAxisSize.min,
      children: [
        _buildGradientHeader(),
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 24, 20, 8),
          child: Column(
            children: [
              // Crown badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF3C7), // amber-100
                  borderRadius: BorderRadius.circular(AppDecorations.radiusFull),
                  border: Border.all(color: const Color(0xFFFDE68A)), // amber-200
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(LucideIcons.crown, size: 14, color: Color(0xFFD97706)),
                    SizedBox(width: 6),
                    Text(
                      'PREMIUM ONLY',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFFD97706), // amber-600
                        letterSpacing: 0.5,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Title
              const Text(
                'Unlock Premium Messaging',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                  color: AppColors.slate900,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Connect directly with your matches through our secure messaging platform. '
                'Premium members enjoy unlimited conversations and exclusive features.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 13,
                  color: AppColors.slate500,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 24),

              // Benefit cards row
              Row(
                children: [
                  Expanded(
                    child: _buildBenefitCard(
                      icon: LucideIcons.sparkles,
                      label: 'Unlimited messages',
                      color: AppColors.primary,
                      bgColor: AppColors.primary5,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _buildBenefitCard(
                      icon: LucideIcons.gift,
                      label: 'Exclusive features',
                      color: const Color(0xFF7C3AED), // violet-600
                      bgColor: const Color(0xFFF5F3FF), // violet-50
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _buildBenefitCard(
                      icon: LucideIcons.wallet,
                      label: 'Wallet management',
                      color: AppColors.success,
                      bgColor: const Color(0xFFF0FDF4), // green-50
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),

        // Footer
        Container(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
          child: Column(
            children: [
              DmbButton(
                text: 'Upgrade Now',
                icon: LucideIcons.arrowRight,
                onPressed: () => setState(() => _step = _PremiumStep.options),
              ),
              const SizedBox(height: 8),
              DmbButton(
                text: 'Not Now',
                variant: DmbButtonVariant.ghost,
                onPressed: _close,
              ),
            ],
          ),
        ),
      ],
    );
  }

  // ── Options Step ──

  Widget _buildOptionsContent({Key? key}) {
    return Column(
      key: key,
      mainAxisSize: MainAxisSize.min,
      children: [
        // Title
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 4),
          child: Column(
            children: const [
              Text(
                'Choose Your Path',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  color: AppColors.slate900,
                ),
              ),
              SizedBox(height: 4),
              Text(
                'Select how you\'d like to unlock premium messaging',
                style: TextStyle(fontSize: 13, color: AppColors.slate500),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),

        // Choice cards
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: _buildChoiceCard(
                  icon: LucideIcons.gift,
                  iconColor: const Color(0xFF7C3AED),
                  iconBgColor: const Color(0xFFF5F3FF),
                  title: 'Referral Path',
                  description: 'Invite friends and earn premium credits for free.',
                  chips: ['Earn Credits', 'Share & Earn'],
                  chipColor: const Color(0xFF7C3AED),
                  chipBgColor: const Color(0xFFF5F3FF),
                  onTap: () {
                    widget.onChooseReferral();
                    Navigator.of(context).pop();
                  },
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildChoiceCard(
                  icon: LucideIcons.wallet,
                  iconColor: AppColors.primary,
                  iconBgColor: AppColors.primary5,
                  title: 'Direct Purchase',
                  description: 'Get instant access to all premium features now.',
                  chips: ['Instant Access', 'Full Features'],
                  chipColor: AppColors.primary,
                  chipBgColor: AppColors.primary5,
                  onTap: () {
                    widget.onChoosePackage();
                    Navigator.of(context).pop();
                  },
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),

        // Footer
        Container(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
          child: Row(
            children: [
              Expanded(
                child: DmbButton(
                  text: 'Back',
                  variant: DmbButtonVariant.outline,
                  icon: LucideIcons.arrowLeft,
                  onPressed: () => setState(() => _step = _PremiumStep.intro),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: DmbButton(
                  text: 'Not Now',
                  variant: DmbButtonVariant.ghost,
                  onPressed: _close,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // ── Gradient Header ──

  Widget _buildGradientHeader() {
    return Container(
      width: double.infinity,
      height: 8,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Color(0xFFFEF3C7), // amber-50
            AppColors.white,
            Color(0xFFFFF1F2), // rose-50
          ],
        ),
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(AppDecorations.radiusXxl),
        ),
      ),
    );
  }

  // ── Benefit Card ──

  Widget _buildBenefitCard({
    required IconData icon,
    required String label,
    required Color color,
    required Color bgColor,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(AppDecorations.radiusXl),
        border: Border.all(color: color.withOpacity(0.15)),
      ),
      child: Column(
        children: [
          Icon(icon, size: 24, color: color),
          const SizedBox(height: 8),
          Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  // ── Choice Card ──

  Widget _buildChoiceCard({
    required IconData icon,
    required Color iconColor,
    required Color iconBgColor,
    required String title,
    required String description,
    required List<String> chips,
    required Color chipColor,
    required Color chipBgColor,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(AppDecorations.radiusXl),
          border: Border.all(color: AppColors.slate200),
          boxShadow: AppDecorations.shadowSm,
        ),
        child: Column(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: iconBgColor,
                borderRadius: BorderRadius.circular(AppDecorations.radiusLg),
              ),
              child: Icon(icon, size: 24, color: iconColor),
            ),
            const SizedBox(height: 12),
            Text(
              title,
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: AppColors.slate900,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              description,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 12,
                color: AppColors.slate500,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              alignment: WrapAlignment.center,
              children: chips
                  .map((chip) => Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: chipBgColor,
                          borderRadius:
                              BorderRadius.circular(AppDecorations.radiusFull),
                        ),
                        child: Text(
                          chip,
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                            color: chipColor,
                          ),
                        ),
                      ))
                  .toList(),
            ),
          ],
        ),
      ),
    );
  }
}
