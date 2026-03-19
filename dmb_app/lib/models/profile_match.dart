/// Maps ProfileMatch and MatchIntelligence from types.ts
class MatchIntelligence {
  final double totalScore;
  final List<MatchCategory> categories;
  final MutualFit mutualFit;
  final List<String> topReasons;
  final List<String> frictionPoints;
  final String? agentNotes;
  final String? behavioralReason;
  final String? generatedAt;

  const MatchIntelligence({
    required this.totalScore,
    required this.categories,
    required this.mutualFit,
    required this.topReasons,
    required this.frictionPoints,
    this.agentNotes,
    this.behavioralReason,
    this.generatedAt,
  });

  factory MatchIntelligence.fromJson(Map<String, dynamic> json) {
    return MatchIntelligence(
      totalScore: (json['totalScore'] ?? json['total_score'] ?? 0).toDouble(),
      categories: (json['categories'] as List? ?? [])
          .map((c) => MatchCategory.fromJson(c))
          .toList(),
      mutualFit: MutualFit.fromJson(json['mutualFit'] ?? json['mutual_fit'] ?? {}),
      topReasons: List<String>.from(json['topReasons'] ?? json['top_reasons'] ?? []),
      frictionPoints: List<String>.from(json['frictionPoints'] ?? json['friction_points'] ?? []),
      agentNotes: json['agentNotes'] ?? json['agent_notes'],
      behavioralReason: json['behavioralReason'] ?? json['behavioral_reason'],
      generatedAt: json['generatedAt'] ?? json['generated_at'],
    );
  }
}

class MatchCategory {
  final String name;
  final double score;
  final String weight; // 'High', 'Medium', 'Low'

  const MatchCategory({
    required this.name,
    required this.score,
    required this.weight,
  });

  factory MatchCategory.fromJson(Map<String, dynamic> json) {
    return MatchCategory(
      name: json['name'] ?? '',
      score: (json['score'] ?? 0).toDouble(),
      weight: json['weight'] ?? 'Medium',
    );
  }
}

class MutualFit {
  final double youMeetThem;
  final double theyMeetYou;

  const MutualFit({required this.youMeetThem, required this.theyMeetYou});

  factory MutualFit.fromJson(Map<String, dynamic> json) {
    return MutualFit(
      youMeetThem: (json['youMeetThem'] ?? json['you_meet_them'] ?? 0).toDouble(),
      theyMeetYou: (json['theyMeetYou'] ?? json['they_meet_you'] ?? 0).toDouble(),
    );
  }
}

class ProfileMatch {
  final String id;
  final String name;
  final String specialty;
  final String hospital;
  final String location;
  final int age;
  final double matchPercentage;
  final String avatarUrl;
  final String? coverGradient;
  final bool isVerified;
  final String? bio;
  final List<String> tags;
  final ProfileEducation? education;
  final ProfileCareer? career;
  final List<String> matchReasons;
  final bool isOnline;
  final MatchIntelligence? intelligence;
  final bool isAgentPick;
  final bool isHighIntent;
  final dynamic interestStatus;
  final String? interestText;
  final bool travelMode;
  final String? travelCity;
  final String? travelCountry;

  const ProfileMatch({
    required this.id,
    required this.name,
    this.specialty = '',
    this.hospital = '',
    this.location = '',
    this.age = 0,
    this.matchPercentage = 0,
    this.avatarUrl = '',
    this.coverGradient,
    this.isVerified = false,
    this.bio,
    this.tags = const [],
    this.education,
    this.career,
    this.matchReasons = const [],
    this.isOnline = false,
    this.intelligence,
    this.isAgentPick = false,
    this.isHighIntent = false,
    this.interestStatus,
    this.interestText,
    this.travelMode = false,
    this.travelCity,
    this.travelCountry,
  });

  /// Normalize from backend API response (matches DiscoveryView.tsx normalizeProfile)
  factory ProfileMatch.fromApi(Map<String, dynamic> json) {
    final member = json['member'] as Map<String, dynamic>? ?? {};
    final user = json['user'] as Map<String, dynamic>? ?? json;

    // Build name
    final firstName = (user['first_name'] ?? json['first_name'] ?? '').toString().trim();
    final lastName = (user['last_name'] ?? json['last_name'] ?? '').toString().trim();
    final name = json['name']?.toString() ?? '$firstName $lastName'.trim();

    // Build location from address
    final addresses = json['addresses'] as List? ?? user['addresses'] as List? ?? [];
    String location = '';
    if (addresses.isNotEmpty) {
      final addr = addresses.first as Map<String, dynamic>;
      final city = addr['city']?['name'] ?? '';
      final country = addr['country']?['name'] ?? '';
      location = [city, country].where((s) => s.toString().isNotEmpty).join(', ');
    }

    // Career
    final careers = json['career'] as List? ?? user['career'] as List? ?? [];
    ProfileCareer? career;
    if (careers.isNotEmpty) {
      final c = careers.first as Map<String, dynamic>;
      career = ProfileCareer(
        position: c['designation'] ?? c['position'] ?? '',
        institution: c['company'] ?? c['institution'] ?? '',
        duration: c['experience'] ?? c['duration'] ?? '',
      );
    }

    // Education
    final educations = json['education'] as List? ?? user['education'] as List? ?? [];
    ProfileEducation? education;
    if (educations.isNotEmpty) {
      final e = educations.first as Map<String, dynamic>;
      education = ProfileEducation(
        degree: e['degree'] ?? '',
        institution: e['institution'] ?? '',
      );
    }

    // Specialty from career designation
    final specialty = career?.position ?? json['specialty']?.toString() ?? '';

    return ProfileMatch(
      id: (json['id'] ?? user['id'] ?? '').toString(),
      name: name,
      specialty: specialty,
      hospital: career?.institution ?? '',
      location: location,
      age: _calcAge(json['birthday'] ?? member['birthday']),
      matchPercentage: (json['match_percentage'] ?? json['matchPercentage'] ?? 0).toDouble(),
      avatarUrl: (json['avatar'] ?? json['avatar_original'] ?? json['photo'] ?? user['photo'] ?? '').toString(),
      coverGradient: json['coverGradient'] ?? json['cover_gradient'],
      isVerified: json['email_verified_at'] != null || (json['is_verified'] == true),
      bio: json['introduction'] ?? json['bio'],
      tags: List<String>.from(json['tags'] ?? []),
      education: education,
      career: career,
      matchReasons: List<String>.from(json['matchReasons'] ?? json['match_reasons'] ?? []),
      isOnline: json['is_online'] == true,
      intelligence: json['intelligence'] != null
          ? MatchIntelligence.fromJson(json['intelligence'])
          : null,
      isAgentPick: json['is_agent_pick'] == true || member['is_agent_pick'] == 1,
      isHighIntent: json['is_high_intent'] == true || member['is_high_intent'] == 1,
      interestStatus: json['interest_status'] ?? json['interestStatus'],
      interestText: json['interest_text'] ?? json['interestText'],
      travelMode: json['travel_mode'] == true || member['travel_mode'] == 1,
      travelCity: json['travel_city'] ?? member['travel_city'],
      travelCountry: json['travel_country'] ?? member['travel_country'],
    );
  }

  static int _calcAge(dynamic birthday) {
    if (birthday == null) return 0;
    try {
      final dob = DateTime.parse(birthday.toString());
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

class ProfileEducation {
  final String degree;
  final String institution;

  const ProfileEducation({required this.degree, required this.institution});
}

class ProfileCareer {
  final String position;
  final String institution;
  final String duration;

  const ProfileCareer({
    required this.position,
    required this.institution,
    required this.duration,
  });
}
