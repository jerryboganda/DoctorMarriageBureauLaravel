import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    Dimensions,
    Modal,
    StyleSheet,
    Platform,
} from 'react-native';
import { MotiView } from 'moti';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import {
    Canvas,
    Rect,
    vec,
    LinearGradient as SkiaLinearGradient,
} from '@shopify/react-native-skia';

// Store
import { useDashboardStore } from '../stores/useDashboardStore';

// Components
import BottomNav from './BottomNav';
import ProfileCard from './ProfileCard';
import FilterSheet from './FilterSheet';
import SubscriptionModal from './SubscriptionModal';
import ProfileDetail from './ProfileDetail';
import ChatDetail from './ChatDetail';
import SettingsScreen from './SettingsScreen';

// Icons
import {
    FilterIcon,
    SearchIcon,
    SettingsIcon,
    CrownIcon,
    MessageIcon,
    StethoscopeIcon,
    ChevronRightIcon,
    UserIcon,
    ShieldIcon,
} from './Icons';

const { width, height } = Dimensions.get('window');

// --- Mock Data ---
const MOCK_PROFILES = [
    {
        id: 1,
        name: 'Dr. Sarah',
        age: 29,
        specialty: 'Cardiologist',
        education: 'MD, Harvard',
        location: 'New York, NY',
        matchScore: 98,
        avatarUrl:
            'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=800&auto=format&fit=crop',
    },
    {
        id: 2,
        name: 'Dr. James',
        age: 32,
        specialty: 'Neurologist',
        education: 'MD, Hopkins',
        location: 'Chicago, IL',
        matchScore: 85,
        avatarUrl:
            'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=800&auto=format&fit=crop',
    },
    {
        id: 3,
        name: 'Dr. Emily',
        age: 27,
        specialty: 'Pediatrician',
        education: 'MD, Stanford',
        location: 'San Francisco, CA',
        matchScore: 92,
        avatarUrl:
            'https://images.unsplash.com/photo-1594824476967-48c8b964273f?q=80&w=800&auto=format&fit=crop',
    },
    {
        id: 4,
        name: 'Dr. Michael',
        age: 34,
        specialty: 'Surgeon',
        education: 'MD, Yale',
        location: 'Boston, MA',
        matchScore: 95,
        avatarUrl:
            'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=800&auto=format&fit=crop',
    },
];

const RECENT_MATCHES_GRID = [
    {
        id: 201,
        name: 'Dr. Priya',
        specialty: 'Dermatologist',
        age: 28,
        score: 96,
        location: 'Mumbai',
        verified: true,
    },
    {
        id: 202,
        name: 'Dr. Amit',
        specialty: 'Neurosurgeon',
        age: 31,
        score: 89,
        location: 'Delhi',
        verified: true,
    },
    {
        id: 203,
        name: 'Dr. Neha',
        specialty: 'Pediatrician',
        age: 26,
        score: 92,
        location: 'Bangalore',
        verified: false,
    },
    {
        id: 204,
        name: 'Dr. Arjun',
        specialty: 'Cardiologist',
        age: 33,
        score: 85,
        location: 'Hyderabad',
        verified: true,
    },
];

const CHAT_LIST = [
    {
        id: 1,
        name: 'Dr. Ayesha',
        message: 'That sounds wonderful! When are you free?',
        time: '2m',
        unread: 1,
        avatar: 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=200',
    },
    {
        id: 2,
        name: 'Dr. Raj',
        message: 'I actually specialize in pediatric surgery too.',
        time: '1h',
        unread: 0,
        avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200',
    },
];

// --- Background Component (Skia) ---
const AnimatedBackground = () => {
    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Canvas style={{ flex: 1 }}>
                <Rect x={0} y={0} width={width} height={height}>
                    <SkiaLinearGradient
                        start={vec(0, 0)}
                        end={vec(width, height)}
                        colors={['#f8fafc', '#eef2ff', '#f0f9ff']}
                    />
                </Rect>
            </Canvas>
        </View>
    );
};

export default function Dashboard() {
    // Store
    const activeTab = useDashboardStore((state) => state.activeTab);
    const setActiveTab = useDashboardStore((state) => state.setActiveTab);

    // Local UI state for modals/overlays
    const showFilter = useDashboardStore((state) => state.modals.filter);
    const toggleFilter = useDashboardStore((state) => state.toggleModal);

    // We can keep some local state for selections as they are transient
    const [selectedProfile, setSelectedProfile] = React.useState<any>(null);
    const [selectedChat, setSelectedChat] = React.useState<any>(null);
    const [showPremium, setShowPremium] = React.useState(false);
    const [settingsView, setSettingsView] = React.useState<'account' | 'privacy' | null>(null);

    // --- Headers ---
    const Header = () => (
        <View className="px-5 pt-14 pb-4 flex-row justify-between items-center z-10 bg-white/50 backdrop-blur-md sticky top-0">
            <View>
                <Text className="text-2xl font-black text-slate-800 tracking-tight capitalize">
                    {activeTab === 'discover' ? 'Discover Matches' : activeTab}
                </Text>
            </View>
            <View className="flex-row gap-3">
                <TouchableOpacity
                    onPress={() => setShowPremium(true)}
                    className="w-10 h-10 rounded-full bg-amber-400 items-center justify-center shadow-lg shadow-amber-500/20"
                >
                    <CrownIcon size={20} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() =>
                        activeTab === 'discover'
                            ? toggleFilter('filter')
                            : activeTab === 'profile'
                              ? setSettingsView('account')
                              : null
                    }
                    className="w-10 h-10 rounded-full bg-white border border-slate-200 items-center justify-center shadow-sm"
                >
                    {activeTab === 'profile' ? (
                        <SettingsIcon size={20} color="#475569" />
                    ) : (
                        <FilterIcon size={20} color="#475569" />
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );

    // --- Tab Renders ---

    // 1. Discover Tab (FlashList)
    const renderDiscoverItem = ({ item, index }: { item: any; index: number }) => (
        <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 400, delay: index * 100 }}
            className="mb-8 items-center"
        >
            <ProfileCard {...item} onPress={() => setSelectedProfile(item)} />
        </MotiView>
    );

    const DiscoverTab = () => (
        <FlashList
            data={MOCK_PROFILES}
            renderItem={renderDiscoverItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120, paddingTop: 10 }}
            ListHeaderComponent={() => (
                <View className="px-6 mb-4 flex-row justify-between items-center">
                    <Text className="text-slate-500 font-semibold text-xs uppercase tracking-widest">
                        Daily Recommendations
                    </Text>
                    <Text className="text-blue-600 font-bold text-xs">View All</Text>
                </View>
            )}
        />
    );

    // 2. Matches Tab (Grid)
    const renderMatchItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            onPress={() => setSelectedProfile(item)}
            className="flex-1 m-2 bg-white rounded-3xl p-4 border border-slate-100 shadow-sm shadow-slate-200/50"
        >
            <View className="h-28 bg-indigo-50 rounded-2xl mb-3 overflow-hidden relative">
                <Image
                    source={{ uri: `https://i.pravatar.cc/150?u=${item.id}` }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                />
                <View className="absolute top-2 left-2 bg-white/90 backdrop-blur-md rounded-lg px-2 py-1">
                    <Text className="text-[10px] font-bold text-slate-800">{item.score}%</Text>
                </View>
            </View>
            <Text className="font-bold text-slate-900 text-sm">{item.name}</Text>
            <Text className="text-slate-400 text-xs mt-0.5">{item.specialty}</Text>

            <TouchableOpacity
                onPress={() =>
                    setSelectedChat({ id: item.id, name: item.name, message: 'New Match' })
                }
                className="mt-3 bg-slate-900 py-2.5 rounded-xl flex-row justify-center items-center gap-2"
            >
                <MessageIcon size={12} color="white" />
                <Text className="text-white text-[10px] font-bold uppercase tracking-wide">
                    Connect
                </Text>
            </TouchableOpacity>
        </TouchableOpacity>
    );

    const MatchesTab = () => (
        <View className="flex-1 px-2">
            <View className="px-3 mb-4 mt-2">
                <View className="bg-white p-3.5 rounded-2xl flex-row items-center border border-slate-200 shadow-sm">
                    <SearchIcon size={20} color="#3b82f6" />
                    <TextInput
                        placeholder="Search specialists..."
                        placeholderTextColor="#94a3b8"
                        className="flex-1 ml-3 text-slate-800 font-medium h-full"
                    />
                </View>
            </View>
            <FlashList
                data={RECENT_MATCHES_GRID}
                renderItem={renderMatchItem}
                numColumns={2}
                contentContainerStyle={{ paddingBottom: 120 }}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );

    // 3. Chat Tab (List)
    const renderChatItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            onPress={() => setSelectedChat(item)}
            className="bg-white mx-5 p-4 rounded-3xl mb-4 flex-row items-center border border-slate-100 shadow-sm active:scale-95 transition-transform"
        >
            <Image
                source={{ uri: item.avatar }}
                className="w-14 h-14 rounded-full bg-slate-100"
                contentFit="cover"
            />
            <View className="ml-4 flex-1">
                <View className="flex-row justify-between items-center mb-1">
                    <Text className="font-bold text-slate-900 text-base">{item.name}</Text>
                    <Text className="text-xs text-slate-400 font-bold">{item.time}</Text>
                </View>
                <Text className="text-slate-600 text-sm font-medium" numberOfLines={1}>
                    {item.message}
                </Text>
            </View>
            {item.unread > 0 && (
                <View className="w-5 h-5 bg-blue-500 rounded-full items-center justify-center ml-2 border border-blue-400">
                    <Text className="text-white text-[10px] font-bold">{item.unread}</Text>
                </View>
            )}
        </TouchableOpacity>
    );

    const ChatTab = () => (
        <FlashList
            data={CHAT_LIST}
            renderItem={renderChatItem}
            contentContainerStyle={{ paddingBottom: 120, paddingTop: 10 }}
        />
    );

    // 4. Profile Tab (Static Scroll)
    const ProfileTab = () => (
        <FlashList
            data={[1]} // Dummy for layout consistency
            renderItem={() => (
                <View className="px-5 pt-4 pb-32">
                    <View className="items-center mb-8">
                        <View className="w-32 h-32 rounded-full p-1 border-4 border-white shadow-xl shadow-blue-500/20 mb-4 bg-white relative">
                            <Image
                                source={{
                                    uri: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400',
                                }}
                                className="w-full h-full rounded-full"
                                contentFit="cover"
                            />
                            <View className="absolute bottom-0 right-0 bg-blue-500 p-2 rounded-full border-4 border-white">
                                <CrownIcon size={14} color="white" />
                            </View>
                        </View>
                        <Text className="text-2xl font-bold text-slate-900">Dr. Rahul Sharma</Text>
                        <View className="flex-row items-center gap-2 mt-2">
                            <View className="bg-blue-50 px-3 py-1.5 rounded-lg flex-row items-center gap-1.5 border border-blue-100">
                                <StethoscopeIcon size={12} color="#2563eb" />
                                <Text className="text-blue-700 text-xs font-bold uppercase">
                                    Cardiologist
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Stats */}
                    <View className="flex-row justify-between mb-6 bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
                        <View>
                            <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                                Views
                            </Text>
                            <Text className="text-3xl font-black text-slate-900">1.2k</Text>
                        </View>
                        <View className="h-full w-[1px] bg-slate-100" />
                        <View className="items-center">
                            <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                                Matches
                            </Text>
                            <Text className="text-3xl font-black text-slate-900">48</Text>
                        </View>
                        <View className="h-full w-[1px] bg-slate-100" />
                        <View className="items-end">
                            <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                                Rating
                            </Text>
                            <Text className="text-3xl font-black text-slate-900">4.9</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={() => setSettingsView('account')}
                        className="bg-white p-5 rounded-3xl mb-4 border border-slate-100 flex-row items-center justify-between shadow-sm active:bg-slate-50"
                    >
                        <View className="flex-row items-center gap-4">
                            <View className="w-12 h-12 bg-blue-50 rounded-2xl items-center justify-center">
                                <UserIcon size={24} color="#2563eb" />
                            </View>
                            <View>
                                <Text className="font-bold text-slate-900 text-lg">Account</Text>
                                <Text className="text-xs text-slate-500 font-medium">
                                    Manage details & photos
                                </Text>
                            </View>
                        </View>
                        <ChevronRightIcon size={20} color="#cbd5e1" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setSettingsView('privacy')}
                        className="bg-white p-5 rounded-3xl mb-4 border border-slate-100 flex-row items-center justify-between shadow-sm active:bg-slate-50"
                    >
                        <View className="flex-row items-center gap-4">
                            <View className="w-12 h-12 bg-purple-50 rounded-2xl items-center justify-center">
                                <ShieldIcon size={24} color="#9333ea" />
                            </View>
                            <View>
                                <Text className="font-bold text-slate-900 text-lg">Privacy</Text>
                                <Text className="text-xs text-slate-500 font-medium">
                                    Visibility & Security
                                </Text>
                            </View>
                        </View>
                        <ChevronRightIcon size={20} color="#cbd5e1" />
                    </TouchableOpacity>
                </View>
            )}
        />
    );

    return (
        <View className="flex-1 bg-slate-50">
            {Platform.OS !== 'web' && <AnimatedBackground />}

            <Header />

            <View className="flex-1 z-0">
                {activeTab === 'discover' && <DiscoverTab />}
                {activeTab === 'matches' && <MatchesTab />}
                {activeTab === 'chat' && <ChatTab />}
                {activeTab === 'profile' && <ProfileTab />}
            </View>

            <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

            {/* --- Modals & Sheets --- */}

            <Modal
                visible={!!selectedProfile}
                animationType="fade"
                transparent
                onRequestClose={() => setSelectedProfile(null)}
            >
                <View className="flex-1 bg-black/50">
                    <View className="flex-1 mt-20 bg-slate-50 rounded-t-[40px] overflow-hidden">
                        {selectedProfile && (
                            <ProfileDetail
                                profile={selectedProfile}
                                onBack={() => setSelectedProfile(null)}
                            />
                        )}
                    </View>
                </View>
            </Modal>

            <Modal
                visible={!!selectedChat}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setSelectedChat(null)}
            >
                {selectedChat && (
                    <ChatDetail chat={selectedChat} onBack={() => setSelectedChat(null)} />
                )}
            </Modal>

            <Modal
                visible={!!settingsView}
                animationType="slide"
                onRequestClose={() => setSettingsView(null)}
            >
                <SettingsScreen section={settingsView} onBack={() => setSettingsView(null)} />
            </Modal>

            <SubscriptionModal visible={showPremium} onClose={() => setShowPremium(false)} />

            <FilterSheet visible={showFilter} onClose={() => toggleFilter('filter')} />
        </View>
    );
}
