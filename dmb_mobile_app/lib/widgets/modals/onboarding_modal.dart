import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_colors.dart';
import '../../core/constants/app_constants.dart';

/// User persona types for onboarding
enum UserPersona { candidate, family, agent }

/// Import method types
enum ImportMethod { whatsapp, pdf, manual }

/// OnboardingModal - Transpiled from OnboardingModal.tsx
/// Multi-step profile setup modal with:
/// - Step 1: Persona selection (candidate, family member, matchmaker)
/// - Step 2: Import method (WhatsApp paste, PDF upload, manual)
/// - Step 3: Essential profile fields
/// - Step 4: Terms and declarations
class OnboardingModal extends ConsumerStatefulWidget {
  final VoidCallback onClose;
  final VoidCallback? onComplete;

  const OnboardingModal({
    super.key,
    required this.onClose,
    this.onComplete,
  });

  @override
  ConsumerState<OnboardingModal> createState() => _OnboardingModalState();
}

class _OnboardingModalState extends ConsumerState<OnboardingModal> {
  int _step = 1;
  static const int _totalSteps = 4;

  UserPersona? _persona;
  ImportMethod? _importMethod;

  // Form fields
  final TextEditingController _firstNameController =
      TextEditingController(text: 'Rajesh');
  final TextEditingController _lastNameController =
      TextEditingController(text: 'Kumar');
  final TextEditingController _whatsappBiodataController =
      TextEditingController();
  String _specialty = 'MD General Medicine';
  DateTime? _dateOfBirth;

  // Declarations
  bool _termsAccepted = true;
  bool _consentAccepted = true;
  bool _truthfulnessAccepted = false;

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _whatsappBiodataController.dispose();
    super.dispose();
  }

  void _nextStep() {
    if (_step < _totalSteps) {
      setState(() => _step++);
    }
  }

  void _prevStep() {
    if (_step > 1) {
      setState(() => _step--);
    }
  }

  void _handleComplete() {
    widget.onComplete?.call();
    widget.onClose();
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      insetPadding: const EdgeInsets.all(AppSpacing.md),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        constraints: const BoxConstraints(maxWidth: 600, maxHeight: 600),
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
      height: 80,
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(
          bottom: BorderSide(color: AppColors.divider, width: 1),
        ),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Profile Setup',
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: AppSpacing.xs),
              _buildStepper(),
            ],
          ),
          IconButton(
            onPressed: widget.onClose,
            icon: const Icon(Icons.close),
            color: AppColors.textSecondary,
          ),
        ],
      ),
    );
  }

  Widget _buildStepper() {
    return Row(
      children: [
        // Auth completed indicator
        Container(
          height: 6,
          width: 24,
          decoration: BoxDecoration(
            color: AppColors.success,
            borderRadius: BorderRadius.circular(3),
          ),
        ),
        const SizedBox(width: AppSpacing.xxs),
        Text(
          'Auth',
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                fontWeight: FontWeight.bold,
                color: AppColors.success,
                fontSize: 10,
              ),
        ),
        const SizedBox(width: AppSpacing.xs),
        Text(
          '•',
          style: TextStyle(color: AppColors.textTertiary, fontSize: 10),
        ),
        const SizedBox(width: AppSpacing.xs),
        // Active steps
        ...List.generate(4, (index) {
          final stepNum = index + 1;
          return Container(
            height: 6,
            width: 24,
            margin: EdgeInsets.only(right: index < 3 ? AppSpacing.xxs : 0),
            decoration: BoxDecoration(
              color: stepNum <= _step ? AppColors.primary : AppColors.divider,
              borderRadius: BorderRadius.circular(3),
            ),
          );
        }),
        const SizedBox(width: AppSpacing.xs),
        Text(
          '•',
          style: TextStyle(color: AppColors.textTertiary, fontSize: 10),
        ),
        const SizedBox(width: AppSpacing.xs),
        // Verification pending indicator
        Container(
          height: 6,
          width: 24,
          decoration: BoxDecoration(
            color: AppColors.divider,
            borderRadius: BorderRadius.circular(3),
            border: Border.all(
              color: AppColors.textTertiary,
              strokeAlign: BorderSide.strokeAlignInside,
              style: BorderStyle.solid,
            ),
          ),
        ),
        const SizedBox(width: AppSpacing.xxs),
        Text(
          'Verification',
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                fontWeight: FontWeight.w500,
                color: AppColors.textTertiary,
                fontSize: 10,
              ),
        ),
      ],
    );
  }

  Widget _buildContent() {
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: AnimatedSwitcher(
        duration: const Duration(milliseconds: 300),
        child: _buildStepContent(),
      ),
    );
  }

  Widget _buildStepContent() {
    switch (_step) {
      case 1:
        return _buildPersonaStep();
      case 2:
        return _buildImportStep();
      case 3:
        return _buildEssentialsStep();
      case 4:
        return _buildDeclarationsStep();
      default:
        return const SizedBox.shrink();
    }
  }

  Widget _buildPersonaStep() {
    return Column(
      key: const ValueKey('step1'),
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SizedBox(height: AppSpacing.md),
        Text(
          'Welcome to DMB.',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: AppSpacing.xs),
        Text(
          "Let's set up your profile. First, tell us who you are.",
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppColors.textSecondary,
              ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: AppSpacing.xl),
        _PersonaCard(
          icon: Icons.person_outline,
          title: 'Candidate',
          description: "I'm a doctor looking for a partner.",
          isSelected: _persona == UserPersona.candidate,
          onTap: () => setState(() => _persona = UserPersona.candidate),
        ),
        const SizedBox(height: AppSpacing.md),
        _PersonaCard(
          icon: Icons.people_outline,
          title: 'Family Member',
          description: "I'm a parent/sibling managing this.",
          isSelected: _persona == UserPersona.family,
          onTap: () => setState(() => _persona = UserPersona.family),
        ),
        const SizedBox(height: AppSpacing.md),
        _PersonaCard(
          icon: Icons.description_outlined,
          title: 'Matchmaker',
          description: "I'm a professional agent.",
          isSelected: _persona == UserPersona.agent,
          onTap: () => setState(() => _persona = UserPersona.agent),
        ),
      ],
    );
  }

  Widget _buildImportStep() {
    return Column(
      key: const ValueKey('step2'),
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SizedBox(height: AppSpacing.md),
        Text(
          'Import Profile Data',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: AppSpacing.xs),
        Text(
          'Save time by importing details from an existing source.',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppColors.textSecondary,
              ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: AppSpacing.xl),
        _ImportOptionCard(
          icon: Icons.chat_bubble_outline,
          iconColor: Colors.green,
          iconBgColor: Colors.green.shade50,
          title: 'Paste WhatsApp Biodata',
          description:
              'Copy the text from your family WhatsApp group and paste it here.',
          isSelected: _importMethod == ImportMethod.whatsapp,
          onTap: () => setState(() => _importMethod = ImportMethod.whatsapp),
          expandedContent: _importMethod == ImportMethod.whatsapp
              ? TextField(
                  controller: _whatsappBiodataController,
                  maxLines: 4,
                  decoration: InputDecoration(
                    hintText:
                        "Paste text here... e.g., 'Name: Dr. Raj, DOB: 1995, Height: 5ft 10...'",
                    hintStyle: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.textTertiary,
                        ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    contentPadding: const EdgeInsets.all(AppSpacing.sm),
                  ),
                )
              : null,
        ),
        const SizedBox(height: AppSpacing.md),
        _ImportOptionCard(
          icon: Icons.upload_file,
          iconColor: Colors.red,
          iconBgColor: Colors.red.shade50,
          title: 'Upload Biodata PDF',
          description: "We'll extract the details automatically.",
          isSelected: _importMethod == ImportMethod.pdf,
          onTap: () => setState(() => _importMethod = ImportMethod.pdf),
        ),
        const SizedBox(height: AppSpacing.md),
        _ImportOptionCard(
          icon: Icons.person_outline,
          iconColor: AppColors.textSecondary,
          iconBgColor: AppColors.surfaceVariant,
          title: 'Start from Scratch',
          description: 'Fill in the details manually step-by-step.',
          isSelected: _importMethod == ImportMethod.manual,
          onTap: () => setState(() => _importMethod = ImportMethod.manual),
        ),
      ],
    );
  }

  Widget _buildEssentialsStep() {
    return Column(
      key: const ValueKey('step3'),
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SizedBox(height: AppSpacing.md),
        Text(
          'The Essentials',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: AppSpacing.xs),
        Text(
          'We use "Progressive Profiling". Just these few fields for now!',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppColors.textSecondary,
              ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: AppSpacing.xl),
        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'First Name',
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: AppSpacing.xxs),
                  TextField(
                    controller: _firstNameController,
                    decoration: InputDecoration(
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.sm,
                        vertical: AppSpacing.sm,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Last Name',
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: AppSpacing.xxs),
                  TextField(
                    controller: _lastNameController,
                    decoration: InputDecoration(
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.sm,
                        vertical: AppSpacing.sm,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.md),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Specialty',
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: AppSpacing.xxs),
            DropdownButtonFormField<String>(
              value: _specialty,
              decoration: InputDecoration(
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.sm,
                  vertical: AppSpacing.sm,
                ),
              ),
              items: const [
                DropdownMenuItem(
                  value: 'MD General Medicine',
                  child: Text('MD General Medicine'),
                ),
                DropdownMenuItem(
                  value: 'MS Orthopedics',
                  child: Text('MS Orthopedics'),
                ),
                DropdownMenuItem(
                  value: 'Cardiology',
                  child: Text('Cardiology'),
                ),
              ],
              onChanged: (value) {
                if (value != null) {
                  setState(() => _specialty = value);
                }
              },
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.md),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Date of Birth',
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: AppSpacing.xxs),
            InkWell(
              onTap: () async {
                final date = await showDatePicker(
                  context: context,
                  initialDate: _dateOfBirth ??
                      DateTime.now().subtract(
                        const Duration(days: 365 * 25),
                      ),
                  firstDate: DateTime(1960),
                  lastDate: DateTime.now().subtract(
                    const Duration(days: 365 * 18),
                  ),
                );
                if (date != null) {
                  setState(() => _dateOfBirth = date);
                }
              },
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.sm,
                  vertical: AppSpacing.md,
                ),
                decoration: BoxDecoration(
                  border: Border.all(color: AppColors.divider),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      _dateOfBirth != null
                          ? '${_dateOfBirth!.day}/${_dateOfBirth!.month}/${_dateOfBirth!.year}'
                          : 'Select Date',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: _dateOfBirth != null
                                ? AppColors.textPrimary
                                : AppColors.textTertiary,
                          ),
                    ),
                    Icon(
                      Icons.calendar_today,
                      size: 18,
                      color: AppColors.textSecondary,
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildDeclarationsStep() {
    return Column(
      key: const ValueKey('step4'),
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SizedBox(height: AppSpacing.md),
        Container(
          width: 64,
          height: 64,
          margin: const EdgeInsets.only(bottom: AppSpacing.md),
          decoration: BoxDecoration(
            color: AppColors.primary.withOpacity(0.1),
            borderRadius: BorderRadius.circular(32),
          ),
          child: Icon(
            Icons.shield_outlined,
            color: AppColors.primary,
            size: 32,
          ),
        ),
        Text(
          'Final Declarations',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: AppSpacing.xs),
        Text(
          'Please review and accept the following.',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppColors.textSecondary,
              ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: AppSpacing.xl),
        Container(
          padding: const EdgeInsets.all(AppSpacing.md),
          decoration: BoxDecoration(
            color: AppColors.surfaceVariant,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.divider),
          ),
          child: Column(
            children: [
              _DeclarationItem(
                text: 'I agree to the Terms of Service and Privacy Policy.',
                boldParts: const ['Terms of Service', 'Privacy Policy'],
                isChecked: _termsAccepted,
                onChanged: (value) =>
                    setState(() => _termsAccepted = value ?? false),
              ),
              const Divider(height: AppSpacing.lg),
              _DeclarationItem(
                text:
                    'I consent to the use of my photos and data for matchmaking purposes within the DMB network.',
                isChecked: _consentAccepted,
                onChanged: (value) =>
                    setState(() => _consentAccepted = value ?? false),
              ),
              const Divider(height: AppSpacing.lg),
              _DeclarationItem(
                text:
                    'I confirm that all information provided is accurate and truthful.',
                isChecked: _truthfulnessAccepted,
                onChanged: (value) =>
                    setState(() => _truthfulnessAccepted = value ?? false),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildFooter() {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: AppColors.surfaceVariant,
        border: Border(
          top: BorderSide(color: AppColors.divider, width: 1),
        ),
        borderRadius: const BorderRadius.vertical(bottom: Radius.circular(16)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          TextButton(
            onPressed: _step == 1 ? widget.onClose : _prevStep,
            child: Text(
              _step == 1 ? 'Cancel' : 'Back',
              style: Theme.of(context).textTheme.labelLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: AppColors.textSecondary,
                  ),
            ),
          ),
          FilledButton(
            onPressed: _step == _totalSteps ? _handleComplete : _nextStep,
            style: FilledButton.styleFrom(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.xl,
                vertical: AppSpacing.md,
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  _step == _totalSteps ? 'Complete & Continue' : 'Continue',
                ),
                if (_step != _totalSteps) ...[
                  const SizedBox(width: AppSpacing.xs),
                  const Icon(Icons.arrow_forward, size: 16),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Persona selection card widget
class _PersonaCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;
  final bool isSelected;
  final VoidCallback onTap;

  const _PersonaCard({
    required this.icon,
    required this.title,
    required this.description,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(AppSpacing.lg),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.primary.withOpacity(0.05)
              : Colors.transparent,
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.divider,
            width: isSelected ? 2 : 1,
          ),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            Icon(
              icon,
              size: 32,
              color: isSelected ? AppColors.primary : AppColors.textTertiary,
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              title,
              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                    color:
                        isSelected ? AppColors.primary : AppColors.textPrimary,
                  ),
            ),
            const SizedBox(height: AppSpacing.xxs),
            Text(
              description,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.textSecondary,
                  ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

/// Import option card widget
class _ImportOptionCard extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final Color iconBgColor;
  final String title;
  final String description;
  final bool isSelected;
  final VoidCallback onTap;
  final Widget? expandedContent;

  const _ImportOptionCard({
    required this.icon,
    required this.iconColor,
    required this.iconBgColor,
    required this.title,
    required this.description,
    required this.isSelected,
    required this.onTap,
    this.expandedContent,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.primary.withOpacity(0.05)
              : Colors.transparent,
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.divider,
            width: isSelected ? 2 : 1,
          ),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: iconBgColor,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Icon(icon, color: iconColor, size: 20),
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
                      const SizedBox(height: AppSpacing.xxs),
                      Text(
                        description,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AppColors.textSecondary,
                            ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            if (expandedContent != null) ...[
              const SizedBox(height: AppSpacing.sm),
              expandedContent!,
            ],
          ],
        ),
      ),
    );
  }
}

/// Declaration checkbox item
class _DeclarationItem extends StatelessWidget {
  final String text;
  final List<String> boldParts;
  final bool isChecked;
  final ValueChanged<bool?> onChanged;

  const _DeclarationItem({
    required this.text,
    this.boldParts = const [],
    required this.isChecked,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Checkbox(
          value: isChecked,
          onChanged: onChanged,
          visualDensity: VisualDensity.compact,
        ),
        const SizedBox(width: AppSpacing.xs),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(top: AppSpacing.xs),
            child: _buildRichText(context),
          ),
        ),
      ],
    );
  }

  Widget _buildRichText(BuildContext context) {
    if (boldParts.isEmpty) {
      return Text(
        text,
        style: Theme.of(context).textTheme.bodySmall,
      );
    }

    final List<TextSpan> spans = [];
    String remainingText = text;

    for (final boldPart in boldParts) {
      final index = remainingText.indexOf(boldPart);
      if (index >= 0) {
        if (index > 0) {
          spans.add(TextSpan(text: remainingText.substring(0, index)));
        }
        spans.add(
          TextSpan(
            text: boldPart,
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
        );
        remainingText = remainingText.substring(index + boldPart.length);
      }
    }

    if (remainingText.isNotEmpty) {
      spans.add(TextSpan(text: remainingText));
    }

    return RichText(
      text: TextSpan(
        style: Theme.of(context).textTheme.bodySmall,
        children: spans,
      ),
    );
  }
}
