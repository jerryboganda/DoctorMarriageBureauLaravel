import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Image, Dimensions, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView, AnimatePresence } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { FlashList } from '@shopify/flash-list';
import Background from '../../components/Background';
import { api } from '../../utils/api';
import { useAuthStore } from '../../stores/authStore';
import type { ProfileMatch, IncomingInterest } from '../../types';
import { HeartIcon, MapPinIcon, CheckIcon, ChevronRightIcon, StarIcon, XIcon, BellIcon, UserIcon } from '../../components/Icons';
import Button from '../../components/Button';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';

import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function ProposalsTab() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [incomingInterests, setIncomingInterests] = useState<IncomingInterest[]>([]);

  const fetchIncomingInterests = useCallback(async () => {
    try {
      const response = await api.get('/member/interest-requests');
      const rows = response.data?.data || [];

      const mapped: IncomingInterest[] = rows.map((item: any) => {
        const interestId = Number(item.id);
        const baseScore = Number.isFinite(interestId) ? 75 + (interestId % 20) : 80;
        const ageValue = Number(item.age);
        const age = Number.isFinite(ageValue) ? ageValue : 0;

        return {
          interestId,
          status: item.status,
          profile: {
            id: String(item.user_id ?? ''),
            name: item.name ?? 'Member',
            specialty: item.religion ? `Religion: ${item.religion}` : 'Member',
            hospital: item.mothere_tongue ? `Mother Tongue: ${item.mothere_tongue}` : '',
            location: item.country ?? '',
            age,
            matchPercentage: baseScore,
            avatarUrl: item.photo ?? '',
            isVerified: false
          }
        };
      });

      const pending = mapped.filter((item) => !item.status || item.status === 'Pending');
      setIncomingInterests(pending);
    } catch (error) {
      console.error('Failed to fetch incoming interests', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchIncomingInterests();
  }, [fetchIncomingInterests]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchIncomingInterests();
  };

  const handleAccept = async (interestId: number) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      await api.post('/member/interest-accept', { interest_id: interestId });
      await fetchIncomingInterests();
    } catch (error) {
      console.error('Failed to accept interest', error);
    }
  };

  const handleDecline = async (interestId: number) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    try {
      await api.post('/member/interest-reject', { interest_id: interestId });
      await fetchIncomingInterests();
    } catch (error) {
      console.error('Failed to reject interest', error);
    }
  };

  const renderProfileCard = ({ item, index }: { item: IncomingInterest; index: number }) => {
    const { profile, interestId } = item;

    return (
      <MotiView
        from={{ opacity: 0, translateY: 30, scale: 0.95 }}
        animate={{ opacity: 1, translateY: 0, scale: 1 }}
        transition={{ type: 'spring', damping: 15, delay: index * 80 }}
        className="mb-5"
      >
        <View className="bg-white rounded-3xl overflow-hidden mx-4 shadow-xl shadow-slate-200/60">
          {/* Cover Gradient */}
          <LinearGradient
            colors={['#3b82f6', '#1e3a8a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="h-32 relative"
          >
            {/* Decorative circles */}
            <View className="absolute top-4 left-4 w-20 h-20 rounded-full bg-white/10" />
            <View className="absolute -bottom-6 right-6 w-32 h-32 rounded-full bg-white/5" />

            {/* Match percentage badge */}
            <MotiView
              from={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', delay: index * 80 + 200 }}
              className="absolute top-4 right-4"
            >
              <View className="bg-white px-4 py-2 rounded-full flex-row items-center gap-1.5 shadow-lg">
                <StarIcon size={16} color="#f59e0b" />
                <Text className="text-blue-700 text-sm font-bold">{profile.matchPercentage}%</Text>
              </View>
            </MotiView>

            {/* "New" badge if first item */}
            {index === 0 && (
              <MotiView
                from={{ translateX: -50, opacity: 0 }}
                animate={{ translateX: 0, opacity: 1 }}
                transition={{ delay: 300 }}
                className="absolute top-4 left-4 bg-emerald-500 px-3 py-1 rounded-full"
              >
                <Text className="text-white text-xs font-bold">{t('proposals.new')}</Text>
              </MotiView>
            )}
          </LinearGradient>

          <View className="px-5 pb-6 -mt-12">
            {/* Avatar with border */}
            <MotiView
              from={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', delay: index * 80 + 100 }}
              className="self-start mb-3"
            >
              <View className="p-1.5 bg-white rounded-full shadow-lg">
                {profile.avatarUrl ? (
                  <Image
                    source={{ uri: profile.avatarUrl }}
                    className="w-24 h-24 rounded-full"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 items-center justify-center">
                    <Text className="text-4xl">👤</Text>
                  </View>
                )}
              </View>
            </MotiView>

            {/* Info */}
            <View className="mb-5">
              <Text className="text-2xl font-bold text-slate-900">{profile.name}</Text>
              <Text className="text-blue-600 text-sm font-semibold mt-1">{profile.specialty}</Text>

              <View className="flex-row items-center gap-4 mt-3 flex-wrap">
                <View className="flex-row items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-full">
                  <MapPinIcon size={14} color="#3b82f6" />
                  <Text className="text-slate-600 text-xs font-medium">{profile.location || t('proposals.locationNA')}</Text>
                </View>
                <View className="flex-row items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-full">
                  <Text className="text-sm">🎂</Text>
                  <Text className="text-slate-600 text-xs font-medium">{profile.age ? t('proposals.years', { age: profile.age }) : t('proposals.ageNA')}</Text>
                </View>
              </View>
            </View>

            {/* Actions */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => handleDecline(interestId)}
                className="flex-1 h-14 bg-slate-100 rounded-2xl items-center justify-center flex-row gap-2"
                activeOpacity={0.7}
              >
                <XIcon size={18} color="#64748b" />
                <Text className="text-slate-700 font-bold">{t('proposals.decline')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleAccept(interestId)}
                className="flex-1 h-14 rounded-2xl items-center justify-center flex-row gap-2 overflow-hidden"
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="absolute inset-0"
                />
                <CheckIcon size={20} color="white" />
                <Text className="text-white font-bold">{t('proposals.accept')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </MotiView>
    );
  };

  const EmptyState = () => (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex-1 items-center justify-center px-8 py-20"
    >
      <MotiView
        from={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 10 }}
      >
        <LinearGradient
          colors={['#dbeafe', '#eff6ff']}
          className="w-32 h-32 rounded-full items-center justify-center mb-6"
        >
          <MotiView
            from={{ rotate: '0deg' }}
            animate={{ rotate: '10deg' }}
            transition={{
              type: 'timing',
              duration: 2000,
              loop: true,
            }}
          >
            <HeartIcon size={56} color="#3b82f6" />
          </MotiView>
        </LinearGradient>
      </MotiView>
      <Text className="text-2xl font-bold text-slate-900 text-center mb-3">{t('proposals.noProposalsTitle')}</Text>
      <Text className="text-slate-500 text-center leading-6 max-w-[280px]">
        {t('proposals.noProposalsDesc')}
      </Text>
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: 300 }}
        className="mt-6"
      >
        <TouchableOpacity className="bg-blue-50 px-6 py-3 rounded-full flex-row items-center gap-2">
          <BellIcon size={16} color="#3b82f6" />
          <Text className="text-blue-600 font-semibold">{t('proposals.notifyYou')}</Text>
        </TouchableOpacity>
      </MotiView>
    </MotiView>
  );

  return (
    <View className="flex-1 bg-slate-50">
      <Background />

      {/* Premium Header */}
      <LinearGradient
        colors={['#1e3a8a', '#3b82f6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: insets.top }}
      >
        <View className="px-6 py-5 flex-row justify-between items-start">
          <MotiView
            from={{ opacity: 0, translateY: -10 }}
            animate={{ opacity: 1, translateY: 0 }}
          >
            <Text className="text-sm text-blue-200 font-medium">{t('proposals.welcomeBack')}</Text>
            <Text className="text-2xl font-bold text-white mt-1">{user?.name || 'User'} 👋</Text>
          </MotiView>

          <TouchableOpacity
            onPress={() => router.push('/notifications')}
            className="w-10 h-10 rounded-full bg-white/20 items-center justify-center backdrop-blur-sm"
          >
            <BellIcon size={20} color="white" />
            <View className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white" />
          </TouchableOpacity>
        </View>

        {/* Stats Card */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 100 }}
          className="mx-4 mb-4"
        >
          <View className="bg-white/20 rounded-2xl p-4 backdrop-blur-lg flex-row items-center justify-between">
            <View className="items-center flex-1">
              <Text className="text-3xl font-bold text-white">{incomingInterests.length}</Text>
              <Text className="text-white/70 text-xs mt-1">{t('proposals.pending')}</Text>
            </View>
            <View className="w-px h-10 bg-white/20" />
            <View className="items-center flex-1">
              <Text className="text-3xl font-bold text-white">✨</Text>
              <Text className="text-white/70 text-xs mt-1">{t('proposals.premium')}</Text>
            </View>
            <View className="w-px h-10 bg-white/20" />
            <View className="items-center flex-1">
              <Text className="text-3xl font-bold text-white">💝</Text>
              <Text className="text-white/70 text-xs mt-1">{t('proposals.active')}</Text>
            </View>
          </View>
        </MotiView>

        {/* Curved bottom edge */}
        <View className="h-6 bg-slate-50 rounded-t-3xl" />
      </LinearGradient>

      {/* Complete Profile Reminder */}
      <TouchableOpacity
        onPress={() => router.push('/onboarding')}
        className="mx-6 -mt-3 mb-6 bg-white p-4 rounded-2xl shadow-sm flex-row items-center justify-between border border-blue-100"
      >
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center border border-blue-100">
            <UserIcon size={20} color="#2563eb" />
          </View>
          <View>
            <Text className="font-bold text-slate-900">{t('proposals.completeProfile')}</Text>
            <Text className="text-xs text-slate-500">{t('proposals.getBetterMatches')}</Text>
          </View>
        </View>
        <ChevronRightIcon size={20} color="#94a3b8" />
      </TouchableOpacity>

      {/* Section Title */}
      <View className="px-6 pt-2 pb-4">
        <Text className="text-lg font-bold text-slate-900">{t('proposals.incomingProposals')}</Text>
        <Text className="text-slate-500 text-sm">{t('proposals.interestedInYou')}</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="text-slate-500 mt-3">{t('proposals.loading')}</Text>
        </View>
      ) : incomingInterests.length === 0 ? (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#3b82f6" />
          }
        >
          <EmptyState />
        </ScrollView>
      ) : (
        <FlashList
          data={incomingInterests}
          renderItem={renderProfileCard}
          contentContainerStyle={{ paddingBottom: 120 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#3b82f6" />
          }
          keyExtractor={(item) => String(item.interestId)}
        />
      )}
    </View>
  );
}
