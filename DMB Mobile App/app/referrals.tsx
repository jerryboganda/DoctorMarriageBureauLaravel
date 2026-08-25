import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    RefreshControl,
    Share,
    Clipboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import Background from '../components/Background';
import { api } from '../utils/api';
import { useAuthStore } from '../stores/authStore';
import {
    GiftIcon,
    ChevronLeftIcon,
    CopyIcon,
    ShareIcon,
    UsersIcon,
    CheckCircleIcon,
    ClockIcon,
} from '../components/Icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';

interface ReferralData {
    referral_code: string;
    referral_link: string;
    total_referrals: number;
    successful_referrals: number;
    pending_referrals: number;
    total_earnings: number;
    pending_earnings: number;
    currency: string;
    referrals: {
        id: number;
        name: string;
        status: 'pending' | 'completed' | 'expired';
        earned: number;
        joined_at: string;
    }[];
}

const ReferralsScreen = () => {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState<ReferralData | null>(null);

    const fetchReferrals = useCallback(async () => {
        try {
            // Fetch referral code and earnings in parallel
            const [codeResponse, usersResponse, earningsResponse] = await Promise.all([
                api.get('/member/referral-code'),
                api.get('/member/referred-users'),
                api
                    .get('/member/my-referral-earnings')
                    .catch(() => ({ data: { data: { total: 0, pending: 0 } } })),
            ]);

            const referralCode =
                codeResponse.data.data?.referral_code || user?.code || user?.referral_code;
            const referredUsers = usersResponse.data.data || [];
            const earnings = earningsResponse.data.data || { total: 0, pending: 0 };

            setData({
                referral_code: referralCode,
                referral_link: `https://app.doctormarriagebureau.com.pk/register?ref=${referralCode}`,
                total_referrals: referredUsers.length,
                successful_referrals: referredUsers.filter((u: any) => u.status === 'active')
                    .length,
                pending_referrals: referredUsers.filter((u: any) => u.status === 'pending').length,
                total_earnings: earnings.total || 0,
                pending_earnings: earnings.pending || 0,
                currency: 'PKR',
                referrals: referredUsers.map((u: any) => ({
                    id: u.id,
                    name: u.name || 'User',
                    avatar: u.avatar || u.photo,
                    status: u.status || 'pending',
                    earned: u.earned || 0,
                    joined_at: u.created_at || u.joined_at,
                })),
            });
        } catch (error) {
            console.error('Failed to fetch referrals', error);
            // Set default data
            setData({
                referral_code:
                    user?.referral_code ||
                    'DMB' + Math.random().toString(36).substring(2, 8).toUpperCase(),
                referral_link: `https://app.doctormarriagebureau.com.pk/register?ref=${user?.referral_code || 'DEMO'}`,
                total_referrals: 0,
                successful_referrals: 0,
                pending_referrals: 0,
                total_earnings: 0,
                pending_earnings: 0,
                currency: 'PKR',
                referrals: [],
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.referral_code]);

    useEffect(() => {
        fetchReferrals();
    }, [fetchReferrals]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchReferrals();
    };

    const handleCopyCode = () => {
        if (data?.referral_code) {
            Clipboard.setString(data.referral_code);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert(t('referrals.copied'), t('referrals.codeCopied'));
        }
    };

    const handleCopyLink = () => {
        if (data?.referral_link) {
            Clipboard.setString(data.referral_link);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert(t('referrals.copied'), t('referrals.linkCopied'));
        }
    };

    const handleShare = async () => {
        if (!data) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            await Share.share({
                message: `Join Doctor Marriage Bureau using my referral code: ${data.referral_code}\n\nSign up here: ${data.referral_link}`,
                title: 'Join Doctor Marriage Bureau',
            });
        } catch (error) {
            console.error('Failed to share', error);
        }
    };

    const formatCurrency = (amount: number) => {
        return `${data?.currency || 'PKR'} ${amount.toLocaleString()}`;
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    if (loading) {
        return (
            <View className="flex-1 bg-slate-50">
                <LinearGradient
                    colors={['#f59e0b', '#f97316', '#ef4444']}
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
                            <GiftIcon size={40} color="white" />
                        </View>
                        <ActivityIndicator size="large" color="white" />
                        <Text className="text-white/90 mt-4 font-medium">
                            {t('referrals.loading')}
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
                colors={['#f59e0b', '#f97316']}
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
                    <Text className="text-xl font-bold text-white">{t('referrals.title')}</Text>
                    <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
                        <GiftIcon size={20} color="white" />
                    </View>
                </View>

                {/* Earnings Card */}
                <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    className="mx-4 mb-6"
                >
                    <View className="bg-white/20 rounded-3xl p-6 backdrop-blur-lg">
                        <Text className="text-white/70 text-sm font-medium">
                            {t('referrals.totalEarnings')}
                        </Text>
                        <Text className="text-4xl font-bold text-white mt-2">
                            {formatCurrency(data?.total_earnings || 0)}
                        </Text>

                        {/* Stats Row */}
                        <View className="flex-row mt-4 gap-4">
                            <View className="flex-1 bg-white/10 rounded-xl p-3 items-center">
                                <UsersIcon size={20} color="white" />
                                <Text className="text-2xl font-bold text-white mt-1">
                                    {data?.total_referrals || 0}
                                </Text>
                                <Text className="text-white/70 text-xs">
                                    {t('referrals.total')}
                                </Text>
                            </View>
                            <View className="flex-1 bg-white/10 rounded-xl p-3 items-center">
                                <CheckCircleIcon size={20} color="#22c55e" />
                                <Text className="text-2xl font-bold text-white mt-1">
                                    {data?.successful_referrals || 0}
                                </Text>
                                <Text className="text-white/70 text-xs">
                                    {t('referrals.successful')}
                                </Text>
                            </View>
                            <View className="flex-1 bg-white/10 rounded-xl p-3 items-center">
                                <ClockIcon size={20} color="#fbbf24" />
                                <Text className="text-2xl font-bold text-white mt-1">
                                    {data?.pending_referrals || 0}
                                </Text>
                                <Text className="text-white/70 text-xs">
                                    {t('referrals.pending')}
                                </Text>
                            </View>
                        </View>
                    </View>
                </MotiView>
            </LinearGradient>

            <ScrollView
                className="flex-1 px-4 pt-4"
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor="#f59e0b"
                    />
                }
            >
                {/* Referral Code Card */}
                <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ delay: 100 }}
                    className="bg-white rounded-2xl p-4 mb-4 border border-slate-100"
                >
                    <Text className="text-xs font-bold text-amber-600 uppercase mb-3">
                        {t('referrals.yourCode')}
                    </Text>
                    <View className="flex-row items-center bg-amber-50 rounded-xl p-4">
                        <View className="flex-1">
                            <Text className="text-2xl font-bold text-slate-900 tracking-widest">
                                {data?.referral_code}
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={handleCopyCode}
                            className="w-10 h-10 rounded-full bg-amber-500 items-center justify-center"
                        >
                            <CopyIcon size={18} color="white" />
                        </TouchableOpacity>
                    </View>
                </MotiView>

                {/* Referral Link Card */}
                <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ delay: 150 }}
                    className="bg-white rounded-2xl p-4 mb-4 border border-slate-100"
                >
                    <Text className="text-xs font-bold text-amber-600 uppercase mb-3">
                        {t('referrals.yourLink')}
                    </Text>
                    <View className="flex-row items-center bg-slate-100 rounded-xl p-4">
                        <Text className="flex-1 text-sm text-slate-600" numberOfLines={1}>
                            {data?.referral_link}
                        </Text>
                        <TouchableOpacity onPress={handleCopyLink} className="ml-2">
                            <CopyIcon size={18} color="#64748b" />
                        </TouchableOpacity>
                    </View>

                    {/* Share Button */}
                    <TouchableOpacity
                        onPress={handleShare}
                        className="mt-4 bg-amber-500 py-4 rounded-xl flex-row items-center justify-center"
                    >
                        <ShareIcon size={20} color="white" />
                        <Text className="text-white font-bold text-lg ml-2">
                            {t('referrals.shareWithFriends')}
                        </Text>
                    </TouchableOpacity>
                </MotiView>

                {/* How It Works */}
                <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ delay: 200 }}
                    className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 mb-4 border border-amber-100"
                >
                    <Text className="text-lg font-bold text-slate-900 mb-4">
                        {t('referrals.howItWorks')}
                    </Text>

                    <View className="flex-row items-start mb-3">
                        <View className="w-8 h-8 rounded-full bg-amber-500 items-center justify-center">
                            <Text className="text-white font-bold">1</Text>
                        </View>
                        <View className="flex-1 ml-3">
                            <Text className="text-base font-semibold text-slate-900">
                                {t('referrals.step1Title')}
                            </Text>
                            <Text className="text-sm text-slate-500">
                                {t('referrals.step1Desc')}
                            </Text>
                        </View>
                    </View>

                    <View className="flex-row items-start mb-3">
                        <View className="w-8 h-8 rounded-full bg-orange-500 items-center justify-center">
                            <Text className="text-white font-bold">2</Text>
                        </View>
                        <View className="flex-1 ml-3">
                            <Text className="text-base font-semibold text-slate-900">
                                {t('referrals.step2Title')}
                            </Text>
                            <Text className="text-sm text-slate-500">
                                {t('referrals.step2Desc')}
                            </Text>
                        </View>
                    </View>

                    <View className="flex-row items-start">
                        <View className="w-8 h-8 rounded-full bg-green-500 items-center justify-center">
                            <Text className="text-white font-bold">3</Text>
                        </View>
                        <View className="flex-1 ml-3">
                            <Text className="text-base font-semibold text-slate-900">
                                {t('referrals.step3Title')}
                            </Text>
                            <Text className="text-sm text-slate-500">
                                {t('referrals.step3Desc')}
                            </Text>
                        </View>
                    </View>
                </MotiView>

                {/* Referral History */}
                <Text className="text-lg font-bold text-slate-900 mb-3 mt-2">
                    {t('referrals.history')}
                </Text>

                {data?.referrals && data.referrals.length > 0 ? (
                    <View className="pb-28">
                        {data.referrals.map((ref, index) => (
                            <MotiView
                                key={ref.id}
                                from={{ opacity: 0, translateX: -20 }}
                                animate={{ opacity: 1, translateX: 0 }}
                                transition={{ delay: 250 + index * 50 }}
                                className="bg-white rounded-2xl p-4 mb-3 border border-slate-100 flex-row items-center"
                            >
                                <View
                                    className={`w-12 h-12 rounded-full items-center justify-center ${
                                        ref.status === 'completed'
                                            ? 'bg-green-100'
                                            : ref.status === 'pending'
                                              ? 'bg-amber-100'
                                              : 'bg-slate-100'
                                    }`}
                                >
                                    {ref.status === 'completed' ? (
                                        <CheckCircleIcon size={24} color="#22c55e" />
                                    ) : ref.status === 'pending' ? (
                                        <ClockIcon size={24} color="#f59e0b" />
                                    ) : (
                                        <UsersIcon size={24} color="#64748b" />
                                    )}
                                </View>

                                <View className="flex-1 ml-4">
                                    <Text className="text-base font-semibold text-slate-900">
                                        {ref.name}
                                    </Text>
                                    <Text className="text-xs text-slate-500">
                                        {t('referrals.joined')} {formatDate(ref.joined_at)}
                                    </Text>
                                </View>

                                <View className="items-end">
                                    <Text
                                        className={`text-base font-bold ${
                                            ref.status === 'completed'
                                                ? 'text-green-600'
                                                : 'text-slate-400'
                                        }`}
                                    >
                                        {ref.earned > 0
                                            ? `+${formatCurrency(ref.earned)}`
                                            : t('referrals.pending')}
                                    </Text>
                                    <Text
                                        className={`text-xs capitalize ${
                                            ref.status === 'completed'
                                                ? 'text-green-500'
                                                : ref.status === 'pending'
                                                  ? 'text-amber-500'
                                                  : 'text-slate-400'
                                        }`}
                                    >
                                        {ref.status}
                                    </Text>
                                </View>
                            </MotiView>
                        ))}
                    </View>
                ) : (
                    <MotiView
                        from={{ opacity: 0, translateY: 20 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        className="items-center py-12 mb-28"
                    >
                        <View className="w-20 h-20 rounded-full bg-amber-100 items-center justify-center mb-4">
                            <UsersIcon size={40} color="#f59e0b" />
                        </View>
                        <Text className="text-lg font-bold text-slate-900 mb-2">
                            {t('referrals.noReferrals')}
                        </Text>
                        <Text className="text-slate-500 text-center px-8">
                            {t('referrals.noReferralsDesc')}
                        </Text>
                    </MotiView>
                )}
            </ScrollView>
        </View>
    );
};

export default ReferralsScreen;
