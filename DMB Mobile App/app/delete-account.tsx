import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import Background from '../components/Background';
import { api } from '../utils/api';
import {
    ChevronLeftIcon,
    TrashIcon,
    AlertTriangleIcon,
    CheckCircleIcon,
    XCircleIcon,
    LockIcon,
    UserXIcon,
} from '../components/Icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const deleteReasonKeys = [
    { id: 'found_match', labelKey: 'deleteAccount.reasonFoundMatch' },
    { id: 'not_satisfied', labelKey: 'deleteAccount.reasonNotSatisfied' },
    { id: 'privacy', labelKey: 'deleteAccount.reasonPrivacy' },
    { id: 'too_expensive', labelKey: 'deleteAccount.reasonExpensive' },
    { id: 'no_good_matches', labelKey: 'deleteAccount.reasonNoMatches' },
    { id: 'technical_issues', labelKey: 'deleteAccount.reasonTechnical' },
    { id: 'other', labelKey: 'deleteAccount.reasonOther' },
];

const DeleteAccountScreen = () => {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [selectedReason, setSelectedReason] = useState('');
    const [otherReason, setOtherReason] = useState('');
    const [password, setPassword] = useState('');
    const [confirmText, setConfirmText] = useState('');

    const handleNext = () => {
        if (step === 1 && !selectedReason) {
            Alert.alert(t('common.required'), t('deleteAccount.selectReason'));
            return;
        }
        if (step === 1 && selectedReason === 'other' && !otherReason.trim()) {
            Alert.alert(t('common.required'), t('deleteAccount.specifyReason'));
            return;
        }
        setStep(step + 1);
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        } else {
            router.back();
        }
    };

    const handleDeleteAccount = async () => {
        if (!password) {
            Alert.alert(t('common.required'), t('deleteAccount.enterPassword'));
            return;
        }
        if (confirmText.toLowerCase() !== 'delete') {
            Alert.alert(t('deleteAccount.confirmRequired'), t('deleteAccount.typeDelete'));
            return;
        }

        Alert.alert(t('deleteAccount.finalConfirmTitle'), t('deleteAccount.finalConfirmMsg'), [
            { text: t('common.cancel'), style: 'cancel' },
            {
                text: t('deleteAccount.yesDelete'),
                style: 'destructive',
                onPress: async () => {
                    setLoading(true);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

                    try {
                        const response = await api.post('/member/account/delete', {
                            reason: selectedReason === 'other' ? otherReason : selectedReason,
                            password: password,
                        });

                        if (response.data.result) {
                            // Clear all local data
                            await AsyncStorage.multiRemove([
                                'token',
                                'user',
                                'profile',
                                'settings',
                            ]);

                            Alert.alert(
                                t('deleteAccount.deletedTitle'),
                                t('deleteAccount.deletedMsg'),
                                [
                                    {
                                        text: 'OK',
                                        onPress: () => {
                                            router.replace('/login');
                                        },
                                    },
                                ],
                            );
                        } else {
                            Alert.alert(
                                t('common.error'),
                                response.data.message || t('deleteAccount.deleteFailed'),
                            );
                        }
                    } catch (error: any) {
                        if (error.response?.status === 401) {
                            Alert.alert(
                                t('deleteAccount.wrongPassword'),
                                t('deleteAccount.wrongPasswordMsg'),
                            );
                        } else {
                            Alert.alert(
                                t('common.error'),
                                error.response?.data?.message || t('deleteAccount.deleteFailed'),
                            );
                        }
                    } finally {
                        setLoading(false);
                    }
                },
            },
        ]);
    };

    return (
        <View className="flex-1 bg-slate-50">
            <Background />

            {/* Header */}
            <LinearGradient
                colors={['#7f1d1d', '#991b1b']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ paddingTop: insets.top }}
            >
                <View className="flex-row items-center justify-between px-4 py-4">
                    <TouchableOpacity
                        onPress={handleBack}
                        className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
                    >
                        <ChevronLeftIcon size={24} color="white" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-white">{t('deleteAccount.title')}</Text>
                    <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
                        <UserXIcon size={20} color="white" />
                    </View>
                </View>

                {/* Progress */}
                <View className="px-4 pb-6">
                    <View className="flex-row items-center justify-center">
                        {[1, 2, 3].map((s) => (
                            <React.Fragment key={s}>
                                <View
                                    className={`w-8 h-8 rounded-full items-center justify-center ${
                                        step >= s ? 'bg-white' : 'bg-white/30'
                                    }`}
                                >
                                    <Text
                                        className={`font-bold ${step >= s ? 'text-red-700' : 'text-white'}`}
                                    >
                                        {s}
                                    </Text>
                                </View>
                                {s < 3 && (
                                    <View
                                        className={`w-12 h-1 mx-1 rounded ${
                                            step > s ? 'bg-white' : 'bg-white/30'
                                        }`}
                                    />
                                )}
                            </React.Fragment>
                        ))}
                    </View>
                    <View className="flex-row justify-between mt-2 px-2">
                        <Text className="text-white/70 text-xs">
                            {t('deleteAccount.stepReason')}
                        </Text>
                        <Text className="text-white/70 text-xs">
                            {t('deleteAccount.stepReview')}
                        </Text>
                        <Text className="text-white/70 text-xs">
                            {t('deleteAccount.stepConfirm')}
                        </Text>
                    </View>
                </View>
            </LinearGradient>

            <ScrollView className="flex-1 px-4 -mt-4" showsVerticalScrollIndicator={false}>
                {/* Step 1: Reason */}
                {step === 1 && (
                    <MotiView
                        from={{ opacity: 0, translateX: 50 }}
                        animate={{ opacity: 1, translateX: 0 }}
                        className="bg-white rounded-2xl p-4 shadow-sm"
                    >
                        <Text className="text-lg font-bold text-slate-900 mb-2">
                            {t('deleteAccount.sorryToGo')}
                        </Text>
                        <Text className="text-slate-600 mb-4">{t('deleteAccount.whyLeaving')}</Text>

                        {deleteReasonKeys.map((reason) => (
                            <TouchableOpacity
                                key={reason.id}
                                onPress={() => setSelectedReason(reason.id)}
                                className={`flex-row items-center p-4 rounded-xl mb-2 border-2 ${
                                    selectedReason === reason.id
                                        ? 'border-red-500 bg-red-50'
                                        : 'border-slate-200'
                                }`}
                            >
                                <View
                                    className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                                        selectedReason === reason.id
                                            ? 'border-red-500 bg-red-500'
                                            : 'border-slate-300'
                                    }`}
                                >
                                    {selectedReason === reason.id && (
                                        <CheckCircleIcon size={12} color="white" />
                                    )}
                                </View>
                                <Text
                                    className={`ml-3 ${
                                        selectedReason === reason.id
                                            ? 'text-red-700 font-semibold'
                                            : 'text-slate-700'
                                    }`}
                                >
                                    {t(reason.labelKey)}
                                </Text>
                            </TouchableOpacity>
                        ))}

                        {selectedReason === 'other' && (
                            <TextInput
                                className="bg-slate-100 rounded-xl p-4 mt-2 text-slate-900"
                                value={otherReason}
                                onChangeText={setOtherReason}
                                placeholder="Please tell us more..."
                                placeholderTextColor="#94a3b8"
                                multiline
                                numberOfLines={3}
                            />
                        )}
                    </MotiView>
                )}

                {/* Step 2: Review */}
                {step === 2 && (
                    <MotiView
                        from={{ opacity: 0, translateX: 50 }}
                        animate={{ opacity: 1, translateX: 0 }}
                        className="bg-white rounded-2xl p-4 shadow-sm"
                    >
                        <View className="items-center mb-6">
                            <View className="w-20 h-20 rounded-full bg-red-100 items-center justify-center mb-4">
                                <AlertTriangleIcon size={40} color="#dc2626" />
                            </View>
                            <Text className="text-xl font-bold text-slate-900 text-center">
                                {t('deleteAccount.whatYouLose')}
                            </Text>
                        </View>

                        <View className="bg-red-50 rounded-xl p-4 mb-4">
                            {[
                                t('deleteAccount.loseProfile'),
                                t('deleteAccount.loseMatches'),
                                t('deleteAccount.loseShortlist'),
                                t('deleteAccount.loseWallet'),
                                t('deleteAccount.losePremium'),
                                t('deleteAccount.losePhotos'),
                            ].map((item, index) => (
                                <View key={index} className="flex-row items-center mb-2 last:mb-0">
                                    <XCircleIcon size={16} color="#dc2626" />
                                    <Text className="text-red-700 ml-2">{item}</Text>
                                </View>
                            ))}
                        </View>

                        <View className="bg-amber-50 rounded-xl p-4">
                            <Text className="text-amber-800 font-semibold mb-2">
                                {t('deleteAccount.considerOptions')}:
                            </Text>
                            <Text className="text-amber-700 text-sm">
                                • {t('deleteAccount.optionHide')} {'\n'}•{' '}
                                {t('deleteAccount.optionDowngrade')} {'\n'}•{' '}
                                {t('deleteAccount.optionSupport')}
                            </Text>
                        </View>
                    </MotiView>
                )}

                {/* Step 3: Confirm */}
                {step === 3 && (
                    <MotiView
                        from={{ opacity: 0, translateX: 50 }}
                        animate={{ opacity: 1, translateX: 0 }}
                        className="bg-white rounded-2xl p-4 shadow-sm"
                    >
                        <View className="items-center mb-6">
                            <View className="w-20 h-20 rounded-full bg-red-100 items-center justify-center mb-4">
                                <TrashIcon size={40} color="#dc2626" />
                            </View>
                            <Text className="text-xl font-bold text-slate-900 text-center">
                                {t('deleteAccount.finalConfirmTitle')}
                            </Text>
                            <Text className="text-slate-500 text-center mt-2">
                                {t('deleteAccount.cannotBeUndone')}
                            </Text>
                        </View>

                        <View className="mb-4">
                            <Text className="text-xs font-bold text-slate-500 uppercase mb-2">
                                {t('deleteAccount.enterYourPassword')}
                            </Text>
                            <View className="flex-row items-center bg-slate-100 rounded-xl px-4">
                                <LockIcon size={20} color="#64748b" />
                                <TextInput
                                    className="flex-1 py-4 ml-3 text-base text-slate-900"
                                    value={password}
                                    onChangeText={setPassword}
                                    placeholder="Your password"
                                    secureTextEntry
                                    placeholderTextColor="#94a3b8"
                                />
                            </View>
                        </View>

                        <View className="mb-4">
                            <Text className="text-xs font-bold text-slate-500 uppercase mb-2">
                                {t('deleteAccount.typeDeleteLabel')}
                            </Text>
                            <TextInput
                                className="bg-slate-100 rounded-xl px-4 py-4 text-base text-slate-900"
                                value={confirmText}
                                onChangeText={setConfirmText}
                                placeholder='Type "DELETE"'
                                placeholderTextColor="#94a3b8"
                                autoCapitalize="characters"
                            />
                        </View>

                        <TouchableOpacity
                            onPress={handleDeleteAccount}
                            disabled={
                                loading || !password || confirmText.toLowerCase() !== 'delete'
                            }
                            className="overflow-hidden rounded-xl"
                        >
                            <LinearGradient
                                colors={
                                    loading || !password || confirmText.toLowerCase() !== 'delete'
                                        ? ['#94a3b8', '#94a3b8']
                                        : ['#991b1b', '#dc2626']
                                }
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                className="py-4 items-center flex-row justify-center"
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <>
                                        <TrashIcon size={20} color="white" />
                                        <Text className="text-white font-bold text-lg ml-2">
                                            {t('deleteAccount.permanentlyDelete')}
                                        </Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </MotiView>
                )}

                {/* Navigation Buttons */}
                {step < 3 && (
                    <TouchableOpacity
                        onPress={handleNext}
                        className="overflow-hidden rounded-xl mt-4"
                    >
                        <LinearGradient
                            colors={['#991b1b', '#dc2626']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            className="py-4 items-center"
                        >
                            <Text className="text-white font-bold text-lg">
                                {t('common.continue')}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                )}

                {step === 1 && (
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="py-4 items-center mt-2"
                    >
                        <Text className="text-slate-500 font-semibold">
                            {t('deleteAccount.changedMind')}
                        </Text>
                    </TouchableOpacity>
                )}

                <View className="h-28" />
            </ScrollView>
        </View>
    );
};

export default DeleteAccountScreen;
