import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
    Alert,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView, AnimatePresence } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import Background from '../../components/Background';
import { api, getProfileImageUrl } from '../../utils/api';
import {
    ChevronLeftIcon,
    HeartIcon,
    BookmarkIcon,
    MapPinIcon,
    BriefcaseIcon,
    UserIcon,
    StarIcon,
    CheckIcon,
    CoffeeIcon,
    HomeIcon,
    GlobeIcon,
    CalendarIcon,
} from '../../components/Icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

const ProfileDetailScreen = () => {
    const { t } = useTranslation();
    const { id } = useLocalSearchParams();
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('basics');
    const [sendingInterest, setSendingInterest] = useState(false);
    const [shortlisting, setShortlisting] = useState(false);

    const fetchProfile = useCallback(async () => {
        try {
            const response = await api.get(`/member/public-profile/${id}`);
            if (response.data) {
                setProfile(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch public profile', error);
            Alert.alert(t('common.error'), t('member.loadFailed'));
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const handleSendInterest = async () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSendingInterest(true);
        try {
            const resp = await api.post('/member/express-interest', { user_id: id });
            if (resp.data.result) {
                Alert.alert(t('member.interestSentTitle'), t('member.interestSentMsg'));
            } else {
                Alert.alert(t('common.notice'), resp.data.message || t('member.alreadyInterested'));
            }
        } catch (error: any) {
            Alert.alert(
                t('common.error'),
                error.response?.data?.message || t('member.interestFailed'),
            );
        } finally {
            setSendingInterest(false);
        }
    };

    const handleShortlist = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setShortlisting(true);
        try {
            const resp = await api.post('/member/add-to-shortlist', { user_id: id });
            if (resp.data.result) {
                Alert.alert(t('member.shortlistedTitle'), t('member.shortlistedMsg'));
            }
        } catch (error: any) {
            Alert.alert(
                t('common.error'),
                error.response?.data?.message || t('member.shortlistFailed'),
            );
        } finally {
            setShortlisting(false);
        }
    };

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-white">
                <ActivityIndicator size="large" color="#1e3a8a" />
            </View>
        );
    }

    if (!profile) return null;

    const basics = profile.basic_info || {};
    const career = profile.career?.[0] || {};
    const education = profile.education?.[0] || {};
    const physical = profile.physical_attributes || {};
    const family = profile.families_information || {};
    const lifestyle = profile.lifestyles || {};

    const tabs = [
        { id: 'basics', label: t('member.tabAbout'), icon: UserIcon },
        { id: 'education', label: t('member.tabCareer'), icon: BriefcaseIcon },
        { id: 'lifestyle', label: t('member.tabLifestyle'), icon: CoffeeIcon },
        { id: 'family', label: t('member.tabFamily'), icon: HomeIcon },
    ];

    return (
        <View className="flex-1 bg-white">
            <Background />

            {/* Header with Hero Image */}
            <View className="relative h-[400px]">
                {basics.photo ? (
                    <Image
                        source={{ uri: getProfileImageUrl(basics.photo) }}
                        className="w-full h-full"
                        resizeMode="cover"
                    />
                ) : (
                    <View className="w-full h-full bg-slate-200 items-center justify-center">
                        <UserIcon size={120} color="#94a3b8" />
                    </View>
                )}

                <LinearGradient
                    colors={['rgba(0,0,0,0.6)', 'transparent', 'transparent', 'rgba(0,0,0,0.8)']}
                    className="absolute inset-0"
                />

                {/* Back Button */}
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{ top: insets.top + 10 }}
                    className="absolute left-4 w-10 h-10 rounded-full bg-black/30 items-center justify-center backdrop-blur-md"
                >
                    <ChevronLeftIcon size={24} color="white" />
                </TouchableOpacity>

                {/* Profile Info Overlay */}
                <View className="absolute bottom-0 left-0 right-0 p-6">
                    <MotiView
                        from={{ opacity: 0, translateY: 20 }}
                        animate={{ opacity: 1, translateY: 0 }}
                    >
                        <View className="flex-row items-center gap-2">
                            <Text className="text-3xl font-bold text-white">{basics.name}</Text>
                            {basics.verified && <CheckIcon size={20} color="#10b981" />}
                        </View>

                        <View className="flex-row items-center gap-3 mt-2">
                            <View className="bg-white/20 px-3 py-1 rounded-full backdrop-blur-md">
                                <Text className="text-white font-medium">{basics.age} Years</Text>
                            </View>
                            <View className="flex-row items-center gap-1">
                                <MapPinIcon size={14} color="white" />
                                <Text className="text-white/90">
                                    {basics.city || basics.country || 'N/A'}
                                </Text>
                            </View>
                        </View>
                    </MotiView>
                </View>
            </View>

            {/* Content Tabs */}
            <View className="flex-1 -mt-6 bg-white rounded-t-3xl">
                <View className="flex-row px-4 pt-6 pb-2">
                    {tabs.map((tab) => (
                        <TouchableOpacity
                            key={tab.id}
                            onPress={() => {
                                Haptics.selectionAsync();
                                setActiveTab(tab.id);
                            }}
                            className={`flex-1 items-center pb-3 border-b-2 ${
                                activeTab === tab.id ? 'border-blue-600' : 'border-transparent'
                            }`}
                        >
                            <Text
                                className={`font-bold ${activeTab === tab.id ? 'text-blue-600' : 'text-slate-400'}`}
                            >
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
                    <AnimatePresence exitBeforeEnter>
                        {activeTab === 'basics' && (
                            <MotiView
                                key="basics"
                                from={{ opacity: 0, translateX: -10 }}
                                animate={{ opacity: 1, translateX: 0 }}
                                exit={{ opacity: 0, translateX: 10 }}
                            >
                                <Text className="text-slate-900 font-bold text-lg mb-2">
                                    {t('member.introduction')}
                                </Text>
                                <Text className="text-slate-600 leading-6 mb-6">
                                    {profile.intoduction?.about || t('member.noIntro')}
                                </Text>

                                <View className="flex-row flex-wrap gap-4">
                                    <InfoItem
                                        label="Religion"
                                        value={basics.religion}
                                        icon={StarIcon}
                                    />
                                    <InfoItem
                                        label="Mother Tongue"
                                        value={basics.mothere_tongue}
                                        icon={GlobeIcon}
                                    />
                                    <InfoItem
                                        label="Height"
                                        value={`${physical.height} cm`}
                                        icon={UserIcon}
                                    />
                                    <InfoItem
                                        label="Weight"
                                        value={`${physical.weight} kg`}
                                        icon={UserIcon}
                                    />
                                </View>
                            </MotiView>
                        )}

                        {activeTab === 'education' && (
                            <MotiView
                                key="education"
                                from={{ opacity: 0, translateX: -10 }}
                                animate={{ opacity: 1, translateX: 0 }}
                            >
                                <Section title="Education">
                                    <DetailItem
                                        icon={CalendarIcon}
                                        label="Level"
                                        value={education.degree}
                                    />
                                    <DetailItem
                                        icon={HomeIcon}
                                        label="Institute"
                                        value={education.institution}
                                    />
                                </Section>

                                <Section title="Career" className="mt-6">
                                    <DetailItem
                                        icon={BriefcaseIcon}
                                        label="Designation"
                                        value={career.designation}
                                    />
                                    <DetailItem
                                        icon={HomeIcon}
                                        label="Company"
                                        value={career.company}
                                    />
                                </Section>
                            </MotiView>
                        )}

                        {activeTab === 'lifestyle' && (
                            <MotiView
                                key="lifestyle"
                                from={{ opacity: 0, translateX: -10 }}
                                animate={{ opacity: 1, translateX: 0 }}
                            >
                                <View className="flex-row flex-wrap gap-4">
                                    <InfoItem
                                        label="Diet"
                                        value={lifestyle.diet}
                                        icon={CoffeeIcon}
                                    />
                                    <InfoItem
                                        label="Drink"
                                        value={lifestyle.drink}
                                        icon={CoffeeIcon}
                                    />
                                    <InfoItem
                                        label="Smoke"
                                        value={lifestyle.smoke}
                                        icon={CoffeeIcon}
                                    />
                                    <InfoItem
                                        label="Marital Status"
                                        value={basics.marital_status}
                                        icon={HeartIcon}
                                    />
                                </View>
                            </MotiView>
                        )}

                        {activeTab === 'family' && (
                            <MotiView
                                key="family"
                                from={{ opacity: 0, translateX: -10 }}
                                animate={{ opacity: 1, translateX: 0 }}
                            >
                                <DetailItem label="Family Type" value={family.family_type} />
                                <DetailItem label="Values" value={family.family_values} />
                                <DetailItem label="Affluence" value={family.family_affluence} />
                                <DetailItem
                                    label="Father's Occupation"
                                    value={family.father_occupation}
                                />
                                <DetailItem
                                    label="Mother's Occupation"
                                    value={family.mother_occupation}
                                />
                            </MotiView>
                        )}
                    </AnimatePresence>
                    <View className="h-32" />
                </ScrollView>
            </View>

            {/* Fixed Action Footer */}
            <View className="absolute bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-lg border-t border-slate-100 flex-row gap-4">
                <TouchableOpacity
                    onPress={handleShortlist}
                    disabled={shortlisting}
                    className="w-14 h-14 rounded-2xl bg-slate-100 items-center justify-center"
                >
                    {shortlisting ? (
                        <ActivityIndicator size="small" color="#1e3a8a" />
                    ) : (
                        <BookmarkIcon size={24} color="#1e3a8a" />
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleSendInterest}
                    disabled={sendingInterest}
                    className="flex-1 h-14 bg-blue-600 rounded-2xl items-center justify-center flex-row gap-2 shadow-lg shadow-blue-200"
                >
                    {sendingInterest ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : (
                        <>
                            <HeartIcon size={20} color="white" />
                            <Text className="text-white font-bold text-lg">
                                {t('member.expressInterest')}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const Section = ({ title, children, className = '' }: any) => (
    <View className={className}>
        <Text className="text-slate-900 font-bold text-lg mb-3">{title}</Text>
        {children}
    </View>
);

const DetailItem = ({ icon: Icon, label, value }: any) => (
    <View className="flex-row items-center mb-3">
        {Icon && <Icon size={16} color="#64748b" className="mr-3" />}
        <View>
            <Text className="text-slate-400 text-xs uppercase font-bold">{label}</Text>
            <Text className="text-slate-900 font-semibold">{value || 'N/A'}</Text>
        </View>
    </View>
);

const InfoItem = ({ label, value, icon: Icon }: any) => (
    <View
        style={{ width: (width - 64) / 2 }}
        className="bg-slate-50 p-4 rounded-2xl border border-slate-100"
    >
        <Icon size={20} color="#3b82f6" className="mb-2" />
        <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            {label}
        </Text>
        <Text className="text-slate-900 font-bold mt-1" numberOfLines={1}>
            {value || 'N/A'}
        </Text>
    </View>
);

export default ProfileDetailScreen;
