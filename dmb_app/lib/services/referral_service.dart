import 'api_service.dart';

/// Referral system service — manages referral codes, stats, and settings.
class ReferralService {
  final ApiService _api;

  ReferralService(this._api);

  /// Get my referral stats — GET /referral/my-stats
  /// Returns {code, total_referrals, earnings, referred_users}
  Future<Map<String, dynamic>> getMyStats() async {
    final response = await _api.get('/referral/my-stats');
    return response.data is Map<String, dynamic> ? response.data : {};
  }

  /// Validate a referral code — POST /referral/validate-code
  Future<Map<String, dynamic>> validateCode(String code) async {
    final response = await _api.post('/referral/validate-code', data: {
      'code': code,
    });
    return response.data is Map<String, dynamic> ? response.data : {};
  }

  /// Regenerate the user's referral code — POST /referral/regenerate-code
  Future<Map<String, dynamic>> regenerateCode() async {
    final response = await _api.post('/referral/regenerate-code');
    return response.data is Map<String, dynamic> ? response.data : {};
  }

  /// Get public referral settings — GET /referral/settings-public
  Future<Map<String, dynamic>> getPublicSettings() async {
    final response = await _api.get('/referral/settings-public');
    return response.data is Map<String, dynamic> ? response.data : {};
  }
}
