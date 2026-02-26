import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/core.dart';
import '../../models/profile_match.dart';
import '../../providers/providers.dart';
import '../../widgets/widgets.dart';

/// Discovery tab to filter profiles
enum DiscoveryTab { all, agentPicks, highIntent }

/// Discovery Screen - Browse and search profiles
/// Transpiled from DiscoveryView.tsx
class DiscoveryScreen extends ConsumerStatefulWidget {
  const DiscoveryScreen({super.key});

  @override
  ConsumerState<DiscoveryScreen> createState() => _DiscoveryScreenState();
}

class _DiscoveryScreenState extends ConsumerState<DiscoveryScreen> {
  final _searchController = TextEditingController();
  bool _showFilters = false;
  bool _isAnonymous = false;
  bool _isTravelMode = false;
  bool _isGridView = true;
  DiscoveryTab _activeTab = DiscoveryTab.all;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final profilesAsync = ref.watch(profilesProvider);

    return Column(
      children: [
        // Top Search & Controls Bar
        _buildSearchBar(),

        // Toolbar / Subheader
        _buildToolbar(),

        // Main Content
        Expanded(
          child: Row(
            children: [
              // Filters Panel (animated slide)
              AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                width: _showFilters ? 280 : 0,
                child: _showFilters ? _buildFiltersPanel() : null,
              ),

              // Content Area
              Expanded(
                child: profilesAsync.when(
                  data: (profiles) => _buildContent(profiles),
                  loading: () =>
                      const Center(child: CircularProgressIndicator()),
                  error: (e, _) => Center(child: Text('Error: $e')),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSearchBar() {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: AppColors.slate200)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          // Search Input
          Expanded(
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search by specialty, name, ID...',
                hintStyle: AppTypography.bodyMedium.copyWith(
                  color: AppColors.slate400,
                ),
                prefixIcon: Icon(Icons.search, color: AppColors.slate400),
                filled: true,
                fillColor: AppColors.slate100,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(AppRadius.full),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.md,
                  vertical: AppSpacing.sm,
                ),
              ),
            ),
          ),

          const SizedBox(width: AppSpacing.md),

          // Match Tuner Button
          ElevatedButton.icon(
            onPressed: () {
              // TODO: Open MatchTuner modal
            },
            icon: const Icon(Icons.tune, size: 14),
            label: const Text('Tuner'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.slate900,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.sm,
                vertical: AppSpacing.sm,
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(AppRadius.full),
              ),
            ),
          ),

          const SizedBox(width: AppSpacing.xs),

          // Travel Mode
          _buildToggleButton(
            icon: Icons.flight,
            isActive: _isTravelMode,
            onTap: () => setState(() => _isTravelMode = !_isTravelMode),
            activeColor: Colors.blue,
          ),

          const SizedBox(width: AppSpacing.xs),

          // Anonymous Toggle
          _buildToggleButton(
            icon: _isAnonymous ? Icons.visibility_off : Icons.visibility,
            isActive: _isAnonymous,
            onTap: () => setState(() => _isAnonymous = !_isAnonymous),
          ),
        ],
      ),
    );
  }

  Widget _buildToggleButton({
    required IconData icon,
    required bool isActive,
    required VoidCallback onTap,
    Color? activeColor,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppRadius.full),
        child: Container(
          padding: const EdgeInsets.all(AppSpacing.sm),
          decoration: BoxDecoration(
            color: isActive
                ? (activeColor?.withOpacity(0.1) ?? AppColors.slate900)
                : Colors.white,
            shape: BoxShape.circle,
            border: Border.all(
              color: isActive
                  ? (activeColor ?? AppColors.slate900)
                  : AppColors.slate200,
            ),
          ),
          child: Icon(
            icon,
            size: 18,
            color:
                isActive ? (activeColor ?? Colors.white) : AppColors.slate600,
          ),
        ),
      ),
    );
  }

  Widget _buildToolbar() {
    return Container(
      height: 52,
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: AppColors.slate200)),
      ),
      child: Row(
        children: [
          // Filters Button
          TextButton.icon(
            onPressed: () => setState(() => _showFilters = !_showFilters),
            icon: Icon(Icons.filter_list,
                size: 16,
                color: _showFilters ? AppColors.primary : AppColors.slate700),
            label: Text('Filters',
                style: TextStyle(
                    color:
                        _showFilters ? AppColors.primary : AppColors.slate700)),
          ),

          const SizedBox(width: AppSpacing.sm),

          // Discovery Tabs
          Expanded(
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _buildTabButton('All', DiscoveryTab.all),
                  _buildTabButton('Agent Picks', DiscoveryTab.agentPicks,
                      icon: Icons.verified_user),
                  _buildTabButton('High Intent', DiscoveryTab.highIntent,
                      icon: Icons.workspace_premium),
                ],
              ),
            ),
          ),

          // View Mode Toggle
          Row(
            children: [
              _buildViewModeButton(Icons.grid_view, true),
              const SizedBox(width: 4),
              _buildViewModeButton(Icons.map_outlined, false),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTabButton(String label, DiscoveryTab tab, {IconData? icon}) {
    final isActive = _activeTab == tab;
    return Padding(
      padding: const EdgeInsets.only(right: AppSpacing.xs),
      child: FilterChip(
        label: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(icon,
                  size: 14,
                  color: isActive ? AppColors.slate900 : AppColors.slate500),
              const SizedBox(width: 4),
            ],
            Text(label),
          ],
        ),
        selected: isActive,
        onSelected: (_) => setState(() => _activeTab = tab),
        selectedColor: Colors.white,
        backgroundColor: AppColors.slate100,
        labelStyle: AppTypography.labelSmall.copyWith(
          color: isActive ? AppColors.slate900 : AppColors.slate500,
          fontWeight: FontWeight.w600,
        ),
        side: BorderSide.none,
        showCheckmark: false,
      ),
    );
  }

  Widget _buildViewModeButton(IconData icon, bool isGrid) {
    final isActive = _isGridView == isGrid;
    return GestureDetector(
      onTap: () => setState(() => _isGridView = isGrid),
      child: Container(
        padding: const EdgeInsets.all(6),
        decoration: BoxDecoration(
          color: isActive ? AppColors.slate200 : Colors.transparent,
          borderRadius: BorderRadius.circular(4),
        ),
        child: Icon(
          icon,
          size: 18,
          color: isActive ? AppColors.slate900 : AppColors.slate400,
        ),
      ),
    );
  }

  Widget _buildFiltersPanel() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(right: BorderSide(color: AppColors.slate200)),
      ),
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Filters', style: AppTypography.titleSmall),
                IconButton(
                  onPressed: () => setState(() => _showFilters = false),
                  icon: Icon(Icons.close, size: 18),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.lg),

            // Age Range
            Text('Age Range', style: AppTypography.labelMedium),
            const SizedBox(height: AppSpacing.sm),
            RangeSlider(
              values: const RangeValues(24, 35),
              min: 18,
              max: 50,
              onChanged: (v) {},
              activeColor: AppColors.primary,
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('24', style: AppTypography.caption),
                Text('35', style: AppTypography.caption),
              ],
            ),

            const SizedBox(height: AppSpacing.lg),

            // Location
            Text('Location', style: AppTypography.labelMedium),
            const SizedBox(height: AppSpacing.sm),
            _buildCheckboxTile('Near me (50km)', false),
            _buildCheckboxTile('Anywhere in India', true),

            const SizedBox(height: AppSpacing.lg),

            // Profession Tags
            Text('Profession', style: AppTypography.labelMedium),
            const SizedBox(height: AppSpacing.sm),
            Wrap(
              spacing: 4,
              runSpacing: 4,
              children: ['Doctor', 'Surgeon', 'Dentist']
                  .map((p) => Chip(
                        label: Text(p, style: AppTypography.caption),
                        backgroundColor: AppColors.slate100,
                        side: BorderSide.none,
                        padding: EdgeInsets.zero,
                        materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ))
                  .toList(),
            ),

            const SizedBox(height: AppSpacing.xl),

            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {},
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                ),
                child: const Text('Apply'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCheckboxTile(String label, bool value) {
    return Row(
      children: [
        SizedBox(
          width: 24,
          height: 24,
          child: Checkbox(
            value: value,
            onChanged: (v) {},
            activeColor: AppColors.primary,
            materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
          ),
        ),
        const SizedBox(width: 8),
        Text(label, style: AppTypography.bodySmall),
      ],
    );
  }

  Widget _buildContent(List<ProfileMatch> profiles) {
    List<ProfileMatch> displayedProfiles = profiles;
    if (_activeTab == DiscoveryTab.agentPicks) {
      displayedProfiles =
          profiles.where((p) => p.isAgentPick ?? false).toList();
    } else if (_activeTab == DiscoveryTab.highIntent) {
      displayedProfiles =
          profiles.where((p) => p.isHighIntent ?? false).toList();
    }

    if (displayedProfiles.isEmpty) {
      displayedProfiles = profiles; // Fallback to all profiles
    }

    if (_isGridView) {
      return GridView.builder(
        padding: const EdgeInsets.all(AppSpacing.md),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          childAspectRatio: 0.7,
          crossAxisSpacing: AppSpacing.md,
          mainAxisSpacing: AppSpacing.md,
        ),
        itemCount: displayedProfiles.length,
        itemBuilder: (context, index) {
          return ProfileGridCard(
            profile: displayedProfiles[index],
            onTap: () {
              // TODO: Open profile detail
            },
          );
        },
      );
    }

    // Map view placeholder
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.map, size: 64, color: AppColors.slate300),
          const SizedBox(height: AppSpacing.md),
          Text('Map View', style: AppTypography.titleMedium),
          Text('Coming soon', style: AppTypography.caption),
        ],
      ),
    );
  }
}
