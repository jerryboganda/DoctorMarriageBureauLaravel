import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import Background from '../components/Background';
import { api, getProfileImageUrl } from '../utils/api';
import { 
  ChevronLeftIcon, ShieldOffIcon, UserIcon, XCircleIcon, 
  CheckCircleIcon, AlertTriangleIcon, CalendarIcon
} from '../components/Icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';

interface BlockedUser {
  id: number;
  blocked_user: {
    id: number;
    first_name: string;
    last_name: string;
    photo: string;
  };
  reason?: string;
  created_at: string;
}

const BlockedUsersScreen = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [unblockingId, setUnblockingId] = useState<number | null>(null);

  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  const fetchBlockedUsers = async () => {
    try {
      // Note: "blocked" users are stored as "ignored" users in the backend
      const response = await api.get('/member/ignored-user-list');
      if (response.data.result) {
        // Map ignored_user to blocked_user for compatibility
        const mappedData = (response.data.data || []).map((item: any) => ({
          ...item,
          blocked_user: item.ignored_user || item.blocked_user
        }));
        setBlockedUsers(mappedData);
      }
    } catch (error) {
      console.error('Error fetching blocked users:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBlockedUsers();
  }, []);

  const handleUnblock = (user: BlockedUser) => {
    Alert.alert(
      t('blockedUsers.unblockTitle'),
      t('blockedUsers.unblockConfirm', { name: user.blocked_user.first_name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('blockedUsers.unblock'),
          onPress: async () => {
            setUnblockingId(user.id);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

            try {
              // Unblock = remove from ignored list
              const response = await api.post('/member/remove-from-ignored-list', { user_id: user.blocked_user.id });
              if (response.data.result) {
                setBlockedUsers(prev => prev.filter(b => b.id !== user.id));
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              } else {
                Alert.alert(t('common.error'), response.data.message || t('blockedUsers.unblockFailed'));
              }
            } catch (error: any) {
              Alert.alert(t('common.error'), error.response?.data?.message || t('blockedUsers.unblockFailed'));
            } finally {
              setUnblockingId(null);
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      <Background />

      {/* Header */}
      <LinearGradient
        colors={['#7f1d1d', '#dc2626']}
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
          <Text className="text-xl font-bold text-white">{t('blockedUsers.title')}</Text>
          <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
            <ShieldOffIcon size={20} color="white" />
          </View>
        </View>

        <View className="items-center pb-6">
          <Text className="text-white/80 text-sm text-center px-8">
            {t('blockedUsers.subtitle')}
          </Text>
          <View className="mt-3 bg-white/20 px-4 py-2 rounded-full">
            <Text className="text-white font-semibold">{t('blockedUsers.blockedCount', { count: blockedUsers.length })}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        className="flex-1 px-4 pt-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#dc2626']} />
        }
      >
        {/* Info Box */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          className="bg-amber-50 rounded-2xl p-4 mb-4 flex-row items-start"
        >
          <AlertTriangleIcon size={24} color="#f59e0b" />
          <View className="flex-1 ml-3">
            <Text className="text-amber-800 font-semibold mb-1">{t('blockedUsers.aboutBlocking')}</Text>
            <Text className="text-amber-700 text-sm">
              {t('blockedUsers.aboutBlockingDesc')}
            </Text>
          </View>
        </MotiView>

        {blockedUsers.length === 0 ? (
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="items-center justify-center py-20"
          >
            <View className="w-24 h-24 rounded-full bg-slate-200 items-center justify-center mb-4">
              <CheckCircleIcon size={48} color="#22c55e" />
            </View>
            <Text className="text-xl font-bold text-slate-900 mb-2">{t('blockedUsers.noBlocked')}</Text>
            <Text className="text-slate-500 text-center px-8">
              {t('blockedUsers.noBlockedDesc')}
            </Text>
          </MotiView>
        ) : (
          blockedUsers.map((item, index) => (
            <MotiView
              key={item.id}
              from={{ opacity: 0, translateX: -20 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ delay: index * 50 }}
              className="mb-3"
            >
              <View className="bg-white rounded-2xl p-4 shadow-sm flex-row items-center">
                {/* Profile Image */}
                {item.blocked_user.photo ? (
                  <Image
                    source={{ uri: getProfileImageUrl(item.blocked_user.photo) }}
                    className="w-14 h-14 rounded-full"
                  />
                ) : (
                  <View className="w-14 h-14 rounded-full bg-slate-200 items-center justify-center">
                    <UserIcon size={28} color="#94a3b8" />
                  </View>
                )}

                {/* Info */}
                <View className="flex-1 ml-4">
                  <Text className="text-base font-semibold text-slate-900">
                    {item.blocked_user.first_name} {item.blocked_user.last_name}
                  </Text>
                  {item.reason && (
                    <Text className="text-sm text-slate-500" numberOfLines={1}>
                      {t('blockedUsers.reason')}: {item.reason}
                    </Text>
                  )}
                  <View className="flex-row items-center mt-1">
                    <CalendarIcon size={12} color="#94a3b8" />
                    <Text className="text-xs text-slate-400 ml-1">
                      {t('blockedUsers.blockedOn')} {formatDate(item.created_at)}
                    </Text>
                  </View>
                </View>

                {/* Unblock Button */}
                <TouchableOpacity
                  onPress={() => handleUnblock(item)}
                  disabled={unblockingId === item.id}
                  className="bg-red-100 px-4 py-2 rounded-xl"
                >
                  {unblockingId === item.id ? (
                    <ActivityIndicator size="small" color="#dc2626" />
                  ) : (
                    <Text className="text-red-600 font-semibold">{t('blockedUsers.unblock')}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </MotiView>
          ))
        )}

        <View className="h-28" />
      </ScrollView>
    </View>
  );
};

export default BlockedUsersScreen;
