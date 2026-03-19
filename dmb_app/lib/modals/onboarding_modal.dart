import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:image_picker/image_picker.dart';
import '../theme/app_colors.dart';
import '../theme/app_decorations.dart';
import '../providers/auth_provider.dart';
import '../services/profile_service.dart';
import '../models/dropdown_data.dart';
import '../widgets/dmb_button.dart';
import '../widgets/dmb_text_field.dart';

/// Shows the 6-step onboarding wizard as a full-screen bottom sheet.
Future<void> showOnboardingModal(BuildContext context) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    isDismissible: false,
    enableDrag: false,
    backgroundColor: Colors.transparent,
    builder: (_) => const _OnboardingSheet(),
  );
}

// ─── Step metadata ───────────────────────────────────────────────────────────

class _StepInfo {
  final String label;
  final IconData icon;
  const _StepInfo(this.label, this.icon);
}

const _steps = <_StepInfo>[
  _StepInfo('Personal', LucideIcons.user),
  _StepInfo('Location', LucideIcons.mapPin),
  _StepInfo('Career', LucideIcons.briefcase),
  _StepInfo('Appearance', LucideIcons.ruler),
  _StepInfo('About Me', LucideIcons.heart),
  _StepInfo('Photo', LucideIcons.camera),
];

const int _totalSteps = 6;

const List<String> _complexionOptions = [
  'Very Fair',
  'Fair',
  'Wheatish',
  'Dark',
];

// ─── Bottom-sheet wrapper ────────────────────────────────────────────────────

class _OnboardingSheet extends StatelessWidget {
  const _OnboardingSheet();

  @override
  Widget build(BuildContext context) {
    final height = MediaQuery.of(context).size.height * 0.95;
    return Container(
      height: height,
      decoration: const BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppDecorations.radiusXxl)),
      ),
      child: const _OnboardingBody(),
    );
  }
}

// ─── Main body (ConsumerStatefulWidget) ──────────────────────────────────────

class _OnboardingBody extends ConsumerStatefulWidget {
  const _OnboardingBody();

  @override
  ConsumerState<_OnboardingBody> createState() => _OnboardingBodyState();
}

class _OnboardingBodyState extends ConsumerState<_OnboardingBody> {
  // Current step (1-based)
  int _step = 1;

  // Loading / saving / error
  bool _loading = true;
  bool _saving = false;
  String? _error;

  // Dropdown data loaded from the API
  ProfileDropdownData _dropdowns = const ProfileDropdownData();
  List<DropdownOption> _salaryRanges = [];
  List<DropdownOption> _jobTitles = [];
  List<DropdownOption> _specialities = [];
  List<DropdownOption> _sects = [];
  List<DropdownOption> _castes = [];
  List<DropdownOption> _states = [];
  List<DropdownOption> _cities = [];

  // Form data
  final _firstName = TextEditingController();
  final _lastName = TextEditingController();
  String _gender = '';
  DateTime? _dateOfBirth;
  int? _maritalStatusId;

  int? _countryId;
  int? _stateId;
  int? _cityId;
  int? _religionId;
  int? _sectId;
  int? _casteId;

  int? _jobTitleId;
  String _designation = '';
  int? _specialityId;
  final _company = TextEditingController();
  final _education = TextEditingController();
  final _institution = TextEditingController();
  int? _incomeRangeId;

  final _height = TextEditingController();
  final _weight = TextEditingController();
  String _complexion = '';

  final _introduction = TextEditingController();

  File? _photoFile;
  String? _photoPreviewPath;
  String? _existingAvatarUrl;
  bool _hasProfilePhoto = false;

  late final ProfileService _profileService;

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  @override
  void initState() {
    super.initState();
    _profileService = ProfileService(ref.read(apiServiceProvider));
    _loadProfile();
  }

  @override
  void dispose() {
    _firstName.dispose();
    _lastName.dispose();
    _company.dispose();
    _education.dispose();
    _institution.dispose();
    _height.dispose();
    _weight.dispose();
    _introduction.dispose();
    super.dispose();
  }

  // ── Data loading ───────────────────────────────────────────────────────────

  Future<void> _loadProfile() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        _profileService.getFullProfile(),
        _profileService.getProfileDropdowns(),
        _profileService.getCastes(null),
        _profileService.getSects(null),
      ]);

      final profile = results[0] as Map<String, dynamic>;
      final dropdowns = results[1] as ProfileDropdownData;
      final castes = results[2] as List<DropdownOption>;
      final sects = results[3] as List<DropdownOption>;

      _dropdowns = dropdowns;
      _castes = castes;
      _sects = sects;

      // Parse extra option sets embedded in the profile response
      final optionSets = profile['optionSets'];
      if (optionSets is Map<String, dynamic>) {
        _salaryRanges = _parseDropdownList(optionSets['salaryRanges'] ?? optionSets['salary_ranges']);
        _jobTitles = _parseDropdownList(optionSets['jobTitles'] ?? optionSets['job_titles']);
        _specialities = _parseDropdownList(optionSets['specialities']);
      }
      final salaryRangesTop = profile['salaryRanges'];
      if (salaryRangesTop is List && _salaryRanges.isEmpty) {
        _salaryRanges = salaryRangesTop
            .map<DropdownOption>((e) => DropdownOption(
                  id: e['id'] as int? ?? 0,
                  name: e['label']?.toString() ?? e['name']?.toString() ?? '',
                ))
            .toList();
      }

      // Populate form from existing profile
      if (profile['result'] == true) {
        final basics = profile['basics'] as Map<String, dynamic>? ?? {};
        final family = profile['family'] as Map<String, dynamic>? ?? {};
        final career = profile['career'] as Map<String, dynamic>? ?? {};

        _firstName.text = basics['firstName']?.toString() ?? '';
        _lastName.text = basics['lastName']?.toString() ?? '';
        _gender = basics['gender']?.toString() ?? '';
        if (basics['dateOfBirth'] != null && basics['dateOfBirth'].toString().isNotEmpty) {
          _dateOfBirth = DateTime.tryParse(basics['dateOfBirth'].toString());
        }
        _maritalStatusId = _toInt(basics['maritalStatusId']);

        _countryId = _toInt(basics['currentResidencyCountryId']);
        _stateId = _toInt(basics['currentResidencyStateId']);
        _cityId = _toInt(basics['currentResidencyCityId']);
        _religionId = _toInt(family['religionId']);
        _sectId = _toInt(family['sectId']);
        _casteId = _toInt(family['casteId']);

        _jobTitleId = _toInt(career['jobTitleId']);
        _designation = career['designation']?.toString() ?? '';
        _specialityId = _toInt(career['specialityId']);
        _company.text = career['company']?.toString() ?? '';
        _education.text = career['education']?.toString() ?? '';
        _institution.text = career['institution']?.toString() ?? '';
        _incomeRangeId = _toInt(career['incomeRangeId']);

        _height.text = basics['height']?.toString() ?? '';
        _weight.text = basics['weight']?.toString() ?? '';
        _complexion = basics['complexion']?.toString() ?? '';

        _introduction.text = basics['introduction']?.toString() ?? '';

        _existingAvatarUrl = basics['avatarUrl']?.toString();
        _hasProfilePhoto = basics['hasProfilePhoto'] == true;

        // Navigate to first incomplete step
        final firstIncomplete = profile['profileCompletion']?['firstIncompleteStep'];
        if (firstIncomplete is int && firstIncomplete >= 1 && firstIncomplete <= _totalSteps) {
          _step = firstIncomplete;
        }

        // Fetch dependent location data
        if (_countryId != null) {
          _states = await _profileService.getStates(_countryId!);
        }
        if (_stateId != null) {
          _cities = await _profileService.getCities(_stateId!);
        }
      }
    } catch (e) {
      debugPrint('Onboarding load error: $e');
      _error = 'Failed to load profile data. Please try again.';
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  static int? _toInt(dynamic v) {
    if (v == null) return null;
    if (v is int) return v == 0 ? null : v;
    if (v is String) {
      final parsed = int.tryParse(v);
      return (parsed == null || parsed == 0) ? null : parsed;
    }
    return null;
  }

  static List<DropdownOption> _parseDropdownList(dynamic raw) {
    if (raw == null) return [];
    if (raw is! List) return [];
    return raw
        .map<DropdownOption>((e) => DropdownOption(
              id: e['id'] as int? ?? 0,
              name: e['name']?.toString() ?? e['label']?.toString() ?? '',
            ))
        .where((o) => o.id != 0 && o.name.isNotEmpty)
        .toList();
  }

  // ── Completion tracking ────────────────────────────────────────────────────

  /// Returns (percentage, stepComplete[]) mirroring the React computeLocalCompletion.
  ({int percentage, List<bool> stepComplete}) _computeCompletion() {
    bool _filled(dynamic v) =>
        v != null && v.toString().trim().isNotEmpty && v != 0 && v != false;

    final step1 = [_firstName.text, _lastName.text, _gender, _dateOfBirth, _maritalStatusId];
    final step2 = [_countryId, _stateId, _cityId, _religionId, _sectId, _casteId];
    final step3 = [_designation, _company.text, _education.text, _institution.text, _incomeRangeId];
    final step4 = [_height.text, _weight.text, _complexion];
    final step5 = [_introduction.text.trim()];
    final step6 = [_photoFile != null || _hasProfilePhoto ? 'yes' : ''];

    final allSteps = [step1, step2, step3, step4, step5, step6];
    int totalFields = 0;
    int filledFields = 0;
    final stepComplete = <bool>[];

    for (final fields in allSteps) {
      final filled = fields.where(_filled).length;
      totalFields += fields.length;
      filledFields += filled;
      stepComplete.add(filled == fields.length);
    }

    final percentage = totalFields > 0 ? ((filledFields / totalFields) * 100).round() : 0;
    return (percentage: percentage, stepComplete: stepComplete);
  }

  // ── Validation per step ────────────────────────────────────────────────────

  bool _canProceed() {
    switch (_step) {
      case 1:
        return _firstName.text.trim().isNotEmpty &&
            _lastName.text.trim().isNotEmpty &&
            _gender.isNotEmpty &&
            _dateOfBirth != null &&
            _maritalStatusId != null;
      case 2:
        return _countryId != null &&
            _stateId != null &&
            _cityId != null &&
            _religionId != null &&
            _sectId != null &&
            _casteId != null;
      case 3:
        return _designation.isNotEmpty &&
            _company.text.trim().isNotEmpty &&
            _education.text.trim().isNotEmpty &&
            _institution.text.trim().isNotEmpty &&
            _incomeRangeId != null;
      case 4:
        return _height.text.trim().isNotEmpty &&
            _weight.text.trim().isNotEmpty &&
            _complexion.isNotEmpty;
      case 5:
        return _introduction.text.trim().isNotEmpty;
      case 6:
        return _photoFile != null || _hasProfilePhoto;
      default:
        return false;
    }
  }

  // ── Save step data ─────────────────────────────────────────────────────────

  Future<bool> _saveStepData() async {
    setState(() {
      _saving = true;
      _error = null;
    });

    try {
      // Save current step payload (steps 1-5)
      if (_step >= 1 && _step <= 5) {
        final payload = <String, dynamic>{};

        switch (_step) {
          case 1:
            payload['basics'] = {
              'firstName': _firstName.text.trim(),
              'lastName': _lastName.text.trim(),
              'gender': _gender,
              'dateOfBirth': _dateOfBirth != null
                  ? '${_dateOfBirth!.year}-${_dateOfBirth!.month.toString().padLeft(2, '0')}-${_dateOfBirth!.day.toString().padLeft(2, '0')}'
                  : null,
              'maritalStatusId': _maritalStatusId,
            };
            break;
          case 2:
            payload['basics'] = {
              'currentResidencyCountryId': _countryId,
              'currentResidencyStateId': _stateId,
              'currentResidencyCityId': _cityId,
            };
            payload['family'] = {
              'religionId': _religionId,
              'sectId': _sectId,
              'casteId': _casteId,
            };
            break;
          case 3:
            payload['career'] = {
              'designation': _designation,
              'company': _company.text.trim(),
              'education': _education.text.trim(),
              'institution': _institution.text.trim(),
              'incomeRangeId': _incomeRangeId,
              'jobTitleId': _jobTitleId,
              'specialityId': _specialityId,
              'careerPresent': true,
              'isHighestDegree': true,
            };
            break;
          case 4:
            payload['basics'] = {
              'height': _height.text.trim(),
              'weight': _weight.text.trim(),
              'complexion': _complexion,
            };
            break;
          case 5:
            payload['basics'] = {
              'introduction': _introduction.text.trim(),
            };
            break;
        }

        await _profileService.updateProfile(payload);
      }

      // Upload photo on step 6
      if (_step == 6 && _photoFile != null) {
        try {
          await _profileService.uploadProfilePicture(_photoFile!);
        } catch (e) {
          setState(() {
            _error = 'Photo upload failed. Please try again with a JPG, PNG, or WEBP under 10 MB.';
            _saving = false;
          });
          return false;
        }
      }

      // On final step, send ALL accumulated data + mark onboarding complete
      if (_step == _totalSteps) {
        final fullPayload = <String, dynamic>{
          'basics': {
            'firstName': _firstName.text.trim(),
            'lastName': _lastName.text.trim(),
            'gender': _gender,
            'dateOfBirth': _dateOfBirth != null
                ? '${_dateOfBirth!.year}-${_dateOfBirth!.month.toString().padLeft(2, '0')}-${_dateOfBirth!.day.toString().padLeft(2, '0')}'
                : null,
            'maritalStatusId': _maritalStatusId,
            'currentResidencyCountryId': _countryId,
            'currentResidencyStateId': _stateId,
            'currentResidencyCityId': _cityId,
            'height': _height.text.trim(),
            'weight': _weight.text.trim(),
            'complexion': _complexion,
            'introduction': _introduction.text.trim(),
          },
          'family': {
            'religionId': _religionId,
            'sectId': _sectId,
            'casteId': _casteId,
          },
          'career': {
            'designation': _designation,
            'company': _company.text.trim(),
            'education': _education.text.trim(),
            'institution': _institution.text.trim(),
            'incomeRangeId': _incomeRangeId,
            'jobTitleId': _jobTitleId,
            'specialityId': _specialityId,
            'careerPresent': true,
            'isHighestDegree': true,
          },
          'onboardingCompleted': true,
        };
        await _profileService.updateProfile(fullPayload);
      }

      if (mounted) setState(() => _saving = false);
      return true;
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Failed to save. Please check your data and try again.';
          _saving = false;
        });
      }
      return false;
    }
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  Future<void> _handleNext() async {
    final success = await _saveStepData();
    if (!success) return;

    if (_step < _totalSteps) {
      setState(() {
        _step++;
        _error = null;
      });
    } else {
      // Onboarding complete — refresh auth state and close
      ref.read(authProvider.notifier).setGateState(GateState.gateUnlocked);
      if (mounted) Navigator.of(context).pop();
    }
  }

  void _handleBack() {
    if (_step > 1) {
      setState(() {
        _step--;
        _error = null;
      });
    }
  }

  // ── Location helpers ───────────────────────────────────────────────────────

  Future<void> _onCountryChanged(int? countryId) async {
    setState(() {
      _countryId = countryId;
      _stateId = null;
      _cityId = null;
      _states = [];
      _cities = [];
    });
    if (countryId != null) {
      final states = await _profileService.getStates(countryId);
      if (mounted) setState(() => _states = states);
    }
  }

  Future<void> _onStateChanged(int? stateId) async {
    setState(() {
      _stateId = stateId;
      _cityId = null;
      _cities = [];
    });
    if (stateId != null) {
      final cities = await _profileService.getCities(stateId);
      if (mounted) setState(() => _cities = cities);
    }
  }

  // ── Photo picker ───────────────────────────────────────────────────────────

  Future<void> _pickPhoto() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 2048,
      maxHeight: 2048,
      imageQuality: 85,
    );
    if (picked != null) {
      final file = File(picked.path);
      final bytes = await file.length();
      if (bytes > 10 * 1024 * 1024) {
        setState(() => _error = 'Photo is too large. Maximum allowed size is 10 MB.');
        return;
      }
      setState(() {
        _photoFile = file;
        _photoPreviewPath = picked.path;
        _error = null;
      });
    }
  }

  // ── Date picker ────────────────────────────────────────────────────────────

  Future<void> _pickDateOfBirth() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _dateOfBirth ?? DateTime(now.year - 25),
      firstDate: DateTime(1950),
      lastDate: DateTime(now.year - 18, now.month, now.day),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: AppColors.primary,
              onPrimary: AppColors.white,
              surface: AppColors.white,
              onSurface: AppColors.slate900,
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() => _dateOfBirth = picked);
    }
  }

  // ── Build ──────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircularProgressIndicator(color: AppColors.primary),
            SizedBox(height: 16),
            Text(
              'Loading your profile...',
              style: TextStyle(fontSize: 14, color: AppColors.slate500),
            ),
          ],
        ),
      );
    }

    final completion = _computeCompletion();

    return Column(
      children: [
        // Drag handle
        const SizedBox(height: 8),
        Container(
          width: 40,
          height: 4,
          decoration: BoxDecoration(
            color: AppColors.slate300,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(height: 4),

        // Header with progress
        _buildHeader(completion),

        // Content
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Error banner
                if (_error != null) _buildErrorBanner(),

                // Step content
                _buildStepContent(),
              ],
            ),
          ),
        ),

        // Footer with nav buttons
        _buildFooter(),
      ],
    );
  }

  // ── Header ─────────────────────────────────────────────────────────────────

  Widget _buildHeader(({int percentage, List<bool> stepComplete}) completion) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [AppColors.primary.withOpacity(0.05), const Color(0xFFFDF2F8)],
        ),
        border: const Border(bottom: BorderSide(color: AppColors.slate100)),
      ),
      child: Column(
        children: [
          // Title row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(LucideIcons.sparkles, size: 20, color: AppColors.primary),
                        const SizedBox(width: 8),
                        const Text(
                          'Complete Profile',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            color: AppColors.slate900,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Step $_step of $_totalSteps - ${_steps[_step - 1].label}',
                      style: const TextStyle(fontSize: 12, color: AppColors.slate500),
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    '${completion.percentage}%',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w900,
                      color: completion.percentage == 100 ? AppColors.success : AppColors.primary,
                    ),
                  ),
                  const Text(
                    'COMPLETE',
                    style: TextStyle(
                      fontSize: 9,
                      fontWeight: FontWeight.w600,
                      color: AppColors.slate400,
                      letterSpacing: 1,
                    ),
                  ),
                ],
              ),
            ],
          ),

          const SizedBox(height: 12),

          // Step progress bars
          Row(
            children: List.generate(_totalSteps, (i) {
              final isComplete = completion.stepComplete[i];
              final isCurrent = i + 1 == _step;

              return Expanded(
                child: GestureDetector(
                  onTap: _saving ? null : () => setState(() => _step = i + 1),
                  child: Padding(
                    padding: EdgeInsets.only(left: i == 0 ? 0 : 3),
                    child: Column(
                      children: [
                        Container(
                          height: 5,
                          decoration: BoxDecoration(
                            color: isComplete
                                ? AppColors.success
                                : isCurrent
                                    ? AppColors.primary
                                    : AppColors.slate200,
                            borderRadius: BorderRadius.circular(3),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          _steps[i].label,
                          style: TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.w600,
                            color: isComplete
                                ? AppColors.success
                                : isCurrent
                                    ? AppColors.slate600
                                    : AppColors.slate400,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }),
          ),
        ],
      ),
    );
  }

  // ── Error banner ───────────────────────────────────────────────────────────

  Widget _buildErrorBanner() {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
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
              _error!,
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: AppColors.error),
            ),
          ),
        ],
      ),
    );
  }

  // ── Step content router ────────────────────────────────────────────────────

  Widget _buildStepContent() {
    switch (_step) {
      case 1:
        return _buildStep1Personal();
      case 2:
        return _buildStep2Location();
      case 3:
        return _buildStep3Career();
      case 4:
        return _buildStep4Appearance();
      case 5:
        return _buildStep5AboutMe();
      case 6:
        return _buildStep6Photo();
      default:
        return const SizedBox.shrink();
    }
  }

  // ── Step 1: Personal Info ──────────────────────────────────────────────────

  Widget _buildStep1Personal() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _stepTitle('Personal Information', 'Tell us about yourself to get started'),
        const SizedBox(height: 20),

        // First & Last name
        Row(
          children: [
            Expanded(
              child: DmbTextField(
                label: 'First Name',
                hint: 'Enter first name',
                controller: _firstName,
                onChanged: (_) => setState(() {}),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: DmbTextField(
                label: 'Last Name',
                hint: 'Enter last name',
                controller: _lastName,
                onChanged: (_) => setState(() {}),
              ),
            ),
          ],
        ),
        const SizedBox(height: 20),

        // Gender
        _fieldLabel('Gender'),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(child: _genderButton('Male', LucideIcons.user)),
            const SizedBox(width: 12),
            Expanded(child: _genderButton('Female', LucideIcons.user)),
          ],
        ),
        const SizedBox(height: 20),

        // DOB & Marital status
        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _fieldLabel('Date of Birth'),
                  const SizedBox(height: 6),
                  GestureDetector(
                    onTap: _pickDateOfBirth,
                    child: Container(
                      height: AppDecorations.inputHeight,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      decoration: BoxDecoration(
                        color: AppColors.white,
                        borderRadius: BorderRadius.circular(AppDecorations.radiusXl),
                        border: Border.all(color: AppColors.slate200),
                      ),
                      alignment: Alignment.centerLeft,
                      child: Text(
                        _dateOfBirth != null
                            ? '${_dateOfBirth!.year}-${_dateOfBirth!.month.toString().padLeft(2, '0')}-${_dateOfBirth!.day.toString().padLeft(2, '0')}'
                            : 'Select date',
                        style: TextStyle(
                          fontSize: 14,
                          color: _dateOfBirth != null ? AppColors.slate900 : AppColors.slate400,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _dropdownField(
                label: 'Marital Status',
                value: _maritalStatusId,
                items: _dropdowns.maritalStatuses,
                hint: 'Select status',
                onChanged: (v) => setState(() => _maritalStatusId = v),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _genderButton(String value, IconData icon) {
    final selected = _gender == value;
    return GestureDetector(
      onTap: () => setState(() => _gender = value),
      child: Container(
        height: 48,
        decoration: BoxDecoration(
          color: selected ? AppColors.primary.withOpacity(0.05) : AppColors.white,
          borderRadius: BorderRadius.circular(AppDecorations.radiusXl),
          border: Border.all(
            color: selected ? AppColors.primary : AppColors.slate200,
            width: selected ? 2 : 1,
          ),
        ),
        child: Center(
          child: Text(
            value,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: selected ? AppColors.primary : AppColors.slate500,
            ),
          ),
        ),
      ),
    );
  }

  // ── Step 2: Location & Religion ────────────────────────────────────────────

  Widget _buildStep2Location() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _stepTitle('Location & Background', 'Where are you based and your cultural background'),
        const SizedBox(height: 20),

        _dropdownField(
          label: 'Country',
          value: _countryId,
          items: _dropdowns.countries,
          hint: 'Select country',
          onChanged: (v) => _onCountryChanged(v),
        ),
        const SizedBox(height: 16),

        Row(
          children: [
            Expanded(
              child: _dropdownField(
                label: 'State / Province',
                value: _stateId,
                items: _states,
                hint: _states.isEmpty ? 'Select country first' : 'Select state',
                onChanged: _states.isEmpty ? null : (v) => _onStateChanged(v),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _dropdownField(
                label: 'City',
                value: _cityId,
                items: _cities,
                hint: _cities.isEmpty ? 'Select state first' : 'Select city',
                onChanged: _cities.isEmpty ? null : (v) => setState(() => _cityId = v),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),

        Row(
          children: [
            Expanded(
              child: _dropdownField(
                label: 'Religion',
                value: _religionId,
                items: _dropdowns.religions,
                hint: 'Select religion',
                onChanged: (v) {
                  setState(() {
                    _religionId = v;
                    _casteId = null;
                    _sectId = null;
                  });
                  if (v != null) {
                    _profileService.getCastes(v).then((list) {
                      if (mounted) setState(() => _castes = list);
                    });
                    _profileService.getSects(v).then((list) {
                      if (mounted) setState(() => _sects = list);
                    });
                  }
                },
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _dropdownField(
                label: 'Sect',
                value: _sectId,
                items: _sects,
                hint: _sects.isEmpty ? 'Select religion first' : 'Select sect',
                onChanged: _sects.isEmpty ? null : (v) => setState(() => _sectId = v),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),

        _dropdownField(
          label: 'Caste / Clan',
          value: _casteId,
          items: _castes,
          hint: _castes.isEmpty ? 'Select religion first' : 'Select caste',
          onChanged: _castes.isEmpty ? null : (v) => setState(() => _casteId = v),
        ),
      ],
    );
  }

  // ── Step 3: Career & Education ─────────────────────────────────────────────

  Widget _buildStep3Career() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _stepTitle('Career & Education', 'Your professional background'),
        const SizedBox(height: 20),

        Row(
          children: [
            Expanded(
              child: _dropdownField(
                label: 'Designation',
                value: _jobTitleId,
                items: _jobTitles,
                hint: 'Select designation',
                onChanged: (v) {
                  final label = _jobTitles
                      .where((o) => o.id == v)
                      .map((o) => o.name)
                      .firstOrNull ?? '';
                  setState(() {
                    _jobTitleId = v;
                    _designation = label;
                  });
                },
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _dropdownField(
                label: 'Speciality',
                value: _specialityId,
                items: _specialities,
                hint: 'Select speciality',
                onChanged: (v) => setState(() => _specialityId = v),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),

        DmbTextField(
          label: 'Hospital / Company',
          hint: 'e.g. Aga Khan Hospital',
          controller: _company,
          onChanged: (_) => setState(() {}),
        ),
        const SizedBox(height: 16),

        Row(
          children: [
            Expanded(
              child: DmbTextField(
                label: 'Highest Degree',
                hint: 'e.g. MBBS, FCPS',
                controller: _education,
                onChanged: (_) => setState(() {}),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: DmbTextField(
                label: 'Institution',
                hint: 'e.g. King Edward Medical',
                controller: _institution,
                onChanged: (_) => setState(() {}),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),

        _dropdownField(
          label: 'Income Range',
          value: _incomeRangeId,
          items: _salaryRanges,
          hint: 'Select income range',
          onChanged: (v) => setState(() => _incomeRangeId = v),
        ),
      ],
    );
  }

  // ── Step 4: Appearance ─────────────────────────────────────────────────────

  Widget _buildStep4Appearance() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _stepTitle('Physical Appearance', 'Helps find compatible matches'),
        const SizedBox(height: 20),

        Row(
          children: [
            Expanded(
              child: DmbTextField(
                label: 'Height',
                hint: "e.g. 5'8\"",
                controller: _height,
                onChanged: (_) => setState(() {}),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: DmbTextField(
                label: 'Weight (kg)',
                hint: 'e.g. 70',
                controller: _weight,
                keyboardType: TextInputType.number,
                onChanged: (_) => setState(() {}),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),

        _fieldLabel('Complexion'),
        const SizedBox(height: 8),
        _buildComplexionSelector(),
      ],
    );
  }

  Widget _buildComplexionSelector() {
    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: _complexionOptions.map((option) {
        final selected = _complexion == option;
        return GestureDetector(
          onTap: () => setState(() => _complexion = option),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            decoration: BoxDecoration(
              color: selected ? AppColors.primary.withOpacity(0.05) : AppColors.white,
              borderRadius: BorderRadius.circular(AppDecorations.radiusXl),
              border: Border.all(
                color: selected ? AppColors.primary : AppColors.slate200,
                width: selected ? 2 : 1,
              ),
            ),
            child: Text(
              option,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: selected ? AppColors.primary : AppColors.slate500,
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  // ── Step 5: About Me ───────────────────────────────────────────────────────

  Widget _buildStep5AboutMe() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _stepTitle('About Me', 'Write a short introduction about yourself'),
        const SizedBox(height: 20),

        _fieldLabel('Introduction'),
        const SizedBox(height: 6),
        TextFormField(
          controller: _introduction,
          maxLines: 7,
          maxLength: 1000,
          onChanged: (_) => setState(() {}),
          style: const TextStyle(fontSize: 14, color: AppColors.slate900),
          decoration: InputDecoration(
            hintText: 'Tell potential matches about yourself, your personality, interests, and what you are looking for...',
            hintStyle: const TextStyle(color: AppColors.slate400),
            contentPadding: const EdgeInsets.all(16),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppDecorations.radiusXl),
              borderSide: const BorderSide(color: AppColors.slate200),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppDecorations.radiusXl),
              borderSide: const BorderSide(color: AppColors.slate200),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppDecorations.radiusXl),
              borderSide: const BorderSide(color: AppColors.primary, width: 2),
            ),
            counterStyle: const TextStyle(fontSize: 11, color: AppColors.slate400),
          ),
        ),
      ],
    );
  }

  // ── Step 6: Photo Upload ───────────────────────────────────────────────────

  Widget _buildStep6Photo() {
    final hasPhoto = _photoPreviewPath != null || _hasProfilePhoto;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _stepTitle('Profile Photo', 'Add a clear photo to make a great first impression'),
        const SizedBox(height: 24),

        Center(
          child: Column(
            children: [
              // Avatar preview
              Stack(
                children: [
                  Container(
                    width: 160,
                    height: 160,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: AppColors.slate100,
                      border: Border.all(color: AppColors.white, width: 4),
                      boxShadow: AppDecorations.shadowLg,
                      image: _photoPreviewPath != null
                          ? DecorationImage(
                              image: FileImage(File(_photoPreviewPath!)),
                              fit: BoxFit.cover,
                            )
                          : (_hasProfilePhoto && _existingAvatarUrl != null && _existingAvatarUrl!.isNotEmpty)
                              ? DecorationImage(
                                  image: NetworkImage(_existingAvatarUrl!),
                                  fit: BoxFit.cover,
                                )
                              : null,
                    ),
                    child: (!hasPhoto)
                        ? const Center(
                            child: Icon(LucideIcons.camera, size: 48, color: AppColors.slate300),
                          )
                        : null,
                  ),
                  if (hasPhoto)
                    Positioned(
                      bottom: 4,
                      right: 4,
                      child: Container(
                        width: 32,
                        height: 32,
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          color: AppColors.success,
                          boxShadow: AppDecorations.shadowSm,
                        ),
                        child: const Icon(LucideIcons.check, size: 16, color: AppColors.white),
                      ),
                    ),
                ],
              ),

              const SizedBox(height: 24),

              // Upload button
              GestureDetector(
                onTap: _pickPhoto,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                  decoration: BoxDecoration(
                    color: AppColors.slate100,
                    borderRadius: BorderRadius.circular(AppDecorations.radiusXl),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(LucideIcons.upload, size: 16, color: AppColors.slate700),
                      const SizedBox(width: 8),
                      Text(
                        hasPhoto ? 'Change Photo' : 'Upload Photo',
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: AppColors.slate700,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 16),

              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 32),
                child: Text(
                  'Upload a clear, recent photo of yourself. This helps build trust with potential matches. Max 10 MB.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 12, color: AppColors.slate400),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // ── Footer ─────────────────────────────────────────────────────────────────

  Widget _buildFooter() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
      decoration: BoxDecoration(
        color: AppColors.slate50.withOpacity(0.8),
        border: const Border(top: BorderSide(color: AppColors.slate100)),
      ),
      child: SafeArea(
        top: false,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            // Back button
            GestureDetector(
              onTap: (_step == 1 || _saving) ? null : _handleBack,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(AppDecorations.radiusFull),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      LucideIcons.arrowLeft,
                      size: 16,
                      color: _step == 1 ? AppColors.slate300 : AppColors.slate600,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      'Back',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: _step == 1 ? AppColors.slate300 : AppColors.slate600,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Next / Complete button
            GestureDetector(
              onTap: (_saving || !_canProceed()) ? null : _handleNext,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
                decoration: BoxDecoration(
                  color: (_saving || !_canProceed())
                      ? AppColors.primary.withOpacity(0.5)
                      : AppColors.primary,
                  borderRadius: BorderRadius.circular(AppDecorations.radiusFull),
                  boxShadow: (_saving || !_canProceed())
                      ? null
                      : [BoxShadow(color: AppColors.primary.withOpacity(0.2), blurRadius: 12, offset: const Offset(0, 4))],
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (_saving) ...[
                      const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: AppColors.white,
                        ),
                      ),
                      const SizedBox(width: 8),
                      const Text(
                        'Saving...',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: AppColors.white,
                        ),
                      ),
                    ] else if (_step == _totalSteps) ...[
                      const Icon(LucideIcons.check, size: 16, color: AppColors.white),
                      const SizedBox(width: 8),
                      const Text(
                        'Complete Setup',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: AppColors.white,
                        ),
                      ),
                    ] else ...[
                      const Text(
                        'Continue',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: AppColors.white,
                        ),
                      ),
                      const SizedBox(width: 8),
                      const Icon(LucideIcons.arrowRight, size: 16, color: AppColors.white),
                    ],
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Shared building blocks ─────────────────────────────────────────────────

  Widget _stepTitle(String title, String subtitle) {
    return Column(
      children: [
        Text(
          title,
          textAlign: TextAlign.center,
          style: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: AppColors.slate900,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          subtitle,
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 14, color: AppColors.slate500),
        ),
      ],
    );
  }

  Widget _fieldLabel(String label) {
    return Text(
      label.toUpperCase(),
      style: const TextStyle(
        fontSize: 11,
        fontWeight: FontWeight.w700,
        color: AppColors.slate600,
        letterSpacing: 0.5,
      ),
    );
  }

  Widget _dropdownField({
    required String label,
    required int? value,
    required List<DropdownOption> items,
    required String hint,
    required void Function(int?)? onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        _fieldLabel(label),
        const SizedBox(height: 6),
        Container(
          height: AppDecorations.inputHeight,
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            color: AppColors.white,
            borderRadius: BorderRadius.circular(AppDecorations.radiusXl),
            border: Border.all(color: AppColors.slate200),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<int>(
              value: (value != null && items.any((i) => i.id == value)) ? value : null,
              isExpanded: true,
              hint: Text(
                hint,
                style: const TextStyle(fontSize: 14, color: AppColors.slate400),
                overflow: TextOverflow.ellipsis,
              ),
              icon: const Icon(LucideIcons.chevronDown, size: 16, color: AppColors.slate400),
              style: const TextStyle(fontSize: 14, color: AppColors.slate900),
              dropdownColor: AppColors.white,
              borderRadius: BorderRadius.circular(AppDecorations.radiusXl),
              items: items
                  .map((item) => DropdownMenuItem<int>(
                        value: item.id,
                        child: Text(item.name, overflow: TextOverflow.ellipsis),
                      ))
                  .toList(),
              onChanged: onChanged,
            ),
          ),
        ),
      ],
    );
  }
}
