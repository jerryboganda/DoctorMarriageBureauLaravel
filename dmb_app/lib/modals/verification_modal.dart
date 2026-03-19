import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../theme/app_colors.dart';
import '../theme/app_decorations.dart';
import '../widgets/dmb_button.dart';
import '../widgets/dmb_text_field.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

enum _VerificationStatus { pending, approved, rejected }

enum _FieldType { text, select, radio, multiSelect, file }

class _VerificationField {
  final _FieldType type;
  final String label;
  final List<String> options;

  const _VerificationField({
    required this.type,
    required this.label,
    this.options = const [],
  });

  factory _VerificationField.fromJson(Map<String, dynamic> json) {
    _FieldType type;
    switch (json['type']) {
      case 'select':
        type = _FieldType.select;
        break;
      case 'radio':
        type = _FieldType.radio;
        break;
      case 'multi_select':
        type = _FieldType.multiSelect;
        break;
      case 'file':
        type = _FieldType.file;
        break;
      default:
        type = _FieldType.text;
    }

    List<String> options = [];
    final raw = json['options'];
    if (raw is List) {
      options = raw.map((e) => e.toString()).toList();
    } else if (raw is String) {
      options = raw.split(',').map((e) => e.trim()).where((e) => e.isNotEmpty).toList();
    }

    return _VerificationField(type: type, label: json['label'] ?? '', options: options);
  }
}

// ---------------------------------------------------------------------------
// Show helper
// ---------------------------------------------------------------------------

Future<void> showVerificationModal(
  BuildContext context, {
  bool lockMode = false,
  VoidCallback? onApproved,
}) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    isDismissible: !lockMode,
    enableDrag: !lockMode,
    backgroundColor: Colors.transparent,
    builder: (_) => VerificationModal(
      lockMode: lockMode,
      onApproved: onApproved,
    ),
  );
}

// ---------------------------------------------------------------------------
// Widget
// ---------------------------------------------------------------------------

class VerificationModal extends ConsumerStatefulWidget {
  final bool lockMode;
  final VoidCallback? onApproved;
  final Duration pollInterval;

  const VerificationModal({
    super.key,
    this.lockMode = false,
    this.onApproved,
    this.pollInterval = const Duration(seconds: 30),
  });

  @override
  ConsumerState<VerificationModal> createState() => _VerificationModalState();
}

class _VerificationModalState extends ConsumerState<VerificationModal> {
  // Form state
  int _step = 1; // 1=Info  2=Documents  3=Review  4=Complete
  List<_VerificationField> _fields = [];
  Map<int, dynamic> _values = {};
  Map<int, bool> _processingFiles = {};

  // Loading / errors
  bool _loading = true;
  String? _loadError;
  String? _submitError;
  bool _submitting = false;

  // Status
  _VerificationStatus? _verificationStatus;

  // Polling
  Timer? _pollTimer;

  // Image picker
  final ImagePicker _picker = ImagePicker();

  ApiService get _api => ref.read(apiServiceProvider);

  // ── Lifecycle ──

  @override
  void initState() {
    super.initState();
    _fetchForm();
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }

  // ── Helpers ──

  List<_VerificationField> get _infoFields =>
      _fields.where((f) => f.type != _FieldType.file).toList();

  List<_VerificationField> get _fileFields =>
      _fields.where((f) => f.type == _FieldType.file).toList();

  List<int> _missingFileIndexes() {
    return _fileFields
        .map((f) => _fields.indexOf(f))
        .where((i) => i >= 0 && _values[i] == null)
        .toList();
  }

  void _close() {
    if (widget.lockMode) return;
    Navigator.of(context).pop();
  }

  // ── API ──

  Future<void> _fetchForm() async {
    try {
      setState(() {
        _loading = true;
        _loadError = null;
      });
      final response = await _api.get('/member/verification_form');
      final data = response.data;
      if (data is List) {
        final parsed =
            data.map((e) => _VerificationField.fromJson(e as Map<String, dynamic>)).toList();
        setState(() {
          _fields = parsed;
          _verificationStatus = null;
        });
      } else if (data is Map<String, dynamic> && data['result'] == false) {
        final status = data['verification_status']?.toString();
        setState(() {
          _verificationStatus =
              status == 'approved' ? _VerificationStatus.approved : _VerificationStatus.pending;
          _loadError = data['message']?.toString() ?? 'Verification already submitted.';
        });
        _startPollingIfNeeded();
      } else {
        setState(() => _loadError = 'Verification form is currently unavailable.');
      }
    } catch (e) {
      setState(() => _loadError = 'Failed to load verification form.');
    } finally {
      setState(() => _loading = false);
    }
  }

  void _startPollingIfNeeded() {
    if (!widget.lockMode || _verificationStatus != _VerificationStatus.pending) return;
    _pollTimer?.cancel();
    _pollApproval(); // immediate first check
    _pollTimer = Timer.periodic(widget.pollInterval, (_) => _pollApproval());
  }

  Future<void> _pollApproval() async {
    try {
      final res = await _api.get('/member/is-approved');
      final data = res.data;
      if (data is Map<String, dynamic> &&
          data['is_approved'] == 1 &&
          data['verification_info'] != null) {
        _pollTimer?.cancel();
        if (!mounted) return;
        setState(() {
          _verificationStatus = _VerificationStatus.approved;
          _loadError = null;
        });
        widget.onApproved?.call();
      }
    } catch (_) {
      // Ignore polling errors — retry on next tick
    }
  }

  Future<void> _handleSubmit() async {
    final missing = _missingFileIndexes();
    if (missing.isNotEmpty) {
      setState(
          () => _submitError = 'Please upload all required documents before submitting.');
      return;
    }

    setState(() {
      _submitting = true;
      _submitError = null;
    });

    try {
      // Build multipart form
      final formMap = <String, dynamic>{};
      for (int i = 0; i < _fields.length; i++) {
        final field = _fields[i];
        final value = _values[i];
        if (field.type == _FieldType.file) {
          if (value is File) {
            formMap['element_$i'] = await _multipartFromFile(value);
          }
        } else if (field.type == _FieldType.multiSelect) {
          final list = value is List ? value : <String>[];
          formMap['element_$i'] = list.join(',');
        } else {
          formMap['element_$i'] = value?.toString() ?? '';
        }
      }

      final response = await _api.dio.post(
        '/member/verification-info-store',
        data: FormData.fromMap(formMap),
        options: Options(headers: {'Content-Type': 'multipart/form-data'}),
      );

      final resData = response.data is Map<String, dynamic>
          ? response.data as Map<String, dynamic>
          : <String, dynamic>{};

      if (resData['result'] == false) {
        setState(() => _submitError = resData['message']?.toString() ?? 'Submission failed.');
        return;
      }

      final errorCode = resData['error_code']?.toString();
      final vStatus = resData['verification_status']?.toString();

      if (errorCode == 'already_pending' || vStatus == 'pending') {
        setState(() {
          _verificationStatus = _VerificationStatus.pending;
          _loadError = resData['message']?.toString() ?? 'Your verification is under review.';
        });
        _startPollingIfNeeded();
        return;
      }
      if (errorCode == 'already_approved' || vStatus == 'approved') {
        setState(() {
          _verificationStatus = _VerificationStatus.approved;
          _loadError = resData['message']?.toString() ?? 'Identity verified!';
        });
        widget.onApproved?.call();
        return;
      }

      if (widget.lockMode) {
        setState(() {
          _verificationStatus = _VerificationStatus.pending;
          _loadError = 'Your documents have been submitted and are under review.';
        });
        _startPollingIfNeeded();
      } else {
        setState(() => _step = 4);
      }
    } catch (e) {
      final msg = (e is DioException && e.response?.statusCode == 413)
          ? 'Uploaded files are too large. Please use smaller files.'
          : 'Submission failed. Please try again.';
      setState(() => _submitError = msg);
    } finally {
      setState(() => _submitting = false);
    }
  }

  Future<MultipartFile> _multipartFromFile(File file) async {
    return MultipartFile.fromFile(file.path, filename: file.path.split(Platform.pathSeparator).last);
  }

  Future<void> _pickFile(int index) async {
    setState(() => _processingFiles = {..._processingFiles, index: true});
    try {
      final picked = await _picker.pickImage(source: ImageSource.gallery, imageQuality: 70);
      if (picked != null) {
        setState(() => _values = {..._values, index: File(picked.path)});
      }
    } finally {
      setState(() => _processingFiles = {..._processingFiles, index: false});
    }
  }

  // ── Build ──

  @override
  Widget build(BuildContext context) {
    final height = MediaQuery.of(context).size.height * 0.92;
    return Container(
      height: height,
      decoration: const BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppDecorations.radiusXxl)),
      ),
      child: Column(
        children: [
          _buildHeader(),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
              child: _buildBody(),
            ),
          ),
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
        border: Border(bottom: BorderSide(color: AppColors.slate100)),
      ),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: AppColors.primary10,
              borderRadius: BorderRadius.circular(AppDecorations.radiusFull),
            ),
            child: const Icon(LucideIcons.shieldCheck, size: 18, color: AppColors.primary),
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Text(
              'Identity Verification',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.slate900),
            ),
          ),
          if (!widget.lockMode)
            GestureDetector(
              onTap: _close,
              child: Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: AppColors.slate50,
                  borderRadius: BorderRadius.circular(AppDecorations.radiusFull),
                ),
                child: const Icon(LucideIcons.x, size: 18, color: AppColors.slate400),
              ),
            ),
        ],
      ),
    );
  }

  // ── Stepper ──

  Widget _buildStepper() {
    const labels = ['Info', 'Documents', 'Review', 'Complete'];
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Row(
        children: List.generate(labels.length, (i) {
          final s = i + 1;
          final isActive = _step >= s;
          final isCompleted = _step > s;
          return Expanded(
            child: Column(
              children: [
                Row(
                  children: [
                    if (i > 0) Expanded(child: Container(height: 2, color: isActive ? AppColors.primary : AppColors.slate100)),
                    Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        color: isActive ? AppColors.primary : AppColors.white,
                        border: Border.all(
                          color: isActive ? AppColors.primary : AppColors.slate200,
                          width: 2.5,
                        ),
                        shape: BoxShape.circle,
                      ),
                      child: Center(
                        child: isCompleted
                            ? const Icon(LucideIcons.check, size: 14, color: AppColors.white)
                            : Text(
                                '$s',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  color: isActive ? AppColors.white : AppColors.slate300,
                                ),
                              ),
                      ),
                    ),
                    if (i < labels.length - 1) Expanded(child: Container(height: 2, color: _step > s ? AppColors.primary : AppColors.slate100)),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  labels[i],
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.5,
                    color: isActive ? AppColors.primary : AppColors.slate300,
                  ),
                ),
              ],
            ),
          );
        }),
      ),
    );
  }

  // ── Body ──

  Widget _buildBody() {
    if (_loading) return _buildLoading();

    // Status screens
    if (_loadError != null && _verificationStatus == _VerificationStatus.approved) {
      return _buildApprovedState();
    }
    if (_loadError != null && _verificationStatus == _VerificationStatus.pending) {
      return _buildPendingState();
    }
    if (_loadError != null && _verificationStatus == null) {
      return _buildErrorState();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _buildStepper(),
        if (_step == 1) _buildStep1Info(),
        if (_step == 2) _buildStep2Docs(),
        if (_step == 3) _buildStep3Review(),
        if (_step == 4) _buildStep4Complete(),
      ],
    );
  }

  // ── Loading ──

  Widget _buildLoading() {
    return const Padding(
      padding: EdgeInsets.symmetric(vertical: 80),
      child: Center(
        child: Column(
          children: [
            CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2.5),
            SizedBox(height: 16),
            Text(
              'Loading verification form...',
              style: TextStyle(fontSize: 14, color: AppColors.slate400),
            ),
          ],
        ),
      ),
    );
  }

  // ── Status: Approved ──

  Widget _buildApprovedState() {
    return _buildStatusCard(
      bgColor: const Color(0xFFECFDF5),
      borderColor: const Color(0xFFA7F3D0),
      iconBg: const Color(0xFFD1FAE5),
      iconColor: const Color(0xFF059669),
      icon: LucideIcons.shieldCheck,
      title: 'Identity Verified',
      description: _loadError ?? 'Your identity has been verified.',
      badgeText: 'VERIFIED MEMBER',
      badgeBg: const Color(0xFFD1FAE5),
      badgeTextColor: const Color(0xFF047857),
      buttonText: 'Done',
      buttonColor: const Color(0xFF059669),
      onButton: widget.lockMode ? null : _close,
    );
  }

  // ── Status: Pending ──

  Widget _buildPendingState() {
    return _buildStatusCard(
      bgColor: const Color(0xFFFFFBEB),
      borderColor: const Color(0xFFFDE68A),
      iconBg: const Color(0xFFFEF3C7),
      iconColor: const Color(0xFFD97706),
      icon: LucideIcons.clock,
      title: 'Under Review',
      description: _loadError ?? 'Your documents are being reviewed.',
      badgeText: 'PENDING REVIEW',
      badgeBg: const Color(0xFFFEF3C7),
      badgeTextColor: const Color(0xFFB45309),
      buttonText: 'Done',
      buttonColor: const Color(0xFFD97706),
      onButton: widget.lockMode ? null : _close,
      showSpinner: true,
    );
  }

  // ── Status: Error ──

  Widget _buildErrorState() {
    return _buildStatusCard(
      bgColor: const Color(0xFFFEF2F2),
      borderColor: const Color(0xFFFEE2E2),
      iconBg: const Color(0xFFFEE2E2),
      iconColor: AppColors.error,
      icon: LucideIcons.alertCircle,
      title: 'Unable to Start',
      description: _loadError ?? 'Something went wrong.',
      buttonText: widget.lockMode ? 'Retry' : 'Done',
      buttonColor: AppColors.error,
      onButton: widget.lockMode ? () => _fetchForm() : _close,
    );
  }

  Widget _buildStatusCard({
    required Color bgColor,
    required Color borderColor,
    required Color iconBg,
    required Color iconColor,
    required IconData icon,
    required String title,
    required String description,
    String? badgeText,
    Color? badgeBg,
    Color? badgeTextColor,
    required String buttonText,
    required Color buttonColor,
    VoidCallback? onButton,
    bool showSpinner = false,
  }) {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(AppDecorations.radiusXxl),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        children: [
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(color: iconBg, shape: BoxShape.circle),
            child: showSpinner
                ? Padding(
                    padding: const EdgeInsets.all(16),
                    child: CircularProgressIndicator(strokeWidth: 2.5, color: iconColor),
                  )
                : Icon(icon, size: 32, color: iconColor),
          ),
          const SizedBox(height: 16),
          Text(
            title,
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: AppColors.slate900),
          ),
          const SizedBox(height: 8),
          Text(
            description,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 14, color: AppColors.slate500, height: 1.5),
          ),
          if (badgeText != null) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              decoration: BoxDecoration(
                color: badgeBg,
                borderRadius: BorderRadius.circular(AppDecorations.radiusFull),
              ),
              child: Text(
                badgeText,
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1,
                  color: badgeTextColor,
                ),
              ),
            ),
          ],
          if (onButton != null) ...[
            const SizedBox(height: 24),
            DmbButton(
              text: buttonText,
              onPressed: onButton,
              isFullWidth: false,
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
            ),
          ],
        ],
      ),
    );
  }

  // ── Step 1: Personal Info ──

  Widget _buildStep1Info() {
    if (_infoFields.isEmpty) {
      return _buildEmptyFieldsPlaceholder('All personal information verified', 'No additional details required.');
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text(
          'Personal Information',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: AppColors.slate900),
        ),
        const SizedBox(height: 4),
        const Text(
          'Please confirm your details below.',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 14, color: AppColors.slate500),
        ),
        const SizedBox(height: 24),
        ..._infoFields.map((field) {
          final idx = _fields.indexOf(field);
          return Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: _buildFieldWidget(field, idx),
          );
        }),
        const SizedBox(height: 8),
        DmbButton(
          text: 'Continue to Documents',
          icon: LucideIcons.arrowRight,
          onPressed: () => setState(() => _step = 2),
        ),
      ],
    );
  }

  // ── Step 2: Documents ──

  Widget _buildStep2Docs() {
    if (_fileFields.isEmpty) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _buildEmptyFieldsPlaceholder('Documents not required', 'No uploads needed.'),
          const SizedBox(height: 24),
          _buildBackNextRow(
            onBack: () => setState(() => _step = 1),
            nextText: 'Review Submission',
            onNext: () => setState(() => _step = 3),
          ),
        ],
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text(
          'Document Upload',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: AppColors.slate900),
        ),
        const SizedBox(height: 4),
        const Text(
          'Upload clear photos of your identification documents.',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 14, color: AppColors.slate500),
        ),
        const SizedBox(height: 24),
        ..._fileFields.map((field) {
          final idx = _fields.indexOf(field);
          return Padding(
            padding: const EdgeInsets.only(bottom: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      field.label.toUpperCase(),
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: AppColors.slate700,
                        letterSpacing: 0.5,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppColors.slate100,
                        borderRadius: BorderRadius.circular(AppDecorations.radiusFull),
                      ),
                      child: const Text(
                        'REQUIRED',
                        style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.slate500),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                _buildFileUploader(idx, field.label),
              ],
            ),
          );
        }),
        if (_submitError != null) _buildErrorBanner(_submitError!),
        const SizedBox(height: 8),
        _buildBackNextRow(
          onBack: () => setState(() => _step = 1),
          nextText: 'Review Submission',
          onNext: () {
            final missing = _missingFileIndexes();
            if (missing.isNotEmpty) {
              setState(() => _submitError = 'Please upload all required documents before continuing.');
              return;
            }
            setState(() {
              _submitError = null;
              _step = 3;
            });
          },
        ),
      ],
    );
  }

  // ── Step 3: Review ──

  Widget _buildStep3Review() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text(
          'Confirm Your Details',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: AppColors.slate900),
        ),
        const SizedBox(height: 4),
        const Text(
          'Please double-check all information before submitting.',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 14, color: AppColors.slate500),
        ),
        const SizedBox(height: 24),
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: AppColors.slate50,
            borderRadius: BorderRadius.circular(AppDecorations.radiusXxl),
            border: Border.all(color: AppColors.slate200),
          ),
          child: Column(
            children: _fields.asMap().entries.map((entry) {
              final idx = entry.key;
              final field = entry.value;
              final value = _values[idx];
              return Padding(
                padding: EdgeInsets.only(bottom: idx < _fields.length - 1 ? 16 : 0),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      flex: 2,
                      child: Text(
                        field.label,
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppColors.slate500,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      flex: 3,
                      child: _buildReviewValue(field, value),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
        ),
        if (_submitError != null) ...[
          const SizedBox(height: 16),
          _buildErrorBanner(_submitError!),
        ],
        const SizedBox(height: 24),
        _buildBackNextRow(
          onBack: () => setState(() => _step = 2),
          nextText: 'Submit Verification',
          onNext: _submitting ? null : _handleSubmit,
          isPrimary: true,
          isLoading: _submitting,
        ),
      ],
    );
  }

  Widget _buildReviewValue(_VerificationField field, dynamic value) {
    if (field.type == _FieldType.file) {
      if (value is File) {
        return Row(
          children: [
            const Icon(LucideIcons.fileText, size: 14, color: AppColors.success),
            const SizedBox(width: 6),
            Expanded(
              child: Text(
                value.path.split(Platform.pathSeparator).last,
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: AppColors.success),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        );
      }
      return const Text(
        'Not provided',
        style: TextStyle(fontSize: 13, fontStyle: FontStyle.italic, color: AppColors.error),
      );
    }
    final display = value is List ? value.join(', ') : (value?.toString() ?? '');
    if (display.isEmpty) {
      return const Text(
        'Empty',
        style: TextStyle(fontSize: 13, fontStyle: FontStyle.italic, color: AppColors.slate300),
      );
    }
    return Text(
      display,
      textAlign: TextAlign.end,
      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: AppColors.slate900),
    );
  }

  // ── Step 4: Complete ──

  Widget _buildStep4Complete() {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 40),
      child: Column(
        children: [
          Container(
            width: 96,
            height: 96,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF34D399), Color(0xFF059669)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF059669).withOpacity(0.3),
                  blurRadius: 24,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: const Icon(LucideIcons.shieldCheck, size: 48, color: AppColors.white),
          ),
          const SizedBox(height: 24),
          const Text(
            'Verification Submitted!',
            style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.slate900),
          ),
          const SizedBox(height: 8),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 24),
            child: Text(
              'Your documents have been submitted and are under review. We will notify you once your identity is verified.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 14, color: AppColors.slate500, height: 1.5),
            ),
          ),
          const SizedBox(height: 32),
          DmbButton(
            text: 'Return to Profile',
            onPressed: _close,
            isFullWidth: false,
            padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 14),
          ),
        ],
      ),
    );
  }

  // ── Field widgets ──

  Widget _buildFieldWidget(_VerificationField field, int index) {
    switch (field.type) {
      case _FieldType.text:
        return DmbTextField(
          label: field.label,
          hint: 'Enter your ${field.label.toLowerCase()}',
          controller: TextEditingController(text: _values[index]?.toString() ?? ''),
          onChanged: (v) => _values[index] = v,
        );

      case _FieldType.select:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              field.label,
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: AppColors.slate700),
            ),
            const SizedBox(height: 6),
            Container(
              decoration: AppDecorations.input(),
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  isExpanded: true,
                  value: _values[index]?.toString().isEmpty == true ? null : _values[index]?.toString(),
                  hint: const Text('Select an option', style: TextStyle(fontSize: 14, color: AppColors.slate400)),
                  icon: const Icon(LucideIcons.chevronDown, size: 16, color: AppColors.slate400),
                  style: const TextStyle(fontSize: 14, color: AppColors.slate900),
                  items: field.options
                      .map((opt) => DropdownMenuItem(value: opt, child: Text(opt)))
                      .toList(),
                  onChanged: (v) => setState(() => _values[index] = v),
                ),
              ),
            ),
          ],
        );

      case _FieldType.radio:
        final selected = _values[index]?.toString();
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              field.label,
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: AppColors.slate700),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: field.options.map((opt) {
                final isSelected = selected == opt;
                return GestureDetector(
                  onTap: () => setState(() => _values[index] = opt),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: isSelected ? AppColors.primary5 : AppColors.white,
                      borderRadius: BorderRadius.circular(AppDecorations.radiusFull),
                      border: Border.all(
                        color: isSelected ? AppColors.primary : AppColors.slate200,
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (isSelected) ...[
                          const Icon(LucideIcons.check, size: 14, color: AppColors.primary),
                          const SizedBox(width: 6),
                        ],
                        Text(
                          opt,
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                            color: isSelected ? AppColors.primary : AppColors.slate600,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
          ],
        );

      case _FieldType.multiSelect:
        final selected = _values[index] is List ? List<String>.from(_values[index]) : <String>[];
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              field.label,
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: AppColors.slate700),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: field.options.map((opt) {
                final isSelected = selected.contains(opt);
                return GestureDetector(
                  onTap: () {
                    final updated = List<String>.from(selected);
                    if (isSelected) {
                      updated.remove(opt);
                    } else {
                      updated.add(opt);
                    }
                    setState(() => _values[index] = updated);
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: isSelected ? AppColors.primary5 : AppColors.white,
                      borderRadius: BorderRadius.circular(AppDecorations.radiusFull),
                      border: Border.all(
                        color: isSelected ? AppColors.primary : AppColors.slate200,
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          isSelected ? LucideIcons.checkSquare : LucideIcons.square,
                          size: 14,
                          color: isSelected ? AppColors.primary : AppColors.slate400,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          opt,
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                            color: isSelected ? AppColors.primary : AppColors.slate600,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
          ],
        );

      case _FieldType.file:
        return _buildFileUploader(index, field.label);
    }
  }

  // ── File uploader ──

  Widget _buildFileUploader(int index, String label) {
    final isProcessing = _processingFiles[index] == true;
    final file = _values[index];

    if (isProcessing) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.primary5,
          borderRadius: BorderRadius.circular(AppDecorations.radiusXl),
          border: Border.all(color: AppColors.primary, width: 2),
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: const BoxDecoration(color: AppColors.white, shape: BoxShape.circle),
              child: const Padding(
                padding: EdgeInsets.all(10),
                child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.slate900)),
                  const Text('Processing file...', style: TextStyle(fontSize: 10, color: AppColors.slate500)),
                ],
              ),
            ),
          ],
        ),
      );
    }

    if (file is File) {
      final fileName = file.path.split(Platform.pathSeparator).last;
      final fileSizeKb = file.lengthSync() / 1024;
      final sizeLabel = fileSizeKb > 1024
          ? '${(fileSizeKb / 1024).toStringAsFixed(2)} MB'
          : '${fileSizeKb.toStringAsFixed(0)} KB';

      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFFF0FDF4),
          borderRadius: BorderRadius.circular(AppDecorations.radiusXl),
          border: Border.all(color: AppColors.success, width: 2),
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: const BoxDecoration(color: AppColors.white, shape: BoxShape.circle),
              child: const Icon(LucideIcons.fileText, size: 20, color: AppColors.success),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    fileName,
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.slate900),
                    overflow: TextOverflow.ellipsis,
                  ),
                  Text(
                    '$sizeLabel - Ready to upload',
                    style: const TextStyle(fontSize: 10, color: AppColors.slate500),
                  ),
                ],
              ),
            ),
            GestureDetector(
              onTap: () => setState(() => _values.remove(index)),
              child: Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: AppColors.white,
                  borderRadius: BorderRadius.circular(AppDecorations.radiusFull),
                ),
                child: const Icon(LucideIcons.trash2, size: 16, color: AppColors.slate400),
              ),
            ),
          ],
        ),
      );
    }

    // Empty — upload prompt
    return GestureDetector(
      onTap: () => _pickFile(index),
      child: Container(
        height: 140,
        decoration: BoxDecoration(
          color: AppColors.slate50,
          borderRadius: BorderRadius.circular(AppDecorations.radiusXxl),
          border: Border.all(color: AppColors.slate300, width: 1.5, style: BorderStyle.solid),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: const BoxDecoration(color: AppColors.white, shape: BoxShape.circle),
              child: const Icon(LucideIcons.upload, size: 22, color: AppColors.slate400),
            ),
            const SizedBox(height: 10),
            const Text(
              'Tap to upload photo',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.slate700),
            ),
            const SizedBox(height: 4),
            const Text(
              'JPG, PNG supported',
              style: TextStyle(fontSize: 10, color: AppColors.slate400),
            ),
          ],
        ),
      ),
    );
  }

  // ── Common helpers ──

  Widget _buildEmptyFieldsPlaceholder(String title, String subtitle) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 40),
      decoration: BoxDecoration(
        color: AppColors.slate50,
        borderRadius: BorderRadius.circular(AppDecorations.radiusXxl),
        border: Border.all(color: AppColors.slate200, style: BorderStyle.solid),
      ),
      child: Column(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: const BoxDecoration(color: AppColors.white, shape: BoxShape.circle),
            child: const Icon(LucideIcons.check, size: 24, color: AppColors.success),
          ),
          const SizedBox(height: 12),
          Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.slate700)),
          const SizedBox(height: 4),
          Text(subtitle, style: const TextStyle(fontSize: 12, color: AppColors.slate400)),
        ],
      ),
    );
  }

  Widget _buildErrorBanner(String message) {
    return Container(
      margin: const EdgeInsets.only(top: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFFEF2F2),
        borderRadius: BorderRadius.circular(AppDecorations.radiusLg),
      ),
      child: Row(
        children: [
          const Icon(LucideIcons.alertCircle, size: 16, color: AppColors.error),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              message,
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.error),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBackNextRow({
    required VoidCallback onBack,
    required String nextText,
    VoidCallback? onNext,
    bool isPrimary = false,
    bool isLoading = false,
  }) {
    return Row(
      children: [
        GestureDetector(
          onTap: onBack,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(AppDecorations.radiusXl),
            ),
            child: const Text(
              'Back',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.slate500),
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: DmbButton(
            text: nextText,
            onPressed: onNext,
            variant: isPrimary ? DmbButtonVariant.primary : DmbButtonVariant.primary,
            isLoading: isLoading,
          ),
        ),
      ],
    );
  }
}

// Re-export Dio types used for multipart
import 'package:dio/dio.dart';
