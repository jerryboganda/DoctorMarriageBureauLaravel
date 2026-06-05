import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
    Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import Background from '../components/Background';
import Button from '../components/Button';
import Input from '../components/Input';
import { MailIcon, PhoneIcon, ChevronRightIcon, CheckCircleIcon } from '../components/Icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../utils/api';
import * as Haptics from 'expo-haptics';

type ResetMethod = 'email' | 'phone' | null;

export default function ForgotPassword() {
    const { t } = useTranslation();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(false);
    const [identifier, setIdentifier] = useState('');
    const [method, setMethod] = useState<ResetMethod>(null);
    const [sent, setSent] = useState(false);

    // Auto-detect method based on input
    useEffect(() => {
        if (!identifier) {
            setMethod(null);
            return;
        }

        // Check if it looks like an email
        if (identifier.includes('@')) {
            setMethod('email');
        } else if (identifier.replace(/\D/g, '').length >= 10) {
            // Phone-like (10+ digits)
            setMethod('phone');
        } else {
            setMethod(null);
        }
    }, [identifier]);

    const handleResetRequest = async () => {
        if (!identifier || !method) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert(t('common.error'), t('auth.forgotPassword.invalidInput'));
            return;
        }

        setLoading(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            const payload = {
                [method === 'email' ? 'email' : 'phone']: identifier,
                send_code_by: method,
                email_or_phone: identifier,
            };

            const response = await api.post('/forgot/password', payload);

            if (response.data.result) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                router.push({
                    pathname: '/verify-otp',
                    params: { identifier, method: method || 'email' },
                });
            } else {
                throw new Error(response.data.message);
            }
        } catch (error: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            const message =
                error.response?.data?.message ||
                error.message ||
                t('auth.forgotPassword.sendError');
            Alert.alert(t('common.error'), message);
            console.error('Forgot password error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <View className="flex-1 bg-white">
                <Background />
                <View className="flex-1 items-center justify-center px-6">
                    <MotiView
                        from={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', damping: 12 }}
                        className="w-20 h-20 bg-green-500 rounded-full items-center justify-center mb-6 shadow-xl"
                    >
                        <CheckCircleIcon size={40} color="white" />
                    </MotiView>
                    <Text className="text-2xl font-bold text-slate-900 text-center mb-2">
                        {t('auth.forgotPassword.checkMethod', {
                            method: method === 'email' ? t('common.email') : t('common.phone'),
                        })}
                    </Text>
                    <Text className="text-slate-500 text-center mb-8 leading-6">
                        {t('auth.forgotPassword.codeSentTo')}
                        {'\n'}
                        <Text className="font-bold text-slate-700">{identifier}</Text>
                    </Text>
                    <Button
                        variant="primary"
                        onPress={() => router.replace('/login')}
                        title={t('auth.forgotPassword.backToLogin')}
                    />
                </View>
            </View>
        );
    }

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
                    <View
                        className="flex-1 px-8"
                        style={{ marginTop: insets.top + 20, paddingBottom: 40 }}
                    >
                        {/* Back Button */}
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-100 items-center justify-center mb-10"
                        >
                            <ChevronRightIcon
                                size={20}
                                color="#64748b"
                                style={{ transform: [{ rotate: '180deg' }] }}
                            />
                        </TouchableOpacity>

                        {/* Logo Header */}
                        <MotiView
                            from={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="items-center mb-12"
                        >
                            <Image
                                source={require('../assets/images/logo.png')}
                                style={{ width: 110, height: 90, marginBottom: 16 }}
                                resizeMode="contain"
                            />
                            <Text className="text-3xl font-black text-slate-900 tracking-tight text-center">
                                {t('auth.forgotPassword.title')}
                            </Text>
                            <Text className="text-slate-500 text-lg mt-3 text-center leading-relaxed">
                                {t('auth.forgotPassword.subtitle')}
                            </Text>
                        </MotiView>

                        {/* Form Card */}
                        <MotiView
                            from={{ opacity: 0, translateY: 30 }}
                            animate={{ opacity: 1, translateY: 0 }}
                            transition={{ type: 'timing', duration: 800, delay: 200 }}
                            className="w-full bg-white p-8 rounded-[40px] shadow-2xl shadow-slate-200/50 border border-slate-50 mb-6"
                        >
                            {/* Method Hint */}
                            {method && (
                                <MotiView
                                    from={{ opacity: 0, translateY: -10 }}
                                    animate={{ opacity: 1, translateY: 0 }}
                                    className="flex-row items-center gap-2 mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100"
                                >
                                    {method === 'email' ? (
                                        <MailIcon size={16} color="#2563eb" />
                                    ) : (
                                        <PhoneIcon size={16} color="#2563eb" />
                                    )}
                                    <Text className="text-xs font-semibold text-blue-600">
                                        {method === 'email' ? t('common.email') : t('common.phone')}{' '}
                                        {t('common.verification')}
                                    </Text>
                                </MotiView>
                            )}

                            <Input
                                label={t('auth.forgotPassword.emailLabel')}
                                icon={
                                    method === 'email' ? (
                                        <MailIcon size={22} color="#64748b" />
                                    ) : method === 'phone' ? (
                                        <PhoneIcon size={22} color="#64748b" />
                                    ) : (
                                        <MailIcon size={22} color="#64748b" />
                                    )
                                }
                                keyboardType={method === 'phone' ? 'phone-pad' : 'email-address'}
                                autoCapitalize="none"
                                value={identifier}
                                onChangeText={setIdentifier}
                                placeholder="email@example.com or +1234567890"
                                containerClassName="mb-6"
                            />

                            <Button
                                variant="primary"
                                title={
                                    loading
                                        ? t('common.sending')
                                        : t('auth.forgotPassword.sendResetCode')
                                }
                                fullWidth
                                onPress={handleResetRequest}
                                isLoading={loading}
                                disabled={!method || loading}
                            />
                        </MotiView>

                        <TouchableOpacity
                            onPress={() => router.replace('/login')}
                            className="items-center"
                        >
                            <Text className="text-slate-400 font-medium">
                                {t('auth.forgotPassword.rememberedIt')}{' '}
                                <Text className="text-blue-600 font-bold">
                                    {t('auth.forgotPassword.signIn')}
                                </Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}
