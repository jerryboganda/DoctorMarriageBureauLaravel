import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { api } from '../utils/api';
import {
    CalendarIcon,
    UsersIcon,
    HandshakeIcon,
    PartyPopperIcon,
    StoreIcon,
    ChevronLeftIcon,
} from '../components/Icons';

interface Track {
    id: string;
    profile: {
        id: number;
        name: string;
        avatarUrl: string | null;
        specialty: string;
        hospital: string;
        location: string;
    };
    stage: string;
    stageLabel: string;
    lastInteraction: string;
    nextAction: string;
    progress: number;
}

const STAGES = [
    { id: 'connection', label: 'Connected', icon: UsersIcon },
    { id: 'meeting', label: 'Meeting', icon: CalendarIcon },
    { id: 'family', label: 'Family', icon: StoreIcon },
    { id: 'roka', label: 'Roka', icon: HandshakeIcon },
    { id: 'wedding', label: 'Wedding', icon: PartyPopperIcon },
];

export default function ProgressionScreen() {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [tracks, setTracks] = useState<Track[]>([]);
    const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailData, setDetailData] = useState<any>(null);

    const fetchTracks = useCallback(async () => {
        try {
            const response = await api.get('/progression/active');
            if (response.data.result) {
                setTracks(response.data.tracks);
            }
        } catch (error) {
            console.error('Failed to fetch progressions', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTracks();
    }, [fetchTracks]);

    const handleSelectTrack = async (track: Track) => {
        setSelectedTrack(track);
        setDetailLoading(true);
        try {
            const response = await api.get(`/progression/${track.profile.id}`);
            if (response.data.result) {
                setDetailData(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch detail', error);
        } finally {
            setDetailLoading(false);
        }
    };

    const renderDashboard = () => (
        <ScrollView
            className="flex-1 p-4"
            refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchTracks} />}
        >
            {/* Stats */}
            <View className="flex-row gap-4 mb-6">
                <View className="flex-1 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <View className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center mb-2">
                        <CalendarIcon size={20} color="#2563eb" />
                    </View>
                    <Text className="text-2xl font-bold text-slate-900">
                        {tracks.filter((t) => t.stage === 'meeting').length}
                    </Text>
                    <Text className="text-xs text-slate-500">{t('progression.meetings')}</Text>
                </View>
                <View className="flex-1 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <View className="w-10 h-10 bg-purple-50 rounded-full items-center justify-center mb-2">
                        <PartyPopperIcon size={20} color="#9333ea" />
                    </View>
                    <Text className="text-2xl font-bold text-slate-900">
                        {tracks.filter((t) => t.stage === 'wedding' || t.stage === 'roka').length}
                    </Text>
                    <Text className="text-xs text-slate-500">{t('progression.success')}</Text>
                </View>
            </View>

            <Text className="text-lg font-bold text-slate-900 mb-4">
                {t('progression.activeJourneys')}
            </Text>

            {tracks.length === 0 ? (
                <View className="items-center py-10">
                    <Text className="text-slate-400">{t('progression.empty')}</Text>
                </View>
            ) : (
                tracks.map((track, i) => (
                    <MotiView
                        key={track.id}
                        from={{ opacity: 0, translateY: 20 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ delay: i * 100 }}
                    >
                        <TouchableOpacity
                            onPress={() => handleSelectTrack(track)}
                            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-4"
                        >
                            <View className="flex-row items-center mb-3">
                                {track.profile.avatarUrl ? (
                                    <Image
                                        source={{ uri: track.profile.avatarUrl }}
                                        className="w-12 h-12 rounded-full mr-3"
                                    />
                                ) : (
                                    <View className="w-12 h-12 bg-slate-100 rounded-full mr-3 items-center justify-center">
                                        <UsersIcon size={20} color="#94a3b8" />
                                    </View>
                                )}
                                <View className="flex-1">
                                    <Text className="font-bold text-slate-900 text-base">
                                        {track.profile.name}
                                    </Text>
                                    <Text className="text-xs text-slate-500">
                                        {track.profile.specialty}
                                    </Text>
                                </View>
                                <View className="bg-blue-50 px-2 py-1 rounded-lg">
                                    <Text className="text-xs font-bold text-blue-700">
                                        {track.stageLabel}
                                    </Text>
                                </View>
                            </View>

                            {/* Progress Bar */}
                            <View className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                                <View
                                    className="h-full bg-blue-500 rounded-full"
                                    style={{ width: `${track.progress}%` }}
                                />
                            </View>
                            <View className="flex-row justify-between">
                                <Text className="text-xs text-slate-400">
                                    Last: {track.lastInteraction}
                                </Text>
                                <Text className="text-xs text-blue-600 font-medium">
                                    Next: {track.nextAction}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </MotiView>
                ))
            )}
        </ScrollView>
    );

    const renderDetail = () => {
        if (detailLoading)
            return <ActivityIndicator size="large" color="#3b82f6" className="mt-20" />;

        return (
            <ScrollView className="flex-1">
                {/* Timeline */}
                <View className="p-6">
                    {STAGES.map((stage, i) => {
                        const isCompleted =
                            STAGES.findIndex((s) => s.id === selectedTrack?.stage) >= i;
                        const isCurrent = selectedTrack?.stage === stage.id;
                        const Icon = stage.icon;

                        return (
                            <View key={stage.id} className="flex-row mb-6 relative">
                                {/* Line */}
                                {i !== STAGES.length - 1 && (
                                    <View
                                        className={`absolute left-5 top-10 w-0.5 h-12 ${isCompleted ? 'bg-blue-500' : 'bg-slate-200'}`}
                                    />
                                )}

                                {/* Icon Bubble */}
                                <View
                                    className={`w-10 h-10 rounded-full items-center justify-center z-10 mr-4 ${isCurrent ? 'bg-blue-600 shadow-blue-500/30 shadow-lg' : isCompleted ? 'bg-blue-100' : 'bg-slate-100'}`}
                                >
                                    <Icon
                                        size={18}
                                        color={
                                            isCurrent
                                                ? 'white'
                                                : isCompleted
                                                  ? '#2563eb'
                                                  : '#94a3b8'
                                        }
                                    />
                                </View>

                                <View className="flex-1 pt-2">
                                    <Text
                                        className={`font-bold text-base ${isCurrent ? 'text-blue-700' : isCompleted ? 'text-slate-900' : 'text-slate-400'}`}
                                    >
                                        {stage.label}
                                    </Text>
                                    {isCurrent && (
                                        <View className="bg-white p-3 rounded-xl border border-blue-100 mt-2 shadow-sm">
                                            <Text className="text-xs text-slate-500 mb-2">
                                                {t('progression.currentPhaseActions')}
                                            </Text>
                                            <TouchableOpacity className="bg-blue-600 py-2 rounded-lg items-center">
                                                <Text className="text-white text-xs font-bold">
                                                    {t('progression.logActivity')}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>
        );
    };

    return (
        <View className="flex-1 bg-slate-50">
            <LinearGradient
                colors={['#1e3a8a', '#3b82f6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ paddingTop: insets.top, paddingBottom: 16 }}
                className="px-4 shadow-lg z-10"
            >
                <View className="flex-row items-center py-4">
                    <TouchableOpacity
                        onPress={() => (selectedTrack ? setSelectedTrack(null) : router.back())}
                        className="w-10 h-10 bg-white/20 rounded-full items-center justify-center mr-3"
                    >
                        <ChevronLeftIcon size={24} color="white" />
                    </TouchableOpacity>
                    <View>
                        <Text className="text-white text-lg font-bold">
                            {selectedTrack ? selectedTrack.profile.name : t('progression.title')}
                        </Text>
                        <Text className="text-blue-100 text-xs">
                            {selectedTrack
                                ? t('progression.manageStages')
                                : t('progression.emptyDesc')}
                        </Text>
                    </View>
                </View>
            </LinearGradient>

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#3b82f6" />
                </View>
            ) : selectedTrack ? (
                renderDetail()
            ) : (
                renderDashboard()
            )}
        </View>
    );
}
