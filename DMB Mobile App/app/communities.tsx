import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, RefreshControl, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView, AnimatePresence } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { api } from '../utils/api';
import { 
    UsersIcon, MapPinIcon, GraduationCapIcon, HeartIcon, BuildingIcon, 
    ShieldIcon, SearchIcon, ChevronLeftIcon, CheckIcon, PlusIcon, LogOutIcon 
} from '../components/Icons';

interface Community {
    id: number;
    name: string;
    type: string;
    description?: string | null;
    is_private: boolean;
    member_count: number;
    status: 'joined' | 'pending' | 'none';
}

const COMMUNITY_META: Record<string, { icon: any; color: string; bg: string; text: string }> = {
    region: { icon: MapPinIcon, color: '#2563eb', bg: 'bg-blue-50', text: 'text-blue-700' },
    alumni: { icon: GraduationCapIcon, color: '#9333ea', bg: 'bg-purple-50', text: 'text-purple-700' },
    culture: { icon: UsersIcon, color: '#ea580c', bg: 'bg-orange-50', text: 'text-orange-700' },
    specialty: { icon: HeartIcon, color: '#dc2626', bg: 'bg-red-50', text: 'text-red-700' },
    organization: { icon: BuildingIcon, color: '#059669', bg: 'bg-emerald-50', text: 'text-emerald-700' },
};

export default function CommunitiesScreen() {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [communities, setCommunities] = useState<Community[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [actionLoading, setActionLoading] = useState<Record<number, boolean>>({});
    const [filter, setFilter] = useState<'all' | 'joined' | 'pending'>('all');

    const fetchCommunities = useCallback(async () => {
        try {
            const response = await api.get('/member/communities', {
                params: { search: searchQuery.trim() || undefined }
            });
            setCommunities(response.data?.data ?? []);
        } catch (error) {
            console.error('Failed to load communities', error);
        } finally {
            setLoading(false);
        }
    }, [searchQuery]);

    useEffect(() => {
        fetchCommunities();
    }, [fetchCommunities]);

    const handleJoin = async (id: number) => {
        setActionLoading(prev => ({ ...prev, [id]: true }));
        try {
            const response = await api.post(`/member/communities/${id}/join`);
            const nextStatus = response.data?.status || 'pending';
            setCommunities(prev => prev.map(c => c.id === id ? { ...c, status: nextStatus } : c));
        } catch (error) {
            Alert.alert(t('common.error'), t('communities.joinError'));
        } finally {
            setActionLoading(prev => ({ ...prev, [id]: false }));
        }
    };

    const handleLeave = async (id: number) => {
        setActionLoading(prev => ({ ...prev, [id]: true }));
        try {
            await api.delete(`/member/communities/${id}/leave`);
            setCommunities(prev => prev.map(c => c.id === id ? { ...c, status: 'none' } : c));
        } catch (error) {
            Alert.alert(t('common.error'), t('communities.leaveError'));
        } finally {
            setActionLoading(prev => ({ ...prev, [id]: false }));
        }
    };

    const getMeta = (type: string) => {
        const key = type?.toLowerCase() || 'default';
        return COMMUNITY_META[key] ?? { icon: ShieldIcon, color: '#64748b', bg: 'bg-slate-50', text: 'text-slate-700' };
    };

    const filteredList = communities.filter(c => {
        if (filter === 'joined') return c.status === 'joined';
        if (filter === 'pending') return c.status === 'pending';
        return true;
    });

    const renderItem = ({ item, index }: { item: Community; index: number }) => {
        const meta = getMeta(item.type);
        const Icon = meta.icon;
        const isLoading = actionLoading[item.id];

        let actionBtn;
        if (item.status === 'joined') {
            actionBtn = (
                <TouchableOpacity 
                    onPress={() => handleLeave(item.id)}
                    disabled={isLoading}
                    className="flex-row items-center gap-1 px-3 py-1.5 bg-slate-100 rounded-lg border border-slate-200"
                >
                    {isLoading ? <ActivityIndicator size="small" color="#64748b" /> : <LogOutIcon size={14} color="#64748b" />}
                    <Text className="text-xs font-bold text-slate-600">{t('communities.leave')}</Text>
                </TouchableOpacity>
            );
        } else if (item.status === 'pending') {
            actionBtn = (
                <View className="flex-row items-center gap-1 px-3 py-1.5 bg-yellow-50 rounded-lg border border-yellow-100">
                    <Text className="text-xs font-bold text-yellow-700">{t('common.pending')}</Text>
                </View>
            );
        } else {
            actionBtn = (
                <TouchableOpacity 
                    onPress={() => handleJoin(item.id)}
                    disabled={isLoading}
                    className="flex-row items-center gap-1 px-3 py-1.5 bg-slate-900 rounded-lg shadow-sm"
                >
                    {isLoading ? <ActivityIndicator size="small" color="white" /> : <PlusIcon size={14} color="white" />}
                    <Text className="text-xs font-bold text-white">{t('communities.join')}</Text>
                </TouchableOpacity>
            );
        }

        return (
            <MotiView
                from={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 50 }}
                className="bg-white mx-4 mb-3 p-4 rounded-2xl border border-slate-100 shadow-sm"
            >
                <View className="flex-row items-start gap-4">
                    <View className={`w-12 h-12 rounded-full items-center justify-center ${meta.bg}`}>
                        <Icon size={24} color={meta.color} />
                    </View>
                    <View className="flex-1">
                        <View className="flex-row justify-between items-start">
                            <Text className="font-bold text-slate-900 text-base flex-1 mr-2">{item.name}</Text>
                            {item.is_private && <ShieldIcon size={14} color="#94a3b8" />}
                        </View>
                        <Text className="text-xs text-slate-500 font-medium uppercase mb-1">{item.type}</Text>
                        <Text className="text-sm text-slate-600 leading-5 mb-3">{item.description || t('communities.noDescription')}</Text>
                        
                        <View className="flex-row items-center justify-between mt-1">
                            <Text className="text-xs text-slate-400 font-bold">{item.member_count} {t('communities.members')}</Text>
                            {actionBtn}
                        </View>
                    </View>
                </View>
            </MotiView>
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
                        onPress={() => router.back()}
                        className="w-10 h-10 bg-white/20 rounded-full items-center justify-center mr-3"
                    >
                        <ChevronLeftIcon size={24} color="white" />
                    </TouchableOpacity>
                    <View>
                        <Text className="text-white text-lg font-bold">{t('communities.title')}</Text>
                        <Text className="text-blue-100 text-xs">{t('communities.subtitle')}</Text>
                    </View>
                </View>

                {/* Search */}
                <View className="relative mt-2">
                    <SearchIcon size={18} color="#94a3b8" style={{ position: 'absolute', left: 12, top: 12, zIndex: 1 }} />
                    <TextInput 
                        className="bg-white h-11 rounded-xl pl-10 pr-4 text-slate-900 text-sm"
                        placeholder={t('communities.searchPlaceholder')}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor="#94a3b8"
                    />
                </View>

                {/* Filter Tabs */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-4">
                    {(['all', 'joined', 'pending'] as const).map((t) => (
                        <TouchableOpacity
                            key={t}
                            onPress={() => setFilter(t)}
                            className={`mr-3 px-4 py-1.5 rounded-full ${filter === t ? 'bg-white' : 'bg-white/20'}`}
                        >
                            <Text className={`text-xs font-bold capitalize ${filter === t ? 'text-blue-900' : 'text-white'}`}>
                                {t}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </LinearGradient>

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#3b82f6" />
                </View>
            ) : (
                <FlashList
                    data={filteredList}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingVertical: 16 }}
                    refreshControl={
                        <RefreshControl refreshing={loading} onRefresh={fetchCommunities} tintColor="#3b82f6" />
                    }
                />
            )}
        </View>
    );
}
