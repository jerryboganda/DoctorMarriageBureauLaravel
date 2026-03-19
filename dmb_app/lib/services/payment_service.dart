import 'api_service.dart';

/// Payment gateway service — handles Stripe, Razorpay, PhonePe, and wallet.
class PaymentService {
  final ApiService _api;

  PaymentService(this._api);

  /// Get available payment types — GET /payment-types
  Future<List<Map<String, dynamic>>> getPaymentTypes() async {
    final response = await _api.get('/payment-types');
    final data = response.data;
    final list = data['data'] ?? data;
    if (list is List) {
      return list.cast<Map<String, dynamic>>();
    }
    return [];
  }

  /// Create a Stripe checkout session — POST /stripe/create-checkout-session
  Future<Map<String, dynamic>> createStripeSession(
    int packageId, {
    String? addonId,
  }) async {
    final response = await _api.post('/stripe/create-checkout-session', data: {
      'package_id': packageId,
      if (addonId != null) 'addon_id': addonId,
    });
    return response.data is Map<String, dynamic> ? response.data : {};
  }

  /// Pay with Razorpay — POST /pay-with-razorpay
  Future<Map<String, dynamic>> payWithRazorpay(
    int packageId,
    String paymentId,
  ) async {
    final response = await _api.post('/pay-with-razorpay', data: {
      'package_id': packageId,
      'payment_id': paymentId,
    });
    return response.data is Map<String, dynamic> ? response.data : {};
  }

  /// Pay with PhonePe — POST /pay-with-phonepe
  Future<Map<String, dynamic>> payWithPhonePe(int packageId) async {
    final response = await _api.post('/pay-with-phonepe', data: {
      'package_id': packageId,
    });
    return response.data is Map<String, dynamic> ? response.data : {};
  }

  /// Get PhonePe credentials — GET /phonepe-credentials
  Future<Map<String, dynamic>> getPhonePeCredentials() async {
    final response = await _api.get('/phonepe-credentials');
    return response.data is Map<String, dynamic> ? response.data : {};
  }

  /// Get wallet balance and recent transactions — GET /member/wallet
  Future<Map<String, dynamic>> getWalletBalance() async {
    final response = await _api.get('/member/wallet');
    return response.data is Map<String, dynamic> ? response.data : {};
  }

  /// Recharge wallet — POST /member/wallet/recharge
  Future<Map<String, dynamic>> rechargeWallet(
    double amount,
    String method,
  ) async {
    final response = await _api.post('/member/wallet/recharge', data: {
      'amount': amount,
      'method': method,
    });
    return response.data is Map<String, dynamic> ? response.data : {};
  }

  /// Get wallet transaction history — GET /member/wallet/transactions
  Future<List<Map<String, dynamic>>> getTransactions() async {
    final response = await _api.get('/member/wallet/transactions');
    final data = response.data;
    final list = data['data'] ?? data;
    if (list is List) {
      return list.cast<Map<String, dynamic>>();
    }
    return [];
  }
}
