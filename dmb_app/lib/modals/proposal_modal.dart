import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../theme/app_colors.dart';
import '../theme/app_decorations.dart';
import '../widgets/dmb_button.dart';
import '../widgets/dmb_text_field.dart';
import '../models/profile_match.dart';
import '../providers/auth_provider.dart';
import '../providers/interest_provider.dart';
import '../utils/interest_status.dart';

// ---------------------------------------------------------------------------
// Show helper
// ---------------------------------------------------------------------------

Future<void> showProposalModal(
  BuildContext context, {
  required ProfileMatch profile,
  void Function(String profileId)? onSent,
  void Function(String view)? onNavigate,
}) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => ProposalModal(
      profile: profile,
      onSent: onSent,
      onNavigate: onNavigate,
    ),
  );
}

// ---------------------------------------------------------------------------
// Widget
// ---------------------------------------------------------------------------

class ProposalModal extends ConsumerStatefulWidget {
  final ProfileMatch profile;
  final void Function(String profileId)? onSent;
  final void Function(String view)? onNavigate;

  const ProposalModal({
    super.key,
    required this.profile,
    this.onSent,
    this.onNavigate,
  });

  @override
  ConsumerState<ProposalModal> createState() => _ProposalModalState();
}

class _ProposalModalState extends ConsumerState<ProposalModal> {
  // Steps: 1=Message  2=Attachments  3=Confirmation
  int _step = 1;

  // Message
  final TextEditingController _messageCtrl = TextEditingController();

  // Attachments
  bool _attachBiodata = true;
  bool _attachPhotoRequest = false;
  bool _requestBiodata = false;

  // State
  bool _isLoading = false;
  bool _isSuccess = false;
  String? _error;
  String? _errorCode;
  bool _checkingStatus = true;
  _AlreadySentState? _alreadySent;

  // Templates
  static const _templates = [
    "I'm interested in your profile",
    'I believe we could be a great match',
    'My family would like to connect with yours',
  ];

  ProfileMatch get _profile => widget.profile;

  @override
  void initState() {
    super.initState();
    _checkExistingInterest();
  }

  @override
  void dispose() {
    _messageCtrl.dispose();
    super.dispose();
  }

  // ── Check if interest already exists ──

  Future<void> _checkExistingInterest() async {
    // Quick client-side check first
    final localState = resolveInterestStatus(
      interestStatus: _profile.interestStatus,
      interestText: _profile.interestText,
      myUserId: 0,
      targetUserId: int.tryParse(_profile.id) ?? 0,
    );
    if (localState.state != CanonicalInterestState.none) {
      _mapCanonicalToAlreadySent(localState.state);
      setState(() => _checkingStatus = false);
      return;
    }

    // Server check
    try {
      final api = ref.read(apiServiceProvider);
      final res = await api.get('/member/member-info/${_profile.id}');
      final data = res.data;
      if (data is Map<String, dynamic> && data['data'] != null) {
        final info = data['data'] as Map<String, dynamic>;
        final serverState = resolveInterestStatus(
          interestStatus: info['interest_status'],
          interestText: info['interest_text'],
          myUserId: 0,
          targetUserId: int.tryParse(_profile.id) ?? 0,
        );
        _mapCanonicalToAlreadySent(serverState.state);
      }
    } catch (_) {
      // Allow normal flow on failure
    } finally {
      if (mounted) setState(() => _checkingStatus = false);
    }
  }

  void _mapCanonicalToAlreadySent(CanonicalInterestState state) {
    switch (state) {
      case CanonicalInterestState.sentAccepted:
      case CanonicalInterestState.receivedAccepted:
        _alreadySent = _AlreadySentState.accepted;
        break;
      case CanonicalInterestState.sentPending:
        _alreadySent = _AlreadySentState.pending;
        break;
      case CanonicalInterestState.receivedPending:
        _alreadySent = _AlreadySentState.received;
        break;
      default:
        _alreadySent = null;
    }
  }

  // ── Send proposal ──

  Future<void> _handleSend() async {
    if (_alreadySent != null) return;

    setState(() {
      _isLoading = true;
      _error = null;
      _errorCode = null;
    });

    try {
      final api = ref.read(apiServiceProvider);
      final response = await api.post('/member/express-interest', data: {
        'user_id': int.tryParse(_profile.id) ?? _profile.id,
        'message': _messageCtrl.text.trim(),
      });
      final resData = response.data is Map<String, dynamic>
          ? response.data as Map<String, dynamic>
          : <String, dynamic>{};

      if (resData['result'] == true) {
        // Optimistic update in provider
        final targetId = int.tryParse(_profile.id);
        if (targetId != null) {
          ref.read(interestProvider.notifier).upsertProposalState(targetId, 'sent_pending');
        }
        widget.onSent?.call(_profile.id);
        setState(() {
          _alreadySent = _AlreadySentState.pending;
          _isSuccess = true;
        });
        // Auto-close after 2 seconds
        Future.delayed(const Duration(seconds: 2), () {
          if (mounted) Navigator.of(context).pop();
        });
      } else {
        setState(() {
          _errorCode = resData['error_code']?.toString();
          _error = resData['message']?.toString() ?? 'Could not send proposal.';
        });
      }
    } catch (e) {
      String message = 'Could not send proposal. Please try again.';
      String? code;
      if (e is Exception) {
        // Try to extract from Dio
        try {
          final dynamic err = e;
          final data = err.response?.data;
          if (data is Map<String, dynamic>) {
            code = data['error_code']?.toString();
            message = data['message']?.toString() ?? message;
          }
        } catch (_) {}
      }
      setState(() {
        _errorCode = code;
        _error = message;
      });
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _close() => Navigator.of(context).pop();

  // ── Build ──

  @override
  Widget build(BuildContext context) {
    final height = MediaQuery.of(context).size.height * 0.88;

    // Success overlay
    if (_isSuccess) return _buildSuccessOverlay();

    // Loading check
    if (_checkingStatus) return _buildCheckingOverlay();

    // Already sent / accepted
    if (_alreadySent != null) return _buildAlreadySentSheet(height);

    return _buildMainSheet(height);
  }

  // ── Success overlay ──

  Widget _buildSuccessOverlay() {
    return Center(
      child: Container(
        margin: const EdgeInsets.all(32),
        padding: const EdgeInsets.all(48),
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(AppDecorations.radiusXxl),
          boxShadow: AppDecorations.shadowXl,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: const BoxDecoration(
                color: Color(0xFFDCFCE7),
                shape: BoxShape.circle,
              ),
              child: const Icon(LucideIcons.check, size: 32, color: AppColors.success),
            ),
            const SizedBox(height: 16),
            const Text(
              'Proposal Sent!',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: AppColors.slate900),
            ),
            const SizedBox(height: 8),
            Text(
              'Connecting you with ${_profile.name}',
              style: const TextStyle(fontSize: 14, color: AppColors.slate500),
            ),
          ],
        ),
      ),
    );
  }

  // ── Checking status overlay ──

  Widget _buildCheckingOverlay() {
    return Center(
      child: Container(
        margin: const EdgeInsets.all(32),
        padding: const EdgeInsets.all(48),
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(AppDecorations.radiusXxl),
          boxShadow: AppDecorations.shadowXl,
        ),
        child: const Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2.5),
            SizedBox(height: 16),
            Text('Loading...', style: TextStyle(fontSize: 14, color: AppColors.slate500)),
          ],
        ),
      ),
    );
  }

  // ── Already sent ──

  Widget _buildAlreadySentSheet(double height) {
    final isAccepted = _alreadySent == _AlreadySentState.accepted;
    final isReceived = _alreadySent == _AlreadySentState.received;

    final iconBg = isAccepted ? const Color(0xFFDCFCE7) : const Color(0xFFFEF3C7);
    final iconColor = isAccepted ? AppColors.success : const Color(0xFFD97706);
    final icon = isAccepted ? LucideIcons.checkCircle2 : LucideIcons.check;

    String title;
    String description;
    if (isReceived) {
      title = 'Proposal Received';
      description = '${_profile.name} has already sent you a proposal. Check your interests to respond.';
    } else if (isAccepted) {
      title = 'Proposal Accepted';
      description = 'Your connection with ${_profile.name} has been established. You can now message each other.';
    } else {
      title = 'Proposal Already Sent';
      description = 'You have already sent a proposal to ${_profile.name}. Please wait for their response.';
    }

    return Container(
      height: height * 0.55,
      decoration: const BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppDecorations.radiusXxl)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(color: iconBg, shape: BoxShape.circle),
              child: Icon(icon, size: 32, color: iconColor),
            ),
            const SizedBox(height: 20),
            Text(
              title,
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: AppColors.slate900),
            ),
            const SizedBox(height: 8),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              child: Text(
                description,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 14, color: AppColors.slate500, height: 1.5),
              ),
            ),
            const SizedBox(height: 28),
            if (isAccepted)
              DmbButton(
                text: 'Send Message',
                icon: LucideIcons.messageSquare,
                onPressed: () {
                  _close();
                  widget.onNavigate?.call('messages');
                },
              ),
            if (isAccepted) const SizedBox(height: 12),
            DmbButton(
              text: 'Close',
              variant: DmbButtonVariant.secondary,
              onPressed: _close,
            ),
          ],
        ),
      ),
    );
  }

  // ── Main proposal form ──

  Widget _buildMainSheet(double height) {
    return Container(
      height: height,
      decoration: const BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppDecorations.radiusXxl)),
      ),
      child: Column(
        children: [
          _buildHeader(),
          _buildStepIndicator(),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(24, 8, 24, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (_step == 1) _buildStep1Message(),
                  if (_step == 2) _buildStep2Attachments(),
                  if (_step == 3) _buildStep3Confirmation(),
                ],
              ),
            ),
          ),
          _buildFooter(),
        ],
      ),
    );
  }

  // ── Header ──

  Widget _buildHeader() {
    return Container(
      height: 64,
      padding: const EdgeInsets.symmetric(horizontal: 20),
      decoration: const BoxDecoration(
        color: AppColors.slate50,
        border: Border(bottom: BorderSide(color: AppColors.slate100)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Send Proposal',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.slate900),
                ),
                Text(
                  'To ${_profile.name}',
                  style: const TextStyle(fontSize: 12, color: AppColors.slate500),
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

  // ── Step indicator ──

  Widget _buildStepIndicator() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      child: Row(
        children: List.generate(3, (i) {
          final s = i + 1;
          final isActive = _step >= s;
          return Expanded(
            child: Row(
              children: [
                if (i > 0) const SizedBox(width: 4),
                Expanded(
                  child: Container(
                    height: 4,
                    decoration: BoxDecoration(
                      color: isActive ? AppColors.primary : AppColors.slate100,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                if (i < 2) const SizedBox(width: 4),
              ],
            ),
          );
        }),
      ),
    );
  }

  // ── Step 1: Message ──

  Widget _buildStep1Message() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Match highlights
        if (_profile.matchReasons.isNotEmpty || _profile.matchPercentage > 0)
          Container(
            padding: const EdgeInsets.all(16),
            margin: const EdgeInsets.only(bottom: 20),
            decoration: BoxDecoration(
              color: AppColors.primary5,
              borderRadius: BorderRadius.circular(AppDecorations.radiusXl),
              border: Border.all(color: AppColors.primary10),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(LucideIcons.sparkles, size: 16, color: AppColors.primary),
                    SizedBox(width: 8),
                    Text(
                      'Match Highlights',
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.primary),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: [
                    ..._profile.matchReasons.map(
                      (reason) => _buildHighlightChip(reason),
                    ),
                    if (_profile.matchPercentage > 0)
                      _buildHighlightChip('${_profile.matchPercentage.toInt()}% compatible'),
                  ],
                ),
              ],
            ),
          ),

        // Personal note
        const Text(
          'Personal Note',
          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.slate900),
        ),
        const SizedBox(height: 8),
        Stack(
          children: [
            DmbTextField(
              hint: 'Write a heartfelt message...',
              controller: _messageCtrl,
              maxLines: 5,
              onChanged: (_) => setState(() {}),
            ),
            Positioned(
              bottom: 8,
              right: 12,
              child: Text(
                '${_messageCtrl.text.length}/500',
                style: const TextStyle(fontSize: 11, color: AppColors.slate400),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),

        // Quick templates
        SizedBox(
          height: 36,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: _templates.length,
            separatorBuilder: (_, __) => const SizedBox(width: 8),
            itemBuilder: (_, i) {
              return GestureDetector(
                onTap: () {
                  _messageCtrl.text = _templates[i];
                  setState(() {});
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    color: AppColors.slate100,
                    borderRadius: BorderRadius.circular(AppDecorations.radiusFull),
                  ),
                  child: Text(
                    _templates[i],
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: AppColors.slate600),
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildHighlightChip(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(AppDecorations.radiusMd),
        border: Border.all(color: AppColors.primary10),
        boxShadow: AppDecorations.shadowSm,
      ),
      child: Text(
        text,
        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: AppColors.primaryHover),
      ),
    );
  }

  // ── Step 2: Attachments ──

  Widget _buildStep2Attachments() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text(
          'Proposal Attachments',
          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.slate900),
        ),
        const SizedBox(height: 4),
        const Text(
          'Select what to include with your proposal.',
          style: TextStyle(fontSize: 13, color: AppColors.slate500),
        ),
        const SizedBox(height: 20),
        _buildAttachmentOption(
          icon: LucideIcons.fileText,
          label: 'Standard Biodata',
          subLabel: 'Auto-generated PDF of your profile',
          selected: _attachBiodata,
          onTap: () => setState(() => _attachBiodata = !_attachBiodata),
        ),
        const SizedBox(height: 12),
        _buildAttachmentOption(
          icon: LucideIcons.image,
          label: 'Request Photo Access',
          subLabel: 'Ask to view their private photos',
          selected: _attachPhotoRequest,
          onTap: () => setState(() => _attachPhotoRequest = !_attachPhotoRequest),
        ),
        const SizedBox(height: 12),
        _buildAttachmentOption(
          icon: LucideIcons.users,
          label: 'Request Biodata',
          subLabel: 'Request their detailed biodata PDF',
          selected: _requestBiodata,
          onTap: () => setState(() => _requestBiodata = !_requestBiodata),
        ),
      ],
    );
  }

  Widget _buildAttachmentOption({
    required IconData icon,
    required String label,
    required String subLabel,
    required bool selected,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: selected ? AppColors.primary5 : AppColors.white,
          borderRadius: BorderRadius.circular(AppDecorations.radiusXl),
          border: Border.all(
            color: selected ? AppColors.primary : AppColors.slate100,
            width: 2,
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: selected ? AppColors.white : AppColors.slate100,
                borderRadius: BorderRadius.circular(AppDecorations.radiusLg),
              ),
              child: Icon(icon, size: 20, color: selected ? AppColors.primary : AppColors.slate400),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        label,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: selected ? AppColors.slate900 : AppColors.slate500,
                        ),
                      ),
                      if (selected) ...[
                        const SizedBox(width: 6),
                        const Icon(LucideIcons.check, size: 12, color: AppColors.primary),
                      ],
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subLabel,
                    style: const TextStyle(fontSize: 11, color: AppColors.slate400),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Step 3: Confirmation ──

  Widget _buildStep3Confirmation() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text(
          'Review Your Proposal',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.slate900),
        ),
        const SizedBox(height: 4),
        Text(
          'Sending proposal to ${_profile.name}',
          style: const TextStyle(fontSize: 13, color: AppColors.slate500),
        ),
        const SizedBox(height: 20),

        // Summary card
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: AppColors.slate50,
            borderRadius: BorderRadius.circular(AppDecorations.radiusXxl),
            border: Border.all(color: AppColors.slate200),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Recipient
              _buildSummaryRow(
                'To',
                _profile.name,
              ),
              const Divider(height: 24, color: AppColors.slate200),

              // Message
              _buildSummaryRow(
                'Message',
                _messageCtrl.text.trim().isEmpty ? 'No message' : _messageCtrl.text.trim(),
                isMultiline: true,
              ),
              const Divider(height: 24, color: AppColors.slate200),

              // Attachments
              const Text(
                'Attachments',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.slate500),
              ),
              const SizedBox(height: 8),
              if (_attachBiodata) _buildAttachmentSummaryChip(LucideIcons.fileText, 'Biodata'),
              if (_attachPhotoRequest) _buildAttachmentSummaryChip(LucideIcons.image, 'Photo Request'),
              if (_requestBiodata) _buildAttachmentSummaryChip(LucideIcons.users, 'Biodata Request'),
              if (!_attachBiodata && !_attachPhotoRequest && !_requestBiodata)
                const Text(
                  'No attachments selected',
                  style: TextStyle(fontSize: 13, fontStyle: FontStyle.italic, color: AppColors.slate400),
                ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSummaryRow(String label, String value, {bool isMultiline = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.slate500),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: value == 'No message' ? AppColors.slate300 : AppColors.slate900,
            fontStyle: value == 'No message' ? FontStyle.italic : FontStyle.normal,
          ),
          maxLines: isMultiline ? 6 : 1,
          overflow: TextOverflow.ellipsis,
        ),
      ],
    );
  }

  Widget _buildAttachmentSummaryChip(IconData icon, String label) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        children: [
          Icon(icon, size: 14, color: AppColors.primary),
          const SizedBox(width: 8),
          Text(label, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: AppColors.slate700)),
        ],
      ),
    );
  }

  // ── Footer ──

  Widget _buildFooter() {
    return Container(
      padding: const EdgeInsets.fromLTRB(24, 12, 24, 32),
      decoration: const BoxDecoration(
        color: AppColors.slate50,
        border: Border(top: BorderSide(color: AppColors.slate100)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Error banner
          if (_error != null) ...[
            _buildErrorBanner(),
            const SizedBox(height: 12),
          ],

          Row(
            children: [
              // Member info
              Expanded(
                child: Row(
                  children: [
                    Container(
                      width: 32,
                      height: 32,
                      decoration: const BoxDecoration(
                        color: AppColors.slate200,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 8),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Member Account',
                            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.slate900),
                          ),
                          Text(
                            'Verified Identity',
                            style: TextStyle(fontSize: 10, color: AppColors.slate500),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              // Action button
              _buildActionButton(),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton() {
    // Step navigation
    if (_step < 3) {
      return DmbButton(
        text: _step == 1 ? 'Next' : 'Review',
        icon: LucideIcons.arrowRight,
        isFullWidth: false,
        padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 12),
        onPressed: () => setState(() => _step++),
      );
    }

    // Final send button
    return DmbButton(
      text: _isLoading ? 'Sending...' : 'Send Proposal',
      icon: _isLoading ? null : LucideIcons.send,
      isFullWidth: false,
      isLoading: _isLoading,
      padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 12),
      onPressed: _isLoading ? null : _handleSend,
    );
  }

  Widget _buildErrorBanner() {
    Color bgColor;
    Color textColor;
    Color borderColor;
    IconData icon;

    switch (_errorCode) {
      case 'quota_exhausted':
        bgColor = const Color(0xFFFFFBEB);
        textColor = const Color(0xFF92400E);
        borderColor = const Color(0xFFFDE68A);
        icon = LucideIcons.arrowUpCircle;
        break;
      case 'account_deactivated':
        bgColor = const Color(0xFFFFF7ED);
        textColor = const Color(0xFF9A3412);
        borderColor = const Color(0xFFFED7AA);
        icon = LucideIcons.settings;
        break;
      case 'account_blocked':
        bgColor = const Color(0xFFFEF2F2);
        textColor = const Color(0xFF991B1B);
        borderColor = const Color(0xFFFECACA);
        icon = LucideIcons.shieldOff;
        break;
      default:
        bgColor = const Color(0xFFFEF2F2);
        textColor = AppColors.error;
        borderColor = const Color(0xFFFEE2E2);
        icon = LucideIcons.alertCircle;
    }

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(AppDecorations.radiusXl),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, size: 16, color: textColor),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  _error!,
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: textColor),
                ),
              ),
            ],
          ),
          if (_errorCode == 'quota_exhausted') ...[
            const SizedBox(height: 8),
            DmbButton(
              text: 'Upgrade Package',
              variant: DmbButtonVariant.primary,
              height: 36,
              onPressed: () {
                _close();
                widget.onNavigate?.call('packages');
              },
            ),
          ],
          if (_errorCode == 'account_deactivated') ...[
            const SizedBox(height: 8),
            DmbButton(
              text: 'Go to Settings',
              variant: DmbButtonVariant.primary,
              height: 36,
              onPressed: () {
                _close();
                widget.onNavigate?.call('settings');
              },
            ),
          ],
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Internal enum
// ---------------------------------------------------------------------------

enum _AlreadySentState { pending, accepted, received }
