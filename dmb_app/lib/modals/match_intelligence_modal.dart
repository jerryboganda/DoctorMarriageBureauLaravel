import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../theme/app_colors.dart';
import '../theme/app_decorations.dart';
import '../widgets/dmb_button.dart';
import '../models/profile_match.dart';
import '../providers/auth_provider.dart';

// ---------------------------------------------------------------------------
// Show helper
// ---------------------------------------------------------------------------

Future<void> showMatchIntelligenceModal(
  BuildContext context, {
  required ProfileMatch profile,
  VoidCallback? onClose,
}) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => MatchIntelligenceModal(
      profile: profile,
      onClose: onClose ?? () => Navigator.of(context).pop(),
    ),
  );
}

// ---------------------------------------------------------------------------
// Widget
// ---------------------------------------------------------------------------

class MatchIntelligenceModal extends ConsumerStatefulWidget {
  final ProfileMatch profile;
  final VoidCallback onClose;

  const MatchIntelligenceModal({
    super.key,
    required this.profile,
    required this.onClose,
  });

  @override
  ConsumerState<MatchIntelligenceModal> createState() =>
      _MatchIntelligenceModalState();
}

class _MatchIntelligenceModalState
    extends ConsumerState<MatchIntelligenceModal> {
  bool _showFriction = false;
  bool _loading = true;
  Map<String, dynamic>? _data;
  String? _error;
  bool _sending = false;
  bool _sent = false;
  String? _sendError;

  MatchIntelligence? _intelligence;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final api = ref.read(apiServiceProvider);
      final res = await api.get('/match-intelligence/${widget.profile.id}');
      final resData = res.data;

      if (resData is Map<String, dynamic>) {
        final payload = resData['data'] ?? resData;
        setState(() {
          _data = payload is Map<String, dynamic> ? payload : {};
          _intelligence = MatchIntelligence.fromJson(_data!);
          _loading = false;
        });
      } else {
        setState(() {
          _error = 'Invalid response from server.';
          _loading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Failed to load match intelligence.';
        _loading = false;
      });
    }
  }

  Future<void> _handleSendProposal() async {
    if (_sent || _sending) return;

    setState(() {
      _sending = true;
      _sendError = null;
    });

    try {
      final api = ref.read(apiServiceProvider);
      final res = await api.post('/member/express-interest', data: {
        'user_id': int.tryParse(widget.profile.id) ?? widget.profile.id,
      });
      final resData =
          res.data is Map<String, dynamic> ? res.data as Map<String, dynamic> : {};

      if (resData['result'] == true) {
        setState(() => _sent = true);
      } else {
        setState(() {
          _sendError = resData['message']?.toString() ?? 'Could not send proposal.';
        });
      }
    } catch (_) {
      setState(() {
        _sendError = 'Could not send proposal. Please try again.';
      });
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  void _close() {
    widget.onClose();
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final height = MediaQuery.of(context).size.height * 0.9;

    return Container(
      height: height,
      decoration: const BoxDecoration(
        color: AppColors.white,
        borderRadius:
            BorderRadius.vertical(top: Radius.circular(AppDecorations.radiusXxl)),
      ),
      child: Column(
        children: [
          // Drag handle
          Container(
            margin: const EdgeInsets.only(top: 12, bottom: 8),
            width: 36,
            height: 4,
            decoration: BoxDecoration(
              color: AppColors.slate300,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          _buildHeader(),
          Expanded(child: _buildBody()),
          _buildFooter(),
        ],
      ),
    );
  }

  // ── Header ──

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      decoration: const BoxDecoration(
        color: AppColors.slate50,
        border: Border(bottom: BorderSide(color: AppColors.slate100)),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AppColors.primary10,
              borderRadius: BorderRadius.circular(AppDecorations.radiusLg),
            ),
            child: const Icon(Icons.psychology, size: 22, color: AppColors.primary),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Match Intelligence',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: AppColors.slate900,
                  ),
                ),
                if (_intelligence?.generatedAt != null)
                  Text(
                    'Generated ${_intelligence!.generatedAt}',
                    style: const TextStyle(fontSize: 12, color: AppColors.slate500),
                  ),
              ],
            ),
          ),
          GestureDetector(
            onTap: _close,
            child: Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: AppColors.slate100,
                borderRadius: BorderRadius.circular(AppDecorations.radiusFull),
              ),
              child: const Icon(LucideIcons.x, size: 18, color: AppColors.slate400),
            ),
          ),
        ],
      ),
    );
  }

  // ── Body ──

  Widget _buildBody() {
    if (_loading) {
      return const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2.5),
            SizedBox(height: 16),
            Text(
              'Analyzing compatibility...',
              style: TextStyle(fontSize: 14, color: AppColors.slate500),
            ),
          ],
        ),
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
                padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 12),
                onPressed: _fetchData,
              ),
            ],
          ),
        ),
      );
    }

    final intel = _intelligence!;

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Circular score
          _buildCircularScore(intel.totalScore),
          const SizedBox(height: 24),

          // Category breakdowns
          _buildSectionTitle('Category Breakdown'),
          const SizedBox(height: 12),
          ...intel.categories.map((cat) => _buildCategoryBar(cat)),
          const SizedBox(height: 24),

          // Mutual fit
          _buildSectionTitle('Mutual Fit'),
          const SizedBox(height: 12),
          _buildMutualFit(intel.mutualFit),
          const SizedBox(height: 24),

          // Top reasons
          if (intel.topReasons.isNotEmpty) ...[
            _buildSectionTitle('Top Reasons'),
            const SizedBox(height: 12),
            ...intel.topReasons.map((reason) => _buildReasonItem(reason)),
            const SizedBox(height: 24),
          ],

          // Friction points
          if (intel.frictionPoints.isNotEmpty) ...[
            _buildSectionTitle('Friction Points'),
            const SizedBox(height: 12),
            _buildFrictionPoints(intel.frictionPoints),
            const SizedBox(height: 24),
          ],

          // Matchmaker notes
          if (intel.agentNotes != null && intel.agentNotes!.isNotEmpty) ...[
            _buildSectionTitle('Matchmaker Notes'),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFF0FDF4),
                borderRadius: BorderRadius.circular(AppDecorations.radiusXl),
                border: Border.all(color: const Color(0xFFBBF7D0)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(LucideIcons.messageCircle, size: 18, color: AppColors.success),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      intel.agentNotes!,
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppColors.slate700,
                        height: 1.5,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
          ],
        ],
      ),
    );
  }

  // ── Circular Score Widget ──

  Widget _buildCircularScore(double score) {
    return Center(
      child: SizedBox(
        width: 140,
        height: 140,
        child: CustomPaint(
          painter: _ScoreArcPainter(score: score / 100),
          child: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  '${score.toInt()}%',
                  style: const TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.w800,
                    color: AppColors.primary,
                  ),
                ),
                const Text(
                  'Match Score',
                  style: TextStyle(fontSize: 12, color: AppColors.slate500),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // ── Category Bar ──

  Widget _buildCategoryBar(MatchCategory cat) {
    Color barColor;
    if (cat.score >= 70) {
      barColor = AppColors.success;
    } else if (cat.score >= 40) {
      barColor = AppColors.warning;
    } else {
      barColor = AppColors.error;
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                cat.name,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.slate700,
                ),
              ),
              Text(
                cat.weight,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                  color: barColor,
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
                widthFactor: (cat.score / 100).clamp(0.0, 1.0),
                child: Container(
                  height: 8,
                  decoration: BoxDecoration(
                    color: barColor,
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
              '${cat.score.toInt()}%',
              style: const TextStyle(fontSize: 11, color: AppColors.slate400),
            ),
          ),
        ],
      ),
    );
  }

  // ── Mutual Fit ──

  Widget _buildMutualFit(MutualFit fit) {
    return Row(
      children: [
        Expanded(child: _buildFitBox('You \u2192 Them', fit.youMeetThem)),
        const SizedBox(width: 12),
        Expanded(child: _buildFitBox('Them \u2192 You', fit.theyMeetYou)),
      ],
    );
  }

  Widget _buildFitBox(String label, double value) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.slate50,
        borderRadius: BorderRadius.circular(AppDecorations.radiusXl),
        border: Border.all(color: AppColors.slate200),
      ),
      child: Column(
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: AppColors.slate500,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '${value.toInt()}%',
            style: const TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w800,
              color: AppColors.primary,
            ),
          ),
        ],
      ),
    );
  }

  // ── Top Reasons ──

  Widget _buildReasonItem(String reason) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(LucideIcons.checkCircle2, size: 16, color: AppColors.success),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              reason,
              style: const TextStyle(
                fontSize: 13,
                color: AppColors.slate700,
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── Friction Points ──

  Widget _buildFrictionPoints(List<String> points) {
    if (_showFriction) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: points
            .map((point) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(LucideIcons.alertTriangle,
                          size: 16, color: AppColors.warning),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          point,
                          style: const TextStyle(
                            fontSize: 13,
                            color: AppColors.slate700,
                            height: 1.4,
                          ),
                        ),
                      ),
                    ],
                  ),
                ))
            .toList(),
      );
    }

    return GestureDetector(
      onTap: () => setState(() => _showFriction = true),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.slate50,
          borderRadius: BorderRadius.circular(AppDecorations.radiusXl),
          border: Border.all(color: AppColors.slate200),
        ),
        child: Column(
          children: [
            // Blurred preview
            Opacity(
              opacity: 0.3,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: points
                    .take(3)
                    .map((point) => Padding(
                          padding: const EdgeInsets.only(bottom: 4),
                          child: Text(
                            point,
                            style: const TextStyle(
                              fontSize: 13,
                              color: AppColors.slate700,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ))
                    .toList(),
              ),
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(LucideIcons.eye, size: 14, color: AppColors.primary),
                const SizedBox(width: 6),
                Text(
                  'View ${points.length} friction point${points.length == 1 ? '' : 's'}',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.primary,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // ── Section Title ──

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 15,
        fontWeight: FontWeight.w700,
        color: AppColors.slate900,
      ),
    );
  }

  // ── Footer ──

  Widget _buildFooter() {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
      decoration: const BoxDecoration(
        color: AppColors.slate50,
        border: Border(top: BorderSide(color: AppColors.slate100)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (_sendError != null) ...[
            Container(
              padding: const EdgeInsets.all(10),
              margin: const EdgeInsets.only(bottom: 12),
              decoration: BoxDecoration(
                color: const Color(0xFFFEF2F2),
                borderRadius: BorderRadius.circular(AppDecorations.radiusLg),
                border: Border.all(color: const Color(0xFFFEE2E2)),
              ),
              child: Row(
                children: [
                  const Icon(LucideIcons.alertCircle, size: 14, color: AppColors.error),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _sendError!,
                      style: const TextStyle(fontSize: 12, color: AppColors.error),
                    ),
                  ),
                ],
              ),
            ),
          ],
          Row(
            children: [
              Expanded(
                child: DmbButton(
                  text: 'Close',
                  variant: DmbButtonVariant.outline,
                  onPressed: _close,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: DmbButton(
                  text: _sent
                      ? 'Sent'
                      : _sending
                          ? 'Sending...'
                          : 'Send Proposal',
                  icon: _sent ? LucideIcons.check : LucideIcons.send,
                  isLoading: _sending,
                  onPressed: (_sent || _sending || _loading)
                      ? null
                      : _handleSendProposal,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Custom painter for score arc
// ---------------------------------------------------------------------------

class _ScoreArcPainter extends CustomPainter {
  final double score; // 0.0 to 1.0

  _ScoreArcPainter({required this.score});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = math.min(size.width, size.height) / 2 - 8;
    const strokeWidth = 10.0;
    const startAngle = -math.pi / 2; // 12 o'clock
    final sweepAngle = 2 * math.pi * score;

    // Background track
    final bgPaint = Paint()
      ..color = AppColors.slate100
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    canvas.drawCircle(center, radius, bgPaint);

    // Foreground arc
    final fgPaint = Paint()
      ..color = AppColors.primary
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      startAngle,
      sweepAngle,
      false,
      fgPaint,
    );
  }

  @override
  bool shouldRepaint(covariant _ScoreArcPainter oldDelegate) =>
      oldDelegate.score != score;
}
