import 'package:flutter/material.dart';

import '../../core/core.dart';
import '../../models/profile_match.dart';

/// Proposal Modal - Send formal proposal to a match
/// Transpiled from ProposalModal.tsx
class ProposalModal extends StatefulWidget {
  final ProfileMatch profile;
  final VoidCallback? onSend;
  final VoidCallback? onClose;

  const ProposalModal({
    super.key,
    required this.profile,
    this.onSend,
    this.onClose,
  });

  static Future<void> show(BuildContext context, ProfileMatch profile) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => ProposalModal(profile: profile),
    );
  }

  @override
  State<ProposalModal> createState() => _ProposalModalState();
}

class _ProposalModalState extends State<ProposalModal> {
  final _messageController = TextEditingController();
  bool _attachBiodata = true;
  bool _attachFamilyAlbum = false;
  bool _attachReferences = false;

  final _templates = [
    "I was impressed by your profile and our shared values.",
    "Our families seem to have a lot in common.",
    "Your career path is inspiring, would love to connect.",
  ];

  @override
  void dispose() {
    _messageController.dispose();
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
              color: AppColors.slate50,
              border: Border(bottom: BorderSide(color: AppColors.slate100)),
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(AppRadius.xl),
              ),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Send Proposal', style: AppTypography.titleMedium),
                      Text(
                        'To: ${widget.profile.name}',
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
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Match Highlights
                  _buildMatchHighlights(),
                  const SizedBox(height: AppSpacing.lg),

                  // Message Builder
                  _buildMessageBuilder(),
                  const SizedBox(height: AppSpacing.lg),

                  // Attachments
                  _buildAttachments(),
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
              children: [
                CircleAvatar(
                  radius: 16,
                  backgroundColor: AppColors.slate200,
                  child: const Icon(Icons.person, size: 16),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Sending as Dr. Rajesh',
                        style: AppTypography.labelSmall.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      Text(
                        'Premium Member',
                        style: AppTypography.caption.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                ElevatedButton.icon(
                  onPressed: () {
                    widget.onSend?.call();
                    Navigator.pop(context);
                  },
                  icon: const Icon(Icons.send, size: 16),
                  label: const Text('Send Proposal'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.lg,
                      vertical: AppSpacing.sm,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMatchHighlights() {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.primary.withOpacity(0.05),
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: AppColors.primary.withOpacity(0.1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.auto_awesome, size: 16, color: AppColors.primary),
              const SizedBox(width: AppSpacing.xs),
              Text(
                'Proposal Highlights',
                style: AppTypography.labelSmall.copyWith(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          Wrap(
            spacing: AppSpacing.xs,
            runSpacing: AppSpacing.xs,
            children: [
              ...(widget.profile.matchReasons ??
                      ['Similar Values', 'Career Match'])
                  .map((reason) => _buildHighlightChip(reason)),
              _buildHighlightChip(
                  '${widget.profile.matchPercentage}% Compatible'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildHighlightChip(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: AppSpacing.xxs,
      ),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(color: AppColors.primary.withOpacity(0.2)),
      ),
      child: Text(
        text,
        style: AppTypography.caption.copyWith(
          color: AppColors.primaryHover,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _buildMessageBuilder() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Personal Note', style: AppTypography.labelMedium),
        const SizedBox(height: AppSpacing.sm),
        TextField(
          controller: _messageController,
          maxLines: 4,
          maxLength: 500,
          decoration: InputDecoration(
            hintText: 'Write a personal message or select a template below...',
            hintStyle: AppTypography.bodySmall.copyWith(
              color: AppColors.textSecondary,
            ),
            filled: true,
            fillColor: Colors.white,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppRadius.lg),
              borderSide: BorderSide(color: AppColors.slate200),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppRadius.lg),
              borderSide: BorderSide(color: AppColors.slate200),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppRadius.lg),
              borderSide: BorderSide(color: AppColors.primary),
            ),
          ),
        ),
        const SizedBox(height: AppSpacing.sm),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: _templates
                .map((t) => Padding(
                      padding: const EdgeInsets.only(right: AppSpacing.xs),
                      child: ActionChip(
                        label: Text(t, style: AppTypography.caption),
                        onPressed: () => _messageController.text = t,
                        backgroundColor: AppColors.slate100,
                      ),
                    ))
                .toList(),
          ),
        ),
      ],
    );
  }

  Widget _buildAttachments() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Proposal Packet Attachments', style: AppTypography.labelMedium),
        const SizedBox(height: AppSpacing.sm),
        Row(
          children: [
            Expanded(
              child: _AttachmentOption(
                icon: Icons.description,
                label: 'Standard Biodata',
                subLabel: 'Auto-generated PDF',
                selected: _attachBiodata,
                onTap: () => setState(() => _attachBiodata = !_attachBiodata),
              ),
            ),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              child: _AttachmentOption(
                icon: Icons.photo_library,
                label: 'Family Album',
                subLabel: 'Access to 5 photos',
                selected: _attachFamilyAlbum,
                onTap: () =>
                    setState(() => _attachFamilyAlbum = !_attachFamilyAlbum),
              ),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.sm),
        _AttachmentOption(
          icon: Icons.people,
          label: 'Reference Letters',
          subLabel: '2 Verified References',
          selected: _attachReferences,
          onTap: () => setState(() => _attachReferences = !_attachReferences),
        ),
      ],
    );
  }
}

class _AttachmentOption extends StatelessWidget {
  final IconData icon;
  final String label;
  final String subLabel;
  final bool selected;
  final VoidCallback? onTap;

  const _AttachmentOption({
    required this.icon,
    required this.label,
    required this.subLabel,
    required this.selected,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: selected ? AppColors.primary.withOpacity(0.05) : Colors.white,
          borderRadius: BorderRadius.circular(AppRadius.lg),
          border: Border.all(
            color: selected ? AppColors.primary : AppColors.slate200,
            width: selected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(AppSpacing.sm),
              decoration: BoxDecoration(
                color: selected
                    ? AppColors.primary.withOpacity(0.1)
                    : AppColors.slate100,
                borderRadius: BorderRadius.circular(AppRadius.md),
              ),
              child: Icon(
                icon,
                size: 20,
                color: selected ? AppColors.primary : AppColors.slate500,
              ),
            ),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: AppTypography.labelSmall.copyWith(
                      fontWeight: FontWeight.w700,
                      color: selected ? AppColors.primary : AppColors.slate800,
                    ),
                  ),
                  Text(
                    subLabel,
                    style: AppTypography.caption.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            if (selected)
              Icon(Icons.check_circle, size: 20, color: AppColors.primary),
          ],
        ),
      ),
    );
  }
}
