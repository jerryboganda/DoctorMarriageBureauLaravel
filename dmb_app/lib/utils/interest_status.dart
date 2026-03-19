/// Port of interestStatus.ts — canonical interest state resolver
/// This is business-critical logic with 15+ conditional branches

enum CanonicalInterestState {
  none,
  sentPending,
  sentAccepted,
  sentRejected,
  receivedPending,
  receivedAccepted,
  receivedRejected,
  mutualMatch,
}

class InterestStatusResult {
  final CanonicalInterestState state;
  final int? interestId;
  final String label;
  final bool canSendProposal;
  final bool canAccept;
  final bool canDecline;
  final bool canWithdraw;
  final bool canChat;

  const InterestStatusResult({
    required this.state,
    this.interestId,
    required this.label,
    this.canSendProposal = false,
    this.canAccept = false,
    this.canDecline = false,
    this.canWithdraw = false,
    this.canChat = false,
  });
}

/// Resolve the canonical interest state between current user and a target profile.
///
/// [interestStatus] - raw status from API (can be int, string, or null)
/// [interestText] - text label from API
/// [sentProposalMap] - optimistic sent proposals map {targetUserId: state}
/// [myUserId] - current user's ID
/// [targetUserId] - the profile being viewed
/// [incomingInterests] - list of incoming interest records
/// [sentInterests] - list of sent interest records
InterestStatusResult resolveInterestStatus({
  dynamic interestStatus,
  String? interestText,
  Map<int, String>? sentProposalMap,
  required int myUserId,
  required int targetUserId,
  List<Map<String, dynamic>>? incomingInterests,
  List<Map<String, dynamic>>? sentInterests,
}) {
  // 1. Check optimistic state first (highest priority)
  final optimistic = sentProposalMap?[targetUserId];
  if (optimistic != null) {
    return _fromOptimistic(optimistic, targetUserId);
  }

  // 2. Check incoming interests (they sent to me)
  if (incomingInterests != null) {
    for (final interest in incomingInterests) {
      final senderId = interest['interested_by'] ?? interest['user_id'];
      if (senderId?.toString() == targetUserId.toString()) {
        final status = interest['status'];
        final id = interest['id'] as int?;
        return _fromIncoming(status, id);
      }
    }
  }

  // 3. Check sent interests (I sent to them)
  if (sentInterests != null) {
    for (final interest in sentInterests) {
      final recipientId = interest['user_id'];
      if (recipientId?.toString() == targetUserId.toString()) {
        final status = interest['status'];
        final id = interest['id'] as int?;
        return _fromSent(status, id);
      }
    }
  }

  // 4. Check raw API interest_status field
  if (interestStatus != null) {
    return _fromRawStatus(interestStatus, interestText);
  }

  // 5. No relationship
  return const InterestStatusResult(
    state: CanonicalInterestState.none,
    label: 'Send Proposal',
    canSendProposal: true,
  );
}

InterestStatusResult _fromOptimistic(String state, int targetUserId) {
  switch (state) {
    case 'sent_pending':
      return const InterestStatusResult(
        state: CanonicalInterestState.sentPending,
        label: 'Proposal Sent',
        canWithdraw: true,
      );
    case 'sent_accepted':
      return const InterestStatusResult(
        state: CanonicalInterestState.sentAccepted,
        label: 'Accepted',
        canChat: true,
      );
    case 'received_pending':
      return const InterestStatusResult(
        state: CanonicalInterestState.receivedPending,
        label: 'Respond to Proposal',
        canAccept: true,
        canDecline: true,
      );
    case 'received_accepted':
      return const InterestStatusResult(
        state: CanonicalInterestState.receivedAccepted,
        label: 'Accepted',
        canChat: true,
      );
    case 'withdrawn':
    case 'none':
    default:
      return const InterestStatusResult(
        state: CanonicalInterestState.none,
        label: 'Send Proposal',
        canSendProposal: true,
      );
  }
}

InterestStatusResult _fromIncoming(dynamic status, int? interestId) {
  final s = int.tryParse(status.toString()) ?? -1;
  switch (s) {
    case 0: // pending
      return InterestStatusResult(
        state: CanonicalInterestState.receivedPending,
        interestId: interestId,
        label: 'Respond to Proposal',
        canAccept: true,
        canDecline: true,
      );
    case 1: // accepted
      return InterestStatusResult(
        state: CanonicalInterestState.receivedAccepted,
        interestId: interestId,
        label: 'Accepted',
        canChat: true,
      );
    case 2: // rejected
      return InterestStatusResult(
        state: CanonicalInterestState.receivedRejected,
        interestId: interestId,
        label: 'Declined',
      );
    default:
      return const InterestStatusResult(
        state: CanonicalInterestState.none,
        label: 'Send Proposal',
        canSendProposal: true,
      );
  }
}

InterestStatusResult _fromSent(dynamic status, int? interestId) {
  final s = int.tryParse(status.toString()) ?? -1;
  switch (s) {
    case 0: // pending
      return InterestStatusResult(
        state: CanonicalInterestState.sentPending,
        interestId: interestId,
        label: 'Proposal Sent',
        canWithdraw: true,
      );
    case 1: // accepted
      return InterestStatusResult(
        state: CanonicalInterestState.sentAccepted,
        interestId: interestId,
        label: 'Accepted',
        canChat: true,
      );
    case 2: // rejected
      return InterestStatusResult(
        state: CanonicalInterestState.sentRejected,
        interestId: interestId,
        label: 'Rejected',
      );
    default:
      return const InterestStatusResult(
        state: CanonicalInterestState.none,
        label: 'Send Proposal',
        canSendProposal: true,
      );
  }
}

InterestStatusResult _fromRawStatus(dynamic interestStatus, String? interestText) {
  final statusStr = interestStatus.toString().toLowerCase();
  final statusInt = int.tryParse(statusStr);

  // Handle numeric statuses
  if (statusInt != null) {
    // For raw API, we assume it's a sent interest unless text says otherwise
    final text = (interestText ?? '').toLowerCase();
    if (text.contains('received') || text.contains('respond')) {
      return _fromIncoming(statusInt, null);
    }
    return _fromSent(statusInt, null);
  }

  // Handle string statuses
  switch (statusStr) {
    case 'pending':
    case 'sent_pending':
      return const InterestStatusResult(
        state: CanonicalInterestState.sentPending,
        label: 'Proposal Sent',
        canWithdraw: true,
      );
    case 'accepted':
    case 'sent_accepted':
      return const InterestStatusResult(
        state: CanonicalInterestState.sentAccepted,
        label: 'Accepted',
        canChat: true,
      );
    case 'rejected':
    case 'sent_rejected':
      return const InterestStatusResult(
        state: CanonicalInterestState.sentRejected,
        label: 'Rejected',
      );
    case 'received_pending':
      return const InterestStatusResult(
        state: CanonicalInterestState.receivedPending,
        label: 'Respond to Proposal',
        canAccept: true,
        canDecline: true,
      );
    case 'received_accepted':
      return const InterestStatusResult(
        state: CanonicalInterestState.receivedAccepted,
        label: 'Accepted',
        canChat: true,
      );
    case 'received_rejected':
      return const InterestStatusResult(
        state: CanonicalInterestState.receivedRejected,
        label: 'Declined',
      );
    default:
      return InterestStatusResult(
        state: CanonicalInterestState.none,
        label: interestText ?? 'Send Proposal',
        canSendProposal: true,
      );
  }
}
