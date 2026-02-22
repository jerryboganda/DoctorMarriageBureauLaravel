export type CanonicalInterestState =
  | 'none'
  | 'sent_pending'
  | 'sent_accepted'
  | 'received_pending'
  | 'received_accepted';

const norm = (value: unknown): string => String(value ?? '').toLowerCase().trim();

export const resolveInterestState = (
  interestStatus: unknown,
  interestText: unknown,
  opts?: { localSent?: boolean }
): CanonicalInterestState => {
  const status = norm(interestStatus);
  const text = norm(interestText);
  const isAcceptedText =
    text.includes('accepted') ||
    text.includes('you accepted proposal') ||
    text.includes('proposal accepted');

  if (
    status === 'do_response' ||
    status === 'received interest' ||
    status === 'received_interest' ||
    status === 'received'
  ) {
    return isAcceptedText ? 'received_accepted' : 'received_pending';
  }

  if (
    status === '0' ||
    status === 'sent interest' ||
    status === 'sent_interest' ||
    status === 'pending' ||
    status === 'sent'
  ) {
    return isAcceptedText ? 'sent_accepted' : 'sent_pending';
  }

  if (status === 'mutual' || status === 'accepted' || status === 'approved') {
    return 'sent_accepted';
  }

  if (text.includes('reply to proposal')) return 'received_pending';
  if (text.includes('you accepted proposal')) return 'received_accepted';
  if (text.includes('proposal sent') || text.includes('waiting for reply')) return 'sent_pending';
  if (text.includes('proposal accepted') || text.includes('accepted')) return 'sent_accepted';

  if (opts?.localSent) return 'sent_pending';
  return 'none';
};

export const getInterestFlagsFromState = (state: CanonicalInterestState) => {
  const isAccepted = state === 'sent_accepted' || state === 'received_accepted';
  const isReceived = state === 'received_pending' || state === 'received_accepted';
  const isPendingByMe = state === 'sent_pending';
  return { isAccepted, isReceived, isPendingByMe };
};

