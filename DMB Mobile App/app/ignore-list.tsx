import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import Background from '../components/Background';
import { api, getProfileImageUrl } from '../utils/api';
import { 
  ChevronLeftIcon, EyeOffIcon, UserIcon, RefreshCwIcon,
  CalendarIcon, InfoIcon, BriefcaseIcon, MapPinIcon
} from '../components/Icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';

interface IgnoredUser {
  id: number;
  ignored_user: {
    id: number;
    first_name: string;
    last_name: string;
    photo: string;
    age?: number;
    profession?: string;
    city?: string;
  };
  created_at: string;
}

const IgnoreListScreen = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ignoredUsers, setIgnoredUsers] = useState<IgnoredUser[]>([]);
  const [removingId, setRemovingId] = useState<number | null>(null);

  useEffect(() => {
    fetchIgnoredUsers();
  }, []);

  const fetchIgnoredUsers = async () => {
    try {
      const response = await api.get('/member/ignored-user-list');
      if (response.data.result) {
        setIgnoredUsers(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching ignored users:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchIgnoredUsers();
  }, []);

  const handleRemove = async (item: IgnoredUser) => {
    setRemovingId(item.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const response = await api.post('/member/remove-from-ignored-list', { user_id: item.ignored_user.id });
      if (response.data.result) {
        setIgnoredUsers(prev => prev.filter(i => i.id !== item.id));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert(t('common.error'), response.data.message || t('ignoreList.removeFailed'));
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error.response?.data?.message || t('ignoreList.removeFailed'));
    } finally {
      setRemovingId(null);
    }
  };

  const viewProfile = (userId: number) => {
    router.push(`/member/${userId}`);
  };

  const clearAll = () => {
    if (ignoredUsers.length === 0) return;

    Alert.alert(
      t('ignoreList.clearTitle'),
      t('ignoreList.clearConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('ignoreList.clearAll'),
          style: 'destructive',
          onPress: async () => {
            try {
              // Remove each user one by one since backend doesn't have clear-all
              for (const item of ignoredUsers) {
                await api.post('/member/remove-from-ignored-list', { user_id: item.ignored_user.id });
              }
              setIgnoredUsers([]);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              Alert.alert(t('common.error'), t('ignoreList.clearFailed'));
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
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      <Background />

      {/* Header */}
      <LinearGradient
        colors={['#4338ca', '#6366f1']}
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
          <Text className="text-xl font-bold text-white">{t('ignoreList.title')}</Text>
          {ignoredUsers.length > 0 && (
            <TouchableOpacity
              onPress={clearAll}
              className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
            >
              <RefreshCwIcon size={20} color="white" />
            </TouchableOpacity>
          )}
          {ignoredUsers.length === 0 && (
            <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
              <EyeOffIcon size={20} color="white" />
            </View>
          )}
        </View>

        <View className="items-center pb-6">
          <Text className="text-white/80 text-sm text-center px-8">
            {t('ignoreList.subtitle')}
          </Text>
          <View className="mt-3 bg-white/20 px-4 py-2 rounded-full">
            <Text className="text-white font-semibold">{t('ignoreList.ignoredCount', { count: ignoredUsers.length })}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        className="flex-1 px-4 pt-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6366f1']} />
        }
      >
        {/* Info Box */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          className="bg-indigo-50 rounded-2xl p-4 mb-4 flex-row items-start"
        >
          <InfoIcon size={24} color="#6366f1" />
          <View className="flex-1 ml-3">
            <Text className="text-indigo-800 font-semibold mb-1">{t('ignoreList.ignoreVsBlock')}</Text>
            <Text className="text-indigo-700 text-sm">
              {t('ignoreList.ignoreVsBlockDesc')}
            </Text>
          </View>
        </MotiView>

        {ignoredUsers.length === 0 ? (
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="items-center justify-center py-20"
          >
            <View className="w-24 h-24 rounded-full bg-indigo-100 items-center justify-center mb-4">
              <EyeOffIcon size={48} color="#a5b4fc" />
            </View>
            <Text className="text-xl font-bold text-slate-900 mb-2">{t('ignoreList.noIgnored')}</Text>
            <Text className="text-slate-500 text-center px-8">
              {t('ignoreList.noIgnoredDesc')}
            </Text>
          </MotiView>
        ) : (
          ignoredUsers.map((item, index) => (
            <MotiView
              key={item.id}
              from={{ opacity: 0, translateX: -20 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ delay: index * 50 }}
              className="mb-3"
            >
              <View className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <TouchableOpacity
                  onPress={() => viewProfile(item.ignored_user.id)}
                  className="flex-row p-4"
                >
                  {/* Profile Image */}
                  {item.ignored_user.photo ? (
                    <Image
                      source={{ uri: getProfileImageUrl(item.ignored_user.photo) }}
                      className="w-16 h-16 rounded-xl"
                    />
                  ) : (
                    <View className="w-16 h-16 rounded-xl bg-slate-200 items-center justify-center">
                      <UserIcon size={32} color="#94a3b8" />
                    </View>
                  )}

                  {/* Info */}
                  <View className="flex-1 ml-4 justify-center">
                    <Text className="text-lg font-bold text-slate-900">
                      {item.ignored_user.first_name} {item.ignored_user.last_name}
                    </Text>
                    
                    {item.ignored_user.age && (
                      <Text className="text-sm text-slate-600">
                        {item.ignored_user.age} years old
                      </Text>
                    )}

                    {item.ignored_user.profession && (
                      <View className="flex-row items-center mt-1">
                        <BriefcaseIcon size={12} color="#64748b" />
                        <Text className="text-sm text-slate-500 ml-1" numberOfLines={1}>
                          {item.ignored_user.profession}
                        </Text>
                      </View>
                    )}

                    {item.ignored_user.city && (
                      <View className="flex-row items-center mt-0.5">
                        <MapPinIcon size={12} color="#64748b" />
                        <Text className="text-sm text-slate-500 ml-1">
                          {item.ignored_user.city}
                        </Text>
                      </View>
                    )}

                    <View className="flex-row items-center mt-2">
                      <CalendarIcon size={12} color="#94a3b8" />
                      <Text className="text-xs text-slate-400 ml-1">
                        {t('ignoreList.ignoredOn')} {formatDate(item.created_at)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Actions */}
                <View className="flex-row border-t border-slate-100">
                  <TouchableOpacity
                    onPress={() => viewProfile(item.ignored_user.id)}
                    className="flex-1 py-3 items-center border-r border-slate-100"
                  >
                    <Text className="text-indigo-600 font-semibold">{t('ignoreList.viewProfile')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleRemove(item)}
                    disabled={removingId === item.id}
                    className="flex-1 py-3 items-center"
                  >
                    {removingId === item.id ? (
                      <ActivityIndicator size="small" color="#10b981" />
                    ) : (
                      <Text className="text-emerald-600 font-semibold">{t('common.remove')}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </MotiView>
          ))
        )}

        <View className="h-28" />
      </ScrollView>
    </View>
  );
};

export default IgnoreListScreen;
