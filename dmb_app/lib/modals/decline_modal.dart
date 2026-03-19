import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../theme/app_colors.dart';
import '../theme/app_decorations.dart';
import '../widgets/dmb_button.dart';
import '../widgets/dmb_text_field.dart';
import '../providers/interest_provider.dart';
import '../widgets/dmb_modal.dart';

/// Decline reasons – mirrors the reject flow from the React panel
enum DeclineReason {
  notInterested('Not interested'),
  alreadyInTalks('Already in talks with someone'),
  differentProfile('Looking for a different profile'),
  other('Other');

  final String label;
  const DeclineReason(this.label);
}

/// Bottom-sheet modal for declining / rejecting a received proposal.
///
/// Usage:
/// ```dart
/// showDeclineModal(
///   context: context,
///   interestId: interest.id,
///   memberName: interest.senderName,
///   onDeclined: () => ref.read(interestProvider.notifier).loadReceived(),
/// );
/// ```
Future<bool?> showDeclineModal({
  required BuildContext context,
  required int interestId,
  required String memberName,
  VoidCallback? onDeclined,
}) {
  return showDmbModal<bool>(
    context: context,
    builder: (ctx) => _DeclineModalBody(
      interestId: interestId,
      memberName: memberName,
      onDeclined: onDeclined,
    ),
  );
}

class _DeclineModalBody extends ConsumerStatefulWidget {
  final int interestId;
  final String memberName;
  final VoidCallback? onDeclined;

  const _DeclineModalBody({
    required this.interestId,
    required this.memberName,
    this.onDeclined,
  });

  @override
  ConsumerState<_DeclineModalBody> createState() => _DeclineModalBodyState();
}

class _DeclineModalBodyState extends ConsumerState<_DeclineModalBody> {
  DeclineReason _selectedReason = DeclineReason.notInterested;
  final _otherController = TextEditingController();
  bool _isLoading = false;
  String? _error;

  @override
  void dispose() {
    _otherController.dispose();
    super.dispose();
  }

  Future<void> _handleDecline() async {
    if (_selectedReason == DeclineReason.other &&
        _otherController.text.trim().isEmpty) {
      setState(() => _error = 'Please provide a reason.');
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final notifier = ref.read(interestProvider.notifier);
      // rejectProposal expects (interestId, senderId) but we only need the
      // interest ID for the API call; senderId is used for optimistic state.
      // We pass 0 for senderId since we don't track optimistic state here.
      final success = await notifier.rejectProposal(widget.interestId, 0);

      if (!mounted) return;

      if (success) {
        widget.onDeclined?.call();
        Navigator.of(context).pop(true);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Proposal from ${widget.memberName} declined.'),
            backgroundColor: AppColors.slate800,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(AppDecorations.radiusLg),
            ),
          ),
        );
      } else {
        setState(() {
          _error = 'Failed to decline proposal. Please try again.';
          _isLoading = false;
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = 'Something went wrong. Please try again.';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: AppDecorations.sp6,
        right: AppDecorations.sp6,
        top: AppDecorations.sp4,
        bottom: MediaQuery.of(context).viewInsets.bottom + AppDecorations.sp6,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header row
            Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: AppColors.error.withOpacity(0.1),
                    borderRadius:
                        BorderRadius.circular(AppDecorations.radiusFull),
                  ),
                  child: const Icon(
                    LucideIcons.xCircle,
                    color: AppColors.error,
                    size: 22,
                  ),
                ),
                const SizedBox(width: AppDecorations.sp3),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Decline Proposal',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: AppColors.slate900,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'From ${widget.memberName}',
                        style: const TextStyle(
                          fontSize: 13,
                          color: AppColors.slate500,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                // Close button
                GestureDetector(
                  onTap: () => Navigator.of(context).pop(),
                  child: Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: AppColors.slate100,
                      borderRadius:
                          BorderRadius.circular(AppDecorations.radiusFull),
                    ),
                    child: const Icon(
                      LucideIcons.x,
                      size: 18,
                      color: AppColors.slate500,
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: AppDecorations.sp6),

            // Reason label
            const Text(
              'Please select a reason',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppColors.slate700,
              ),
            ),
            const SizedBox(height: AppDecorations.sp3),

            // Reason radio list
            ...DeclineReason.values.map((reason) => _ReasonTile(
                  reason: reason,
                  isSelected: _selectedReason == reason,
                  onTap: () => setState(() {
                    _selectedReason = reason;
                    if (reason != DeclineReason.other) {
                      _error = null;
                    }
                  }),
                )),

            // "Other" message text field
            AnimatedSize(
              duration: const Duration(milliseconds: 200),
              curve: Curves.easeInOut,
              alignment: Alignment.topCenter,
              child: _selectedReason == DeclineReason.other
                  ? Padding(
                      padding: const EdgeInsets.only(top: AppDecorations.sp3),
                      child: DmbTextField(
                        hint: 'Please describe your reason...',
                        controller: _otherController,
                        maxLines: 3,
                        onChanged: (_) {
                          if (_error != null) setState(() => _error = null);
                        },
                      ),
                    )
                  : const SizedBox.shrink(),
            ),

            // Error text
            if (_error != null) ...[
              const SizedBox(height: AppDecorations.sp3),
              Row(
                children: [
                  const Icon(LucideIcons.alertCircle,
                      size: 14, color: AppColors.error),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      _error!,
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppColors.error,
                      ),
                    ),
                  ),
                ],
              ),
            ],

            const SizedBox(height: AppDecorations.sp6),

            // Decline button
            DmbButton(
              text: 'Decline Proposal',
              icon: LucideIcons.xCircle,
              variant: DmbButtonVariant.danger,
              isLoading: _isLoading,
              onPressed: _isLoading ? null : _handleDecline,
            ),

            const SizedBox(height: AppDecorations.sp3),

            // Cancel link
            Center(
              child: GestureDetector(
                onTap: () => Navigator.of(context).pop(),
                child: const Padding(
                  padding: EdgeInsets.symmetric(vertical: 8),
                  child: Text(
                    'Cancel',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: AppColors.slate500,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Individual radio-style reason tile
class _ReasonTile extends StatelessWidget {
  final DeclineReason reason;
  final bool isSelected;
  final VoidCallback onTap;

  const _ReasonTile({
    required this.reason,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        margin: const EdgeInsets.only(bottom: AppDecorations.sp2),
        padding: const EdgeInsets.symmetric(
          horizontal: AppDecorations.sp4,
          vertical: AppDecorations.sp3,
        ),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.error.withOpacity(0.05) : AppColors.slate50,
          borderRadius: BorderRadius.circular(AppDecorations.radiusXl),
          border: Border.all(
            color: isSelected ? AppColors.error.withOpacity(0.4) : AppColors.slate200,
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Row(
          children: [
            // Radio circle
            AnimatedContainer(
              duration: const Duration(milliseconds: 150),
              width: 22,
              height: 22,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: isSelected ? AppColors.error : AppColors.slate300,
                  width: 2,
                ),
                color: isSelected ? AppColors.error : Colors.transparent,
              ),
              child: isSelected
                  ? const Icon(Icons.check, size: 14, color: AppColors.white)
                  : null,
            ),
            const SizedBox(width: AppDecorations.sp3),
            Expanded(
              child: Text(
                reason.label,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                  color: isSelected ? AppColors.slate900 : AppColors.slate700,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
