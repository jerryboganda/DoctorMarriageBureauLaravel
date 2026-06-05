import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Image,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView, AnimatePresence } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import Background from '../../components/Background';
import { api } from '../../utils/api';
import { useAuthStore } from '../../stores/authStore';
import {
    UserIcon,
    BriefcaseIcon,
    HeartIcon,
    CameraIcon,
    CheckIcon,
    SettingsIcon,
    LogOutIcon,
    CoffeeIcon,
    HomeIcon,
    ImageIcon,
    DownloadIcon,
    HistoryIcon,
    SaveIcon,
    TrashIcon,
    UploadIcon,
    ImagePlusIcon,
    MicIcon,
    Volume2Icon,
    PlayCircleIcon,
    SparklesIcon,
} from '../../components/Icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';

const FormSection = ({ title, icon: Icon, children, color = '#3b82f6' }: any) => (
    <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        className="mb-8"
    >
        <View className="flex-row items-center mb-4 px-1">
            <View
                style={{ backgroundColor: `${color}15` }}
                className="w-10 h-10 rounded-2xl items-center justify-center mr-3"
            >
                <Icon size={20} color={color} />
            </View>
            <Text className="text-xl font-bold text-slate-900 tracking-tight">{title}</Text>
        </View>
        <View className="bg-white rounded-[32px] p-6 shadow-sm shadow-slate-200 border border-slate-100">
            {children}
        </View>
    </MotiView>
);

const FormSelect = ({ label, value, options, onChange, color = '#3b82f6' }: any) => (
    <View className="mb-5">
        <Text className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2.5">
            {label}
        </Text>
        <View className="flex-row flex-wrap gap-2">
            {options.map((opt: any) => (
                <TouchableOpacity
                    key={opt.value}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        onChange(opt.value);
                    }}
                    className={`px-4 py-2.5 rounded-2xl border ${
                        value === opt.value
                            ? 'bg-slate-900 border-slate-900'
                            : 'bg-slate-50 border-slate-100'
                    }`}
                >
                    <Text
                        className={`text-sm font-bold ${value === opt.value ? 'text-white' : 'text-slate-600'}`}
                    >
                        {opt.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    </View>
);

const ProfileTab = () => {
    const insets = useSafeAreaInsets();
    const { user, logout } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('basics');
    const [profileData, setProfileData] = useState<any>(null);
    const [qualityScore, setQualityScore] = useState<any>(null);
    const scrollRef = useRef<ScrollView>(null);
    const tabScrollRef = useRef<ScrollView>(null);
    const { t } = useTranslation();

    const profileTabs = [
        { id: 'basics', label: t('profile.tabs.basics'), icon: UserIcon, color: '#3b82f6' },
        { id: 'lifestyle', label: t('profile.tabs.lifestyle'), icon: CoffeeIcon, color: '#8b5cf6' },
        { id: 'career', label: t('profile.tabs.career'), icon: BriefcaseIcon, color: '#10b981' },
        { id: 'family', label: t('profile.tabs.family'), icon: HomeIcon, color: '#f59e0b' },
        {
            id: 'preferences',
            label: t('profile.tabs.preferences'),
            icon: HeartIcon,
            color: '#ef4444',
        },
        { id: 'media', label: t('profile.tabs.media'), icon: ImageIcon, color: '#ec4899' },
    ];

    const fetchProfileData = useCallback(async () => {
        try {
            const { data } = await api.get('/profile/all');
            setProfileData(data.data);
            setQualityScore(data.quality);
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfileData();
    }, [fetchProfileData]);

    const updateField = async (section: string, field: string, value: any) => {
        try {
            setProfileData((prev: any) => ({
                ...prev,
                [section]: { ...prev[section], [field]: value },
            }));

            await api.post('/profile/update', {
                section,
                field,
                value,
            });

            // Refresh quality score after update
            const { data } = await api.get('/profile/quality');
            setQualityScore(data);
        } catch (error) {
            console.error('Update failed:', error);
        }
    };

    const handleImagePick = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled) {
            try {
                setUploading(true);
                const fileUri = result.assets[0].uri;
                const formData = new FormData();
                // @ts-ignore
                formData.append('avatar', {
                    uri: fileUri,
                    type: 'image/jpeg',
                    name: 'avatar.jpg',
                });

                await api.post('/profile/avatar', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });

                Alert.alert(t('profile.alerts.successTitle'), t('profile.alerts.avatarUpdated'));
                // Refresh profile to get new avatar
                fetchProfileData();
            } catch (error) {
                Alert.alert(t('profile.alerts.errorTitle'), t('profile.alerts.uploadFailed'));
            } finally {
                setUploading(false);
            }
        }
    };

    const handleLogout = () => {
        Alert.alert(t('profile.alerts.logoutTitle'), t('profile.alerts.logoutMsg'), [
            { text: t('profile.alerts.cancel'), style: 'cancel' },
            { text: t('profile.alerts.logout'), style: 'destructive', onPress: logout },
        ]);
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await api.post('/profile/update/all', profileData);
            Alert.alert(t('profile.alerts.successTitle'), t('profile.alerts.profileUpdated'));
            fetchProfileData();
        } catch (error) {
            Alert.alert(t('profile.alerts.errorTitle'), t('profile.alerts.saveFailed'));
        } finally {
            setSaving(false);
        }
    };

    const handleDownloadBiodata = async () => {
        try {
            const { data } = await api.get('/profile/biodata/download');
            if (data.url) {
                const fileUri = FileSystem.cacheDirectory + 'biodata.pdf';
                const downloadRes = await FileSystem.downloadAsync(data.url, fileUri);
                await Sharing.shareAsync(downloadRes.uri);
            }
        } catch (error) {
            Alert.alert(t('profile.alerts.errorTitle'), t('profile.alerts.biodataFailed'));
        }
    };

    if (loading) {
        // ... (Loading state remains the same)
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
                            <UserIcon size={40} color="white" />
                        </View>
                        <ActivityIndicator size="large" color="white" />
                        <Text className="text-white/90 mt-4 font-medium">
                            {t('profile.loading')}
                        </Text>
                    </MotiView>
                </LinearGradient>
            </View>
        );
    }

    const basicInfo = profileData?.basic ?? {};
    const lifestyle = profileData?.lifestyle ?? {};
    const careerInfo = profileData?.career ?? {};
    const family = profileData?.family ?? {};
    const preferences = profileData?.preferences ?? {};
    const media = profileData?.media ?? {};

    return (
        <View className="flex-1 bg-slate-50">
            <Background />

            {/* Premium Header with Avatar */}
            <LinearGradient
                colors={['#1e3a8a', '#2563eb']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ paddingTop: insets.top }}
                className="rounded-b-[40px] shadow-2xl z-10"
            >
                {/* Top Bar */}
                <View className="flex-row justify-between items-center px-6 py-4">
                    <TouchableOpacity
                        onPress={() => router.push('/settings')}
                        className="w-10 h-10 rounded-full bg-white/10 items-center justify-center backdrop-blur-md"
                    >
                        <SettingsIcon size={20} color="white" />
                    </TouchableOpacity>
                    <Text className="text-white font-bold text-lg tracking-wide opacity-90">
                        {t('profile.myProfile')}
                    </Text>
                    <TouchableOpacity
                        onPress={handleLogout}
                        className="w-10 h-10 rounded-full bg-white/10 items-center justify-center backdrop-blur-md"
                    >
                        <LogOutIcon size={20} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Avatar Section */}
                <View className="items-center mt-2 mb-8">
                    <MotiView
                        from={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', damping: 12 }}
                        className="relative"
                    >
                        <View className="absolute -inset-4 bg-white/10 rounded-full blur-xl" />

                        <TouchableOpacity
                            onPress={handleImagePick}
                            disabled={uploading}
                            activeOpacity={0.9}
                        >
                            {user?.avatar ? (
                                <Image
                                    source={{ uri: user.avatar }}
                                    className="w-36 h-36 rounded-full border-[5px] border-white shadow-2xl"
                                />
                            ) : (
                                <View className="w-36 h-36 rounded-full bg-slate-200 items-center justify-center border-[5px] border-white shadow-2xl">
                                    <UserIcon size={60} color="#94a3b8" />
                                </View>
                            )}

                            {/* Camera Button */}
                            <View className="absolute bottom-1 right-1 bg-blue-600 w-10 h-10 rounded-full items-center justify-center border-4 border-white shadow-lg">
                                {uploading ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <CameraIcon size={16} color="white" />
                                )}
                            </View>
                        </TouchableOpacity>
                    </MotiView>

                    <View className="items-center mt-5 mb-6">
                        <Text className="text-3xl font-bold text-white tracking-tight text-center shadow-sm">
                            {user?.name || t('profile.yourName')}
                        </Text>
                        <Text className="text-blue-100 text-base font-medium mt-1 opacity-90">
                            {user?.email}
                        </Text>
                    </View>

                    {/* Status Badges Row */}
                    <View className="flex-row items-center justify-center gap-3 mb-8 w-full px-4 flex-wrap">
                        {/* Premium Badge */}
                        <View className="bg-amber-400/20 px-4 py-2 rounded-2xl flex-row items-center border border-amber-400/30 backdrop-blur-md">
                            <SparklesIcon size={14} color="#fbbf24" />
                            <Text className="text-amber-100 text-xs font-bold ml-2 uppercase tracking-wider">
                                {t('profile.premiumMember')}
                            </Text>
                        </View>

                        {/* Quality Score Badge */}
                        {qualityScore && (
                            <View className="bg-emerald-400/20 px-4 py-2 rounded-2xl flex-row items-center border border-emerald-400/30 backdrop-blur-md">
                                <ActivityIndicator
                                    size="small"
                                    color="#34d399"
                                    className={loading ? '' : 'hidden'}
                                />
                                {!loading && <CheckIcon size={14} color="#34d399" />}
                                <Text className="text-emerald-100 text-xs font-bold ml-2 uppercase tracking-wider">
                                    {t('profile.profileScore', { score: qualityScore.total || 0 })}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Action Buttons Dashboard */}
                    <View className="flex-row justify-center gap-4 w-full px-6">
                        <TouchableOpacity
                            onPress={handleDownloadBiodata}
                            className="flex-1 bg-white/10 active:bg-white/20 py-3.5 rounded-2xl flex-row items-center justify-center border border-white/10 backdrop-blur-md"
                        >
                            <DownloadIcon size={18} color="white" />
                            <Text className="text-white text-sm font-bold ml-2.5">
                                {t('profile.downloadBiodata')}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => router.push('/profile-viewers')}
                            className="flex-1 bg-white/10 active:bg-white/20 py-3.5 rounded-2xl flex-row items-center justify-center border border-white/10 backdrop-blur-md"
                        >
                            <HistoryIcon size={18} color="white" />
                            <Text className="text-white text-sm font-bold ml-2.5">
                                {t('profile.profileViewers')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Premium Scrollable Tabs */}
                <View className="bg-slate-50 pt-6 rounded-t-[32px] -mb-1">
                    <ScrollView
                        ref={tabScrollRef}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        className="px-2"
                        contentContainerStyle={{ paddingRight: 20 }}
                    >
                        {profileTabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <TouchableOpacity
                                    key={tab.id}
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        setActiveTab(tab.id);
                                        scrollRef.current?.scrollTo({ y: 0, animated: true });
                                    }}
                                    className={`flex-row items-center px-5 py-2.5 rounded-full mx-1.5 shadow-sm border ${
                                        isActive
                                            ? 'bg-blue-600 border-blue-600 shadow-blue-200'
                                            : 'bg-white border-slate-200 shadow-slate-100'
                                    }`}
                                >
                                    <Icon size={16} color={isActive ? 'white' : '#64748b'} />
                                    <Text
                                        className={`ml-2 font-bold text-sm ${isActive ? 'text-white' : 'text-slate-600'}`}
                                    >
                                        {tab.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            </LinearGradient>

            {/* Content */}
            <ScrollView
                ref={scrollRef}
                className="flex-1 px-4 py-4 bg-white"
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <AnimatePresence exitBeforeEnter>
                    {/* BASICS TAB */}
                    {activeTab === 'basics' && (
                        <MotiView
                            key="basics"
                            from={{ opacity: 0, translateX: -20 }}
                            animate={{ opacity: 1, translateX: 0 }}
                            exit={{ opacity: 0, translateX: 20 }}
                            transition={{ type: 'timing', duration: 250 }}
                        >
                            <View className="flex-row items-center mb-4">
                                <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
                                    <UserIcon size={20} color="#1e3a8a" />
                                </View>
                                <Text className="text-xl font-bold text-slate-900">
                                    {t('profile.basics.title')}
                                </Text>
                            </View>

                            <View className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100">
                                <Text className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
                                    {t('profile.basics.firstName')}
                                </Text>
                                <TextInput
                                    className="text-slate-900 text-lg font-semibold bg-white rounded-xl px-4 py-3 border border-slate-200"
                                    value={basicInfo.first_name || ''}
                                    onChangeText={(v) => updateField('basic', 'first_name', v)}
                                    placeholder={t('profile.basics.firstNamePlaceholder')}
                                    placeholderTextColor="#94a3b8"
                                />
                            </View>

                            <View className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100">
                                <Text className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
                                    {t('profile.basics.lastName')}
                                </Text>
                                <TextInput
                                    className="text-slate-900 text-lg font-semibold bg-white rounded-xl px-4 py-3 border border-slate-200"
                                    value={basicInfo.last_name || ''}
                                    onChangeText={(v) => updateField('basic', 'last_name', v)}
                                    placeholder={t('profile.basics.lastNamePlaceholder')}
                                    placeholderTextColor="#94a3b8"
                                />
                            </View>

                            <View className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100">
                                <Text className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
                                    {t('profile.basics.bio')}
                                </Text>
                                <TextInput
                                    className="text-slate-900 text-base bg-white rounded-xl px-4 py-3 border border-slate-200 min-h-[100px]"
                                    multiline
                                    textAlignVertical="top"
                                    value={basicInfo.bio || ''}
                                    onChangeText={(v) => updateField('basic', 'bio', v)}
                                    placeholder={t('profile.basics.bioPlaceholder')}
                                    placeholderTextColor="#94a3b8"
                                />
                            </View>

                            <View className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100">
                                <Text className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
                                    {t('profile.basics.dateOfBirth')}
                                </Text>
                                <TextInput
                                    className="text-slate-900 text-lg font-medium bg-white rounded-xl px-4 py-3 border border-slate-200"
                                    value={basicInfo.birthday || ''}
                                    onChangeText={(v) => updateField('basic', 'birthday', v)}
                                    placeholder={t('profile.basics.dateOfBirthPlaceholder')}
                                    placeholderTextColor="#94a3b8"
                                />
                            </View>

                            <View className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100">
                                <Text className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
                                    {t('profile.basics.height')}
                                </Text>
                                <TextInput
                                    className="text-slate-900 text-lg font-medium bg-white rounded-xl px-4 py-3 border border-slate-200"
                                    value={String(basicInfo.height || '')}
                                    onChangeText={(v) => updateField('basic', 'height', v)}
                                    placeholder={t('profile.basics.heightPlaceholder')}
                                    keyboardType="numeric"
                                    placeholderTextColor="#94a3b8"
                                />
                            </View>

                            <View className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100">
                                <Text className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
                                    {t('profile.basics.city')}
                                </Text>
                                <TextInput
                                    className="text-slate-900 text-lg font-medium bg-white rounded-xl px-4 py-3 border border-slate-200"
                                    value={basicInfo.city || ''}
                                    onChangeText={(v) => updateField('basic', 'city', v)}
                                    placeholder={t('profile.basics.cityPlaceholder')}
                                    placeholderTextColor="#94a3b8"
                                />
                            </View>

                            <FormSelect
                                label={t('profile.basics.marriageTimeline')}
                                value={basicInfo.marriage_timeline || ''}
                                options={[
                                    { value: 'asap', label: t('profile.basics.asap') },
                                    { value: '6_months', label: t('profile.basics.sixMonths') },
                                    { value: '1_year', label: t('profile.basics.oneYear') },
                                    { value: '2_years', label: t('profile.basics.twoYears') },
                                ]}
                                onChange={(v) => updateField('basic', 'marriage_timeline', v)}
                                color="#3b82f6"
                            />
                        </MotiView>
                    )}

                    {/* LIFESTYLE TAB */}
                    {activeTab === 'lifestyle' && (
                        <MotiView
                            key="lifestyle"
                            from={{ opacity: 0, translateX: -20 }}
                            animate={{ opacity: 1, translateX: 0 }}
                            exit={{ opacity: 0, translateX: 20 }}
                            transition={{ type: 'timing', duration: 250 }}
                        >
                            <View className="flex-row items-center mb-4">
                                <View className="w-10 h-10 rounded-full bg-purple-100 items-center justify-center mr-3">
                                    <CoffeeIcon size={20} color="#7c3aed" />
                                </View>
                                <Text className="text-xl font-bold text-slate-900">
                                    {t('profile.lifestyle.title')}
                                </Text>
                            </View>

                            <FormSelect
                                label={t('profile.lifestyle.diet')}
                                value={lifestyle.diet || ''}
                                options={[
                                    {
                                        value: 'vegetarian',
                                        label: t('profile.lifestyle.vegetarian'),
                                    },
                                    {
                                        value: 'non_vegetarian',
                                        label: t('profile.lifestyle.nonVegetarian'),
                                    },
                                    { value: 'vegan', label: t('profile.lifestyle.vegan') },
                                    {
                                        value: 'eggetarian',
                                        label: t('profile.lifestyle.eggetarian'),
                                    },
                                    { value: 'halal', label: t('profile.lifestyle.halalOnly') },
                                ]}
                                onChange={(v) => updateField('lifestyle', 'diet', v)}
                                color="#8b5cf6"
                            />

                            <FormSelect
                                label={t('profile.lifestyle.drinking')}
                                value={lifestyle.drink || ''}
                                options={[
                                    { value: 'never', label: t('profile.lifestyle.never') },
                                    { value: 'socially', label: t('profile.lifestyle.socially') },
                                    { value: 'regularly', label: t('profile.lifestyle.regularly') },
                                ]}
                                onChange={(v) => updateField('lifestyle', 'drink', v)}
                                color="#8b5cf6"
                            />

                            <FormSelect
                                label={t('profile.lifestyle.smoking')}
                                value={lifestyle.smoke || ''}
                                options={[
                                    { value: 'never', label: t('profile.lifestyle.never') },
                                    {
                                        value: 'occasionally',
                                        label: t('profile.lifestyle.occasionally'),
                                    },
                                    { value: 'regularly', label: t('profile.lifestyle.regularly') },
                                ]}
                                onChange={(v) => updateField('lifestyle', 'smoke', v)}
                                color="#8b5cf6"
                            />

                            <FormSelect
                                label={t('profile.lifestyle.exercise')}
                                value={lifestyle.exercise || ''}
                                options={[
                                    { value: 'daily', label: t('profile.lifestyle.daily') },
                                    { value: 'weekly', label: t('profile.lifestyle.weekly') },
                                    { value: 'rarely', label: t('profile.lifestyle.rarely') },
                                    { value: 'never', label: t('profile.lifestyle.never') },
                                ]}
                                onChange={(v) => updateField('lifestyle', 'exercise', v)}
                                color="#8b5cf6"
                            />

                            <View className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100">
                                <Text className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2">
                                    {t('profile.lifestyle.hobbies')}
                                </Text>
                                <TextInput
                                    className="text-slate-900 text-base bg-white rounded-xl px-4 py-3 border border-slate-200 min-h-[100px]"
                                    multiline
                                    textAlignVertical="top"
                                    value={lifestyle.hobbies || ''}
                                    onChangeText={(v) => updateField('lifestyle', 'hobbies', v)}
                                    placeholder={t('profile.lifestyle.hobbiesPlaceholder')}
                                    placeholderTextColor="#94a3b8"
                                />
                            </View>

                            <FormSelect
                                label={t('profile.lifestyle.sleepSchedule')}
                                value={lifestyle.sleep_schedule || ''}
                                options={[
                                    {
                                        value: 'early_bird',
                                        label: t('profile.lifestyle.earlyBird'),
                                    },
                                    { value: 'night_owl', label: t('profile.lifestyle.nightOwl') },
                                    { value: 'flexible', label: t('profile.lifestyle.flexible') },
                                ]}
                                onChange={(v) => updateField('lifestyle', 'sleep_schedule', v)}
                                color="#8b5cf6"
                            />
                        </MotiView>
                    )}

                    {/* CAREER TAB */}
                    {activeTab === 'career' && (
                        <MotiView
                            key="career"
                            from={{ opacity: 0, translateX: -20 }}
                            animate={{ opacity: 1, translateX: 0 }}
                            exit={{ opacity: 0, translateX: 20 }}
                            transition={{ type: 'timing', duration: 250 }}
                        >
                            <View className="flex-row items-center mb-4">
                                <View className="w-10 h-10 rounded-full bg-emerald-100 items-center justify-center mr-3">
                                    <BriefcaseIcon size={20} color="#059669" />
                                </View>
                                <Text className="text-xl font-bold text-slate-900">
                                    {t('profile.career.title')}
                                </Text>
                            </View>

                            <View className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100">
                                <Text className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">
                                    {t('profile.career.highestEducation')}
                                </Text>
                                <TextInput
                                    className="text-slate-900 text-lg font-medium bg-white rounded-xl px-4 py-3 border border-slate-200"
                                    value={
                                        careerInfo.highest_education || careerInfo.education || ''
                                    }
                                    onChangeText={(v) =>
                                        updateField('career', 'highest_education', v)
                                    }
                                    placeholder={t('profile.career.educationPlaceholder')}
                                    placeholderTextColor="#94a3b8"
                                />
                            </View>

                            <View className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100">
                                <Text className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">
                                    {t('profile.career.university')}
                                </Text>
                                <TextInput
                                    className="text-slate-900 text-lg font-medium bg-white rounded-xl px-4 py-3 border border-slate-200"
                                    value={careerInfo.university || ''}
                                    onChangeText={(v) => updateField('career', 'university', v)}
                                    placeholder={t('profile.career.universityPlaceholder')}
                                    placeholderTextColor="#94a3b8"
                                />
                            </View>

                            <View className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100">
                                <Text className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">
                                    {t('profile.career.profession')}
                                </Text>
                                <TextInput
                                    className="text-slate-900 text-lg font-medium bg-white rounded-xl px-4 py-3 border border-slate-200"
                                    value={careerInfo.designation || ''}
                                    onChangeText={(v) => updateField('career', 'designation', v)}
                                    placeholder={t('profile.career.professionPlaceholder')}
                                    placeholderTextColor="#94a3b8"
                                />
                            </View>

                            <View className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100">
                                <Text className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">
                                    {t('profile.career.company')}
                                </Text>
                                <TextInput
                                    className="text-slate-900 text-lg font-medium bg-white rounded-xl px-4 py-3 border border-slate-200"
                                    value={careerInfo.company || ''}
                                    onChangeText={(v) => updateField('career', 'company', v)}
                                    placeholder={t('profile.career.companyPlaceholder')}
                                    placeholderTextColor="#94a3b8"
                                />
                            </View>

                            <FormSelect
                                label={t('profile.career.employmentType')}
                                value={careerInfo.employment_type || ''}
                                options={[
                                    { value: 'employed', label: t('profile.career.employed') },
                                    {
                                        value: 'self_employed',
                                        label: t('profile.career.selfEmployed'),
                                    },
                                    { value: 'business', label: t('profile.career.businessOwner') },
                                    { value: 'student', label: t('profile.career.student') },
                                    { value: 'not_working', label: t('profile.career.notWorking') },
                                ]}
                                onChange={(v) => updateField('career', 'employment_type', v)}
                                color="#10b981"
                            />

                            <View className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100">
                                <Text className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">
                                    {t('profile.career.annualIncome')}
                                </Text>
                                <TextInput
                                    className="text-slate-900 text-lg font-medium bg-white rounded-xl px-4 py-3 border border-slate-200"
                                    value={careerInfo.income || ''}
                                    onChangeText={(v) => updateField('career', 'income', v)}
                                    placeholder={t('profile.career.incomePlaceholder')}
                                    placeholderTextColor="#94a3b8"
                                />
                            </View>

                            <View className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100">
                                <Text className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">
                                    {t('profile.career.licenseNumber')}
                                </Text>
                                <TextInput
                                    className="text-slate-900 text-lg font-medium bg-white rounded-xl px-4 py-3 border border-slate-200"
                                    value={careerInfo.license_number || ''}
                                    onChangeText={(v) => updateField('career', 'license_number', v)}
                                    placeholder={t('profile.career.licensePlaceholder')}
                                    placeholderTextColor="#94a3b8"
                                />
                            </View>
                        </MotiView>
                    )}

                    {/* FAMILY TAB */}
                    {activeTab === 'family' && (
                        <MotiView
                            key="family"
                            from={{ opacity: 0, translateX: -20 }}
                            animate={{ opacity: 1, translateX: 0 }}
                            exit={{ opacity: 0, translateX: 20 }}
                            transition={{ type: 'timing', duration: 250 }}
                        >
                            <View className="flex-row items-center mb-4">
                                <View className="w-10 h-10 rounded-full bg-amber-100 items-center justify-center mr-3">
                                    <HomeIcon size={20} color="#d97706" />
                                </View>
                                <Text className="text-xl font-bold text-slate-900">
                                    {t('profile.family.title')}
                                </Text>
                            </View>

                            <FormSelect
                                label={t('profile.family.familyType')}
                                value={family.family_type || ''}
                                options={[
                                    { value: 'nuclear', label: t('profile.family.nuclear') },
                                    { value: 'joint', label: t('profile.family.joint') },
                                    { value: 'extended', label: t('profile.family.extended') },
                                ]}
                                onChange={(v) => updateField('family', 'family_type', v)}
                                color="#f59e0b"
                            />

                            <FormSelect
                                label={t('profile.family.familyValues')}
                                value={family.family_values || ''}
                                options={[
                                    {
                                        value: 'traditional',
                                        label: t('profile.family.traditional'),
                                    },
                                    { value: 'moderate', label: t('profile.family.moderate') },
                                    { value: 'liberal', label: t('profile.family.liberal') },
                                ]}
                                onChange={(v) => updateField('family', 'family_values', v)}
                                color="#f59e0b"
                            />

                            <FormSelect
                                label={t('profile.family.familyAffluence')}
                                value={family.affluence || ''}
                                options={[
                                    { value: 'upper_class', label: t('profile.family.upperClass') },
                                    {
                                        value: 'upper_middle',
                                        label: t('profile.family.upperMiddle'),
                                    },
                                    { value: 'middle', label: t('profile.family.middleClass') },
                                    {
                                        value: 'lower_middle',
                                        label: t('profile.family.lowerMiddle'),
                                    },
                                ]}
                                onChange={(v) => updateField('family', 'affluence', v)}
                                color="#f59e0b"
                            />

                            <View className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100">
                                <Text className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">
                                    {t('profile.family.fatherOccupation')}
                                </Text>
                                <TextInput
                                    className="text-slate-900 text-lg font-medium bg-white rounded-xl px-4 py-3 border border-slate-200"
                                    value={family.father_occupation || ''}
                                    onChangeText={(v) =>
                                        updateField('family', 'father_occupation', v)
                                    }
                                    placeholder={t('profile.family.fatherPlaceholder')}
                                    placeholderTextColor="#94a3b8"
                                />
                            </View>

                            <View className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100">
                                <Text className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">
                                    {t('profile.family.motherOccupation')}
                                </Text>
                                <TextInput
                                    className="text-slate-900 text-lg font-medium bg-white rounded-xl px-4 py-3 border border-slate-200"
                                    value={family.mother_occupation || ''}
                                    onChangeText={(v) =>
                                        updateField('family', 'mother_occupation', v)
                                    }
                                    placeholder={t('profile.family.motherPlaceholder')}
                                    placeholderTextColor="#94a3b8"
                                />
                            </View>

                            <View className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100">
                                <Text className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">
                                    {t('profile.family.siblings')}
                                </Text>
                                <TextInput
                                    className="text-slate-900 text-lg font-medium bg-white rounded-xl px-4 py-3 border border-slate-200"
                                    value={String(family.siblings || '')}
                                    onChangeText={(v) => updateField('family', 'siblings', v)}
                                    placeholder={t('profile.family.siblingsPlaceholder')}
                                    keyboardType="numeric"
                                    placeholderTextColor="#94a3b8"
                                />
                            </View>

                            <View className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100">
                                <Text className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">
                                    {t('profile.family.familyLocation')}
                                </Text>
                                <TextInput
                                    className="text-slate-900 text-lg font-medium bg-white rounded-xl px-4 py-3 border border-slate-200"
                                    value={family.family_location || ''}
                                    onChangeText={(v) =>
                                        updateField('family', 'family_location', v)
                                    }
                                    placeholder={t('profile.family.familyLocationPlaceholder')}
                                    placeholderTextColor="#94a3b8"
                                />
                            </View>
                        </MotiView>
                    )}

                    {/* PREFERENCES TAB */}
                    {activeTab === 'preferences' && (
                        <MotiView
                            key="preferences"
                            from={{ opacity: 0, translateX: -20 }}
                            animate={{ opacity: 1, translateX: 0 }}
                            exit={{ opacity: 0, translateX: 20 }}
                            transition={{ type: 'timing', duration: 250 }}
                        >
                            <View className="flex-row items-center mb-4">
                                <View className="w-10 h-10 rounded-full bg-rose-100 items-center justify-center mr-3">
                                    <HeartIcon size={20} color="#e11d48" />
                                </View>
                                <Text className="text-xl font-bold text-slate-900">
                                    {t('profile.preferences.title')}
                                </Text>
                            </View>

                            <View className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100">
                                <Text className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-3">
                                    {t('profile.preferences.ageRange')}
                                </Text>
                                <View className="flex-row gap-3">
                                    <View className="flex-1">
                                        <Text className="text-xs text-slate-500 mb-1 text-center">
                                            {t('profile.preferences.minimum')}
                                        </Text>
                                        <TextInput
                                            className="text-slate-900 text-lg font-bold text-center bg-white rounded-xl px-4 py-3 border border-slate-200"
                                            value={String(preferences.min_age || '')}
                                            onChangeText={(v) =>
                                                updateField('preferences', 'min_age', v)
                                            }
                                            placeholder="25"
                                            keyboardType="numeric"
                                            placeholderTextColor="#94a3b8"
                                        />
                                    </View>
                                    <View className="items-center justify-end pb-3">
                                        <Text className="text-slate-400 font-bold">
                                            {t('profile.preferences.to')}
                                        </Text>
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-xs text-slate-500 mb-1 text-center">
                                            {t('profile.preferences.maximum')}
                                        </Text>
                                        <TextInput
                                            className="text-slate-900 text-lg font-bold text-center bg-white rounded-xl px-4 py-3 border border-slate-200"
                                            value={String(preferences.max_age || '')}
                                            onChangeText={(v) =>
                                                updateField('preferences', 'max_age', v)
                                            }
                                            placeholder="35"
                                            keyboardType="numeric"
                                            placeholderTextColor="#94a3b8"
                                        />
                                    </View>
                                </View>
                            </View>

                            <View className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100">
                                <Text className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-3">
                                    {t('profile.preferences.heightRange')}
                                </Text>
                                <View className="flex-row gap-3">
                                    <View className="flex-1">
                                        <TextInput
                                            className="text-slate-900 text-lg font-bold text-center bg-white rounded-xl px-4 py-3 border border-slate-200"
                                            value={String(preferences.min_height || '')}
                                            onChangeText={(v) =>
                                                updateField('preferences', 'min_height', v)
                                            }
                                            placeholder="150"
                                            keyboardType="numeric"
                                            placeholderTextColor="#94a3b8"
                                        />
                                    </View>
                                    <View className="items-center justify-center">
                                        <Text className="text-slate-400 font-bold">
                                            {t('profile.preferences.to')}
                                        </Text>
                                    </View>
                                    <View className="flex-1">
                                        <TextInput
                                            className="text-slate-900 text-lg font-bold text-center bg-white rounded-xl px-4 py-3 border border-slate-200"
                                            value={String(preferences.max_height || '')}
                                            onChangeText={(v) =>
                                                updateField('preferences', 'max_height', v)
                                            }
                                            placeholder="180"
                                            keyboardType="numeric"
                                            placeholderTextColor="#94a3b8"
                                        />
                                    </View>
                                </View>
                            </View>

                            <View className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100">
                                <Text className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-2">
                                    {t('profile.preferences.preferredReligion')}
                                </Text>
                                <TextInput
                                    className="text-slate-900 text-lg font-medium bg-white rounded-xl px-4 py-3 border border-slate-200"
                                    value={preferences.religion || ''}
                                    onChangeText={(v) => updateField('preferences', 'religion', v)}
                                    placeholder={t('profile.preferences.religionPlaceholder')}
                                    placeholderTextColor="#94a3b8"
                                />
                            </View>

                            <View className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100">
                                <Text className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-2">
                                    {t('profile.preferences.preferredLocation')}
                                </Text>
                                <TextInput
                                    className="text-slate-900 text-lg font-medium bg-white rounded-xl px-4 py-3 border border-slate-200"
                                    value={preferences.preferred_country || ''}
                                    onChangeText={(v) =>
                                        updateField('preferences', 'preferred_country', v)
                                    }
                                    placeholder={t('profile.preferences.locationPlaceholder')}
                                    placeholderTextColor="#94a3b8"
                                />
                            </View>

                            <View className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100">
                                <Text className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-2">
                                    {t('profile.preferences.preferredEducation')}
                                </Text>
                                <TextInput
                                    className="text-slate-900 text-lg font-medium bg-white rounded-xl px-4 py-3 border border-slate-200"
                                    value={preferences.education || ''}
                                    onChangeText={(v) => updateField('preferences', 'education', v)}
                                    placeholder={t('profile.preferences.educationPlaceholder')}
                                    placeholderTextColor="#94a3b8"
                                />
                            </View>

                            <View className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100">
                                <Text className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-2">
                                    {t('profile.preferences.preferredProfession')}
                                </Text>
                                <TextInput
                                    className="text-slate-900 text-lg font-medium bg-white rounded-xl px-4 py-3 border border-slate-200"
                                    value={preferences.profession || ''}
                                    onChangeText={(v) =>
                                        updateField('preferences', 'profession', v)
                                    }
                                    placeholder={t('profile.preferences.professionPlaceholder')}
                                    placeholderTextColor="#94a3b8"
                                />
                            </View>
                        </MotiView>
                    )}

                    {/* MEDIA TAB */}
                    {activeTab === 'media' && (
                        <MotiView
                            key="media"
                            from={{ opacity: 0, translateX: -20 }}
                            animate={{ opacity: 1, translateX: 0 }}
                            exit={{ opacity: 0, translateX: 20 }}
                            transition={{ type: 'timing', duration: 250 }}
                        >
                            <View className="flex-row items-center mb-4">
                                <View className="w-10 h-10 rounded-full bg-pink-100 items-center justify-center mr-3">
                                    <ImageIcon size={20} color="#db2777" />
                                </View>
                                <Text className="text-xl font-bold text-slate-900">
                                    {t('profile.media.title')}
                                </Text>
                            </View>

                            {/* Photo Gallery Section */}
                            <View className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100">
                                <Text className="text-xs font-bold text-pink-600 uppercase tracking-wider mb-3">
                                    {t('profile.media.photoGallery')}
                                </Text>
                                <View className="flex-row flex-wrap gap-2">
                                    {(media.gallery || []).map((photo: string, index: number) => (
                                        <View key={index} className="relative">
                                            <Image
                                                source={{ uri: photo }}
                                                className="w-24 h-24 rounded-xl"
                                            />
                                            <TouchableOpacity className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full items-center justify-center">
                                                <TrashIcon size={12} color="white" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                    <TouchableOpacity
                                        onPress={async () => {
                                            const result =
                                                await ImagePicker.launchImageLibraryAsync({
                                                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                                                    allowsMultipleSelection: true,
                                                    quality: 0.8,
                                                });
                                            if (!result.canceled) {
                                                Alert.alert(
                                                    t('profile.alerts.successTitle'),
                                                    t('profile.alerts.uploadPhotos'),
                                                );
                                            }
                                        }}
                                        className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 items-center justify-center bg-white"
                                    >
                                        <ImagePlusIcon size={24} color="#94a3b8" />
                                        <Text className="text-slate-400 text-xs mt-1">
                                            {t('profile.media.addPhoto')}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Voice Introduction */}
                            <View className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100">
                                <Text className="text-xs font-bold text-pink-600 uppercase tracking-wider mb-3">
                                    {t('profile.media.voiceIntro')}
                                </Text>
                                {media.voice_intro ? (
                                    <View className="flex-row items-center bg-white rounded-xl p-4 border border-slate-200">
                                        <View className="w-12 h-12 rounded-full bg-pink-100 items-center justify-center">
                                            <Volume2Icon size={24} color="#ec4899" />
                                        </View>
                                        <View className="flex-1 ml-4">
                                            <Text className="text-slate-900 font-semibold">
                                                {t('profile.media.voiceIntroLabel')}
                                            </Text>
                                            <Text className="text-slate-500 text-sm">
                                                {t('profile.media.tapToPlay', {
                                                    duration: media.voice_duration || '0:30',
                                                })}
                                            </Text>
                                        </View>
                                        <TouchableOpacity className="w-10 h-10 rounded-full bg-red-100 items-center justify-center">
                                            <TrashIcon size={16} color="#ef4444" />
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <TouchableOpacity className="flex-row items-center bg-white rounded-xl p-4 border-2 border-dashed border-slate-300">
                                        <View className="w-12 h-12 rounded-full bg-pink-100 items-center justify-center">
                                            <MicIcon size={24} color="#ec4899" />
                                        </View>
                                        <View className="flex-1 ml-4">
                                            <Text className="text-slate-900 font-semibold">
                                                {t('profile.media.recordVoiceIntro')}
                                            </Text>
                                            <Text className="text-slate-500 text-sm">
                                                {t('profile.media.voiceIntroDesc')}
                                            </Text>
                                        </View>
                                        <UploadIcon size={20} color="#94a3b8" />
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* Video Introduction */}
                            <View className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100">
                                <Text className="text-xs font-bold text-pink-600 uppercase tracking-wider mb-3">
                                    {t('profile.media.videoIntro')}
                                </Text>
                                {media.video_intro ? (
                                    <View className="relative rounded-xl overflow-hidden">
                                        <Image
                                            source={{ uri: media.video_thumbnail }}
                                            className="w-full h-48"
                                        />
                                        <View className="absolute inset-0 bg-black/30 items-center justify-center">
                                            <PlayCircleIcon size={48} color="white" />
                                        </View>
                                        <TouchableOpacity className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 items-center justify-center">
                                            <TrashIcon size={14} color="white" />
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <TouchableOpacity className="flex-row items-center bg-white rounded-xl p-4 border-2 border-dashed border-slate-300">
                                        <View className="w-12 h-12 rounded-full bg-pink-100 items-center justify-center">
                                            <PlayCircleIcon size={24} color="#ec4899" />
                                        </View>
                                        <View className="flex-1 ml-4">
                                            <Text className="text-slate-900 font-semibold">
                                                {t('profile.media.uploadVideoIntro')}
                                            </Text>
                                            <Text className="text-slate-500 text-sm">
                                                {t('profile.media.videoIntroDesc')}
                                            </Text>
                                        </View>
                                        <UploadIcon size={20} color="#94a3b8" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </MotiView>
                    )}
                </AnimatePresence>

                {/* Premium Save Button */}
                <View className="mt-6 mb-28">
                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={saving}
                        className="overflow-hidden rounded-2xl"
                    >
                        <LinearGradient
                            colors={['#1e3a8a', '#3b82f6']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            className="py-4 px-6 items-center flex-row justify-center"
                        >
                            {saving ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <SaveIcon size={20} color="white" />
                                    <Text className="text-white font-bold text-lg ml-2">
                                        {t('profile.saveChanges')}
                                    </Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
};

export default ProfileTab;
