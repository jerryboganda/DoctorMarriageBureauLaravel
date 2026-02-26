import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/models.dart';
import '../repositories/repositories.dart';
import 'repository_providers.dart';

/// Proposals state
class ProposalsState {
  final List<Proposal> receivedProposals;
  final List<Proposal> sentProposals;
  final bool isLoading;
  final String? error;

  const ProposalsState({
    this.receivedProposals = const [],
    this.sentProposals = const [],
    this.isLoading = false,
    this.error,
  });

  ProposalsState copyWith({
    List<Proposal>? receivedProposals,
    List<Proposal>? sentProposals,
    bool? isLoading,
    String? error,
  }) {
    return ProposalsState(
      receivedProposals: receivedProposals ?? this.receivedProposals,
      sentProposals: sentProposals ?? this.sentProposals,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }

  /// Get pending received proposals
  List<Proposal> get pendingReceivedProposals =>
      receivedProposals.where((p) => p.isPending).toList();

  /// Get pending sent proposals
  List<Proposal> get pendingSentProposals =>
      sentProposals.where((p) => p.isPending).toList();

  /// Count of pending received proposals
  int get pendingCount => pendingReceivedProposals.length;
}

/// Proposals notifier - manages proposal state
/// Transpiled from React: ProposalModal.tsx and FamilyPortalView.tsx
class ProposalsNotifier extends StateNotifier<ProposalsState> {
  final ProposalRepository _proposalRepository;

  ProposalsNotifier(this._proposalRepository) : super(const ProposalsState()) {
    loadProposals();
  }

  /// Load all proposals
  Future<void> loadProposals() async {
    state = state.copyWith(isLoading: true);

    final receivedResult = await _proposalRepository.getReceivedProposals();
    final sentResult = await _proposalRepository.getSentProposals();

    receivedResult.fold(
      onSuccess: (received) {
        sentResult.fold(
          onSuccess: (sent) {
            state = state.copyWith(
              receivedProposals: received,
              sentProposals: sent,
              isLoading: false,
            );
          },
          onFailure: (error) {
            state = state.copyWith(
              receivedProposals: received,
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

  /// Send a proposal
  Future<bool> sendProposal({
    required String toUserId,
    String? message,
  }) async {
    final result = await _proposalRepository.sendProposal(
      toUserId: toUserId,
      message: message,
    );

    return result.fold(
      onSuccess: (proposal) {
        state = state.copyWith(
          sentProposals: [...state.sentProposals, proposal],
        );
        return true;
      },
      onFailure: (error) {
        state = state.copyWith(error: error);
        return false;
      },
    );
  }

  /// Accept a proposal
  Future<bool> acceptProposal(String proposalId) async {
    final result = await _proposalRepository.acceptProposal(proposalId);

    return result.fold(
      onSuccess: (updatedProposal) {
        final updatedList = state.receivedProposals.map((p) {
          if (p.id == proposalId) return updatedProposal;
          return p;
        }).toList();

        state = state.copyWith(receivedProposals: updatedList);
        return true;
      },
      onFailure: (error) {
        state = state.copyWith(error: error);
        return false;
      },
    );
  }

  /// Decline a proposal
  Future<bool> declineProposal({
    required String proposalId,
    String? reason,
  }) async {
    final result = await _proposalRepository.declineProposal(
      proposalId: proposalId,
      reason: reason,
    );

    return result.fold(
      onSuccess: (updatedProposal) {
        final updatedList = state.receivedProposals.map((p) {
          if (p.id == proposalId) return updatedProposal;
          return p;
        }).toList();

        state = state.copyWith(receivedProposals: updatedList);
        return true;
      },
      onFailure: (error) {
        state = state.copyWith(error: error);
        return false;
      },
    );
  }

  /// Withdraw a proposal
  Future<bool> withdrawProposal(String proposalId) async {
    final result = await _proposalRepository.withdrawProposal(proposalId);

    return result.fold(
      onSuccess: (_) {
        final updatedList = state.sentProposals.map((p) {
          if (p.id == proposalId) {
            return p.copyWith(status: ProposalStatus.withdrawn);
          }
          return p;
        }).toList();

        state = state.copyWith(sentProposals: updatedList);
        return true;
      },
      onFailure: (error) {
        state = state.copyWith(error: error);
        return false;
      },
    );
  }

  /// Refresh proposals
  Future<void> refresh() async {
    await loadProposals();
  }

  /// Clear error
  void clearError() {
    state = state.copyWith(error: null);
  }
}

/// Proposals provider
final proposalsProvider =
    StateNotifierProvider<ProposalsNotifier, ProposalsState>((ref) {
  final proposalRepository = ref.watch(proposalRepositoryProvider);
  return ProposalsNotifier(proposalRepository);
});

/// Pending proposals count provider
final pendingProposalsCountProvider = Provider<int>((ref) {
  return ref.watch(proposalsProvider).pendingCount;
});
