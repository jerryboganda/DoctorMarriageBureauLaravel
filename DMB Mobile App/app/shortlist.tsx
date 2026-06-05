import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
    Alert,
    ActivityIndicator,
    RefreshControl,
    Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView, AnimatePresence } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import Background from '../components/Background';
import { api } from '../utils/api';
import { useAuthStore } from '../stores/authStore';
import {
    BookmarkIcon,
    HeartIcon,
    TrashIcon,
    ChevronLeftIcon,
    UserIcon,
    MapPinIcon,
    BriefcaseIcon,
    StarIcon,
    EyeIcon,
} from '../components/Icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

interface ShortlistedMember {
    id: number;
    user_id: number;
    name: string;
    photo: string;
    age: number;
    city?: string;
    country: string;
    religion?: string;
    mothere_tongue?: string;
    designation?: string;
    verified?: boolean;
    shortlist_status: number;
    created_at: string;
}

const ShortlistScreen = () => {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [shortlist, setShortlist] = useState<ShortlistedMember[]>([]);
    const [removing, setRemoving] = useState<number | null>(null);

    const fetchShortlist = useCallback(async () => {
        try {
            const response = await api.get('/member/my-shortlists');
            if (response.data.result && response.data.data) {
                setShortlist(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch shortlist', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchShortlist();
    }, [fetchShortlist]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchShortlist();
    };

    const handleRemove = async (id: number, name: string, memberId: number) => {
        Alert.alert(t('shortlist.removeTitle'), t('shortlist.removeConfirm', { name }), [
            { text: t('common.cancel'), style: 'cancel' },
            {
                text: t('common.remove'),
                style: 'destructive',
                onPress: async () => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    setRemoving(id);
                    try {
                        await api.post('/member/remove-from-shortlist', { user_id: memberId });
                        setShortlist((prev) => prev.filter((item) => item.id !== id));
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    } catch (error) {
                        Alert.alert(t('common.error'), t('shortlist.removeFailed'));
                    } finally {
                        setRemoving(null);
                    }
                },
            },
        ]);
    };

    const handleViewProfile = (memberId: number) => {
        Haptics.selectionAsync();
        router.push(`/member/${memberId}`);
    };

    const handleSendInterest = async (memberId: number, name: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            const response = await api.post('/member/express-interest', { user_id: memberId });
            if (response.data.result) {
                Alert.alert(t('common.success'), t('shortlist.interestSent', { name }));
            } else {
                Alert.alert(
                    t('common.info'),
                    response.data.message || t('shortlist.interestAlready'),
                );
            }
        } catch (error: any) {
            Alert.alert(
                t('common.error'),
                error.response?.data?.message || t('shortlist.interestFailed'),
            );
        }
    };

    if (loading) {
        return (
            <View className="flex-1 bg-slate-50">
                <LinearGradient
                    colors={['#ec4899', '#f43f5e', '#ef4444']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="flex-1 items-center justify-center"
                >
                    <MotiView
                        from={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', damping: 15 }}
                        className="items-center"
                    >
                        <View className="w-20 h-20 rounded-full bg-white/20 items-center justify-center mb-4">
                            <BookmarkIcon size={40} color="white" />
                        </View>
                        <ActivityIndicator size="large" color="white" />
                        <Text className="text-white/90 mt-4 font-medium">
                            {t('shortlist.loading')}
                        </Text>
                    </MotiView>
                </LinearGradient>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-slate-50">
            <Background />

            {/* Header */}
            <LinearGradient
                colors={['#ec4899', '#f43f5e']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ paddingTop: insets.top }}
            >
                <View className="flex-row items-center justify-between px-4 py-4">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
                    >
                        <ChevronLeftIcon size={24} color="white" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-white">{t('shortlist.title')}</Text>
                    <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
                        <BookmarkIcon size={20} color="white" />
                    </View>
                </View>

                {/* Stats Banner */}
                <View className="flex-row justify-center gap-6 pb-6">
                    <View className="items-center">
                        <Text className="text-3xl font-bold text-white">{shortlist.length}</Text>
                        <Text className="text-white/70 text-xs">{t('shortlist.shortlisted')}</Text>
                    </View>
                    <View className="w-px bg-white/30" />
                    <View className="items-center">
                        <Text className="text-3xl font-bold text-white">
                            {shortlist.filter((s) => s.verified).length}
                        </Text>
                        <Text className="text-white/70 text-xs">{t('common.verified')}</Text>
                    </View>
                </View>
            </LinearGradient>

            {/* Content */}
            <ScrollView
                className="flex-1 px-4 pt-4"
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor="#ec4899"
                    />
                }
            >
                {shortlist.length === 0 ? (
                    <MotiView
                        from={{ opacity: 0, translateY: 20 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        className="items-center py-20"
                    >
                        <View className="w-24 h-24 rounded-full bg-pink-100 items-center justify-center mb-4">
                            <BookmarkIcon size={48} color="#ec4899" />
                        </View>
                        <Text className="text-xl font-bold text-slate-900 mb-2">
                            {t('shortlist.noProfiles')}
                        </Text>
                        <Text className="text-slate-500 text-center px-8">
                            {t('shortlist.noProfilesDesc')}
                        </Text>
                        <TouchableOpacity
                            onPress={() => router.push('/(tabs)')}
                            className="mt-6 bg-pink-500 px-8 py-3 rounded-full"
                        >
                            <Text className="text-white font-bold">
                                {t('shortlist.browseProfiles')}
                            </Text>
                        </TouchableOpacity>
                    </MotiView>
                ) : (
                    <View className="flex-row flex-wrap justify-between pb-28">
                        <AnimatePresence>
                            {shortlist.map((item, index) => (
                                <MotiView
                                    key={item.id}
                                    from={{ opacity: 0, translateY: 20, scale: 0.9 }}
                                    animate={{ opacity: 1, translateY: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ type: 'spring', delay: index * 50, damping: 15 }}
                                    style={{ width: CARD_WIDTH }}
                                    className="mb-4"
                                >
                                    <TouchableOpacity
                                        onPress={() => handleViewProfile(item.user_id)}
                                        activeOpacity={0.9}
                                        className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100"
                                    >
                                        {/* Photo */}
                                        <View className="relative">
                                            {item.photo ? (
                                                <Image
                                                    source={{ uri: item.photo }}
                                                    className="w-full h-40"
                                                    resizeMode="cover"
                                                />
                                            ) : (
                                                <View className="w-full h-40 bg-slate-200 items-center justify-center">
                                                    <UserIcon size={48} color="#94a3b8" />
                                                </View>
                                            )}

                                            {/* Verified Badge */}
                                            {item.verified && (
                                                <View className="absolute top-2 left-2 bg-emerald-500 px-2 py-1 rounded-full flex-row items-center">
                                                    <StarIcon size={10} color="white" />
                                                    <Text className="text-white text-xs font-bold ml-1">
                                                        {t('common.verified')}
                                                    </Text>
                                                </View>
                                            )}

                                            {/* Remove Button */}
                                            <TouchableOpacity
                                                onPress={() =>
                                                    handleRemove(
                                                        item.id,
                                                        item.name || 'this profile',
                                                        item.user_id,
                                                    )
                                                }
                                                disabled={removing === item.id}
                                                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500/90 items-center justify-center"
                                            >
                                                {removing === item.id ? (
                                                    <ActivityIndicator size="small" color="white" />
                                                ) : (
                                                    <TrashIcon size={14} color="white" />
                                                )}
                                            </TouchableOpacity>
                                        </View>

                                        {/* Info */}
                                        <View className="p-3">
                                            <Text
                                                className="text-base font-bold text-slate-900"
                                                numberOfLines={1}
                                            >
                                                {item.name}
                                            </Text>

                                            <View className="flex-row items-center mt-1">
                                                <MapPinIcon size={12} color="#64748b" />
                                                <Text
                                                    className="text-slate-500 text-xs ml-1"
                                                    numberOfLines={1}
                                                >
                                                    {item.city ||
                                                        item.country ||
                                                        t('shortlist.locationNotSet')}
                                                </Text>
                                            </View>

                                            {item.designation && (
                                                <View className="flex-row items-center mt-1">
                                                    <BriefcaseIcon size={12} color="#64748b" />
                                                    <Text
                                                        className="text-slate-500 text-xs ml-1"
                                                        numberOfLines={1}
                                                    >
                                                        {item.designation}
                                                    </Text>
                                                </View>
                                            )}

                                            {/* Age Badge */}
                                            {item.age && (
                                                <View className="mt-2 bg-pink-50 px-2 py-1 rounded-full self-start">
                                                    <Text className="text-pink-600 text-xs font-medium">
                                                        {item.age} years
                                                    </Text>
                                                </View>
                                            )}

                                            {/* Action Buttons */}
                                            <View className="flex-row gap-2 mt-3">
                                                <TouchableOpacity
                                                    onPress={() => handleViewProfile(item.user_id)}
                                                    className="flex-1 bg-slate-100 py-2 rounded-lg items-center flex-row justify-center"
                                                >
                                                    <EyeIcon size={14} color="#475569" />
                                                    <Text className="text-slate-700 text-xs font-semibold ml-1">
                                                        {t('common.view')}
                                                    </Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    onPress={() =>
                                                        handleSendInterest(
                                                            item.user_id,
                                                            item.name || '',
                                                        )
                                                    }
                                                    className="flex-1 bg-pink-500 py-2 rounded-lg items-center flex-row justify-center"
                                                >
                                                    <HeartIcon size={14} color="white" />
                                                    <Text className="text-white text-xs font-semibold ml-1">
                                                        {t('common.interest')}
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                </MotiView>
                            ))}
                        </AnimatePresence>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

export default ShortlistScreen;
