import '../config/api_config.dart';

/// Port of resolveAvatarUrl from App.tsx / Sidebar.tsx
/// Handles 5 URL patterns: empty, http/https, protocol-relative, root-relative, bare paths
String resolveAvatarUrl(String? value) {
  final candidate = (value ?? '').trim();

  if (candidate.isEmpty) return ApiConfig.defaultAvatar;
  if (candidate.startsWith('http://') || candidate.startsWith('https://')) {
    return candidate;
  }
  if (candidate.startsWith('//')) return 'https:$candidate';
  if (candidate.startsWith('/')) return '${ApiConfig.baseHost}$candidate';

  // Bare path — strip leading slashes and prefix with base
  final cleaned = candidate.replaceAll(RegExp(r'^/+'), '');
  return '${ApiConfig.baseHost}/$cleaned';
}
