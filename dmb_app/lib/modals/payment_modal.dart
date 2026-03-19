import 'dart:async';

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

Future<void> showPaymentModal(
  BuildContext context, {
  required String planName,
  required double amount,
  required int packageId,
  VoidCallback? onClose,
  VoidCallback? onSuccess,
}) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => PaymentModal(
      planName: planName,
      amount: amount,
      packageId: packageId,
      onClose: onClose ?? () => Navigator.of(context).pop(),
      onSuccess: onSuccess ?? () {},
    ),
  );
}

// ---------------------------------------------------------------------------
// Payment method data
// ---------------------------------------------------------------------------

class _PaymentMethod {
  final String key;
  final String name;
  final String description;
  final IconData icon;
  final Color iconColor;
  final Color iconBg;
  final String endpoint;

  const _PaymentMethod({
    required this.key,
    required this.name,
    required this.description,
    required this.icon,
    required this.iconColor,
    required this.iconBg,
    required this.endpoint,
  });
}

const _allMethods = [
  _PaymentMethod(
    key: 'stripe',
    name: 'Stripe',
    description: 'Pay with credit or debit card',
    icon: LucideIcons.creditCard,
    iconColor: Color(0xFF635BFF),
    iconBg: Color(0xFFEEEDFF),
    endpoint: '/payment/stripe/create',
  ),
  _PaymentMethod(
    key: 'razorpay',
    name: 'RazorPay',
    description: 'UPI, cards, net banking & wallets',
    icon: LucideIcons.wallet,
    iconColor: Color(0xFF072654),
    iconBg: Color(0xFFE0EAFF),
    endpoint: '/payment/razorpay/create',
  ),
  _PaymentMethod(
    key: 'phonepe',
    name: 'PhonePe',
    description: 'Pay using PhonePe UPI or wallet',
    icon: LucideIcons.smartphone,
    iconColor: Color(0xFF5F259F),
    iconBg: Color(0xFFF0E6FF),
    endpoint: '/payment/phonepe/create',
  ),
  _PaymentMethod(
    key: 'jazzcash',
    name: 'JazzCash',
    description: 'Pay via JazzCash mobile wallet',
    icon: LucideIcons.banknote,
    iconColor: Color(0xFFE2001A),
    iconBg: Color(0xFFFFE5E8),
    endpoint: '/payment/jazzcash/create',
  ),
  _PaymentMethod(
    key: 'easypaisa',
    name: 'EasyPaisa',
    description: 'Pay via EasyPaisa mobile account',
    icon: LucideIcons.banknote,
    iconColor: Color(0xFF00A651),
    iconBg: Color(0xFFE0FFE8),
    endpoint: '/payment/easypaisa/create',
  ),
  _PaymentMethod(
    key: 'bank_transfer',
    name: 'Bank Transfer',
    description: 'Direct bank transfer or wire',
    icon: LucideIcons.landmark,
    iconColor: Color(0xFF1E3A5F),
    iconBg: Color(0xFFE8EEF4),
    endpoint: '/payment/bank-transfer/create',
  ),
];

// ---------------------------------------------------------------------------
// Widget
// ---------------------------------------------------------------------------

class PaymentModal extends ConsumerStatefulWidget {
  final String planName;
  final double amount;
  final int packageId;
  final VoidCallback onClose;
  final VoidCallback onSuccess;

  const PaymentModal({
    super.key,
    required this.planName,
    required this.amount,
    required this.packageId,
    required this.onClose,
    required this.onSuccess,
  });

  @override
  ConsumerState<PaymentModal> createState() => _PaymentModalState();
}

class _PaymentModalState extends ConsumerState<PaymentModal>
    with SingleTickerProviderStateMixin {
  String? _selectedMethod;
  bool _processing = false;
  bool _success = false;
  String? _error;

  // Available methods (fetched from API)
  List<_PaymentMethod> _availableMethods = [];
  bool _loadingMethods = true;

  // Success animation
  late AnimationController _successAnimCtrl;
  late Animation<double> _successScaleAnim;

  @override
  void initState() {
    super.initState();
    _fetchPaymentTypes();

    _successAnimCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );
    _successScaleAnim = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _successAnimCtrl, curve: Curves.elasticOut),
    );
  }

  @override
  void dispose() {
    _successAnimCtrl.dispose();
    super.dispose();
  }

  Future<void> _fetchPaymentTypes() async {
    try {
      final api = ref.read(apiServiceProvider);
      final res = await api.get('/payment-types');
      final data = res.data;

      if (data is Map<String, dynamic>) {
        final types = data['data'] as List<dynamic>? ?? [];
        final enabledKeys = types
            .map((t) => t is Map<String, dynamic> ? t['key']?.toString() : t.toString())
            .where((k) => k != null)
            .cast<String>()
            .toSet();

        if (enabledKeys.isNotEmpty) {
          _availableMethods = _allMethods
              .where((m) => enabledKeys.contains(m.key))
              .toList();
        } else {
          // If API returns empty data, show all methods
          _availableMethods = List.from(_allMethods);
        }
      } else {
        _availableMethods = List.from(_allMethods);
      }
    } catch (_) {
      // Fallback: show all methods
      _availableMethods = List.from(_allMethods);
    } finally {
      if (mounted) setState(() => _loadingMethods = false);
    }
  }

  _PaymentMethod? get _selectedMethodObj {
    if (_selectedMethod == null) return null;
    return _availableMethods
        .cast<_PaymentMethod?>()
        .firstWhere((m) => m?.key == _selectedMethod, orElse: () => null);
  }

  Future<void> _handlePayNow() async {
    final method = _selectedMethodObj;
    if (method == null || _processing) return;

    setState(() {
      _processing = true;
      _error = null;
    });

    try {
      final api = ref.read(apiServiceProvider);
      final res = await api.post(method.endpoint, data: {
        'package_id': widget.packageId,
        'amount': widget.amount,
        'payment_method': method.key,
      });

      final resData = res.data is Map<String, dynamic>
          ? res.data as Map<String, dynamic>
          : <String, dynamic>{};

      if (resData['result'] == true || resData['success'] == true) {
        setState(() => _success = true);
        _successAnimCtrl.forward();

        // Delay then call onSuccess
        Future.delayed(const Duration(seconds: 2), () {
          if (mounted) {
            widget.onSuccess();
            widget.onClose();
          }
        });
      } else {
        setState(() {
          _error = resData['message']?.toString() ??
              'Payment could not be processed. Please try again.';
        });
      }
    } catch (e) {
      String message = 'Payment failed. Please try again.';
      try {
        final dynamic err = e;
        final data = err.response?.data;
        if (data is Map<String, dynamic> && data['message'] != null) {
          message = data['message'].toString();
        }
      } catch (_) {}
      if (mounted) setState(() => _error = message);
    } finally {
      if (mounted && !_success) setState(() => _processing = false);
    }
  }

  void _close() => widget.onClose();

  @override
  Widget build(BuildContext context) {
    final height = MediaQuery.of(context).size.height * 0.9;

    return Container(
      height: height,
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: const BorderRadius.vertical(
          top: Radius.circular(AppDecorations.radiusXxl),
        ),
      ),
      child: Stack(
        children: [
          Column(
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
                child: _loadingMethods
                    ? _buildLoadingState()
                    : SingleChildScrollView(
                        padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildMethodList(),
                            const SizedBox(height: 20),
                            _buildOrderSummary(),
                            if (_error != null) ...[
                              const SizedBox(height: 16),
                              _buildErrorBanner(),
                            ],
                          ],
                        ),
                      ),
              ),

              // Footer
              _buildFooter(),
            ],
          ),

          // Processing overlay
          if (_processing && !_success) _buildProcessingOverlay(),

          // Success overlay
          if (_success) _buildSuccessOverlay(),
        ],
      ),
    );
  }

  // ── Header ──

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: AppColors.slate100)),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AppColors.primary10,
              borderRadius: BorderRadius.circular(AppDecorations.radiusLg),
            ),
            child: const Icon(
              LucideIcons.creditCard,
              size: 20,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Complete Payment',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppColors.slate900,
                  ),
                ),
                Text(
                  '${widget.planName} Plan',
                  style: const TextStyle(fontSize: 12, color: AppColors.slate500),
                ),
              ],
            ),
          ),
          // Amount badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: AppColors.primary10,
              borderRadius: BorderRadius.circular(AppDecorations.radiusFull),
            ),
            child: Text(
              _formatCurrency(widget.amount),
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: AppColors.primary,
              ),
            ),
          ),
          const SizedBox(width: 8),
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

  // ── Loading state ──

  Widget _buildLoadingState() {
    return const Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2.5),
          SizedBox(height: 16),
          Text(
            'Loading payment methods...',
            style: TextStyle(fontSize: 14, color: AppColors.slate500),
          ),
        ],
      ),
    );
  }

  // ── Method list ──

  Widget _buildMethodList() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Select Payment Method',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            color: AppColors.slate900,
          ),
        ),
        const SizedBox(height: 4),
        const Text(
          'Choose how you would like to pay.',
          style: TextStyle(fontSize: 13, color: AppColors.slate500),
        ),
        const SizedBox(height: 14),

        ...List.generate(_availableMethods.length, (i) {
          final method = _availableMethods[i];
          final isSelected = _selectedMethod == method.key;

          return Padding(
            padding: EdgeInsets.only(
              bottom: i < _availableMethods.length - 1 ? 10 : 0,
            ),
            child: GestureDetector(
              onTap: () => setState(() => _selectedMethod = method.key),
              child: Container(
                padding: const EdgeInsets.all(14),
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
                    // Icon
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: method.iconBg,
                        borderRadius:
                            BorderRadius.circular(AppDecorations.radiusLg),
                      ),
                      child: Icon(
                        method.icon,
                        size: 22,
                        color: method.iconColor,
                      ),
                    ),
                    const SizedBox(width: 14),

                    // Name + description
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            method.name,
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: isSelected
                                  ? AppColors.slate900
                                  : AppColors.slate700,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            method.description,
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.slate500,
                            ),
                          ),
                        ],
                      ),
                    ),

                    // Radio
                    Container(
                      width: 22,
                      height: 22,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: isSelected ? AppColors.primary : AppColors.slate300,
                          width: 2,
                        ),
                      ),
                      child: isSelected
                          ? Center(
                              child: Container(
                                width: 12,
                                height: 12,
                                decoration: const BoxDecoration(
                                  color: AppColors.primary,
                                  shape: BoxShape.circle,
                                ),
                              ),
                            )
                          : null,
                    ),
                  ],
                ),
              ),
            ),
          );
        }),
      ],
    );
  }

  // ── Order summary ──

  Widget _buildOrderSummary() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.slate50,
        borderRadius: BorderRadius.circular(AppDecorations.radiusXl),
        border: Border.all(color: AppColors.slate200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Order Summary',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: AppColors.slate900,
            ),
          ),
          const SizedBox(height: 12),

          // Plan name
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                widget.planName,
                style: const TextStyle(
                  fontSize: 13,
                  color: AppColors.slate600,
                ),
              ),
              Text(
                _formatCurrency(widget.amount),
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.slate700,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),

          const Divider(color: AppColors.slate200),
          const SizedBox(height: 8),

          // Total
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Total',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: AppColors.slate900,
                ),
              ),
              Text(
                _formatCurrency(widget.amount),
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: AppColors.primary,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ── Error banner ──

  Widget _buildErrorBanner() {
    return Container(
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
    );
  }

  // ── Footer ──

  Widget _buildFooter() {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
      decoration: const BoxDecoration(
        color: AppColors.slate50,
        border: Border(top: BorderSide(color: AppColors.slate100)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Secure payment note
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: const [
              Icon(LucideIcons.lock, size: 12, color: AppColors.slate400),
              SizedBox(width: 6),
              Text(
                'Secure payment powered by SSL encryption',
                style: TextStyle(
                  fontSize: 11,
                  color: AppColors.slate400,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          DmbButton(
            text: _processing ? 'Processing...' : 'Pay Now',
            icon: _processing ? null : LucideIcons.arrowRight,
            isLoading: _processing,
            onPressed: (_selectedMethod != null && !_processing)
                ? _handlePayNow
                : null,
          ),
        ],
      ),
    );
  }

  // ── Processing overlay ──

  Widget _buildProcessingOverlay() {
    return Positioned.fill(
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.white.withValues(alpha: 0.9),
          borderRadius: const BorderRadius.vertical(
            top: Radius.circular(AppDecorations.radiusXxl),
          ),
        ),
        child: const Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              SizedBox(
                width: 48,
                height: 48,
                child: CircularProgressIndicator(
                  color: AppColors.primary,
                  strokeWidth: 3,
                ),
              ),
              SizedBox(height: 20),
              Text(
                'Processing Payment...',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: AppColors.slate900,
                ),
              ),
              SizedBox(height: 8),
              Text(
                'Please do not close this screen',
                style: TextStyle(fontSize: 13, color: AppColors.slate500),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ── Success overlay ──

  Widget _buildSuccessOverlay() {
    return Positioned.fill(
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.white.withValues(alpha: 0.95),
          borderRadius: const BorderRadius.vertical(
            top: Radius.circular(AppDecorations.radiusXxl),
          ),
        ),
        child: Center(
          child: AnimatedBuilder(
            animation: _successScaleAnim,
            builder: (_, child) => Transform.scale(
              scale: _successScaleAnim.value,
              child: child,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 80,
                  height: 80,
                  decoration: const BoxDecoration(
                    color: Color(0xFFDCFCE7), // green-100
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    LucideIcons.check,
                    size: 40,
                    color: AppColors.success,
                  ),
                ),
                const SizedBox(height: 20),
                const Text(
                  'Payment Successful!',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: AppColors.slate900,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  '${widget.planName} plan activated',
                  style: const TextStyle(
                    fontSize: 14,
                    color: AppColors.slate500,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  _formatCurrency(widget.amount),
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: AppColors.primary,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // ── Helpers ──

  String _formatCurrency(double amount) {
    if (amount == amount.roundToDouble()) {
      return 'Rs. ${amount.toInt()}';
    }
    return 'Rs. ${amount.toStringAsFixed(2)}';
  }
}
