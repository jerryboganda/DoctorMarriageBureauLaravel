import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../theme/app_colors.dart';
import '../theme/app_decorations.dart';
import '../widgets/dmb_button.dart';
import '../widgets/dmb_text_field.dart';
import '../providers/auth_provider.dart';
import '../services/auth_service.dart';
import '../utils/validators.dart';

/// Auth screen — matches AuthModal.tsx multi-step login/signup flow
/// Steps: mode select -> identifier input -> OTP/password -> optional 2FA
class AuthScreen extends ConsumerStatefulWidget {
  const AuthScreen({super.key});

  @override
  ConsumerState<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends ConsumerState<AuthScreen> {
  final _pageController = PageController();
  int _currentStep = 0; // 0=mode, 1=identifier, 2=password/otp, 3=2fa, 4=signup-form

  String _mode = ''; // 'login', 'signup'
  String _role = 'self'; // 'self', 'guardian', 'agent'
  bool _isLoading = false;
  String? _error;

  // Form controllers
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _otpController = TextEditingController();
  final _referralController = TextEditingController();

  bool _obscurePassword = true;
  bool _obscureConfirm = true;
  String _gender = 'male';

  // 2FA state
  int? _twoFactorUserId;

  @override
  void dispose() {
    _pageController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _firstNameController.dispose();
    _lastNameController.dispose();
    _phoneController.dispose();
    _otpController.dispose();
    _referralController.dispose();
    super.dispose();
  }

  void _goToStep(int step) {
    setState(() {
      _currentStep = step;
      _error = null;
    });
    _pageController.animateToPage(
      step,
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOut,
    );
  }

  Future<void> _handleLogin() async {
    final identifier = _emailController.text.trim();
    final password = _passwordController.text;

    if (identifier.isEmpty || password.isEmpty) {
      setState(() => _error = 'Please fill in all fields');
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    final authService = ref.read(authServiceProvider);
    final result = await authService.login(
      identifier: identifier,
      password: password,
    );

    setState(() => _isLoading = false);

    if (result.requires2FA) {
      _twoFactorUserId = result.userId;
      _goToStep(3);
      return;
    }

    if (result.isSuccess && result.hasUser) {
      await ref.read(authProvider.notifier).setUser(result.user!);
      if (mounted) context.go('/discovery');
    } else {
      setState(() => _error = result.error);
    }
  }

  Future<void> _handleSignup() async {
    if (_firstNameController.text.trim().isEmpty ||
        _lastNameController.text.trim().isEmpty ||
        _emailController.text.trim().isEmpty ||
        _phoneController.text.trim().isEmpty ||
        _passwordController.text.isEmpty) {
      setState(() => _error = 'Please fill in all required fields');
      return;
    }

    final passwordError = Validators.password(_passwordController.text);
    if (passwordError != null) {
      setState(() => _error = passwordError);
      return;
    }

    if (_passwordController.text != _confirmPasswordController.text) {
      setState(() => _error = 'Passwords do not match');
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    final authService = ref.read(authServiceProvider);
    final result = await authService.signup(
      firstName: _firstNameController.text.trim(),
      lastName: _lastNameController.text.trim(),
      email: _emailController.text.trim(),
      phone: _phoneController.text.trim(),
      password: _passwordController.text,
      gender: _gender,
      referralCode: _referralController.text.trim().isNotEmpty
          ? _referralController.text.trim()
          : null,
    );

    setState(() => _isLoading = false);

    if (result.isSuccess && result.hasUser) {
      await ref.read(authProvider.notifier).setUser(result.user!);
      if (mounted) context.go('/discovery');
    } else {
      setState(() => _error = result.error);
    }
  }

  Future<void> _handle2FA() async {
    final code = _otpController.text.trim();
    if (code.isEmpty || _twoFactorUserId == null) return;

    setState(() {
      _isLoading = true;
      _error = null;
    });

    final authService = ref.read(authServiceProvider);
    final result = await authService.verify2FA(
      userId: _twoFactorUserId!,
      code: code,
    );

    setState(() => _isLoading = false);

    if (result.isSuccess && result.hasUser) {
      await ref.read(authProvider.notifier).setUser(result.user!);
      if (mounted) context.go('/discovery');
    } else {
      setState(() => _error = result.error);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            // Back button
            if (_currentStep > 0)
              Padding(
                padding: const EdgeInsets.all(8),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: IconButton(
                    icon: const Icon(LucideIcons.arrowLeft),
                    onPressed: () => _goToStep(_currentStep - 1),
                  ),
                ),
              ),

            Expanded(
              child: PageView(
                controller: _pageController,
                physics: const NeverScrollableScrollPhysics(),
                children: [
                  _buildModeSelect(),
                  _buildIdentifierInput(),
                  _buildPasswordInput(),
                  _build2FAInput(),
                  _buildSignupForm(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Step 0: Login or Signup
  Widget _buildModeSelect() {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: AppColors.primary10,
              borderRadius: BorderRadius.circular(AppDecorations.radiusXxl),
            ),
            child: const Icon(LucideIcons.heartPulse, size: 32, color: AppColors.primary),
          ),
          const SizedBox(height: 24),
          const Text(
            'Welcome Back',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: AppColors.slate900),
          ),
          const SizedBox(height: 8),
          const Text(
            'Sign in to continue to your account',
            style: TextStyle(fontSize: 14, color: AppColors.slate500),
          ),
          const SizedBox(height: 32),
          DmbButton(
            text: 'Sign In',
            onPressed: () {
              _mode = 'login';
              _goToStep(1);
            },
          ),
          const SizedBox(height: 12),
          DmbButton(
            text: 'Create Account',
            variant: DmbButtonVariant.outline,
            onPressed: () {
              _mode = 'signup';
              _goToStep(4);
            },
          ),
        ],
      ),
    );
  }

  /// Step 1: Email/Phone input
  Widget _buildIdentifierInput() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 40),
          const Text(
            'Enter your email or phone',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: AppColors.slate900),
          ),
          const SizedBox(height: 8),
          const Text(
            'We\'ll use this to find your account',
            style: TextStyle(fontSize: 14, color: AppColors.slate500),
          ),
          const SizedBox(height: 24),
          DmbTextField(
            label: 'Email or Phone',
            hint: 'doctor@example.com or +92...',
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.next,
            autofocus: true,
          ),
          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(_error!, style: const TextStyle(fontSize: 13, color: AppColors.error)),
          ],
          const SizedBox(height: 24),
          DmbButton(
            text: 'Continue',
            onPressed: () {
              if (_emailController.text.trim().isEmpty) {
                setState(() => _error = 'Please enter your email or phone');
                return;
              }
              _error = null;
              _goToStep(2);
            },
          ),
        ],
      ),
    );
  }

  /// Step 2: Password input
  Widget _buildPasswordInput() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 40),
          const Text(
            'Enter your password',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: AppColors.slate900),
          ),
          const SizedBox(height: 24),
          DmbTextField(
            label: 'Password',
            hint: 'Enter your password',
            controller: _passwordController,
            obscureText: _obscurePassword,
            textInputAction: TextInputAction.done,
            suffix: IconButton(
              icon: Icon(
                _obscurePassword ? LucideIcons.eyeOff : LucideIcons.eye,
                size: 20,
                color: AppColors.slate400,
              ),
              onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
            ),
          ),
          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(_error!, style: const TextStyle(fontSize: 13, color: AppColors.error)),
          ],
          const SizedBox(height: 24),
          DmbButton(
            text: 'Sign In',
            isLoading: _isLoading,
            onPressed: _isLoading ? null : _handleLogin,
          ),
          const SizedBox(height: 16),
          Center(
            child: TextButton(
              onPressed: () {
                // TODO: Forgot password flow
              },
              child: const Text('Forgot Password?'),
            ),
          ),
        ],
      ),
    );
  }

  /// Step 3: 2FA input
  Widget _build2FAInput() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 40),
          const Text(
            'Two-Factor Authentication',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: AppColors.slate900),
          ),
          const SizedBox(height: 8),
          const Text(
            'Enter the verification code from your authenticator app or email',
            style: TextStyle(fontSize: 14, color: AppColors.slate500),
          ),
          const SizedBox(height: 24),
          DmbTextField(
            label: 'Verification Code',
            hint: '000000',
            controller: _otpController,
            keyboardType: TextInputType.number,
            textInputAction: TextInputAction.done,
          ),
          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(_error!, style: const TextStyle(fontSize: 13, color: AppColors.error)),
          ],
          const SizedBox(height: 24),
          DmbButton(
            text: 'Verify',
            isLoading: _isLoading,
            onPressed: _isLoading ? null : _handle2FA,
          ),
        ],
      ),
    );
  }

  /// Step 4: Signup form
  Widget _buildSignupForm() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Create Account',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: AppColors.slate900),
          ),
          const SizedBox(height: 8),
          const Text(
            'Join thousands of medical professionals',
            style: TextStyle(fontSize: 14, color: AppColors.slate500),
          ),
          const SizedBox(height: 24),

          // Gender toggle
          Row(
            children: [
              Expanded(
                child: _GenderOption(
                  label: 'Male',
                  icon: LucideIcons.user,
                  isSelected: _gender == 'male',
                  onTap: () => setState(() => _gender = 'male'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _GenderOption(
                  label: 'Female',
                  icon: LucideIcons.user,
                  isSelected: _gender == 'female',
                  onTap: () => setState(() => _gender = 'female'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          Row(
            children: [
              Expanded(
                child: DmbTextField(
                  label: 'First Name',
                  hint: 'First name',
                  controller: _firstNameController,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: DmbTextField(
                  label: 'Last Name',
                  hint: 'Last name',
                  controller: _lastNameController,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          DmbTextField(
            label: 'Email',
            hint: 'doctor@example.com',
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            validator: Validators.email,
          ),
          const SizedBox(height: 12),
          DmbTextField(
            label: 'Phone',
            hint: '+92 300 0000000',
            controller: _phoneController,
            keyboardType: TextInputType.phone,
          ),
          const SizedBox(height: 12),
          DmbTextField(
            label: 'Password',
            hint: 'Min. 8 characters',
            controller: _passwordController,
            obscureText: _obscurePassword,
            suffix: IconButton(
              icon: Icon(
                _obscurePassword ? LucideIcons.eyeOff : LucideIcons.eye,
                size: 20,
                color: AppColors.slate400,
              ),
              onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
            ),
          ),
          const SizedBox(height: 12),
          DmbTextField(
            label: 'Confirm Password',
            hint: 'Re-enter password',
            controller: _confirmPasswordController,
            obscureText: _obscureConfirm,
            suffix: IconButton(
              icon: Icon(
                _obscureConfirm ? LucideIcons.eyeOff : LucideIcons.eye,
                size: 20,
                color: AppColors.slate400,
              ),
              onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm),
            ),
          ),
          const SizedBox(height: 12),
          DmbTextField(
            label: 'Referral Code (Optional)',
            hint: 'Enter referral code',
            controller: _referralController,
          ),

          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(_error!, style: const TextStyle(fontSize: 13, color: AppColors.error)),
          ],

          const SizedBox(height: 24),
          DmbButton(
            text: 'Create Account',
            isLoading: _isLoading,
            onPressed: _isLoading ? null : _handleSignup,
          ),
          const SizedBox(height: 16),
          Center(
            child: TextButton(
              onPressed: () {
                _mode = 'login';
                _goToStep(0);
              },
              child: const Text('Already have an account? Sign In'),
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}

class _GenderOption extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool isSelected;
  final VoidCallback onTap;

  const _GenderOption({
    required this.label,
    required this.icon,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary10 : AppColors.white,
          borderRadius: BorderRadius.circular(AppDecorations.radiusXl),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.slate200,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 18,
              color: isSelected ? AppColors.primary : AppColors.slate400,
            ),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(
                fontSize: 14,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                color: isSelected ? AppColors.primary : AppColors.slate600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
