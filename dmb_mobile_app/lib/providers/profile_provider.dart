import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/models.dart';
import '../repositories/repositories.dart';
import 'repository_providers.dart';

/// Profile discovery state
class DiscoveryState {
  final List<ProfileMatch> profiles;
  final bool isLoading;
  final bool hasMore;
  final int currentPage;
  final String? error;
  final int currentIndex;

  const DiscoveryState({
    this.profiles = const [],
    this.isLoading = false,
    this.hasMore = true,
    this.currentPage = 1,
    this.error,
    this.currentIndex = 0,
  });

  DiscoveryState copyWith({
    List<ProfileMatch>? profiles,
    bool? isLoading,
    bool? hasMore,
    int? currentPage,
    String? error,
    int? currentIndex,
  }) {
    return DiscoveryState(
      profiles: profiles ?? this.profiles,
      isLoading: isLoading ?? this.isLoading,
      hasMore: hasMore ?? this.hasMore,
      currentPage: currentPage ?? this.currentPage,
      error: error,
      currentIndex: currentIndex ?? this.currentIndex,
    );
  }

  ProfileMatch? get currentProfile {
    if (currentIndex >= 0 && currentIndex < profiles.length) {
      return profiles[currentIndex];
    }
    return null;
  }

  ProfileMatch? get nextProfile {
    final nextIndex = currentIndex + 1;
    if (nextIndex >= 0 && nextIndex < profiles.length) {
      return profiles[nextIndex];
    }
    return null;
  }
}

/// Discovery notifier - manages profile discovery/swiping
/// Transpiled from React: DiscoveryView.tsx state management
class DiscoveryNotifier extends StateNotifier<DiscoveryState> {
  final ProfileRepository _profileRepository;

  DiscoveryNotifier(this._profileRepository) : super(const DiscoveryState()) {
    loadProfiles();
  }

  /// Load initial profiles
  Future<void> loadProfiles() async {
    if (state.isLoading) return;

    state = state.copyWith(isLoading: true);

    final result = await _profileRepository.getDiscoveryProfiles(
      page: 1,
      limit: 10,
    );

    result.fold(
      onSuccess: (profiles) {
        state = state.copyWith(
          profiles: profiles,
          isLoading: false,
          hasMore: profiles.length >= 10,
          currentPage: 1,
          currentIndex: 0,
        );
      },
      onFailure: (error) {
        state = state.copyWith(
          isLoading: false,
          error: error,
        );
      },
    );
  }

  /// Load more profiles (pagination)
  Future<void> loadMoreProfiles() async {
    if (state.isLoading || !state.hasMore) return;

    state = state.copyWith(isLoading: true);

    final nextPage = state.currentPage + 1;
    final result = await _profileRepository.getDiscoveryProfiles(
      page: nextPage,
      limit: 10,
    );

    result.fold(
      onSuccess: (profiles) {
        state = state.copyWith(
          profiles: [...state.profiles, ...profiles],
          isLoading: false,
          hasMore: profiles.length >= 10,
          currentPage: nextPage,
        );
      },
      onFailure: (error) {
        state = state.copyWith(
          isLoading: false,
          error: error,
        );
      },
    );
  }

  /// Like current profile
  Future<void> likeProfile() async {
    final profile = state.currentProfile;
    if (profile == null) return;

    await _profileRepository.likeProfile(profile.id);
    _moveToNextProfile();
  }

  /// Super like current profile
  Future<void> superLikeProfile() async {
    final profile = state.currentProfile;
    if (profile == null) return;

    await _profileRepository.superLikeProfile(profile.id);
    _moveToNextProfile();
  }

  /// Pass on current profile
  Future<void> passProfile() async {
    final profile = state.currentProfile;
    if (profile == null) return;

    await _profileRepository.passProfile(profile.id);
    _moveToNextProfile();
  }

  /// Undo last action
  Future<void> undoLastAction() async {
    if (state.currentIndex <= 0) return;

    await _profileRepository.undoLastAction();
    state = state.copyWith(currentIndex: state.currentIndex - 1);
  }

  /// Move to next profile
  void _moveToNextProfile() {
    final nextIndex = state.currentIndex + 1;

    // Load more if we're running low
    if (nextIndex >= state.profiles.length - 2) {
      loadMoreProfiles();
    }

    state = state.copyWith(currentIndex: nextIndex);
  }

  /// Clear error
  void clearError() {
    state = state.copyWith(error: null);
  }

  /// Refresh profiles
  Future<void> refresh() async {
    state = const DiscoveryState();
    await loadProfiles();
  }
}

/// Discovery provider
final discoveryProvider =
    StateNotifierProvider<DiscoveryNotifier, DiscoveryState>((ref) {
  final profileRepository = ref.watch(profileRepositoryProvider);
  return DiscoveryNotifier(profileRepository);
});

/// Current discovery profile provider
final currentDiscoveryProfileProvider = Provider<ProfileMatch?>((ref) {
  return ref.watch(discoveryProvider).currentProfile;
});

/// Matches state
class MatchesState {
  final List<ProfileMatch> matches;
  final bool isLoading;
  final String? error;

  const MatchesState({
    this.matches = const [],
    this.isLoading = false,
    this.error,
  });

  MatchesState copyWith({
    List<ProfileMatch>? matches,
    bool? isLoading,
    String? error,
  }) {
    return MatchesState(
      matches: matches ?? this.matches,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

/// Matches notifier
class MatchesNotifier extends StateNotifier<MatchesState> {
  final ProfileRepository _profileRepository;

  MatchesNotifier(this._profileRepository) : super(const MatchesState()) {
    loadMatches();
  }

  Future<void> loadMatches() async {
    state = state.copyWith(isLoading: true);

    final result = await _profileRepository.getMatches();

    result.fold(
      onSuccess: (matches) {
        state = state.copyWith(
          matches: matches,
          isLoading: false,
        );
      },
      onFailure: (error) {
        state = state.copyWith(
          isLoading: false,
          error: error,
        );
      },
    );
  }

  Future<void> refresh() async {
    await loadMatches();
  }
}

/// Matches provider
final matchesProvider =
    StateNotifierProvider<MatchesNotifier, MatchesState>((ref) {
  final profileRepository = ref.watch(profileRepositoryProvider);
  return MatchesNotifier(profileRepository);
});

/// Match intelligence provider - fetches detailed match analysis
final matchIntelligenceProvider =
    FutureProvider.family<MatchIntelligence?, String>((ref, profileId) async {
  final profileRepository = ref.watch(profileRepositoryProvider);
  final result = await profileRepository.getMatchIntelligence(profileId);

  return result.fold(
    onSuccess: (intelligence) => intelligence,
    onFailure: (_) => null,
  );
});

/// Profile detail provider - fetches a single profile by ID
final profileDetailProvider =
    FutureProvider.family<ProfileMatch?, String>((ref, profileId) async {
  final profileRepository = ref.watch(profileRepositoryProvider);
  final result = await profileRepository.getProfileById(profileId);

  return result.fold(
    onSuccess: (profile) => profile,
    onFailure: (_) => null,
  );
});

/// Who liked you provider (premium feature)
final whoLikedYouProvider = FutureProvider<List<ProfileMatch>>((ref) async {
  final profileRepository = ref.watch(profileRepositoryProvider);
  final result = await profileRepository.getWhoLikedYou();

  return result.fold(
    onSuccess: (profiles) => profiles,
    onFailure: (_) => [],
  );
});

/// Profiles provider - convenience AsyncValue provider for UI
/// Returns a list of profiles for discovery/dashboard views
final profilesProvider = FutureProvider<List<ProfileMatch>>((ref) async {
  final profileRepository = ref.watch(profileRepositoryProvider);
  final result =
      await profileRepository.getDiscoveryProfiles(page: 1, limit: 20);

  return result.fold(
    onSuccess: (profiles) => profiles,
    onFailure: (_) => [],
  );
});
