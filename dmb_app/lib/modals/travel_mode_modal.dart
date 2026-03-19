import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../theme/app_colors.dart';
import '../theme/app_decorations.dart';
import '../widgets/dmb_button.dart';
import '../widgets/dmb_text_field.dart';

// ---------------------------------------------------------------------------
// Show helper
// ---------------------------------------------------------------------------

Future<void> showTravelModeModal(
  BuildContext context, {
  required VoidCallback onClose,
  required Function(String city, String country) onEnable,
  bool loading = false,
  String? currentCity,
  String? currentCountry,
}) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => TravelModeModal(
      onClose: onClose,
      onEnable: onEnable,
      loading: loading,
      currentCity: currentCity,
      currentCountry: currentCountry,
    ),
  );
}

// ---------------------------------------------------------------------------
// Widget
// ---------------------------------------------------------------------------

class TravelModeModal extends StatefulWidget {
  final VoidCallback onClose;
  final Function(String city, String country) onEnable;
  final bool loading;
  final String? currentCity;
  final String? currentCountry;

  const TravelModeModal({
    super.key,
    required this.onClose,
    required this.onEnable,
    this.loading = false,
    this.currentCity,
    this.currentCountry,
  });

  @override
  State<TravelModeModal> createState() => _TravelModeModalState();
}

class _TravelModeModalState extends State<TravelModeModal> {
  late final TextEditingController _cityCtrl;
  late final TextEditingController _countryCtrl;

  @override
  void initState() {
    super.initState();
    _cityCtrl = TextEditingController(text: widget.currentCity ?? '');
    _countryCtrl = TextEditingController(text: widget.currentCountry ?? '');
  }

  @override
  void dispose() {
    _cityCtrl.dispose();
    _countryCtrl.dispose();
    super.dispose();
  }

  bool get _canSubmit =>
      _cityCtrl.text.trim().isNotEmpty &&
      _countryCtrl.text.trim().isNotEmpty &&
      !widget.loading;

  void _handleSubmit() {
    if (!_canSubmit) return;
    widget.onEnable(_cityCtrl.text.trim(), _countryCtrl.text.trim());
  }

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
          _buildHeader(),
          _buildBody(),
          _buildFooter(),
        ],
      ),
    );
  }

  // ── Header ──

  Widget _buildHeader() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: const BoxDecoration(
        color: Color(0xFFEFF6FF), // blue-50
        border: Border(bottom: BorderSide(color: AppColors.slate100)),
      ),
      child: Column(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: const Color(0xFFDBEAFE), // blue-100
              borderRadius: BorderRadius.circular(AppDecorations.radiusFull),
            ),
            child: const Icon(
              Icons.flight,
              size: 28,
              color: Color(0xFF2563EB), // blue-600
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'Travel Mode',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w700,
              color: AppColors.slate900,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Let potential matches know you\'re visiting another city. '
            'Your profile will appear in that city\'s discovery feed.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 13,
              color: AppColors.slate500,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }

  // ── Body ──

  Widget _buildBody() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          DmbTextField(
            label: 'City',
            hint: 'Enter city name',
            controller: _cityCtrl,
            onChanged: (_) => setState(() {}),
            prefix: const Icon(
              Icons.location_on,
              size: 20,
              color: AppColors.slate400,
            ),
          ),
          const SizedBox(height: 16),
          DmbTextField(
            label: 'Country',
            hint: 'Enter country name',
            controller: _countryCtrl,
            onChanged: (_) => setState(() {}),
            prefix: const Icon(
              Icons.location_on,
              size: 20,
              color: AppColors.slate400,
            ),
          ),
        ],
      ),
    );
  }

  // ── Footer ──

  Widget _buildFooter() {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
      child: Row(
        children: [
          Expanded(
            child: DmbButton(
              text: 'Cancel',
              variant: DmbButtonVariant.outline,
              onPressed: _close,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: DmbButton(
              text: 'Enable Travel Mode',
              icon: Icons.flight,
              isLoading: widget.loading,
              onPressed: _canSubmit ? _handleSubmit : null,
            ),
          ),
        ],
      ),
    );
  }
}
