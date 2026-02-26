import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/models.dart';
import '../repositories/repositories.dart';
import 'repository_providers.dart';

/// Subscription state
class SubscriptionState {
  final List<SubscriptionPlan> plans;
  final SubscriptionPlan? currentPlan;
  final BillingCycle selectedCycle;
  final bool isLoading;
  final String? error;
  final Map<String, dynamic>? appliedPromo;

  const SubscriptionState({
    this.plans = const [],
    this.currentPlan,
    this.selectedCycle = BillingCycle.yearly,
    this.isLoading = false,
    this.error,
    this.appliedPromo,
  });

  SubscriptionState copyWith({
    List<SubscriptionPlan>? plans,
    SubscriptionPlan? currentPlan,
    BillingCycle? selectedCycle,
    bool? isLoading,
    String? error,
    Map<String, dynamic>? appliedPromo,
  }) {
    return SubscriptionState(
      plans: plans ?? this.plans,
      currentPlan: currentPlan ?? this.currentPlan,
      selectedCycle: selectedCycle ?? this.selectedCycle,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      appliedPromo: appliedPromo ?? this.appliedPromo,
    );
  }

  /// Check if user has premium subscription
  bool get isPremium =>
      currentPlan != null &&
      (currentPlan!.isPremium || currentPlan!.id == 'premium');

  /// Check if user has elite subscription
  bool get isElite => currentPlan != null && currentPlan!.id == 'elite';

  /// Get price for selected cycle
  double getPriceForPlan(String planId) {
    final plan = plans.firstWhere(
      (p) => p.id == planId,
      orElse: () => SubscriptionPlan(
        id: '',
        name: '',
        description: '',
        monthlyPrice: 0,
        quarterlyPrice: 0,
        yearlyPrice: 0,
        features: [],
      ),
    );
    return plan.getPriceForCycle(selectedCycle);
  }
}

/// Subscription notifier - manages subscription state
/// Transpiled from React: SubscriptionModal.tsx and PaymentModal.tsx
class SubscriptionNotifier extends StateNotifier<SubscriptionState> {
  final SubscriptionRepository _subscriptionRepository;

  SubscriptionNotifier(this._subscriptionRepository)
      : super(const SubscriptionState()) {
    loadData();
  }

  /// Load plans and current subscription
  Future<void> loadData() async {
    state = state.copyWith(isLoading: true);

    final plansResult = await _subscriptionRepository.getPlans();
    final currentResult =
        await _subscriptionRepository.getCurrentSubscription();

    plansResult.fold(
      onSuccess: (plans) {
        currentResult.fold(
          onSuccess: (current) {
            state = state.copyWith(
              plans: plans,
              currentPlan: current,
              isLoading: false,
            );
          },
          onFailure: (error) {
            state = state.copyWith(
              plans: plans,
              isLoading: false,
              error: error,
            );
          },
        );
      },
      onFailure: (error) {
        state = state.copyWith(
          isLoading: false,
          error: error,
        );
      },
    );
  }

  /// Select billing cycle
  void selectBillingCycle(BillingCycle cycle) {
    state = state.copyWith(selectedCycle: cycle);
  }

  /// Subscribe to a plan
  Future<bool> subscribe({
    required String planId,
    required String paymentMethodId,
  }) async {
    state = state.copyWith(isLoading: true);

    final result = await _subscriptionRepository.subscribe(
      planId: planId,
      cycle: state.selectedCycle,
      paymentMethodId: paymentMethodId,
    );

    return result.fold(
      onSuccess: (_) {
        // Reload to get updated subscription
        loadData();
        return true;
      },
      onFailure: (error) {
        state = state.copyWith(
          isLoading: false,
          error: error,
        );
        return false;
      },
    );
  }

  /// Cancel subscription
  Future<bool> cancelSubscription() async {
    state = state.copyWith(isLoading: true);

    final result = await _subscriptionRepository.cancelSubscription();

    return result.fold(
      onSuccess: (_) {
        state = state.copyWith(
          currentPlan: null,
          isLoading: false,
        );
        return true;
      },
      onFailure: (error) {
        state = state.copyWith(
          isLoading: false,
          error: error,
        );
        return false;
      },
    );
  }

  /// Change subscription plan
  Future<bool> changePlan(String newPlanId) async {
    state = state.copyWith(isLoading: true);

    final result =
        await _subscriptionRepository.changePlan(newPlanId: newPlanId);

    return result.fold(
      onSuccess: (_) {
        loadData();
        return true;
      },
      onFailure: (error) {
        state = state.copyWith(
          isLoading: false,
          error: error,
        );
        return false;
      },
    );
  }

  /// Apply promo code
  Future<bool> applyPromoCode(String code) async {
    final result = await _subscriptionRepository.applyPromoCode(code);

    return result.fold(
      onSuccess: (promo) {
        state = state.copyWith(appliedPromo: promo);
        return true;
      },
      onFailure: (error) {
        state = state.copyWith(error: error);
        return false;
      },
    );
  }

  /// Clear promo code
  void clearPromoCode() {
    state = SubscriptionState(
      plans: state.plans,
      currentPlan: state.currentPlan,
      selectedCycle: state.selectedCycle,
      isLoading: state.isLoading,
      appliedPromo: null,
    );
  }

  /// Clear error
  void clearError() {
    state = state.copyWith(error: null);
  }

  /// Refresh
  Future<void> refresh() async {
    await loadData();
  }
}

/// Subscription provider
final subscriptionProvider =
    StateNotifierProvider<SubscriptionNotifier, SubscriptionState>((ref) {
  final subscriptionRepository = ref.watch(subscriptionRepositoryProvider);
  return SubscriptionNotifier(subscriptionRepository);
});

/// Is premium provider
final isPremiumProvider = Provider<bool>((ref) {
  return ref.watch(subscriptionProvider).isPremium;
});

/// Payment methods state
class PaymentMethodsState {
  final List<Map<String, dynamic>> methods;
  final bool isLoading;
  final String? error;

  const PaymentMethodsState({
    this.methods = const [],
    this.isLoading = false,
    this.error,
  });

  PaymentMethodsState copyWith({
    List<Map<String, dynamic>>? methods,
    bool? isLoading,
    String? error,
  }) {
    return PaymentMethodsState(
      methods: methods ?? this.methods,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }

  /// Get default payment method
  Map<String, dynamic>? get defaultMethod {
    try {
      return methods.firstWhere((m) => m['isDefault'] == true);
    } catch (_) {
      return methods.isNotEmpty ? methods.first : null;
    }
  }
}

/// Payment methods notifier
class PaymentMethodsNotifier extends StateNotifier<PaymentMethodsState> {
  final SubscriptionRepository _subscriptionRepository;

  PaymentMethodsNotifier(this._subscriptionRepository)
      : super(const PaymentMethodsState()) {
    loadPaymentMethods();
  }

  /// Load payment methods
  Future<void> loadPaymentMethods() async {
    state = state.copyWith(isLoading: true);

    final result = await _subscriptionRepository.getPaymentMethods();

    result.fold(
      onSuccess: (methods) {
        state = state.copyWith(
          methods: methods,
          isLoading: false,
        );
      },
      onFailure: (error) {
        state = state.copyWith(
          isLoading: false,
          error: error,
        );
      },
    );
  }

  /// Add payment method
  Future<bool> addPaymentMethod(Map<String, dynamic> paymentDetails) async {
    state = state.copyWith(isLoading: true);

    final result = await _subscriptionRepository.addPaymentMethod(
      paymentDetails: paymentDetails,
    );

    return result.fold(
      onSuccess: (_) {
        loadPaymentMethods();
        return true;
      },
      onFailure: (error) {
        state = state.copyWith(
          isLoading: false,
          error: error,
        );
        return false;
      },
    );
  }

  /// Remove payment method
  Future<bool> removePaymentMethod(String paymentMethodId) async {
    final result =
        await _subscriptionRepository.removePaymentMethod(paymentMethodId);

    return result.fold(
      onSuccess: (_) {
        final updatedMethods =
            state.methods.where((m) => m['id'] != paymentMethodId).toList();
        state = state.copyWith(methods: updatedMethods);
        return true;
      },
      onFailure: (error) {
        state = state.copyWith(error: error);
        return false;
      },
    );
  }
}

/// Payment methods provider
final paymentMethodsProvider =
    StateNotifierProvider<PaymentMethodsNotifier, PaymentMethodsState>((ref) {
  final subscriptionRepository = ref.watch(subscriptionRepositoryProvider);
  return PaymentMethodsNotifier(subscriptionRepository);
});

/// Payment history provider
final paymentHistoryProvider =
    FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final subscriptionRepository = ref.watch(subscriptionRepositoryProvider);
  final result = await subscriptionRepository.getPaymentHistory();

  return result.fold(
    onSuccess: (history) => history,
    onFailure: (_) => [],
  );
});
