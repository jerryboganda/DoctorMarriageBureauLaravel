import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
    RefreshControl,
    ActivityIndicator,
    Alert,
    Share,
    TextInput,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { api } from '../utils/api';
import { useAuthStore } from '../stores/authStore';
import {
    UsersIcon,
    ShieldIcon,
    FileTextIcon,
    ChevronLeftIcon,
    CheckCircleIcon,
    PlusIcon,
    TrashIcon,
    ShareIcon,
} from '../components/Icons';
import Button from '../components/Button';

interface FamilyProfile {
    description: string;
    traditionLevel: string;
    affluenceLevel: string;
    interests: string[];
    photos: { id: number; url: string }[];
}

interface Guardian {
    id: number;
    name: string;
    role: string;
    email: string;
    phone?: string;
    status: string;
    isOwner: boolean;
    permissions: string[];
}

interface Approval {
    id: number;
    name: string;
    desc: string;
    status: string;
    img: string;
    time: string;
    approved: boolean;
}

export default function FamilyPortalScreen() {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'profile' | 'guardians' | 'approvals' | 'biodata'>(
        'profile',
    );
    const [familyData, setFamilyData] = useState<{
        profile: FamilyProfile;
        guardians: Guardian[];
        approvals: Approval[];
    } | null>(null);

    const [editingProfile, setEditingProfile] = useState(false);
    const [profileForm, setProfileForm] = useState({
        description: '',
        traditionLevel: 'Moderate',
        affluenceLevel: 'Middle Class',
    });

    const fetchFamilyData = useCallback(async () => {
        try {
            const response = await api.get('/family');
            const data = response.data;
            setFamilyData(data);
            if (data?.profile) {
                setProfileForm({
                    description: data.profile.description || '',
                    traditionLevel: data.profile.traditionLevel || 'Moderate',
                    affluenceLevel: data.profile.affluenceLevel || 'Middle Class',
                });
            }
        } catch (error) {
            console.error('Error fetching family data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchFamilyData();
    }, [fetchFamilyData]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchFamilyData();
    };

    const handleUpdateProfile = async () => {
        try {
            setLoading(true);
            await api.post('/family/update-profile', {
                ...profileForm,
                interests: familyData?.profile?.interests || [],
            });
            Alert.alert(t('common.success'), t('familyPortal.profileUpdated'));
            setEditingProfile(false);
            fetchFamilyData();
        } catch (error: any) {
            Alert.alert(
                t('common.error'),
                error.response?.data?.message || t('familyPortal.updateFailed'),
            );
        } finally {
            setLoading(false);
        }
    };

    const handleShareBiodata = async () => {
        try {
            const result = await Share.share({
                message: `Check out the biodata for ${user?.name}. Join Doctor Marriage Bureau to connect! https://dmb.com/profile/${user?.id}`,
            });
        } catch (error) {
            Alert.alert(t('common.error'), t('familyPortal.shareFailed'));
        }
    };

    const handleInviteGuardian = async () => {
        try {
            const inviteLink = `https://dmb.com/family/join?ref=${user?.id}`;
            await Share.share({
                message: `Join my family on Doctor Marriage Bureau to help manage approvals! Click here: ${inviteLink}`,
                title: 'Join my Family',
            });
        } catch (error: any) {
            Alert.alert(t('common.error'), t('familyPortal.inviteFailed'));
        }
    };

    const tabs = [
        { id: 'profile', label: 'Profile', icon: UsersIcon },
        { id: 'guardians', label: 'Guardians', icon: ShieldIcon },
        {
            id: 'approvals',
            label: 'Approvals',
            icon: CheckCircleIcon,
            badge: familyData?.approvals.filter((a) => !a.approved).length,
        },
        { id: 'biodata', label: 'Biodata', icon: FileTextIcon },
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            // ... (profile case remains same)
            case 'profile':
                return (
                    <View className="p-4">
                        <View className="bg-white p-5 rounded-2xl border border-slate-100 mb-4">
                            <View className="flex-row justify-between items-center mb-4">
                                <Text className="text-lg font-bold text-slate-900">
                                    {t('familyPortal.familyOverview')}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => setEditingProfile(!editingProfile)}
                                    className="px-3 py-1 bg-slate-100 rounded-full"
                                >
                                    <Text className="text-xs font-bold text-slate-600">
                                        {editingProfile ? t('common.cancel') : t('common.edit')}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {editingProfile ? (
                                <View className="space-y-4">
                                    <View>
                                        <Text className="text-xs font-bold text-slate-500 mb-1">
                                            {t('familyPortal.aboutFamily')}
                                        </Text>
                                        <TextInput
                                            value={profileForm.description}
                                            onChangeText={(t) =>
                                                setProfileForm((prev) => ({
                                                    ...prev,
                                                    description: t,
                                                }))
                                            }
                                            multiline
                                            className="bg-slate-50 p-3 rounded-xl min-h-[100px] text-slate-900"
                                            placeholder="Describe your family values..."
                                        />
                                    </View>
                                    <View>
                                        <Text className="text-xs font-bold text-slate-500 mb-1">
                                            {t('familyPortal.traditionLevel')}
                                        </Text>
                                        <TextInput
                                            value={profileForm.traditionLevel}
                                            onChangeText={(t) =>
                                                setProfileForm((prev) => ({
                                                    ...prev,
                                                    traditionLevel: t,
                                                }))
                                            }
                                            className="bg-slate-50 p-3 rounded-xl text-slate-900"
                                        />
                                    </View>
                                    <Button
                                        onPress={handleUpdateProfile}
                                        title={t('common.saveChanges')}
                                    />
                                </View>
                            ) : (
                                <View>
                                    <Text className="text-slate-600 leading-6 mb-4">
                                        {familyData?.profile?.description ||
                                            t('familyPortal.noDescription')}
                                    </Text>
                                    <View className="flex-row gap-4">
                                        <View className="bg-purple-50 px-3 py-2 rounded-lg">
                                            <Text className="text-xs text-purple-500 font-bold mb-0.5">
                                                {t('familyPortal.tradition')}
                                            </Text>
                                            <Text className="text-sm font-bold text-purple-800">
                                                {familyData?.profile?.traditionLevel}
                                            </Text>
                                        </View>
                                        <View className="bg-emerald-50 px-3 py-2 rounded-lg">
                                            <Text className="text-xs text-emerald-500 font-bold mb-0.5">
                                                {t('familyPortal.affluence')}
                                            </Text>
                                            <Text className="text-sm font-bold text-emerald-800">
                                                {familyData?.profile?.affluenceLevel}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>
                );
            case 'guardians':
                return (
                    <View className="p-4">
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="font-bold text-lg text-slate-900 ml-1">
                                {t('familyPortal.familyMembers')}
                            </Text>
                            <TouchableOpacity
                                onPress={handleInviteGuardian}
                                className="flex-row items-center bg-blue-50 px-3 py-1.5 rounded-full"
                            >
                                <PlusIcon size={14} color="#3b82f6" />
                                <Text className="text-xs font-bold text-blue-600 ml-1">
                                    {t('familyPortal.invite')}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {familyData?.guardians.map((g, i) => (
                            <View
                                key={g.id}
                                className="bg-white p-4 rounded-xl border border-slate-100 mb-3 flex-row items-center"
                            >
                                <View className="w-10 h-10 bg-orange-100 rounded-full items-center justify-center mr-3">
                                    <Text className="text-orange-600 font-bold">{g.name[0]}</Text>
                                </View>
                                <View className="flex-1">
                                    <Text className="font-bold text-slate-900">
                                        {g.name} {g.isOwner && '(Owner)'}
                                    </Text>
                                    <Text className="text-xs text-slate-500">
                                        {g.role} • {g.status}
                                    </Text>
                                </View>
                                {!g.isOwner && (
                                    <TouchableOpacity className="p-2 bg-slate-50 rounded-full">
                                        <TrashIcon size={14} color="#ef4444" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))}
                    </View>
                );
            case 'approvals':
                return (
                    <View className="p-4">
                        <Text className="font-bold text-lg text-slate-900 mb-4 ml-1">
                            {t('familyPortal.pendingApprovals')}
                        </Text>
                        {familyData?.approvals.length === 0 ? (
                            <View className="items-center py-8">
                                <CheckCircleIcon size={40} color="#cbd5e1" />
                                <Text className="text-slate-400 mt-2">
                                    {t('familyPortal.noPendingApprovals')}
                                </Text>
                            </View>
                        ) : (
                            familyData?.approvals.map((approval) => (
                                <View
                                    key={approval.id}
                                    className="bg-white p-4 rounded-xl border border-slate-100 mb-3"
                                >
                                    <View className="flex-row items-center mb-3">
                                        <Image
                                            source={{ uri: approval.img }}
                                            className="w-12 h-12 rounded-full mr-3 bg-slate-200"
                                        />
                                        <View>
                                            <Text className="font-bold text-slate-900">
                                                {approval.name}
                                            </Text>
                                            <Text className="text-xs text-slate-500">
                                                {approval.time}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text className="text-sm text-slate-600 mb-3 bg-slate-50 p-2 rounded-lg">
                                        "{approval.desc}"
                                    </Text>
                                    <View className="flex-row gap-3">
                                        <Button
                                            onPress={() => Alert.alert(t('common.approved'))}
                                            title="Approve"
                                            className="flex-1 h-9"
                                        />
                                        <TouchableOpacity className="flex-1 h-9 items-center justify-center border border-slate-200 rounded-xl">
                                            <Text className="font-bold text-slate-600">
                                                {t('familyPortal.discuss')}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>
                );
            case 'biodata': {
                const biodataUrl = `https://dmb.com/profile/${user?.id}`;
                return (
                    <View className="p-6 items-center">
                        <View className="bg-white p-6 rounded-3xl border border-slate-100 w-full items-center shadow-sm">
                            <View className="p-4 bg-white rounded-xl shadow-sm mb-4">
                                <QRCode
                                    value={biodataUrl}
                                    size={180}
                                    color="#1e293b"
                                    backgroundColor="white"
                                />
                            </View>
                            <Text className="mt-4 text-xl font-bold text-slate-900">
                                {user?.name}
                            </Text>
                            <Text className="text-slate-500 text-center mt-2 px-8">
                                {t('familyPortal.scanToView')}
                            </Text>

                            <Button
                                onPress={handleShareBiodata}
                                title={t('familyPortal.shareBiodata')}
                                className="w-full mt-6"
                                icon={<ShareIcon size={18} color="white" />}
                            />
                        </View>
                    </View>
                );
            }
            default:
                return null;
        }
    };

    return (
        <View className="flex-1 bg-slate-50">
            <LinearGradient
                colors={['#1e3a8a', '#3b82f6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ paddingTop: insets.top, paddingBottom: 16 }}
                className="px-4 shadow-lg z-10"
            >
                <View className="flex-row items-center py-4">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 bg-white/20 rounded-full items-center justify-center mr-3"
                    >
                        <ChevronLeftIcon size={24} color="white" />
                    </TouchableOpacity>
                    <View>
                        <Text className="text-white text-lg font-bold">
                            {t('familyPortal.title')}
                        </Text>
                        <Text className="text-blue-100 text-xs">{t('familyPortal.subtitle')}</Text>
                    </View>
                </View>

                {/* Tabs */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <TouchableOpacity
                                key={tab.id}
                                onPress={() => setActiveTab(tab.id as any)}
                                className={`mr-3 px-4 py-2 rounded-full flex-row items-center gap-2 ${isActive ? 'bg-white' : 'bg-white/20'}`}
                            >
                                <Icon size={14} color={isActive ? '#1e3a8a' : 'white'} />
                                <Text
                                    className={`text-xs font-bold ${isActive ? 'text-blue-900' : 'text-white'}`}
                                >
                                    {tab.label}
                                </Text>
                                {tab.badge ? (
                                    <View className="bg-red-500 px-1.5 rounded-full">
                                        <Text className="text-[10px] font-bold text-white">
                                            {tab.badge}
                                        </Text>
                                    </View>
                                ) : null}
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </LinearGradient>

            <ScrollView
                contentContainerStyle={{ paddingBottom: 40 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor="#3b82f6"
                    />
                }
            >
                {loading ? (
                    <View className="py-20">
                        <ActivityIndicator size="large" color="#3b82f6" />
                    </View>
                ) : (
                    renderTabContent()
                )}
            </ScrollView>
        </View>
    );
}
