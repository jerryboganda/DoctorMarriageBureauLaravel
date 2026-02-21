import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, RefreshControl, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView, AnimatePresence } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import Background from '../components/Background';
import { api } from '../utils/api';
import { useAuthStore } from '../stores/authStore';
import { 
  EyeIcon, ChevronLeftIcon, UserIcon, MapPinIcon, BriefcaseIcon, 
  ClockIcon, HeartIcon, MessageCircleIcon, StarIcon, CalendarIcon
} from '../components/Icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

interface ProfileViewer {
  id: number;
  viewer_id: number;
  viewer: {
    id: number;
    first_name: string;
    last_name: string;
    photo: string;
    age: number;
    city: string;
    country: string;
    designation: string;
    verified: boolean;
  };
  viewed_at: string;
  view_count: number;
}

const ProfileViewersScreen = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewers, setViewers] = useState<ProfileViewer[]>([]);
  const [filter, setFilter] = useState<'all' | 'today' | 'week'>('all');

  const fetchViewers = useCallback(async () => {
    try {
      const response = await api.get('/member/my-profile-viewers');
      if (response.data.result && response.data.data) {
        setViewers(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch viewers', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchViewers();
  }, [fetchViewers]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchViewers();
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
        // Show success
      }
    } catch (error) {
      console.error('Failed to send interest', error);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return t('common.justNow');
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const filterViewers = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    switch (filter) {
      case 'today':
        return viewers.filter(v => new Date(v.viewed_at) >= today);
      case 'week':
        return viewers.filter(v => new Date(v.viewed_at) >= weekAgo);
      default:
        return viewers;
    }
  };

  const filteredViewers = filterViewers();

  if (loading) {
    return (
      <View className="flex-1 bg-slate-50">
        <LinearGradient
          colors={['#0ea5e9', '#06b6d4', '#14b8a6']}
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
              <EyeIcon size={40} color="white" />
            </View>
            <ActivityIndicator size="large" color="white" />
            <Text className="text-white/90 mt-4 font-medium">{t('profileViewers.loading')}</Text>
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
        colors={['#0ea5e9', '#06b6d4']}
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
          <Text className="text-xl font-bold text-white">{t('profileViewers.title')}</Text>
          <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
            <EyeIcon size={20} color="white" />
          </View>
        </View>

        {/* Stats */}
        <View className="flex-row justify-center gap-8 pb-4">
          <View className="items-center">
            <Text className="text-3xl font-bold text-white">{viewers.length}</Text>
            <Text className="text-white/70 text-xs">{t('profileViewers.totalViews')}</Text>
          </View>
          <View className="w-px bg-white/30" />
          <View className="items-center">
            <Text className="text-3xl font-bold text-white">
              {viewers.filter(v => {
                const today = new Date();
                const viewDate = new Date(v.viewed_at);
                return viewDate.toDateString() === today.toDateString();
              }).length}
            </Text>
            <Text className="text-white/70 text-xs">{t('profileViewers.today')}</Text>
          </View>
        </View>

        {/* Filter Tabs */}
        <View className="flex-row px-4 pb-4 gap-2">
          {[
            { key: 'all', label: t('profileViewers.allTime') },
            { key: 'week', label: t('profileViewers.thisWeek') },
            { key: 'today', label: t('profileViewers.todayTab') },
          ].map((f) => (
            <TouchableOpacity
              key={f.key}
              onPress={() => {
                Haptics.selectionAsync();
                setFilter(f.key as any);
              }}
              className={`flex-1 py-2 rounded-full items-center ${
                filter === f.key ? 'bg-white' : 'bg-white/20'
              }`}
            >
              <Text className={filter === f.key ? 'text-cyan-600 font-bold' : 'text-white font-medium'}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView
        className="flex-1 px-4 pt-4"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#0ea5e9" />}
      >
        {filteredViewers.length === 0 ? (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            className="items-center py-20"
          >
            <View className="w-24 h-24 rounded-full bg-cyan-100 items-center justify-center mb-4">
              <EyeIcon size={48} color="#0ea5e9" />
            </View>
            <Text className="text-xl font-bold text-slate-900 mb-2">{t('profileViewers.noViews')}</Text>
            <Text className="text-slate-500 text-center px-8">
              {filter === 'today' 
                ? t('profileViewers.noViewsToday')
                : filter === 'week'
                ? t('profileViewers.noViewsWeek')
                : t('profileViewers.noViewsAll')}
            </Text>
          </MotiView>
        ) : (
          <View className="pb-28">
            {filteredViewers.map((viewer, index) => (
              <MotiView
                key={viewer.id}
                from={{ opacity: 0, translateX: -20 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ delay: index * 50 }}
              >
                <TouchableOpacity
                  onPress={() => handleViewProfile(viewer.viewer?.id || viewer.viewer_id)}
                  className="bg-white rounded-2xl p-4 mb-3 border border-slate-100 flex-row items-center"
                >
                  {/* Photo */}
                  <View className="relative">
                    {viewer.viewer?.photo ? (
                      <Image source={{ uri: viewer.viewer.photo }} className="w-16 h-16 rounded-full" />
                    ) : (
                      <View className="w-16 h-16 rounded-full bg-slate-200 items-center justify-center">
                        <UserIcon size={28} color="#94a3b8" />
                      </View>
                    )}
                    {viewer.viewer?.verified && (
                      <View className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-cyan-500 items-center justify-center border-2 border-white">
                        <StarIcon size={12} color="white" />
                      </View>
                    )}
                  </View>

                  {/* Info */}
                  <View className="flex-1 ml-4">
                    <Text className="text-base font-bold text-slate-900">
                      {viewer.viewer?.first_name} {viewer.viewer?.last_name}
                    </Text>
                    
                    <View className="flex-row items-center mt-1">
                      <MapPinIcon size={12} color="#64748b" />
                      <Text className="text-slate-500 text-xs ml-1">
                        {viewer.viewer?.city || viewer.viewer?.country || t('profileViewers.locationHidden')}
                      </Text>
                    </View>

                    {viewer.viewer?.designation && (
                      <View className="flex-row items-center mt-0.5">
                        <BriefcaseIcon size={12} color="#64748b" />
                        <Text className="text-slate-500 text-xs ml-1" numberOfLines={1}>
                          {viewer.viewer.designation}
                        </Text>
                      </View>
                    )}

                    <View className="flex-row items-center mt-2">
                      <ClockIcon size={12} color="#0ea5e9" />
                      <Text className="text-cyan-600 text-xs font-medium ml-1">
                        {formatTimeAgo(viewer.viewed_at)}
                      </Text>
                      {viewer.view_count > 1 && (
                        <Text className="text-slate-400 text-xs ml-2">
                          ({viewer.view_count} views)
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Actions */}
                  <View className="flex-col gap-2">
                    <TouchableOpacity
                      onPress={() => handleSendInterest(viewer.viewer?.id || viewer.viewer_id, viewer.viewer?.first_name || '')}
                      className="w-10 h-10 rounded-full bg-pink-100 items-center justify-center"
                    >
                      <HeartIcon size={18} color="#ec4899" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => router.push(`/chat/${viewer.viewer?.id || viewer.viewer_id}`)}
                      className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center"
                    >
                      <MessageCircleIcon size={18} color="#3b82f6" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </MotiView>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default ProfileViewersScreen;
