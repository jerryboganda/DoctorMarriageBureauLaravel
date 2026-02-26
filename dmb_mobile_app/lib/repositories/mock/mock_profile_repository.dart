import '../../models/models.dart';
import '../repository_interfaces.dart';

/// Mock implementation of ProfileRepository for development and testing
class MockProfileRepository implements ProfileRepository {
  /// Mock profiles - transpiled from React MAIN_PROFILE and SECONDARY_PROFILE
  static final List<ProfileMatch> mockProfiles = [
    ProfileMatch(
      id: '1',
      name: 'Dr. Aditi Sharma, MD',
      specialty: 'Interventional Cardiology',
      hospital: 'City Heart Institute',
      location: 'New Delhi',
      age: 29,
      matchPercentage: 98,
      isVerified: true,
      avatarUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuDxXuKVKvrrNXYrG-CY1ssc7c8MM0q4JHAY75reeW_PbVx6mcGg2IWd0ZWJJdglbFYo-odqtaxEZSoEU9TDAChhZ_YgCKJmbKtlnAh_bFl1HkS5BrMhak_-V5ms913RD14CEyw6wgE1V_WqRWRfk-k0wfB0jnK_GlS_w980MpPHAm3G_IadeEXaFHmTTiI-TgRihMq1zYSIDjWu19ZqeSkDVEd-WO3R0nFXnsoYA2C3kJqb5DS0_tX8Z12bor2ZslGRfDBc2vmzuMg',
      coverGradient: 'bg-gradient-to-r from-pink-100 to-purple-100',
      bio:
          "Passionate about advancements in cardiac care. When I'm not in the cath lab, you can find me hiking or reading historical fiction. Looking for someone who understands the demands of our profession but values quality time.",
      tags: ['Hiking', 'Classical Music', 'Vegetarian'],
      education: Education(
        degree: 'MD Cardiology',
        institution: 'AIIMS, New Delhi (Gold Medalist)',
      ),
      career: Career(
        position: 'Senior Resident',
        institution: 'City Heart Institute',
        duration: '3 Yrs',
      ),
      intelligence: MatchIntelligence(
        totalScore: 98,
        categories: [
          MatchCategory(
              name: 'Lifestyle & Values', score: 99, weight: MatchWeight.high),
          MatchCategory(
              name: 'Career Ambition', score: 95, weight: MatchWeight.high),
          MatchCategory(
              name: 'Family Background', score: 90, weight: MatchWeight.medium),
        ],
        mutualFit: MutualFit(youMeetThem: 95, theyMeetYou: 100),
        topReasons: [
          'Both prioritize research',
          'Vegetarian diets align',
          'Complementary work schedules',
        ],
        frictionPoints: ['Dr. Aditi prefers city living, you prefer suburbs'],
        agentNotes:
            'Highly recommended. Families have spoken and aligned on horoscope as well.',
        generatedAt: 'AI Analysis • 2 hours ago',
      ),
    ),
    ProfileMatch(
      id: '2',
      name: 'Dr. Rohan Gupta, MS Ortho',
      specialty: 'Spine Specialist',
      hospital: 'Apollo Hospital',
      location: 'Mumbai',
      age: 32,
      matchPercentage: 85,
      isVerified: true,
      avatarUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuCRcdeTydgcgnAttlmfU4LLL4vVkwtOHBPd6w3QatUT9cIkbpP_DjfQ9RlvwlJBVXG53Yp1hle3KRcVrHPd95u3mGIknG4fv1yYu7jStC9WvKbCY45OIF04vYYeNPPn3YkTxz1U-5VYb-dWXPjBCCod00I1VgvOH-4ifIV3k6a6jxbnxbSX7R2dWfw2t5vzM82LqXfDWPd9vHmktScUf8EMP2g38LXuffLIFPolBtqNIpOmWEaC0EoQa_hZeTAMERlO-0iWiCGVOHs',
      bio:
          'Dedicated spine surgeon with a passion for minimally invasive techniques. Looking for a partner who shares my values of hard work and family.',
      tags: ['Fitness', 'Cooking', 'Travel'],
      education: Education(
        degree: 'MS Orthopedics',
        institution: 'Grant Medical College',
      ),
      career: Career(
        position: 'Consultant',
        institution: 'Apollo Hospital',
        duration: '5 Yrs',
      ),
      intelligence: MatchIntelligence(
        totalScore: 85,
        categories: [
          MatchCategory(
              name: 'Lifestyle & Values', score: 80, weight: MatchWeight.high),
          MatchCategory(
              name: 'Career Ambition', score: 88, weight: MatchWeight.high),
          MatchCategory(
              name: 'Family Background', score: 85, weight: MatchWeight.medium),
        ],
        mutualFit: MutualFit(youMeetThem: 82, theyMeetYou: 88),
        topReasons: [
          'Strong career alignment',
          'Shared fitness interests',
          'Compatible schedules',
        ],
        frictionPoints: ['Different dietary preferences'],
        generatedAt: 'AI Analysis • 5 hours ago',
      ),
    ),
    ProfileMatch(
      id: '3',
      name: 'Dr. Emily Chen, MBBS',
      specialty: 'Dermatology',
      hospital: 'Skin Care Clinic',
      location: 'Bangalore',
      age: 28,
      matchPercentage: 92,
      isVerified: true,
      avatarUrl:
          'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=200&h=200',
      bio:
          'Board-certified dermatologist with a love for art and travel. Seeking a meaningful connection with someone who appreciates both ambition and adventure.',
      tags: ['Art', 'Travel', 'Photography'],
      education: Education(
        degree: 'MD Dermatology',
        institution: 'St. Johns Medical College',
      ),
      career: Career(
        position: 'Consultant',
        institution: 'Skin Care Clinic',
        duration: '2 Yrs',
      ),
      intelligence: MatchIntelligence(
        totalScore: 92,
        categories: [
          MatchCategory(
              name: 'Lifestyle & Values', score: 94, weight: MatchWeight.high),
          MatchCategory(
              name: 'Career Ambition', score: 90, weight: MatchWeight.medium),
          MatchCategory(
              name: 'Family Background', score: 91, weight: MatchWeight.medium),
        ],
        mutualFit: MutualFit(youMeetThem: 90, theyMeetYou: 94),
        topReasons: [
          'Shared love for travel',
          'Artistic interests align',
          'Similar family values',
        ],
        frictionPoints: ['Location may need discussion'],
        generatedAt: 'AI Analysis • 1 day ago',
      ),
    ),
    ProfileMatch(
      id: '4',
      name: 'Dr. Priya Menon, DNB',
      specialty: 'Psychiatry',
      hospital: 'NIMHANS',
      location: 'Bangalore',
      age: 30,
      matchPercentage: 88,
      isVerified: false,
      avatarUrl:
          'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200&h=200',
      bio:
          'Mental health advocate and published researcher. I believe in the power of understanding and connection. Looking for a thoughtful partner.',
      tags: ['Reading', 'Meditation', 'Podcasts'],
      education: Education(
        degree: 'DNB Psychiatry',
        institution: 'NIMHANS',
      ),
      career: Career(
        position: 'Assistant Professor',
        institution: 'NIMHANS',
        duration: '4 Yrs',
      ),
      intelligence: MatchIntelligence(
        totalScore: 88,
        categories: [
          MatchCategory(
              name: 'Lifestyle & Values', score: 92, weight: MatchWeight.high),
          MatchCategory(
              name: 'Career Ambition', score: 85, weight: MatchWeight.medium),
          MatchCategory(
              name: 'Family Background', score: 87, weight: MatchWeight.medium),
        ],
        mutualFit: MutualFit(youMeetThem: 86, theyMeetYou: 90),
        topReasons: [
          'Intellectual compatibility',
          'Shared value of wellness',
          'Research interests align',
        ],
        frictionPoints: ['Work-life balance approaches differ'],
        generatedAt: 'AI Analysis • 3 hours ago',
      ),
    ),
    ProfileMatch(
      id: '5',
      name: 'Dr. Vikram Singh, MCh',
      specialty: 'Neurosurgery',
      hospital: 'Fortis Hospital',
      location: 'Gurgaon',
      age: 34,
      matchPercentage: 79,
      isVerified: true,
      avatarUrl:
          'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200&h=200',
      bio:
          'Dedicated neurosurgeon who loves sports and outdoor activities. Family-oriented and looking for a life partner who values both career and relationships.',
      tags: ['Cricket', 'Trekking', 'Movies'],
      education: Education(
        degree: 'MCh Neurosurgery',
        institution: 'PGI Chandigarh',
      ),
      career: Career(
        position: 'Senior Consultant',
        institution: 'Fortis Hospital',
        duration: '6 Yrs',
      ),
      intelligence: MatchIntelligence(
        totalScore: 79,
        categories: [
          MatchCategory(
              name: 'Lifestyle & Values', score: 75, weight: MatchWeight.high),
          MatchCategory(
              name: 'Career Ambition', score: 82, weight: MatchWeight.high),
          MatchCategory(
              name: 'Family Background', score: 80, weight: MatchWeight.medium),
        ],
        mutualFit: MutualFit(youMeetThem: 78, theyMeetYou: 80),
        topReasons: [
          'Strong family values',
          'Active lifestyle match',
          'Similar age bracket',
        ],
        frictionPoints: [
          'Different hobby preferences',
          'Work schedule conflicts'
        ],
        generatedAt: 'AI Analysis • 6 hours ago',
      ),
    ),
  ];

  final List<ProfileMatch> _matches = [];
  final List<String> _likedProfiles = [];
  final List<String> _passedProfiles = [];
  final List<String> _blockedProfiles = [];
  String? _lastAction;
  String? _lastActionProfileId;

  @override
  Future<Result<List<ProfileMatch>>> getDiscoveryProfiles({
    int page = 1,
    int limit = 10,
    Map<String, dynamic>? filters,
  }) async {
    await _simulateNetworkDelay();

    // Filter out already liked, passed, and blocked profiles
    final availableProfiles = mockProfiles.where((p) {
      return !_likedProfiles.contains(p.id) &&
          !_passedProfiles.contains(p.id) &&
          !_blockedProfiles.contains(p.id);
    }).toList();

    // Apply pagination
    final startIndex = (page - 1) * limit;
    if (startIndex >= availableProfiles.length) {
      return Result.success([]);
    }

    final endIndex = (startIndex + limit).clamp(0, availableProfiles.length);
    final paginatedProfiles = availableProfiles.sublist(startIndex, endIndex);

    return Result.success(paginatedProfiles);
  }

  @override
  Future<Result<ProfileMatch>> getProfileById(String id) async {
    await _simulateNetworkDelay(milliseconds: 400);

    final profile = mockProfiles.firstWhere(
      (p) => p.id == id,
      orElse: () => ProfileMatch.empty(),
    );

    if (profile.id.isEmpty) {
      return Result.failure('Profile not found');
    }

    return Result.success(profile);
  }

  @override
  Future<Result<List<ProfileMatch>>> getMatches({
    int page = 1,
    int limit = 20,
  }) async {
    await _simulateNetworkDelay();
    return Result.success(_matches);
  }

  @override
  Future<Result<void>> likeProfile(String profileId) async {
    await _simulateNetworkDelay(milliseconds: 500);

    _likedProfiles.add(profileId);
    _lastAction = 'like';
    _lastActionProfileId = profileId;

    // Simulate match (50% chance)
    if (DateTime.now().millisecond % 2 == 0) {
      final profile = mockProfiles.firstWhere(
        (p) => p.id == profileId,
        orElse: () => ProfileMatch.empty(),
      );
      if (profile.id.isNotEmpty) {
        _matches.add(profile);
      }
    }

    return Result.success(null);
  }

  @override
  Future<Result<void>> superLikeProfile(String profileId) async {
    await _simulateNetworkDelay(milliseconds: 500);

    _likedProfiles.add(profileId);
    _lastAction = 'superlike';
    _lastActionProfileId = profileId;

    // Super like always matches for demo
    final profile = mockProfiles.firstWhere(
      (p) => p.id == profileId,
      orElse: () => ProfileMatch.empty(),
    );
    if (profile.id.isNotEmpty) {
      _matches.add(profile);
    }

    return Result.success(null);
  }

  @override
  Future<Result<void>> passProfile(String profileId) async {
    await _simulateNetworkDelay(milliseconds: 300);

    _passedProfiles.add(profileId);
    _lastAction = 'pass';
    _lastActionProfileId = profileId;

    return Result.success(null);
  }

  @override
  Future<Result<void>> undoLastAction() async {
    await _simulateNetworkDelay(milliseconds: 300);

    if (_lastAction == null || _lastActionProfileId == null) {
      return Result.failure('No action to undo');
    }

    switch (_lastAction) {
      case 'like':
      case 'superlike':
        _likedProfiles.remove(_lastActionProfileId);
        _matches.removeWhere((m) => m.id == _lastActionProfileId);
        break;
      case 'pass':
        _passedProfiles.remove(_lastActionProfileId);
        break;
    }

    _lastAction = null;
    _lastActionProfileId = null;

    return Result.success(null);
  }

  @override
  Future<Result<MatchIntelligence>> getMatchIntelligence(
      String profileId) async {
    await _simulateNetworkDelay();

    final profile = mockProfiles.firstWhere(
      (p) => p.id == profileId,
      orElse: () => ProfileMatch.empty(),
    );

    if (profile.intelligence == null) {
      return Result.failure('Match intelligence not available');
    }

    return Result.success(profile.intelligence!);
  }

  @override
  Future<Result<void>> updateMatchPreferences({
    required Map<String, dynamic> preferences,
  }) async {
    await _simulateNetworkDelay();
    return Result.success(null);
  }

  @override
  Future<Result<Map<String, dynamic>>> getMatchPreferences() async {
    await _simulateNetworkDelay();
    return Result.success({
      'ageRange': {'min': 25, 'max': 35},
      'location': 'Any',
      'specialty': 'Any',
      'religion': 'Any',
      'verifiedOnly': true,
    });
  }

  @override
  Future<Result<void>> reportProfile({
    required String profileId,
    required String reason,
    String? details,
  }) async {
    await _simulateNetworkDelay();
    return Result.success(null);
  }

  @override
  Future<Result<void>> blockProfile(String profileId) async {
    await _simulateNetworkDelay();
    _blockedProfiles.add(profileId);
    return Result.success(null);
  }

  @override
  Future<Result<void>> unblockProfile(String profileId) async {
    await _simulateNetworkDelay();
    _blockedProfiles.remove(profileId);
    return Result.success(null);
  }

  @override
  Future<Result<List<ProfileMatch>>> getBlockedProfiles() async {
    await _simulateNetworkDelay();
    final blocked =
        mockProfiles.where((p) => _blockedProfiles.contains(p.id)).toList();
    return Result.success(blocked);
  }

  @override
  Future<Result<List<ProfileMatch>>> getWhoLikedYou() async {
    await _simulateNetworkDelay();
    // Return a subset for demo
    return Result.success(mockProfiles.take(2).toList());
  }

  @override
  Future<Result<void>> boostProfile() async {
    await _simulateNetworkDelay();
    return Result.success(null);
  }

  Future<void> _simulateNetworkDelay({int milliseconds = 800}) async {
    await Future.delayed(Duration(milliseconds: milliseconds));
  }
}
