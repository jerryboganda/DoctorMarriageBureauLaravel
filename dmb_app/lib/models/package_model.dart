class SubscriptionPackage {
  final int id;
  final String name;
  final String? description;
  final double price;
  final int duration; // days
  final int? interestLimit;
  final int? contactViewLimit;
  final int? galleryLimit;
  final bool isPremiumMessaging;
  final List<String> features;
  final String? badge;

  const SubscriptionPackage({
    required this.id,
    required this.name,
    this.description,
    required this.price,
    required this.duration,
    this.interestLimit,
    this.contactViewLimit,
    this.galleryLimit,
    this.isPremiumMessaging = false,
    this.features = const [],
    this.badge,
  });

  factory SubscriptionPackage.fromApi(Map<String, dynamic> json) {
    return SubscriptionPackage(
      id: json['id'] as int,
      name: json['name'] ?? '',
      description: json['description'],
      price: (json['price'] ?? 0).toDouble(),
      duration: json['duration'] ?? 30,
      interestLimit: json['interest_limit'] as int?,
      contactViewLimit: json['contact_view_limit'] as int?,
      galleryLimit: json['gallery_limit'] as int?,
      isPremiumMessaging: json['is_premium_messaging'] == 1,
      features: List<String>.from(json['features'] ?? []),
      badge: json['badge'],
    );
  }
}
