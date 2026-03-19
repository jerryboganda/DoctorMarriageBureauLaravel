import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../theme/app_colors.dart';
import '../theme/app_decorations.dart';
import '../widgets/dmb_card.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';

class ProgressionScreen extends ConsumerStatefulWidget {
  const ProgressionScreen({super.key});

  @override
  ConsumerState<ProgressionScreen> createState() => _ProgressionScreenState();
}

class _ProgressionScreenState extends ConsumerState<ProgressionScreen> {
  bool _loading = true;
  Map<String, dynamic> _stats = {};

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    try {
      final api = ref.read(apiServiceProvider);
      final res = await api.get('/dashboard/stats');
      if (res.statusCode == 200 && res.data != null) {
        setState(() {
          _stats = Map<String, dynamic>.from(res.data is Map ? res.data : {});
        });
      }
    } catch (_) {}
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    return RefreshIndicator(
      onRefresh: _loadData,
      color: AppColors.primary,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Journey header
          DmbCard(
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    AppColors.primary.withOpacity(0.05),
                    AppColors.primary.withOpacity(0.02),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(AppDecorations.radiusXl),
              ),
              child: const Column(
                children: [
                  Icon(LucideIcons.trendingUp,
                      size: 32, color: AppColors.primary),
                  SizedBox(height: 12),
                  Text('Your Journey',
                      style: TextStyle(
                          fontSize: 18, fontWeight: FontWeight.w700)),
                  SizedBox(height: 4),
                  Text('Track your progress on DMB',
                      style: TextStyle(
                          fontSize: 13, color: AppColors.slate500)),
                ],
              ),
            ),
          ),

          const SizedBox(height: 20),

          // Stats grid
          Row(
            children: [
              _statCard('Profile Views',
                  '${_stats['profile_views'] ?? _stats['total_views'] ?? 0}',
                  LucideIcons.eye, AppColors.info),
              const SizedBox(width: 12),
              _statCard('Proposals Sent',
                  '${_stats['sent_interests'] ?? _stats['proposals_sent'] ?? 0}',
                  LucideIcons.send, AppColors.primary),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              _statCard('Proposals Received',
                  '${_stats['received_interests'] ?? _stats['proposals_received'] ?? 0}',
                  LucideIcons.inbox, AppColors.success),
              const SizedBox(width: 12),
              _statCard('Mutual Matches',
                  '${_stats['mutual_matches'] ?? 0}',
                  LucideIcons.heart, const Color(0xFFEF4444)),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              _statCard('Messages',
                  '${_stats['total_messages'] ?? 0}',
                  LucideIcons.messageCircle, const Color(0xFFA855F7)),
              const SizedBox(width: 12),
              _statCard('Days Active',
                  '${_stats['days_active'] ?? _stats['member_since_days'] ?? 0}',
                  LucideIcons.calendar, const Color(0xFFD97706)),
            ],
          ),

          const SizedBox(height: 24),

          // Milestones
          const Text('Milestones',
              style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: AppColors.slate800)),
          const SizedBox(height: 12),

          _milestoneItem(
            'Complete Profile',
            'Fill out all profile sections',
            LucideIcons.userCheck,
            (_stats['profile_completion'] ?? 0) >= 80,
          ),
          _milestoneItem(
            'First Proposal',
            'Send your first proposal',
            LucideIcons.send,
            (_stats['sent_interests'] ?? _stats['proposals_sent'] ?? 0) > 0,
          ),
          _milestoneItem(
            'First Match',
            'Get your first mutual match',
            LucideIcons.heart,
            (_stats['mutual_matches'] ?? 0) > 0,
          ),
          _milestoneItem(
            'Verify Identity',
            'Complete identity verification',
            LucideIcons.shieldCheck,
            _stats['is_verified'] == true || _stats['is_verified'] == 1,
          ),
          _milestoneItem(
            'Upload Photos',
            'Add at least 3 photos to your gallery',
            LucideIcons.camera,
            (_stats['gallery_count'] ?? 0) >= 3,
          ),
          _milestoneItem(
            'Start a Conversation',
            'Send your first message',
            LucideIcons.messageCircle,
            (_stats['total_messages'] ?? 0) > 0,
          ),
        ],
      ),
    );
  }

  Widget _statCard(
      String label, String value, IconData icon, Color color) {
    return Expanded(
      child: DmbCard(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, size: 20, color: color),
              const SizedBox(height: 8),
              Text(value,
                  style: const TextStyle(
                      fontSize: 22, fontWeight: FontWeight.w700)),
              const SizedBox(height: 2),
              Text(label,
                  style: const TextStyle(
                      fontSize: 12, color: AppColors.slate500)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _milestoneItem(
      String title, String subtitle, IconData icon, bool completed) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: DmbCard(
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: completed
                      ? AppColors.success.withOpacity(0.1)
                      : AppColors.slate100,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  completed ? LucideIcons.checkCircle : icon,
                  size: 20,
                  color: completed ? AppColors.success : AppColors.slate400,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: completed
                              ? AppColors.slate700
                              : AppColors.slate500,
                          decoration: completed
                              ? TextDecoration.lineThrough
                              : null,
                        )),
                    Text(subtitle,
                        style: const TextStyle(
                            fontSize: 12, color: AppColors.slate400)),
                  ],
                ),
              ),
              if (completed)
                const Icon(LucideIcons.check,
                    size: 18, color: AppColors.success),
            ],
          ),
        ),
      ),
    );
  }
}
