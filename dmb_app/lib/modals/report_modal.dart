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

Future<void> showReportModal(
  BuildContext context, {
  required String userName,
  required int userId,
  VoidCallback? onClose,
}) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => ReportModal(
      userName: userName,
      userId: userId,
      onClose: onClose ?? () => Navigator.of(context).pop(),
    ),
  );
}

// ---------------------------------------------------------------------------
// Reason data
// ---------------------------------------------------------------------------

class _ReportReason {
  final String key;
  final String title;
  final String description;
  final IconData icon;

  const _ReportReason({
    required this.key,
    required this.title,
    required this.description,
    required this.icon,
  });
}

const _reasons = [
  _ReportReason(
    key: 'Fake Profile',
    title: 'Fake Profile',
    description: 'This profile appears to be fake or misleading',
    icon: LucideIcons.userX,
  ),
  _ReportReason(
    key: 'Harassment',
    title: 'Harassment',
    description: 'This person is sending harassing messages',
    icon: LucideIcons.alertTriangle,
  ),
  _ReportReason(
    key: 'Spam',
    title: 'Spam',
    description: 'This profile is spamming or advertising',
    icon: LucideIcons.mailWarning,
  ),
  _ReportReason(
    key: 'Inappropriate Content',
    title: 'Inappropriate Content',
    description: 'This profile contains inappropriate content',
    icon: LucideIcons.ban,
  ),
  _ReportReason(
    key: 'Underage',
    title: 'Underage',
    description: 'This person appears to be underage',
    icon: LucideIcons.shieldAlert,
  ),
];

// ---------------------------------------------------------------------------
// Widget
// ---------------------------------------------------------------------------

class ReportModal extends ConsumerStatefulWidget {
  final VoidCallback onClose;
  final String userName;
  final int userId;

  const ReportModal({
    super.key,
    required this.onClose,
    required this.userName,
    required this.userId,
  });

  @override
  ConsumerState<ReportModal> createState() => _ReportModalState();
}

class _ReportModalState extends ConsumerState<ReportModal> {
  String? _reason;
  final TextEditingController _descriptionCtrl = TextEditingController();
  bool _blockUser = false;
  bool _submitting = false;
  String? _error;

  @override
  void dispose() {
    _descriptionCtrl.dispose();
    super.dispose();
  }

  bool get _canSubmit =>
      _descriptionCtrl.text.trim().length >= 10 && !_submitting;

  Future<void> _handleSubmit() async {
    if (!_canSubmit) return;

    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      final api = ref.read(apiServiceProvider);

      // Report the member
      await api.post('/member/report-member', data: {
        'user_id': widget.userId,
        'reason': _reason,
        'description': _descriptionCtrl.text.trim(),
      });

      // Optionally block the user
      if (_blockUser) {
        await api.post('/member/add-to-ignore-list', data: {
          'user_id': widget.userId,
        });
      }

      if (mounted) {
        widget.onClose();
      }
    } catch (e) {
      String message = 'Failed to submit report. Please try again.';
      try {
        final dynamic err = e;
        final data = err.response?.data;
        if (data is Map<String, dynamic> && data['message'] != null) {
          message = data['message'].toString();
        }
      } catch (_) {}
      if (mounted) setState(() => _error = message);
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  void _close() => widget.onClose();

  @override
  Widget build(BuildContext context) {
    final height = MediaQuery.of(context).size.height * 0.88;

    return Container(
      height: height,
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: const BorderRadius.vertical(
          top: Radius.circular(AppDecorations.radiusXxl),
        ),
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

          // Header
          _buildHeader(),

          // Content
          Expanded(
            child: _reason == null ? _buildStep1() : _buildStep2(),
          ),
        ],
      ),
    );
  }

  // ── Header ──

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      decoration: BoxDecoration(
        color: const Color(0xFFFEF2F2), // red-50
        border: const Border(
          bottom: BorderSide(color: Color(0xFFFEE2E2)), // red-100
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: const Color(0xFFFEE2E2), // red-100
              borderRadius: BorderRadius.circular(AppDecorations.radiusLg),
            ),
            child: const Icon(
              Icons.shield_outlined,
              size: 20,
              color: AppColors.error,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Report ${widget.userName}',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppColors.slate900,
                  ),
                ),
                const Text(
                  'Help us keep the community safe',
                  style: TextStyle(fontSize: 12, color: AppColors.slate500),
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
                color: AppColors.white,
                borderRadius: BorderRadius.circular(AppDecorations.radiusFull),
              ),
              child: const Icon(LucideIcons.x, size: 18, color: AppColors.slate400),
            ),
          ),
        ],
      ),
    );
  }

  // ── Step 1: Select reason ──

  Widget _buildStep1() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Why are you reporting this profile?',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w600,
              color: AppColors.slate900,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Select the reason that best describes the issue.',
            style: TextStyle(fontSize: 13, color: AppColors.slate500),
          ),
          const SizedBox(height: 16),

          ...List.generate(_reasons.length, (i) {
            final reason = _reasons[i];
            return Padding(
              padding: EdgeInsets.only(bottom: i < _reasons.length - 1 ? 10 : 0),
              child: _buildReasonCard(reason),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildReasonCard(_ReportReason reason) {
    return GestureDetector(
      onTap: () => setState(() => _reason = reason.key),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(AppDecorations.radiusXl),
          border: Border.all(color: AppColors.slate200),
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: AppColors.slate100,
                borderRadius: BorderRadius.circular(AppDecorations.radiusLg),
              ),
              child: Icon(reason.icon, size: 20, color: AppColors.slate600),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    reason.title,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: AppColors.slate900,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    reason.description,
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.slate500,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(LucideIcons.chevronRight, size: 18, color: AppColors.slate400),
          ],
        ),
      ),
    );
  }

  // ── Step 2: Details + submit ──

  Widget _buildStep2() {
    return Column(
      children: [
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Back button
                GestureDetector(
                  onTap: () => setState(() {
                    _reason = null;
                    _error = null;
                  }),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: const [
                      Icon(LucideIcons.arrowLeft, size: 16, color: AppColors.primary),
                      SizedBox(width: 6),
                      Text(
                        'Back to reasons',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: AppColors.primary,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // Selected reason display
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEF2F2), // red-50
                    borderRadius: BorderRadius.circular(AppDecorations.radiusXl),
                    border: Border.all(color: const Color(0xFFFECACA)), // red-200
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.shield_outlined, size: 18, color: AppColors.error),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Reporting for:',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w500,
                                color: AppColors.slate500,
                              ),
                            ),
                            Text(
                              _reason ?? '',
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: AppColors.slate900,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // Textarea for additional details
                const Text(
                  'Additional Details',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppColors.slate900,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Please provide more information (minimum 10 characters).',
                  style: TextStyle(fontSize: 12, color: AppColors.slate500),
                ),
                const SizedBox(height: 8),
                Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(AppDecorations.radiusXl),
                    border: Border.all(color: AppColors.slate200),
                  ),
                  child: TextField(
                    controller: _descriptionCtrl,
                    maxLines: 5,
                    onChanged: (_) => setState(() {}),
                    decoration: InputDecoration(
                      hintText: 'Describe what happened...',
                      hintStyle: const TextStyle(
                        fontSize: 14,
                        color: AppColors.slate400,
                      ),
                      contentPadding: const EdgeInsets.all(14),
                      border: InputBorder.none,
                    ),
                    style: const TextStyle(
                      fontSize: 14,
                      color: AppColors.slate900,
                    ),
                  ),
                ),
                Text(
                  '${_descriptionCtrl.text.trim().length}/500',
                  style: const TextStyle(fontSize: 11, color: AppColors.slate400),
                ),
                const SizedBox(height: 20),

                // Block user checkbox
                GestureDetector(
                  onTap: () => setState(() => _blockUser = !_blockUser),
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppColors.slate50,
                      borderRadius: BorderRadius.circular(AppDecorations.radiusXl),
                      border: Border.all(
                        color: _blockUser ? AppColors.primary : AppColors.slate200,
                      ),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 22,
                          height: 22,
                          decoration: BoxDecoration(
                            color: _blockUser ? AppColors.primary : AppColors.white,
                            borderRadius: BorderRadius.circular(4),
                            border: Border.all(
                              color: _blockUser ? AppColors.primary : AppColors.slate300,
                              width: 2,
                            ),
                          ),
                          child: _blockUser
                              ? const Icon(LucideIcons.check, size: 14, color: AppColors.white)
                              : null,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Block ${widget.userName}',
                                style: const TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.slate900,
                                ),
                              ),
                              const SizedBox(height: 2),
                              const Text(
                                'They won\'t be able to see your profile or contact you',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: AppColors.slate500,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Anonymous info box
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFFBEB), // yellow-50
                    borderRadius: BorderRadius.circular(AppDecorations.radiusXl),
                    border: Border.all(color: const Color(0xFFFDE68A)), // yellow-200
                  ),
                  child: Row(
                    children: const [
                      Icon(LucideIcons.shieldCheck, size: 18, color: Color(0xFFD97706)),
                      SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'Your report is anonymous. The reported user will not know who filed the report.',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: Color(0xFF92400E), // yellow-800
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                // Error
                if (_error != null) ...[
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEF2F2),
                      borderRadius: BorderRadius.circular(AppDecorations.radiusXl),
                      border: Border.all(color: const Color(0xFFFEE2E2)),
                    ),
                    child: Row(
                      children: [
                        const Icon(LucideIcons.alertCircle, size: 16, color: AppColors.error),
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
          ),
        ),

        // Footer
        _buildFooter(),
      ],
    );
  }

  Widget _buildFooter() {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
      decoration: const BoxDecoration(
        color: AppColors.slate50,
        border: Border(top: BorderSide(color: AppColors.slate100)),
      ),
      child: DmbButton(
        text: _submitting ? 'Submitting...' : 'Submit Report',
        icon: _submitting ? null : Icons.shield_outlined,
        variant: DmbButtonVariant.danger,
        isLoading: _submitting,
        onPressed: _canSubmit ? _handleSubmit : null,
      ),
    );
  }
}
