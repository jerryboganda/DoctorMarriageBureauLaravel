import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/core.dart';

/// Track stage in the relationship journey
enum TrackStage {
  chatting('Chatting'),
  meeting('Meeting'),
  courtship('Courtship'),
  engaged('Engaged');

  final String label;
  const TrackStage(this.label);
}

/// Mock track data
class _ActiveTrack {
  final String id;
  final String name;
  final String specialty;
  final String? avatarUrl;
  final TrackStage stage;
  final String stageLabel;
  final String lastInteraction;
  final String nextAction;
  final int progress;

  const _ActiveTrack({
    required this.id,
    required this.name,
    required this.specialty,
    this.avatarUrl,
    required this.stage,
    required this.stageLabel,
    required this.lastInteraction,
    required this.nextAction,
    required this.progress,
  });
}

/// Progression Screen - Relationship journey tracker
/// Transpiled from ProgressionView.tsx
class ProgressionScreen extends ConsumerStatefulWidget {
  const ProgressionScreen({super.key});

  @override
  ConsumerState<ProgressionScreen> createState() => _ProgressionScreenState();
}

class _ProgressionScreenState extends ConsumerState<ProgressionScreen> {
  String? _selectedTrackId;

  // Mock data
  final _activeTracks = const [
    _ActiveTrack(
      id: '1',
      name: 'Dr. Aditi Sharma',
      specialty: 'Cardiologist',
      stage: TrackStage.courtship,
      stageLabel: 'Exclusive Courtship',
      lastInteraction: '2 days ago',
      nextAction: 'Plan family dinner',
      progress: 75,
    ),
    _ActiveTrack(
      id: '2',
      name: 'Dr. Rohan Gupta',
      specialty: 'Orthopedic Surgeon',
      stage: TrackStage.meeting,
      stageLabel: 'First Meetings',
      lastInteraction: 'Yesterday',
      nextAction: 'Post-date feedback',
      progress: 40,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final selectedTrack = _selectedTrackId != null
        ? _activeTracks.firstWhere((t) => t.id == _selectedTrackId)
        : null;

    return CustomScrollView(
      slivers: [
        // Header
        SliverToBoxAdapter(
          child: Container(
            padding: const EdgeInsets.all(AppSpacing.lg),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border(bottom: BorderSide(color: AppColors.slate200)),
            ),
            child: Row(
              children: [
                if (_selectedTrackId != null)
                  IconButton(
                    onPressed: () => setState(() => _selectedTrackId = null),
                    icon: const Icon(Icons.arrow_back),
                    padding: EdgeInsets.zero,
                  ),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _selectedTrackId != null
                            ? 'Relationship Journey'
                            : 'Progression Pipeline',
                        style: AppTypography.headlineSmall,
                      ),
                      Text(
                        _selectedTrackId != null
                            ? 'Managing connection with ${selectedTrack?.name}'
                            : 'Track your active connections',
                        style: AppTypography.bodySmall.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                if (_selectedTrackId == null)
                  ElevatedButton.icon(
                    onPressed: () {},
                    icon: const Icon(Icons.calendar_month, size: 16),
                    label: const Text('Sync Calendar'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.slate900,
                      foregroundColor: Colors.white,
                    ),
                  ),
              ],
            ),
          ),
        ),

        // Content
        if (_selectedTrackId != null && selectedTrack != null)
          ..._buildRelationshipDetail(selectedTrack)
        else
          ..._buildPipelineDashboard(),
      ],
    );
  }

  List<Widget> _buildPipelineDashboard() {
    return [
      // Quick Stats
      SliverToBoxAdapter(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Row(
            children: [
              Expanded(
                  child: _buildStatCard(Icons.calendar_today, '3 Meetings',
                      'Scheduled this month', Colors.blue)),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                  child: _buildStatCard(Icons.people, '2 Families',
                      'Met in-person', AppColors.purple)),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                  child: _buildStatCard(Icons.favorite, '1 Exclusive',
                      'Active courtships', AppColors.success)),
            ],
          ),
        ),
      ),

      // Active Tracks Header
      SliverToBoxAdapter(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(
              AppSpacing.md, AppSpacing.lg, AppSpacing.md, AppSpacing.sm),
          child: Text('Active Tracks', style: AppTypography.titleMedium),
        ),
      ),

      // Active Track Cards
      SliverPadding(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
        sliver: SliverGrid(
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            childAspectRatio: 0.85,
            crossAxisSpacing: AppSpacing.md,
            mainAxisSpacing: AppSpacing.md,
          ),
          delegate: SliverChildBuilderDelegate(
            (context, index) {
              if (index < _activeTracks.length) {
                return _buildTrackCard(_activeTracks[index]);
              }
              return _buildAddNewCard();
            },
            childCount: _activeTracks.length + 1,
          ),
        ),
      ),

      // Bottom spacing
      const SliverToBoxAdapter(child: SizedBox(height: AppSpacing.xl)),
    ];
  }

  Widget _buildStatCard(
      IconData icon, String title, String subtitle, Color color) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: AppColors.slate200),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: AppTypography.titleSmall),
                Text(
                  subtitle,
                  style: AppTypography.caption
                      .copyWith(color: AppColors.textSecondary),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTrackCard(_ActiveTrack track) {
    return GestureDetector(
      onTap: () => setState(() => _selectedTrackId = track.id),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(AppRadius.lg),
          border: Border.all(color: AppColors.slate200),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Header with gradient
            Container(
              height: 80,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [AppColors.slate100, AppColors.slate200],
                ),
              ),
              child: Stack(
                children: [
                  Positioned(
                    top: AppSpacing.sm,
                    right: AppSpacing.sm,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.sm,
                        vertical: AppSpacing.xxs,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.5),
                        borderRadius: BorderRadius.circular(AppRadius.full),
                      ),
                      child: Text(
                        track.stageLabel,
                        style: AppTypography.caption.copyWith(
                          color: AppColors.slate700,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Content
            Padding(
              padding: const EdgeInsets.all(AppSpacing.md),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Avatar overlapping header
                  Transform.translate(
                    offset: const Offset(0, -48),
                    child: Container(
                      width: 64,
                      height: 64,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppColors.slate300,
                        border: Border.all(color: Colors.white, width: 4),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.1),
                            blurRadius: 8,
                          ),
                        ],
                      ),
                      child: ClipOval(
                        child: track.avatarUrl != null
                            ? Image.network(track.avatarUrl!, fit: BoxFit.cover)
                            : Icon(Icons.person,
                                color: AppColors.slate400, size: 32),
                      ),
                    ),
                  ),

                  Transform.translate(
                    offset: const Offset(0, -32),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(track.name, style: AppTypography.titleSmall),
                        Text(
                          track.specialty,
                          style: AppTypography.caption
                              .copyWith(color: AppColors.textSecondary),
                        ),

                        const SizedBox(height: AppSpacing.md),

                        // Progress Bar
                        Row(
                          children: [
                            Text('Progress', style: AppTypography.caption),
                            const Spacer(),
                            Text(
                              '${track.progress}%',
                              style: AppTypography.labelSmall.copyWith(
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        LinearProgressIndicator(
                          value: track.progress / 100,
                          backgroundColor: AppColors.slate100,
                          valueColor: AlwaysStoppedAnimation(AppColors.primary),
                          borderRadius: BorderRadius.circular(4),
                        ),

                        const SizedBox(height: AppSpacing.md),

                        // Next Action
                        Container(
                          padding: const EdgeInsets.all(AppSpacing.sm),
                          decoration: BoxDecoration(
                            color: AppColors.slate50,
                            borderRadius: BorderRadius.circular(AppRadius.sm),
                            border: Border.all(color: AppColors.slate100),
                          ),
                          child: Row(
                            children: [
                              Icon(Icons.access_time,
                                  size: 12, color: AppColors.textSecondary),
                              const SizedBox(width: 4),
                              Expanded(
                                child: Text(
                                  'Next: ${track.nextAction}',
                                  style: AppTypography.caption.copyWith(
                                    color: AppColors.slate600,
                                    fontWeight: FontWeight.w600,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              Icon(Icons.chevron_right,
                                  size: 14, color: AppColors.slate400),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAddNewCard() {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(
            color: AppColors.slate200, width: 2, style: BorderStyle.solid),
      ),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: AppColors.slate100,
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.add, color: AppColors.slate400),
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              'Discover New Matches',
              style:
                  AppTypography.labelMedium.copyWith(color: AppColors.slate500),
            ),
          ],
        ),
      ),
    );
  }

  List<Widget> _buildRelationshipDetail(_ActiveTrack track) {
    return [
      // Profile Card
      SliverToBoxAdapter(
        child: Container(
          margin: const EdgeInsets.all(AppSpacing.md),
          padding: const EdgeInsets.all(AppSpacing.lg),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(AppRadius.lg),
            border: Border.all(color: AppColors.slate200),
          ),
          child: Row(
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.slate200,
                  border: Border.all(color: AppColors.slate50, width: 4),
                ),
                child: track.avatarUrl != null
                    ? ClipOval(
                        child:
                            Image.network(track.avatarUrl!, fit: BoxFit.cover))
                    : Icon(Icons.person, size: 40, color: AppColors.slate400),
              ),
              const SizedBox(width: AppSpacing.lg),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(track.name, style: AppTypography.titleMedium),
                        const SizedBox(width: AppSpacing.sm),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: AppSpacing.sm,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.success.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(AppRadius.full),
                            border: Border.all(
                                color: AppColors.success.withOpacity(0.2)),
                          ),
                          child: Text(
                            track.stageLabel,
                            style: AppTypography.caption.copyWith(
                              color: AppColors.success,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      track.specialty,
                      style: AppTypography.bodySmall
                          .copyWith(color: AppColors.textSecondary),
                    ),
                    const SizedBox(height: AppSpacing.md),
                    // Stage Stepper
                    _buildStageStepper(track.stage),
                  ],
                ),
              ),
              Column(
                children: [
                  IconButton(
                    onPressed: () {},
                    icon: Icon(Icons.videocam, color: AppColors.slate600),
                    style: IconButton.styleFrom(
                      backgroundColor: AppColors.slate100,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  IconButton(
                    onPressed: () {},
                    icon: Icon(Icons.phone, color: AppColors.slate600),
                    style: IconButton.styleFrom(
                      backgroundColor: AppColors.slate100,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),

      // Tasks Section
      SliverToBoxAdapter(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.check_circle, color: AppColors.success, size: 20),
                  const SizedBox(width: AppSpacing.xs),
                  Text('Current Stage Tasks', style: AppTypography.titleSmall),
                ],
              ),
              const SizedBox(height: AppSpacing.md),
              _buildTaskList(),
            ],
          ),
        ),
      ),

      // Timeline Section
      SliverToBoxAdapter(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.access_time, color: AppColors.warning, size: 20),
                  const SizedBox(width: AppSpacing.xs),
                  Text('Interaction Log', style: AppTypography.titleSmall),
                ],
              ),
              const SizedBox(height: AppSpacing.md),
              _buildTimeline(),
            ],
          ),
        ),
      ),

      const SliverToBoxAdapter(child: SizedBox(height: AppSpacing.xl)),
    ];
  }

  Widget _buildStageStepper(TrackStage currentStage) {
    final stages = ['Chatting', 'Meeting', 'Courtship', 'Engaged'];
    final currentIndex = TrackStage.values.indexOf(currentStage);

    return Row(
      children: List.generate(stages.length, (index) {
        final isCompleted = index <= currentIndex;
        return Expanded(
          child: Row(
            children: [
              Container(
                width: 12,
                height: 12,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isCompleted ? AppColors.primary : Colors.white,
                  border: Border.all(
                    color: isCompleted ? AppColors.primary : AppColors.slate300,
                    width: 2,
                  ),
                ),
              ),
              if (index < stages.length - 1)
                Expanded(
                  child: Container(
                    height: 2,
                    color: isCompleted ? AppColors.primary : AppColors.slate200,
                  ),
                ),
            ],
          ),
        );
      }),
    );
  }

  Widget _buildTaskList() {
    final tasks = [
      ('Exchange detailed biodata', true),
      ('Verify employment details', true),
      ('First family video call', true),
      ('In-person family dinner', false),
      ('Discuss financial compatibility', false),
      ('Align on relocation plans', false),
    ];

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: AppColors.slate200),
      ),
      child: Column(
        children: tasks.map((task) {
          return Container(
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(
              color: task.$2 ? AppColors.slate50 : Colors.white,
              border: Border(bottom: BorderSide(color: AppColors.slate100)),
            ),
            child: Row(
              children: [
                Container(
                  width: 20,
                  height: 20,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: task.$2 ? AppColors.success : Colors.white,
                    border: Border.all(
                      color: task.$2 ? AppColors.success : AppColors.slate300,
                    ),
                  ),
                  child: task.$2
                      ? Icon(Icons.check, size: 12, color: Colors.white)
                      : null,
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Text(
                    task.$1,
                    style: AppTypography.bodySmall.copyWith(
                      color: task.$2 ? AppColors.slate400 : AppColors.slate700,
                      decoration: task.$2 ? TextDecoration.lineThrough : null,
                      fontWeight: task.$2 ? FontWeight.w400 : FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildTimeline() {
    final events = [
      (
        Icons.videocam,
        'Video Call (45 mins)',
        'Yesterday',
        'Discussed research interests'
      ),
      (
        Icons.mail,
        'Shared Kundali/Horoscope',
        '3 days ago',
        'Families reviewing'
      ),
      (
        Icons.favorite,
        'Moved to Courtship',
        '1 week ago',
        'Both agreed to exclusivity'
      ),
    ];

    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: AppColors.slate200),
      ),
      child: Column(
        children: events.map((event) {
          return Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.md),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                    border: Border.all(color: AppColors.slate200),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.03),
                        blurRadius: 4,
                      ),
                    ],
                  ),
                  child: Icon(event.$1, size: 14, color: AppColors.slate500),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(event.$2, style: AppTypography.labelMedium),
                          const SizedBox(width: AppSpacing.sm),
                          Text(
                            event.$3,
                            style: AppTypography.caption.copyWith(
                              color: AppColors.slate400,
                            ),
                          ),
                        ],
                      ),
                      Text(
                        event.$4,
                        style: AppTypography.caption.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }
}
