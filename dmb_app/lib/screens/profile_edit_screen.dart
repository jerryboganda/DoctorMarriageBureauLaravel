import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../config/api_config.dart';
import '../models/dropdown_data.dart';
import '../providers/auth_provider.dart';
import '../services/profile_service.dart';
import '../theme/app_colors.dart';
import '../theme/app_decorations.dart';
import '../widgets/dmb_button.dart';
import '../widgets/dmb_text_field.dart';

// ── Provider for ProfileService ──
final _profileServiceProvider = Provider<ProfileService>((ref) {
  return ProfileService(ref.read(apiServiceProvider));
});

/// Profile edit screen -- 7 tabs matching ProfileEditView.tsx
class ProfileEditScreen extends ConsumerStatefulWidget {
  const ProfileEditScreen({super.key});

  @override
  ConsumerState<ProfileEditScreen> createState() => _ProfileEditScreenState();
}

class _ProfileEditScreenState extends ConsumerState<ProfileEditScreen> {
  int _activeTab = 0;
  bool _loading = true;
  bool _saving = false;
  double _qualityScore = 0;

  final _tabs = [
    'Basics',
    'Lifestyle',
    'Career',
    'Family',
    'Expectations',
    'Media',
    'Visibility',
  ];

  // ── Profile data map ──
  Map<String, dynamic> _profileData = {};

  // ── Dropdown data ──
  ProfileDropdownData _dropdowns = const ProfileDropdownData();
  List<DropdownOption> _sects = [];
  List<DropdownOption> _castes = [];
  List<DropdownOption> _subCastes = [];

  // ── Gallery ──
  List<Map<String, dynamic>> _galleryImages = [];
  bool _galleryLoading = false;

  // ── Visibility toggles ──
  Map<String, bool> _visibilityMap = {};

  // ── Form key for validation ──
  final _formKey = GlobalKey<FormState>();

  // ── Text controllers (created on demand per tab) ──
  final Map<String, TextEditingController> _controllers = {};

  ProfileService get _profileService => ref.read(_profileServiceProvider);

  @override
  void initState() {
    super.initState();
    _loadAllData();
  }

  @override
  void dispose() {
    for (final c in _controllers.values) {
      c.dispose();
    }
    super.dispose();
  }

  // ── Controller helper ──
  TextEditingController _ctrl(String key) {
    if (!_controllers.containsKey(key)) {
      final value = _profileData[key]?.toString() ?? '';
      _controllers[key] = TextEditingController(text: value);
    }
    return _controllers[key]!;
  }

  // ── Sync controller text back to profile data ──
  void _syncField(String key, String value) {
    _profileData[key] = value;
  }

  // ── Data loading ──
  Future<void> _loadAllData() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        _profileService.getFullProfile(),
        _profileService.getProfileDropdowns(),
        _loadQualityScore(),
      ]);
      final profile = results[0] as Map<String, dynamic>;
      final dropdowns = results[1] as ProfileDropdownData;

      _profileData = profile['data'] is Map<String, dynamic>
          ? profile['data'] as Map<String, dynamic>
          : profile;
      _dropdowns = dropdowns;

      // Sync existing controllers
      for (final key in _controllers.keys) {
        _controllers[key]!.text = _profileData[key]?.toString() ?? '';
      }

      // Load dependent dropdowns
      final religionId = _intVal('religion_id');
      if (religionId != null) {
        _sects = await _profileService.getSects(religionId);
        _castes = await _profileService.getCastes(religionId);
      }

      // Parse visibility from profile
      _parseVisibility();
    } catch (e) {
      _showSnack('Failed to load profile: $e', isError: true);
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<double> _loadQualityScore() async {
    try {
      final api = ref.read(apiServiceProvider);
      final resp = await api.get('/member/profile/quality-score');
      final data = resp.data is Map<String, dynamic> ? resp.data : {};
      final score = data['score'] ?? data['quality_score'] ?? 0;
      _qualityScore = (score is num ? score.toDouble() : 0).clamp(0, 100);
    } catch (_) {
      _qualityScore = 0;
    }
    return _qualityScore;
  }

  void _parseVisibility() {
    final vis = _profileData['visibility'];
    if (vis is Map<String, dynamic>) {
      _visibilityMap = vis.map((k, v) => MapEntry(k, v == true || v == 1));
    } else {
      // Default visible fields
      _visibilityMap = {
        'phone': false,
        'email': false,
        'date_of_birth': true,
        'income': false,
        'photos': true,
        'family_details': true,
        'career_details': true,
        'contact_info': false,
        'location': true,
        'education': true,
        'lifestyle': true,
      };
    }
  }

  // ── Helpers ──
  int? _intVal(String key) {
    final v = _profileData[key];
    if (v == null) return null;
    if (v is int) return v;
    return int.tryParse(v.toString());
  }

  String _strVal(String key) => _profileData[key]?.toString() ?? '';

  void _setField(String key, dynamic value) {
    setState(() {
      _profileData[key] = value;
      if (_controllers.containsKey(key)) {
        _controllers[key]!.text = value?.toString() ?? '';
      }
    });
  }

  void _showSnack(String msg, {bool isError = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg),
      backgroundColor: isError ? AppColors.error : AppColors.success,
      behavior: SnackBarBehavior.floating,
      margin: const EdgeInsets.all(16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
    ));
  }

  // ── Save profile ──
  Future<void> _saveProfile() async {
    if (_saving) return;
    if (!(_formKey.currentState?.validate() ?? true)) return;

    // Sync all controller values
    for (final entry in _controllers.entries) {
      _profileData[entry.key] = entry.value.text;
    }

    setState(() => _saving = true);
    try {
      await _profileService.updateProfile(_profileData);
      _showSnack('Profile updated successfully');
      // Refresh quality score
      await _loadQualityScore();
      setState(() {});
    } catch (e) {
      _showSnack('Failed to save profile: $e', isError: true);
    } finally {
      setState(() => _saving = false);
    }
  }

  // ── Visibility toggle ──
  Future<void> _toggleVisibility(String field) async {
    final newVal = !(_visibilityMap[field] ?? true);
    setState(() => _visibilityMap[field] = newVal);
    try {
      final api = ref.read(apiServiceProvider);
      await api.post('/member/profile/visibility', data: {
        'field_name': field,
        'is_visible': newVal ? 1 : 0,
      });
    } catch (e) {
      setState(() => _visibilityMap[field] = !newVal);
      _showSnack('Failed to update visibility', isError: true);
    }
  }

  // ── Gallery ──
  Future<void> _loadGallery() async {
    setState(() => _galleryLoading = true);
    try {
      _galleryImages = await _profileService.getGalleryImages();
    } catch (_) {}
    setState(() => _galleryLoading = false);
  }

  Future<void> _uploadGalleryImage() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 1200,
      imageQuality: 85,
    );
    if (picked == null) return;
    setState(() => _galleryLoading = true);
    try {
      await _profileService.uploadGalleryImage(File(picked.path));
      await _loadGallery();
      _showSnack('Image uploaded successfully');
    } catch (e) {
      _showSnack('Failed to upload image', isError: true);
    }
    setState(() => _galleryLoading = false);
  }

  Future<void> _deleteGalleryImage(int imageId) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Photo'),
        content: const Text('Are you sure you want to delete this photo?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete', style: TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );
    if (confirm != true) return;
    try {
      await _profileService.deleteGalleryImage(imageId);
      await _loadGallery();
      _showSnack('Photo deleted');
    } catch (e) {
      _showSnack('Failed to delete photo', isError: true);
    }
  }

  Future<void> _setAsPrimary(int imageId) async {
    try {
      await _profileService.setPrimaryPhoto(imageId);
      await _loadGallery();
      _showSnack('Profile photo updated');
    } catch (e) {
      _showSnack('Failed to set profile photo', isError: true);
    }
  }

  Future<void> _toggleImagePrivacy(int imageId) async {
    try {
      await _profileService.toggleImagePrivacy(imageId);
      await _loadGallery();
    } catch (e) {
      _showSnack('Failed to update privacy', isError: true);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // BUILD
  // ═══════════════════════════════════════════════════════════
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // ── Quality score bar ──
        _buildQualityBar(),
        // ── Tab chips ──
        _buildTabChips(),
        // ── Tab content ──
        Expanded(
          child: _loading
              ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
              : Form(
                  key: _formKey,
                  child: _buildActiveTab(),
                ),
        ),
      ],
    );
  }

  // ── Quality Score Bar ──
  Widget _buildQualityBar() {
    final pct = _qualityScore.round();
    final color = pct >= 80
        ? AppColors.success
        : pct >= 50
            ? AppColors.warning
            : AppColors.error;
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(LucideIcons.barChart3, size: 16, color: color),
              const SizedBox(width: 6),
              Text(
                'Profile Quality: $pct%',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: color,
                ),
              ),
              const Spacer(),
              Text(
                pct >= 80
                    ? 'Excellent'
                    : pct >= 50
                        ? 'Good'
                        : 'Needs work',
                style: TextStyle(fontSize: 12, color: AppColors.slate500),
              ),
            ],
          ),
          const SizedBox(height: 6),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: _qualityScore / 100,
              minHeight: 6,
              backgroundColor: AppColors.slate200,
              valueColor: AlwaysStoppedAnimation<Color>(color),
            ),
          ),
        ],
      ),
    );
  }

  // ── Tab Chips ──
  Widget _buildTabChips() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: List.generate(_tabs.length, (i) {
            final isActive = i == _activeTab;
            return Padding(
              padding: const EdgeInsets.only(right: 8),
              child: GestureDetector(
                onTap: () {
                  setState(() => _activeTab = i);
                  // Load gallery when Media tab selected
                  if (i == 5 && _galleryImages.isEmpty) _loadGallery();
                },
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: isActive ? AppColors.primary : AppColors.slate100,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    _tabs[i],
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: isActive ? AppColors.white : AppColors.slate600,
                    ),
                  ),
                ),
              ),
            );
          }),
        ),
      ),
    );
  }

  Widget _buildActiveTab() {
    switch (_activeTab) {
      case 0:
        return _buildBasicsTab();
      case 1:
        return _buildLifestyleTab();
      case 2:
        return _buildCareerTab();
      case 3:
        return _buildFamilyTab();
      case 4:
        return _buildExpectationsTab();
      case 5:
        return _buildMediaTab();
      case 6:
        return _buildVisibilityTab();
      default:
        return const SizedBox.shrink();
    }
  }

  // ═══════════════════════════════════════════════════════════
  // SHARED BUILDERS
  // ═══════════════════════════════════════════════════════════

  /// Wraps tab content in a scrollable column with save button at bottom
  Widget _tabScaffold({required List<Widget> children}) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
      children: [
        ...children,
        const SizedBox(height: 24),
        DmbButton(
          text: 'Save Changes',
          icon: LucideIcons.save,
          isLoading: _saving,
          onPressed: _saving ? null : _saveProfile,
        ),
      ],
    );
  }

  Widget _sectionTitle(String title, {IconData? icon}) {
    return Padding(
      padding: const EdgeInsets.only(top: 20, bottom: 12),
      child: Row(
        children: [
          if (icon != null) ...[
            Icon(icon, size: 18, color: AppColors.primary),
            const SizedBox(width: 8),
          ],
          Text(
            title,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: AppColors.slate800,
            ),
          ),
        ],
      ),
    );
  }

  Widget _gap([double h = 16]) => SizedBox(height: h);

  /// Static dropdown from a list of string values
  Widget _staticDropdown({
    required String label,
    required String fieldKey,
    required List<String> items,
    String? hint,
  }) {
    final currentVal = _strVal(fieldKey);
    final matchedVal = items.contains(currentVal) ? currentVal : null;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(label, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: AppColors.slate700)),
        const SizedBox(height: 6),
        DropdownButtonFormField<String>(
          value: matchedVal,
          hint: Text(hint ?? 'Select $label', style: const TextStyle(fontSize: 14, color: AppColors.slate400)),
          isExpanded: true,
          decoration: InputDecoration(
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 0),
            constraints: const BoxConstraints(minHeight: AppDecorations.inputHeight),
          ),
          items: items.map((v) => DropdownMenuItem(value: v, child: Text(v, style: const TextStyle(fontSize: 14)))).toList(),
          onChanged: (v) => _setField(fieldKey, v),
        ),
      ],
    );
  }

  /// API-driven dropdown from DropdownOption list
  Widget _apiDropdown({
    required String label,
    required String fieldKey,
    required List<DropdownOption> options,
    String? hint,
    ValueChanged<DropdownOption?>? onChanged,
  }) {
    final currentId = _intVal(fieldKey);
    final matchedVal = options.any((o) => o.id == currentId) ? currentId : null;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(label, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: AppColors.slate700)),
        const SizedBox(height: 6),
        DropdownButtonFormField<int>(
          value: matchedVal,
          hint: Text(hint ?? 'Select $label', style: const TextStyle(fontSize: 14, color: AppColors.slate400)),
          isExpanded: true,
          decoration: InputDecoration(
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 0),
            constraints: const BoxConstraints(minHeight: AppDecorations.inputHeight),
          ),
          items: options
              .map((o) => DropdownMenuItem(value: o.id, child: Text(o.name, style: const TextStyle(fontSize: 14))))
              .toList(),
          onChanged: (v) {
            _setField(fieldKey, v);
            if (onChanged != null) {
              final selected = options.firstWhere((o) => o.id == v, orElse: () => const DropdownOption(id: 0, name: ''));
              onChanged(selected);
            }
          },
        ),
      ],
    );
  }

  /// Switch row
  Widget _switchField({required String label, required String fieldKey, String? subtitle}) {
    final val = _profileData[fieldKey] == true ||
        _profileData[fieldKey] == 1 ||
        _profileData[fieldKey] == '1' ||
        _profileData[fieldKey] == 'yes';
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: AppColors.slate700)),
                if (subtitle != null)
                  Text(subtitle, style: const TextStyle(fontSize: 12, color: AppColors.slate400)),
              ],
            ),
          ),
          Switch(
            value: val,
            activeColor: AppColors.primary,
            onChanged: (v) => _setField(fieldKey, v),
          ),
        ],
      ),
    );
  }

  /// Date picker field
  Widget _dateField({required String label, required String fieldKey}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(label, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: AppColors.slate700)),
        const SizedBox(height: 6),
        GestureDetector(
          onTap: () async {
            final now = DateTime.now();
            final initial = DateTime.tryParse(_strVal(fieldKey)) ?? DateTime(now.year - 25);
            final picked = await showDatePicker(
              context: context,
              initialDate: initial,
              firstDate: DateTime(1950),
              lastDate: now,
              builder: (ctx, child) => Theme(
                data: Theme.of(ctx).copyWith(
                  colorScheme: const ColorScheme.light(primary: AppColors.primary),
                ),
                child: child!,
              ),
            );
            if (picked != null) {
              _setField(fieldKey, '${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}');
            }
          },
          child: AbsorbPointer(
            child: DmbTextField(
              controller: _ctrl(fieldKey),
              hint: 'YYYY-MM-DD',
              readOnly: true,
              suffix: const Icon(LucideIcons.calendar, size: 18, color: AppColors.slate400),
            ),
          ),
        ),
      ],
    );
  }

  // ═══════════════════════════════════════════════════════════
  // TAB 1 - BASICS
  // ═══════════════════════════════════════════════════════════
  Widget _buildBasicsTab() {
    return _tabScaffold(
      children: [
        _sectionTitle('Basic Information', icon: LucideIcons.user),
        DmbTextField(
          label: 'First Name',
          hint: 'Enter first name',
          controller: _ctrl('first_name'),
          onChanged: (v) => _syncField('first_name', v),
          validator: (v) => (v == null || v.isEmpty) ? 'First name is required' : null,
        ),
        _gap(),
        DmbTextField(
          label: 'Last Name',
          hint: 'Enter last name',
          controller: _ctrl('last_name'),
          onChanged: (v) => _syncField('last_name', v),
          validator: (v) => (v == null || v.isEmpty) ? 'Last name is required' : null,
        ),
        _gap(),
        _dateField(label: 'Date of Birth', fieldKey: 'date_of_birth'),
        _gap(),
        _staticDropdown(
          label: 'Gender',
          fieldKey: 'gender',
          items: ['Male', 'Female'],
        ),
        _gap(),
        _apiDropdown(
          label: 'Marital Status',
          fieldKey: 'marital_status_id',
          options: _dropdowns.maritalStatuses,
        ),
        _gap(),
        _sectionTitle('Physical Attributes', icon: LucideIcons.ruler),
        Row(
          children: [
            Expanded(
              flex: 2,
              child: DmbTextField(
                label: 'Height',
                hint: 'e.g. 5\'8"',
                controller: _ctrl('height'),
                onChanged: (v) => _syncField('height', v),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _staticDropdown(
                label: 'Unit',
                fieldKey: 'height_unit',
                items: ['ft/in', 'cm'],
              ),
            ),
          ],
        ),
        _gap(),
        DmbTextField(
          label: 'Weight (kg)',
          hint: 'Enter weight',
          controller: _ctrl('weight'),
          onChanged: (v) => _syncField('weight', v),
          keyboardType: TextInputType.number,
        ),
        _gap(),
        _staticDropdown(
          label: 'Complexion',
          fieldKey: 'complexion',
          items: ['Fair', 'Wheatish', 'Dark'],
        ),
        _gap(),
        _staticDropdown(
          label: 'Body Type',
          fieldKey: 'body_type',
          items: ['Slim', 'Average', 'Athletic', 'Heavy'],
        ),
        _gap(),
        _staticDropdown(
          label: 'Blood Group',
          fieldKey: 'blood_group',
          items: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
        ),
      ],
    );
  }

  // ═══════════════════════════════════════════════════════════
  // TAB 2 - LIFESTYLE
  // ═══════════════════════════════════════════════════════════
  Widget _buildLifestyleTab() {
    return _tabScaffold(
      children: [
        _sectionTitle('Lifestyle & Habits', icon: LucideIcons.heart),
        _staticDropdown(
          label: 'Diet',
          fieldKey: 'diet',
          items: ['Vegetarian', 'Non-Vegetarian', 'Vegan'],
        ),
        _gap(),
        _switchField(label: 'Smoking', fieldKey: 'smoking', subtitle: 'Do you smoke?'),
        _switchField(label: 'Alcohol', fieldKey: 'alcohol', subtitle: 'Do you consume alcohol?'),
        _gap(),
        _staticDropdown(
          label: 'Exercise Frequency',
          fieldKey: 'exercise_frequency',
          items: ['Daily', 'Weekly', 'Monthly', 'Never'],
        ),
        _gap(),
        DmbTextField(
          label: 'Hobbies',
          hint: 'e.g. Reading, Traveling, Cooking',
          controller: _ctrl('hobbies'),
          onChanged: (v) => _syncField('hobbies', v),
          maxLines: 2,
        ),
        _gap(),
        DmbTextField(
          label: 'Interests',
          hint: 'e.g. Medicine, Technology, Sports',
          controller: _ctrl('interests'),
          onChanged: (v) => _syncField('interests', v),
          maxLines: 2,
        ),
      ],
    );
  }

  // ═══════════════════════════════════════════════════════════
  // TAB 3 - CAREER
  // ═══════════════════════════════════════════════════════════
  Widget _buildCareerTab() {
    return _tabScaffold(
      children: [
        _sectionTitle('Employment', icon: LucideIcons.briefcase),
        _staticDropdown(
          label: 'Employment Status',
          fieldKey: 'employment_status',
          items: ['Employed', 'Self-employed', 'Student', 'Unemployed'],
        ),
        _gap(),
        DmbTextField(
          label: 'Job Title',
          hint: 'e.g. Cardiologist, Surgeon',
          controller: _ctrl('job_title'),
          onChanged: (v) => _syncField('job_title', v),
        ),
        _gap(),
        DmbTextField(
          label: 'Speciality',
          hint: 'e.g. Cardiology, Orthopedics',
          controller: _ctrl('speciality'),
          onChanged: (v) => _syncField('speciality', v),
        ),
        _gap(),
        DmbTextField(
          label: 'Company / Hospital Name',
          hint: 'Where do you work?',
          controller: _ctrl('company_name'),
          onChanged: (v) => _syncField('company_name', v),
        ),
        _gap(),
        _staticDropdown(
          label: 'Industry',
          fieldKey: 'industry',
          items: [
            'Healthcare',
            'Pharmaceuticals',
            'Education',
            'Research',
            'Government',
            'Private Practice',
            'NGO / Non-Profit',
            'Other',
          ],
        ),
        _gap(),
        _staticDropdown(
          label: 'Annual Income',
          fieldKey: 'annual_income',
          items: [
            'Below 5 Lakh',
            '5-10 Lakh',
            '10-20 Lakh',
            '20-30 Lakh',
            '30-50 Lakh',
            '50-75 Lakh',
            '75 Lakh - 1 Crore',
            'Above 1 Crore',
            'Prefer not to say',
          ],
        ),
        _gap(),
        _sectionTitle('Education', icon: LucideIcons.graduationCap),
        _staticDropdown(
          label: 'Education Level',
          fieldKey: 'education_level',
          items: ['MBBS', 'BDS', 'FCPS', 'MRCP', 'FRCS', 'MD', 'MS', 'PhD', 'Other'],
        ),
        _gap(),
        DmbTextField(
          label: 'Field of Study',
          hint: 'e.g. General Surgery',
          controller: _ctrl('field_of_study'),
          onChanged: (v) => _syncField('field_of_study', v),
        ),
        _gap(),
        DmbTextField(
          label: 'University',
          hint: 'University name',
          controller: _ctrl('university'),
          onChanged: (v) => _syncField('university', v),
        ),
        _gap(),
        DmbTextField(
          label: 'Graduation Year',
          hint: 'e.g. 2020',
          controller: _ctrl('graduation_year'),
          onChanged: (v) => _syncField('graduation_year', v),
          keyboardType: TextInputType.number,
        ),
      ],
    );
  }

  // ═══════════════════════════════════════════════════════════
  // TAB 4 - FAMILY
  // ═══════════════════════════════════════════════════════════
  Widget _buildFamilyTab() {
    return _tabScaffold(
      children: [
        _sectionTitle('Family Details', icon: LucideIcons.users),
        DmbTextField(
          label: 'Father\'s Name',
          hint: 'Enter father\'s name',
          controller: _ctrl('father_name'),
          onChanged: (v) => _syncField('father_name', v),
        ),
        _gap(),
        DmbTextField(
          label: 'Mother\'s Name',
          hint: 'Enter mother\'s name',
          controller: _ctrl('mother_name'),
          onChanged: (v) => _syncField('mother_name', v),
        ),
        _gap(),
        DmbTextField(
          label: 'Father\'s Occupation',
          hint: 'e.g. Doctor, Engineer',
          controller: _ctrl('father_occupation'),
          onChanged: (v) => _syncField('father_occupation', v),
        ),
        _gap(),
        DmbTextField(
          label: 'Mother\'s Occupation',
          hint: 'e.g. Housewife, Teacher',
          controller: _ctrl('mother_occupation'),
          onChanged: (v) => _syncField('mother_occupation', v),
        ),
        _gap(),
        DmbTextField(
          label: 'Number of Siblings',
          hint: 'e.g. 3',
          controller: _ctrl('siblings_count'),
          onChanged: (v) => _syncField('siblings_count', v),
          keyboardType: TextInputType.number,
        ),
        _gap(),
        _staticDropdown(
          label: 'Family Status',
          fieldKey: 'family_status',
          items: ['Joint', 'Nuclear'],
        ),
        _gap(),
        _apiDropdown(
          label: 'Family Values',
          fieldKey: 'family_value_id',
          options: _dropdowns.familyValues,
        ),
        _gap(),
        _sectionTitle('Religion & Caste', icon: LucideIcons.bookOpen),
        _apiDropdown(
          label: 'Religion',
          fieldKey: 'religion_id',
          options: _dropdowns.religions,
          onChanged: (opt) async {
            if (opt == null || opt.id == 0) return;
            setState(() {
              _sects = [];
              _castes = [];
              _subCastes = [];
              _profileData['sect_id'] = null;
              _profileData['caste_id'] = null;
              _profileData['sub_caste_id'] = null;
            });
            try {
              final results = await Future.wait([
                _profileService.getSects(opt.id),
                _profileService.getCastes(opt.id),
              ]);
              setState(() {
                _sects = results[0];
                _castes = results[1];
              });
            } catch (_) {}
          },
        ),
        _gap(),
        _apiDropdown(
          label: 'Sect',
          fieldKey: 'sect_id',
          options: _sects,
          hint: _sects.isEmpty ? 'Select religion first' : null,
        ),
        _gap(),
        _apiDropdown(
          label: 'Caste',
          fieldKey: 'caste_id',
          options: _castes,
          hint: _castes.isEmpty ? 'Select religion first' : null,
          onChanged: (opt) async {
            if (opt == null || opt.id == 0) return;
            setState(() {
              _subCastes = [];
              _profileData['sub_caste_id'] = null;
            });
            // Sub-castes could be loaded from a dedicated endpoint if available
            // For now, we leave it as a text field fallback
          },
        ),
        _gap(),
        DmbTextField(
          label: 'Sub Caste',
          hint: 'Enter sub caste',
          controller: _ctrl('sub_caste'),
          onChanged: (v) => _syncField('sub_caste', v),
        ),
      ],
    );
  }

  // ═══════════════════════════════════════════════════════════
  // TAB 5 - EXPECTATIONS
  // ═══════════════════════════════════════════════════════════
  Widget _buildExpectationsTab() {
    return _tabScaffold(
      children: [
        _sectionTitle('Partner Preferences', icon: LucideIcons.heartHandshake),
        _staticDropdown(
          label: 'Looking For',
          fieldKey: 'looking_for',
          items: ['Life Partner', 'Friendship', 'Networking'],
        ),
        _gap(),
        Row(
          children: [
            Expanded(
              child: DmbTextField(
                label: 'Preferred Age (Min)',
                hint: 'e.g. 24',
                controller: _ctrl('preferred_age_min'),
                onChanged: (v) => _syncField('preferred_age_min', v),
                keyboardType: TextInputType.number,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: DmbTextField(
                label: 'Preferred Age (Max)',
                hint: 'e.g. 32',
                controller: _ctrl('preferred_age_max'),
                onChanged: (v) => _syncField('preferred_age_max', v),
                keyboardType: TextInputType.number,
              ),
            ),
          ],
        ),
        _gap(),
        Row(
          children: [
            Expanded(
              child: DmbTextField(
                label: 'Height Min',
                hint: 'e.g. 5\'2"',
                controller: _ctrl('preferred_height_min'),
                onChanged: (v) => _syncField('preferred_height_min', v),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: DmbTextField(
                label: 'Height Max',
                hint: 'e.g. 6\'0"',
                controller: _ctrl('preferred_height_max'),
                onChanged: (v) => _syncField('preferred_height_max', v),
              ),
            ),
          ],
        ),
        _gap(),
        _sectionTitle('Preferred Education', icon: LucideIcons.graduationCap),
        _buildEducationChips(),
        _gap(),
        DmbTextField(
          label: 'Preferred Location',
          hint: 'e.g. Lahore, Islamabad',
          controller: _ctrl('preferred_location'),
          onChanged: (v) => _syncField('preferred_location', v),
        ),
        _gap(),
        _sectionTitle('Detailed Preferences', icon: LucideIcons.listChecks),
        DmbTextField(
          label: 'Must-Have Preferences',
          hint: 'What qualities are non-negotiable?',
          controller: _ctrl('must_have_preferences'),
          onChanged: (v) => _syncField('must_have_preferences', v),
          maxLines: 3,
        ),
        _gap(),
        DmbTextField(
          label: 'Nice to Have',
          hint: 'What qualities would be a bonus?',
          controller: _ctrl('nice_to_have'),
          onChanged: (v) => _syncField('nice_to_have', v),
          maxLines: 3,
        ),
        _gap(),
        DmbTextField(
          label: 'Dealbreakers',
          hint: 'What would be absolute dealbreakers?',
          controller: _ctrl('dealbreakers'),
          onChanged: (v) => _syncField('dealbreakers', v),
          maxLines: 3,
        ),
      ],
    );
  }

  /// Multi-chip select for preferred education
  Widget _buildEducationChips() {
    const educationOptions = [
      'MBBS', 'BDS', 'FCPS', 'MRCP', 'FRCS', 'MD', 'MS', 'PhD', 'Other',
    ];
    // Parse existing selections
    final raw = _profileData['preferred_education'];
    List<String> selected = [];
    if (raw is List) {
      selected = raw.map((e) => e.toString()).toList();
    } else if (raw is String && raw.isNotEmpty) {
      selected = raw.split(',').map((e) => e.trim()).where((e) => e.isNotEmpty).toList();
    }

    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: educationOptions.map((option) {
        final isSelected = selected.contains(option);
        return GestureDetector(
          onTap: () {
            setState(() {
              if (isSelected) {
                selected.remove(option);
              } else {
                selected.add(option);
              }
              _profileData['preferred_education'] = selected;
            });
          },
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: isSelected ? AppColors.primary : AppColors.white,
              border: Border.all(
                color: isSelected ? AppColors.primary : AppColors.slate300,
                width: 1.5,
              ),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              option,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: isSelected ? AppColors.white : AppColors.slate600,
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  // ═══════════════════════════════════════════════════════════
  // TAB 6 - MEDIA
  // ═══════════════════════════════════════════════════════════
  Widget _buildMediaTab() {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
      children: [
        _sectionTitle('Photo Gallery', icon: LucideIcons.image),
        const Text(
          'Upload photos to increase profile visibility. First photo becomes your profile picture.',
          style: TextStyle(fontSize: 13, color: AppColors.slate500),
        ),
        const SizedBox(height: 12),

        // Upload button
        GestureDetector(
          onTap: _galleryLoading ? null : _uploadGalleryImage,
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 20),
            decoration: BoxDecoration(
              border: Border.all(color: AppColors.primary, width: 1.5, style: BorderStyle.solid),
              borderRadius: BorderRadius.circular(AppDecorations.radiusXl),
              color: AppColors.primary5,
            ),
            child: Column(
              children: [
                Icon(LucideIcons.uploadCloud, size: 32, color: AppColors.primary),
                const SizedBox(height: 8),
                Text(
                  'Upload Photo',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.primary),
                ),
                const SizedBox(height: 4),
                Text(
                  'JPG, PNG up to 5MB',
                  style: TextStyle(fontSize: 12, color: AppColors.slate400),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),

        // Gallery grid
        if (_galleryLoading)
          const Padding(
            padding: EdgeInsets.all(32),
            child: Center(child: CircularProgressIndicator(color: AppColors.primary)),
          )
        else if (_galleryImages.isEmpty)
          Container(
            padding: const EdgeInsets.all(32),
            alignment: Alignment.center,
            child: Column(
              children: [
                Icon(LucideIcons.imageOff, size: 48, color: AppColors.slate300),
                const SizedBox(height: 12),
                const Text('No photos uploaded yet', style: TextStyle(color: AppColors.slate400, fontSize: 14)),
              ],
            ),
          )
        else
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              mainAxisSpacing: 8,
              crossAxisSpacing: 8,
              childAspectRatio: 1,
            ),
            itemCount: _galleryImages.length,
            itemBuilder: (ctx, i) => _buildGalleryItem(_galleryImages[i]),
          ),

        const SizedBox(height: 32),

        // Voice intro section
        _sectionTitle('Voice Introduction', icon: LucideIcons.mic),
        const Text(
          'Record a short voice introduction to let potential matches hear your voice.',
          style: TextStyle(fontSize: 13, color: AppColors.slate500),
        ),
        const SizedBox(height: 12),
        _buildVoiceIntroSection(),
      ],
    );
  }

  Widget _buildGalleryItem(Map<String, dynamic> image) {
    final imageId = image['id'] as int? ?? 0;
    final imageUrl = image['image'] ?? image['url'] ?? image['path'] ?? '';
    final isPrivate = image['is_private'] == true || image['is_private'] == 1;
    final isPrimary = image['is_primary'] == true || image['is_primary'] == 1;

    final fullUrl = imageUrl.toString().startsWith('http')
        ? imageUrl.toString()
        : '${ApiConfig.baseHost}/$imageUrl';

    return Stack(
      children: [
        // Image
        ClipRRect(
          borderRadius: BorderRadius.circular(AppDecorations.radiusLg),
          child: Image.network(
            fullUrl,
            fit: BoxFit.cover,
            width: double.infinity,
            height: double.infinity,
            errorBuilder: (_, __, ___) => Container(
              color: AppColors.slate200,
              child: const Icon(LucideIcons.imageOff, color: AppColors.slate400),
            ),
          ),
        ),

        // Private badge
        if (isPrivate)
          Positioned(
            top: 4,
            left: 4,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.black54,
                borderRadius: BorderRadius.circular(4),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(LucideIcons.lock, size: 10, color: Colors.white),
                  SizedBox(width: 2),
                  Text('Private', style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w600)),
                ],
              ),
            ),
          ),

        // Primary badge
        if (isPrimary)
          Positioned(
            top: 4,
            right: 4,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.circular(4),
              ),
              child: const Text('Profile', style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w600)),
            ),
          ),

        // Action buttons overlay at bottom
        Positioned(
          bottom: 0,
          left: 0,
          right: 0,
          child: Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Colors.transparent, Colors.black.withOpacity(0.7)],
              ),
              borderRadius: const BorderRadius.vertical(bottom: Radius.circular(8)),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                // Set as profile
                if (!isPrimary)
                  _galleryAction(LucideIcons.userCircle, () => _setAsPrimary(imageId)),
                // Toggle privacy
                _galleryAction(
                  isPrivate ? LucideIcons.unlock : LucideIcons.lock,
                  () => _toggleImagePrivacy(imageId),
                ),
                // Delete
                _galleryAction(LucideIcons.trash2, () => _deleteGalleryImage(imageId)),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _galleryAction(IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(5),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.2),
          borderRadius: BorderRadius.circular(4),
        ),
        child: Icon(icon, size: 14, color: Colors.white),
      ),
    );
  }

  Widget _buildVoiceIntroSection() {
    final hasVoice = _strVal('voice_intro').isNotEmpty;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.slate50,
        borderRadius: BorderRadius.circular(AppDecorations.radiusXl),
        border: Border.all(color: AppColors.slate200),
      ),
      child: Column(
        children: [
          Icon(
            hasVoice ? LucideIcons.volume2 : LucideIcons.micOff,
            size: 40,
            color: hasVoice ? AppColors.primary : AppColors.slate300,
          ),
          const SizedBox(height: 12),
          Text(
            hasVoice ? 'Voice intro recorded' : 'No voice intro yet',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: hasVoice ? AppColors.slate700 : AppColors.slate400,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: DmbButton(
                  text: hasVoice ? 'Re-record' : 'Record',
                  icon: LucideIcons.mic,
                  variant: DmbButtonVariant.outline,
                  onPressed: () {
                    _showSnack('Voice recording will be available in a future update');
                  },
                ),
              ),
              if (hasVoice) ...[
                const SizedBox(width: 8),
                Expanded(
                  child: DmbButton(
                    text: 'Delete',
                    icon: LucideIcons.trash2,
                    variant: DmbButtonVariant.danger,
                    onPressed: () async {
                      try {
                        final api = ref.read(apiServiceProvider);
                        await api.delete('/member/voice-intro');
                        _setField('voice_intro', '');
                        _showSnack('Voice intro deleted');
                      } catch (e) {
                        _showSnack('Failed to delete voice intro', isError: true);
                      }
                    },
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════
  // TAB 7 - VISIBILITY
  // ═══════════════════════════════════════════════════════════
  Widget _buildVisibilityTab() {
    final fields = <_VisibilityField>[
      _VisibilityField('phone', 'Phone Number', LucideIcons.phone, 'Allow others to see your phone number'),
      _VisibilityField('email', 'Email Address', LucideIcons.mail, 'Allow others to see your email address'),
      _VisibilityField('date_of_birth', 'Date of Birth', LucideIcons.calendar, 'Show your date of birth on profile'),
      _VisibilityField('income', 'Annual Income', LucideIcons.dollarSign, 'Show your income range'),
      _VisibilityField('photos', 'Photos', LucideIcons.image, 'Make your photos visible to others'),
      _VisibilityField('family_details', 'Family Details', LucideIcons.users, 'Show family information on profile'),
      _VisibilityField('career_details', 'Career Details', LucideIcons.briefcase, 'Show career information on profile'),
      _VisibilityField('contact_info', 'Contact Information', LucideIcons.messageSquare, 'Allow others to see contact details'),
      _VisibilityField('location', 'Location', LucideIcons.mapPin, 'Show your location on profile'),
      _VisibilityField('education', 'Education', LucideIcons.graduationCap, 'Show educational background'),
      _VisibilityField('lifestyle', 'Lifestyle', LucideIcons.heart, 'Show lifestyle preferences'),
    ];

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
      children: [
        _sectionTitle('Profile Visibility', icon: LucideIcons.eye),
        const Text(
          'Control which fields are visible on your public profile. Hidden fields will only be visible to you.',
          style: TextStyle(fontSize: 13, color: AppColors.slate500),
        ),
        const SizedBox(height: 8),

        // Privacy summary
        Builder(builder: (_) {
          final visibleCount = _visibilityMap.values.where((v) => v).length;
          final totalCount = _visibilityMap.length;
          return Container(
            padding: const EdgeInsets.all(12),
            margin: const EdgeInsets.symmetric(vertical: 8),
            decoration: BoxDecoration(
              color: AppColors.primary5,
              borderRadius: BorderRadius.circular(AppDecorations.radiusLg),
              border: Border.all(color: AppColors.primary.withOpacity(0.2)),
            ),
            child: Row(
              children: [
                Icon(LucideIcons.shield, size: 20, color: AppColors.primary),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    '$visibleCount of $totalCount fields are publicly visible',
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: AppColors.slate700),
                  ),
                ),
              ],
            ),
          );
        }),

        const SizedBox(height: 8),

        ...fields.map((f) => _buildVisibilityRow(f)),
      ],
    );
  }

  Widget _buildVisibilityRow(_VisibilityField field) {
    final isVisible = _visibilityMap[field.key] ?? true;
    return Container(
      margin: const EdgeInsets.only(bottom: 4),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(AppDecorations.radiusLg),
        border: Border.all(color: AppColors.slate100),
      ),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: isVisible ? AppColors.primary10 : AppColors.slate100,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              field.icon,
              size: 18,
              color: isVisible ? AppColors.primary : AppColors.slate400,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  field.label,
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: AppColors.slate800),
                ),
                Text(
                  field.subtitle,
                  style: const TextStyle(fontSize: 11, color: AppColors.slate400),
                ),
              ],
            ),
          ),
          Switch(
            value: isVisible,
            activeColor: AppColors.primary,
            onChanged: (_) => _toggleVisibility(field.key),
          ),
        ],
      ),
    );
  }
}

// ── Helper class for visibility fields ──
class _VisibilityField {
  final String key;
  final String label;
  final IconData icon;
  final String subtitle;

  const _VisibilityField(this.key, this.label, this.icon, this.subtitle);
}
