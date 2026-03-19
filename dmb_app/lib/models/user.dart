/// Maps AuthState User interface from authStore.ts
class User {
  final int id;
  final String? type;
  final String? name;
  final int? membership; // 1=free, 2=premium
  final String? email;
  final String? emailVerifiedAt;
  final bool photoApproved;
  final bool blocked;
  final bool deactivated;
  final bool approved;
  final String? avatar;
  final String? avatarOriginal;
  final String? phone;
  final String? birthday;
  final bool mustChangePassword;
  final bool isVisible;
  final bool travelMode;
  final String? travelCity;
  final String? travelCountry;

  const User({
    required this.id,
    this.type,
    this.name,
    this.membership,
    this.email,
    this.emailVerifiedAt,
    this.photoApproved = false,
    this.blocked = false,
    this.deactivated = false,
    this.approved = false,
    this.avatar,
    this.avatarOriginal,
    this.phone,
    this.birthday,
    this.mustChangePassword = false,
    this.isVisible = true,
    this.travelMode = false,
    this.travelCity,
    this.travelCountry,
  });

  bool get isPremium => membership == 2;
  bool get isEmailVerified => emailVerifiedAt != null;

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as int,
      type: json['type'] as String?,
      name: json['name'] as String?,
      membership: _toInt(json['membership']),
      email: json['email'] as String?,
      emailVerifiedAt: json['email_verified_at'] as String?,
      photoApproved: _toBool(json['photo_approved']),
      blocked: _toBool(json['blocked']),
      deactivated: _toBool(json['deactivated']),
      approved: _toBool(json['approved']),
      avatar: json['avatar'] as String?,
      avatarOriginal: json['avatar_original'] as String?,
      phone: json['phone'] as String?,
      birthday: json['birthday']?.toString(),
      mustChangePassword: _toBool(json['must_change_password']),
      isVisible: json['is_visible'] != false,
      travelMode: _toBool(json['travel_mode']),
      travelCity: json['travel_city'] as String?,
      travelCountry: json['travel_country'] as String?,
    );
  }

  User copyWith({
    String? avatar,
    String? avatarOriginal,
    bool? photoApproved,
    bool? isVisible,
    bool? travelMode,
    String? travelCity,
    String? travelCountry,
    String? name,
    String? email,
    String? phone,
  }) {
    return User(
      id: id,
      type: type,
      name: name ?? this.name,
      membership: membership,
      email: email ?? this.email,
      emailVerifiedAt: emailVerifiedAt,
      photoApproved: photoApproved ?? this.photoApproved,
      blocked: blocked,
      deactivated: deactivated,
      approved: approved,
      avatar: avatar ?? this.avatar,
      avatarOriginal: avatarOriginal ?? this.avatarOriginal,
      phone: phone ?? this.phone,
      birthday: birthday,
      mustChangePassword: mustChangePassword,
      isVisible: isVisible ?? this.isVisible,
      travelMode: travelMode ?? this.travelMode,
      travelCity: travelCity ?? this.travelCity,
      travelCountry: travelCountry ?? this.travelCountry,
    );
  }

  static bool _toBool(dynamic value) {
    if (value == null) return false;
    if (value is bool) return value;
    if (value is int) return value == 1;
    if (value is String) return value == '1' || value == 'true';
    return false;
  }

  static int? _toInt(dynamic value) {
    if (value == null) return null;
    if (value is int) return value;
    if (value is String) return int.tryParse(value);
    return null;
  }
}
