import 'package:equatable/equatable.dart';

/// Education information
/// Transpiled from TypeScript: education?: { degree: string; institution: string }
class Education extends Equatable {
  final String degree;
  final String institution;

  const Education({
    required this.degree,
    required this.institution,
  });

  factory Education.fromJson(Map<String, dynamic> json) {
    return Education(
      degree: json['degree'] as String? ?? '',
      institution: json['institution'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'degree': degree,
      'institution': institution,
    };
  }

  @override
  List<Object?> get props => [degree, institution];
}

/// Career information
/// Transpiled from TypeScript: career?: { position: string; institution: string; duration: string }
class Career extends Equatable {
  final String position;
  final String institution;
  final String? duration;

  const Career({
    required this.position,
    required this.institution,
    this.duration,
  });

  factory Career.fromJson(Map<String, dynamic> json) {
    return Career(
      position: json['position'] as String? ?? '',
      institution: json['institution'] as String? ?? '',
      duration: json['duration'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'position': position,
      'institution': institution,
      if (duration != null) 'duration': duration,
    };
  }

  @override
  List<Object?> get props => [position, institution, duration];
}

/// Match category with name, score, and weight
/// Transpiled from TypeScript: categories: { name: string; score: number; weight: 'High' | 'Medium' | 'Low' }[]
class MatchCategory extends Equatable {
  final String name;
  final int score;
  final MatchWeight weight;

  const MatchCategory({
    required this.name,
    required this.score,
    required this.weight,
  });

  factory MatchCategory.fromJson(Map<String, dynamic> json) {
    return MatchCategory(
      name: json['name'] as String? ?? '',
      score: json['score'] as int? ?? 0,
      weight: MatchWeight.fromString(json['weight'] as String? ?? 'Medium'),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'score': score,
      'weight': weight.value,
    };
  }

  @override
  List<Object?> get props => [name, score, weight];
}

/// Weight enum for match categories
enum MatchWeight {
  high('High'),
  medium('Medium'),
  low('Low');

  final String value;
  const MatchWeight(this.value);

  factory MatchWeight.fromString(String value) {
    return MatchWeight.values.firstWhere(
      (e) => e.value.toLowerCase() == value.toLowerCase(),
      orElse: () => MatchWeight.medium,
    );
  }
}

/// Mutual fit percentages
/// Transpiled from TypeScript: mutualFit: { youMeetThem: number; theyMeetYou: number }
class MutualFit extends Equatable {
  final int youMeetThem;
  final int theyMeetYou;

  const MutualFit({
    required this.youMeetThem,
    required this.theyMeetYou,
  });

  factory MutualFit.fromJson(Map<String, dynamic> json) {
    return MutualFit(
      youMeetThem: json['youMeetThem'] as int? ?? 0,
      theyMeetYou: json['theyMeetYou'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'youMeetThem': youMeetThem,
      'theyMeetYou': theyMeetYou,
    };
  }

  @override
  List<Object?> get props => [youMeetThem, theyMeetYou];
}

/// Match intelligence/compatibility analysis
/// Transpiled from TypeScript: interface MatchIntelligence
class MatchIntelligence extends Equatable {
  final int totalScore;
  final List<MatchCategory> categories;
  final MutualFit? mutualFit;
  final List<String>? topReasons;
  final List<String>? frictionPoints;
  final String? agentNotes;
  final String? generatedAt;

  const MatchIntelligence({
    required this.totalScore,
    this.categories = const [],
    this.mutualFit,
    this.topReasons,
    this.frictionPoints,
    this.agentNotes,
    this.generatedAt,
  });

  factory MatchIntelligence.fromJson(Map<String, dynamic> json) {
    return MatchIntelligence(
      totalScore: json['totalScore'] as int? ?? 0,
      categories: (json['categories'] as List<dynamic>?)
              ?.map((e) => MatchCategory.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      mutualFit: json['mutualFit'] != null
          ? MutualFit.fromJson(json['mutualFit'] as Map<String, dynamic>)
          : null,
      topReasons: (json['topReasons'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList(),
      frictionPoints: (json['frictionPoints'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList(),
      agentNotes: json['agentNotes'] as String?,
      generatedAt: json['generatedAt'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'totalScore': totalScore,
      'categories': categories.map((e) => e.toJson()).toList(),
      if (mutualFit != null) 'mutualFit': mutualFit!.toJson(),
      if (topReasons != null) 'topReasons': topReasons,
      if (frictionPoints != null) 'frictionPoints': frictionPoints,
      if (agentNotes != null) 'agentNotes': agentNotes,
      if (generatedAt != null) 'generatedAt': generatedAt,
    };
  }

  @override
  List<Object?> get props => [
        totalScore,
        categories,
        mutualFit,
        topReasons,
        frictionPoints,
        agentNotes,
        generatedAt,
      ];
}

/// Profile match model representing a potential match
/// Transpiled from TypeScript: interface ProfileMatch
class ProfileMatch extends Equatable {
  final String id;
  final String name;
  final String? specialty;
  final String? hospital;
  final String? location;
  final int? age;
  final int matchPercentage;
  final String? avatarUrl;
  final String? coverUrl;
  final String? coverGradient;
  final bool isVerified;
  final String? bio;
  final List<String>? tags;
  final Education? education;
  final Career? career;
  final List<String>? matchReasons;
  final bool? isOnline;
  final MatchIntelligence? intelligence;
  final bool? isAgentPick;
  final bool? isHighIntent;
  final String? lastActive;

  const ProfileMatch({
    required this.id,
    required this.name,
    this.specialty,
    this.hospital,
    this.location,
    this.age,
    this.matchPercentage = 0,
    this.avatarUrl,
    this.coverUrl,
    this.coverGradient,
    this.isVerified = false,
    this.bio,
    this.tags,
    this.education,
    this.career,
    this.matchReasons,
    this.isOnline,
    this.intelligence,
    this.isAgentPick,
    this.isHighIntent,
    this.lastActive,
  });

  /// Creates an empty ProfileMatch
  factory ProfileMatch.empty() {
    return const ProfileMatch(
      id: '',
      name: '',
      matchPercentage: 0,
    );
  }

  factory ProfileMatch.fromJson(Map<String, dynamic> json) {
    return ProfileMatch(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      specialty: json['specialty'] as String?,
      hospital: json['hospital'] as String?,
      location: json['location'] as String?,
      age: json['age'] as int?,
      matchPercentage: json['matchPercentage'] as int? ?? 0,
      avatarUrl: json['avatarUrl'] as String?,
      coverUrl: json['coverUrl'] as String?,
      coverGradient: json['coverGradient'] as String?,
      isVerified: json['isVerified'] as bool? ?? false,
      bio: json['bio'] as String?,
      tags: (json['tags'] as List<dynamic>?)?.map((e) => e as String).toList(),
      education: json['education'] != null
          ? Education.fromJson(json['education'] as Map<String, dynamic>)
          : null,
      career: json['career'] != null
          ? Career.fromJson(json['career'] as Map<String, dynamic>)
          : null,
      matchReasons: (json['matchReasons'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList(),
      isOnline: json['isOnline'] as bool?,
      intelligence: json['intelligence'] != null
          ? MatchIntelligence.fromJson(
              json['intelligence'] as Map<String, dynamic>)
          : null,
      isAgentPick: json['isAgentPick'] as bool?,
      isHighIntent: json['isHighIntent'] as bool?,
      lastActive: json['lastActive'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      if (specialty != null) 'specialty': specialty,
      if (hospital != null) 'hospital': hospital,
      if (location != null) 'location': location,
      if (age != null) 'age': age,
      'matchPercentage': matchPercentage,
      if (avatarUrl != null) 'avatarUrl': avatarUrl,
      if (coverUrl != null) 'coverUrl': coverUrl,
      if (coverGradient != null) 'coverGradient': coverGradient,
      'isVerified': isVerified,
      if (bio != null) 'bio': bio,
      if (tags != null) 'tags': tags,
      if (education != null) 'education': education!.toJson(),
      if (career != null) 'career': career!.toJson(),
      if (matchReasons != null) 'matchReasons': matchReasons,
      if (isOnline != null) 'isOnline': isOnline,
      if (intelligence != null) 'intelligence': intelligence!.toJson(),
      if (isAgentPick != null) 'isAgentPick': isAgentPick,
      if (isHighIntent != null) 'isHighIntent': isHighIntent,
      if (lastActive != null) 'lastActive': lastActive,
    };
  }

  ProfileMatch copyWith({
    String? id,
    String? name,
    String? specialty,
    String? hospital,
    String? location,
    int? age,
    int? matchPercentage,
    String? avatarUrl,
    String? coverUrl,
    String? coverGradient,
    bool? isVerified,
    String? bio,
    List<String>? tags,
    Education? education,
    Career? career,
    List<String>? matchReasons,
    bool? isOnline,
    MatchIntelligence? intelligence,
    bool? isAgentPick,
    bool? isHighIntent,
    String? lastActive,
  }) {
    return ProfileMatch(
      id: id ?? this.id,
      name: name ?? this.name,
      specialty: specialty ?? this.specialty,
      hospital: hospital ?? this.hospital,
      location: location ?? this.location,
      age: age ?? this.age,
      matchPercentage: matchPercentage ?? this.matchPercentage,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      coverUrl: coverUrl ?? this.coverUrl,
      coverGradient: coverGradient ?? this.coverGradient,
      isVerified: isVerified ?? this.isVerified,
      bio: bio ?? this.bio,
      tags: tags ?? this.tags,
      education: education ?? this.education,
      career: career ?? this.career,
      matchReasons: matchReasons ?? this.matchReasons,
      isOnline: isOnline ?? this.isOnline,
      intelligence: intelligence ?? this.intelligence,
      isAgentPick: isAgentPick ?? this.isAgentPick,
      isHighIntent: isHighIntent ?? this.isHighIntent,
      lastActive: lastActive ?? this.lastActive,
    );
  }

  @override
  List<Object?> get props => [
        id,
        name,
        specialty,
        hospital,
        location,
        age,
        matchPercentage,
        avatarUrl,
        coverUrl,
        coverGradient,
        isVerified,
        bio,
        tags,
        education,
        career,
        matchReasons,
        isOnline,
        intelligence,
        isAgentPick,
        isHighIntent,
        lastActive,
      ];

  @override
  String toString() =>
      'ProfileMatch(id: $id, name: $name, matchPercentage: $matchPercentage%)';
}
