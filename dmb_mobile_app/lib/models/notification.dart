import 'package:equatable/equatable.dart';

/// Notification type enum
enum NotificationType {
  match('match'),
  message('message'),
  proposal('proposal'),
  proposalAccepted('proposal_accepted'),
  proposalDeclined('proposal_declined'),
  profileView('profile_view'),
  verification('verification'),
  system('system'),
  reminder('reminder'),
  promotion('promotion');

  final String value;
  const NotificationType(this.value);

  factory NotificationType.fromString(String value) {
    return NotificationType.values.firstWhere(
      (e) => e.value.toLowerCase() == value.toLowerCase().replaceAll(' ', '_'),
      orElse: () => NotificationType.system,
    );
  }
}

/// App notification model
class AppNotification extends Equatable {
  final String id;
  final NotificationType type;
  final String title;
  final String body;
  final String timestamp;
  final bool isRead;
  final String? avatarUrl;
  final String? actionUrl;
  final Map<String, dynamic>? metadata;

  const AppNotification({
    required this.id,
    required this.type,
    required this.title,
    required this.body,
    required this.timestamp,
    this.isRead = false,
    this.avatarUrl,
    this.actionUrl,
    this.metadata,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: json['id'] as String? ?? '',
      type: NotificationType.fromString(json['type'] as String? ?? 'system'),
      title: json['title'] as String? ?? '',
      body: json['body'] as String? ?? '',
      timestamp: json['timestamp'] as String? ?? '',
      isRead: json['isRead'] as bool? ?? false,
      avatarUrl: json['avatarUrl'] as String?,
      actionUrl: json['actionUrl'] as String?,
      metadata: json['metadata'] as Map<String, dynamic>?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': type.value,
      'title': title,
      'body': body,
      'timestamp': timestamp,
      'isRead': isRead,
      if (avatarUrl != null) 'avatarUrl': avatarUrl,
      if (actionUrl != null) 'actionUrl': actionUrl,
      if (metadata != null) 'metadata': metadata,
    };
  }

  AppNotification copyWith({
    String? id,
    NotificationType? type,
    String? title,
    String? body,
    String? timestamp,
    bool? isRead,
    String? avatarUrl,
    String? actionUrl,
    Map<String, dynamic>? metadata,
  }) {
    return AppNotification(
      id: id ?? this.id,
      type: type ?? this.type,
      title: title ?? this.title,
      body: body ?? this.body,
      timestamp: timestamp ?? this.timestamp,
      isRead: isRead ?? this.isRead,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      actionUrl: actionUrl ?? this.actionUrl,
      metadata: metadata ?? this.metadata,
    );
  }

  /// Mark as read
  AppNotification markAsRead() => copyWith(isRead: true);

  /// Get relative time string
  String get relativeTime {
    try {
      final dateTime = DateTime.parse(timestamp);
      final now = DateTime.now();
      final difference = now.difference(dateTime);

      if (difference.inDays > 7) {
        return '${dateTime.day}/${dateTime.month}/${dateTime.year}';
      } else if (difference.inDays > 0) {
        return '${difference.inDays}d ago';
      } else if (difference.inHours > 0) {
        return '${difference.inHours}h ago';
      } else if (difference.inMinutes > 0) {
        return '${difference.inMinutes}m ago';
      } else {
        return 'Just now';
      }
    } catch (_) {
      return timestamp;
    }
  }

  @override
  List<Object?> get props => [
        id,
        type,
        title,
        body,
        timestamp,
        isRead,
        avatarUrl,
        actionUrl,
        metadata,
      ];
}

/// Proposal status enum
enum ProposalStatus {
  pending('pending'),
  accepted('accepted'),
  declined('declined'),
  withdrawn('withdrawn'),
  expired('expired');

  final String value;
  const ProposalStatus(this.value);

  factory ProposalStatus.fromString(String value) {
    return ProposalStatus.values.firstWhere(
      (e) => e.value.toLowerCase() == value.toLowerCase(),
      orElse: () => ProposalStatus.pending,
    );
  }
}

/// Proposal model for marriage proposals
class Proposal extends Equatable {
  final String id;
  final String fromUserId;
  final String toUserId;
  final String fromUserName;
  final String fromUserAvatar;
  final String fromUserSpecialty;
  final String? message;
  final ProposalStatus status;
  final String createdAt;
  final String? respondedAt;
  final String? declineReason;
  final bool? hasAttachments;

  const Proposal({
    required this.id,
    required this.fromUserId,
    required this.toUserId,
    required this.fromUserName,
    required this.fromUserAvatar,
    required this.fromUserSpecialty,
    this.message,
    required this.status,
    required this.createdAt,
    this.respondedAt,
    this.declineReason,
    this.hasAttachments,
  });

  factory Proposal.fromJson(Map<String, dynamic> json) {
    return Proposal(
      id: json['id'] as String? ?? '',
      fromUserId: json['fromUserId'] as String? ?? '',
      toUserId: json['toUserId'] as String? ?? '',
      fromUserName: json['fromUserName'] as String? ?? '',
      fromUserAvatar: json['fromUserAvatar'] as String? ?? '',
      fromUserSpecialty: json['fromUserSpecialty'] as String? ?? '',
      message: json['message'] as String?,
      status: ProposalStatus.fromString(json['status'] as String? ?? 'pending'),
      createdAt: json['createdAt'] as String? ?? '',
      respondedAt: json['respondedAt'] as String?,
      declineReason: json['declineReason'] as String?,
      hasAttachments: json['hasAttachments'] as bool?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'fromUserId': fromUserId,
      'toUserId': toUserId,
      'fromUserName': fromUserName,
      'fromUserAvatar': fromUserAvatar,
      'fromUserSpecialty': fromUserSpecialty,
      if (message != null) 'message': message,
      'status': status.value,
      'createdAt': createdAt,
      if (respondedAt != null) 'respondedAt': respondedAt,
      if (declineReason != null) 'declineReason': declineReason,
      if (hasAttachments != null) 'hasAttachments': hasAttachments,
    };
  }

  Proposal copyWith({
    String? id,
    String? fromUserId,
    String? toUserId,
    String? fromUserName,
    String? fromUserAvatar,
    String? fromUserSpecialty,
    String? message,
    ProposalStatus? status,
    String? createdAt,
    String? respondedAt,
    String? declineReason,
    bool? hasAttachments,
  }) {
    return Proposal(
      id: id ?? this.id,
      fromUserId: fromUserId ?? this.fromUserId,
      toUserId: toUserId ?? this.toUserId,
      fromUserName: fromUserName ?? this.fromUserName,
      fromUserAvatar: fromUserAvatar ?? this.fromUserAvatar,
      fromUserSpecialty: fromUserSpecialty ?? this.fromUserSpecialty,
      message: message ?? this.message,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
      respondedAt: respondedAt ?? this.respondedAt,
      declineReason: declineReason ?? this.declineReason,
      hasAttachments: hasAttachments ?? this.hasAttachments,
    );
  }

  bool get isPending => status == ProposalStatus.pending;
  bool get isAccepted => status == ProposalStatus.accepted;
  bool get isDeclined => status == ProposalStatus.declined;

  @override
  List<Object?> get props => [
        id,
        fromUserId,
        toUserId,
        fromUserName,
        fromUserAvatar,
        fromUserSpecialty,
        message,
        status,
        createdAt,
        respondedAt,
        declineReason,
        hasAttachments,
      ];
}

/// Subscription plan model
class SubscriptionPlan extends Equatable {
  final String id;
  final String name;
  final String description;
  final double monthlyPrice;
  final double quarterlyPrice;
  final double yearlyPrice;
  final List<String> features;
  final bool isPopular;
  final bool isPremium;
  final String? badge;

  const SubscriptionPlan({
    required this.id,
    required this.name,
    required this.description,
    required this.monthlyPrice,
    required this.quarterlyPrice,
    required this.yearlyPrice,
    required this.features,
    this.isPopular = false,
    this.isPremium = false,
    this.badge,
  });

  factory SubscriptionPlan.fromJson(Map<String, dynamic> json) {
    return SubscriptionPlan(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      description: json['description'] as String? ?? '',
      monthlyPrice: (json['monthlyPrice'] as num?)?.toDouble() ?? 0.0,
      quarterlyPrice: (json['quarterlyPrice'] as num?)?.toDouble() ?? 0.0,
      yearlyPrice: (json['yearlyPrice'] as num?)?.toDouble() ?? 0.0,
      features: (json['features'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      isPopular: json['isPopular'] as bool? ?? false,
      isPremium: json['isPremium'] as bool? ?? false,
      badge: json['badge'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'monthlyPrice': monthlyPrice,
      'quarterlyPrice': quarterlyPrice,
      'yearlyPrice': yearlyPrice,
      'features': features,
      'isPopular': isPopular,
      'isPremium': isPremium,
      if (badge != null) 'badge': badge,
    };
  }

  /// Get price for billing cycle
  double getPriceForCycle(BillingCycle cycle) {
    switch (cycle) {
      case BillingCycle.monthly:
        return monthlyPrice;
      case BillingCycle.quarterly:
        return quarterlyPrice;
      case BillingCycle.yearly:
        return yearlyPrice;
    }
  }

  /// Get savings percentage for yearly plan
  int get yearlySavingsPercent {
    if (monthlyPrice == 0) return 0;
    final yearlyEquivalent = monthlyPrice * 12;
    final savings = ((yearlyEquivalent - yearlyPrice) / yearlyEquivalent * 100);
    return savings.round();
  }

  @override
  List<Object?> get props => [
        id,
        name,
        description,
        monthlyPrice,
        quarterlyPrice,
        yearlyPrice,
        features,
        isPopular,
        isPremium,
        badge,
      ];
}

/// Billing cycle enum
enum BillingCycle {
  monthly('monthly'),
  quarterly('quarterly'),
  yearly('yearly');

  final String value;
  const BillingCycle(this.value);

  factory BillingCycle.fromString(String value) {
    return BillingCycle.values.firstWhere(
      (e) => e.value.toLowerCase() == value.toLowerCase(),
      orElse: () => BillingCycle.monthly,
    );
  }

  String get displayName {
    switch (this) {
      case BillingCycle.monthly:
        return 'Monthly';
      case BillingCycle.quarterly:
        return 'Quarterly';
      case BillingCycle.yearly:
        return 'Yearly';
    }
  }
}

/// Activity item for the sidebar
/// Transpiled from TypeScript: activity feed items
class ActivityItem extends Equatable {
  final String id;
  final String type;
  final String title;
  final String subtitle;
  final String timestamp;
  final String? avatarUrl;
  final String? actionUrl;

  const ActivityItem({
    required this.id,
    required this.type,
    required this.title,
    required this.subtitle,
    required this.timestamp,
    this.avatarUrl,
    this.actionUrl,
  });

  factory ActivityItem.fromJson(Map<String, dynamic> json) {
    return ActivityItem(
      id: json['id'] as String? ?? '',
      type: json['type'] as String? ?? '',
      title: json['title'] as String? ?? '',
      subtitle: json['subtitle'] as String? ?? '',
      timestamp: json['timestamp'] as String? ?? '',
      avatarUrl: json['avatarUrl'] as String?,
      actionUrl: json['actionUrl'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': type,
      'title': title,
      'subtitle': subtitle,
      'timestamp': timestamp,
      if (avatarUrl != null) 'avatarUrl': avatarUrl,
      if (actionUrl != null) 'actionUrl': actionUrl,
    };
  }

  @override
  List<Object?> get props => [
        id,
        type,
        title,
        subtitle,
        timestamp,
        avatarUrl,
        actionUrl,
      ];
}

/// Compatibility metric for the sidebar
/// Transpiled from TypeScript: compatibility metrics
class CompatibilityMetric extends Equatable {
  final String label;
  final int percentage;
  final String colorType; // 'primary' | 'yellow'

  const CompatibilityMetric({
    required this.label,
    required this.percentage,
    required this.colorType,
  });

  factory CompatibilityMetric.fromJson(Map<String, dynamic> json) {
    return CompatibilityMetric(
      label: json['label'] as String? ?? '',
      percentage: json['percentage'] as int? ?? 0,
      colorType: json['colorType'] as String? ?? 'primary',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'label': label,
      'percentage': percentage,
      'colorType': colorType,
    };
  }

  @override
  List<Object?> get props => [label, percentage, colorType];
}
