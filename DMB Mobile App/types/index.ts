import { TextInputProps, PressableProps, ViewStyle, StyleProp } from 'react-native';

export interface User {
    id: number;
    type?: string;
    name?: string;
    membership?: number | string;
    email?: string;
    email_verified_at?: string | null;
    photo_approved?: boolean;
    blocked?: boolean | number;
    deactivated?: boolean | number;
    approved?: boolean | number;
    avatar?: string;
    avatar_original?: string;
    phone?: string;
    birthday?: number | string;
}

export interface MatchIntelligence {
    totalScore: number;
    categories: { name: string; score: number; weight: 'High' | 'Medium' | 'Low' }[];
    mutualFit: {
        youMeetThem: number;
        theyMeetYou: number;
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
    age: number;
    matchPercentage: number;
    avatarUrl: string;
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
    senderId: string;
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

export interface IncomingInterest {
    interestId: number;
    status?: string;
    profile: ProfileMatch;
}

// UI Component Types
export interface InputProps extends Omit<TextInputProps, 'className'> {
    label: string;
    icon?: React.ReactNode;
    error?: string;
    containerClassName?: string;
    className?: string;
    type?: string;
    onClick?: () => void;
}

export interface ButtonProps extends Omit<PressableProps, 'className' | 'children'> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'social' | 'outline' | 'danger';
    isLoading?: boolean;
    loading?: boolean;
    icon?: React.ReactNode;
    className?: string;
    textClassName?: string;
    children?: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    title?: string;
    fullWidth?: boolean;
    type?: string;
    onClick?: any;
}

export interface SocialButtonProps extends ButtonProps {
    provider: 'google' | 'apple';
}
