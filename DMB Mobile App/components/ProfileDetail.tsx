import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    Dimensions,
    Alert,
    Modal,
    ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
    ChevronLeftIcon,
    MapPinIcon,
    BriefcaseIcon,
    GraduationCapIcon,
    UsersIcon,
    StarIcon,
    PhoneIcon,
    FlagIcon,
} from './Icons';
import Button from './Button';
import ReportModal from './ReportModal';
import { api } from '../utils/api';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

interface ProfileDetailProps {
    profile: any;
    onBack: () => void;
    editable?: boolean;
}

export default function ProfileDetail({ profile, onBack, editable = false }: ProfileDetailProps) {
    const { t } = useTranslation();
    const [activeModal, setActiveModal] = useState<'none' | 'report'>('none');
    const [requestingContact, setRequestingContact] = useState(false);

    if (!profile) return null;

    const handleRequestContact = async () => {
        setRequestingContact(true);
        try {
            await api.post('/member/view-contact-store', { id: profile.id });
            Alert.alert(t('common.success'), t('profileDetail.viewContact'));
        } catch (error) {
            Alert.alert(t('common.error'), t('report.reportFailed'));
        } finally {
            setRequestingContact(false);
        }
    };

    return (
        <Modal animationType="slide" visible={!!profile} onRequestClose={onBack}>
            <View className="flex-1 bg-white">
                <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
                    {/* Header Image */}
                    <View className="h-[400px] relative">
                        {profile.avatarUrl ? (
                            <Image
                                source={{ uri: profile.avatarUrl }}
                                className="w-full h-full"
                                resizeMode="cover"
                            />
                        ) : (
                            <View className="w-full h-full bg-slate-200 items-center justify-center">
                                <UsersIcon size={64} color="#94a3b8" />
                            </View>
                        )}
                        <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.8)']}
                            className="absolute bottom-0 left-0 right-0 h-40 px-6 pb-6 justify-end"
                        >
                            <Text className="text-white text-3xl font-bold">
                                {profile.name}, {profile.age}
                            </Text>
                            <Text className="text-white/90 text-lg">{profile.specialty}</Text>
                        </LinearGradient>

                        <TouchableOpacity
                            onPress={onBack}
                            className="absolute top-12 left-6 w-10 h-10 bg-black/30 rounded-full items-center justify-center"
                        >
                            <ChevronLeftIcon size={24} color="white" />
                        </TouchableOpacity>

                        {!editable && (
                            <TouchableOpacity
                                onPress={() => setActiveModal('report')}
                                className="absolute top-12 right-6 w-10 h-10 bg-black/30 rounded-full items-center justify-center"
                            >
                                <FlagIcon size={20} color="white" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Content */}
                    <View className="p-6 -mt-6 bg-white rounded-t-[32px]">
                        {/* Key Stats */}
                        <View className="flex-row justify-between mb-8 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <View className="items-center">
                                <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mb-1">
                                    <StarIcon size={20} color="#2563eb" />
                                </View>
                                <Text className="text-slate-900 font-bold">
                                    {profile.matchPercentage}%
                                </Text>
                                <Text className="text-slate-500 text-xs">
                                    {t('profileDetail.match')}
                                </Text>
                            </View>
                            <View className="items-center">
                                <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center mb-1">
                                    <MapPinIcon size={20} color="#16a34a" />
                                </View>
                                <Text className="text-slate-900 font-bold" numberOfLines={1}>
                                    {profile.location?.split(',')[0] || 'Unknown'}
                                </Text>
                                <Text className="text-slate-500 text-xs">
                                    {t('profileDetail.location')}
                                </Text>
                            </View>
                            <View className="items-center">
                                <View className="w-10 h-10 bg-purple-100 rounded-full items-center justify-center mb-1">
                                    <GraduationCapIcon size={20} color="#9333ea" />
                                </View>
                                <Text className="text-slate-900 font-bold" numberOfLines={1}>
                                    {profile.degree || 'MBBS'}
                                </Text>
                                <Text className="text-slate-500 text-xs">
                                    {t('profileDetail.education')}
                                </Text>
                            </View>
                        </View>

                        <Section
                            title={t('profileDetail.about')}
                            icon={<UsersIcon size={18} color="#64748b" />}
                        >
                            <Text className="text-slate-600 leading-6">
                                {profile.about ||
                                    t('profileDetail.defaultAbout', {
                                        name: profile.name,
                                        specialty: profile.specialty,
                                        hospital: profile.hospital || 'a leading hospital',
                                    })}
                            </Text>
                        </Section>

                        <Section
                            title={t('profileDetail.basicDetails')}
                            icon={<BriefcaseIcon size={18} color="#64748b" />}
                        >
                            <DetailRow
                                label={t('profileDetail.age')}
                                value={t('profileDetail.years', { age: profile.age })}
                            />
                            <DetailRow
                                label={t('profileDetail.height')}
                                value={profile.height || '5\'8"'}
                            />
                            <DetailRow
                                label={t('profileDetail.religion')}
                                value={profile.religion || t('profileDetail.notSpecified')}
                            />
                            <DetailRow
                                label={t('profileDetail.community')}
                                value={profile.caste || t('profileDetail.notSpecified')}
                            />
                            <DetailRow
                                label={t('profileDetail.maritalStatus')}
                                value={profile.marital_status || t('profileDetail.neverMarried')}
                            />
                        </Section>

                        <Section
                            title={t('profileDetail.careerEducation')}
                            icon={<GraduationCapIcon size={18} color="#64748b" />}
                        >
                            <DetailRow
                                label={t('profileDetail.profession')}
                                value={profile.specialty}
                            />
                            <DetailRow
                                label={t('profileDetail.employer')}
                                value={profile.hospital || t('profileDetail.privatePractice')}
                            />
                            <DetailRow
                                label={t('profileDetail.education')}
                                value={profile.education || t('profileDetail.medicalDegree')}
                            />
                            <DetailRow
                                label={t('profileDetail.annualIncome')}
                                value={profile.income || t('profileDetail.confidential')}
                            />
                        </Section>

                        {!editable && (
                            <View className="mt-8 mb-8">
                                <Button
                                    onPress={handleRequestContact}
                                    title={
                                        requestingContact
                                            ? t('profileDetail.requesting')
                                            : t('profileDetail.viewContact')
                                    }
                                    icon={<PhoneIcon size={20} color="white" />}
                                    loading={requestingContact}
                                />
                                <Text className="text-center text-slate-400 text-xs mt-3">
                                    {t('profileDetail.contactShared')}
                                </Text>
                            </View>
                        )}
                    </View>
                </ScrollView>

                {/* Modals */}
                <ReportModal
                    visible={activeModal === 'report'}
                    onClose={() => setActiveModal('none')}
                    userId={profile.id}
                    userName={profile.name}
                />
            </View>
        </Modal>
    );
}

const Section = ({ title, icon, children }: any) => (
    <View className="mb-8">
        <View className="flex-row items-center gap-2 mb-3">
            {icon}
            <Text className="text-lg font-bold text-slate-900">{title}</Text>
        </View>
        <View>{children}</View>
    </View>
);

const DetailRow = ({ label, value }: any) => (
    <View className="flex-row justify-between py-2 border-b border-slate-50">
        <Text className="text-slate-500">{label}</Text>
        <Text className="text-slate-900 font-medium text-right">{value}</Text>
    </View>
);
