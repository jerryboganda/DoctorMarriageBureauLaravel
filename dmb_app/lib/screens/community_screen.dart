import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../theme/app_colors.dart';
import '../widgets/dmb_card.dart';
import '../widgets/dmb_button.dart';
import '../widgets/empty_state.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';

class CommunityScreen extends ConsumerStatefulWidget {
  const CommunityScreen({super.key});

  @override
  ConsumerState<CommunityScreen> createState() => _CommunityScreenState();
}

class _CommunityScreenState extends ConsumerState<CommunityScreen> {
  bool _loading = true;
  List<Map<String, dynamic>> _communities = [];

  @override
  void initState() {
    super.initState();
    _loadCommunities();
  }

  Future<void> _loadCommunities() async {
    setState(() => _loading = true);
    try {
      final api = ref.read(apiServiceProvider);
      final res = await api.get('/communities');
      if (res.statusCode == 200 && res.data != null) {
        final data = res.data is List ? res.data : (res.data['data'] ?? []);
        setState(() {
          _communities = List<Map<String, dynamic>>.from(
              data.map((e) => Map<String, dynamic>.from(e)));
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

    if (_communities.isEmpty) {
      return RefreshIndicator(
        onRefresh: _loadCommunities,
        color: AppColors.primary,
        child: ListView(
          children: const [
            SizedBox(height: 100),
            EmptyState(
              icon: LucideIcons.users,
              title: 'Communities',
              subtitle:
                  'Join communities of medical professionals to connect with like-minded individuals',
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadCommunities,
      color: AppColors.primary,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _communities.length,
        itemBuilder: (ctx, i) {
          final c = _communities[i];
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: DmbCard(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            color: AppColors.primary10,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Icon(
                            _communityIcon(c['type'] ?? ''),
                            color: AppColors.primary,
                            size: 22,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                c['name'] ?? 'Community',
                                style: const TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w600),
                              ),
                              Text(
                                '${c['members_count'] ?? 0} members',
                                style: const TextStyle(
                                    fontSize: 12,
                                    color: AppColors.slate500),
                              ),
                            ],
                          ),
                        ),
                        if (c['is_joined'] == true)
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppColors.success.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Text('Joined',
                                style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                    color: AppColors.success)),
                          )
                        else
                          DmbButton(
                            text: 'Join',
                            isFullWidth: false,
                            height: 32,
                            padding: const EdgeInsets.symmetric(
                                horizontal: 16, vertical: 4),
                            onPressed: () => _joinCommunity(c['id']),
                          ),
                      ],
                    ),
                    if (c['description'] != null) ...[
                      const SizedBox(height: 8),
                      Text(
                        c['description'],
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                            fontSize: 13, color: AppColors.slate500),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  IconData _communityIcon(String type) {
    switch (type.toLowerCase()) {
      case 'speciality':
        return LucideIcons.stethoscope;
      case 'region':
        return LucideIcons.mapPin;
      case 'interest':
        return LucideIcons.heart;
      default:
        return LucideIcons.users;
    }
  }

  Future<void> _joinCommunity(dynamic id) async {
    try {
      final api = ref.read(apiServiceProvider);
      await api.post('/communities/$id/join');
      _loadCommunities();
    } catch (_) {}
  }
}
