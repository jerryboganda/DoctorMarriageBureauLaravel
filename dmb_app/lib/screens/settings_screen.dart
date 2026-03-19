import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../theme/app_colors.dart';
import '../theme/app_decorations.dart';
import '../widgets/dmb_tab_bar.dart';
import '../widgets/dmb_button.dart';
import '../widgets/dmb_text_field.dart';
import '../widgets/dmb_card.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  int _tabIndex = 0;
  bool _loading = false;
  Map<String, dynamic> _profileSettings = {};
  List<Map<String, dynamic>> _devices = [];
  List<Map<String, dynamic>> _supportTickets = [];
  bool _devicesLoading = false;

  @override
  void initState() {
    super.initState();
    _loadProfileSettings();
  }

  Future<void> _loadProfileSettings() async {
    setState(() => _loading = true);
    try {
      final api = ref.read(apiServiceProvider);
      final res = await api.get('/member/profile-settings');
      if (res.statusCode == 200 && res.data != null) {
        setState(() {
          _profileSettings = Map<String, dynamic>.from(res.data is Map ? res.data : {});
        });
      }
    } catch (_) {}
    setState(() => _loading = false);
  }

  Future<void> _loadDevices() async {
    setState(() => _devicesLoading = true);
    try {
      final api = ref.read(apiServiceProvider);
      final res = await api.get('/member/devices');
      if (res.statusCode == 200 && res.data != null) {
        final list = res.data is List ? res.data : (res.data['data'] ?? []);
        setState(() {
          _devices = List<Map<String, dynamic>>.from(list.map((e) => Map<String, dynamic>.from(e)));
        });
      }
    } catch (_) {}
    setState(() => _devicesLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
          child: DmbTabBar(
            tabs: const ['Account', 'Privacy', 'Safety', 'Billing'],
            selectedIndex: _tabIndex,
            onTabChanged: (i) {
              setState(() => _tabIndex = i);
              if (i == 2 && _devices.isEmpty) _loadDevices();
            },
          ),
        ),
        Expanded(
          child: _loading
              ? const Center(child: CircularProgressIndicator())
              : _buildTab(),
        ),
      ],
    );
  }

  Widget _buildTab() {
    switch (_tabIndex) {
      case 0:
        return _buildAccountTab();
      case 1:
        return _buildPrivacyTab();
      case 2:
        return _buildSafetyTab();
      case 3:
        return _buildBillingTab();
      default:
        return const SizedBox();
    }
  }

  // ──────────── ACCOUNT TAB ────────────
  Widget _buildAccountTab() {
    final user = ref.watch(authProvider).user;
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _sectionTitle('Account Information'),
        const SizedBox(height: 12),
        _infoRow('Email', user?.email ?? 'Not set', LucideIcons.mail),
        _infoRow('Phone', user?.phone ?? 'Not set', LucideIcons.phone),
        _infoRow('Member ID', '${user?.id ?? '-'}', LucideIcons.hash),
        _infoRow('Membership', user?.membership ?? 'Free', LucideIcons.crown),
        const SizedBox(height: 24),
        _sectionTitle('Change Password'),
        const SizedBox(height: 12),
        _ChangePasswordSection(),
        const SizedBox(height: 24),
        _sectionTitle('Language'),
        const SizedBox(height: 12),
        _buildLanguageToggle(),
        const SizedBox(height: 24),
        _sectionTitle('Danger Zone'),
        const SizedBox(height: 12),
        _buildDeactivateSection(),
      ],
    );
  }

  Widget _buildLanguageToggle() {
    return DmbCard(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            const Icon(LucideIcons.globe, size: 20, color: AppColors.slate500),
            const SizedBox(width: 12),
            const Expanded(
              child: Text('App Language',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
            ),
            SegmentedButton<String>(
              segments: const [
                ButtonSegment(value: 'en', label: Text('EN')),
                ButtonSegment(value: 'ur', label: Text('اردو')),
              ],
              selected: const {'en'},
              onSelectionChanged: (val) {
                // Will be wired to locale provider
              },
              style: ButtonStyle(
                visualDensity: VisualDensity.compact,
                textStyle: WidgetStateProperty.all(
                    const TextStyle(fontSize: 12)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDeactivateSection() {
    return DmbCard(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(LucideIcons.alertTriangle,
                    size: 20, color: Colors.amber[700]),
                const SizedBox(width: 8),
                const Text('Deactivate Account',
                    style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: AppColors.slate700)),
              ],
            ),
            const SizedBox(height: 8),
            const Text(
              'Your profile will be hidden from other members. You can reactivate anytime.',
              style: TextStyle(fontSize: 13, color: AppColors.slate500),
            ),
            const SizedBox(height: 12),
            DmbButton(
              text: 'Deactivate Account',
              variant: DmbButtonVariant.outline,
              isFullWidth: false,
              onPressed: () => _showDeactivateDialog(),
            ),
            const SizedBox(height: 16),
            const Divider(),
            const SizedBox(height: 16),
            Row(
              children: [
                const Icon(LucideIcons.trash2,
                    size: 20, color: AppColors.error),
                const SizedBox(width: 8),
                const Text('Delete Account',
                    style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: AppColors.error)),
              ],
            ),
            const SizedBox(height: 8),
            const Text(
              'Permanently delete your account and all data. This cannot be undone.',
              style: TextStyle(fontSize: 13, color: AppColors.slate500),
            ),
            const SizedBox(height: 12),
            DmbButton(
              text: 'Delete Account',
              variant: DmbButtonVariant.danger,
              isFullWidth: false,
              onPressed: () => _showDeleteDialog(),
            ),
          ],
        ),
      ),
    );
  }

  void _showDeactivateDialog() {
    final reasonController = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Deactivate Account'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Please tell us why you want to deactivate:'),
            const SizedBox(height: 12),
            DmbTextField(
              controller: reasonController,
              hint: 'Reason (optional)',
              maxLines: 3,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              final api = ref.read(apiServiceProvider);
              await api.post('/member/deactivate',
                  data: {'reason': reasonController.text});
              if (ctx.mounted) Navigator.pop(ctx);
              ref.read(authProvider.notifier).logout();
            },
            child: const Text('Deactivate',
                style: TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );
  }

  void _showDeleteDialog() {
    final passwordController = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Account'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
                'Enter your password to confirm permanent deletion:'),
            const SizedBox(height: 12),
            DmbTextField(
              controller: passwordController,
              hint: 'Password',
              obscureText: true,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              final api = ref.read(apiServiceProvider);
              await api.post('/member/delete-account',
                  data: {'password': passwordController.text});
              if (ctx.mounted) Navigator.pop(ctx);
              ref.read(authProvider.notifier).logout();
            },
            child: const Text('Delete Forever',
                style: TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );
  }

  // ──────────── PRIVACY TAB ────────────
  Widget _buildPrivacyTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _sectionTitle('Profile Visibility'),
        const SizedBox(height: 12),
        _switchRow('Show Profile in Discovery', _profileSettings['is_visible'] == 1, (v) {
          _updateSetting('is_visible', v ? 1 : 0);
        }),
        _switchRow('Show Online Status', _profileSettings['show_online'] != 0, (v) {
          _updateSetting('show_online', v ? 1 : 0);
        }),
        _switchRow('Allow Profile Views Notification', _profileSettings['profile_view_notify'] != 0, (v) {
          _updateSetting('profile_view_notify', v ? 1 : 0);
        }),
        const SizedBox(height: 24),
        _sectionTitle('Photo Privacy'),
        const SizedBox(height: 12),
        _switchRow('Watermark Photos', _profileSettings['watermark_photos'] == 1, (v) {
          _updateSetting('watermark_photos', v ? 1 : 0);
        }),
        _switchRow('Screenshot Protection', _profileSettings['screenshot_protect'] == 1, (v) {
          _updateSetting('screenshot_protect', v ? 1 : 0);
        }),
        const SizedBox(height: 24),
        _sectionTitle('Blocked & Ignored'),
        const SizedBox(height: 12),
        _actionRow('Blocked Users', LucideIcons.ban, () {
          // Navigate to blocked users
        }),
        _actionRow('Ignore List', LucideIcons.eyeOff, () {
          // Navigate to ignore list
        }),
      ],
    );
  }

  Future<void> _updateSetting(String key, dynamic value) async {
    setState(() {
      _profileSettings[key] = value;
    });
    try {
      final api = ref.read(apiServiceProvider);
      await api.post('/member/profile/visibility',
          data: {'field_name': key, 'is_visible': value});
    } catch (_) {}
  }

  // ──────────── SAFETY TAB ────────────
  Widget _buildSafetyTab() {
    final twoFaEnabled = _profileSettings['two_fa_enabled'] == 1 ||
        _profileSettings['two_factor_enabled'] == true;
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _sectionTitle('Two-Factor Authentication'),
        const SizedBox(height: 12),
        DmbCard(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(LucideIcons.shieldCheck,
                        size: 20,
                        color:
                            twoFaEnabled ? AppColors.success : AppColors.slate400),
                    const SizedBox(width: 8),
                    Text(
                      twoFaEnabled ? '2FA Enabled' : '2FA Disabled',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color:
                            twoFaEnabled ? AppColors.success : AppColors.slate600,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  twoFaEnabled
                      ? 'Your account is protected with two-factor authentication.'
                      : 'Add an extra layer of security to your account.',
                  style:
                      const TextStyle(fontSize: 13, color: AppColors.slate500),
                ),
                const SizedBox(height: 12),
                DmbButton(
                  text: twoFaEnabled ? 'Disable 2FA' : 'Enable 2FA',
                  variant: twoFaEnabled
                      ? DmbButtonVariant.outline
                      : DmbButtonVariant.primary,
                  isFullWidth: false,
                  onPressed: () => _show2FADialog(twoFaEnabled),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 24),
        _sectionTitle('Active Devices'),
        const SizedBox(height: 12),
        if (_devicesLoading)
          const Center(child: CircularProgressIndicator())
        else if (_devices.isEmpty)
          DmbCard(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  const Icon(LucideIcons.smartphone,
                      size: 20, color: AppColors.slate400),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Text('No devices found',
                        style: TextStyle(
                            fontSize: 14, color: AppColors.slate500)),
                  ),
                  TextButton(
                    onPressed: _loadDevices,
                    child: const Text('Refresh'),
                  ),
                ],
              ),
            ),
          )
        else
          ...List.generate(_devices.length, (i) {
            final d = _devices[i];
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: DmbCard(
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    children: [
                      Icon(
                        d['device_type'] == 'mobile'
                            ? LucideIcons.smartphone
                            : LucideIcons.monitor,
                        size: 20,
                        color: AppColors.slate500,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              d['device_name'] ?? d['browser'] ?? 'Unknown',
                              style: const TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w500),
                            ),
                            Text(
                              d['ip_address'] ?? '',
                              style: const TextStyle(
                                  fontSize: 12, color: AppColors.slate500),
                            ),
                          ],
                        ),
                      ),
                      if (d['is_current'] != true)
                        IconButton(
                          icon: const Icon(LucideIcons.x,
                              size: 18, color: AppColors.error),
                          onPressed: () => _removeDevice(d['id']),
                        ),
                    ],
                  ),
                ),
              ),
            );
          }),
        const SizedBox(height: 24),
        _sectionTitle('Support'),
        const SizedBox(height: 12),
        _actionRow('Support Tickets', LucideIcons.lifeBuoy, () {
          _showSupportTicketsSheet();
        }),
      ],
    );
  }

  void _show2FADialog(bool isEnabled) {
    final codeController = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(isEnabled ? 'Disable 2FA' : 'Enable 2FA'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(isEnabled
                ? 'Enter your verification code to disable 2FA:'
                : 'We will send a verification code to your email. Enter it below:'),
            const SizedBox(height: 12),
            DmbTextField(
              controller: codeController,
              hint: 'Verification code',
              keyboardType: TextInputType.number,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              final api = ref.read(apiServiceProvider);
              if (isEnabled) {
                await api.post('/auth/2fa/disable');
              } else {
                await api.post('/auth/2fa/setup', data: {'method': 'email'});
                await api.post('/auth/2fa/verify',
                    data: {'code': codeController.text});
              }
              if (ctx.mounted) Navigator.pop(ctx);
              _loadProfileSettings();
            },
            child: Text(isEnabled ? 'Disable' : 'Verify & Enable'),
          ),
        ],
      ),
    );
  }

  Future<void> _removeDevice(dynamic id) async {
    try {
      final api = ref.read(apiServiceProvider);
      await api.delete('/member/device/$id');
      _loadDevices();
    } catch (_) {}
  }

  void _showSupportTicketsSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius:
            BorderRadius.vertical(top: Radius.circular(AppDecorations.radiusXxl)),
      ),
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.8,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        expand: false,
        builder: (ctx, scrollController) => _SupportTicketsSheet(
          scrollController: scrollController,
          api: ref.read(apiServiceProvider),
        ),
      ),
    );
  }

  // ──────────── BILLING TAB ────────────
  Widget _buildBillingTab() {
    final user = ref.watch(authProvider).user;
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _sectionTitle('Current Plan'),
        const SizedBox(height: 12),
        DmbCard(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(LucideIcons.crown,
                        size: 20,
                        color: user?.membership == 'premium'
                            ? Colors.amber[700]
                            : AppColors.slate400),
                    const SizedBox(width: 8),
                    Text(
                      (user?.membership ?? 'Free').toUpperCase(),
                      style: const TextStyle(
                          fontSize: 16, fontWeight: FontWeight.w700),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  user?.membership == 'premium'
                      ? 'You have full access to all features.'
                      : 'Upgrade to unlock premium features.',
                  style: const TextStyle(
                      fontSize: 13, color: AppColors.slate500),
                ),
                const SizedBox(height: 12),
                if (user?.membership != 'premium')
                  DmbButton(
                    text: 'Upgrade Plan',
                    icon: LucideIcons.sparkles,
                    isFullWidth: false,
                    onPressed: () {
                      // Open subscription modal
                    },
                  ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 24),
        _sectionTitle('Wallet'),
        const SizedBox(height: 12),
        DmbCard(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(LucideIcons.wallet,
                        size: 20, color: AppColors.primary),
                    const SizedBox(width: 8),
                    const Text('Balance',
                        style: TextStyle(
                            fontSize: 14, color: AppColors.slate500)),
                    const Spacer(),
                    Text(
                      'PKR ${_profileSettings['wallet_balance'] ?? '0'}',
                      style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: AppColors.primary),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: DmbButton(
                        text: 'Add Funds',
                        icon: LucideIcons.plus,
                        variant: DmbButtonVariant.outline,
                        onPressed: () {
                          // Open wallet recharge
                        },
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: DmbButton(
                        text: 'History',
                        icon: LucideIcons.history,
                        variant: DmbButtonVariant.ghost,
                        onPressed: () {
                          // Show transaction history
                        },
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 24),
        _sectionTitle('Payment History'),
        const SizedBox(height: 12),
        DmbCard(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                Icon(LucideIcons.receipt, size: 32, color: AppColors.slate300),
                const SizedBox(height: 8),
                const Text('No transactions yet',
                    style: TextStyle(
                        fontSize: 14, color: AppColors.slate500)),
              ],
            ),
          ),
        ),
      ],
    );
  }

  // ──────────── HELPERS ────────────
  Widget _sectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 15,
        fontWeight: FontWeight.w700,
        color: AppColors.slate800,
      ),
    );
  }

  Widget _infoRow(String label, String value, IconData icon) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: DmbCard(
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              Icon(icon, size: 18, color: AppColors.slate400),
              const SizedBox(width: 12),
              Text(label,
                  style: const TextStyle(
                      fontSize: 13, color: AppColors.slate500)),
              const Spacer(),
              Text(value,
                  style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: AppColors.slate700)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _switchRow(String label, bool value, ValueChanged<bool> onChanged) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: DmbCard(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
          child: Row(
            children: [
              Expanded(
                child: Text(label,
                    style: const TextStyle(
                        fontSize: 14, color: AppColors.slate700)),
              ),
              Switch(
                value: value,
                onChanged: onChanged,
                activeColor: AppColors.primary,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _actionRow(String label, IconData icon, VoidCallback onTap) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: DmbCard(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              Icon(icon, size: 18, color: AppColors.slate500),
              const SizedBox(width: 12),
              Expanded(
                child: Text(label,
                    style: const TextStyle(
                        fontSize: 14, color: AppColors.slate700)),
              ),
              const Icon(LucideIcons.chevronRight,
                  size: 18, color: AppColors.slate400),
            ],
          ),
        ),
      ),
    );
  }
}

// ──────────── CHANGE PASSWORD SECTION ────────────
class _ChangePasswordSection extends ConsumerStatefulWidget {
  @override
  ConsumerState<_ChangePasswordSection> createState() =>
      _ChangePasswordSectionState();
}

class _ChangePasswordSectionState
    extends ConsumerState<_ChangePasswordSection> {
  final _currentCtrl = TextEditingController();
  final _newCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();
  bool _saving = false;
  String? _error;
  String? _success;

  @override
  void dispose() {
    _currentCtrl.dispose();
    _newCtrl.dispose();
    _confirmCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_newCtrl.text != _confirmCtrl.text) {
      setState(() => _error = 'Passwords do not match');
      return;
    }
    if (_newCtrl.text.length < 8) {
      setState(() => _error = 'Password must be at least 8 characters');
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
      _success = null;
    });
    try {
      final api = ref.read(apiServiceProvider);
      final res = await api.post('/member/change-password', data: {
        'current_password': _currentCtrl.text,
        'new_password': _newCtrl.text,
        'new_password_confirmation': _confirmCtrl.text,
      });
      if (res.statusCode == 200) {
        _currentCtrl.clear();
        _newCtrl.clear();
        _confirmCtrl.clear();
        setState(() => _success = 'Password changed successfully');
      } else {
        setState(() => _error = res.data?['message'] ?? 'Failed to change password');
      }
    } catch (e) {
      setState(() => _error = 'An error occurred');
    }
    setState(() => _saving = false);
  }

  @override
  Widget build(BuildContext context) {
    return DmbCard(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            DmbTextField(
              controller: _currentCtrl,
              label: 'Current Password',
              hint: 'Enter current password',
              obscureText: true,
            ),
            const SizedBox(height: 12),
            DmbTextField(
              controller: _newCtrl,
              label: 'New Password',
              hint: 'At least 8 characters',
              obscureText: true,
            ),
            const SizedBox(height: 12),
            DmbTextField(
              controller: _confirmCtrl,
              label: 'Confirm New Password',
              hint: 'Re-enter new password',
              obscureText: true,
            ),
            if (_error != null) ...[
              const SizedBox(height: 8),
              Text(_error!,
                  style:
                      const TextStyle(fontSize: 13, color: AppColors.error)),
            ],
            if (_success != null) ...[
              const SizedBox(height: 8),
              Text(_success!,
                  style:
                      const TextStyle(fontSize: 13, color: AppColors.success)),
            ],
            const SizedBox(height: 16),
            DmbButton(
              text: 'Change Password',
              isLoading: _saving,
              isFullWidth: false,
              onPressed: _submit,
            ),
          ],
        ),
      ),
    );
  }
}

// ──────────── SUPPORT TICKETS SHEET ────────────
class _SupportTicketsSheet extends StatefulWidget {
  final ScrollController scrollController;
  final ApiService api;

  const _SupportTicketsSheet({
    required this.scrollController,
    required this.api,
  });

  @override
  State<_SupportTicketsSheet> createState() => _SupportTicketsSheetState();
}

class _SupportTicketsSheetState extends State<_SupportTicketsSheet> {
  List<Map<String, dynamic>> _tickets = [];
  List<Map<String, dynamic>> _categories = [];
  bool _loading = true;
  bool _creating = false;

  @override
  void initState() {
    super.initState();
    _loadTickets();
  }

  Future<void> _loadTickets() async {
    setState(() => _loading = true);
    try {
      final res = await widget.api.get('/member/support-ticket');
      if (res.statusCode == 200) {
        final data = res.data is List ? res.data : (res.data['data'] ?? []);
        setState(() {
          _tickets = List<Map<String, dynamic>>.from(
              data.map((e) => Map<String, dynamic>.from(e)));
        });
      }
    } catch (_) {}
    setState(() => _loading = false);
  }

  Future<void> _loadCategories() async {
    try {
      final res = await widget.api.get('/member/support-ticket/categories');
      if (res.statusCode == 200) {
        final data = res.data is List ? res.data : (res.data['data'] ?? []);
        setState(() {
          _categories = List<Map<String, dynamic>>.from(
              data.map((e) => Map<String, dynamic>.from(e)));
        });
      }
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          margin: const EdgeInsets.only(top: 8),
          width: 40,
          height: 4,
          decoration: BoxDecoration(
            color: AppColors.slate300,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              const Text('Support Tickets',
                  style: TextStyle(
                      fontSize: 18, fontWeight: FontWeight.w700)),
              const Spacer(),
              DmbButton(
                text: 'New Ticket',
                icon: LucideIcons.plus,
                isFullWidth: false,
                height: 36,
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                onPressed: () {
                  // Show create ticket dialog
                },
              ),
            ],
          ),
        ),
        const Divider(height: 1),
        Expanded(
          child: _loading
              ? const Center(child: CircularProgressIndicator())
              : _tickets.isEmpty
                  ? const Center(
                      child: Text('No support tickets',
                          style: TextStyle(color: AppColors.slate500)))
                  : ListView.separated(
                      controller: widget.scrollController,
                      padding: const EdgeInsets.all(16),
                      itemCount: _tickets.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 8),
                      itemBuilder: (ctx, i) {
                        final t = _tickets[i];
                        return DmbCard(
                          child: Padding(
                            padding: const EdgeInsets.all(14),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        t['subject'] ?? 'No subject',
                                        style: const TextStyle(
                                            fontSize: 14,
                                            fontWeight: FontWeight.w600),
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 8, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: _statusColor(
                                                t['status'] ?? 'open')
                                            .withOpacity(0.1),
                                        borderRadius:
                                            BorderRadius.circular(12),
                                      ),
                                      child: Text(
                                        (t['status'] ?? 'open').toString().toUpperCase(),
                                        style: TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.w600,
                                          color: _statusColor(
                                              t['status'] ?? 'open'),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  t['message'] ?? '',
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                      fontSize: 13,
                                      color: AppColors.slate500),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
        ),
      ],
    );
  }

  Color _statusColor(String status) {
    switch (status.toLowerCase()) {
      case 'open':
        return AppColors.info;
      case 'closed':
        return AppColors.slate400;
      case 'resolved':
        return AppColors.success;
      default:
        return AppColors.warning;
    }
  }
}
