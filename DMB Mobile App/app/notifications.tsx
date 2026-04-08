import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Image, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView, AnimatePresence } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';

import { api } from '../utils/api';
import { useAuthStore } from '../stores/authStore';
import { 
  BellIcon, CheckIcon, CheckCircleIcon, ChevronLeftIcon, 
  TrashIcon, MailIcon, StarIcon, ShieldIcon, HeartIcon
} from '../components/Icons';

interface NotificationItem {
    id: string;
    title: string;
    desc: string;
    time: string;
    read: boolean;
    avatar: string;
    type: string;
    data?: any;
}

const sanitizeNotification = (item: any): NotificationItem => ({
    id: String(item?.id ?? Math.random().toString()),
    title: String(item?.title ?? 'Notification'),
    desc: String(item?.desc ?? item?.message ?? ''),
    time: String(item?.time ?? ''),
    read: !!item?.read,
    avatar: String(item?.avatar ?? item?.photo ?? ''),
    type: String(item?.type ?? 'system'),
    data: item?.data
});

export default function NotificationsScreen() {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);

    const fetchNotifications = useCallback(async () => {
        try {
            const response = await api.get('/member/notifications/feed');
            const result = response.data;
            // Support both direct array or paginated response structure
            const rawData = result.notifications?.data || result.data || [];
            setNotifications(Array.isArray(rawData) ? rawData.map(sanitizeNotification) : []);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchNotifications();
    };

    const markAllRead = async () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        try {
            await api.post('/member/notifications/mark-read');
            // Update local state
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (error) {
            console.error('Failed to mark all as read', error);
            Alert.alert(t('common.error'), t('notifications.markReadError'));
        }
    };

    const handleRead = async (id: string, item: NotificationItem) => {
        if (item.read) return; // Already read
        
        try {
            // Optimistic update
            setNotifications(prev => prev.map(n => 
                n.id === id ? { ...n, read: true } : n
            ));
            // Currently backend API for single read might differ, assuming mark-read works for all or we might need a specific endpoint
            // If the backend toggles or marks single read, implement here. 
            // For now, we will leave it as UI update only if there's no single read endpoint
        } catch (error) {
            console.error('Failed to mark as read', error);
        }
    };

    const getIconForType = (type: string) => {
        switch (type) {
            case 'interest': return <HeartIcon size={16} color="#ef4444" />;
            case 'message': return <MailIcon size={16} color="#3b82f6" />;
            case 'system': return <ShieldIcon size={16} color="#64748b" />;
            case 'match': return <StarIcon size={16} color="#f59e0b" />;
            default: return <BellIcon size={16} color="#64748b" />;
        }
    };

    const displayedNotifications = notifications.filter(n => {
        if (activeTab === 'unread') return !n.read;
        return true;
    });

    const renderItem = ({ item, index }: { item: NotificationItem; index: number }) => {
        const isUnread = !item.read;
        
        return (
            <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 300, delay: index * 50 }}
            >
                <TouchableOpacity 
                    onPress={() => handleRead(item.id, item)}
                    activeOpacity={0.7}
                    className={`flex-row p-4 border-b border-slate-100 ${isUnread ? 'bg-blue-50/50' : 'bg-white'}`}
                >
                    {/* Avatar / Icon */}
                    <View className="mr-3 relative">
                        {item.avatar ? (
                            <Image 
                                source={{ uri: item.avatar }} 
                                className="w-12 h-12 rounded-full bg-slate-200"
                            />
                        ) : (
                            <View className="w-12 h-12 rounded-full bg-slate-100 items-center justify-center">
                                <BellIcon size={20} color="#94a3b8" />
                            </View>
                        )}
                        {/* Type Badge */}
                        <View className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-sm">
                            {getIconForType(item.type)}
                        </View>
                        {isUnread && (
                            <View className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
                        )}
                    </View>

                    {/* Content */}
                    <View className="flex-1 justify-center">
                        <Text className={`text-sm ${isUnread ? 'font-bold text-slate-900' : 'text-slate-700'}`}>
                            {item.title && item.title !== 'Notification' ? `${item.title}: ` : ''}{item.desc}
                        </Text>
                        <View className="flex-row items-center mt-1 gap-2">
                            <Text className="text-xs text-slate-400">{item.time}</Text>
                            {isUnread && (
                                <Text className="text-xs text-blue-600 font-bold">{t('common.new')}</Text>
                            )}
                        </View>
                    </View>
                </TouchableOpacity>
            </MotiView>
        );
    };

    return (
        <View className="flex-1 bg-white">
            <LinearGradient
                colors={['#1e3a8a', '#3b82f6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ paddingTop: insets.top, paddingBottom: 16 }}
                className="px-4"
            >
                <View className="flex-row items-center justify-between py-4">
                    <TouchableOpacity 
                        onPress={() => router.back()}
                        className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
                    >
                        <ChevronLeftIcon size={24} color="white" />
                    </TouchableOpacity>
                    
                    <Text className="text-white text-lg font-bold">{t('notifications.title')}</Text>
                    
                    <TouchableOpacity 
                        onPress={markAllRead}
                        className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
                    >
                        <CheckCircleIcon size={20} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Filter Tabs */}
                <View className="flex-row gap-3 mt-2">
                    <TouchableOpacity 
                        onPress={() => setActiveTab('all')}
                        className={`px-4 py-1.5 rounded-full ${activeTab === 'all' ? 'bg-white' : 'bg-white/20'}`}
                    >
                        <Text className={`text-xs font-bold ${activeTab === 'all' ? 'text-blue-600' : 'text-white'}`}>
                            {t('notifications.allActivity')}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={() => setActiveTab('unread')}
                        className={`px-4 py-1.5 rounded-full ${activeTab === 'unread' ? 'bg-white' : 'bg-white/20'}`}
                    >
                        <Text className={`text-xs font-bold ${activeTab === 'unread' ? 'text-blue-600' : 'text-white'}`}>
                            {t('notifications.unread')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#3b82f6" />
                </View>
            ) : displayedNotifications.length === 0 ? (
                <View className="flex-1 items-center justify-center p-8">
                    <View className="w-20 h-20 bg-slate-50 rounded-full items-center justify-center mb-4">
                        <BellIcon size={40} color="#cbd5e1" />
                    </View>
                    <Text className="text-slate-900 font-bold text-lg mb-2">{t('notifications.empty')}</Text>
                    <Text className="text-slate-500 text-center text-sm">
                        {t('notifications.emptyDesc')}
                    </Text>
                </View>
            ) : (
                <FlashList
                    data={displayedNotifications}
                    renderItem={renderItem}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#3b82f6" />
                    }
                    contentContainerStyle={{ paddingBottom: 40 }}
                />
            )}
        </View>
    );
}
