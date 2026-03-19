import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../theme/app_colors.dart';
import '../theme/app_decorations.dart';
import '../widgets/dmb_button.dart';
import '../widgets/dmb_card.dart';
import '../widgets/dmb_text_field.dart';
import '../widgets/dmb_avatar.dart';
import '../widgets/empty_state.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';

class FamilyPortalScreen extends ConsumerStatefulWidget {
  const FamilyPortalScreen({super.key});

  @override
  ConsumerState<FamilyPortalScreen> createState() => _FamilyPortalScreenState();
}

class _FamilyPortalScreenState extends ConsumerState<FamilyPortalScreen> {
  bool _loading = true;
  Map<String, dynamic> _familyData = {};
  List<Map<String, dynamic>> _guardians = [];
  List<Map<String, dynamic>> _photos = [];
  List<Map<String, dynamic>> _pendingApprovals = [];

  @override
  void initState() {
    super.initState();
    _loadFamilyData();
  }

  Future<void> _loadFamilyData() async {
    setState(() => _loading = true);
    try {
      final api = ref.read(apiServiceProvider);
      final res = await api.get('/family');
      if (res.statusCode == 200 && res.data != null) {
        final data = Map<String, dynamic>.from(res.data is Map ? res.data : {});
        setState(() {
          _familyData = data;
          _guardians = List<Map<String, dynamic>>.from(
              (data['guardians'] ?? []).map((e) => Map<String, dynamic>.from(e)));
          _photos = List<Map<String, dynamic>>.from(
              (data['photos'] ?? []).map((e) => Map<String, dynamic>.from(e)));
          _pendingApprovals = List<Map<String, dynamic>>.from(
              (data['pending_approvals'] ?? []).map((e) => Map<String, dynamic>.from(e)));
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
      onRefresh: _loadFamilyData,
      color: AppColors.primary,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Header info
          DmbCard(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: AppColors.primary10,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(LucideIcons.users,
                        color: AppColors.primary, size: 24),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Family Portal',
                            style: TextStyle(
                                fontSize: 16, fontWeight: FontWeight.w700)),
                        SizedBox(height: 2),
                        Text(
                          'Manage family members who can view and interact with your profile',
                          style: TextStyle(
                              fontSize: 12, color: AppColors.slate500),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 24),

          // Guardians Section
          _sectionHeader('Guardians', onAdd: _showAddGuardianDialog),
          const SizedBox(height: 12),

          if (_guardians.isEmpty)
            DmbCard(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  children: [
                    const Icon(LucideIcons.userPlus,
                        size: 32, color: AppColors.slate300),
                    const SizedBox(height: 8),
                    const Text('No guardians added yet',
                        style:
                            TextStyle(fontSize: 14, color: AppColors.slate500)),
                    const SizedBox(height: 12),
                    DmbButton(
                      text: 'Add Guardian',
                      icon: LucideIcons.plus,
                      isFullWidth: false,
                      onPressed: _showAddGuardianDialog,
                    ),
                  ],
                ),
              ),
            )
          else
            ...List.generate(_guardians.length, (i) {
              final g = _guardians[i];
              return Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: DmbCard(
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Row(
                      children: [
                        DmbAvatar(
                          imageUrl: g['photo'] ?? '',
                          size: 44,
                          name: g['name'] ?? '',
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(g['name'] ?? 'Guardian',
                                  style: const TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600)),
                              Text(g['relation'] ?? '',
                                  style: const TextStyle(
                                      fontSize: 12,
                                      color: AppColors.slate500)),
                              if (g['phone'] != null)
                                Text(g['phone'],
                                    style: const TextStyle(
                                        fontSize: 12,
                                        color: AppColors.slate400)),
                            ],
                          ),
                        ),
                        PopupMenuButton<String>(
                          onSelected: (val) {
                            if (val == 'edit') {
                              _showEditGuardianDialog(g);
                            } else if (val == 'delete') {
                              _deleteGuardian(g['id']);
                            }
                          },
                          itemBuilder: (_) => [
                            const PopupMenuItem(
                                value: 'edit', child: Text('Edit')),
                            const PopupMenuItem(
                                value: 'delete',
                                child: Text('Delete',
                                    style: TextStyle(color: AppColors.error))),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }),

          const SizedBox(height: 24),

          // Pending Approvals
          if (_pendingApprovals.isNotEmpty) ...[
            _sectionHeader('Pending Approvals'),
            const SizedBox(height: 12),
            ...List.generate(_pendingApprovals.length, (i) {
              final a = _pendingApprovals[i];
              return Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: DmbCard(
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Row(
                      children: [
                        DmbAvatar(
                          imageUrl: a['photo'] ?? '',
                          size: 40,
                          name: a['name'] ?? '',
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(a['name'] ?? '',
                                  style: const TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w500)),
                              Text(a['type'] ?? 'Pending',
                                  style: const TextStyle(
                                      fontSize: 12,
                                      color: AppColors.slate500)),
                            ],
                          ),
                        ),
                        IconButton(
                          icon: const Icon(LucideIcons.check,
                              color: AppColors.success, size: 20),
                          onPressed: () => _approveRequest(a['id']),
                        ),
                        IconButton(
                          icon: const Icon(LucideIcons.x,
                              color: AppColors.error, size: 20),
                          onPressed: () => _rejectRequest(a['id']),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }),
            const SizedBox(height: 24),
          ],

          // Family Photos
          _sectionHeader('Family Photos', onAdd: _uploadFamilyPhoto),
          const SizedBox(height: 12),
          if (_photos.isEmpty)
            DmbCard(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  children: [
                    const Icon(LucideIcons.image,
                        size: 32, color: AppColors.slate300),
                    const SizedBox(height: 8),
                    const Text('No family photos uploaded',
                        style:
                            TextStyle(fontSize: 14, color: AppColors.slate500)),
                  ],
                ),
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
              ),
              itemCount: _photos.length,
              itemBuilder: (ctx, i) {
                final p = _photos[i];
                return Stack(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: Image.network(
                        p['url'] ?? p['photo'] ?? '',
                        fit: BoxFit.cover,
                        width: double.infinity,
                        height: double.infinity,
                        errorBuilder: (_, __, ___) => Container(
                          color: AppColors.slate100,
                          child: const Icon(LucideIcons.image,
                              color: AppColors.slate300),
                        ),
                      ),
                    ),
                    Positioned(
                      top: 4,
                      right: 4,
                      child: GestureDetector(
                        onTap: () => _deletePhoto(p['id']),
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: BoxDecoration(
                            color: Colors.black54,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(LucideIcons.x,
                              size: 14, color: Colors.white),
                        ),
                      ),
                    ),
                  ],
                );
              },
            ),
        ],
      ),
    );
  }

  Widget _sectionHeader(String title, {VoidCallback? onAdd}) {
    return Row(
      children: [
        Text(title,
            style: const TextStyle(
                fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.slate800)),
        const Spacer(),
        if (onAdd != null)
          GestureDetector(
            onTap: onAdd,
            child: Row(
              children: [
                const Icon(LucideIcons.plus, size: 16, color: AppColors.primary),
                const SizedBox(width: 4),
                const Text('Add',
                    style: TextStyle(
                        fontSize: 13,
                        color: AppColors.primary,
                        fontWeight: FontWeight.w500)),
              ],
            ),
          ),
      ],
    );
  }

  void _showAddGuardianDialog() {
    final nameCtrl = TextEditingController();
    final relationCtrl = TextEditingController();
    final phoneCtrl = TextEditingController();
    final emailCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Add Guardian'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              DmbTextField(controller: nameCtrl, label: 'Name', hint: 'Guardian name'),
              const SizedBox(height: 12),
              DmbTextField(controller: relationCtrl, label: 'Relation', hint: 'e.g. Father, Brother'),
              const SizedBox(height: 12),
              DmbTextField(controller: phoneCtrl, label: 'Phone', hint: 'Phone number', keyboardType: TextInputType.phone),
              const SizedBox(height: 12),
              DmbTextField(controller: emailCtrl, label: 'Email', hint: 'Email (optional)', keyboardType: TextInputType.emailAddress),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          TextButton(
            onPressed: () async {
              final api = ref.read(apiServiceProvider);
              await api.post('/family/guardian/add', data: {
                'name': nameCtrl.text,
                'relation': relationCtrl.text,
                'phone': phoneCtrl.text,
                'email': emailCtrl.text,
              });
              if (ctx.mounted) Navigator.pop(ctx);
              _loadFamilyData();
            },
            child: const Text('Add'),
          ),
        ],
      ),
    );
  }

  void _showEditGuardianDialog(Map<String, dynamic> guardian) {
    final nameCtrl = TextEditingController(text: guardian['name'] ?? '');
    final relationCtrl = TextEditingController(text: guardian['relation'] ?? '');
    final phoneCtrl = TextEditingController(text: guardian['phone'] ?? '');

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Edit Guardian'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              DmbTextField(controller: nameCtrl, label: 'Name'),
              const SizedBox(height: 12),
              DmbTextField(controller: relationCtrl, label: 'Relation'),
              const SizedBox(height: 12),
              DmbTextField(controller: phoneCtrl, label: 'Phone', keyboardType: TextInputType.phone),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          TextButton(
            onPressed: () async {
              final api = ref.read(apiServiceProvider);
              await api.post('/family/guardian/update/${guardian['id']}', data: {
                'name': nameCtrl.text,
                'relation': relationCtrl.text,
                'phone': phoneCtrl.text,
              });
              if (ctx.mounted) Navigator.pop(ctx);
              _loadFamilyData();
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  Future<void> _deleteGuardian(dynamic id) async {
    final api = ref.read(apiServiceProvider);
    await api.delete('/family/guardian/delete/$id');
    _loadFamilyData();
  }

  Future<void> _approveRequest(dynamic id) async {
    final api = ref.read(apiServiceProvider);
    await api.post('/family/approval/approve/$id');
    _loadFamilyData();
  }

  Future<void> _rejectRequest(dynamic id) async {
    final api = ref.read(apiServiceProvider);
    await api.post('/family/approval/reject/$id');
    _loadFamilyData();
  }

  Future<void> _uploadFamilyPhoto() async {
    // Will use image_picker when Flutter is installed
    // For now, placeholder
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Photo upload will be available after Flutter setup')),
    );
  }

  Future<void> _deletePhoto(dynamic id) async {
    final api = ref.read(apiServiceProvider);
    await api.delete('/family/photo/delete/$id');
    _loadFamilyData();
  }
}
