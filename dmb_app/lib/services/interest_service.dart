import 'api_service.dart';
import '../models/interest.dart';

class InterestService {
  final ApiService _api;

  InterestService(this._api);

  /// Send proposal — POST /member/express-interest
  Future<Map<String, dynamic>> expressInterest(int userId) async {
    final response = await _api.post('/member/express-interest', data: {
      'user_id': userId,
    });
    return response.data is Map<String, dynamic> ? response.data : {};
  }

  /// Get received proposals — GET /member/interest-requests
  Future<InterestListResult> getReceivedInterests({int page = 1}) async {
    final response = await _api.get('/member/interest-requests', queryParameters: {
      'page': page,
    });
    return _parseInterestList(response.data);
  }

  /// Get sent proposals — GET /member/my-interests
  Future<InterestListResult> getSentInterests({int page = 1}) async {
    final response = await _api.get('/member/my-interests', queryParameters: {
      'page': page,
    });
    return _parseInterestList(response.data);
  }

  /// Accept proposal — POST /member/interest-accept
  Future<Map<String, dynamic>> acceptInterest(int interestId) async {
    final response = await _api.post('/member/interest-accept', data: {
      'interest_id': interestId,
    });
    return response.data is Map<String, dynamic> ? response.data : {};
  }

  /// Reject proposal — POST /member/interest-reject
  Future<Map<String, dynamic>> rejectInterest(int interestId) async {
    final response = await _api.post('/member/interest-reject', data: {
      'interest_id': interestId,
    });
    return response.data is Map<String, dynamic> ? response.data : {};
  }

  /// Withdraw sent proposal — POST /member/interest-withdraw
  Future<Map<String, dynamic>> withdrawInterest(int interestId) async {
    final response = await _api.post('/member/interest-withdraw', data: {
      'interest_id': interestId,
    });
    return response.data is Map<String, dynamic> ? response.data : {};
  }

  InterestListResult _parseInterestList(dynamic data) {
    final items = <Interest>[];
    final list = data['data'] ?? data;
    if (list is List) {
      for (final item in list) {
        items.add(Interest.fromApi(item));
      }
    }
    final pagination = data['meta'] ?? data;
    return InterestListResult(
      interests: items,
      currentPage: pagination['current_page'] ?? 1,
      lastPage: pagination['last_page'] ?? 1,
    );
  }
}

class InterestListResult {
  final List<Interest> interests;
  final int currentPage;
  final int lastPage;

  const InterestListResult({
    this.interests = const [],
    this.currentPage = 1,
    this.lastPage = 1,
  });

  bool get hasMore => currentPage < lastPage;
}
