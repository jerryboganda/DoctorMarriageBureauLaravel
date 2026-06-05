import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    RefreshControl,
    Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import Background from '../components/Background';
import { api, getProfileImageUrl } from '../utils/api';
import {
    ChevronLeftIcon,
    HeartIcon,
    CheckIcon,
    XIcon,
    UserIcon,
    MessageCircleIcon,
    BriefcaseIcon,
    MapPinIcon,
    CalendarIcon,
    SendIcon,
} from '../components/Icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';

interface Interest {
    id: number;
    user: {
        id: number;
        first_name: string;
        last_name: string;
        photo: string;
        age?: number;
        city?: string;
        country?: string;
        profession?: string;
    };
    status: 'pending' | 'accepted' | 'rejected';
    message?: string;
    created_at: string;
    type: 'received' | 'sent';
}

const InterestsScreen = () => {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
    const [receivedInterests, setReceivedInterests] = useState<Interest[]>([]);
    const [sentInterests, setSentInterests] = useState<Interest[]>([]);
    const [processingId, setProcessingId] = useState<number | null>(null);

    useEffect(() => {
        fetchInterests();
    }, []);

    const fetchInterests = async () => {
        try {
            const [receivedRes, sentRes] = await Promise.all([
                api.get('/member/interest-requests'),
                api.get('/member/my-interests'),
            ]);

            if (receivedRes.data.result) {
                setReceivedInterests(
                    receivedRes.data.data.map((i: any) => ({
                        id: i.id,
                        type: 'received',
                        status: i.status?.toLowerCase() === 'approved' ? 'accepted' : 'pending',
                        created_at: i.created_at || new Date().toISOString(),
                        user: {
                            id: i.user_id,
                            first_name: i.name || 'User',
                            last_name: '',
                            photo: i.photo,
                            age: i.age,
                            country: i.country,
                        },
                    })),
                );
            }

            if (sentRes.data.result) {
                setSentInterests(
                    sentRes.data.data.map((i: any) => ({
                        id: i.id,
                        type: 'sent',
                        status: i.status?.toLowerCase() === 'approved' ? 'accepted' : 'pending',
                        created_at: i.created_at || new Date().toISOString(),
                        user: {
                            id: i.user_id,
                            first_name: i.name || 'User',
                            last_name: '',
                            photo: i.photo,
                            age: i.age,
                            country: i.country,
                        },
                    })),
                );
            }
        } catch (error) {
            console.error('Error fetching interests:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchInterests();
    }, []);

    const handleAccept = async (interest: Interest) => {
        setProcessingId(interest.id);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            const response = await api.post('/member/interest-accept', {
                interest_id: interest.id,
            });
            if (response.data.result) {
                setReceivedInterests((prev) =>
                    prev.map((i) => (i.id === interest.id ? { ...i, status: 'accepted' } : i)),
                );
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert(t('common.success'), t('interests.acceptedMsg'));
            }
        } catch (error: any) {
            Alert.alert(
                t('common.error'),
                error.response?.data?.message || t('interests.acceptFailed'),
            );
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (interest: Interest) => {
        Alert.alert(t('interests.declineTitle'), t('interests.declineConfirm'), [
            { text: t('common.cancel'), style: 'cancel' },
            {
                text: t('interests.decline'),
                style: 'destructive',
                onPress: async () => {
                    setProcessingId(interest.id);
                    try {
                        const response = await api.post('/member/interest-reject', {
                            interest_id: interest.id,
                        });
                        if (response.data.result) {
                            setReceivedInterests((prev) =>
                                prev.map((i) =>
                                    i.id === interest.id ? { ...i, status: 'rejected' } : i,
                                ),
                            );
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                    } catch (error: any) {
                        Alert.alert(
                            t('common.error'),
                            error.response?.data?.message || t('interests.declineFailed'),
                        );
                    } finally {
                        setProcessingId(null);
                    }
                },
            },
        ]);
    };

    const handleCancelSent = async (interest: Interest) => {
        Alert.alert(t('interests.cancelTitle'), t('interests.cancelConfirm'), [
            { text: t('common.no'), style: 'cancel' },
            {
                text: t('interests.yesCancel'),
                style: 'destructive',
                onPress: async () => {
                    setProcessingId(interest.id);
                    try {
                        const response = await api.post('/member/interest-withdraw', {
                            interest_id: interest.id,
                        });
                        if (response.data.result) {
                            setSentInterests((prev) => prev.filter((i) => i.id !== interest.id));
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                    } catch (error: any) {
                        Alert.alert(
                            t('common.error'),
                            error.response?.data?.message || t('interests.cancelFailed'),
                        );
                    } finally {
                        setProcessingId(null);
                    }
                },
            },
        ]);
    };

    const viewProfile = (userId: number) => {
        router.push(`/member/${userId}`);
    };

    const startChat = (userId: number) => {
        router.push(`/chat/${userId}`);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'accepted':
                return (
                    <View className="bg-emerald-100 px-3 py-1 rounded-full flex-row items-center">
                        <CheckIcon size={12} color="#10b981" />
                        <Text className="text-emerald-600 text-xs font-semibold ml-1">
                            {t('interests.accepted')}
                        </Text>
                    </View>
                );
            case 'rejected':
                return (
                    <View className="bg-red-100 px-3 py-1 rounded-full flex-row items-center">
                        <XIcon size={12} color="#ef4444" />
                        <Text className="text-red-600 text-xs font-semibold ml-1">
                            {t('interests.declined')}
                        </Text>
                    </View>
                );
            default:
                return (
                    <View className="bg-amber-100 px-3 py-1 rounded-full">
                        <Text className="text-amber-600 text-xs font-semibold">
                            {t('interests.pending')}
                        </Text>
                    </View>
                );
        }
    };

    const getTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffInDays === 0) return 'Today';
        if (diffInDays === 1) return 'Yesterday';
        if (diffInDays < 7) return `${diffInDays} days ago`;
        return date.toLocaleDateString();
    };

    const currentInterests = activeTab === 'received' ? receivedInterests : sentInterests;
    const pendingCount = receivedInterests.filter((i) => i.status === 'pending').length;

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-slate-50">
                <ActivityIndicator size="large" color="#ef4444" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-slate-50">
            <Background />

            {/* Header */}
            <LinearGradient
                colors={['#dc2626', '#ef4444']}
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
                    <View className="flex-row items-center">
                        <Text className="text-xl font-bold text-white">{t('interests.title')}</Text>
                        {pendingCount > 0 && (
                            <View className="ml-2 bg-white px-2 py-0.5 rounded-full">
                                <Text className="text-red-600 text-xs font-bold">
                                    {pendingCount}
                                </Text>
                            </View>
                        )}
                    </View>
                    <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
                        <HeartIcon size={20} color="white" />
                    </View>
                </View>

                {/* Tabs */}
                <View className="flex-row px-4 pb-4">
                    <TouchableOpacity
                        onPress={() => setActiveTab('received')}
                        className={`flex-1 py-3 rounded-xl mr-2 flex-row items-center justify-center ${
                            activeTab === 'received' ? 'bg-white' : 'bg-white/20'
                        }`}
                    >
                        <HeartIcon
                            size={18}
                            color={activeTab === 'received' ? '#ef4444' : 'white'}
                        />
                        <Text
                            className={`ml-2 font-semibold ${
                                activeTab === 'received' ? 'text-red-600' : 'text-white'
                            }`}
                        >
                            Received ({receivedInterests.length})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setActiveTab('sent')}
                        className={`flex-1 py-3 rounded-xl flex-row items-center justify-center ${
                            activeTab === 'sent' ? 'bg-white' : 'bg-white/20'
                        }`}
                    >
                        <SendIcon size={18} color={activeTab === 'sent' ? '#ef4444' : 'white'} />
                        <Text
                            className={`ml-2 font-semibold ${
                                activeTab === 'sent' ? 'text-red-600' : 'text-white'
                            }`}
                        >
                            Sent ({sentInterests.length})
                        </Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <ScrollView
                className="flex-1 px-4 pt-4"
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#ef4444']}
                    />
                }
            >
                {currentInterests.length === 0 ? (
                    <MotiView
                        from={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="items-center justify-center py-20"
                    >
                        <View className="w-24 h-24 rounded-full bg-red-100 items-center justify-center mb-4">
                            <HeartIcon size={48} color="#fca5a5" />
                        </View>
                        <Text className="text-xl font-bold text-slate-900 mb-2">
                            {t(
                                activeTab === 'received'
                                    ? 'interests.noReceived'
                                    : 'interests.noSent',
                            )}
                        </Text>
                        <Text className="text-slate-500 text-center px-8">
                            {activeTab === 'received'
                                ? t('interests.noReceivedDesc')
                                : t('interests.noSentDesc')}
                        </Text>
                        <TouchableOpacity
                            onPress={() => router.push('/(tabs)/discovery')}
                            className="mt-6 bg-red-500 px-6 py-3 rounded-xl"
                        >
                            <Text className="text-white font-semibold">
                                {t('interests.exploreProfiles')}
                            </Text>
                        </TouchableOpacity>
                    </MotiView>
                ) : (
                    currentInterests.map((interest, index) => (
                        <MotiView
                            key={interest.id}
                            from={{ opacity: 0, translateY: 20 }}
                            animate={{ opacity: 1, translateY: 0 }}
                            transition={{ delay: index * 50 }}
                            className="mb-4"
                        >
                            <View className="bg-white rounded-2xl shadow-sm overflow-hidden">
                                <TouchableOpacity
                                    onPress={() => viewProfile(interest.user.id)}
                                    className="flex-row p-4"
                                >
                                    {/* Profile Image */}
                                    <View className="relative">
                                        {interest.user.photo ? (
                                            <Image
                                                source={{
                                                    uri: getProfileImageUrl(interest.user.photo),
                                                }}
                                                className="w-20 h-20 rounded-xl"
                                            />
                                        ) : (
                                            <View className="w-20 h-20 rounded-xl bg-slate-200 items-center justify-center">
                                                <UserIcon size={32} color="#94a3b8" />
                                            </View>
                                        )}
                                    </View>

                                    {/* Info */}
                                    <View className="flex-1 ml-4">
                                        <View className="flex-row items-center justify-between mb-1">
                                            <Text className="text-lg font-bold text-slate-900">
                                                {interest.user.first_name} {interest.user.last_name}
                                            </Text>
                                            {getStatusBadge(interest.status)}
                                        </View>

                                        {interest.user.age && (
                                            <View className="flex-row items-center mb-1">
                                                <CalendarIcon size={14} color="#64748b" />
                                                <Text className="text-slate-600 text-sm ml-1">
                                                    {interest.user.age} years old
                                                </Text>
                                            </View>
                                        )}

                                        {interest.user.profession && (
                                            <View className="flex-row items-center mb-1">
                                                <BriefcaseIcon size={14} color="#64748b" />
                                                <Text
                                                    className="text-slate-600 text-sm ml-1"
                                                    numberOfLines={1}
                                                >
                                                    {interest.user.profession}
                                                </Text>
                                            </View>
                                        )}

                                        {(interest.user.city || interest.user.country) && (
                                            <View className="flex-row items-center">
                                                <MapPinIcon size={14} color="#64748b" />
                                                <Text className="text-slate-600 text-sm ml-1">
                                                    {[interest.user.city, interest.user.country]
                                                        .filter(Boolean)
                                                        .join(', ')}
                                                </Text>
                                            </View>
                                        )}

                                        <Text className="text-xs text-slate-400 mt-2">
                                            {getTimeAgo(interest.created_at)}
                                        </Text>
                                    </View>
                                </TouchableOpacity>

                                {/* Message */}
                                {interest.message && (
                                    <View className="px-4 pb-3">
                                        <View className="bg-slate-50 rounded-lg p-3">
                                            <Text className="text-slate-600 text-sm italic">
                                                "{interest.message}"
                                            </Text>
                                        </View>
                                    </View>
                                )}

                                {/* Actions */}
                                {activeTab === 'received' && interest.status === 'pending' && (
                                    <View className="flex-row border-t border-slate-100">
                                        <TouchableOpacity
                                            onPress={() => handleReject(interest)}
                                            disabled={processingId === interest.id}
                                            className="flex-1 flex-row items-center justify-center py-3 border-r border-slate-100"
                                        >
                                            <XIcon size={18} color="#ef4444" />
                                            <Text className="text-red-500 font-semibold ml-2">
                                                {t('interests.decline')}
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => handleAccept(interest)}
                                            disabled={processingId === interest.id}
                                            className="flex-1 flex-row items-center justify-center py-3"
                                        >
                                            {processingId === interest.id ? (
                                                <ActivityIndicator size="small" color="#10b981" />
                                            ) : (
                                                <>
                                                    <CheckIcon size={18} color="#10b981" />
                                                    <Text className="text-emerald-500 font-semibold ml-2">
                                                        {t('interests.accept')}
                                                    </Text>
                                                </>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                )}

                                {interest.status === 'accepted' && (
                                    <TouchableOpacity
                                        onPress={() => startChat(interest.user.id)}
                                        className="flex-row items-center justify-center py-3 border-t border-slate-100 bg-emerald-50"
                                    >
                                        <MessageCircleIcon size={18} color="#10b981" />
                                        <Text className="text-emerald-600 font-semibold ml-2">
                                            {t('interests.startConversation')}
                                        </Text>
                                    </TouchableOpacity>
                                )}

                                {activeTab === 'sent' && interest.status === 'pending' && (
                                    <TouchableOpacity
                                        onPress={() => handleCancelSent(interest)}
                                        disabled={processingId === interest.id}
                                        className="flex-row items-center justify-center py-3 border-t border-slate-100"
                                    >
                                        {processingId === interest.id ? (
                                            <ActivityIndicator size="small" color="#ef4444" />
                                        ) : (
                                            <>
                                                <XIcon size={18} color="#ef4444" />
                                                <Text className="text-red-500 font-semibold ml-2">
                                                    {t('interests.cancelInterest')}
                                                </Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                )}
                            </View>
                        </MotiView>
                    ))
                )}

                <View className="h-28" />
            </ScrollView>
        </View>
    );
};

export default InterestsScreen;
