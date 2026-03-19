import 'dart:async';
import 'dart:ui';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../theme/app_colors.dart';
import '../theme/app_decorations.dart';
import '../widgets/dmb_avatar.dart';

// ---------------------------------------------------------------------------
// Show helper
// ---------------------------------------------------------------------------

Future<void> showCallModal(
  BuildContext context, {
  required String participantName,
  required String participantImage,
  required String type,
  required VoidCallback onEndCall,
}) {
  return Navigator.of(context).push(
    PageRouteBuilder(
      opaque: true,
      pageBuilder: (_, __, ___) => CallModal(
        participantName: participantName,
        participantImage: participantImage,
        type: type,
        onEndCall: onEndCall,
      ),
      transitionsBuilder: (_, animation, __, child) {
        return FadeTransition(opacity: animation, child: child);
      },
    ),
  );
}

// ---------------------------------------------------------------------------
// Widget
// ---------------------------------------------------------------------------

class CallModal extends StatefulWidget {
  final String participantName;
  final String participantImage;
  final String type; // 'video' or 'audio'
  final VoidCallback onEndCall;

  const CallModal({
    super.key,
    required this.participantName,
    required this.participantImage,
    required this.type,
    required this.onEndCall,
  });

  @override
  State<CallModal> createState() => _CallModalState();
}

class _CallModalState extends State<CallModal>
    with SingleTickerProviderStateMixin {
  bool _isMuted = false;
  late bool _isVideoOff;
  int _duration = 0;
  Timer? _timer;

  // Pulse animation for the red dot
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _isVideoOff = widget.type == 'audio';

    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() => _duration++);
    });

    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    )..repeat(reverse: true);

    _pulseAnimation = Tween<double>(begin: 0.4, end: 1.0).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _timer?.cancel();
    _pulseController.dispose();
    super.dispose();
  }

  String get _formattedDuration {
    final minutes = _duration ~/ 60;
    final seconds = _duration % 60;
    return '$minutes:${seconds.toString().padLeft(2, '0')}';
  }

  void _handleEndCall() {
    widget.onEndCall();
    if (mounted) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final screenSize = MediaQuery.of(context).size;

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        fit: StackFit.expand,
        children: [
          // Background: blurred participant image + dark overlay
          _buildBackground(),

          // Dark overlay
          Container(color: Colors.black.withValues(alpha: 0.6)),

          // Top gradient overlay
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            height: 200,
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Colors.black87, Colors.transparent],
                ),
              ),
            ),
          ),

          // Main content
          SafeArea(
            child: Column(
              children: [
                // Top: call info
                _buildTopInfo(),

                // Center: avatar or video placeholder
                Expanded(child: _buildCenterContent(screenSize)),

                // Bottom: control bar
                _buildControlBar(),

                const SizedBox(height: 32),
              ],
            ),
          ),

          // Picture-in-picture "You" box (visible when video is on)
          if (!_isVideoOff)
            Positioned(
              right: 20,
              bottom: 160,
              child: _buildPipBox(),
            ),
        ],
      ),
    );
  }

  // ── Background ──

  Widget _buildBackground() {
    return SizedBox.expand(
      child: ImageFiltered(
        imageFilter: ImageFilter.blur(sigmaX: 30, sigmaY: 30),
        child: CachedNetworkImage(
          imageUrl: widget.participantImage,
          fit: BoxFit.cover,
          placeholder: (_, __) => Container(color: AppColors.slate900),
          errorWidget: (_, __, ___) => Container(color: AppColors.slate900),
        ),
      ),
    );
  }

  // ── Top info ──

  Widget _buildTopInfo() {
    final isVideo = widget.type == 'video';
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 0),
      child: Column(
        children: [
          // Call type icon + label
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                isVideo ? LucideIcons.video : LucideIcons.phone,
                size: 16,
                color: Colors.white70,
              ),
              const SizedBox(width: 8),
              Text(
                isVideo ? 'Video Call' : 'Audio Call',
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: Colors.white70,
                  letterSpacing: 0.5,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Duration with red pulse dot
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              AnimatedBuilder(
                animation: _pulseAnimation,
                builder: (_, __) => Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: AppColors.error.withValues(alpha: _pulseAnimation.value),
                    shape: BoxShape.circle,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                _formattedDuration,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                  fontFeatures: [FontFeature.tabularFigures()],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),

          // Participant name
          Text(
            widget.participantName,
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w700,
              color: Colors.white,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  // ── Center content ──

  Widget _buildCenterContent(Size screenSize) {
    if (_isVideoOff || widget.type == 'audio') {
      // Audio mode or video off: show large avatar
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            DmbAvatar(
              imageUrl: widget.participantImage,
              size: 120,
              showBorder: true,
            ),
            const SizedBox(height: 16),
            if (_isVideoOff && widget.type == 'video')
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(AppDecorations.radiusFull),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(LucideIcons.videoOff, size: 14, color: Colors.white70),
                    SizedBox(width: 6),
                    Text(
                      'Camera Off',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.white70,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
      );
    }

    // Video mode: placeholder area
    return Center(
      child: Container(
        width: screenSize.width * 0.85,
        height: screenSize.height * 0.45,
        decoration: BoxDecoration(
          color: AppColors.slate800.withValues(alpha: 0.5),
          borderRadius: BorderRadius.circular(AppDecorations.radiusXxl),
          border: Border.all(
            color: Colors.white.withValues(alpha: 0.1),
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            DmbAvatar(
              imageUrl: widget.participantImage,
              size: 80,
            ),
            const SizedBox(height: 12),
            Text(
              widget.participantName,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 4),
            const Text(
              'Video feed',
              style: TextStyle(fontSize: 12, color: Colors.white54),
            ),
          ],
        ),
      ),
    );
  }

  // ── Picture-in-picture box ──

  Widget _buildPipBox() {
    return Container(
      width: 100,
      height: 140,
      decoration: BoxDecoration(
        color: AppColors.slate800,
        borderRadius: BorderRadius.circular(AppDecorations.radiusXl),
        border: Border.all(
          color: Colors.white.withValues(alpha: 0.2),
          width: 2,
        ),
        boxShadow: AppDecorations.shadowLg,
      ),
      child: const Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.person, size: 32, color: Colors.white54),
          SizedBox(height: 4),
          Text(
            'You',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w500,
              color: Colors.white70,
            ),
          ),
        ],
      ),
    );
  }

  // ── Control bar ──

  Widget _buildControlBar() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          // Mic toggle
          _buildControlButton(
            icon: _isMuted ? LucideIcons.micOff : LucideIcons.mic,
            color: _isMuted ? AppColors.white : AppColors.slate700,
            iconColor: _isMuted ? AppColors.slate900 : AppColors.white,
            onTap: () => setState(() => _isMuted = !_isMuted),
            label: _isMuted ? 'Unmute' : 'Mute',
          ),

          // Video toggle
          _buildControlButton(
            icon: _isVideoOff ? LucideIcons.videoOff : LucideIcons.video,
            color: _isVideoOff ? AppColors.white : AppColors.slate700,
            iconColor: _isVideoOff ? AppColors.slate900 : AppColors.white,
            onTap: () => setState(() => _isVideoOff = !_isVideoOff),
            label: _isVideoOff ? 'Video On' : 'Video Off',
          ),

          // End call
          _buildControlButton(
            icon: LucideIcons.phoneOff,
            color: const Color(0xFFEF4444), // red-500
            iconColor: AppColors.white,
            size: 64,
            onTap: _handleEndCall,
            label: 'End',
          ),

          // Message
          _buildControlButton(
            icon: LucideIcons.messageSquare,
            color: AppColors.slate700,
            iconColor: AppColors.white,
            onTap: () {
              // Message action placeholder
            },
            label: 'Chat',
          ),
        ],
      ),
    );
  }

  Widget _buildControlButton({
    required IconData icon,
    required Color color,
    required Color iconColor,
    required VoidCallback onTap,
    required String label,
    double size = 52,
  }) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        GestureDetector(
          onTap: onTap,
          child: Container(
            width: size,
            height: size,
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.3),
                  blurRadius: 8,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Icon(icon, size: size * 0.4, color: iconColor),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w500,
            color: Colors.white70,
          ),
        ),
      ],
    );
  }
}
