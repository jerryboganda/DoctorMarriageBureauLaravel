import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';
import '../theme/app_colors.dart';

/// Floating action button for WhatsApp/support contact
/// Matches React frontend floating contact pattern
class FloatingContactButton extends StatefulWidget {
  final String whatsappNumber;
  final String? whatsappMessage;

  const FloatingContactButton({
    super.key,
    this.whatsappNumber = '+923001234567',
    this.whatsappMessage,
  });

  @override
  State<FloatingContactButton> createState() => _FloatingContactButtonState();
}

class _FloatingContactButtonState extends State<FloatingContactButton>
    with SingleTickerProviderStateMixin {
  bool _expanded = false;
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 200),
    );
    _scaleAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _toggle() {
    setState(() => _expanded = !_expanded);
    if (_expanded) {
      _controller.forward();
    } else {
      _controller.reverse();
    }
  }

  Future<void> _openWhatsApp() async {
    final msg = widget.whatsappMessage ??
        'Hello, I need help with Doctor Marriage Bureau app.';
    final url = Uri.parse(
        'https://wa.me/${widget.whatsappNumber.replaceAll('+', '')}?text=${Uri.encodeComponent(msg)}');
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    }
    _toggle();
  }

  Future<void> _openEmail() async {
    final url = Uri.parse(
        'mailto:support@doctormarriagebureau.com.pk?subject=App Support');
    if (await canLaunchUrl(url)) {
      await launchUrl(url);
    }
    _toggle();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        // Expanded options
        ScaleTransition(
          scale: _scaleAnimation,
          alignment: Alignment.bottomRight,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              _optionButton(
                icon: LucideIcons.messageCircle,
                label: 'WhatsApp',
                color: const Color(0xFF25D366),
                onTap: _openWhatsApp,
              ),
              const SizedBox(height: 8),
              _optionButton(
                icon: LucideIcons.mail,
                label: 'Email',
                color: AppColors.info,
                onTap: _openEmail,
              ),
              const SizedBox(height: 12),
            ],
          ),
        ),
        // Main FAB
        FloatingActionButton(
          onPressed: _toggle,
          backgroundColor: AppColors.primary,
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 200),
            child: _expanded
                ? const Icon(LucideIcons.x, key: ValueKey('close'),
                    color: Colors.white)
                : const Icon(LucideIcons.headphones, key: ValueKey('open'),
                    color: Colors.white),
          ),
        ),
      ],
    );
  }

  Widget _optionButton({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(8),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: color,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: color.withOpacity(0.3),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Icon(icon, size: 20, color: Colors.white),
          ),
        ],
      ),
    );
  }
}
