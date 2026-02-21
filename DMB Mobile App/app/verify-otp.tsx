import React, { useState } from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MotiView } from 'moti';
import Button from '../components/Button';
import OtpInput from '../components/OtpInput';
import { MailIcon, PhoneIcon, ChevronRightIcon, RefreshCwIcon, ShieldIcon } from '../components/Icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../utils/api';
import * as Haptics from 'expo-haptics';

export default function VerifyOtp() {
    const { t } = useTranslation();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { identifier, method } = useLocalSearchParams<{ identifier: string; method: string }>();
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);

    const handleVerifyOtp = async (code: string) => {
        setLoading(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            const response = await api.post('/verify/password/reset', {
                email_or_phone: identifier,
                code: code
            });

            if (response.data.result) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                router.push({
                    pathname: '/reset-password',
                    params: { identifier, code }
                });
            } else {
                throw new Error(response.data.message);
            }
        } catch (error: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            const message = error.response?.data?.message || error.message || t('auth.verifyOtp.invalidCode');
            Alert.alert(t('auth.verifyOtp.verificationFailed'), message);
            console.error('OTP verification error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        setResending(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        try {
            const payload = {
                [method === 'phone' ? 'phone' : 'email']: identifier,
                send_code_by: method,
                email_or_phone: identifier
            };

            const response = await api.post('/forgot/password', payload);

            if (response.data.result) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert(t('common.sent'), t('auth.verifyOtp.newCodeSent'));
            } else {
                throw new Error(response.data.message);
            }
        } catch (error: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert(t('common.error'), error.message || t('auth.verifyOtp.resendFailed'));
        } finally {
            setResending(false);
        }
    };

    return (
        <View className="flex-1 bg-slate-50">
            <LinearGradient
                colors={['#f8fafc', '#eff6ff', '#ffffff']}
                className="absolute inset-0"
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View className="flex-1 px-8" style={{ marginTop: insets.top + 20, paddingBottom: 40 }}>
                        {/* Back Button */}
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-100 items-center justify-center mb-10"
                        >
                            <ChevronRightIcon size={20} color="#64748b" style={{ transform: [{ rotate: '180deg' }] }} />
                        </TouchableOpacity>

                        {/* Header */}
                        <MotiView
                            from={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="items-center mb-12"
                        >
                            <View className="w-20 h-20 bg-blue-100 rounded-3xl items-center justify-center mb-6 shadow-sm">
                                <ShieldIcon size={40} color="#2563eb" />
                            </View>
                            <Text className="text-3xl font-black text-slate-900 tracking-tight text-center">
                                {t('auth.verifyOtp.title')}
                            </Text>
                            <Text className="text-slate-500 text-lg mt-3 text-center leading-relaxed">
                                {t('auth.verifyOtp.subtitle')}{"\n"}
                                <Text className="font-bold text-slate-700">{identifier}</Text>
                            </Text>
                        </MotiView>

                        {/* OTP Input Card */}
                        <MotiView
                            from={{ opacity: 0, translateY: 30 }}
                            animate={{ opacity: 1, translateY: 0 }}
                            transition={{ type: 'timing', duration: 800, delay: 200 }}
                            className="w-full bg-white px-4 py-8 rounded-[40px] shadow-2xl shadow-slate-200/50 border border-slate-50 mb-8"
                        >
                            <View className="mb-8">
                                <OtpInput length={6} onComplete={handleVerifyOtp} />
                            </View>

                            <TouchableOpacity
                                onPress={handleResendCode}
                                disabled={resending}
                                className="flex-row items-center justify-center gap-2"
                            >
                                <RefreshCwIcon size={16} color={resending ? "#94a3b8" : "#2563eb"} className={resending ? "animate-spin" : ""} />
                                <Text className={`font-bold ${resending ? "text-slate-400" : "text-blue-600"}`}>
                                    {resending ? t('common.sending') : t('auth.verifyOtp.resendCode')}
                                </Text>
                            </TouchableOpacity>
                        </MotiView>

                        {loading && (
                            <MotiView
                                from={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="items-center"
                            >
                                <Text className="text-slate-400 font-medium animate-pulse">
                                    {t('auth.verifyOtp.verifyingCode')}
                                </Text>
                            </MotiView>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}
