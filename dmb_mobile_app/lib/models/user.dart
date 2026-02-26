import 'package:equatable/equatable.dart';

/// User model representing the logged-in user
/// Transpiled from TypeScript: interface User
class User extends Equatable {
  /// Unique user identifier
  final String id;

  /// User's display name
  final String name;

  /// User's email address
  final String email;

  /// User's phone number
  final String? phone;

  /// User's medical specialty (e.g., "Cardiologist", "Neurologist")
  final String? specialty;

  /// URL to user's avatar image
  final String? avatarUrl;

  /// Whether the user's profile is verified
  final bool isVerified;

  /// Whether the user has premium subscription
  final bool isPremium;

  /// User's current location
  final String? location;

  /// User's age
  final int? age;

  /// Account creation timestamp
  final String? createdAt;

  const User({
    required this.id,
    required this.name,
    required this.email,
    this.phone,
    this.specialty,
    this.avatarUrl,
    this.isVerified = false,
    this.isPremium = false,
    this.location,
    this.age,
    this.createdAt,
  });

  /// Creates an empty User
  factory User.empty() {
    return const User(
      id: '',
      name: '',
      email: '',
    );
  }

  /// Creates a User from JSON map
  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      email: json['email'] as String? ?? '',
      phone: json['phone'] as String?,
      specialty: json['specialty'] as String?,
      avatarUrl: json['avatarUrl'] as String? ?? json['avatar_url'] as String?,
      isVerified:
          json['isVerified'] as bool? ?? json['is_verified'] as bool? ?? false,
      isPremium:
          json['isPremium'] as bool? ?? json['is_premium'] as bool? ?? false,
      location: json['location'] as String?,
      age: json['age'] as int?,
      createdAt: json['createdAt'] as String? ?? json['created_at'] as String?,
    );
  }

  /// Converts User to JSON map
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      if (phone != null) 'phone': phone,
      if (specialty != null) 'specialty': specialty,
      if (avatarUrl != null) 'avatarUrl': avatarUrl,
      'isVerified': isVerified,
      'isPremium': isPremium,
      if (location != null) 'location': location,
      if (age != null) 'age': age,
      if (createdAt != null) 'createdAt': createdAt,
    };
  }

  /// Creates a copy of User with updated fields
  User copyWith({
    String? id,
    String? name,
    String? email,
    String? phone,
    String? specialty,
    String? avatarUrl,
    bool? isVerified,
    bool? isPremium,
    String? location,
    int? age,
    String? createdAt,
  }) {
    return User(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      specialty: specialty ?? this.specialty,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      isVerified: isVerified ?? this.isVerified,
      isPremium: isPremium ?? this.isPremium,
      location: location ?? this.location,
      age: age ?? this.age,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  @override
  List<Object?> get props => [
        id,
        name,
        email,
        phone,
        specialty,
        avatarUrl,
        isVerified,
        isPremium,
        location,
        age,
        createdAt,
      ];
}
