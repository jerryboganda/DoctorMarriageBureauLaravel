export type ToastType = 
  | 'proposal'            // New incoming proposal / interest request
  | 'proposal_accepted'   // Proposal accepted by doctor / mutual match
  | 'message'             // New real-time encrypted chat message
  | 'match'               // High-compatibility doctor discovered
  | 'verification'        // PMDC / Medical license verification update
  | 'coins'               // Referral reward / wallet credit
  | 'security'            // Security or account notification
  | 'payment'             // Payment proof received / approved
  | 'warning'             // Warning notice
  | 'success'             // Action successful
  | 'error'               // Error alert
  | 'info';               // General information

export interface ToastAction {
  label: string;
  href?: string;
  onClick?: () => void;
  primary?: boolean;
}

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  doctorName?: string;
  specialty?: string;
  hospital?: string;
  avatar?: string;
  score?: number;
  createdAt?: Date | string;
  duration?: number; // in milliseconds, 0 for sticky
  actions?: ToastAction[];
  sound?: boolean;
}
