import 'package:intl/intl.dart';

class DateHelpers {
  /// Relative time string like "2 hours ago", "just now"
  static String timeAgo(String? dateString) {
    if (dateString == null || dateString.isEmpty) return '';
    try {
      final date = DateTime.parse(dateString);
      final now = DateTime.now();
      final diff = now.difference(date);

      if (diff.inSeconds < 60) return 'just now';
      if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
      if (diff.inHours < 24) return '${diff.inHours}h ago';
      if (diff.inDays < 7) return '${diff.inDays}d ago';
      if (diff.inDays < 30) return '${(diff.inDays / 7).floor()}w ago';
      if (diff.inDays < 365) return '${(diff.inDays / 30).floor()}mo ago';
      return '${(diff.inDays / 365).floor()}y ago';
    } catch (_) {
      return '';
    }
  }

  /// Format date for display
  static String formatDate(String? dateString, {String pattern = 'MMM d, yyyy'}) {
    if (dateString == null || dateString.isEmpty) return '';
    try {
      final date = DateTime.parse(dateString);
      return DateFormat(pattern).format(date);
    } catch (_) {
      return dateString ?? '';
    }
  }

  /// Format time for chat messages
  static String formatTime(String? dateString) {
    if (dateString == null || dateString.isEmpty) return '';
    try {
      final date = DateTime.parse(dateString);
      return DateFormat('h:mm a').format(date);
    } catch (_) {
      return '';
    }
  }

  /// Calculate age from birthday string
  static int calculateAge(String? birthday) {
    if (birthday == null || birthday.isEmpty) return 0;
    try {
      final dob = DateTime.parse(birthday);
      final now = DateTime.now();
      int age = now.year - dob.year;
      if (now.month < dob.month ||
          (now.month == dob.month && now.day < dob.day)) {
        age--;
      }
      return age;
    } catch (_) {
      return 0;
    }
  }
}
