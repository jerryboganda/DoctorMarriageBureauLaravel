import { ProfileMatch, User, CompatibilityMetric, ActivityItem, Chat } from './types';

export const CURRENT_USER: User = {
  name: 'Dr. Ahmed Khan',
  specialty: 'MD Pulmonology',
  avatarUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200&h=200'
};

export const MAIN_PROFILE: ProfileMatch = {
  id: '1',
  name: 'Dr. Zara Malik, FCPS',
  specialty: 'Interventional Cardiology',
  hospital: 'Aga Khan University Hospital',
  location: 'Karachi',
  age: 28,
  matchPercentage: 98,
  isVerified: true,
  avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400&h=400',
  coverGradient: 'bg-gradient-to-r from-teal-100 to-emerald-100',
  bio: "Passionate about advancements in cardiac care. When I'm not in the cath lab, you can find me reading Urdu poetry or volunteering at free clinics. Looking for someone who understands the demands of our profession but values deen and family.",
  tags: ['Poetry', 'Traveling', 'Halal Foodie'],
  education: {
    degree: 'FCPS Cardiology',
    institution: 'Dow University (Gold Medalist)'
  },
  career: {
    position: 'Senior Registrar',
    institution: 'Aga Khan University Hospital',
    duration: '3 Yrs'
  },
  intelligence: {
    totalScore: 98,
    categories: [
        { name: 'Deen & Values', score: 99, weight: 'High' },
        { name: 'Career Ambition', score: 95, weight: 'High' },
        { name: 'Family Background', score: 90, weight: 'Medium' }
    ],
    mutualFit: { youMeetThem: 95, theyMeetYou: 100 },
    topReasons: ['Both prioritize research', 'Family values align', 'Complementary work schedules'],
    frictionPoints: ['Dr. Zara prefers Karachi, you are in Lahore'],
    agentNotes: 'Highly recommended. Families have spoken and aligned on requirements.',
    generatedAt: 'AI Analysis • 2 hours ago'
  }
};

export const SECONDARY_PROFILE: Partial<ProfileMatch> = {
  name: 'Dr. Bilal Ahmed, MS Ortho',
  specialty: 'Spine Specialist • Shifa Int. Hospital',
  matchPercentage: 85,
  avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200&h=200'
};

export const MOCK_PROFILES: ProfileMatch[] = [
  MAIN_PROFILE,
  {
    id: '2',
    name: 'Dr. Bilal Ahmed',
    specialty: 'Spine Specialist',
    hospital: 'Shifa International',
    location: 'Islamabad',
    age: 31,
    matchPercentage: 85,
    avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400&h=400',
    isVerified: true,
    isHighIntent: true
  },
  {
    id: '3',
    name: 'Dr. Fatima Tariq',
    specialty: 'Dermatologist',
    hospital: 'Shaukat Khanum',
    location: 'Lahore',
    age: 27,
    matchPercentage: 92,
    avatarUrl: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=400&h=400',
    isVerified: true,
    isAgentPick: true
  },
  {
    id: '4',
    name: 'Dr. Hina Raza',
    specialty: 'Pediatrician',
    hospital: 'Children\'s Hospital',
    location: 'Lahore',
    age: 26,
    matchPercentage: 88,
    avatarUrl: 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&q=80&w=400&h=400',
    isVerified: false
  },
  {
    id: '5',
    name: 'Dr. Omar Farooq',
    specialty: 'Orthopedic Surgeon',
    hospital: 'Services Hospital',
    location: 'Lahore',
    age: 32,
    matchPercentage: 95,
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400&h=400',
    isVerified: true,
    isAgentPick: true,
    isHighIntent: true
  },
  {
    id: '6',
    name: 'Dr. Saira Yusaf',
    specialty: 'Neurologist',
    hospital: 'PIMS',
    location: 'Islamabad',
    age: 30,
    matchPercentage: 82,
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400&h=400',
    isVerified: true
  },
  {
    id: '7',
    name: 'Dr. Hamza Ali',
    specialty: 'General Surgery',
    hospital: 'Jinnah Hospital',
    location: 'Karachi',
    age: 33,
    matchPercentage: 78,
    avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400&h=400',
    isVerified: true,
    isHighIntent: true
  },
  {
    id: '8',
    name: 'Dr. Ayesha Siddiqui',
    specialty: 'Radiologist',
    hospital: 'Indus Hospital',
    location: 'Karachi',
    age: 29,
    matchPercentage: 91,
    avatarUrl: 'https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?auto=format&fit=crop&q=80&w=400&h=400',
    isVerified: true,
    isAgentPick: true
  }
];

export const COMPATIBILITY_METRICS: CompatibilityMetric[] = [
  { label: 'Sect/Values', percentage: 100, color: 'primary' },
  { label: 'Career Goals', percentage: 92, color: 'primary' },
  { label: 'Family Lifestyle', percentage: 74, color: 'yellow' },
];

export const RECENT_ACTIVITY: ActivityItem[] = [
  { id: '1', type: 'view', user: 'Dr. Zainab', time: '12 mins ago' },
  { id: '2', type: 'message', user: 'Dr. Sana Mir', message: '"As-salamu alaykum Dr. Ahmed, I saw..."', time: '1 hour ago', isNew: true },
  { id: '3', type: 'update', message: 'Profile visibility updated', time: 'Yesterday' },
];

export const MOCK_CHATS: Chat[] = [
  {
    id: '1',
    participants: [{ name: 'Dr. Zara Malik', avatarUrl: MAIN_PROFILE.avatarUrl }],
    lastMessage: { id: 'm1', senderId: '1', text: 'InshaAllah, Saturday works for me.', type: 'text', timestamp: '10:42 AM', status: 'read' },
    unreadCount: 0,
    type: 'direct',
    isOnline: true,
  },
  {
    id: '2',
    participants: [
        { name: 'Dr. Bilal Ahmed', avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200&h=200' },
        { name: 'Mrs. Ahmed (Mother)', avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200&h=200', role: 'Guardian' }
    ],
    lastMessage: { id: 'm2', senderId: '2', text: 'Shared family details', type: 'system', timestamp: 'Yesterday', status: 'read' },
    unreadCount: 2,
    type: 'group',
  },
  {
    id: '3',
    participants: [{ name: 'Mrs. Farida (Matchmaker)', avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200&h=200', role: 'Agent' }],
    lastMessage: { id: 'm3', senderId: '3', text: 'Here are 3 new profiles for your review.', type: 'text', timestamp: 'Tue', status: 'read' },
    unreadCount: 0,
    type: 'matchmaker',
  },
  {
    id: '4',
    participants: [{ name: 'Dr. Sana Mir', avatarUrl: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=200&h=200' }],
    lastMessage: { id: 'm4', senderId: '4', text: 'As-salamu alaykum, interesting profile!', type: 'text', timestamp: '1 hour ago', status: 'delivered' },
    unreadCount: 1,
    type: 'direct',
    isRequest: true,
  },
  {
    id: '5',
    participants: [{ name: 'Dr. Omar Farooq', avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200&h=200' }],
    lastMessage: { id: 'm5', senderId: '5', text: 'Accepted your invitation.', type: 'system', timestamp: '2 days ago', status: 'read' },
    unreadCount: 0,
    type: 'direct',
  }
];