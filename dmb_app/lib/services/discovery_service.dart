import 'api_service.dart';
import '../models/profile_match.dart';

class DiscoveryService {
  final ApiService _api;

  DiscoveryService(this._api);

  /// Fetch discovery feed — maps GET /discovery
  Future<DiscoveryResult> fetchDiscovery({
    int page = 1,
    String? verified, // 'yes', 'no', or null for all
  }) async {
    final response = await _api.get('/discovery', queryParameters: {
      'page': page,
      if (verified != null) 'verified': verified,
    });

    final data = response.data;
    final allProfiles = <ProfileMatch>[];
    final agentPicks = <ProfileMatch>[];
    final highIntent = <ProfileMatch>[];

    // Parse agent_picks
    if (data['agent_picks'] != null) {
      for (final p in data['agent_picks']) {
        agentPicks.add(ProfileMatch.fromApi(p));
      }
    }

    // Parse high_intent
    if (data['high_intent'] != null) {
      for (final p in data['high_intent']) {
        highIntent.add(ProfileMatch.fromApi(p));
      }
    }

    // Parse all_profiles (paginated)
    final profiles = data['all_profiles'] ?? data['data'] ?? data['profiles'] ?? [];
    if (profiles is List) {
      for (final p in profiles) {
        allProfiles.add(ProfileMatch.fromApi(p));
      }
    }

    // Pagination info
    final pagination = data['pagination'] ?? data['meta'] ?? {};
    final lastPage = pagination['last_page'] ?? 1;
    final currentPage = pagination['current_page'] ?? page;

    return DiscoveryResult(
      agentPicks: agentPicks,
      highIntent: highIntent,
      allProfiles: allProfiles,
      currentPage: currentPage is int ? currentPage : int.tryParse(currentPage.toString()) ?? page,
      lastPage: lastPage is int ? lastPage : int.tryParse(lastPage.toString()) ?? 1,
    );
  }

  /// Search profiles — maps GET /discovery/search
  Future<List<ProfileMatch>> search({
    String? query,
    int? ageMin,
    int? ageMax,
    String? religion,
    String? profession,
  }) async {
    final response = await _api.get('/discovery/search', queryParameters: {
      if (query != null) 'q': query,
      if (ageMin != null) 'age_min': ageMin,
      if (ageMax != null) 'age_max': ageMax,
      if (religion != null) 'religion': religion,
      if (profession != null) 'profession': profession,
    });

    final data = response.data;
    final list = data['data'] ?? data['profiles'] ?? data;
    if (list is! List) return [];

    return list.map<ProfileMatch>((p) => ProfileMatch.fromApi(p)).toList();
  }

  /// Toggle anonymous browsing
  Future<bool> toggleAnonymous() async {
    final response = await _api.post('/discovery/toggle-anonymous');
    return response.data['is_visible'] == true;
  }

  /// Get anonymous status
  Future<bool> getAnonymousStatus() async {
    final response = await _api.get('/discovery/anonymous-status');
    return response.data['is_visible'] == true;
  }

  /// Enable travel mode
  Future<void> enableTravelMode({
    required String city,
    required String country,
  }) async {
    await _api.post('/discovery/travel-mode/enable', data: {
      'city': city,
      'country': country,
    });
  }

  /// Disable travel mode
  Future<void> disableTravelMode() async {
    await _api.post('/discovery/travel-mode/disable');
  }

  /// Get travel mode status
  Future<Map<String, dynamic>> getTravelModeStatus() async {
    final response = await _api.get('/discovery/travel-mode/status');
    return response.data is Map<String, dynamic> ? response.data : {};
  }
}

class DiscoveryResult {
  final List<ProfileMatch> agentPicks;
  final List<ProfileMatch> highIntent;
  final List<ProfileMatch> allProfiles;
  final int currentPage;
  final int lastPage;

  const DiscoveryResult({
    this.agentPicks = const [],
    this.highIntent = const [],
    this.allProfiles = const [],
    this.currentPage = 1,
    this.lastPage = 1,
  });

  bool get hasMore => currentPage < lastPage;
}
