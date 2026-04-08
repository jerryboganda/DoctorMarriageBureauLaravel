import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import Background from '../components/Background';
import { api } from '../utils/api';
import { useAuthStore } from '../stores/authStore';
import { 
  SmartphoneIcon, ChevronLeftIcon, TrashIcon, CheckCircleIcon, 
  MonitorIcon, TabletIcon, GlobeIcon, ClockIcon, MapPinIcon
} from '../components/Icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';

interface Device {
  id: number;
  device_name: string;
  device_type: 'mobile' | 'tablet' | 'desktop' | 'web';
  browser?: string;
  os?: string;
  ip_address: string;
  location?: string;
  last_active: string;
  is_current: boolean;
  created_at: string;
}

const DevicesScreen = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [revoking, setRevoking] = useState<number | null>(null);

  const fetchDevices = useCallback(async () => {
    try {
      const response = await api.get('/member/account/security-status');
      if (response.data.result && response.data.data?.devices) {
        setDevices(response.data.data.devices);
      }
    } catch (error) {
      console.error('Failed to fetch devices', error);
      // Set mock data for demo
      setDevices([
        {
          id: 1,
          device_name: 'Current Device',
          device_type: 'mobile',
          browser: 'Expo App',
          os: 'iOS 17',
          ip_address: '192.168.1.1',
          location: 'Lahore, Pakistan',
          last_active: new Date().toISOString(),
          is_current: true,
          created_at: new Date().toISOString(),
        }
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDevices();
  };

  const handleRevokeDevice = async (device: Device) => {
    if (device.is_current) {
      Alert.alert(
        t('devices.signOut'),
        t('devices.signOutCurrentMsg'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('devices.signOut'),
            style: 'destructive',
            onPress: async () => {
              await logout();
              router.replace('/login');
            },
          },
        ]
      );
      return;
    }

    Alert.alert(
      t('devices.revokeAccess'),
      t('devices.revokeMsg', { name: device.device_name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('devices.revoke'),
          style: 'destructive',
          onPress: async () => {
            setRevoking(device.id);
            try {
              await api.delete(`/member/account/devices/${device.id}`);
              setDevices(prev => prev.filter(d => d.id !== device.id));
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              Alert.alert(t('common.error'), t('devices.revokeFailed'));
            } finally {
              setRevoking(null);
            }
          },
        },
      ]
    );
  };

  const handleRevokeAll = () => {
    Alert.alert(
      t('devices.signOutAll'),
      t('devices.signOutAllMsg'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('devices.signOutAllBtn'),
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete('/member/account/devices-others');
              await logout();
              router.replace('/login');
            } catch (error) {
              Alert.alert(t('common.error'), t('devices.signOutAllFailed'));
            }
          },
        },
      ]
    );
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile':
        return <SmartphoneIcon size={24} color="#3b82f6" />;
      case 'tablet':
        return <TabletIcon size={24} color="#8b5cf6" />;
      case 'desktop':
        return <MonitorIcon size={24} color="#10b981" />;
      case 'web':
        return <GlobeIcon size={24} color="#f59e0b" />;
      default:
        return <SmartphoneIcon size={24} color="#64748b" />;
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
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <View className="flex-1 bg-slate-50">
        <LinearGradient
          colors={['#1e3a8a', '#3b82f6', '#60a5fa']}
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
              <SmartphoneIcon size={40} color="white" />
            </View>
            <ActivityIndicator size="large" color="white" />
            <Text className="text-white/90 mt-4 font-medium">{t('devices.loading')}</Text>
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
        colors={['#1e3a8a', '#3b82f6']}
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
          <Text className="text-xl font-bold text-white">{t('devices.title')}</Text>
          <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
            <SmartphoneIcon size={20} color="white" />
          </View>
        </View>

        {/* Stats */}
        <View className="flex-row justify-center gap-8 pb-6">
          <View className="items-center">
            <Text className="text-3xl font-bold text-white">{devices.length}</Text>
            <Text className="text-white/70 text-xs">{t('devices.devices')}</Text>
          </View>
          <View className="w-px bg-white/30" />
          <View className="items-center">
            <Text className="text-3xl font-bold text-white">
              {devices.filter(d => {
                const lastActive = new Date(d.last_active);
                const now = new Date();
                return (now.getTime() - lastActive.getTime()) < 24 * 60 * 60 * 1000;
              }).length}
            </Text>
            <Text className="text-white/70 text-xs">{t('devices.activeToday')}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        className="flex-1 px-4 pt-4"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#3b82f6" />}
      >
        {/* Security Note */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          className="bg-blue-50 rounded-2xl p-4 mb-4 border border-blue-100"
        >
          <Text className="text-blue-800 text-sm">
            🔒 {t('devices.securityNote')}
          </Text>
        </MotiView>

        {/* Devices List */}
        {devices.map((device, index) => (
          <MotiView
            key={device.id}
            from={{ opacity: 0, translateX: -20 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ delay: index * 50 }}
            className="bg-white rounded-2xl p-4 mb-3 border border-slate-100"
          >
            <View className="flex-row items-start">
              {/* Device Icon */}
              <View className={`w-14 h-14 rounded-xl items-center justify-center ${
                device.is_current ? 'bg-blue-100' : 'bg-slate-100'
              }`}>
                {getDeviceIcon(device.device_type)}
              </View>

              {/* Device Info */}
              <View className="flex-1 ml-4">
                <View className="flex-row items-center">
                  <Text className="text-base font-bold text-slate-900">{device.device_name}</Text>
                  {device.is_current && (
                    <View className="ml-2 bg-emerald-100 px-2 py-0.5 rounded-full flex-row items-center">
                      <CheckCircleIcon size={10} color="#10b981" />
                      <Text className="text-emerald-600 text-xs font-semibold ml-1">{t('devices.current')}</Text>
                    </View>
                  )}
                </View>
                
                {device.os && (
                  <Text className="text-slate-500 text-sm mt-0.5">
                    {device.browser} on {device.os}
                  </Text>
                )}

                <View className="flex-row items-center mt-2">
                  <ClockIcon size={12} color="#94a3b8" />
                  <Text className="text-slate-400 text-xs ml-1">
                    {t('devices.lastActive')}: {formatTimeAgo(device.last_active)}
                  </Text>
                </View>

                {device.location && (
                  <View className="flex-row items-center mt-1">
                    <MapPinIcon size={12} color="#94a3b8" />
                    <Text className="text-slate-400 text-xs ml-1">{device.location}</Text>
                  </View>
                )}
              </View>

              {/* Revoke Button */}
              <TouchableOpacity
                onPress={() => handleRevokeDevice(device)}
                disabled={revoking === device.id}
                className={`w-10 h-10 rounded-full items-center justify-center ${
                  device.is_current ? 'bg-slate-100' : 'bg-red-50'
                }`}
              >
                {revoking === device.id ? (
                  <ActivityIndicator size="small" color="#ef4444" />
                ) : (
                  <TrashIcon size={18} color={device.is_current ? '#64748b' : '#ef4444'} />
                )}
              </TouchableOpacity>
            </View>
          </MotiView>
        ))}

        {/* Sign Out All Button */}
        {devices.length > 1 && (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 200 }}
            className="mt-4"
          >
            <TouchableOpacity
              onPress={handleRevokeAll}
              className="bg-red-50 border border-red-200 rounded-2xl py-4 items-center"
            >
              <Text className="text-red-600 font-bold">{t('devices.signOutAll')}</Text>
            </TouchableOpacity>
          </MotiView>
        )}

        <View className="h-28" />
      </ScrollView>
    </View>
  );
};

export default DevicesScreen;
