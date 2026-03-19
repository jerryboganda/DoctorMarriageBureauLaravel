import 'profile_match.dart';

/// Interest/proposal model — maps ExpressInterest backend model
class Interest {
  final int id;
  final int userId;       // recipient
  final int interestedBy; // sender
  final int status;       // 0=pending, 1=accepted, 2=rejected
  final String createdAt;
  final ProfileMatch? profile;

  const Interest({
    required this.id,
    required this.userId,
    required this.interestedBy,
    required this.status,
    required this.createdAt,
    this.profile,
  });

  bool get isPending => status == 0;
  bool get isAccepted => status == 1;
  bool get isRejected => status == 2;

  factory Interest.fromApi(Map<String, dynamic> json) {
    // The profile can come from different fields depending on endpoint
    Map<String, dynamic>? profileData;
    if (json['user'] != null) {
      profileData = json['user'] as Map<String, dynamic>;
    } else if (json['interested_by_user'] != null) {
      profileData = json['interested_by_user'] as Map<String, dynamic>;
    }

    return Interest(
      id: json['id'] as int,
      userId: json['user_id'] as int? ?? 0,
      interestedBy: json['interested_by'] as int? ?? 0,
      status: json['status'] as int? ?? 0,
      createdAt: json['created_at'] ?? '',
      profile: profileData != null ? ProfileMatch.fromApi(profileData) : null,
    );
  }
}

/// Optimistic proposal state entry with TTL
class ProposalStateEntry {
  final String state;
  final DateTime expiresAt;

  ProposalStateEntry({
    required this.state,
    required this.expiresAt,
  });

  bool get isExpired => DateTime.now().isAfter(expiresAt);
}
