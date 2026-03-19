import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/interest.dart';
import '../services/interest_service.dart';
import '../config/constants.dart';
import 'auth_provider.dart';

class InterestState {
  final List<Interest> receivedInterests;
  final List<Interest> sentInterests;
  final Map<int, ProposalStateEntry> proposalStatusMap; // optimistic
  final bool isLoadingReceived;
  final bool isLoadingSent;

  const InterestState({
    this.receivedInterests = const [],
    this.sentInterests = const [],
    this.proposalStatusMap = const {},
    this.isLoadingReceived = false,
    this.isLoadingSent = false,
  });

  InterestState copyWith({
    List<Interest>? receivedInterests,
    List<Interest>? sentInterests,
    Map<int, ProposalStateEntry>? proposalStatusMap,
    bool? isLoadingReceived,
    bool? isLoadingSent,
  }) {
    return InterestState(
      receivedInterests: receivedInterests ?? this.receivedInterests,
      sentInterests: sentInterests ?? this.sentInterests,
      proposalStatusMap: proposalStatusMap ?? this.proposalStatusMap,
      isLoadingReceived: isLoadingReceived ?? this.isLoadingReceived,
      isLoadingSent: isLoadingSent ?? this.isLoadingSent,
    );
  }
}

class InterestNotifier extends StateNotifier<InterestState> {
  final InterestService _service;

  InterestNotifier(this._service) : super(const InterestState());

  /// Set optimistic proposal state with TTL
  void upsertProposalState(int targetUserId, String proposalState) {
    final newMap = Map<int, ProposalStateEntry>.from(state.proposalStatusMap);
    newMap[targetUserId] = ProposalStateEntry(
      state: proposalState,
      expiresAt: DateTime.now().add(AppConstants.proposalOptimisticTtl),
    );
    state = state.copyWith(proposalStatusMap: newMap);
  }

  /// Get non-expired optimistic state for a user
  String? getOptimisticState(int targetUserId) {
    final entry = state.proposalStatusMap[targetUserId];
    if (entry == null || entry.isExpired) return null;
    return entry.state;
  }

  /// Load received interests
  Future<void> loadReceived({int page = 1}) async {
    state = state.copyWith(isLoadingReceived: true);
    try {
      final result = await _service.getReceivedInterests(page: page);
      state = state.copyWith(
        receivedInterests: result.interests,
        isLoadingReceived: false,
      );
    } catch (_) {
      state = state.copyWith(isLoadingReceived: false);
    }
  }

  /// Load sent interests
  Future<void> loadSent({int page = 1}) async {
    state = state.copyWith(isLoadingSent: true);
    try {
      final result = await _service.getSentInterests(page: page);
      state = state.copyWith(
        sentInterests: result.interests,
        isLoadingSent: false,
      );
    } catch (_) {
      state = state.copyWith(isLoadingSent: false);
    }
  }

  /// Send proposal with optimistic update
  Future<bool> sendProposal(int targetUserId) async {
    upsertProposalState(targetUserId, 'sent_pending');
    try {
      await _service.expressInterest(targetUserId);
      return true;
    } catch (_) {
      upsertProposalState(targetUserId, 'none');
      return false;
    }
  }

  /// Accept proposal
  Future<bool> acceptProposal(int interestId, int senderId) async {
    upsertProposalState(senderId, 'received_accepted');
    try {
      await _service.acceptInterest(interestId);
      return true;
    } catch (_) {
      upsertProposalState(senderId, 'received_pending');
      return false;
    }
  }

  /// Reject proposal
  Future<bool> rejectProposal(int interestId, int senderId) async {
    try {
      await _service.rejectInterest(interestId);
      // Remove from received list
      final updated = state.receivedInterests
          .where((i) => i.id != interestId)
          .toList();
      state = state.copyWith(receivedInterests: updated);
      return true;
    } catch (_) {
      return false;
    }
  }

  /// Withdraw sent proposal
  Future<bool> withdrawProposal(int interestId, int recipientId) async {
    upsertProposalState(recipientId, 'none');
    try {
      await _service.withdrawInterest(interestId);
      final updated = state.sentInterests
          .where((i) => i.id != interestId)
          .toList();
      state = state.copyWith(sentInterests: updated);
      return true;
    } catch (_) {
      upsertProposalState(recipientId, 'sent_pending');
      return false;
    }
  }
}

final interestServiceProvider = Provider<InterestService>((ref) {
  return InterestService(ref.read(apiServiceProvider));
});

final interestProvider = StateNotifierProvider<InterestNotifier, InterestState>((ref) {
  return InterestNotifier(ref.read(interestServiceProvider));
});
