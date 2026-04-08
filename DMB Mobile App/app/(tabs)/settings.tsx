import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert, ActivityIndicator, Dimensions, Modal, TextInput, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { SvgXml } from 'react-native-svg';
import { Buffer } from 'buffer';
import Background from '../../components/Background';
import Button from '../../components/Button';
import { api } from '../../utils/api';
import { useAuthStore } from '../../stores/authStore';
import {
  SettingsIcon, ShieldIcon, LockIcon, UserIcon, ChevronRightIcon, BellIcon, EyeOffIcon, LogOutIcon,
  SmartphoneIcon, WalletIcon, GiftIcon, LifeBuoyIcon, BookmarkIcon, EyeIcon, KeyIcon, TrashIcon, GlobeIcon
} from '../../components/Icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import * as SecureStore from 'expo-secure-store';
import { I18nManager } from 'react-native';
import * as Updates from 'expo-updates';

const { width } = Dimensions.get('window');

const SettingRow = ({
  icon,
  title,
  subtitle,
  onPress,
  hasToggle,
  toggleValue,
  onToggle,
  danger,
  iconBgColor = 'bg-slate-100',
  iconColor = '#64748b',
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  hasToggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (value: boolean) => void;
  danger?: boolean;
  iconBgColor?: string;
  iconColor?: string;
}) => (
  <TouchableOpacity
    onPress={() => {
      if (!hasToggle) {
        Haptics.selectionAsync();
        onPress?.();
      }
    }}
    disabled={hasToggle}
    className="flex-row items-center py-4 border-b border-slate-50 last:border-b-0"
    activeOpacity={0.7}
  >
    <View className={`w-11 h-11 rounded-xl items-center justify-center mr-4 ${danger ? 'bg-red-50' : iconBgColor}`}>
      {icon}
    </View>
    <View className="flex-1">
      <Text className={`font-semibold text-[15px] ${danger ? 'text-red-600' : 'text-slate-900'}`}>{title}</Text>
      {subtitle && <Text className="text-slate-400 text-xs mt-0.5">{subtitle}</Text>}
    </View>
    {hasToggle ? (
      <Switch
        value={toggleValue}
        onValueChange={(v) => {
          Haptics.selectionAsync();
          onToggle?.(v);
        }}
        trackColor={{ true: '#3b82f6', false: '#e2e8f0' }}
        thumbColor={toggleValue ? '#1e3a8a' : '#f8fafc'}
        ios_backgroundColor="#e2e8f0"
      />
    ) : (
      <View className="w-8 h-8 rounded-full bg-slate-50 items-center justify-center">
        <ChevronRightIcon size={16} color="#94a3b8" />
      </View>
    )}
  </TouchableOpacity>
);

export default function SettingsTab() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { logout, user } = useAuthStore();
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [incognito, setIncognito] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [enabling2FA, setEnabling2FA] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [manualKey, setManualKey] = useState<string | null>(null);
  const [devices, setDevices] = useState<any[]>([]);
  const [notificationSettings, setNotificationSettings] = useState({
    push: true,
    email: true,
    marketing: false,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      // Fetch various settings from different endpoints
      const [securityResponse, visibilityResponse] = await Promise.all([
        api.get('/member/account/security-status').catch(() => null),
        api.get('/member/profile/visibility').catch(() => null),
      ]);

      // Apply settings from backend if available
      if (securityResponse?.data?.data) {
        if (securityResponse.data.data.two_factor_enabled !== undefined) {
          setTwoFactorEnabled(securityResponse.data.data.two_factor_enabled);
        }
        if (securityResponse.data.data.devices) {
          setDevices(securityResponse.data.data.devices);
        }
      }

      if (visibilityResponse?.data?.data) {
        if (visibilityResponse.data.data.incognito !== undefined) {
          setIncognito(visibilityResponse.data.data.incognito);
        }
      }
    } catch (error) {
      console.error('Failed to fetch settings', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageToggle = async () => {
    const newLang = i18n.language === 'ur' ? 'en' : 'ur';
    await SecureStore.setItemAsync('lang', newLang);
    i18n.changeLanguage(newLang);
    const needsRTL = newLang === 'ur';
    if (I18nManager.isRTL !== needsRTL) {
      I18nManager.allowRTL(needsRTL);
      I18nManager.forceRTL(needsRTL);
      Alert.alert(
        t('common.language'),
        newLang === 'ur' ? 'ایپ کو دوبارہ شروع کیا جائے گا' : 'App will restart for layout change',
        [{ text: t('common.ok'), onPress: () => Updates.reloadAsync().catch(() => {}) }]
      );
    }
  };

  const handle2FASetup = async () => {
    try {
      const response = await api.post('/member/account/2fa/setup');
      if (response.data.success || response.data.result) {
        const qrData = response.data.qr_code || response.data.data?.qr_code;
        const key = response.data.manual_entry_key || response.data.data?.manual_entry_key;

        if (qrData && typeof qrData === 'string' && qrData.startsWith('data:image/svg+xml;base64,')) {
          const base64Content = qrData.replace('data:image/svg+xml;base64,', '');
          const xmlContent = Buffer.from(base64Content, 'base64').toString('utf8');
          setQrCode(xmlContent);
        } else {
          // Fallback if not base64 SVG (though backend sends SVG)
          setQrCode(qrData);
        }

        setManualKey(key);
        setShow2FAModal(true);
      }
    } catch (error) {
      Alert.alert(t('settings.alerts.errorTitle'), t('settings.alerts.setup2FAFailed'));
    }
  };

  const handleEnable2FA = async () => {
    if (!otpCode || otpCode.length !== 6) {
      Alert.alert(t('settings.alerts.errorTitle'), t('settings.alerts.invalidCode'));
      return;
    }

    setEnabling2FA(true);
    try {
      const response = await api.post('/member/account/2fa/verify', { code: otpCode });
      if (response.data.result) {
        setTwoFactorEnabled(true);
        setShow2FAModal(false);
        setOtpCode('');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(t('settings.alerts.successTitle'), t('settings.alerts.success2FA'));
      } else {
        Alert.alert(t('settings.alerts.errorTitle'), response.data.message || t('settings.alerts.invalidVerification'));
      }
    } catch (error: any) {
      Alert.alert(t('settings.alerts.errorTitle'), error.response?.data?.message || t('settings.alerts.enable2FAFailed'));
    } finally {
      setEnabling2FA(false);
    }
  };

  const handleDisable2FA = () => {
    Alert.alert(
      t('settings.alerts.disable2FATitle'),
      t('settings.alerts.disable2FAMsg'),
      [
        { text: t('settings.alerts.cancel'), style: 'cancel' },
        {
          text: t('settings.alerts.disable'),
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete('/member/account/2fa');
              setTwoFactorEnabled(false);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            } catch (error) {
              Alert.alert(t('settings.alerts.errorTitle'), t('settings.alerts.disable2FAFailed'));
            }
          },
        },
      ]
    );
  };

  const handleRevokeDevice = async (deviceId: number) => {
    Alert.alert(
      t('settings.alerts.revokeDeviceTitle'),
      t('settings.alerts.revokeDeviceMsg'),
      [
        { text: t('settings.alerts.cancel'), style: 'cancel' },
        {
          text: t('settings.alerts.revoke'),
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/member/account/devices/${deviceId}`);
              setDevices(prev => prev.filter(d => d.id !== deviceId));
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              Alert.alert(t('settings.alerts.errorTitle'), t('settings.alerts.revokeDeviceFailed'));
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      t('settings.alerts.signOutTitle'),
      t('settings.alerts.signOutMsg'),
      [
        { text: t('settings.alerts.cancel'), style: 'cancel' },
        {
          text: t('settings.alerts.signOutBtn'),
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('settings.alerts.deleteAccountTitle'),
      t('settings.alerts.deleteAccountMsg'),
      [
        { text: t('settings.alerts.cancel'), style: 'cancel' },
        {
          text: t('settings.alerts.deleteBtn'),
          style: 'destructive',
          onPress: async () => {
            try {
              await api.post('/member/account/delete');
              await logout();
              router.replace('/login');
            } catch (error: any) {
              Alert.alert(t('settings.alerts.errorTitle'), error.response?.data?.message || t('settings.alerts.deleteAccountFailed'));
            }
          },
        },
      ]
    );
  };

  const toggleIncognito = async (value: boolean) => {
    setIncognito(value);
    try {
      await api.post('/member/profile/visibility', { incognito: value });
    } catch (error) {
      setIncognito(!value); // Revert on error
      console.error('Failed to toggle incognito', error);
    }
  };

  const toggleNotification = async (key: keyof typeof notificationSettings, value: boolean) => {
    setNotificationSettings((prev) => ({ ...prev, [key]: value }));
    try {
      await api.post('/member/notifications/preferences', { [key]: value });
    } catch (error) {
      setNotificationSettings((prev) => ({ ...prev, [key]: !value }));
      console.error('Failed to update notification setting', error);
    }
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
              <SettingsIcon size={40} color="white" />
            </View>
            <ActivityIndicator size="large" color="white" />
            <Text className="text-white/90 mt-4 font-medium">{t('settings.loadingSettings')}</Text>
          </MotiView>
        </LinearGradient>
      </View>
    );
  }

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
        <View className="px-6 py-6">
          <MotiView
            from={{ opacity: 0, translateY: -10 }}
            animate={{ opacity: 1, translateY: 0 }}
          >
            <Text className="text-2xl font-bold text-white">{t('settings.title')}</Text>
            <Text className="text-white/70 text-sm mt-1">{t('settings.subtitle')}</Text>
          </MotiView>
        </View>

        {/* User Card */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 100 }}
          className="mx-4 mb-4 bg-white/20 rounded-2xl p-4 backdrop-blur-lg"
        >
          <View className="flex-row items-center">
            <View className="w-14 h-14 rounded-full bg-white/30 items-center justify-center">
              <UserIcon size={28} color="white" />
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-white font-bold text-lg">{user?.name || 'User'}</Text>
              <Text className="text-white/70 text-sm">{user?.email}</Text>
            </View>
            <View className="bg-white/20 px-3 py-1 rounded-full">
              <Text className="text-white text-xs font-medium">{t('settings.premium')}</Text>
            </View>
          </View>
        </MotiView>

        {/* Curved bottom edge */}
        <View className="h-6 bg-slate-50 rounded-t-3xl" />
      </LinearGradient>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {/* Account Section */}
        <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }}>
          <View className="flex-row items-center mb-3 ml-1">
            <View className="w-6 h-6 rounded-full bg-blue-100 items-center justify-center mr-2">
              <UserIcon size={12} color="#1e3a8a" />
            </View>
            <Text className="text-xs font-bold text-blue-700 uppercase tracking-wider">{t('settings.account.title')}</Text>
          </View>
          <View className="bg-white rounded-2xl px-4 mb-6 shadow-sm">
            <SettingRow
              icon={<UserIcon size={20} color="#3b82f6" />}
              iconBgColor="bg-blue-50"
              title={t('settings.account.editProfile')}
              subtitle={t('settings.account.editProfileDesc')}
              onPress={() => router.push('/(tabs)/profile')}
            />
            <SettingRow
              icon={<LockIcon size={20} color="#8b5cf6" />}
              iconBgColor="bg-violet-50"
              title={t('settings.account.changePassword')}
              subtitle={t('settings.account.changePasswordDesc')}
              onPress={() => router.push('/change-password')}
            />
            <SettingRow
              icon={<ShieldIcon size={20} color="#10b981" />}
              iconBgColor="bg-emerald-50"
              title={t('settings.account.twoFactor')}
              subtitle={twoFactorEnabled ? t('settings.account.twoFactorEnabled') : t('settings.account.twoFactorDisabled')}
              hasToggle
              toggleValue={twoFactorEnabled}
              onToggle={(v) => v ? handle2FASetup() : handleDisable2FA()}
            />
            <SettingRow
              icon={<SmartphoneIcon size={20} color="#0ea5e9" />}
              iconBgColor="bg-cyan-50"
              title={t('settings.account.connectedDevices')}
              subtitle={t('settings.account.devicesConnected', { count: devices.length || 1 })}
              onPress={() => router.push('/devices')}
            />
            <SettingRow
              icon={<GlobeIcon size={20} color="#f59e0b" />}
              iconBgColor="bg-amber-50"
              title={t('settings.account.language')}
              subtitle={i18n.language === 'ur' ? t('settings.account.languageDescUrdu') : t('settings.account.languageDesc')}
              onPress={handleLanguageToggle}
            />
          </View>
        </MotiView>

        {/* Quick Access Section */}
        <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 50 }}>
          <View className="flex-row items-center mb-3 ml-1">
            <View className="w-6 h-6 rounded-full bg-pink-100 items-center justify-center mr-2">
              <BookmarkIcon size={12} color="#ec4899" />
            </View>
            <Text className="text-xs font-bold text-pink-700 uppercase tracking-wider">{t('settings.quickAccess.title')}</Text>
          </View>
          <View className="bg-white rounded-2xl px-4 mb-6 shadow-sm">
            <SettingRow
              icon={<BookmarkIcon size={20} color="#ec4899" />}
              iconBgColor="bg-pink-50"
              title={t('settings.quickAccess.myShortlist')}
              subtitle={t('settings.quickAccess.myShortlistDesc')}
              onPress={() => router.push('/shortlist')}
            />
            <SettingRow
              icon={<EyeIcon size={20} color="#06b6d4" />}
              iconBgColor="bg-cyan-50"
              title={t('settings.quickAccess.profileViewers')}
              subtitle={t('settings.quickAccess.profileViewersDesc')}
              onPress={() => router.push('/profile-viewers')}
            />
            <SettingRow
              icon={<WalletIcon size={20} color="#10b981" />}
              iconBgColor="bg-emerald-50"
              title={t('settings.quickAccess.myWallet')}
              subtitle={t('settings.quickAccess.myWalletDesc')}
              onPress={() => router.push('/wallet')}
            />
            <SettingRow
              icon={<GiftIcon size={20} color="#f59e0b" />}
              iconBgColor="bg-amber-50"
              title={t('settings.quickAccess.referEarn')}
              subtitle={t('settings.quickAccess.referEarnDesc')}
              onPress={() => router.push('/referrals')}
            />
            <SettingRow
              icon={<LifeBuoyIcon size={20} color="#8b5cf6" />}
              iconBgColor="bg-purple-50"
              title={t('settings.quickAccess.supportTickets')}
              subtitle={t('settings.quickAccess.supportTicketsDesc')}
              onPress={() => router.push('/support-tickets')}
            />
            <SettingRow
              icon={<View className="w-5 h-5 items-center justify-center"><Text className="text-base">💕</Text></View>}
              iconBgColor="bg-red-50"
              title={t('settings.quickAccess.interests')}
              subtitle={t('settings.quickAccess.interestsDesc')}
              onPress={() => router.push('/interests')}
            />
            <SettingRow
              icon={<View className="w-5 h-5 items-center justify-center"><Text className="text-base">📷</Text></View>}
              iconBgColor="bg-violet-50"
              title={t('settings.quickAccess.photoGallery')}
              subtitle={t('settings.quickAccess.photoGalleryDesc')}
              onPress={() => router.push('/photo-gallery')}
            />
          </View>
        </MotiView>

        {/* Privacy Section */}
        <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 100 }}>
          <View className="flex-row items-center mb-3 ml-1">
            <View className="w-6 h-6 rounded-full bg-purple-100 items-center justify-center mr-2">
              <EyeOffIcon size={12} color="#7c3aed" />
            </View>
            <Text className="text-xs font-bold text-purple-700 uppercase tracking-wider">{t('settings.privacy.title')}</Text>
          </View>
          <View className="bg-white rounded-2xl px-4 mb-6 shadow-sm">
            <SettingRow
              icon={<EyeOffIcon size={20} color="#7c3aed" />}
              iconBgColor="bg-purple-50"
              title={t('settings.privacy.incognitoMode')}
              subtitle={t('settings.privacy.incognitoDesc')}
              hasToggle
              toggleValue={incognito}
              onToggle={toggleIncognito}
            />
            <SettingRow
              icon={<ShieldIcon size={20} color="#6366f1" />}
              iconBgColor="bg-indigo-50"
              title={t('settings.privacy.privacySettings')}
              subtitle={t('settings.privacy.privacySettingsDesc')}
              onPress={() => router.push('/privacy-settings')}
            />
            <SettingRow
              icon={<View className="w-5 h-5 items-center justify-center"><Text className="text-base">🚫</Text></View>}
              iconBgColor="bg-red-50"
              title={t('settings.privacy.blockedUsers')}
              subtitle={t('settings.privacy.blockedUsersDesc')}
              onPress={() => router.push('/blocked-users')}
            />
            <SettingRow
              icon={<EyeOffIcon size={20} color="#64748b" />}
              iconBgColor="bg-slate-100"
              title={t('settings.privacy.ignoreList')}
              subtitle={t('settings.privacy.ignoreListDesc')}
              onPress={() => router.push('/ignore-list')}
            />
          </View>
        </MotiView>

        {/* Notifications Section */}
        <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 200 }}>
          <View className="flex-row items-center mb-3 ml-1">
            <View className="w-6 h-6 rounded-full bg-amber-100 items-center justify-center mr-2">
              <BellIcon size={12} color="#d97706" />
            </View>
            <Text className="text-xs font-bold text-amber-700 uppercase tracking-wider">{t('settings.notifications.title')}</Text>
          </View>
          <View className="bg-white rounded-2xl px-4 mb-6 shadow-sm">
            <SettingRow
              icon={<BellIcon size={20} color="#f59e0b" />}
              iconBgColor="bg-amber-50"
              title={t('settings.notifications.pushNotifications')}
              subtitle={t('settings.notifications.pushDesc')}
              hasToggle
              toggleValue={notificationSettings.push}
              onToggle={(v) => toggleNotification('push', v)}
            />
            <SettingRow
              icon={<View className="w-5 h-5 items-center justify-center"><Text className="text-base">📧</Text></View>}
              iconBgColor="bg-sky-50"
              title={t('settings.notifications.emailNotifications')}
              subtitle={t('settings.notifications.emailDesc')}
              hasToggle
              toggleValue={notificationSettings.email}
              onToggle={(v) => toggleNotification('email', v)}
            />
            <SettingRow
              icon={<View className="w-5 h-5 items-center justify-center"><Text className="text-base">📣</Text></View>}
              iconBgColor="bg-pink-50"
              title={t('settings.notifications.marketingUpdates')}
              subtitle={t('settings.notifications.marketingDesc')}
              hasToggle
              toggleValue={notificationSettings.marketing}
              onToggle={(v) => toggleNotification('marketing', v)}
            />
          </View>
        </MotiView>

        {/* Danger Zone */}
        <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 300 }}>
          <View className="flex-row items-center mb-3 ml-1">
            <View className="w-6 h-6 rounded-full bg-red-100 items-center justify-center mr-2">
              <LogOutIcon size={12} color="#dc2626" />
            </View>
            <Text className="text-xs font-bold text-red-600 uppercase tracking-wider">{t('settings.dangerZone.title')}</Text>
          </View>
          <View className="bg-white rounded-2xl px-4 mb-6 shadow-sm border border-red-100">
            <SettingRow
              icon={<LogOutIcon size={20} color="#dc2626" />}
              iconBgColor="bg-red-50"
              title={t('settings.dangerZone.signOut')}
              onPress={handleLogout}
              danger
            />
            <SettingRow
              icon={<TrashIcon size={20} color="#dc2626" />}
              iconBgColor="bg-red-50"
              title={t('settings.dangerZone.deleteAccount')}
              subtitle={t('settings.dangerZone.deleteAccountDesc')}
              onPress={() => router.push('/delete-account')}
              danger
            />
          </View>
        </MotiView>

        {/* App Info */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 400 }}
          className="items-center py-8 mb-28"
        >
          <Image
            source={require('../../assets/images/logo.png')}
            style={{ width: 72, height: 72, marginBottom: 10 }}
            resizeMode="contain"
          />
          <Text className="text-slate-600 text-sm font-semibold">{t('settings.appInfo.appName')}</Text>
          <Text className="text-slate-400 text-xs mt-1">{t('settings.appInfo.version')}</Text>
          <Text className="text-slate-300 text-xs mt-3">{t('settings.appInfo.copyright')}</Text>
          <Text className="text-slate-300 text-xs">{t('settings.appInfo.rights')}</Text>
        </MotiView>
      </ScrollView>

      {/* 2FA Setup Modal */}
      <Modal
        visible={show2FAModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShow2FAModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <MotiView
            from={{ translateY: 300 }}
            animate={{ translateY: 0 }}
            className="bg-white rounded-t-3xl p-6"
            style={{ paddingBottom: insets.bottom + 16 }}
          >
            <View className="w-12 h-1 bg-slate-300 rounded-full self-center mb-6" />

            <View className="items-center mb-6">
              <View className="w-16 h-16 rounded-full bg-emerald-100 items-center justify-center mb-4">
                <ShieldIcon size={32} color="#10b981" />
              </View>
              <Text className="text-2xl font-bold text-slate-900">{t('settings.twoFactorModal.title')}</Text>
              <Text className="text-slate-500 text-center mt-2 px-4">
                {t('settings.twoFactorModal.description')}
              </Text>
            </View>

            {/* QR Code Placeholder */}
            <View className="bg-slate-100 rounded-2xl p-8 items-center mb-6">
              {qrCode ? (
                <View className="w-48 h-48 bg-white rounded-xl items-center justify-center overflow-hidden">
                  <SvgXml xml={qrCode} width="100%" height="100%" />
                </View>
              ) : (
                <View className="w-48 h-48 bg-white rounded-xl items-center justify-center">
                  <KeyIcon size={48} color="#94a3b8" />
                  <Text className="text-slate-400 text-xs mt-2">{t('settings.twoFactorModal.loading')}</Text>
                </View>
              )}

              {manualKey && (
                <View className="mt-4 items-center">
                  <Text className="text-xs text-slate-500 font-medium mb-1">{t('settings.twoFactorModal.manualEntryCode')}</Text>
                  <View className="bg-slate-200 px-3 py-2 rounded-lg">
                    <Text className="text-slate-700 font-mono text-sm tracking-widest selectable">{manualKey}</Text>
                  </View>
                </View>
              )}

            </View>

            {/* OTP Input */}
            <View className="mb-6">
              <Text className="text-xs font-bold text-slate-500 uppercase mb-2">{t('settings.twoFactorModal.verificationCode')}</Text>
              <TextInput
                className="bg-slate-100 rounded-xl px-4 py-4 text-center text-2xl font-bold tracking-widest text-slate-900"
                value={otpCode}
                onChangeText={setOtpCode}
                placeholder="000000"
                keyboardType="number-pad"
                maxLength={6}
                placeholderTextColor="#94a3b8"
              />
            </View>

            {/* Buttons */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => {
                  setShow2FAModal(false);
                  setOtpCode('');
                }}
                className="flex-1 bg-slate-200 py-4 rounded-xl items-center"
              >
                <Text className="text-slate-700 font-bold text-lg">{t('settings.twoFactorModal.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleEnable2FA}
                disabled={enabling2FA || otpCode.length !== 6}
                className={`flex-1 py-4 rounded-xl items-center ${enabling2FA || otpCode.length !== 6 ? 'bg-slate-300' : 'bg-emerald-500'
                  }`}
              >
                {enabling2FA ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-bold text-lg">{t('settings.twoFactorModal.enable')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </MotiView>
        </View>
      </Modal>
    </View>
  );
}
