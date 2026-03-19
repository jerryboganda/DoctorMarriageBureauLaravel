import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../providers/auth_provider.dart';
import '../theme/app_colors.dart';
import '../theme/app_decorations.dart';
import '../widgets/dmb_button.dart';
import '../widgets/dmb_modal.dart';
import '../widgets/dmb_tab_bar.dart';

// ---------------------------------------------------------------------------
// Show helper — uses showDmbFullModal (95% height)
// ---------------------------------------------------------------------------

Future<void> showSubscriptionModal(
  BuildContext context, {
  required Function(int planId, String planName, double price) onSelectPlan,
  required Function(int addonId, String addonName, double price) onSelectAddon,
}) {
  return showDmbFullModal(
    context: context,
    builder: (_) => SubscriptionModal(
      onSelectPlan: onSelectPlan,
      onSelectAddon: onSelectAddon,
    ),
  );
}

// ---------------------------------------------------------------------------
// Color schemes for plan cards (rotating)
// ---------------------------------------------------------------------------

class _PlanColorScheme {
  final Color accent;
  final Color accentLight;
  final Color accentBg;
  final Color badgeColor;
  final Color badgeBg;

  const _PlanColorScheme({
    required this.accent,
    required this.accentLight,
    required this.accentBg,
    required this.badgeColor,
    required this.badgeBg,
  });
}

const _planColorSchemes = [
  // Emerald
  _PlanColorScheme(
    accent: Color(0xFF059669),
    accentLight: Color(0xFF34D399),
    accentBg: Color(0xFFECFDF5),
    badgeColor: Color(0xFF065F46),
    badgeBg: Color(0xFFD1FAE5),
  ),
  // Slate
  _PlanColorScheme(
    accent: Color(0xFF475569),
    accentLight: Color(0xFF94A3B8),
    accentBg: Color(0xFFF8FAFC),
    badgeColor: Color(0xFF1E293B),
    badgeBg: Color(0xFFE2E8F0),
  ),
  // Purple
  _PlanColorScheme(
    accent: Color(0xFF7C3AED),
    accentLight: Color(0xFFA78BFA),
    accentBg: Color(0xFFF5F3FF),
    badgeColor: Color(0xFF5B21B6),
    badgeBg: Color(0xFFEDE9FE),
  ),
];

// ---------------------------------------------------------------------------
// Widget
// ---------------------------------------------------------------------------

class SubscriptionModal extends ConsumerStatefulWidget {
  final Function(int planId, String planName, double price) onSelectPlan;
  final Function(int addonId, String addonName, double price) onSelectAddon;

  const SubscriptionModal({
    super.key,
    required this.onSelectPlan,
    required this.onSelectAddon,
  });

  @override
  ConsumerState<SubscriptionModal> createState() => _SubscriptionModalState();
}

class _SubscriptionModalState extends ConsumerState<SubscriptionModal> {
  int _activeTab = 0; // 0 = Plans, 1 = Addons

  // Plans state
  List<Map<String, dynamic>> _packages = [];
  bool _packagesLoading = true;
  String? _packagesError;

  // Addons state
  List<Map<String, dynamic>> _addons = [];
  bool _addonsLoading = true;
  String? _addonsError;

  @override
  void initState() {
    super.initState();
    _fetchPackages();
    _fetchAddons();
  }

  // ── API calls ──

  Future<void> _fetchPackages() async {
    setState(() {
      _packagesLoading = true;
      _packagesError = null;
    });

    try {
      final api = ref.read(apiServiceProvider);
      final response = await api.get('/packages');
      final data = response.data;

      List<Map<String, dynamic>> packages = [];
      if (data is Map<String, dynamic>) {
        final list = data['data'] ?? data['packages'] ?? data;
        if (list is List) {
          packages = list
              .whereType<Map<String, dynamic>>()
              .toList();
        }
      } else if (data is List) {
        packages = data.whereType<Map<String, dynamic>>().toList();
      }

      if (mounted) {
        setState(() {
          _packages = packages;
          _packagesLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _packagesError = 'Failed to load plans. Please try again.';
          _packagesLoading = false;
        });
      }
    }
  }

  Future<void> _fetchAddons() async {
    setState(() {
      _addonsLoading = true;
      _addonsError = null;
    });

    try {
      final api = ref.read(apiServiceProvider);
      final response = await api.get('/addons');
      final data = response.data;

      List<Map<String, dynamic>> addons = [];
      if (data is Map<String, dynamic>) {
        final list = data['data'] ?? data['addons'] ?? data;
        if (list is List) {
          addons = list
              .whereType<Map<String, dynamic>>()
              .toList();
        }
      } else if (data is List) {
        addons = data.whereType<Map<String, dynamic>>().toList();
      }

      if (mounted) {
        setState(() {
          _addons = addons;
          _addonsLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _addonsError = 'Failed to load addons. Please try again.';
          _addonsLoading = false;
        });
      }
    }
  }

  void _close() => Navigator.of(context).pop();

  // ── Helpers ──

  String _str(dynamic value, [String fallback = '']) {
    if (value == null) return fallback;
    final s = value.toString().trim();
    return s.isEmpty ? fallback : s;
  }

  double _toDouble(dynamic value) {
    if (value == null) return 0;
    if (value is num) return value.toDouble();
    return double.tryParse(value.toString()) ?? 0;
  }

  /// Determine the "most popular" plan index — highest price
  int _mostPopularIndex() {
    if (_packages.isEmpty) return -1;
    double maxPrice = -1;
    int maxIdx = 0;
    for (int i = 0; i < _packages.length; i++) {
      final price = _toDouble(_packages[i]['price'] ?? _packages[i]['amount']);
      if (price > maxPrice) {
        maxPrice = price;
        maxIdx = i;
      }
    }
    return maxIdx;
  }

  IconData _planIcon(int index) {
    switch (index % 3) {
      case 0:
        return LucideIcons.shield;
      case 1:
        return LucideIcons.crown;
      case 2:
        return LucideIcons.star;
      default:
        return LucideIcons.shield;
    }
  }

  // ── Build ──

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        _buildHeader(),
        Expanded(
          child: _activeTab == 0 ? _buildPlansTab() : _buildAddonsTab(),
        ),
      ],
    );
  }

  // ── Header ──

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 16),
      decoration: const BoxDecoration(
        color: AppColors.white,
        border: Border(bottom: BorderSide(color: AppColors.slate100)),
      ),
      child: Column(
        children: [
          // Title row with close button
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Choose Your Plan',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                        color: AppColors.slate900,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Unlock premium features to find your perfect match',
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
          const SizedBox(height: 16),

          // Tab bar
          DmbTabBar(
            tabs: const ['Plans', 'Addons'],
            selectedIndex: _activeTab,
            onTabChanged: (index) => setState(() => _activeTab = index),
          ),
        ],
      ),
    );
  }

  // ===================================================================
  // PLANS TAB
  // ===================================================================

  Widget _buildPlansTab() {
    if (_packagesLoading) {
      return const Center(
        child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2.5),
      );
    }

    if (_packagesError != null) {
      return _buildErrorState(_packagesError!, _fetchPackages);
    }

    if (_packages.isEmpty) {
      return _buildEmptyState('No plans available at the moment.');
    }

    final popularIdx = _mostPopularIndex();

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _packages.length,
      itemBuilder: (context, index) {
        return _buildPlanCard(
          package: _packages[index],
          index: index,
          isPopular: index == popularIdx,
        );
      },
    );
  }

  Widget _buildPlanCard({
    required Map<String, dynamic> package,
    required int index,
    required bool isPopular,
  }) {
    final scheme = _planColorSchemes[index % _planColorSchemes.length];
    final name = _str(package['name'] ?? package['title'], 'Plan');
    final price = _toDouble(package['price'] ?? package['amount']);
    final validity = _str(package['validity'] ?? package['duration']);
    final id = package['id'] is int
        ? package['id'] as int
        : int.tryParse(package['id']?.toString() ?? '') ?? 0;

    // Extract features
    List<String> features = [];
    final rawFeatures = package['features'] ?? package['feature_list'];
    if (rawFeatures is List) {
      features = rawFeatures.map((f) => f.toString()).take(5).toList();
    } else if (rawFeatures is String && rawFeatures.isNotEmpty) {
      features = rawFeatures.split(',').map((s) => s.trim()).take(5).toList();
    }

    // Determine price label
    final priceLabel = validity.isNotEmpty ? '/$validity' : '/month';

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(AppDecorations.radiusXxl),
        border: Border.all(
          color: isPopular ? scheme.accent : AppColors.slate200,
          width: isPopular ? 2 : 1,
        ),
        boxShadow: isPopular ? AppDecorations.shadowMd : AppDecorations.shadowSm,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Card header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: scheme.accentBg,
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(AppDecorations.radiusXxl),
              ),
            ),
            child: Row(
              children: [
                // Icon
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: AppColors.white,
                    borderRadius: BorderRadius.circular(AppDecorations.radiusXl),
                    boxShadow: AppDecorations.shadowSm,
                  ),
                  child: Icon(_planIcon(index), size: 22, color: scheme.accent),
                ),
                const SizedBox(width: 14),

                // Name + price
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              name,
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: scheme.accent,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          if (isPopular) ...[
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: scheme.badgeBg,
                                borderRadius: BorderRadius.circular(AppDecorations.radiusFull),
                              ),
                              child: Text(
                                'Most Popular',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                  color: scheme.badgeColor,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(height: 2),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.baseline,
                        textBaseline: TextBaseline.alphabetic,
                        children: [
                          Text(
                            'Rs. ${price.toStringAsFixed(0)}',
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.w800,
                              color: AppColors.slate900,
                            ),
                          ),
                          Text(
                            priceLabel,
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.slate500,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Features list
          if (features.isNotEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
              child: Column(
                children: features.map((feature) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(
                          LucideIcons.checkCircle2,
                          size: 16,
                          color: scheme.accent,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            feature,
                            style: const TextStyle(
                              fontSize: 13,
                              color: AppColors.slate600,
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                }).toList(),
              ),
            ),

          // Select button
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
            child: DmbButton(
              text: 'Select Plan',
              icon: LucideIcons.arrowRight,
              onPressed: () {
                _close();
                widget.onSelectPlan(id, name, price);
              },
            ),
          ),
        ],
      ),
    );
  }

  // ===================================================================
  // ADDONS TAB
  // ===================================================================

  Widget _buildAddonsTab() {
    if (_addonsLoading) {
      return const Center(
        child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2.5),
      );
    }

    if (_addonsError != null) {
      return _buildErrorState(_addonsError!, _fetchAddons);
    }

    if (_addons.isEmpty) {
      return _buildEmptyState('No addons available at the moment.');
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _addons.length,
      itemBuilder: (context, index) => _buildAddonCard(_addons[index]),
    );
  }

  Widget _buildAddonCard(Map<String, dynamic> addon) {
    final name = _str(addon['name'] ?? addon['title'], 'Addon');
    final description = _str(addon['description'] ?? addon['details']);
    final price = _toDouble(addon['price'] ?? addon['amount']);
    final id = addon['id'] is int
        ? addon['id'] as int
        : int.tryParse(addon['id']?.toString() ?? '') ?? 0;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(AppDecorations.radiusXl),
        border: Border.all(color: AppColors.slate200),
        boxShadow: AppDecorations.shadowSm,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Icon
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AppColors.primary5,
              borderRadius: BorderRadius.circular(AppDecorations.radiusLg),
            ),
            child: const Icon(LucideIcons.plus, size: 20, color: AppColors.primary),
          ),
          const SizedBox(width: 14),

          // Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.slate900,
                  ),
                ),
                if (description.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    description,
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.slate500,
                      height: 1.4,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Rs. ${price.toStringAsFixed(0)}',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: AppColors.slate900,
                      ),
                    ),
                    DmbButton(
                      text: 'Purchase',
                      isFullWidth: false,
                      height: 36,
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      onPressed: () {
                        _close();
                        widget.onSelectAddon(id, name, price);
                      },
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ===================================================================
  // SHARED STATES
  // ===================================================================

  Widget _buildErrorState(String message, VoidCallback onRetry) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(LucideIcons.alertCircle, size: 48, color: AppColors.error),
            const SizedBox(height: 16),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 14, color: AppColors.slate600),
            ),
            const SizedBox(height: 16),
            DmbButton(
              text: 'Retry',
              isFullWidth: false,
              icon: LucideIcons.refreshCw,
              onPressed: onRetry,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState(String message) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: const BoxDecoration(
                color: AppColors.slate100,
                shape: BoxShape.circle,
              ),
              child: const Icon(LucideIcons.package, size: 32, color: AppColors.slate400),
            ),
            const SizedBox(height: 16),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 14, color: AppColors.slate500),
            ),
          ],
        ),
      ),
    );
  }
}
