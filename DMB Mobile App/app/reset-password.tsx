import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MotiView } from 'moti';
import Button from '../components/Button';
import Input from '../components/Input';
import { LockIcon, KeyIcon, ChevronRightIcon, CheckCircleIcon } from '../components/Icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../utils/api';
import * as Haptics from 'expo-haptics';

export default function ResetPassword() {
    const { t } = useTranslation();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { identifier, code } = useLocalSearchParams<{ identifier: string; code: string }>();
    const [loading, setLoading] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [success, setSuccess] = useState(false);

    const handleResetPassword = async () => {
        if (!password || !confirmPassword) {
            Alert.alert(t('common.error'), t('auth.resetPassword.fillAllFields'));
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert(t('common.error'), t('auth.resetPassword.passwordMismatch'));
            return;
        }

        setLoading(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            const response = await api.post('/password/reset/complete', {
                email_or_phone: identifier,
                code: code,
                password: password,
                password_confirmation: confirmPassword,
            });

            if (response.data.result) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setSuccess(true);
            } else {
                throw new Error(response.data.message);
            }
        } catch (error: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            const message =
                error.response?.data?.message ||
                error.message ||
                t('auth.resetPassword.resetFailed');
            Alert.alert(t('common.error'), message);
            console.error('Password reset error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <View className="flex-1 bg-white">
                <LinearGradient
                    colors={['#f8fafc', '#eff6ff', '#ffffff']}
                    className="absolute inset-0"
                />
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
                        {t('auth.resetPassword.passwordUpdated')}
                    </Text>
                    <Text className="text-slate-500 text-center mb-8 leading-6">
                        {t('auth.resetPassword.passwordUpdatedDesc')}
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

                        {/* Header */}
                        <MotiView
                            from={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="items-center mb-12"
                        >
                            <View className="w-20 h-20 bg-blue-100 rounded-3xl items-center justify-center mb-6 shadow-sm">
                                <KeyIcon size={40} color="#2563eb" />
                            </View>
                            <Text className="text-3xl font-black text-slate-900 tracking-tight text-center">
                                {t('auth.resetPassword.title')}
                            </Text>
                            <Text className="text-slate-500 text-lg mt-3 text-center leading-relaxed">
                                {t('auth.resetPassword.subtitle')}
                            </Text>
                        </MotiView>

                        {/* Form Card */}
                        <MotiView
                            from={{ opacity: 0, translateY: 30 }}
                            animate={{ opacity: 1, translateY: 0 }}
                            transition={{ type: 'timing', duration: 800, delay: 200 }}
                            className="w-full bg-white p-8 rounded-[40px] shadow-2xl shadow-slate-200/50 border border-slate-50 mb-8"
                        >
                            <Input
                                label={t('auth.resetPassword.newPassword')}
                                icon={<LockIcon size={22} color="#64748b" />}
                                secureTextEntry
                                value={password}
                                onChangeText={setPassword}
                                placeholder="Min. 8 characters"
                                containerClassName="mb-6"
                            />

                            <Input
                                label={t('auth.resetPassword.confirmPassword')}
                                icon={<LockIcon size={22} color="#64748b" />}
                                secureTextEntry
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                placeholder="Repeat password"
                                containerClassName="mb-10"
                            />

                            <Button
                                variant="primary"
                                title={
                                    loading
                                        ? t('common.updating')
                                        : t('auth.resetPassword.resetPassword')
                                }
                                fullWidth
                                onPress={handleResetPassword}
                                isLoading={loading}
                                disabled={loading || !password || !confirmPassword}
                            />
                        </MotiView>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}
