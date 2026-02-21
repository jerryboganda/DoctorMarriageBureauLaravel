import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView, AnimatePresence } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { api } from '../utils/api';
import { useAuthStore } from '../stores/authStore';
import { 
    CheckIcon, ChevronRightIcon, UserIcon, BriefcaseIcon, HeartIcon, SparklesIcon, ChevronLeftIcon 
} from '../components/Icons';
import Button from '../components/Button';
import Input from '../components/Input';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user, checkAuth } = useAuthStore();
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);

    const STEPS = [
        { id: 'welcome', title: t('onboarding.steps.welcome'), subtitle: t('onboarding.steps.welcomeSub') },
        { id: 'identity', title: t('onboarding.steps.identity'), subtitle: t('onboarding.steps.identitySub') },
        { id: 'career', title: t('onboarding.steps.career'), subtitle: t('onboarding.steps.careerSub') },
        { id: 'partner', title: t('onboarding.steps.partner'), subtitle: t('onboarding.steps.partnerSub') },
        { id: 'finish', title: t('onboarding.steps.finish'), subtitle: t('onboarding.steps.finishSub') },
    ];
    
    const [formData, setFormData] = useState({
        // Identity
        gender: '',
        dateOfBirth: '',
        religion: '',
        // Career
        specialty: '',
        degree: '',
        hospital: '',
        // Partner
        partnerMinAge: '',
        partnerMaxAge: '',
        partnerReligion: '',
    });

    const currentStep = STEPS[step];

    const handleNext = () => {
        if (step < STEPS.length - 1) {
            setStep(step + 1);
        } else {
            handleSubmit();
        }
    };

    const handleBack = () => {
        if (step > 0) setStep(step - 1);
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await api.post('/onboarding/complete', formData);
            await checkAuth(); // Refresh user state
            router.replace('/(tabs)');
        } catch (error) {
            Alert.alert(t('onboarding.errorTitle'), t('onboarding.saveFailed'));
        } finally {
            setLoading(false);
        }
    };

    const renderStepContent = () => {
        switch (step) {
            case 0: // Welcome
                return (
                    <View className="items-center py-10">
                        <View className="w-24 h-24 bg-blue-100 rounded-full items-center justify-center mb-6 animate-bounce">
                            <SparklesIcon size={48} color="#2563eb" />
                        </View>
                        <Text className="text-2xl font-bold text-slate-900 text-center mb-2">{t('onboarding.welcomeTitle')}</Text>
                        <Text className="text-slate-500 text-center leading-6">
                            {t('onboarding.welcomeDesc')}
                        </Text>
                    </View>
                );
            case 1: // Identity
                return (
                    <View className="space-y-4">
                        <Input 
                            label={t('onboarding.gender')} 
                            placeholder="Male / Female" 
                            value={formData.gender}
                            onChangeText={(t) => setFormData({...formData, gender: t})}
                        />
                        <Input 
                            label={t('onboarding.dateOfBirth')} 
                            placeholder="YYYY-MM-DD" 
                            value={formData.dateOfBirth}
                            onChangeText={(t) => setFormData({...formData, dateOfBirth: t})}
                        />
                         <Input 
                            label={t('onboarding.religion')} 
                            placeholder="e.g. Islam, Christianity" 
                            value={formData.religion}
                            onChangeText={(t) => setFormData({...formData, religion: t})}
                        />
                    </View>
                );
            case 2: // Career
                return (
                    <View className="space-y-4">
                        <Input 
                            label={t('onboarding.specialty')} 
                            placeholder="e.g. Cardiology" 
                            value={formData.specialty}
                            onChangeText={(t) => setFormData({...formData, specialty: t})}
                        />
                        <Input 
                            label={t('onboarding.degree')} 
                            placeholder="e.g. MBBS, MD" 
                            value={formData.degree}
                            onChangeText={(t) => setFormData({...formData, degree: t})}
                        />
                        <Input 
                            label={t('onboarding.hospital')} 
                            placeholder="Current workplace" 
                            value={formData.hospital}
                            onChangeText={(t) => setFormData({...formData, hospital: t})}
                        />
                    </View>
                );
            case 3: // Partner
                return (
                    <View className="space-y-4">
                        <View className="flex-row gap-4">
                            <View className="flex-1">
                                <Input 
                                    label={t('onboarding.minAge')} 
                                    placeholder="25" 
                                    keyboardType="numeric"
                                    value={formData.partnerMinAge}
                                    onChangeText={(t) => setFormData({...formData, partnerMinAge: t})}
                                />
                            </View>
                            <View className="flex-1">
                                <Input 
                                    label={t('onboarding.maxAge')} 
                                    placeholder="35" 
                                    keyboardType="numeric"
                                    value={formData.partnerMaxAge}
                                    onChangeText={(t) => setFormData({...formData, partnerMaxAge: t})}
                                />
                            </View>
                        </View>
                        <Input 
                            label={t('onboarding.preferredReligion')} 
                            placeholder="Any" 
                            value={formData.partnerReligion}
                            onChangeText={(t) => setFormData({...formData, partnerReligion: t})}
                        />
                    </View>
                );
            case 4: // Finish
                return (
                    <View className="items-center py-10">
                        <View className="w-24 h-24 bg-green-100 rounded-full items-center justify-center mb-6">
                            <CheckIcon size={48} color="#16a34a" />
                        </View>
                        <Text className="text-2xl font-bold text-slate-900 text-center mb-2">{t('onboarding.allSetTitle')}</Text>
                        <Text className="text-slate-500 text-center leading-6">
                            {t('onboarding.allSetDesc')}
                        </Text>
                    </View>
                );
            default:
                return null;
        }
    };

    return (
        <View className="flex-1 bg-white">
            <LinearGradient
                colors={['#1e3a8a', '#3b82f6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ paddingTop: insets.top + 20, paddingBottom: 40 }}
                className="px-6 rounded-b-[40px]"
            >
                <View className="flex-row justify-between items-center mb-6">
                    {step > 0 && (
                        <TouchableOpacity onPress={handleBack} className="p-2 bg-white/20 rounded-full">
                            <ChevronLeftIcon size={24} color="white" />
                        </TouchableOpacity>
                    )}
                    <View className="flex-1 items-end">
                        <Text className="text-white/80 font-bold">{t('onboarding.stepOf', { current: step + 1, total: STEPS.length })}</Text>
                    </View>
                </View>
                
                <Text className="text-white text-3xl font-bold mb-2">{currentStep.title}</Text>
                <Text className="text-blue-100 text-lg">{currentStep.subtitle}</Text>
            </LinearGradient>

            <View className="flex-1 px-6 -mt-10">
                <MotiView
                    key={step}
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 min-h-[300px]"
                >
                    {renderStepContent()}
                </MotiView>
            </View>

            <View className="p-6">
                <Button 
                    onPress={handleNext} 
                    title={step === STEPS.length - 1 ? t('onboarding.startExploring') : t('onboarding.continue')} 
                    loading={loading}
                    icon={<ChevronRightIcon size={20} color="white" />}
                />
            </View>
        </View>
    );
}
