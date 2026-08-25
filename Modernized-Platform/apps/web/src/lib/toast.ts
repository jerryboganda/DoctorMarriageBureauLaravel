import type { ToastItem, ToastType, ToastAction } from '../types/toast';

export const TOAST_EVENT_NAME = 'dmb-toast-event';
export const TOAST_DISMISS_EVENT = 'dmb-toast-dismiss-event';

let toastCounter = 0;

export function dispatchToast(item: Omit<ToastItem, 'id'> & { id?: string }): string {
  const id = item.id || `toast-${Date.now()}-${++toastCounter}`;
  const fullItem: ToastItem = {
    ...item,
    id,
    duration: item.duration !== undefined ? item.duration : (item.type === 'proposal' ? 7500 : 5000),
    sound: item.sound !== undefined ? item.sound : true,
    createdAt: item.createdAt || new Date(),
  };

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(TOAST_EVENT_NAME, { detail: fullItem }));
  }

  return id;
}

export const showToast = dispatchToast;

export function dismissToast(id: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(TOAST_DISMISS_EVENT, { detail: { id } }));
  }
}

// Fluent toast API
export const toast = Object.assign(
  // Default call signature for backwards compatibility: toast('message', 'kind')
  (message: string, kind: 'success' | 'error' | 'info' = 'info') => {
    return dispatchToast({
      type: kind,
      title: kind === 'success' ? 'Success' : kind === 'error' ? 'Error' : 'Notice',
      message,
    });
  },
  {
    show: (item: Omit<ToastItem, 'id'> & { id?: string }) => dispatchToast(item),
    
    // 1. New Incoming Proposal / Interest Alert
    proposal: (opts: {
      name: string;
      specialty?: string;
      hospital?: string;
      avatar?: string;
      score?: number;
      proposalId?: number | string;
      onAccept?: () => void;
      onView?: () => void;
    }) => {
      return dispatchToast({
        type: 'proposal',
        title: 'New Rishta Proposal Received! 💌',
        message: `${opts.name} has expressed mutual interest in your doctor profile.`,
        doctorName: opts.name,
        specialty: opts.specialty || 'Medical Specialist',
        hospital: opts.hospital || 'Leading Hospital',
        avatar: opts.avatar || '/doctors/doctor3.png',
        score: opts.score || 96,
        duration: 8500,
        actions: [
          {
            label: 'Review Proposal',
            href: opts.proposalId ? `/proposals/?highlight=${opts.proposalId}` : '/proposals/',
            primary: true,
            onClick: opts.onView,
          },
          {
            label: 'Quick Accept',
            primary: false,
            onClick: opts.onAccept,
          }
        ]
      });
    },

    // 2. Proposal Accepted / Mutual Match
    proposalAccepted: (opts: {
      name: string;
      specialty?: string;
      avatar?: string;
      threadId?: number | string;
    }) => {
      return dispatchToast({
        type: 'proposal_accepted',
        title: 'Proposal Accepted! ✨',
        message: `${opts.name} accepted your proposal. Direct encrypted doctor messaging is now unlocked!`,
        doctorName: opts.name,
        specialty: opts.specialty,
        avatar: opts.avatar || '/doctors/doctor4.png',
        duration: 8000,
        actions: [
          {
            label: 'Start Direct Chat',
            href: opts.threadId ? `/messages/?thread=${opts.threadId}` : '/messages/',
            primary: true,
          }
        ]
      });
    },

    // 3. New Chat Message Received
    message: (opts: {
      name: string;
      text: string;
      avatar?: string;
      threadId?: number | string;
    }) => {
      return dispatchToast({
        type: 'message',
        title: `Message from ${opts.name} 💬`,
        message: `"${opts.text}"`,
        doctorName: opts.name,
        avatar: opts.avatar || '/doctors/doctor2.png',
        duration: 6500,
        actions: [
          {
            label: 'Reply Now',
            href: opts.threadId ? `/messages/?thread=${opts.threadId}` : '/messages/',
            primary: true,
          }
        ]
      });
    },

    // 4. High Compatibility Match Discovered
    match: (opts: {
      name: string;
      specialty?: string;
      score: number;
      avatar?: string;
      userId?: number | string;
    }) => {
      return dispatchToast({
        type: 'match',
        title: 'High Compatibility Match! 🌟',
        message: `We found a new ${opts.score}% compatibility verified doctor match: ${opts.name}.`,
        doctorName: opts.name,
        specialty: opts.specialty,
        score: opts.score,
        avatar: opts.avatar || '/doctors/doctor1.png',
        duration: 7500,
        actions: [
          {
            label: 'View Biodata',
            href: opts.userId ? `/discover/?view=${opts.userId}` : '/discover/',
            primary: true,
          }
        ]
      });
    },

    // 5. PMDC Verification & Credentials Status
    verification: (opts: {
      title?: string;
      message: string;
    }) => {
      return dispatchToast({
        type: 'verification',
        title: opts.title || 'PMDC Verification Approved 🛡️',
        message: opts.message,
        duration: 6000,
        actions: [
          {
            label: 'View Badge',
            href: '/profile/',
            primary: true,
          }
        ]
      });
    },

    // 6. Referral / Wallet Coins Reward
    coins: (amount: number, reason: string) => {
      return dispatchToast({
        type: 'coins',
        title: `+${amount} PKR Credited! 🪙`,
        message: reason,
        duration: 5500,
        actions: [
          {
            label: 'View Wallet',
            href: '/wallet/',
            primary: true,
          }
        ]
      });
    },

    // 7. Success
    success: (message: string, title = 'Success') => {
      return dispatchToast({
        type: 'success',
        title,
        message,
        duration: 4500,
      });
    },

    // 8. Error
    error: (message: string, title = 'Attention') => {
      return dispatchToast({
        type: 'error',
        title,
        message,
        duration: 5500,
      });
    },

    // 9. Info
    info: (message: string, title = 'Notice') => {
      return dispatchToast({
        type: 'info',
        title,
        message,
        duration: 4500,
      });
    },

    // Dismiss by ID
    dismiss: (id: string) => dismissToast(id),
  }
);

// Global window exposure for quick inspection & testing
if (typeof window !== 'undefined') {
  (window as any).dmbToast = toast;
}
