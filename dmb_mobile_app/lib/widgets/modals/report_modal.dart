import 'package:flutter/material.dart';

import '../../core/core.dart';

/// Report Modal - Report inappropriate user behavior
/// Transpiled from ReportModal.tsx
class ReportModal extends StatefulWidget {
  final String userName;
  final VoidCallback? onReport;

  const ReportModal({
    super.key,
    required this.userName,
    this.onReport,
  });

  static Future<void> show(BuildContext context, String userName) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => ReportModal(userName: userName),
    );
  }

  @override
  State<ReportModal> createState() => _ReportModalState();
}

class _ReportModalState extends State<ReportModal> {
  String? _selectedReason;
  final _descriptionController = TextEditingController();
  bool _blockUser = true;

  final _reportReasons = [
    _ReportReason(
      id: 'fake',
      label: 'Fake Profile or Scammer',
      desc: 'Using false photos or asking for money.',
    ),
    _ReportReason(
      id: 'harassment',
      label: 'Harassment or Abusive Behavior',
      desc: 'Insults, threats, or inappropriate messages.',
    ),
    _ReportReason(
      id: 'spam',
      label: 'Spam or Solicitation',
      desc: 'Selling products or services.',
    ),
    _ReportReason(
      id: 'inappropriate',
      label: 'Inappropriate Content',
      desc: 'Nudity, violence, or offensive bio.',
    ),
    _ReportReason(
      id: 'underage',
      label: 'Underage User',
      desc: 'User appears to be under 18.',
    ),
  ];

  @override
  void dispose() {
    _descriptionController.dispose();
    super.dispose();
  }

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
              color: AppColors.error.withOpacity(0.05),
              border: Border(
                  bottom: BorderSide(color: AppColors.error.withOpacity(0.1))),
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(AppRadius.xl),
              ),
            ),
            child: Row(
              children: [
                Icon(Icons.shield, color: AppColors.error),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: Text(
                    'Report ${widget.userName}',
                    style: AppTypography.titleMedium.copyWith(
                      color: AppColors.error,
                    ),
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
              child: _selectedReason == null
                  ? _buildReasonSelection()
                  : _buildDetailsForm(),
            ),
          ),

          // Footer (only when reason selected)
          if (_selectedReason != null)
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
                    child: Text(
                      'Cancel',
                      style: TextStyle(color: AppColors.slate500),
                    ),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  ElevatedButton(
                    onPressed: _descriptionController.text.length >= 10
                        ? () {
                            widget.onReport?.call();
                            Navigator.pop(context);
                          }
                        : null,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.error,
                      foregroundColor: Colors.white,
                      disabledBackgroundColor: AppColors.slate300,
                    ),
                    child: const Text('Submit Report'),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildReasonSelection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Why are you reporting this user?',
          style: AppTypography.labelMedium.copyWith(
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        ..._reportReasons.map((r) => _buildReasonCard(r)),
      ],
    );
  }

  Widget _buildReasonCard(_ReportReason reason) {
    return GestureDetector(
      onTap: () => setState(() => _selectedReason = reason.id),
      child: Container(
        margin: const EdgeInsets.only(bottom: AppSpacing.sm),
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(AppRadius.lg),
          border: Border.all(color: AppColors.slate200),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    reason.label,
                    style: AppTypography.labelMedium.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    reason.desc,
                    style: AppTypography.caption.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            Icon(Icons.chevron_right, color: AppColors.slate300, size: 16),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailsForm() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Back button
        TextButton.icon(
          onPressed: () => setState(() => _selectedReason = null),
          icon: const Icon(Icons.arrow_back, size: 16),
          label: const Text('Back to reasons'),
          style: TextButton.styleFrom(
            foregroundColor: AppColors.slate500,
            padding: EdgeInsets.zero,
          ),
        ),
        const SizedBox(height: AppSpacing.lg),

        // Description
        Text(
          'Add details (Required)',
          style: AppTypography.labelMedium.copyWith(
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: AppSpacing.sm),
        TextField(
          controller: _descriptionController,
          maxLines: 4,
          onChanged: (_) => setState(() {}),
          decoration: InputDecoration(
            hintText:
                'Please describe the incident... timestamps or specific messages help us investigate faster.',
            hintStyle: AppTypography.bodySmall.copyWith(
              color: AppColors.textSecondary,
            ),
            filled: true,
            fillColor: Colors.white,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppRadius.lg),
              borderSide: BorderSide(color: AppColors.slate300),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppRadius.lg),
              borderSide: BorderSide(color: AppColors.error),
            ),
          ),
        ),
        const SizedBox(height: AppSpacing.lg),

        // Upload Evidence
        Text(
          'Attach Evidence (Optional)',
          style: AppTypography.labelMedium.copyWith(
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: AppSpacing.sm),
        Row(
          children: [
            OutlinedButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.upload, size: 16),
              label: const Text('Upload Screenshots'),
            ),
            const SizedBox(width: AppSpacing.md),
            Text(
              '0 files selected',
              style: AppTypography.caption.copyWith(
                color: AppColors.slate400,
              ),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.lg),

        // Block User
        Container(
          padding: const EdgeInsets.all(AppSpacing.md),
          decoration: BoxDecoration(
            color: AppColors.slate50,
            borderRadius: BorderRadius.circular(AppRadius.lg),
            border: Border.all(color: AppColors.slate200),
          ),
          child: Row(
            children: [
              Checkbox(
                value: _blockUser,
                onChanged: (v) => setState(() => _blockUser = v ?? true),
                activeColor: AppColors.error,
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Block ${widget.userName}',
                      style: AppTypography.labelMedium.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    Text(
                      "They won't be able to see you or message you.",
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
        const SizedBox(height: AppSpacing.md),

        // Privacy notice
        Container(
          padding: const EdgeInsets.all(AppSpacing.sm),
          decoration: BoxDecoration(
            color: AppColors.warning.withOpacity(0.05),
            borderRadius: BorderRadius.circular(AppRadius.md),
          ),
          child: Row(
            children: [
              Icon(Icons.lock, size: 14, color: AppColors.warning),
              const SizedBox(width: AppSpacing.xs),
              Expanded(
                child: Text(
                  'This report is anonymous. ${widget.userName} will not know who reported them.',
                  style: AppTypography.caption.copyWith(
                    color: AppColors.warningDark,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _ReportReason {
  final String id;
  final String label;
  final String desc;

  const _ReportReason({
    required this.id,
    required this.label,
    required this.desc,
  });
}
