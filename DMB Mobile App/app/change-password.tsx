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
    LockIcon,
    ChevronLeftIcon,
    EyeIcon,
    EyeOffIcon,
    CheckCircleIcon,
    ShieldIcon,
} from '../components/Icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';

const ChangePasswordScreen = () => {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formData, setFormData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: '',
    });

    const passwordRequirements = [
        { label: t('changePassword.req8Chars'), check: (p: string) => p.length >= 8 },
        { label: t('changePassword.reqUppercase'), check: (p: string) => /[A-Z]/.test(p) },
        { label: t('changePassword.reqLowercase'), check: (p: string) => /[a-z]/.test(p) },
        { label: t('changePassword.reqNumber'), check: (p: string) => /\d/.test(p) },
        {
            label: t('changePassword.reqSpecial'),
            check: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p),
        },
    ];

    const handleSubmit = async () => {
        if (!formData.current_password) {
            Alert.alert(t('common.error'), t('changePassword.enterCurrent'));
            return;
        }
        if (!formData.new_password) {
            Alert.alert(t('common.error'), t('changePassword.enterNew'));
            return;
        }
        if (formData.new_password !== formData.confirm_password) {
            Alert.alert(t('common.error'), t('changePassword.noMatch'));
            return;
        }
        if (formData.new_password.length < 8) {
            Alert.alert(t('common.error'), t('changePassword.min8'));
            return;
        }

        setLoading(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            const response = await api.post('/member/change/password', {
                old_password: formData.current_password,
                password: formData.new_password,
                password_confirmation: formData.confirm_password,
            });

            if (response.data.result) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert(t('common.success'), t('changePassword.changed'), [
                    { text: t('common.ok'), onPress: () => router.back() },
                ]);
            } else {
                Alert.alert(
                    t('common.error'),
                    response.data.message || t('changePassword.changeFailed'),
                );
            }
        } catch (error: any) {
            Alert.alert(
                t('common.error'),
                error.response?.data?.message || t('changePassword.changeFailed'),
            );
        } finally {
            setLoading(false);
        }
    };

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
                        {t('changePassword.title')}
                    </Text>
                    <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
                        <LockIcon size={20} color="white" />
                    </View>
                </View>

                <View className="items-center pb-8">
                    <View className="w-20 h-20 rounded-full bg-white/20 items-center justify-center mb-3">
                        <ShieldIcon size={40} color="white" />
                    </View>
                    <Text className="text-white/80 text-sm text-center px-8">
                        {t('changePassword.subtitle')}
                    </Text>
                </View>
            </LinearGradient>

            <ScrollView className="flex-1 px-4 -mt-4" showsVerticalScrollIndicator={false}>
                <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    className="bg-white rounded-2xl p-6 shadow-sm"
                >
                    {/* Current Password */}
                    <View className="mb-4">
                        <Text className="text-xs font-bold text-slate-500 uppercase mb-2">
                            {t('changePassword.currentPassword')}
                        </Text>
                        <View className="flex-row items-center bg-slate-100 rounded-xl px-4">
                            <TextInput
                                className="flex-1 py-4 text-base text-slate-900"
                                value={formData.current_password}
                                onChangeText={(v) =>
                                    setFormData((prev) => ({ ...prev, current_password: v }))
                                }
                                placeholder="Enter current password"
                                secureTextEntry={!showCurrentPassword}
                                placeholderTextColor="#94a3b8"
                            />
                            <TouchableOpacity
                                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                            >
                                {showCurrentPassword ? (
                                    <EyeOffIcon size={20} color="#64748b" />
                                ) : (
                                    <EyeIcon size={20} color="#64748b" />
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* New Password */}
                    <View className="mb-4">
                        <Text className="text-xs font-bold text-slate-500 uppercase mb-2">
                            {t('changePassword.newPassword')}
                        </Text>
                        <View className="flex-row items-center bg-slate-100 rounded-xl px-4">
                            <TextInput
                                className="flex-1 py-4 text-base text-slate-900"
                                value={formData.new_password}
                                onChangeText={(v) =>
                                    setFormData((prev) => ({ ...prev, new_password: v }))
                                }
                                placeholder="Enter new password"
                                secureTextEntry={!showNewPassword}
                                placeholderTextColor="#94a3b8"
                            />
                            <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                                {showNewPassword ? (
                                    <EyeOffIcon size={20} color="#64748b" />
                                ) : (
                                    <EyeIcon size={20} color="#64748b" />
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Password Requirements */}
                    <View className="mb-4 bg-slate-50 rounded-xl p-3">
                        {passwordRequirements.map((req, index) => {
                            const passed = req.check(formData.new_password);
                            return (
                                <View
                                    key={index}
                                    className="flex-row items-center mb-1.5 last:mb-0"
                                >
                                    <View
                                        className={`w-4 h-4 rounded-full items-center justify-center ${
                                            passed ? 'bg-emerald-500' : 'bg-slate-300'
                                        }`}
                                    >
                                        {passed && <CheckCircleIcon size={10} color="white" />}
                                    </View>
                                    <Text
                                        className={`ml-2 text-sm ${passed ? 'text-emerald-600' : 'text-slate-500'}`}
                                    >
                                        {req.label}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>

                    {/* Confirm Password */}
                    <View className="mb-6">
                        <Text className="text-xs font-bold text-slate-500 uppercase mb-2">
                            {t('changePassword.confirmNewPassword')}
                        </Text>
                        <View className="flex-row items-center bg-slate-100 rounded-xl px-4">
                            <TextInput
                                className="flex-1 py-4 text-base text-slate-900"
                                value={formData.confirm_password}
                                onChangeText={(v) =>
                                    setFormData((prev) => ({ ...prev, confirm_password: v }))
                                }
                                placeholder="Confirm new password"
                                secureTextEntry={!showConfirmPassword}
                                placeholderTextColor="#94a3b8"
                            />
                            <TouchableOpacity
                                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? (
                                    <EyeOffIcon size={20} color="#64748b" />
                                ) : (
                                    <EyeIcon size={20} color="#64748b" />
                                )}
                            </TouchableOpacity>
                        </View>
                        {formData.confirm_password &&
                            formData.new_password !== formData.confirm_password && (
                                <Text className="text-red-500 text-xs mt-1">
                                    {t('changePassword.noMatch')}
                                </Text>
                            )}
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={loading}
                        className="overflow-hidden rounded-xl"
                    >
                        <LinearGradient
                            colors={loading ? ['#94a3b8', '#94a3b8'] : ['#1e3a8a', '#3b82f6']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            className="py-4 items-center flex-row justify-center"
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <LockIcon size={20} color="white" />
                                    <Text className="text-white font-bold text-lg ml-2">
                                        {t('changePassword.updatePassword')}
                                    </Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </MotiView>

                <View className="h-28" />
            </ScrollView>
        </View>
    );
};

export default ChangePasswordScreen;
