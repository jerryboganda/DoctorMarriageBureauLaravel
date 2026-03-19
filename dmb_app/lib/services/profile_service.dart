import 'dart:io';
import 'api_service.dart';
import '../models/dropdown_data.dart';

class ProfileService {
  final ApiService _api;

  ProfileService(this._api);

  /// Get full profile — GET /full-profile
  Future<Map<String, dynamic>> getFullProfile() async {
    final response = await _api.get('/full-profile');
    return response.data is Map<String, dynamic> ? response.data : {};
  }

  /// Update profile — POST /full-profile/update
  Future<Map<String, dynamic>> updateProfile(Map<String, dynamic> data) async {
    final response = await _api.post('/full-profile/update', data: data);
    return response.data is Map<String, dynamic> ? response.data : {};
  }

  /// Upload profile picture — POST /upload-profile-picture
  Future<Map<String, dynamic>> uploadProfilePicture(File file) async {
    final response = await _api.uploadFile('/upload-profile-picture', file, 'photo');
    return response.data is Map<String, dynamic> ? response.data : {};
  }

  /// Get public profile — GET /member/public-profile/{id}
  Future<Map<String, dynamic>> getPublicProfile(int userId) async {
    final response = await _api.get('/member/public-profile/$userId');
    return response.data is Map<String, dynamic> ? response.data : {};
  }

  /// Get gallery images — GET /member/gallery-image
  Future<List<Map<String, dynamic>>> getGalleryImages() async {
    final response = await _api.get('/member/gallery-image');
    final data = response.data;
    final list = data['data'] ?? data;
    if (list is List) return list.cast<Map<String, dynamic>>();
    return [];
  }

  /// Upload gallery image — POST /member/gallery-image
  Future<Map<String, dynamic>> uploadGalleryImage(File file) async {
    final response = await _api.uploadFile('/member/gallery-image', file, 'image');
    return response.data is Map<String, dynamic> ? response.data : {};
  }

  /// Toggle gallery image privacy
  Future<void> toggleImagePrivacy(int imageId) async {
    await _api.post('/member/gallery-image/$imageId/toggle-private');
  }

  /// Set primary photo
  Future<void> setPrimaryPhoto(int imageId) async {
    await _api.post('/member/gallery-image/$imageId/set-primary');
  }

  /// Delete gallery image
  Future<void> deleteGalleryImage(int imageId) async {
    await _api.delete('/member/gallery-image/$imageId');
  }

  /// Get all dropdown data — GET /member/profile-dropdown
  Future<ProfileDropdownData> getProfileDropdowns() async {
    final response = await _api.get('/member/profile-dropdown');
    final data = response.data is Map<String, dynamic> ? response.data : {};
    return ProfileDropdownData.fromApi(data);
  }

  /// Get states by country
  Future<List<DropdownOption>> getStates(int countryId) async {
    final response = await _api.get('/member/states/$countryId');
    final data = response.data;
    final list = data['data'] ?? data;
    if (list is! List) return [];
    return list.map<DropdownOption>((e) => DropdownOption.fromJson(e)).toList();
  }

  /// Get cities by state
  Future<List<DropdownOption>> getCities(int stateId) async {
    final response = await _api.get('/member/cities/$stateId');
    final data = response.data;
    final list = data['data'] ?? data;
    if (list is! List) return [];
    return list.map<DropdownOption>((e) => DropdownOption.fromJson(e)).toList();
  }

  /// Get sects by religion
  Future<List<DropdownOption>> getSects(int? religionId) async {
    final path = religionId != null ? '/member/sects/$religionId' : '/member/sects';
    final response = await _api.get(path);
    final data = response.data;
    final list = data['data'] ?? data;
    if (list is! List) return [];
    return list.map<DropdownOption>((e) => DropdownOption.fromJson(e)).toList();
  }

  /// Get castes by religion
  Future<List<DropdownOption>> getCastes(int? religionId) async {
    final path = religionId != null ? '/member/casts/$religionId' : '/member/casts';
    final response = await _api.get(path);
    final data = response.data;
    final list = data['data'] ?? data;
    if (list is! List) return [];
    return list.map<DropdownOption>((e) => DropdownOption.fromJson(e)).toList();
  }

  /// Change password
  Future<Map<String, dynamic>> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    final response = await _api.post('/member/change/password', data: {
      'current_password': currentPassword,
      'password': newPassword,
      'password_confirmation': newPassword,
    });
    return response.data is Map<String, dynamic> ? response.data : {};
  }

  /// Complete onboarding
  Future<Map<String, dynamic>> completeOnboarding(Map<String, dynamic> data) async {
    final response = await _api.post('/onboarding/complete', data: data);
    return response.data is Map<String, dynamic> ? response.data : {};
  }

  /// Heartbeat
  Future<void> heartbeat() async {
    try {
      await _api.post('/member/heartbeat');
    } catch (_) {}
  }

  /// Shortlist
  Future<void> addToShortlist(int userId) async {
    await _api.post('/member/add-to-shortlist', data: {'user_id': userId});
  }

  Future<void> removeFromShortlist(int userId) async {
    await _api.post('/member/remove-from-shortlist', data: {'user_id': userId});
  }

  /// Report member
  Future<void> reportMember(int userId, String reason) async {
    await _api.post('/member/report-member', data: {
      'user_id': userId,
      'reason': reason,
    });
  }

  /// Get match intelligence
  Future<Map<String, dynamic>> getMatchIntelligence(int targetUserId) async {
    final response = await _api.get('/match-intelligence/$targetUserId');
    return response.data is Map<String, dynamic> ? response.data : {};
  }
}
