import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/core.dart';
import '../../providers/providers.dart';

/// Profile edit tab
enum ProfileTab { basics, lifestyle, career, family, preferences, media }

/// Profile Screen - User's own profile view/edit
/// Transpiled from ProfileEditView.tsx
class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  ProfileTab _activeTab = ProfileTab.basics;

  @override
  Widget build(BuildContext context) {
    final currentUser = ref.watch(currentUserProvider);

    return CustomScrollView(
      slivers: [
        // Header
        SliverToBoxAdapter(
          child: Container(
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border(bottom: BorderSide(color: AppColors.slate200)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('My Profile',
                              style: AppTypography.headlineSmall),
                          Text(
                            'Manage your persona and preferences',
                            style: AppTypography.bodySmall.copyWith(
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    // Profile Completeness
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.sm,
                        vertical: AppSpacing.xs,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.warning.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(AppRadius.full),
                        border: Border.all(
                            color: AppColors.warning.withOpacity(0.2)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.info_outline,
                              size: 14, color: AppColors.warning),
                          const SizedBox(width: 4),
                          Text(
                            '65% Complete',
                            style: AppTypography.labelSmall.copyWith(
                              color: AppColors.warning,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    ElevatedButton(
                      onPressed: () {},
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(
                          horizontal: AppSpacing.md,
                          vertical: AppSpacing.sm,
                        ),
                      ),
                      child: const Text('Save'),
                    ),
                  ],
                ),

                const SizedBox(height: AppSpacing.lg),

                // Profile Header Card
                _buildProfileHeader(currentUser),
              ],
            ),
          ),
        ),

        // Tabs
        SliverToBoxAdapter(
          child: Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.md,
              vertical: AppSpacing.sm,
            ),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _buildTabButton(Icons.person, 'Basics', ProfileTab.basics),
                  _buildTabButton(
                      Icons.coffee, 'Lifestyle', ProfileTab.lifestyle),
                  _buildTabButton(Icons.work, 'Career', ProfileTab.career),
                  _buildTabButton(Icons.home, 'Family', ProfileTab.family),
                  _buildTabButton(
                      Icons.auto_awesome, 'Criteria', ProfileTab.preferences),
                  _buildTabButton(Icons.image, 'Media', ProfileTab.media),
                ],
              ),
            ),
          ),
        ),

        // Content
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: _buildTabContent(),
          ),
        ),
      ],
    );
  }

  Widget _buildProfileHeader(user) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        gradient: AppColors.primaryGradient,
        borderRadius: BorderRadius.circular(AppRadius.lg),
      ),
      child: Row(
        children: [
          // Avatar
          Stack(
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withOpacity(0.2),
                  border: Border.all(color: Colors.white, width: 3),
                ),
                child: ClipOval(
                  child: user?.avatarUrl != null
                      ? Image.network(user!.avatarUrl!, fit: BoxFit.cover)
                      : Icon(Icons.person, size: 40, color: Colors.white),
                ),
              ),
              Positioned(
                bottom: 0,
                right: 0,
                child: Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 2),
                  ),
                  child: Icon(Icons.camera_alt,
                      size: 14, color: AppColors.primary),
                ),
              ),
            ],
          ),
          const SizedBox(width: AppSpacing.lg),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  user?.name ?? 'Dr. Rajesh Kumar',
                  style:
                      AppTypography.titleMedium.copyWith(color: Colors.white),
                ),
                Text(
                  user?.specialty ?? 'MD General Medicine',
                  style: AppTypography.bodySmall.copyWith(
                    color: Colors.white.withOpacity(0.8),
                  ),
                ),
                const SizedBox(height: AppSpacing.sm),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.sm,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(AppRadius.full),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.verified, size: 12, color: Colors.white),
                          const SizedBox(width: 4),
                          Text(
                            'ID Verified',
                            style: AppTypography.caption.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.sm,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(AppRadius.full),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.workspace_premium,
                              size: 12, color: Colors.white),
                          const SizedBox(width: 4),
                          Text(
                            'Premium',
                            style: AppTypography.caption.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
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

  Widget _buildTabButton(IconData icon, String label, ProfileTab tab) {
    final isActive = _activeTab == tab;
    return Padding(
      padding: const EdgeInsets.only(right: AppSpacing.xs),
      child: GestureDetector(
        onTap: () => setState(() => _activeTab = tab),
        child: Container(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.md,
            vertical: AppSpacing.sm,
          ),
          decoration: BoxDecoration(
            color: isActive ? AppColors.slate900 : Colors.white,
            borderRadius: BorderRadius.circular(AppRadius.full),
            border: Border.all(
              color: isActive ? AppColors.slate900 : AppColors.slate200,
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                icon,
                size: 16,
                color: isActive ? Colors.white : AppColors.slate600,
              ),
              const SizedBox(width: 6),
              Text(
                label,
                style: AppTypography.labelSmall.copyWith(
                  color: isActive ? Colors.white : AppColors.slate600,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTabContent() {
    switch (_activeTab) {
      case ProfileTab.basics:
        return _buildBasicsSection();
      case ProfileTab.lifestyle:
        return _buildLifestyleSection();
      case ProfileTab.career:
        return _buildCareerSection();
      case ProfileTab.family:
        return _buildFamilySection();
      case ProfileTab.preferences:
        return _buildPreferencesSection();
      case ProfileTab.media:
        return _buildMediaSection();
    }
  }

  Widget _buildBasicsSection() {
    return Column(
      children: [
        _buildCard(
          title: 'Personal Basics',
          children: [
            _buildTextField('Full Name', 'Dr. Rajesh Kumar'),
            const SizedBox(height: AppSpacing.md),
            Row(
              children: [
                Expanded(
                    child: _buildTextField('Date of Birth', '1994-05-15',
                        keyboardType: TextInputType.datetime)),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                    child:
                        _buildDropdown('Gender', ['Male', 'Female', 'Other'])),
              ],
            ),
            const SizedBox(height: AppSpacing.md),
            _buildSliderField('Height', "5' 10\"", 178, 140, 220),
          ],
        ),
        const SizedBox(height: AppSpacing.md),
        _buildCard(
          title: 'Origin & Location',
          children: [
            _buildChipField('Languages', ['English', 'Hindi']),
            const SizedBox(height: AppSpacing.md),
            _buildDropdown('Nationality', ['Indian', 'American', 'British']),
            const SizedBox(height: AppSpacing.md),
            _buildTextField('Current Location', 'New Delhi, India'),
          ],
        ),
        const SizedBox(height: AppSpacing.md),
        _buildCard(
          title: 'Marriage Intent',
          children: [
            Row(
              children: [
                Expanded(
                    child: _buildDropdown('Timeline',
                        ['Immediately', 'Soon (6-12 months)', 'Casually'])),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                    child: _buildDropdown('Relocation',
                        ['Willing', 'Within country', 'Not willing'])),
              ],
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildLifestyleSection() {
    return Column(
      children: [
        _buildCard(
          title: 'Habits & Lifestyle',
          children: [
            Row(
              children: [
                Expanded(
                    child: _buildDropdown(
                        'Dietary', ['Vegetarian', 'Non-Vegetarian', 'Vegan'])),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                    child: _buildDropdown(
                        'Drinking', ['Socially', 'Never', 'Regularly'])),
              ],
            ),
            const SizedBox(height: AppSpacing.md),
            Row(
              children: [
                Expanded(
                    child: _buildDropdown(
                        'Smoking', ['Never', 'Occasionally', 'Regularly'])),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                    child: _buildDropdown(
                        'Sleep', ['Early Bird', 'Night Owl', 'Irregular'])),
              ],
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.md),
        _buildCard(
          title: 'Personality & Interests',
          children: [
            _buildChipField(
                'Hobbies', ['Hiking', 'Classical Music', 'Reading', 'Cooking']),
            const SizedBox(height: AppSpacing.md),
            Text('Personality Tags', style: AppTypography.labelMedium),
            const SizedBox(height: AppSpacing.sm),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                'Introverted',
                'Ambitious',
                'Family-oriented',
                'Creative',
                'Rational'
              ]
                  .map((tag) => FilterChip(
                        label: Text(tag),
                        selected:
                            tag == 'Ambitious' || tag == 'Family-oriented',
                        onSelected: (v) {},
                        showCheckmark: false,
                      ))
                  .toList(),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildCareerSection() {
    return Column(
      children: [
        _buildCard(
          title: 'Education',
          children: [
            _buildEducationItem('MD General Medicine', 'AIIMS, New Delhi',
                '2016 - 2019', 'Gold Medalist'),
            const SizedBox(height: AppSpacing.md),
            _buildEducationItem(
                'MBBS', 'Maulana Azad Medical College', '2010 - 2015', null),
            const SizedBox(height: AppSpacing.md),
            OutlinedButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.add, size: 16),
              label: const Text('Add Education'),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.md),
        _buildCard(
          title: 'Current Employment',
          children: [
            _buildTextField('Position', 'Senior Consultant'),
            const SizedBox(height: AppSpacing.md),
            _buildTextField('Hospital/Institution', 'AIIMS, New Delhi'),
            const SizedBox(height: AppSpacing.md),
            Row(
              children: [
                Expanded(
                    child: _buildTextField('Years of Experience', '8 years')),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                    child: _buildDropdown('Income Range',
                        ['10-20 LPA', '20-30 LPA', '30-50 LPA', '50+ LPA'])),
              ],
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildFamilySection() {
    return Column(
      children: [
        _buildCard(
          title: 'Family Background',
          children: [
            Row(
              children: [
                Expanded(
                    child: _buildDropdown(
                        'Family Type', ['Nuclear', 'Joint', 'Extended'])),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                    child: _buildDropdown(
                        'Family Values', ['Traditional', 'Modern', 'Mixed'])),
              ],
            ),
            const SizedBox(height: AppSpacing.md),
            _buildTextField("Father's Occupation", 'Retired IAS Officer'),
            const SizedBox(height: AppSpacing.md),
            _buildTextField("Mother's Occupation", 'Homemaker'),
            const SizedBox(height: AppSpacing.md),
            _buildTextField(
                'Siblings', '1 Brother (Doctor), 1 Sister (Engineer)'),
          ],
        ),
        const SizedBox(height: AppSpacing.md),
        _buildCard(
          title: 'Community Details',
          children: [
            _buildDropdown(
                'Religion', ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Other']),
            const SizedBox(height: AppSpacing.md),
            _buildTextField('Caste/Community', 'Brahmin'),
            const SizedBox(height: AppSpacing.md),
            _buildTextField('Gotra (if applicable)', 'Kashyap'),
          ],
        ),
      ],
    );
  }

  Widget _buildPreferencesSection() {
    return Column(
      children: [
        _buildCard(
          title: 'Partner Preferences',
          children: [
            Text('Age Range', style: AppTypography.labelMedium),
            RangeSlider(
              values: const RangeValues(24, 32),
              min: 18,
              max: 50,
              onChanged: (v) {},
              activeColor: AppColors.primary,
            ),
            const SizedBox(height: AppSpacing.md),
            _buildDropdown('Education',
                ['Any Medical Degree', 'MBBS or higher', 'MD/MS/DM preferred']),
            const SizedBox(height: AppSpacing.md),
            _buildChipField(
                'Preferred Locations', ['Delhi NCR', 'Mumbai', 'Bangalore']),
          ],
        ),
        const SizedBox(height: AppSpacing.md),
        _buildCard(
          title: 'Dealbreakers',
          children: [
            _buildCheckboxTile('Must be vegetarian', true),
            _buildCheckboxTile('Must be non-smoker', true),
            _buildCheckboxTile('Willing to relocate', false),
            _buildCheckboxTile('Same community only', false),
          ],
        ),
      ],
    );
  }

  Widget _buildMediaSection() {
    return Column(
      children: [
        _buildCard(
          title: 'Photos',
          children: [
            Text('Add up to 6 photos',
                style: AppTypography.bodySmall
                    .copyWith(color: AppColors.textSecondary)),
            const SizedBox(height: AppSpacing.md),
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 3,
                crossAxisSpacing: 8,
                mainAxisSpacing: 8,
              ),
              itemCount: 6,
              itemBuilder: (context, index) {
                if (index < 2) {
                  return Container(
                    decoration: BoxDecoration(
                      color: AppColors.slate200,
                      borderRadius: BorderRadius.circular(AppRadius.md),
                    ),
                    child:
                        Icon(Icons.person, size: 40, color: AppColors.slate400),
                  );
                }
                return Container(
                  decoration: BoxDecoration(
                    color: AppColors.slate50,
                    borderRadius: BorderRadius.circular(AppRadius.md),
                    border: Border.all(
                        color: AppColors.slate200, style: BorderStyle.solid),
                  ),
                  child: Icon(Icons.add_photo_alternate,
                      size: 32, color: AppColors.slate300),
                );
              },
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.md),
        _buildCard(
          title: 'Voice Introduction',
          children: [
            Container(
              padding: const EdgeInsets.all(AppSpacing.lg),
              decoration: BoxDecoration(
                color: AppColors.slate50,
                borderRadius: BorderRadius.circular(AppRadius.md),
                border: Border.all(color: AppColors.slate200),
              ),
              child: Column(
                children: [
                  Icon(Icons.mic, size: 48, color: AppColors.slate400),
                  const SizedBox(height: AppSpacing.sm),
                  Text(
                    'Add a 30-second voice note',
                    style: AppTypography.bodySmall
                        .copyWith(color: AppColors.textSecondary),
                  ),
                  const SizedBox(height: AppSpacing.md),
                  ElevatedButton.icon(
                    onPressed: () {},
                    icon: const Icon(Icons.mic, size: 16),
                    label: const Text('Record Now'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ],
    );
  }

  // Helper widgets
  Widget _buildCard({required String title, required List<Widget> children}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: AppColors.slate200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: AppTypography.titleSmall),
          const SizedBox(height: AppSpacing.md),
          ...children,
        ],
      ),
    );
  }

  Widget _buildTextField(String label, String value,
      {TextInputType? keyboardType}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: AppTypography.labelMedium),
        const SizedBox(height: AppSpacing.xs),
        TextFormField(
          initialValue: value,
          keyboardType: keyboardType,
          decoration: InputDecoration(
            filled: true,
            fillColor: AppColors.slate50,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppRadius.md),
              borderSide: BorderSide(color: AppColors.slate200),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppRadius.md),
              borderSide: BorderSide(color: AppColors.slate200),
            ),
            contentPadding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.md,
              vertical: AppSpacing.sm,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildDropdown(String label, List<String> options) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: AppTypography.labelMedium),
        const SizedBox(height: AppSpacing.xs),
        DropdownButtonFormField<String>(
          value: options.first,
          items: options
              .map((o) => DropdownMenuItem(value: o, child: Text(o)))
              .toList(),
          onChanged: (v) {},
          decoration: InputDecoration(
            filled: true,
            fillColor: AppColors.slate50,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppRadius.md),
              borderSide: BorderSide(color: AppColors.slate200),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppRadius.md),
              borderSide: BorderSide(color: AppColors.slate200),
            ),
            contentPadding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.md,
              vertical: AppSpacing.sm,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSliderField(
      String label, String displayValue, double value, double min, double max) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: AppTypography.labelMedium),
        const SizedBox(height: AppSpacing.xs),
        Row(
          children: [
            Icon(Icons.straighten, color: AppColors.slate400),
            Expanded(
              child: Slider(
                value: value,
                min: min,
                max: max,
                onChanged: (v) {},
                activeColor: AppColors.primary,
              ),
            ),
            Text(displayValue,
                style: AppTypography.labelMedium
                    .copyWith(fontWeight: FontWeight.w700)),
          ],
        ),
      ],
    );
  }

  Widget _buildChipField(String label, List<String> values) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: AppTypography.labelMedium),
        const SizedBox(height: AppSpacing.xs),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            ...values.map((v) => Chip(
                  label: Text(v),
                  deleteIcon: Icon(Icons.close, size: 14),
                  onDeleted: () {},
                )),
            ActionChip(
              avatar: Icon(Icons.add, size: 14),
              label: const Text('Add'),
              onPressed: () {},
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildEducationItem(
      String degree, String institution, String years, String? note) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.slate50,
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(color: AppColors.slate100),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              border: Border.all(color: AppColors.slate200),
            ),
            child: Icon(Icons.school, size: 18, color: AppColors.primary),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(degree,
                        style: AppTypography.labelMedium
                            .copyWith(fontWeight: FontWeight.w700)),
                    Text(years,
                        style: AppTypography.caption
                            .copyWith(color: AppColors.slate400)),
                  ],
                ),
                Text(institution,
                    style: AppTypography.bodySmall
                        .copyWith(color: AppColors.slate600)),
                if (note != null)
                  Text(note,
                      style: AppTypography.caption
                          .copyWith(color: AppColors.textSecondary)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCheckboxTile(String label, bool value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.xs),
      child: Row(
        children: [
          SizedBox(
            width: 24,
            height: 24,
            child: Checkbox(
              value: value,
              onChanged: (v) {},
              activeColor: AppColors.primary,
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
          Text(label, style: AppTypography.bodySmall),
        ],
      ),
    );
  }
}
