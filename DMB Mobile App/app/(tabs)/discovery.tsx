import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Image,
    RefreshControl,
    Dimensions,
    Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { FlashList } from '@shopify/flash-list';
import Background from '../../components/Background';
import FilterModal, { FilterState } from '../../components/FilterModal';
import { api } from '../../utils/api';
import { ProfileMatch } from '../../types';
import {
    SearchIcon,
    FilterIcon,
    MapPinIcon,
    SendIcon,
    XIcon,
    SparklesIcon,
} from '../../components/Icons';
import MatchIntelligenceModal from '../../components/MatchIntelligenceModal';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

const normalizeProfile = (profile: any): ProfileMatch => {
    const fullName =
        profile.name || [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim();
    return {
        id: String(profile.id ?? profile.user_id ?? profile.code ?? ''),
        name: fullName,
        specialty: profile.specialty ?? profile.designation ?? '',
        hospital: profile.hospital ?? profile.company ?? '',
        location: profile.location ?? profile.country ?? '',
        age: profile.age ?? 0,
        matchPercentage: profile.matchPercentage ?? profile.match_percentage ?? 0,
        avatarUrl: profile.avatarUrl ?? profile.photo ?? '',
        isVerified: profile.isVerified ?? profile.approved ?? false,
        isAgentPick: profile.isAgentPick ?? profile.is_agent_pick ?? false,
        isHighIntent: profile.isHighIntent ?? profile.is_high_intent ?? false,
    };
};

export default function DiscoveryTab() {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'agent' | 'intent'>('all');
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [appliedFilters, setAppliedFilters] = useState<FilterState | null>(null);
    const [profiles, setProfiles] = useState<{
        agent_picks: ProfileMatch[];
        high_intent: ProfileMatch[];
        recently_active: ProfileMatch[];
    }>({
        agent_picks: [],
        high_intent: [],
        recently_active: [],
    });
    const [searchResults, setSearchResults] = useState<ProfileMatch[]>([]);
    const [sendingInterest, setSendingInterest] = useState<Record<string, boolean>>({});
    const [selectedMatch, setSelectedMatch] = useState<ProfileMatch | null>(null);

    const fetchDiscoveryData = useCallback(async () => {
        try {
            const response = await api.get('/discovery');
            if (response.data.result) {
                const data = response.data.data || {};
                setProfiles({
                    agent_picks: (data.agent_picks || []).map(normalizeProfile),
                    high_intent: (data.high_intent || []).map(normalizeProfile),
                    recently_active: (data.recently_active || []).map(normalizeProfile),
                });
            }
        } catch (error) {
            console.error('Failed to fetch discovery profiles', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchDiscoveryData();
    }, [fetchDiscoveryData]);

    useEffect(() => {
        const query = searchQuery.trim();
        if (!query) {
            setSearchResults([]);
            return;
        }

        const timeoutId = setTimeout(async () => {
            try {
                const response = await api.get('/discovery/search', { params: { q: query } });
                const results = response.data?.data || [];
                setSearchResults(results.map(normalizeProfile));
            } catch (error) {
                console.error('Search failed', error);
            }
        }, 350);

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchDiscoveryData();
    };

    const handleSendInterest = async (profile: ProfileMatch) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSendingInterest((prev) => ({ ...prev, [profile.id]: true }));
        try {
            await api.post('/member/express-interest', { user_id: profile.id });
            Alert.alert(
                t('discovery.interestSentTitle'),
                t('discovery.interestSentMsg', { name: profile.name }),
            );
        } catch (error: any) {
            Alert.alert(
                t('discovery.errorTitle'),
                error.response?.data?.message || t('discovery.interestFailedMsg'),
            );
        } finally {
            setSendingInterest((prev) => ({ ...prev, [profile.id]: false }));
        }
    };

    const getDisplayedProfiles = (): ProfileMatch[] => {
        if (searchQuery.trim()) return searchResults;
        switch (activeTab) {
            case 'agent':
                return profiles.agent_picks;
            case 'intent':
                return profiles.high_intent;
            default:
                return profiles.recently_active;
        }
    };

    const displayedProfiles = getDisplayedProfiles();

    const renderProfileCard = ({ item, index }: { item: ProfileMatch; index: number }) => (
        <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 400, delay: index * 50 }}
            className="mb-4"
            style={{ width: CARD_WIDTH, marginRight: index % 2 === 0 ? 16 : 0 }}
        >
            <TouchableOpacity
                activeOpacity={0.9}
                className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-md shadow-slate-200/50"
            >
                {/* Avatar */}
                <View className="relative">
                    {item.avatarUrl ? (
                        <Image
                            source={{ uri: item.avatarUrl }}
                            className="w-full h-40"
                            resizeMode="cover"
                        />
                    ) : (
                        <View className="w-full h-40 bg-gradient-to-br from-blue-200 to-blue-400 items-center justify-center">
                            <Text className="text-4xl">👤</Text>
                        </View>
                    )}

                    {/* Match Badge */}
                    <TouchableOpacity
                        onPress={() => setSelectedMatch(item)}
                        className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded-full flex-row items-center gap-1 shadow-sm"
                    >
                        <SparklesIcon size={12} color="#f59e0b" />
                        <Text className="text-[10px] font-bold text-blue-700">
                            {item.matchPercentage}%
                        </Text>
                    </TouchableOpacity>

                    {item.isAgentPick && (
                        <View className="absolute top-2 left-2 bg-amber-500 px-2 py-1 rounded-full">
                            <Text className="text-[8px] font-bold text-white uppercase">
                                {t('discovery.agentPick')}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Info */}
                <View className="p-3">
                    <Text className="font-bold text-slate-900 text-sm" numberOfLines={1}>
                        {item.name}
                    </Text>
                    <Text className="text-blue-600 text-xs mt-0.5" numberOfLines={1}>
                        {item.specialty || 'Member'}
                    </Text>

                    <View className="flex-row items-center gap-1 mt-2">
                        <MapPinIcon size={10} color="#94a3b8" />
                        <Text className="text-slate-400 text-[10px]" numberOfLines={1}>
                            {item.location || 'N/A'} • {item.age ? `${item.age}y` : 'N/A'}
                        </Text>
                    </View>

                    {/* Action */}
                    <TouchableOpacity
                        onPress={() => handleSendInterest(item)}
                        disabled={sendingInterest[item.id]}
                        className="mt-3 h-9 bg-blue-600 rounded-xl items-center justify-center flex-row gap-1.5"
                    >
                        <SendIcon size={12} color="white" />
                        <Text className="text-white text-xs font-bold">
                            {sendingInterest[item.id]
                                ? t('discovery.sending')
                                : t('discovery.sendInterest')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </MotiView>
    );

    const EmptyState = () => (
        <View className="flex-1 items-center justify-center px-8 py-20">
            <View className="w-20 h-20 bg-slate-100 rounded-full items-center justify-center mb-4">
                <SearchIcon size={40} color="#94a3b8" />
            </View>
            <Text className="text-lg font-bold text-slate-900 text-center mb-2">
                {t('discovery.noProfilesTitle')}
            </Text>
            <Text className="text-slate-500 text-center text-sm">
                {t('discovery.noProfilesDesc')}
            </Text>
        </View>
    );

    const handleApplyFilters = (filters: FilterState) => {
        setAppliedFilters(filters);
        // In a real app, you would send these filters to the API
        console.log('Applied filters:', filters);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    const hasActiveFilters =
        appliedFilters &&
        (appliedFilters.gender !== 'Any' ||
            appliedFilters.religions.length > 0 ||
            appliedFilters.professions.length > 0 ||
            appliedFilters.ageMin > 18 ||
            appliedFilters.ageMax < 60);

    return (
        <View className="flex-1 bg-slate-50">
            <Background />

            {/* Filter Modal */}
            <FilterModal
                visible={showFilterModal}
                onClose={() => setShowFilterModal(false)}
                onApply={handleApplyFilters}
                initialFilters={appliedFilters || undefined}
            />

            {/* Header */}
            <View
                className="px-4 pb-3 bg-white/80 border-b border-slate-100"
                style={{ paddingTop: insets.top + 12 }}
            >
                <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-xl font-bold text-slate-900">{t('discovery.title')}</Text>
                    <TouchableOpacity
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setShowFilterModal(true);
                        }}
                        className={`flex-row items-center px-4 py-2 rounded-full ${
                            hasActiveFilters ? 'bg-blue-600' : 'bg-slate-100'
                        }`}
                    >
                        <FilterIcon size={16} color={hasActiveFilters ? 'white' : '#64748b'} />
                        <Text
                            className={`ml-2 text-sm font-semibold ${
                                hasActiveFilters ? 'text-white' : 'text-slate-600'
                            }`}
                        >
                            {hasActiveFilters ? t('discovery.filtered') : t('discovery.filters')}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View className="flex-row items-center bg-slate-100 rounded-2xl px-4 h-12 mb-3">
                    <SearchIcon size={18} color="#94a3b8" />
                    <TextInput
                        className="flex-1 ml-3 text-sm text-slate-900"
                        placeholder={t('discovery.searchPlaceholder')}
                        placeholderTextColor="#94a3b8"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <XIcon size={18} color="#94a3b8" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Tabs */}
                <View className="flex-row bg-slate-100 p-1 rounded-full">
                    {[
                        { key: 'all', label: t('discovery.tabAll') },
                        { key: 'agent', label: t('discovery.tabAgentPicks') },
                        { key: 'intent', label: t('discovery.tabHighIntent') },
                    ].map((tab) => (
                        <TouchableOpacity
                            key={tab.key}
                            onPress={() => {
                                Haptics.selectionAsync();
                                setActiveTab(tab.key as any);
                            }}
                            className={`flex-1 py-2.5 rounded-full items-center ${activeTab === tab.key ? 'bg-white shadow-sm' : ''}`}
                        >
                            <Text
                                className={`text-xs font-bold ${activeTab === tab.key ? 'text-blue-700' : 'text-slate-500'}`}
                            >
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Content */}
            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <Text className="text-slate-500">{t('discovery.loadingProfiles')}</Text>
                </View>
            ) : displayedProfiles.length === 0 ? (
                <EmptyState />
            ) : (
                <FlashList
                    data={displayedProfiles}
                    renderItem={renderProfileCard}
                    numColumns={2}
                    contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor="#1e3a8a"
                        />
                    }
                    keyExtractor={(item) => item.id}
                />
            )}

            <MatchIntelligenceModal
                visible={!!selectedMatch}
                match={selectedMatch}
                onClose={() => setSelectedMatch(null)}
            />
        </View>
    );
}
