import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import Background from '../components/Background';
import { api } from '../utils/api';
import {
    ChevronLeftIcon,
    ShieldIcon,
    EyeIcon,
    EyeOffIcon,
    UserIcon,
    ImageIcon,
    PhoneIcon,
    MailIcon,
    MapPinIcon,
    LockIcon,
    GlobeIcon,
    UsersIcon,
    CheckCircleIcon,
} from '../components/Icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';

interface PrivacySettings {
    show_profile_photo: boolean;
    show_contact_details: boolean;
    show_email: boolean;
    show_phone: boolean;
    show_location: boolean;
    profile_visible: boolean;
    show_online_status: boolean;
    show_last_seen: boolean;
    allow_messages_from: 'all' | 'matches' | 'none';
    searchable: boolean;
    hide_from_search: boolean;
    block_screenshots: boolean;
}

const PrivacySettingsScreen = () => {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<PrivacySettings>({
        show_profile_photo: true,
        show_contact_details: false,
        show_email: false,
        show_phone: false,
        show_location: true,
        profile_visible: true,
        show_online_status: true,
        show_last_seen: true,
        allow_messages_from: 'matches',
        searchable: true,
        hide_from_search: false,
        block_screenshots: false,
    });

    useEffect(() => {
        fetchPrivacySettings();
    }, []);

    const fetchPrivacySettings = async () => {
        try {
            const response = await api.get('/member/profile/visibility');
            if (response.data.success) {
                setSettings((prev) => ({
                    ...prev,
                    ...response.data.data,
                }));
            }
        } catch (error) {
            console.error('Error fetching privacy settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateSetting = async (key: keyof PrivacySettings, value: any) => {
        const previousValue = settings[key];
        setSettings((prev) => ({ ...prev, [key]: value }));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        try {
            const response = await api.post('/member/profile/visibility', {
                [key]: value,
            });

            if (!response.data.success) {
                // Revert on failure
                setSettings((prev) => ({ ...prev, [key]: previousValue }));
                Alert.alert(
                    t('common.error'),
                    response.data.message || t('privacySettings.updateFailed'),
                );
            }
        } catch (error) {
            setSettings((prev) => ({ ...prev, [key]: previousValue }));
            Alert.alert(t('common.error'), t('privacySettings.updateFailed'));
        }
    };

    const saveAllSettings = async () => {
        setSaving(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            const response = await api.post('/member/profile/visibility', settings);

            if (response.data.success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert(t('common.success'), t('privacySettings.savedSuccess'));
            } else {
                Alert.alert(
                    t('common.error'),
                    response.data.message || t('privacySettings.saveFailed'),
                );
            }
        } catch (error) {
            Alert.alert(t('common.error'), t('privacySettings.saveFailed'));
        } finally {
            setSaving(false);
        }
    };

    const SettingToggle = ({
        icon,
        title,
        description,
        value,
        onToggle,
        dangerous = false,
    }: {
        icon: React.ReactNode;
        title: string;
        description: string;
        value: boolean;
        onToggle: (value: boolean) => void;
        dangerous?: boolean;
    }) => (
        <View className="flex-row items-center py-4 border-b border-slate-100">
            <View
                className={`w-10 h-10 rounded-full items-center justify-center ${
                    dangerous ? 'bg-red-100' : 'bg-blue-100'
                }`}
            >
                {icon}
            </View>
            <View className="flex-1 mx-3">
                <Text className="text-base font-semibold text-slate-900">{title}</Text>
                <Text className="text-xs text-slate-500">{description}</Text>
            </View>
            <Switch
                value={value}
                onValueChange={onToggle}
                trackColor={{ false: '#cbd5e1', true: dangerous ? '#fca5a5' : '#93c5fd' }}
                thumbColor={value ? (dangerous ? '#ef4444' : '#3b82f6') : '#f1f5f9'}
            />
        </View>
    );

    const SettingOption = ({
        icon,
        title,
        description,
        options,
        value,
        onChange,
    }: {
        icon: React.ReactNode;
        title: string;
        description: string;
        options: { label: string; value: string }[];
        value: string;
        onChange: (value: string) => void;
    }) => (
        <View className="py-4 border-b border-slate-100">
            <View className="flex-row items-center mb-3">
                <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center">
                    {icon}
                </View>
                <View className="flex-1 mx-3">
                    <Text className="text-base font-semibold text-slate-900">{title}</Text>
                    <Text className="text-xs text-slate-500">{description}</Text>
                </View>
            </View>
            <View className="flex-row ml-12">
                {options.map((option) => (
                    <TouchableOpacity
                        key={option.value}
                        onPress={() => onChange(option.value)}
                        className={`flex-1 py-2 px-3 rounded-lg mr-2 ${
                            value === option.value ? 'bg-blue-500' : 'bg-slate-100'
                        }`}
                    >
                        <Text
                            className={`text-center text-sm font-medium ${
                                value === option.value ? 'text-white' : 'text-slate-600'
                            }`}
                        >
                            {option.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

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
                    <Text className="text-xl font-bold text-white">
                        {t('privacySettings.title')}
                    </Text>
                    <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
                        <ShieldIcon size={20} color="white" />
                    </View>
                </View>

                <View className="items-center pb-6">
                    <Text className="text-white/80 text-sm text-center px-8">
                        {t('privacySettings.whoCanSee')}
                    </Text>
                </View>
            </LinearGradient>

            <ScrollView className="flex-1 px-4 -mt-4" showsVerticalScrollIndicator={false}>
                {/* Profile Visibility */}
                <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    className="bg-white rounded-2xl p-4 shadow-sm mb-4"
                >
                    <Text className="text-xs font-bold text-slate-500 uppercase mb-2">
                        {t('privacySettings.profileVisibility')}
                    </Text>

                    <SettingToggle
                        icon={<GlobeIcon size={20} color="#3b82f6" />}
                        title={t('privacySettings.profileVisible')}
                        description={t('privacySettings.profileVisibleDesc')}
                        value={settings.profile_visible}
                        onToggle={(v) => updateSetting('profile_visible', v)}
                    />

                    <SettingToggle
                        icon={<ImageIcon size={20} color="#3b82f6" />}
                        title={t('privacySettings.showProfilePhoto')}
                        description={t('privacySettings.showProfilePhotoDesc')}
                        value={settings.show_profile_photo}
                        onToggle={(v) => updateSetting('show_profile_photo', v)}
                    />

                    <SettingToggle
                        icon={<UserIcon size={20} color="#3b82f6" />}
                        title={t('privacySettings.appearInSearch')}
                        description={t('privacySettings.appearInSearchDesc')}
                        value={settings.searchable}
                        onToggle={(v) => updateSetting('searchable', v)}
                    />
                </MotiView>

                {/* Contact Information */}
                <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ delay: 100 }}
                    className="bg-white rounded-2xl p-4 shadow-sm mb-4"
                >
                    <Text className="text-xs font-bold text-slate-500 uppercase mb-2">
                        {t('privacySettings.contactInfo')}
                    </Text>

                    <SettingToggle
                        icon={<PhoneIcon size={20} color="#3b82f6" />}
                        title={t('privacySettings.showPhone')}
                        description={t('privacySettings.showPhoneDesc')}
                        value={settings.show_phone}
                        onToggle={(v) => updateSetting('show_phone', v)}
                    />

                    <SettingToggle
                        icon={<MailIcon size={20} color="#3b82f6" />}
                        title={t('privacySettings.showEmail')}
                        description={t('privacySettings.showEmailDesc')}
                        value={settings.show_email}
                        onToggle={(v) => updateSetting('show_email', v)}
                    />

                    <SettingToggle
                        icon={<MapPinIcon size={20} color="#3b82f6" />}
                        title={t('privacySettings.showLocation')}
                        description={t('privacySettings.showLocationDesc')}
                        value={settings.show_location}
                        onToggle={(v) => updateSetting('show_location', v)}
                    />
                </MotiView>

                {/* Activity Status */}
                <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ delay: 200 }}
                    className="bg-white rounded-2xl p-4 shadow-sm mb-4"
                >
                    <Text className="text-xs font-bold text-slate-500 uppercase mb-2">
                        {t('privacySettings.activityStatus')}
                    </Text>

                    <SettingToggle
                        icon={<EyeIcon size={20} color="#3b82f6" />}
                        title={t('privacySettings.showOnline')}
                        description={t('privacySettings.showOnlineDesc')}
                        value={settings.show_online_status}
                        onToggle={(v) => updateSetting('show_online_status', v)}
                    />

                    <SettingToggle
                        icon={<EyeOffIcon size={20} color="#3b82f6" />}
                        title={t('privacySettings.showLastSeen')}
                        description={t('privacySettings.showLastSeenDesc')}
                        value={settings.show_last_seen}
                        onToggle={(v) => updateSetting('show_last_seen', v)}
                    />
                </MotiView>

                {/* Messaging */}
                <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ delay: 300 }}
                    className="bg-white rounded-2xl p-4 shadow-sm mb-4"
                >
                    <Text className="text-xs font-bold text-slate-500 uppercase mb-2">
                        {t('privacySettings.messaging')}
                    </Text>

                    <SettingOption
                        icon={<UsersIcon size={20} color="#3b82f6" />}
                        title={t('privacySettings.allowMessages')}
                        description={t('privacySettings.allowMessagesDesc')}
                        options={[
                            { label: 'All', value: 'all' },
                            { label: 'Matches', value: 'matches' },
                            { label: 'None', value: 'none' },
                        ]}
                        value={settings.allow_messages_from}
                        onChange={(v) => updateSetting('allow_messages_from', v as any)}
                    />
                </MotiView>

                {/* Security */}
                <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ delay: 400 }}
                    className="bg-white rounded-2xl p-4 shadow-sm mb-4"
                >
                    <Text className="text-xs font-bold text-slate-500 uppercase mb-2">
                        {t('privacySettings.security')}
                    </Text>

                    <SettingToggle
                        icon={<LockIcon size={20} color="#ef4444" />}
                        title={t('privacySettings.blockScreenshots')}
                        description={t('privacySettings.blockScreenshotsDesc')}
                        value={settings.block_screenshots}
                        onToggle={(v) => updateSetting('block_screenshots', v)}
                        dangerous
                    />

                    <SettingToggle
                        icon={<EyeOffIcon size={20} color="#ef4444" />}
                        title={t('privacySettings.hideFromSearch')}
                        description={t('privacySettings.hideFromSearchDesc')}
                        value={settings.hide_from_search}
                        onToggle={(v) => updateSetting('hide_from_search', v)}
                        dangerous
                    />
                </MotiView>

                {/* Save Button */}
                <TouchableOpacity
                    onPress={saveAllSettings}
                    disabled={saving}
                    className="overflow-hidden rounded-xl mb-6"
                >
                    <LinearGradient
                        colors={saving ? ['#94a3b8', '#94a3b8'] : ['#1e3a8a', '#3b82f6']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        className="py-4 items-center flex-row justify-center"
                    >
                        {saving ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <CheckCircleIcon size={20} color="white" />
                                <Text className="text-white font-bold text-lg ml-2">
                                    {t('privacySettings.saveAll')}
                                </Text>
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>

                <View className="h-28" />
            </ScrollView>
        </View>
    );
};

export default PrivacySettingsScreen;
