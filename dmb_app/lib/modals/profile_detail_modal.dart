import 'dart:math' as math;

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../models/profile_match.dart';
import '../providers/auth_provider.dart';
import '../theme/app_colors.dart';
import '../theme/app_decorations.dart';
import '../utils/avatar_resolver.dart';
import '../utils/interest_status.dart';
import '../widgets/dmb_avatar.dart';
import '../widgets/dmb_badge.dart';
import '../widgets/dmb_button.dart';
import '../widgets/dmb_modal.dart';
import '../widgets/dmb_tab_bar.dart';

// ---------------------------------------------------------------------------
// Show helper — uses showDmbFullModal (95% height)
// ---------------------------------------------------------------------------

Future<void> showProfileDetailModal(
  BuildContext context, {
  required ProfileMatch profile,
  Function(ProfileMatch)? onSendProposal,
  VoidCallback? onNavigate,
}) {
  return showDmbFullModal(
    context: context,
    builder: (_) => ProfileDetailModal(
      profile: profile,
      onSendProposal: onSendProposal,
      onNavigate: onNavigate,
    ),
  );
}

// ---------------------------------------------------------------------------
// Widget
// ---------------------------------------------------------------------------

class ProfileDetailModal extends ConsumerStatefulWidget {
  final ProfileMatch profile;
  final Function(ProfileMatch)? onSendProposal;
  final VoidCallback? onNavigate;

  const ProfileDetailModal({
    super.key,
    required this.profile,
    this.onSendProposal,
    this.onNavigate,
  });

  @override
  ConsumerState<ProfileDetailModal> createState() => _ProfileDetailModalState();
}

class _ProfileDetailModalState extends ConsumerState<ProfileDetailModal> {
  // Tab state
  int _activeTab = 0; // 0 = About, 1 = Compatibility

  // Profile data from API
  Map<String, dynamic> _profileData = {};
  bool _loading = true;
  String? _error;

  // Match intelligence (lazy loaded)
  Map<String, dynamic> _intelligence = {};
  bool _intelLoading = false;
  String? _intelError;

  // Friction points reveal
  bool _showFriction = false;

  // Interest state
  InterestStatusResult _interestState = const InterestStatusResult(
    state: CanonicalInterestState.none,
    label: 'Send Proposal',
    canSendProposal: true,
  );

  ProfileMatch get _profile => widget.profile;

  @override
  void initState() {
    super.initState();
    _fetchProfileData();
  }

  // ── API calls ──

  Future<void> _fetchProfileData() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final api = ref.read(apiServiceProvider);

      // Fetch public profile and member info in parallel
      final results = await Future.wait([
        api.get('/member/public-profile/${_profile.id}'),
        api.get('/member/member-info/${_profile.id}'),
      ]);

      final publicData = results[0].data is Map<String, dynamic>
          ? results[0].data as Map<String, dynamic>
          : <String, dynamic>{};
      final memberInfo = results[1].data is Map<String, dynamic>
          ? results[1].data as Map<String, dynamic>
          : <String, dynamic>{};

      // Merge data — member-info may be nested under 'data'
      final infoData = memberInfo['data'] is Map<String, dynamic>
          ? memberInfo['data'] as Map<String, dynamic>
          : memberInfo;

      final merged = <String, dynamic>{
        ...publicData,
        if (publicData['data'] is Map<String, dynamic>)
          ...(publicData['data'] as Map<String, dynamic>),
        ...infoData,
      };

      // Resolve interest state from server data
      final serverInterest = resolveInterestStatus(
        interestStatus: infoData['interest_status'] ?? merged['interest_status'],
        interestText: infoData['interest_text'] ?? merged['interest_text'],
        myUserId: 0,
        targetUserId: int.tryParse(_profile.id) ?? 0,
      );

      if (mounted) {
        setState(() {
          _profileData = merged;
          _interestState = serverInterest;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Failed to load profile. Please try again.';
          _loading = false;
        });
      }
    }
  }

  Future<void> _fetchIntelligence() async {
    if (_intelligence.isNotEmpty || _intelLoading) return;

    setState(() {
      _intelLoading = true;
      _intelError = null;
    });

    try {
      final api = ref.read(apiServiceProvider);
      final response = await api.get('/match-intelligence/${_profile.id}');
      final data = response.data is Map<String, dynamic>
          ? response.data as Map<String, dynamic>
          : <String, dynamic>{};

      if (mounted) {
        setState(() {
          _intelligence = data['data'] is Map<String, dynamic>
              ? data['data'] as Map<String, dynamic>
              : data;
          _intelLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _intelError = 'Failed to load compatibility data.';
          _intelLoading = false;
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

  String _nestedStr(Map<String, dynamic> map, List<String> keys, [String fallback = '']) {
    for (final key in keys) {
      final val = map[key];
      if (val != null && val.toString().trim().isNotEmpty) {
        return val.toString().trim();
      }
    }
    return fallback;
  }

  List<Map<String, dynamic>> _getList(String key) {
    final val = _profileData[key];
    if (val is List) return val.cast<Map<String, dynamic>>();
    return [];
  }

  // ── Build ──

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(
        child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2.5),
      );
    }

    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(LucideIcons.alertCircle, size: 48, color: AppColors.error),
              const SizedBox(height: 16),
              Text(
                _error!,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 14, color: AppColors.slate600),
              ),
              const SizedBox(height: 16),
              DmbButton(
                text: 'Retry',
                isFullWidth: false,
                onPressed: _fetchProfileData,
              ),
            ],
          ),
        ),
      );
    }

    return Column(
      children: [
        Expanded(
          child: CustomScrollView(
            slivers: [
              SliverToBoxAdapter(child: _buildHeader()),
              SliverToBoxAdapter(child: _buildQuickInfo()),
              SliverToBoxAdapter(child: _buildTabBar()),
              SliverToBoxAdapter(
                child: _activeTab == 0
                    ? _buildAboutTab()
                    : _buildCompatibilityTab(),
              ),
            ],
          ),
        ),
        _buildBottomAction(),
      ],
    );
  }

  // ── Gradient header with avatar + name ──

  Widget _buildHeader() {
    final member = _profileData['member'] is Map<String, dynamic>
        ? _profileData['member'] as Map<String, dynamic>
        : <String, dynamic>{};

    final location = _profile.location.isNotEmpty
        ? _profile.location
        : _nestedStr(_profileData, ['location', 'city']);

    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppColors.slate800, AppColors.slate900],
        ),
      ),
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
      child: Column(
        children: [
          // Close button row
          Align(
            alignment: Alignment.topRight,
            child: GestureDetector(
              onTap: _close,
              child: Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(AppDecorations.radiusFull),
                ),
                child: const Icon(LucideIcons.x, size: 18, color: AppColors.white),
              ),
            ),
          ),
          const SizedBox(height: 12),

          // Avatar with white border + online indicator
          Container(
            width: 76,
            height: 76,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: AppColors.white, width: 3),
            ),
            child: DmbAvatar(
              imageUrl: _profile.avatarUrl,
              size: 72,
              showOnlineIndicator: true,
              isOnline: _profile.isOnline,
            ),
          ),
          const SizedBox(height: 12),

          // Name + verified badge
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Flexible(
                child: Text(
                  _profile.name,
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: AppColors.white,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              if (_profile.isVerified) ...[
                const SizedBox(width: 6),
                const VerifiedBadge(size: 18),
              ],
            ],
          ),
          const SizedBox(height: 4),

          // Age + location
          Text(
            [
              if (_profile.age > 0) '${_profile.age} years',
              if (location.isNotEmpty) location,
            ].join(' · '),
            style: TextStyle(
              fontSize: 13,
              color: AppColors.white.withOpacity(0.7),
            ),
          ),
        ],
      ),
    );
  }

  // ── Quick info row: height, education, career badges ──

  Widget _buildQuickInfo() {
    final member = _profileData['member'] is Map<String, dynamic>
        ? _profileData['member'] as Map<String, dynamic>
        : <String, dynamic>{};
    final height = _nestedStr(member, ['height']);
    final educations = _getList('education');
    final careers = _getList('career');
    final degree = educations.isNotEmpty
        ? _str(educations.first['degree'])
        : _profile.education?.degree ?? '';
    final position = careers.isNotEmpty
        ? _str(careers.first['designation'] ?? careers.first['position'])
        : _profile.career?.position ?? '';

    final chips = <String>[
      if (height.isNotEmpty) height,
      if (degree.isNotEmpty) degree,
      if (position.isNotEmpty) position,
    ];

    if (chips.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
      child: Wrap(
        spacing: 8,
        runSpacing: 6,
        children: chips.map((c) => DmbBadge(text: c, variant: BadgeVariant.neutral)).toList(),
      ),
    );
  }

  // ── Tab bar ──

  Widget _buildTabBar() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: DmbTabBar(
        tabs: const ['About', 'Compatibility'],
        selectedIndex: _activeTab,
        onTabChanged: (index) {
          setState(() => _activeTab = index);
          if (index == 1) _fetchIntelligence();
        },
      ),
    );
  }

  // ===================================================================
  // ABOUT TAB
  // ===================================================================

  Widget _buildAboutTab() {
    final member = _profileData['member'] is Map<String, dynamic>
        ? _profileData['member'] as Map<String, dynamic>
        : <String, dynamic>{};

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Introduction
          _buildIntroduction(member),

          // Basic info
          _buildBasicInfoGrid(member),

          // Education
          _buildEducationSection(),

          // Career
          _buildCareerSection(),

          // Physical attributes
          _buildPhysicalSection(member),

          // Religious background
          _buildReligiousSection(member),

          // Residence
          _buildResidenceSection(),

          // Family
          _buildFamilySection(member),

          // Lifestyle
          _buildLifestyleSection(member),

          // Partner expectations
          _buildPartnerExpectations(member),

          // Photo gallery
          _buildPhotoGallery(),

          const SizedBox(height: 24),
        ],
      ),
    );
  }

  // ── Section builder helpers ──

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(top: 20, bottom: 10),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 15,
          fontWeight: FontWeight.w700,
          color: AppColors.slate900,
        ),
      ),
    );
  }

  Widget _buildInfoGrid(List<_InfoItem> items) {
    final filtered = items.where((i) => i.value.isNotEmpty).toList();
    if (filtered.isEmpty) return const SizedBox.shrink();

    return Wrap(
      spacing: 12,
      runSpacing: 8,
      children: filtered.map((item) {
        return SizedBox(
          width: (MediaQuery.of(context).size.width - 44) / 2,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                item.label,
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: AppColors.slate400,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                item.value,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: AppColors.slate700,
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  // ── Introduction ──

  Widget _buildIntroduction(Map<String, dynamic> member) {
    final intro = _nestedStr(_profileData, ['introduction', 'bio']);
    if (intro.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle('Introduction'),
        Text(
          intro,
          style: const TextStyle(
            fontSize: 13,
            color: AppColors.slate600,
            height: 1.6,
          ),
        ),
      ],
    );
  }

  // ── Basic info grid ──

  Widget _buildBasicInfoGrid(Map<String, dynamic> member) {
    final religion = _nestedStr(member, ['religion_name'])
        .isEmpty
        ? _nestedStr(_profileData, ['religion', 'religion_name'])
        : _nestedStr(member, ['religion_name']);
    final sect = _nestedStr(member, ['sect_name'])
        .isEmpty
        ? _nestedStr(_profileData, ['sect', 'sect_name'])
        : _nestedStr(member, ['sect_name']);

    final items = [
      _InfoItem('Religion', _resolveNameField(_profileData, 'religion', ['name', 'religion_name'])),
      _InfoItem('Sect', _resolveNameField(_profileData, 'sect', ['name', 'sect_name'])),
      _InfoItem('Caste', _resolveNameField(_profileData, 'caste', ['name', 'caste_name'])),
      _InfoItem('Marital Status', _nestedStr(member, ['marital_status', 'marital_status_name'])),
      _InfoItem('Height', _nestedStr(member, ['height'])),
      _InfoItem('Weight', _nestedStr(member, ['weight'])),
      _InfoItem('Complexion', _nestedStr(member, ['complexion'])),
      _InfoItem('Body Type', _nestedStr(member, ['body_type'])),
      _InfoItem('Blood Group', _nestedStr(member, ['blood_group'])),
    ];

    if (items.every((i) => i.value.isEmpty)) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle('Basic Information'),
        _buildInfoGrid(items),
      ],
    );
  }

  String _resolveNameField(Map<String, dynamic> data, String key, List<String> nameKeys) {
    final val = data[key];
    if (val is Map<String, dynamic>) {
      for (final nk in nameKeys) {
        final n = val[nk];
        if (n != null && n.toString().trim().isNotEmpty) return n.toString().trim();
      }
    }
    if (val is String && val.trim().isNotEmpty) return val.trim();
    // Try member sub-object
    final member = data['member'];
    if (member is Map<String, dynamic>) {
      for (final nk in nameKeys) {
        final n = member['${key}_$nk'] ?? member['${key}_name'];
        if (n != null && n.toString().trim().isNotEmpty) return n.toString().trim();
      }
    }
    return '';
  }

  // ── Education ──

  Widget _buildEducationSection() {
    final educations = _getList('education');
    if (educations.isEmpty && _profile.education == null) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle('Education'),
        if (educations.isNotEmpty)
          ...educations.map((e) => _buildEducationCard(e))
        else if (_profile.education != null)
          _buildInfoGrid([
            _InfoItem('Degree', _profile.education!.degree),
            _InfoItem('Institution', _profile.education!.institution),
          ]),
      ],
    );
  }

  Widget _buildEducationCard(Map<String, dynamic> edu) {
    final degree = _str(edu['degree']);
    final field = _str(edu['field_of_study'] ?? edu['field']);
    final university = _str(edu['institution'] ?? edu['university']);

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.slate50,
        borderRadius: BorderRadius.circular(AppDecorations.radiusXl),
        border: Border.all(color: AppColors.slate100),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (degree.isNotEmpty)
            Text(
              degree,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.slate900,
              ),
            ),
          if (field.isNotEmpty)
            Text(
              field,
              style: const TextStyle(fontSize: 12, color: AppColors.slate600),
            ),
          if (university.isNotEmpty) ...[
            const SizedBox(height: 2),
            Row(
              children: [
                const Icon(LucideIcons.building2, size: 12, color: AppColors.slate400),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    university,
                    style: const TextStyle(fontSize: 12, color: AppColors.slate500),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  // ── Career ──

  Widget _buildCareerSection() {
    final careers = _getList('career');
    if (careers.isEmpty && _profile.career == null) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle('Career'),
        if (careers.isNotEmpty)
          ...careers.map((c) => _buildCareerCard(c))
        else if (_profile.career != null)
          _buildInfoGrid([
            _InfoItem('Position', _profile.career!.position),
            _InfoItem('Institution', _profile.career!.institution),
          ]),
      ],
    );
  }

  Widget _buildCareerCard(Map<String, dynamic> career) {
    final jobTitle = _str(career['designation'] ?? career['job_title'] ?? career['position']);
    final company = _str(career['company'] ?? career['institution']);
    final industry = _str(career['industry']);
    final income = _str(career['income'] ?? career['salary']);

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.slate50,
        borderRadius: BorderRadius.circular(AppDecorations.radiusXl),
        border: Border.all(color: AppColors.slate100),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (jobTitle.isNotEmpty)
            Text(
              jobTitle,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.slate900,
              ),
            ),
          if (company.isNotEmpty)
            Row(
              children: [
                const Icon(LucideIcons.building, size: 12, color: AppColors.slate400),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    company,
                    style: const TextStyle(fontSize: 12, color: AppColors.slate600),
                  ),
                ),
              ],
            ),
          if (industry.isNotEmpty || income.isNotEmpty) ...[
            const SizedBox(height: 4),
            _buildInfoGrid([
              if (industry.isNotEmpty) _InfoItem('Industry', industry),
              if (income.isNotEmpty) _InfoItem('Income', income),
            ]),
          ],
        ],
      ),
    );
  }

  // ── Physical attributes ──

  Widget _buildPhysicalSection(Map<String, dynamic> member) {
    final items = [
      _InfoItem('Height', _nestedStr(member, ['height'])),
      _InfoItem('Weight', _nestedStr(member, ['weight'])),
      _InfoItem('Complexion', _nestedStr(member, ['complexion'])),
      _InfoItem('Body Type', _nestedStr(member, ['body_type'])),
      _InfoItem('Blood Group', _nestedStr(member, ['blood_group'])),
      _InfoItem('Disability', _nestedStr(member, ['disability'])),
    ];

    if (items.every((i) => i.value.isEmpty)) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle('Physical Attributes'),
        _buildInfoGrid(items),
      ],
    );
  }

  // ── Religious background ──

  Widget _buildReligiousSection(Map<String, dynamic> member) {
    final items = [
      _InfoItem('Religion', _resolveNameField(_profileData, 'religion', ['name', 'religion_name'])),
      _InfoItem('Sect', _resolveNameField(_profileData, 'sect', ['name', 'sect_name'])),
      _InfoItem('Caste', _resolveNameField(_profileData, 'caste', ['name', 'caste_name'])),
      _InfoItem('Mother Tongue', _nestedStr(member, ['mother_tongue'])),
      _InfoItem('Languages', _nestedStr(member, ['languages'])),
    ];

    if (items.every((i) => i.value.isEmpty)) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle('Religious Background'),
        _buildInfoGrid(items),
      ],
    );
  }

  // ── Residence ──

  Widget _buildResidenceSection() {
    final addresses = _profileData['addresses'];
    if (addresses == null || (addresses is List && addresses.isEmpty)) {
      return const SizedBox.shrink();
    }

    final addr = addresses is List
        ? (addresses.first is Map<String, dynamic> ? addresses.first as Map<String, dynamic> : <String, dynamic>{})
        : <String, dynamic>{};

    final city = addr['city'] is Map ? _str(addr['city']['name']) : _str(addr['city']);
    final state = addr['state'] is Map ? _str(addr['state']['name']) : _str(addr['state']);
    final country = addr['country'] is Map ? _str(addr['country']['name']) : _str(addr['country']);

    final items = [
      _InfoItem('City', city),
      _InfoItem('State', state),
      _InfoItem('Country', country),
    ];

    if (items.every((i) => i.value.isEmpty)) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle('Residence'),
        _buildInfoGrid(items),
      ],
    );
  }

  // ── Family ──

  Widget _buildFamilySection(Map<String, dynamic> member) {
    final items = [
      _InfoItem('Father Occupation', _nestedStr(member, ['father_occupation', 'father_profession'])),
      _InfoItem('Mother Occupation', _nestedStr(member, ['mother_occupation', 'mother_profession'])),
      _InfoItem('Siblings', _nestedStr(member, ['no_of_siblings', 'siblings'])),
      _InfoItem('Family Status', _nestedStr(member, ['family_status'])),
      _InfoItem('Family Values', _nestedStr(member, ['family_values'])),
      _InfoItem('Family Type', _nestedStr(member, ['family_type'])),
    ];

    if (items.every((i) => i.value.isEmpty)) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle('Family'),
        _buildInfoGrid(items),
      ],
    );
  }

  // ── Lifestyle ──

  Widget _buildLifestyleSection(Map<String, dynamic> member) {
    final items = [
      _InfoItem('Diet', _nestedStr(member, ['diet'])),
      _InfoItem('Smoking', _nestedStr(member, ['smoking'])),
      _InfoItem('Drinking', _nestedStr(member, ['drinking', 'alcohol'])),
      _InfoItem('Hobbies', _nestedStr(member, ['hobbies'])),
    ];

    if (items.every((i) => i.value.isEmpty)) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle('Lifestyle'),
        _buildInfoGrid(items),
      ],
    );
  }

  // ── Partner expectations ──

  Widget _buildPartnerExpectations(Map<String, dynamic> member) {
    final expectations = _nestedStr(member, ['partner_expectations', 'partner_preference']);
    if (expectations.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle('Partner Expectations'),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppColors.primary5,
            borderRadius: BorderRadius.circular(AppDecorations.radiusXl),
            border: Border.all(color: AppColors.primary10),
          ),
          child: Text(
            expectations,
            style: const TextStyle(
              fontSize: 13,
              color: AppColors.slate600,
              height: 1.6,
            ),
          ),
        ),
      ],
    );
  }

  // ── Photo gallery ──

  Widget _buildPhotoGallery() {
    final gallery = _profileData['gallery_images'] ?? _profileData['gallery'] ?? [];
    if (gallery is! List || gallery.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle('Photo Gallery'),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            crossAxisSpacing: 8,
            mainAxisSpacing: 8,
            childAspectRatio: 1,
          ),
          itemCount: gallery.length,
          itemBuilder: (context, index) {
            final item = gallery[index];
            final imageUrl = item is Map<String, dynamic>
                ? resolveAvatarUrl(
                    _str(item['image'] ?? item['url'] ?? item['path']),
                  )
                : resolveAvatarUrl(item.toString());

            return ClipRRect(
              borderRadius: BorderRadius.circular(AppDecorations.radiusLg),
              child: CachedNetworkImage(
                imageUrl: imageUrl,
                fit: BoxFit.cover,
                placeholder: (_, __) => Container(
                  color: AppColors.slate200,
                  child: const Center(
                    child: Icon(LucideIcons.image, size: 24, color: AppColors.slate400),
                  ),
                ),
                errorWidget: (_, __, ___) => Container(
                  color: AppColors.slate200,
                  child: const Center(
                    child: Icon(LucideIcons.imageOff, size: 24, color: AppColors.slate400),
                  ),
                ),
              ),
            );
          },
        ),
      ],
    );
  }

  // ===================================================================
  // COMPATIBILITY TAB
  // ===================================================================

  Widget _buildCompatibilityTab() {
    if (_intelLoading) {
      return const Padding(
        padding: EdgeInsets.all(48),
        child: Center(
          child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2.5),
        ),
      );
    }

    if (_intelError != null) {
      return Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          children: [
            const Icon(LucideIcons.alertCircle, size: 40, color: AppColors.error),
            const SizedBox(height: 12),
            Text(
              _intelError!,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 14, color: AppColors.slate600),
            ),
            const SizedBox(height: 12),
            DmbButton(
              text: 'Retry',
              isFullWidth: false,
              onPressed: () {
                _intelligence = {};
                _fetchIntelligence();
              },
            ),
          ],
        ),
      );
    }

    if (_intelligence.isEmpty) {
      return const Padding(
        padding: EdgeInsets.all(48),
        child: Center(
          child: Text(
            'No compatibility data available yet.',
            style: TextStyle(fontSize: 14, color: AppColors.slate500),
          ),
        ),
      );
    }

    final intel = MatchIntelligence.fromJson(_intelligence);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Circular score
          _buildCircularScore(intel.totalScore),
          const SizedBox(height: 24),

          // Category bars
          _buildSectionTitle('Category Breakdown'),
          ...intel.categories.map((cat) => _buildCategoryBar(cat)),
          const SizedBox(height: 16),

          // Mutual fit
          _buildMutualFit(intel.mutualFit),

          // Top reasons
          if (intel.topReasons.isNotEmpty) ...[
            _buildSectionTitle('Top Reasons'),
            ...intel.topReasons.map((reason) => _buildReasonItem(reason)),
          ],

          // Friction points
          if (intel.frictionPoints.isNotEmpty) ...[
            _buildSectionTitle('Friction Points'),
            _buildFrictionPoints(intel.frictionPoints),
          ],

          // Matchmaker notes
          if (intel.agentNotes != null && intel.agentNotes!.isNotEmpty) ...[
            _buildSectionTitle('Matchmaker Notes'),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.slate50,
                borderRadius: BorderRadius.circular(AppDecorations.radiusXl),
                border: Border.all(color: AppColors.slate200),
              ),
              child: Text(
                intel.agentNotes!,
                style: const TextStyle(
                  fontSize: 13,
                  color: AppColors.slate600,
                  height: 1.5,
                  fontStyle: FontStyle.italic,
                ),
              ),
            ),
          ],

          const SizedBox(height: 24),
        ],
      ),
    );
  }

  // ── Circular progress score ──

  Widget _buildCircularScore(double score) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 16),
        child: SizedBox(
          width: 140,
          height: 140,
          child: CustomPaint(
            painter: _ScoreArcPainter(
              score: score,
              backgroundColor: AppColors.slate200,
              foregroundColor: _scoreColor(score),
            ),
            child: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    '${score.toInt()}%',
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.w800,
                      color: _scoreColor(score),
                    ),
                  ),
                  const Text(
                    'Match',
                    style: TextStyle(
                      fontSize: 12,
                      color: AppColors.slate500,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Color _scoreColor(double score) {
    if (score >= 80) return AppColors.success;
    if (score >= 60) return AppColors.warning;
    return AppColors.error;
  }

  // ── Category bar ──

  Widget _buildCategoryBar(MatchCategory category) {
    final color = _scoreColor(category.score);

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                category.name,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.slate700,
                ),
              ),
              Text(
                category.weight,
                style: const TextStyle(
                  fontSize: 11,
                  color: AppColors.slate400,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Stack(
            children: [
              Container(
                height: 8,
                decoration: BoxDecoration(
                  color: AppColors.slate100,
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
              FractionallySizedBox(
                widthFactor: (category.score / 100).clamp(0.0, 1.0),
                child: Container(
                  height: 8,
                  decoration: BoxDecoration(
                    color: color,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 2),
          Align(
            alignment: Alignment.centerRight,
            child: Text(
              '${category.score.toInt()}%',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: color,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── Mutual fit ──

  Widget _buildMutualFit(MutualFit fit) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle('Mutual Fit'),
        Row(
          children: [
            Expanded(
              child: _buildFitCard(
                label: 'You Meet Them',
                percentage: fit.youMeetThem,
                icon: LucideIcons.arrowRight,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildFitCard(
                label: 'They Meet You',
                percentage: fit.theyMeetYou,
                icon: LucideIcons.arrowLeft,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildFitCard({
    required String label,
    required double percentage,
    required IconData icon,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.slate50,
        borderRadius: BorderRadius.circular(AppDecorations.radiusXl),
        border: Border.all(color: AppColors.slate100),
      ),
      child: Column(
        children: [
          Icon(icon, size: 18, color: AppColors.primary),
          const SizedBox(height: 8),
          Text(
            '${percentage.toInt()}%',
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w800,
              color: _scoreColor(percentage),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 11,
              color: AppColors.slate500,
            ),
          ),
        ],
      ),
    );
  }

  // ── Top reasons ──

  Widget _buildReasonItem(String reason) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.only(top: 2),
            child: Icon(LucideIcons.checkCircle2, size: 16, color: AppColors.success),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              reason,
              style: const TextStyle(
                fontSize: 13,
                color: AppColors.slate600,
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── Friction points (blurred until revealed) ──

  Widget _buildFrictionPoints(List<String> points) {
    if (_showFriction) {
      return Column(
        children: points.map((point) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Padding(
                  padding: EdgeInsets.only(top: 2),
                  child: Icon(LucideIcons.alertTriangle, size: 16, color: AppColors.warning),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    point,
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppColors.slate600,
                      height: 1.4,
                    ),
                  ),
                ),
              ],
            ),
          );
        }).toList(),
      );
    }

    // Blurred state
    return GestureDetector(
      onTap: () => setState(() => _showFriction = true),
      child: Stack(
        children: [
          // Blurred content
          ClipRect(
            child: ImageFiltered(
              imageFilter: const ColorFilter.mode(
                Color(0x33FFFFFF),
                BlendMode.srcOver,
              ),
              child: Column(
                children: points.map((point) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      children: [
                        const Icon(LucideIcons.alertTriangle, size: 16, color: AppColors.slate300),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Container(
                            height: 14,
                            decoration: BoxDecoration(
                              color: AppColors.slate200,
                              borderRadius: BorderRadius.circular(4),
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                }).toList(),
              ),
            ),
          ),
          // "View" overlay
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                color: AppColors.white.withOpacity(0.7),
                borderRadius: BorderRadius.circular(AppDecorations.radiusXl),
              ),
              child: const Center(
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(LucideIcons.eye, size: 16, color: AppColors.primary),
                    SizedBox(width: 6),
                    Text(
                      'Tap to View',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppColors.primary,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ===================================================================
  // BOTTOM ACTION BUTTON
  // ===================================================================

  Widget _buildBottomAction() {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
      decoration: const BoxDecoration(
        color: AppColors.white,
        border: Border(top: BorderSide(color: AppColors.slate100)),
        boxShadow: [
          BoxShadow(color: Color(0x0D000000), blurRadius: 8, offset: Offset(0, -2)),
        ],
      ),
      child: _buildActionByState(),
    );
  }

  Widget _buildActionByState() {
    switch (_interestState.state) {
      case CanonicalInterestState.none:
        return DmbButton(
          text: 'Send Proposal',
          icon: LucideIcons.heart,
          onPressed: () => widget.onSendProposal?.call(_profile),
        );

      case CanonicalInterestState.sentPending:
        return DmbButton(
          text: 'Pending Response',
          icon: LucideIcons.clock,
          variant: DmbButtonVariant.secondary,
          onPressed: null,
        );

      case CanonicalInterestState.sentAccepted:
      case CanonicalInterestState.receivedAccepted:
      case CanonicalInterestState.mutualMatch:
        return DmbButton(
          text: 'Chat Now',
          icon: LucideIcons.messageSquare,
          onPressed: () {
            _close();
            widget.onNavigate?.call();
          },
        );

      case CanonicalInterestState.receivedPending:
        return DmbButton(
          text: 'Respond to Proposal',
          icon: LucideIcons.reply,
          onPressed: () {
            _close();
            widget.onNavigate?.call();
          },
        );

      case CanonicalInterestState.sentRejected:
      case CanonicalInterestState.receivedRejected:
        return DmbButton(
          text: _interestState.label,
          variant: DmbButtonVariant.secondary,
          onPressed: null,
        );
    }
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

class _InfoItem {
  final String label;
  final String value;
  const _InfoItem(this.label, this.value);
}

// ---------------------------------------------------------------------------
// CustomPainter for circular arc score
// ---------------------------------------------------------------------------

class _ScoreArcPainter extends CustomPainter {
  final double score;
  final Color backgroundColor;
  final Color foregroundColor;

  _ScoreArcPainter({
    required this.score,
    required this.backgroundColor,
    required this.foregroundColor,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = math.min(size.width, size.height) / 2 - 8;
    const strokeWidth = 10.0;

    // Background arc (full circle)
    final bgPaint = Paint()
      ..color = backgroundColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    canvas.drawCircle(center, radius, bgPaint);

    // Foreground arc (score percentage)
    final fgPaint = Paint()
      ..color = foregroundColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    final sweepAngle = (score / 100) * 2 * math.pi;
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -math.pi / 2, // Start from top
      sweepAngle,
      false,
      fgPaint,
    );
  }

  @override
  bool shouldRepaint(covariant _ScoreArcPainter oldDelegate) {
    return oldDelegate.score != score ||
        oldDelegate.foregroundColor != foregroundColor;
  }
}
