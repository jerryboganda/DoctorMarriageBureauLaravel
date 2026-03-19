import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/profile_match.dart';
import '../services/discovery_service.dart';
import 'auth_provider.dart';

class DiscoveryState {
  final List<ProfileMatch> agentPicks;
  final List<ProfileMatch> highIntent;
  final List<ProfileMatch> allProfiles;
  final bool isLoading;
  final bool isLoadingMore;
  final int currentPage;
  final int lastPage;
  final String? error;
  final String activeTab; // 'all', 'verified', 'unverified'
  final String searchQuery;
  final bool isSearching;

  const DiscoveryState({
    this.agentPicks = const [],
    this.highIntent = const [],
    this.allProfiles = const [],
    this.isLoading = false,
    this.isLoadingMore = false,
    this.currentPage = 1,
    this.lastPage = 1,
    this.error,
    this.activeTab = 'all',
    this.searchQuery = '',
    this.isSearching = false,
  });

  bool get hasMore => currentPage < lastPage;

  DiscoveryState copyWith({
    List<ProfileMatch>? agentPicks,
    List<ProfileMatch>? highIntent,
    List<ProfileMatch>? allProfiles,
    bool? isLoading,
    bool? isLoadingMore,
    int? currentPage,
    int? lastPage,
    String? error,
    String? activeTab,
    String? searchQuery,
    bool? isSearching,
  }) {
    return DiscoveryState(
      agentPicks: agentPicks ?? this.agentPicks,
      highIntent: highIntent ?? this.highIntent,
      allProfiles: allProfiles ?? this.allProfiles,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      currentPage: currentPage ?? this.currentPage,
      lastPage: lastPage ?? this.lastPage,
      error: error,
      activeTab: activeTab ?? this.activeTab,
      searchQuery: searchQuery ?? this.searchQuery,
      isSearching: isSearching ?? this.isSearching,
    );
  }
}

class DiscoveryNotifier extends StateNotifier<DiscoveryState> {
  final DiscoveryService _service;

  DiscoveryNotifier(this._service) : super(const DiscoveryState());

  Future<void> loadDiscovery({bool refresh = false}) async {
    if (state.isLoading) return;
    state = state.copyWith(isLoading: true, error: null);

    try {
      final verified = state.activeTab == 'verified'
          ? 'yes'
          : state.activeTab == 'unverified'
              ? 'no'
              : null;

      final result = await _service.fetchDiscovery(
        page: 1,
        verified: verified,
      );

      state = state.copyWith(
        agentPicks: result.agentPicks,
        highIntent: result.highIntent,
        allProfiles: result.allProfiles,
        currentPage: result.currentPage,
        lastPage: result.lastPage,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to load profiles',
      );
    }
  }

  Future<void> loadMore() async {
    if (state.isLoadingMore || !state.hasMore) return;
    state = state.copyWith(isLoadingMore: true);

    try {
      final verified = state.activeTab == 'verified'
          ? 'yes'
          : state.activeTab == 'unverified'
              ? 'no'
              : null;

      final result = await _service.fetchDiscovery(
        page: state.currentPage + 1,
        verified: verified,
      );

      state = state.copyWith(
        allProfiles: [...state.allProfiles, ...result.allProfiles],
        currentPage: result.currentPage,
        lastPage: result.lastPage,
        isLoadingMore: false,
      );
    } catch (_) {
      state = state.copyWith(isLoadingMore: false);
    }
  }

  void setActiveTab(String tab) {
    if (tab == state.activeTab) return;
    state = state.copyWith(activeTab: tab);
    loadDiscovery(refresh: true);
  }

  Future<void> search(String query) async {
    state = state.copyWith(searchQuery: query, isSearching: true);
    try {
      final results = await _service.search(query: query);
      state = state.copyWith(
        allProfiles: results,
        isSearching: false,
        agentPicks: [],
        highIntent: [],
      );
    } catch (_) {
      state = state.copyWith(isSearching: false);
    }
  }

  void clearSearch() {
    state = state.copyWith(searchQuery: '', isSearching: false);
    loadDiscovery(refresh: true);
  }
}

final discoveryServiceProvider = Provider<DiscoveryService>((ref) {
  return DiscoveryService(ref.read(apiServiceProvider));
});

final discoveryProvider = StateNotifierProvider<DiscoveryNotifier, DiscoveryState>((ref) {
  return DiscoveryNotifier(ref.read(discoveryServiceProvider));
});
