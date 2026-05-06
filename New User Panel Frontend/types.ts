export interface User {
  name: string;
  specialty: string;
  avatarUrl: string;
}

export interface MatchIntelligence {
  totalScore: number;
  categories: { name: string; score: number; weight: 'High' | 'Medium' | 'Low' }[];
  mutualFit: {
    youMeetThem: number; // percentage
    theyMeetYou: number; // percentage
  };
  topReasons: string[];
  frictionPoints: string[];
  agentNotes?: string;
  behavioralReason?: string;
  generatedAt: string;
}

export interface ProfileMatch {
  id: string;
  name: string;
  specialty: string;
  hospital: string;
  location: string;
  age: number | null;
  matchPercentage: number;
  avatarUrl: string;
  gender?: number | string | null;
  coverGradient?: string;
  isVerified: boolean;
  bio?: string;
  tags?: string[];
  education?: {
    degree: string;
    institution: string;
  };
  career?: {
    position: string;
    institution: string;
    duration: string;
  };
  matchReasons?: string[];
  isOnline?: boolean;
  intelligence?: MatchIntelligence;
    isAgentPick?: boolean;
    isHighIntent?: boolean;
    interestStatus?: number | string;
    interestText?: string;
    shortlistStatus?: number | string;
    shortlistText?: string;
    photoRequestState?: 'none' | 'pending' | 'approved';
    photoRequestText?: string;
    photoRequestRequested?: boolean;
    photoRequestApproved?: boolean;
    photoRequestRequired?: boolean;
    photoAccessible?: boolean;
    photoExists?: boolean;
    profilePhotoBlur?: boolean;
    galleryImageRequestState?: 'none' | 'pending' | 'approved';
    galleryImageRequestText?: string;
    galleryImageRequestRequested?: boolean;
    galleryImageRequestApproved?: boolean;
    galleryImageRequestRequired?: boolean;
    galleryImageAccessible?: boolean;
    galleryImageExists?: boolean;
    travel_mode?: boolean;
    travel_city?: string;
    travel_country?: string;
  }

export interface CompatibilityMetric {
  label: string;
  percentage: number;
  color: 'primary' | 'yellow';
}

export interface ActivityItem {
  id: string;
  type: 'view' | 'message' | 'update';
  user?: string;
  message?: string;
  time: string;
  isNew?: boolean;
}

export interface Message {
  id: string;
  senderId: string; // 'me' or other
  text?: string;
  type: 'text' | 'image' | 'voice' | 'system' | 'prompt' | 'call_log' | 'file';
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  isSensitive?: boolean;
  mediaUrl?: string;
  duration?: string;
  fileName?: string;
}

export interface Chat {
  id: string;
  participants: {
    name: string;
    avatarUrl: string;
    role?: string;
  }[];
  lastMessage: Message;
  unreadCount: number;
  type: 'direct' | 'group' | 'matchmaker';
  isRequest?: boolean;
  isOnline?: boolean;
  typing?: boolean;
}
