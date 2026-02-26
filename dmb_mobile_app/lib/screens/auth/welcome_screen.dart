import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/core.dart';
import '../../providers/providers.dart';
import '../../routes/route_names.dart';
import '../../widgets/modals/auth_modal.dart';
import '../../widgets/modals/onboarding_modal.dart';

/// Welcome Screen - Auth landing with phone/email login
/// Transpiled from WelcomeScreen.tsx
class WelcomeScreen extends ConsumerStatefulWidget {
  const WelcomeScreen({super.key});

  @override
  ConsumerState<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends ConsumerState<WelcomeScreen> {
  String _currentStep = 'landing';
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _otpController = TextEditingController();
  bool _isLoading = false;

  @override
  void dispose() {
    _phoneController.dispose();
    _emailController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  /// Show the full AuthModal dialog
  void _showAuthModal() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AuthModal(
        onClose: () => Navigator.of(context).pop(),
        onLogin: _showOnboardingModal,
      ),
    );
  }

  /// Show the OnboardingModal after successful auth
  void _showOnboardingModal() {
    // Close auth modal first if it's open
    Navigator.of(context).pop();

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => OnboardingModal(
        onClose: () => Navigator.of(context).pop(),
        onComplete: () {
          // Navigate to dashboard after onboarding
          if (context.mounted) {
            context.go(RouteNames.dashboard);
          }
        },
      ),
    );
  }

  void _handleContinue() {
    setState(() => _isLoading = true);

    // Simulate API call
    Future.delayed(const Duration(seconds: 1), () async {
      setState(() => _isLoading = false);

      switch (_currentStep) {
        case 'landing':
          // Show the AuthModal instead of simple step-by-step
          _showAuthModal();
          break;
        case 'phone':
          setState(() => _currentStep = 'otp');
          break;
        case 'email':
          setState(() => _currentStep = 'otp');
          break;
        case 'otp':
          // Sign in successful
          await ref.read(authProvider.notifier).signIn(
                email: 'user@example.com',
                password: 'demo123',
              );
          if (context.mounted) {
            context.go(RouteNames.dashboard);
          }
          break;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.xl),
          child: _buildCurrentStep(),
        ),
      ),
    );
  }

  Widget _buildCurrentStep() {
    switch (_currentStep) {
      case 'landing':
        return _buildLandingStep();
      case 'phone':
        return _buildPhoneStep();
      case 'email':
        return _buildEmailStep();
      case 'otp':
        return _buildOTPStep();
      default:
        return _buildLandingStep();
    }
  }

  Widget _buildLandingStep() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const Spacer(),

        // Logo
        Container(
          width: 120,
          height: 120,
          decoration: BoxDecoration(
            gradient: AppColors.primaryGradient,
            borderRadius: BorderRadius.circular(AppRadius.xl),
            boxShadow: [
              BoxShadow(
                color: AppColors.primaryShadow,
                blurRadius: 24,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: const Icon(
            Icons.favorite,
            size: 60,
            color: Colors.white,
          ),
        ),

        const SizedBox(height: AppSpacing.xl),

        // Title
        Text(
          'DMB',
          style: AppTypography.displayLarge.copyWith(
            color: AppColors.primary,
            fontWeight: FontWeight.w800,
          ),
        ),

        const SizedBox(height: AppSpacing.xs),

        Text(
          'Desi Marriage Bureau',
          style: AppTypography.headlineSmall.copyWith(
            color: AppColors.textSecondary,
          ),
        ),

        const SizedBox(height: AppSpacing.sm),

        Text(
          'Where medical professionals find their perfect match',
          style: AppTypography.bodyMedium.copyWith(
            color: AppColors.textMuted,
          ),
          textAlign: TextAlign.center,
        ),

        const Spacer(),

        // Features
        _buildFeatureRow(Icons.verified, 'Verified medical professionals only'),
        const SizedBox(height: AppSpacing.md),
        _buildFeatureRow(
            Icons.auto_awesome, 'AI-powered compatibility matching'),
        const SizedBox(height: AppSpacing.md),
        _buildFeatureRow(Icons.family_restroom, 'Family involvement features'),

        const Spacer(),

        // Get Started Button
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: _handleContinue,
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: AppSpacing.lg),
            ),
            child: const Text('Get Started'),
          ),
        ),

        const SizedBox(height: AppSpacing.md),

        // Already have account
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              'Already have an account? ',
              style: AppTypography.bodyMedium.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
            TextButton(
              onPressed: _showAuthModal,
              child: const Text('Sign In'),
            ),
          ],
        ),

        const SizedBox(height: AppSpacing.lg),
      ],
    );
  }

  Widget _buildPhoneStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Back Button
        IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => setState(() => _currentStep = 'landing'),
        ),

        const SizedBox(height: AppSpacing.xl),

        Text(
          'Enter your phone number',
          style: AppTypography.headlineMedium,
        ),

        const SizedBox(height: AppSpacing.sm),

        Text(
          'We\'ll send you a verification code to confirm your identity',
          style: AppTypography.bodyMedium.copyWith(
            color: AppColors.textSecondary,
          ),
        ),

        const SizedBox(height: AppSpacing.xxl),

        // Phone Input
        TextField(
          controller: _phoneController,
          keyboardType: TextInputType.phone,
          decoration: InputDecoration(
            labelText: 'Phone Number',
            hintText: '+91 9876543210',
            prefixIcon: const Icon(Icons.phone),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppRadius.md),
            ),
          ),
        ),

        const SizedBox(height: AppSpacing.lg),

        // Use Email Instead
        Center(
          child: TextButton(
            onPressed: () => setState(() => _currentStep = 'email'),
            child: const Text('Use email instead'),
          ),
        ),

        const Spacer(),

        // Continue Button
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: _isLoading ? null : _handleContinue,
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: AppSpacing.lg),
            ),
            child: _isLoading
                ? const SizedBox(
                    width: 24,
                    height: 24,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  )
                : const Text('Continue'),
          ),
        ),

        const SizedBox(height: AppSpacing.xl),
      ],
    );
  }

  Widget _buildEmailStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Back Button
        IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => setState(() => _currentStep = 'phone'),
        ),

        const SizedBox(height: AppSpacing.xl),

        Text(
          'Enter your email',
          style: AppTypography.headlineMedium,
        ),

        const SizedBox(height: AppSpacing.sm),

        Text(
          'We\'ll send you a magic link to sign in',
          style: AppTypography.bodyMedium.copyWith(
            color: AppColors.textSecondary,
          ),
        ),

        const SizedBox(height: AppSpacing.xxl),

        // Email Input
        TextField(
          controller: _emailController,
          keyboardType: TextInputType.emailAddress,
          decoration: InputDecoration(
            labelText: 'Email Address',
            hintText: 'doctor@example.com',
            prefixIcon: const Icon(Icons.email),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppRadius.md),
            ),
          ),
        ),

        const SizedBox(height: AppSpacing.lg),

        // Use Phone Instead
        Center(
          child: TextButton(
            onPressed: () => setState(() => _currentStep = 'phone'),
            child: const Text('Use phone instead'),
          ),
        ),

        const Spacer(),

        // Continue Button
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: _isLoading ? null : _handleContinue,
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: AppSpacing.lg),
            ),
            child: _isLoading
                ? const SizedBox(
                    width: 24,
                    height: 24,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  )
                : const Text('Send Magic Link'),
          ),
        ),

        const SizedBox(height: AppSpacing.xl),
      ],
    );
  }

  Widget _buildOTPStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Back Button
        IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => setState(() => _currentStep = 'phone'),
        ),

        const SizedBox(height: AppSpacing.xl),

        Text(
          'Verify your number',
          style: AppTypography.headlineMedium,
        ),

        const SizedBox(height: AppSpacing.sm),

        Text(
          'Enter the 6-digit code we sent to your phone',
          style: AppTypography.bodyMedium.copyWith(
            color: AppColors.textSecondary,
          ),
        ),

        const SizedBox(height: AppSpacing.xxl),

        // OTP Input
        TextField(
          controller: _otpController,
          keyboardType: TextInputType.number,
          maxLength: 6,
          textAlign: TextAlign.center,
          style: AppTypography.headlineMedium.copyWith(
            letterSpacing: 8,
          ),
          decoration: InputDecoration(
            hintText: '------',
            counterText: '',
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppRadius.md),
            ),
          ),
        ),

        const SizedBox(height: AppSpacing.lg),

        // Resend Code
        Center(
          child: TextButton(
            onPressed: () {
              // TODO: Resend code
            },
            child: const Text('Resend Code'),
          ),
        ),

        const Spacer(),

        // Verify Button
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: _isLoading ? null : _handleContinue,
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: AppSpacing.lg),
            ),
            child: _isLoading
                ? const SizedBox(
                    width: 24,
                    height: 24,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  )
                : const Text('Verify & Continue'),
          ),
        ),

        const SizedBox(height: AppSpacing.xl),
      ],
    );
  }

  Widget _buildFeatureRow(IconData icon, String text) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(AppSpacing.sm),
          decoration: BoxDecoration(
            color: AppColors.primaryLight,
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: AppColors.primary, size: 20),
        ),
        const SizedBox(width: AppSpacing.md),
        Expanded(
          child: Text(
            text,
            style: AppTypography.bodyMedium,
          ),
        ),
      ],
    );
  }
}
