import 'dart:io';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/dropdown_data.dart';
import '../services/profile_service.dart';
import 'auth_provider.dart';

class ProfileState {
  final Map<String, dynamic>? profileData;
  final bool loading;
  final bool saving;
  final String? error;
  final Map<String, dynamic>? qualityScore;
  final ProfileDropdownData? dropdowns;
  final List<Map<String, dynamic>> galleryImages;
  final String activeTab;

  const ProfileState({
    this.profileData,
    this.loading = false,
    this.saving = false,
    this.error,
    this.qualityScore,
    this.dropdowns,
    this.galleryImages = const [],
    this.activeTab = 'basic',
  });

  ProfileState copyWith({
    Map<String, dynamic>? Function()? profileData,
    bool? loading,
    bool? saving,
    String? error,
    Map<String, dynamic>? Function()? qualityScore,
    ProfileDropdownData? Function()? dropdowns,
    List<Map<String, dynamic>>? galleryImages,
    String? activeTab,
  }) {
    return ProfileState(
      profileData: profileData != null ? profileData() : this.profileData,
      loading: loading ?? this.loading,
      saving: saving ?? this.saving,
      error: error,
      qualityScore: qualityScore != null ? qualityScore() : this.qualityScore,
      dropdowns: dropdowns != null ? dropdowns() : this.dropdowns,
      galleryImages: galleryImages ?? this.galleryImages,
      activeTab: activeTab ?? this.activeTab,
    );
  }
}

class ProfileNotifier extends StateNotifier<ProfileState> {
  final ProfileService _service;
  final Ref _ref;

  ProfileNotifier(this._service, this._ref) : super(const ProfileState());

  /// Load full profile — GET /full-profile
  Future<void> loadFullProfile() async {
    if (state.loading) return;
    state = state.copyWith(loading: true, error: null);

    try {
      final data = await _service.getFullProfile();
      state = state.copyWith(
        profileData: () => data,
        loading: false,
      );
    } catch (e) {
      state = state.copyWith(
        loading: false,
        error: 'Failed to load profile',
      );
    }
  }

  /// Update profile — POST /full-profile/update
  Future<bool> updateProfile(Map<String, dynamic> data) async {
    state = state.copyWith(saving: true, error: null);

    try {
      final result = await _service.updateProfile(data);
      // Merge updated fields into current profile data
      final current = Map<String, dynamic>.from(state.profileData ?? {});
      current.addAll(data);
      if (result.containsKey('data')) {
        current.addAll(result['data'] as Map<String, dynamic>? ?? {});
      }
      state = state.copyWith(
        profileData: () => current,
        saving: false,
      );
      return true;
    } catch (e) {
      state = state.copyWith(
        saving: false,
        error: 'Failed to update profile',
      );
      return false;
    }
  }

  /// Load profile quality score — GET /member/profile/quality-score
  Future<void> loadQualityScore() async {
    try {
      final api = _ref.read(apiServiceProvider);
      final response = await api.get('/member/profile/quality-score');
      final data = response.data is Map<String, dynamic> ? response.data : {};
      state = state.copyWith(qualityScore: () => data);
    } catch (_) {
      // Non-critical, silently fail
    }
  }

  /// Load all dropdown data for profile editing
  Future<void> loadDropdowns() async {
    try {
      final dropdowns = await _service.getProfileDropdowns();
      state = state.copyWith(dropdowns: () => dropdowns);
    } catch (_) {
      // Dropdowns load failure is non-critical for display
    }
  }

  /// Upload gallery image — POST /member/gallery-image
  Future<bool> uploadGalleryImage(File file) async {
    state = state.copyWith(saving: true, error: null);

    try {
      final result = await _service.uploadGalleryImage(file);
      // Refresh gallery after upload
      await loadGallery();
      state = state.copyWith(saving: false);
      return true;
    } catch (e) {
      state = state.copyWith(
        saving: false,
        error: 'Failed to upload image',
      );
      return false;
    }
  }

  /// Delete gallery image — DELETE /member/gallery-image/{id}
  Future<bool> deleteGalleryImage(int id) async {
    try {
      await _service.deleteGalleryImage(id);
      final updated = state.galleryImages
          .where((img) => img['id'] != id)
          .toList();
      state = state.copyWith(galleryImages: updated);
      return true;
    } catch (_) {
      state = state.copyWith(error: 'Failed to delete image');
      return false;
    }
  }

  /// Set image as avatar — POST /member/gallery-image/{id}/set-as-avatar
  Future<bool> setAsAvatar(int id) async {
    try {
      final api = _ref.read(apiServiceProvider);
      await api.post('/member/gallery-image/$id/set-as-avatar');
      return true;
    } catch (_) {
      state = state.copyWith(error: 'Failed to set avatar');
      return false;
    }
  }

  /// Toggle image privacy — POST /member/gallery-image/{id}/toggle-private
  Future<bool> togglePrivate(int id) async {
    try {
      await _service.toggleImagePrivacy(id);
      final updated = state.galleryImages.map((img) {
        if (img['id'] == id) {
          final copy = Map<String, dynamic>.from(img);
          copy['is_private'] = !(img['is_private'] == true);
          return copy;
        }
        return img;
      }).toList();
      state = state.copyWith(galleryImages: updated);
      return true;
    } catch (_) {
      state = state.copyWith(error: 'Failed to toggle privacy');
      return false;
    }
  }

  /// Load gallery images — GET /member/gallery-image
  Future<void> loadGallery() async {
    try {
      final images = await _service.getGalleryImages();
      state = state.copyWith(galleryImages: images);
    } catch (_) {
      // Non-critical
    }
  }

  /// Set active tab for profile editing UI
  void setActiveTab(String tab) {
    state = state.copyWith(activeTab: tab);
  }

  /// Toggle field visibility — POST /member/profile/visibility
  Future<bool> toggleVisibility(String fieldName, bool visible) async {
    try {
      final api = _ref.read(apiServiceProvider);
      await api.post('/member/profile/visibility', data: {
        'field': fieldName,
        'visible': visible,
      });
      return true;
    } catch (_) {
      state = state.copyWith(error: 'Failed to update visibility');
      return false;
    }
  }

  /// Change password — POST /member/change-password
  Future<bool> changePassword(
    String current,
    String newPass,
    String confirm,
  ) async {
    state = state.copyWith(saving: true, error: null);

    try {
      await _service.changePassword(
        currentPassword: current,
        newPassword: newPass,
      );
      state = state.copyWith(saving: false);
      return true;
    } catch (e) {
      state = state.copyWith(
        saving: false,
        error: 'Failed to change password',
      );
      return false;
    }
  }
}

// ── Providers ──

final profileServiceProvider = Provider<ProfileService>((ref) {
  return ProfileService(ref.read(apiServiceProvider));
});

final profileProvider =
    StateNotifierProvider<ProfileNotifier, ProfileState>((ref) {
  return ProfileNotifier(ref.read(profileServiceProvider), ref);
});
