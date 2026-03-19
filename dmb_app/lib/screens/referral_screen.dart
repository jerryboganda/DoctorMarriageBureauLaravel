import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../theme/app_colors.dart';
import '../theme/app_decorations.dart';
import '../widgets/dmb_card.dart';
import '../widgets/dmb_button.dart';
import '../widgets/dmb_avatar.dart';
import '../widgets/empty_state.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';

class ReferralScreen extends ConsumerStatefulWidget {
  const ReferralScreen({super.key});

  @override
  ConsumerState<ReferralScreen> createState() => _ReferralScreenState();
}

class _ReferralScreenState extends ConsumerState<ReferralScreen> {
  bool _loading = true;
  String _referralCode = '';
  int _totalReferrals = 0;
  double _earnings = 0;
  List<Map<String, dynamic>> _referredUsers = [];
  Map<String, dynamic> _settings = {};
  bool _regenerating = false;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    try {
      final api = ref.read(apiServiceProvider);

      // Load stats and settings in parallel
      final results = await Future.wait([
        api.get('/referral/my-stats'),
        api.get('/referral/settings-public'),
      ]);

      final statsRes = results[0];
      final settingsRes = results[1];

      if (statsRes.statusCode == 200 && statsRes.data != null) {
        final data = Map<String, dynamic>.from(
            statsRes.data is Map ? statsRes.data : {});
        setState(() {
          _referralCode = data['code']?.toString() ?? data['referral_code']?.toString() ?? '';
          _totalReferrals = int.tryParse('${data['total_referrals'] ?? 0}') ?? 0;
          _earnings = double.tryParse('${data['earnings'] ?? 0}') ?? 0;
          _referredUsers = List<Map<String, dynamic>>.from(
              (data['referred_users'] ?? data['referrals'] ?? [])
                  .map((e) => Map<String, dynamic>.from(e)));
        });
      }

      if (settingsRes.statusCode == 200 && settingsRes.data != null) {
        setState(() {
          _settings = Map<String, dynamic>.from(
              settingsRes.data is Map ? settingsRes.data : {});
        });
      }
    } catch (_) {}
    setState(() => _loading = false);
  }

  Future<void> _regenerateCode() async {
    setState(() => _regenerating = true);
    try {
      final api = ref.read(apiServiceProvider);
      final res = await api.post('/referral/regenerate-code');
      if (res.statusCode == 200 && res.data != null) {
        final data = Map<String, dynamic>.from(res.data is Map ? res.data : {});
        setState(() {
          _referralCode = data['code']?.toString() ??
              data['referral_code']?.toString() ?? _referralCode;
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Referral code regenerated!')),
          );
        }
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to regenerate code')),
        );
      }
    }
    setState(() => _regenerating = false);
  }

  void _copyCode() {
    Clipboard.setData(ClipboardData(text: _referralCode));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Referral code copied!')),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    return RefreshIndicator(
      onRefresh: _loadData,
      color: AppColors.primary,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Referral Code Card
          DmbCard(
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    AppColors.primary.withOpacity(0.08),
                    AppColors.primary.withOpacity(0.02),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(AppDecorations.radiusXl),
              ),
              child: Column(
                children: [
                  const Icon(LucideIcons.gift,
                      size: 32, color: AppColors.primary),
                  const SizedBox(height: 12),
                  const Text('Your Referral Code',
                      style: TextStyle(
                          fontSize: 14, color: AppColors.slate500)),
                  const SizedBox(height: 8),
                  GestureDetector(
                    onTap: _copyCode,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 24, vertical: 12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                            color: AppColors.primary.withOpacity(0.3)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            _referralCode.isNotEmpty
                                ? _referralCode
                                : 'No code yet',
                            style: const TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.w800,
                              color: AppColors.primary,
                              letterSpacing: 3,
                            ),
                          ),
                          const SizedBox(width: 12),
                          const Icon(LucideIcons.copy,
                              size: 18, color: AppColors.primary),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      DmbButton(
                        text: 'Share',
                        icon: LucideIcons.share2,
                        isFullWidth: false,
                        height: 36,
                        padding: const EdgeInsets.symmetric(
                            horizontal: 20, vertical: 6),
                        onPressed: () {
                          // Share functionality
                        },
                      ),
                      const SizedBox(width: 12),
                      DmbButton(
                        text: 'Regenerate',
                        icon: LucideIcons.refreshCw,
                        variant: DmbButtonVariant.outline,
                        isFullWidth: false,
                        isLoading: _regenerating,
                        height: 36,
                        padding: const EdgeInsets.symmetric(
                            horizontal: 20, vertical: 6),
                        onPressed: _regenerateCode,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 20),

          // Stats row
          Row(
            children: [
              _statCard('Total Referrals', '$_totalReferrals',
                  LucideIcons.users, AppColors.info),
              const SizedBox(width: 12),
              _statCard('Earnings', 'PKR ${_earnings.toStringAsFixed(0)}',
                  LucideIcons.wallet, AppColors.success),
            ],
          ),

          const SizedBox(height: 12),

          // Reward info
          if (_settings.isNotEmpty)
            DmbCard(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(LucideIcons.sparkles,
                            size: 18, color: Colors.amber),
                        SizedBox(width: 8),
                        Text('Rewards',
                            style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    if (_settings['referrer_reward'] != null)
                      _rewardRow(
                          'You earn',
                          'PKR ${_settings['referrer_reward']} per referral'),
                    if (_settings['referee_reward'] != null)
                      _rewardRow(
                          'Friend gets',
                          'PKR ${_settings['referee_reward']} on signup'),
                    if (_settings['min_referrals_for_bonus'] != null)
                      _rewardRow(
                          'Bonus at',
                          '${_settings['min_referrals_for_bonus']} referrals'),
                  ],
                ),
              ),
            ),

          const SizedBox(height: 24),

          // Referred users list
          const Text('Referred Users',
              style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: AppColors.slate800)),
          const SizedBox(height: 12),

          if (_referredUsers.isEmpty)
            DmbCard(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  children: [
                    const Icon(LucideIcons.userPlus,
                        size: 32, color: AppColors.slate300),
                    const SizedBox(height: 8),
                    const Text('No referrals yet',
                        style: TextStyle(
                            fontSize: 14, color: AppColors.slate500)),
                    const SizedBox(height: 4),
                    const Text('Share your code to start earning!',
                        style: TextStyle(
                            fontSize: 12, color: AppColors.slate400)),
                  ],
                ),
              ),
            )
          else
            ...List.generate(_referredUsers.length, (i) {
              final u = _referredUsers[i];
              return Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: DmbCard(
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Row(
                      children: [
                        DmbAvatar(
                          imageUrl: u['avatar'] ?? u['photo'] ?? '',
                          size: 40,
                          name: u['name'] ?? '',
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(u['name'] ?? 'User',
                                  style: const TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w500)),
                              Text(
                                u['joined_at'] ?? u['created_at'] ?? '',
                                style: const TextStyle(
                                    fontSize: 12,
                                    color: AppColors.slate400),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: (u['status'] == 'active'
                                    ? AppColors.success
                                    : AppColors.warning)
                                .withOpacity(0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            u['status'] ?? 'pending',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: u['status'] == 'active'
                                  ? AppColors.success
                                  : AppColors.warning,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }),
        ],
      ),
    );
  }

  Widget _statCard(
      String label, String value, IconData icon, Color color) {
    return Expanded(
      child: DmbCard(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, size: 20, color: color),
              const SizedBox(height: 8),
              Text(value,
                  style: const TextStyle(
                      fontSize: 20, fontWeight: FontWeight.w700)),
              const SizedBox(height: 2),
              Text(label,
                  style: const TextStyle(
                      fontSize: 12, color: AppColors.slate500)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _rewardRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        children: [
          Text(label,
              style: const TextStyle(
                  fontSize: 13, color: AppColors.slate500)),
          const Spacer(),
          Text(value,
              style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.slate700)),
        ],
      ),
    );
  }
}
