/// Generic option for dropdowns (countries, religions, castes, etc.)
class DropdownOption {
  final int id;
  final String name;

  const DropdownOption({required this.id, required this.name});

  factory DropdownOption.fromJson(Map<String, dynamic> json) {
    return DropdownOption(
      id: json['id'] as int? ?? 0,
      name: json['name']?.toString() ?? '',
    );
  }
}

/// All dropdown data loaded from /member/profile-dropdown
class ProfileDropdownData {
  final List<DropdownOption> maritalStatuses;
  final List<DropdownOption> countries;
  final List<DropdownOption> religions;
  final List<DropdownOption> languages;
  final List<DropdownOption> familyValues;
  final List<DropdownOption> onBehalfs;

  const ProfileDropdownData({
    this.maritalStatuses = const [],
    this.countries = const [],
    this.religions = const [],
    this.languages = const [],
    this.familyValues = const [],
    this.onBehalfs = const [],
  });

  factory ProfileDropdownData.fromApi(Map<String, dynamic> json) {
    return ProfileDropdownData(
      maritalStatuses: _parseList(json['marital_statuses']),
      countries: _parseList(json['countries']),
      religions: _parseList(json['religions']),
      languages: _parseList(json['languages']),
      familyValues: _parseList(json['family_values']),
      onBehalfs: _parseList(json['on_behalfs']),
    );
  }

  static List<DropdownOption> _parseList(dynamic list) {
    if (list == null) return [];
    return (list as List).map((e) => DropdownOption.fromJson(e)).toList();
  }
}
