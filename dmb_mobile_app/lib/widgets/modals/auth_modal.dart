import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/auth_provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/constants/app_constants.dart';

/// Auth step enumeration matching React AuthModal steps
enum AuthStep { role, input, otp, magicLink, password, mfa }

/// User role for login
enum UserRole { candidate, guardian, agent }

/// Auth method type
enum AuthMethod { phone, email }

/// AuthModal - Transpiled from AuthModal.tsx
/// Secure multi-step authentication modal supporting:
/// - Multi-actor role selection (candidate, guardian, agent)
/// - Phone/Email input with regional support
/// - OTP verification with rate limiting
/// - Magic link for email
/// - Password fallback
/// - MFA when risk detected
class AuthModal extends ConsumerStatefulWidget {
  final VoidCallback onClose;
  final VoidCallback? onLogin;

  const AuthModal({
    super.key,
    required this.onClose,
    this.onLogin,
  });

  @override
  ConsumerState<AuthModal> createState() => _AuthModalState();
}

class _AuthModalState extends ConsumerState<AuthModal> {
  AuthStep _step = AuthStep.role;
  UserRole _role = UserRole.candidate;
  AuthMethod _method = AuthMethod.phone;
  String _identifier = '';
  List<String> _otp = List.filled(6, '');
  bool _showPassword = false;
  String? _error;
  int _rateLimitTimer = 0;
  int _failedAttempts = 0;
  bool _isLocked = false;
  bool _trustDevice = false;
  bool _showOtpHelp = false;
  Timer? _timer;

  final List<TextEditingController> _otpControllers = List.generate(
    6,
    (_) => TextEditingController(),
  );
  final List<FocusNode> _otpFocusNodes = List.generate(6, (_) => FocusNode());
  final TextEditingController _identifierController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();

  @override
  void dispose() {
    _timer?.cancel();
    for (final controller in _otpControllers) {
      controller.dispose();
    }
    for (final node in _otpFocusNodes) {
      node.dispose();
    }
    _identifierController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _startRateLimitTimer() {
    _timer?.cancel();
    setState(() => _rateLimitTimer = 30);
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_rateLimitTimer <= 0) {
        timer.cancel();
      } else {
        setState(() => _rateLimitTimer--);
      }
    });
  }

  void _handleIdentifierSubmit() {
    final identifier = _identifierController.text.trim();
    if (_method == AuthMethod.phone) {
      if (identifier.length < 10) {
        setState(() => _error = 'Please enter a valid 10-digit mobile number');
        return;
      }
      setState(() {
        _error = null;
        _failedAttempts = 0;
        _isLocked = false;
        _otp = List.filled(6, '');
        for (final c in _otpControllers) {
          c.clear();
        }
        _showOtpHelp = false;
        _identifier = identifier;
        _step = AuthStep.otp;
      });
      _startRateLimitTimer();
    } else {
      // Email flow
      if (!identifier.contains('@')) {
        setState(() => _error = 'Please enter a valid email address');
        return;
      }
      setState(() {
        _error = null;
        _identifier = identifier;
        _step = AuthStep.magicLink;
      });
    }
  }

  void _handleLogin() {
    if (_isLocked) return;

    final code = _otp.join();
    if (code.length != 6) {
      setState(() => _error = 'Please enter the 6-digit code.');
      return;
    }

    // Simulate wrong code for testing (000000)
    if (code == '000000') {
      final newAttempts = _failedAttempts + 1;
      setState(() {
        _failedAttempts = newAttempts;
        if (newAttempts >= 3) {
          _isLocked = true;
          _error = 'Security Lockout: Too many failed attempts.';
        } else {
          _error = 'Incorrect code. ${3 - newAttempts} attempts remaining.';
          _otp = List.filled(6, '');
          for (final c in _otpControllers) {
            c.clear();
          }
        }
      });
      _otpFocusNodes[0].requestFocus();
      return;
    }

    // Successful login
    ref.read(authProvider.notifier).signIn(
          email: _identifier,
          password: 'otp-verified',
        );
    widget.onLogin?.call();
    widget.onClose();
  }

  void _handlePasswordLogin() {
    final password = _passwordController.text;
    if (password.isEmpty) {
      setState(() => _error = 'Please enter password');
      return;
    }

    // Simulate MFA trigger (password = 'risk')
    if (password.toLowerCase() == 'risk') {
      setState(() {
        _step = AuthStep.mfa;
        _error = null;
        _otp = List.filled(6, '');
        for (final c in _otpControllers) {
          c.clear();
        }
        _showOtpHelp = false;
      });
      _startRateLimitTimer();
      return;
    }

    ref.read(authProvider.notifier).signIn(
          email: _identifier,
          password: _passwordController.text,
        );
    widget.onLogin?.call();
    widget.onClose();
  }

  String _getMaskedIdentifier() {
    if (_method == AuthMethod.email) {
      final parts = _identifier.split('@');
      if (parts.length != 2) return _identifier;
      final name = parts[0];
      final domain = parts[1];
      final masked = name.length > 2 ? '${name.substring(0, 2)}••••••' : name;
      return '$masked@$domain';
    }
    if (_identifier.length >= 2) {
      return '+91 ••••• ••${_identifier.substring(_identifier.length - 2)}';
    }
    return '+91 •••••';
  }

  String get _roleLabel {
    switch (_role) {
      case UserRole.agent:
        return 'Matchmaker';
      case UserRole.guardian:
        return 'Guardian';
      case UserRole.candidate:
        return 'Candidate';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      insetPadding: const EdgeInsets.all(AppSpacing.md),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        constraints: const BoxConstraints(maxWidth: 400),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _buildHeader(),
            Flexible(child: SingleChildScrollView(child: _buildContent())),
            _buildFooter(),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: AppColors.surfaceVariant,
        border: Border(
          bottom: BorderSide(color: AppColors.divider, width: 1),
        ),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
      ),
      child: Stack(
        children: [
          Center(
            child: Column(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: AppColors.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: Icon(
                    Icons.shield_outlined,
                    color: AppColors.primary,
                    size: 28,
                  ),
                ),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  'Secure Login',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: AppSpacing.xxs),
                Text(
                  'Trusted Matrimony for Medical Professionals',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                ),
              ],
            ),
          ),
          Positioned(
            top: 0,
            right: 0,
            child: IconButton(
              icon: const Icon(Icons.close),
              onPressed: widget.onClose,
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContent() {
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: AnimatedSwitcher(
        duration: const Duration(milliseconds: 200),
        child: _buildStepContent(),
      ),
    );
  }

  Widget _buildStepContent() {
    switch (_step) {
      case AuthStep.role:
        return _buildRoleStep();
      case AuthStep.input:
        return _buildInputStep();
      case AuthStep.otp:
      case AuthStep.mfa:
        return _buildOtpStep();
      case AuthStep.magicLink:
        return _buildMagicLinkStep();
      case AuthStep.password:
        return _buildPasswordStep();
    }
  }

  Widget _buildRoleStep() {
    return Column(
      key: const ValueKey('role'),
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Who is logging in?',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: AppSpacing.xxs),
        Text(
          'We customize security based on your role.',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: AppColors.textSecondary,
              ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: AppSpacing.lg),
        _RoleButton(
          icon: Icons.person_outline,
          title: 'Candidate',
          description: 'I am the doctor looking for a match',
          onTap: () => setState(() {
            _role = UserRole.candidate;
            _step = AuthStep.input;
          }),
        ),
        const SizedBox(height: AppSpacing.sm),
        _RoleButton(
          icon: Icons.people_outline,
          title: 'Parent / Guardian',
          description: 'I am managing a profile for my child',
          onTap: () => setState(() {
            _role = UserRole.guardian;
            _step = AuthStep.input;
          }),
        ),
        const SizedBox(height: AppSpacing.sm),
        _RoleButton(
          icon: Icons.work_outline,
          title: 'Matchmaker / Agent',
          description: 'I manage multiple profiles',
          onTap: () => setState(() {
            _role = UserRole.agent;
            _step = AuthStep.input;
          }),
        ),
      ],
    );
  }

  Widget _buildInputStep() {
    return Column(
      key: const ValueKey('input'),
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            IconButton(
              icon: const Icon(Icons.chevron_left),
              onPressed: () => setState(() => _step = AuthStep.role),
            ),
            Expanded(
              child: Text(
                'Login as $_roleLabel',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: AppColors.textSecondary,
                      letterSpacing: 1.2,
                    ),
                textAlign: TextAlign.center,
              ),
            ),
            const SizedBox(width: 48), // Balance the back button
          ],
        ),
        const SizedBox(height: AppSpacing.md),
        // Method toggle
        Container(
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(
            color: AppColors.surfaceVariant,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            children: [
              Expanded(
                child: _MethodToggleButton(
                  icon: Icons.phone_android,
                  label: 'Mobile',
                  isSelected: _method == AuthMethod.phone,
                  onTap: () => setState(() {
                    _method = AuthMethod.phone;
                    _error = null;
                  }),
                ),
              ),
              Expanded(
                child: _MethodToggleButton(
                  icon: Icons.email_outlined,
                  label: 'Email',
                  isSelected: _method == AuthMethod.email,
                  onTap: () => setState(() {
                    _method = AuthMethod.email;
                    _error = null;
                  }),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.lg),
        // Identifier input
        Text(
          _method == AuthMethod.phone ? 'Mobile Number' : 'Email Address',
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        const SizedBox(height: AppSpacing.xs),
        _buildIdentifierInput(),
        if (_error != null) ...[
          const SizedBox(height: AppSpacing.xs),
          Row(
            children: [
              Icon(Icons.error_outline, color: AppColors.error, size: 14),
              const SizedBox(width: AppSpacing.xxs),
              Expanded(
                child: Text(
                  _error!,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.error,
                        fontWeight: FontWeight.bold,
                      ),
                ),
              ),
            ],
          ),
        ],
        const SizedBox(height: AppSpacing.xs),
        Row(
          children: [
            Icon(Icons.lock_outline, size: 10, color: AppColors.textTertiary),
            const SizedBox(width: AppSpacing.xxs),
            Flexible(
              child: Text(
                'Your details stay private. We never post to social media.',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: AppColors.textTertiary,
                      fontSize: 10,
                    ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.md),
        Container(
          padding: const EdgeInsets.all(AppSpacing.sm),
          decoration: BoxDecoration(
            color: AppColors.surfaceVariant,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: AppColors.divider),
          ),
          child: Row(
            children: [
              Icon(Icons.info_outline,
                  size: 14, color: AppColors.textSecondary),
              const SizedBox(width: AppSpacing.xs),
              Expanded(
                child: Text(
                  _method == AuthMethod.phone
                      ? "If this number is registered, we'll send a code via SMS."
                      : "We'll send a secure login link to this email address.",
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: AppColors.textSecondary,
                        fontSize: 10,
                      ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.lg),
        FilledButton(
          onPressed: _identifierController.text.isEmpty || _rateLimitTimer > 0
              ? null
              : _handleIdentifierSubmit,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                _rateLimitTimer > 0
                    ? 'Try again in ${_rateLimitTimer}s'
                    : _method == AuthMethod.phone
                        ? 'Send Code'
                        : 'Continue',
              ),
              if (_rateLimitTimer == 0) ...[
                const SizedBox(width: AppSpacing.xs),
                const Icon(Icons.arrow_forward, size: 16),
              ],
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.sm),
        TextButton(
          onPressed: () => setState(() {
            _method = _method == AuthMethod.phone
                ? AuthMethod.email
                : AuthMethod.phone;
            _identifierController.clear();
            _error = null;
          }),
          child: Text(
            'Use ${_method == AuthMethod.phone ? 'email' : 'phone number'} instead',
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: AppColors.textSecondary,
                ),
          ),
        ),
      ],
    );
  }

  Widget _buildIdentifierInput() {
    return Container(
      decoration: BoxDecoration(
        border: Border.all(
          color: _error != null ? AppColors.error : AppColors.divider,
        ),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          if (_method == AuthMethod.phone)
            Container(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.sm,
                vertical: AppSpacing.md,
              ),
              decoration: BoxDecoration(
                color: AppColors.surfaceVariant,
                border: Border(
                  right: BorderSide(color: AppColors.divider),
                ),
                borderRadius: const BorderRadius.horizontal(
                  left: Radius.circular(12),
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Image.network(
                    'https://flagcdn.com/w20/in.png',
                    width: 20,
                    height: 14,
                    errorBuilder: (_, __, ___) => const SizedBox(width: 20),
                  ),
                  const SizedBox(width: AppSpacing.xs),
                  Text(
                    '+91',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w500,
                          color: AppColors.textSecondary,
                        ),
                  ),
                ],
              ),
            ),
          Expanded(
            child: TextField(
              controller: _identifierController,
              keyboardType: _method == AuthMethod.phone
                  ? TextInputType.phone
                  : TextInputType.emailAddress,
              inputFormatters: _method == AuthMethod.phone
                  ? [FilteringTextInputFormatter.digitsOnly]
                  : null,
              decoration: InputDecoration(
                hintText: _method == AuthMethod.phone
                    ? '98765 XXXXX'
                    : 'doctor@example.com',
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.md,
                  vertical: AppSpacing.md,
                ),
              ),
              onChanged: (_) => setState(() => _error = null),
              onSubmitted: (_) => _handleIdentifierSubmit(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOtpStep() {
    final isMfa = _step == AuthStep.mfa;
    return Column(
      key: ValueKey(_step),
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (isMfa) ...[
          Container(
            width: 48,
            height: 48,
            margin: const EdgeInsets.only(bottom: AppSpacing.sm),
            decoration: BoxDecoration(
              color: Colors.orange.withOpacity(0.1),
              borderRadius: BorderRadius.circular(24),
            ),
            child: const Icon(
              Icons.shield,
              color: Colors.orange,
              size: 24,
            ),
          ),
          Text(
            'Security Check',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: AppSpacing.xxs),
          Text(
            'Unusual activity detected. Verify it\'s you.',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.textSecondary,
                ),
            textAlign: TextAlign.center,
          ),
        ] else ...[
          Text(
            'Verify it\'s you',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: AppSpacing.xxs),
          Text(
            'Code sent to ${_getMaskedIdentifier()}',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.textSecondary,
                ),
            textAlign: TextAlign.center,
          ),
        ],
        const SizedBox(height: AppSpacing.lg),
        if (_isLocked)
          _buildLockedState()
        else ...[
          _buildOtpInputRow(),
          if (_error != null) ...[
            const SizedBox(height: AppSpacing.sm),
            Container(
              padding: const EdgeInsets.all(AppSpacing.sm),
              decoration: BoxDecoration(
                color: AppColors.error.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: AppColors.error.withOpacity(0.2),
                ),
              ),
              child: Row(
                children: [
                  Icon(Icons.error_outline, color: AppColors.error, size: 16),
                  const SizedBox(width: AppSpacing.xs),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _error!,
                          style:
                              Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: AppColors.error,
                                    fontWeight: FontWeight.bold,
                                  ),
                        ),
                        if (_failedAttempts >= 2)
                          TextButton(
                            onPressed: () =>
                                setState(() => _step = AuthStep.input),
                            style: TextButton.styleFrom(
                              padding: EdgeInsets.zero,
                              minimumSize: Size.zero,
                              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                            ),
                            child: Text(
                              'Change Method',
                              style: Theme.of(context)
                                  .textTheme
                                  .labelSmall
                                  ?.copyWith(
                                    color: AppColors.error,
                                    fontWeight: FontWeight.bold,
                                    decoration: TextDecoration.underline,
                                  ),
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
          if (!isMfa) ...[
            const SizedBox(height: AppSpacing.md),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Checkbox(
                  value: _trustDevice,
                  onChanged: (value) =>
                      setState(() => _trustDevice = value ?? false),
                  visualDensity: VisualDensity.compact,
                ),
                Text(
                  'Trust this device',
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: AppColors.textSecondary,
                      ),
                ),
                const SizedBox(width: AppSpacing.xxs),
                Icon(
                  Icons.computer,
                  size: 12,
                  color: AppColors.textTertiary,
                ),
              ],
            ),
          ],
          const SizedBox(height: AppSpacing.md),
          FilledButton(
            onPressed: _handleLogin,
            style: FilledButton.styleFrom(
              backgroundColor:
                  isMfa ? AppColors.textPrimary : AppColors.primary,
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.lock_outline, size: 16),
                const SizedBox(width: AppSpacing.xs),
                Text(isMfa ? 'Verify & Continue' : 'Continue'),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          TextButton.icon(
            onPressed: _rateLimitTimer > 0
                ? null
                : () {
                    _startRateLimitTimer();
                    setState(() {
                      _otp = List.filled(6, '');
                      for (final c in _otpControllers) {
                        c.clear();
                      }
                      _showOtpHelp = true;
                    });
                  },
            icon: const Icon(Icons.access_time, size: 14),
            label: Text(
              _rateLimitTimer > 0
                  ? 'Resend available in ${_rateLimitTimer}s'
                  : 'Resend Code',
            ),
          ),
          if (_showOtpHelp || _rateLimitTimer > 0) ...[
            const SizedBox(height: AppSpacing.sm),
            Container(
              padding: const EdgeInsets.all(AppSpacing.md),
              decoration: BoxDecoration(
                color: AppColors.surfaceVariant,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppColors.divider),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.help_outline,
                          size: 14, color: AppColors.textSecondary),
                      const SizedBox(width: AppSpacing.xs),
                      Text(
                        'Trouble receiving code?',
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  _buildHelpItem(
                      Icons.signal_cellular_alt, 'Check your signal strength'),
                  if (_method == AuthMethod.email)
                    _buildHelpItem(
                        Icons.mark_email_read, 'Check your spam folder'),
                  _buildHelpItem(
                      Icons.access_time, 'Wait 30 seconds before resending'),
                ],
              ),
            ),
          ],
          const SizedBox(height: AppSpacing.sm),
          TextButton(
            onPressed: () => setState(() => _step = AuthStep.input),
            child: Text(
              'Change Number',
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: AppColors.textTertiary,
                  ),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildHelpItem(IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.xs),
      child: Row(
        children: [
          Icon(icon, size: 12, color: AppColors.textTertiary),
          const SizedBox(width: AppSpacing.xs),
          Text(
            text,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: AppColors.textSecondary,
                ),
          ),
        ],
      ),
    );
  }

  Widget _buildLockedState() {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.error.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.error.withOpacity(0.2)),
      ),
      child: Column(
        children: [
          Icon(Icons.shield, color: AppColors.error, size: 32),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'Account Locked',
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: AppColors.error,
                ),
          ),
          const SizedBox(height: AppSpacing.xxs),
          Text(
            'Too many attempts. Try again later.',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.error,
                ),
          ),
          const SizedBox(height: AppSpacing.sm),
          TextButton(
            onPressed: () {
              // TODO: Navigate to support
            },
            child: Text(
              'Contact Support',
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: AppColors.textSecondary,
                    decoration: TextDecoration.underline,
                  ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOtpInputRow() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(6, (index) {
        return Container(
          width: 48,
          height: 48,
          margin: EdgeInsets.only(right: index < 5 ? AppSpacing.xs : 0),
          child: TextField(
            controller: _otpControllers[index],
            focusNode: _otpFocusNodes[index],
            textAlign: TextAlign.center,
            keyboardType: TextInputType.number,
            inputFormatters: [
              FilteringTextInputFormatter.digitsOnly,
              LengthLimitingTextInputFormatter(1),
            ],
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
            decoration: InputDecoration(
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
              ),
              contentPadding: EdgeInsets.zero,
            ),
            onChanged: (value) {
              setState(() {
                _otp[index] = value;
                _error = null;
              });
              if (value.isNotEmpty && index < 5) {
                _otpFocusNodes[index + 1].requestFocus();
              }
            },
            onTap: () => _otpControllers[index].selection = TextSelection(
              baseOffset: 0,
              extentOffset: _otpControllers[index].text.length,
            ),
          ),
        );
      }),
    );
  }

  Widget _buildMagicLinkStep() {
    return Column(
      key: const ValueKey('magic-link'),
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Stack(
          children: [
            Positioned(
              left: 0,
              child: IconButton(
                icon: const Icon(Icons.chevron_left),
                onPressed: () => setState(() => _step = AuthStep.input),
              ),
            ),
            Center(
              child: Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: Colors.blue.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(40),
                ),
                child: const Icon(Icons.auto_awesome,
                    color: Colors.blue, size: 32),
              ),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.md),
        Text(
          'Check your inbox',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: AppSpacing.xs),
        RichText(
          textAlign: TextAlign.center,
          text: TextSpan(
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textSecondary,
                ),
            children: [
              const TextSpan(text: 'We sent a magic link to '),
              TextSpan(
                text: _identifier,
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              const TextSpan(text: '.'),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.lg),
        FilledButton(
          onPressed: () {
            // TODO: Open email app
          },
          child: const Text('Open Email App'),
        ),
        const SizedBox(height: AppSpacing.sm),
        OutlinedButton.icon(
          onPressed: () => setState(() => _step = AuthStep.password),
          icon: const Icon(Icons.key, size: 16),
          label: const Text('Use Password'),
        ),
      ],
    );
  }

  Widget _buildPasswordStep() {
    return Column(
      key: const ValueKey('password'),
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Align(
          alignment: Alignment.centerLeft,
          child: TextButton.icon(
            onPressed: () => setState(() => _step = AuthStep.magicLink),
            icon: const Icon(Icons.chevron_left, size: 16),
            label: const Text('Back'),
          ),
        ),
        const SizedBox(height: AppSpacing.sm),
        Text(
          'Welcome Back',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: AppSpacing.xxs),
        RichText(
          textAlign: TextAlign.center,
          text: TextSpan(
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textSecondary,
                ),
            children: [
              const TextSpan(text: 'Signing in as '),
              TextSpan(
                text: _getMaskedIdentifier(),
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.lg),
        TextField(
          controller: _passwordController,
          obscureText: !_showPassword,
          decoration: InputDecoration(
            hintText: 'Password',
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            suffixIcon: IconButton(
              icon:
                  Icon(_showPassword ? Icons.visibility_off : Icons.visibility),
              onPressed: () => setState(() => _showPassword = !_showPassword),
            ),
          ),
          onChanged: (_) => setState(() => _error = null),
          onSubmitted: (_) => _handlePasswordLogin(),
        ),
        if (_error != null) ...[
          const SizedBox(height: AppSpacing.xs),
          Text(
            _error!,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.error,
                  fontWeight: FontWeight.bold,
                ),
            textAlign: TextAlign.center,
          ),
        ],
        const SizedBox(height: AppSpacing.sm),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            TextButton(
              onPressed: () {
                // TODO: Forgot password
              },
              child: Text(
                'Forgot Password?',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: AppColors.textSecondary,
                      fontWeight: FontWeight.bold,
                    ),
              ),
            ),
            TextButton(
              onPressed: () {
                setState(() {
                  _step = AuthStep.otp;
                  _otp = List.filled(6, '');
                  for (final c in _otpControllers) {
                    c.clear();
                  }
                  _showOtpHelp = false;
                });
                _startRateLimitTimer();
              },
              child: Text(
                'Use code instead',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: AppColors.primary,
                      fontWeight: FontWeight.bold,
                    ),
              ),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.md),
        FilledButton(
          onPressed: _handlePasswordLogin,
          child: const Text('Sign In'),
        ),
      ],
    );
  }

  Widget _buildFooter() {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.surfaceVariant,
        border: Border(
          top: BorderSide(color: AppColors.divider, width: 1),
        ),
        borderRadius: const BorderRadius.vertical(bottom: Radius.circular(16)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.lock_outline, size: 10, color: AppColors.textTertiary),
          const SizedBox(width: AppSpacing.xxs),
          Flexible(
            child: Text(
              '256-bit Encrypted • ISO 27001 Certified',
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: AppColors.textTertiary,
                    fontSize: 10,
                  ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}

/// Role selection button widget
class _RoleButton extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;
  final VoidCallback onTap;

  const _RoleButton({
    required this.icon,
    required this.title,
    required this.description,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          border: Border.all(color: AppColors.divider),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: AppColors.surfaceVariant,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Icon(icon, color: AppColors.textSecondary, size: 20),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  Text(
                    description,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                  ),
                ],
              ),
            ),
            Icon(Icons.arrow_forward_ios,
                size: 16, color: AppColors.textTertiary),
          ],
        ),
      ),
    );
  }
}

/// Method toggle button widget
class _MethodToggleButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _MethodToggleButton({
    required this.icon,
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
        decoration: BoxDecoration(
          color: isSelected ? Colors.white : Colors.transparent,
          borderRadius: BorderRadius.circular(6),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  ),
                ]
              : null,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 16,
              color:
                  isSelected ? AppColors.textPrimary : AppColors.textSecondary,
            ),
            const SizedBox(width: AppSpacing.xxs),
            Text(
              label,
              style: Theme.of(context).textTheme.labelMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: isSelected
                        ? AppColors.textPrimary
                        : AppColors.textSecondary,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}
