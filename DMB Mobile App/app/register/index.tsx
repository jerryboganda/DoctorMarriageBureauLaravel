import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
    Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import Background from '../../components/Background';
import Button from '../../components/Button';
import Input from '../../components/Input';
import {
    MailIcon,
    SmartphoneIcon,
    ChevronRightIcon,
    LockIcon,
    CalendarIcon,
    PhoneIcon,
    GoogleIcon,
} from '../../components/Icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../utils/api';
import { useAuthStore } from '../../stores/authStore';
import * as Haptics from 'expo-haptics';
import DatePicker from '../../components/DatePicker';
import { useGoogleAuth } from '../../utils/useGoogleAuth';

type Step = 'method' | 'input' | 'otp' | 'personal' | 'account';

export default function RegisterFlow() {
    const { t } = useTranslation();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { login } = useAuthStore();

    // Safe Google Auth
    const { request, response, promptAsync, isReady } = useGoogleAuth();

    useEffect(() => {
        if (response?.type === 'success') {
            const accessToken =
                response?.authentication?.accessToken || response?.params?.access_token;
            if (accessToken) {
                handleGoogleLogin(accessToken);
            }
        }
    }, [response]);

    const handleGoogleLogin = async (token: string | undefined) => {
        if (!token) return;

        setLoading(true);
        try {
            const res = await api.post('/social-login', {
                social_provider: 'google',
                access_token: token,
            });

            const { access_token, user } = res.data;

            if (access_token && user) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                await login(access_token, user);
                router.replace('/onboarding');
            } else {
                Alert.alert(
                    t('auth.register.errors.regFailedTitle'),
                    t('auth.register.errors.regFailedMsg'),
                );
            }
        } catch (err: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            console.error('Google Registration Error:', err);
            Alert.alert(
                t('auth.register.errors.googleRegError'),
                err.response?.data?.message || t('auth.register.errors.googleRegFailed'),
            );
        } finally {
            setLoading(false);
        }
    };

    const [step, setStep] = useState<Step>('method');
    const [method, setMethod] = useState<'email' | 'phone'>('email');
    const [identifier, setIdentifier] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Profile form
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        gender: 'Male',
        date_of_birth: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
    });

    const otpRefs = useRef<(TextInput | null)[]>([]);

    useEffect(() => {
        if (step === 'personal') {
            setFormData((prev) => ({
                ...prev,
                [method]: identifier,
            }));
        }
    }, [step]);

    const handleMethodSelect = (selectedMethod: 'email' | 'phone') => {
        Haptics.selectionAsync();
        setMethod(selectedMethod);
        setStep('input');
    };

    const handleSendOtp = async () => {
        if (!identifier) {
            setError(
                method === 'email'
                    ? t('auth.register.errors.enterEmail')
                    : t('auth.register.errors.enterPhone'),
            );
            return;
        }

        setLoading(true);
        setError('');
        try {
            const endpoint =
                method === 'email' ? '/send-email-verification' : '/send-phone-verification';
            const payload =
                method === 'email'
                    ? { email: identifier, intent: 'signup' }
                    : { phone: identifier, intent: 'signup' };

            const response = await api.post(endpoint, payload);
            if (response.data.success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setStep('otp');
            } else {
                setError(response.data.message || t('auth.register.errors.failedSendOtp'));
            }
        } catch (err: any) {
            setError(err.response?.data?.message || t('auth.register.errors.failedSendOtp'));
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (value: string, index: number) => {
        if (!/^\d*$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);
        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleVerifyOtp = async () => {
        const code = otp.join('');
        if (code.length !== 6) {
            setError(t('auth.register.errors.enter6Digit'));
            return;
        }

        setLoading(true);
        setError('');
        try {
            const endpoint = method === 'email' ? '/verify-email-code' : '/verify-phone-code';
            const payload =
                method === 'email'
                    ? { email: identifier, code, intent: 'signup' }
                    : { phone: identifier, code, intent: 'signup' };

            const response = await api.post(endpoint, payload);
            if (response.data.success || response.data.result) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setStep('personal');
            } else {
                setError(response.data.message || t('auth.register.errors.invalidCode'));
            }
        } catch (err: any) {
            setError(err.response?.data?.message || t('auth.register.errors.verificationFailed'));
        } finally {
            setLoading(false);
        }
    };

    const validatePersonal = () => {
        if (!formData.first_name || !formData.last_name || !formData.date_of_birth) {
            setError(t('auth.register.errors.fillNameDob'));
            return false;
        }
        setError('');
        return true;
    };

    const handleRegister = async () => {
        if (!formData.email || !formData.phone || !formData.password || !formData.date_of_birth) {
            setError(t('auth.register.errors.allFieldsRequired'));
            return;
        }

        if (formData.password !== formData.password_confirmation) {
            setError(t('auth.register.errors.passwordsMismatch'));
            return;
        }

        setLoading(true);
        setError('');
        try {
            // Create a clean payload object explicitly
            const payload = {
                first_name: formData.first_name,
                last_name: formData.last_name,
                email: formData.email,
                phone: formData.phone,
                password: formData.password,
                password_confirmation: formData.password_confirmation,
                gender: formData.gender,
                date_of_birth: formData.date_of_birth,
                on_behalf: 1,
            };

            console.log('Sending Registration Payload:', payload);

            const response = await api.post('/signup', payload);
            if (response.data.result) {
                const { user, access_token } = response.data;
                await login(access_token, user);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                router.replace('/onboarding');
            } else {
                const rawMsg = response.data.message;
                let processedMsg = t('auth.register.errors.regFailedMsg');

                if (Array.isArray(rawMsg)) {
                    processedMsg = rawMsg.join('\n• ');
                    if (processedMsg) processedMsg = '• ' + processedMsg;
                } else if (typeof rawMsg === 'object' && rawMsg !== null) {
                    processedMsg = Object.values(rawMsg).flat().join('\n• ');
                    if (processedMsg) processedMsg = '• ' + processedMsg;
                } else {
                    processedMsg = rawMsg || t('auth.register.errors.regFailedMsg');
                }

                setError(processedMsg);
            }
        } catch (err: any) {
            console.error('Registration API Error:', err.response?.data);
            const rawMsg = err.response?.data?.message || err.response?.data?.errors;
            let processedMsg = t('auth.register.errors.connectionError');

            if (Array.isArray(rawMsg)) {
                processedMsg = rawMsg.join('\n• ');
                if (processedMsg) processedMsg = '• ' + processedMsg;
            } else if (typeof rawMsg === 'object' && rawMsg !== null) {
                processedMsg = Object.values(rawMsg).flat().join('\n• ');
                if (processedMsg) processedMsg = '• ' + processedMsg;
            } else {
                processedMsg = rawMsg || t('auth.register.errors.regFailedMsg');
            }

            setError(processedMsg);
        } finally {
            setLoading(false);
        }
    };

    const goBack = () => {
        Haptics.selectionAsync();
        if (step === 'input') setStep('method');
        else if (step === 'otp') setStep('input');
        else if (step === 'personal') setStep('otp');
        else if (step === 'account') setStep('personal');
        else router.back();
    };

    return (
        <View className="flex-1 bg-slate-50">
            <Background />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    keyboardShouldPersistTaps="handled"
                >
                    <View
                        className="flex-1 px-6 justify-center"
                        style={{ paddingTop: insets.top + 20, paddingBottom: 40 }}
                    >
                        {/* Back Button */}
                        <TouchableOpacity
                            onPress={goBack}
                            className="absolute top-12 left-6 z-10 w-10 h-10 bg-white/80 rounded-full items-center justify-center shadow-sm"
                            style={{ marginTop: insets.top }}
                        >
                            <ChevronRightIcon
                                size={20}
                                color="#1e293b"
                                style={{ transform: [{ rotate: '180deg' }] }}
                            />
                        </TouchableOpacity>

                        <MotiView
                            from={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'timing', duration: 400 }}
                            className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200 border border-slate-100"
                        >
                            {/* Header */}
                            <View className="items-center mb-8">
                                <Image
                                    source={require('../../assets/images/logo.png')}
                                    style={{ width: 110, height: 90, marginBottom: 16 }}
                                    resizeMode="contain"
                                />
                                <Text className="text-2xl font-bold text-slate-900 text-center tracking-tight">
                                    {step === 'method' && t('auth.register.joinElite')}
                                    {step === 'input' &&
                                        (method === 'email'
                                            ? t('auth.register.professionalEmail')
                                            : t('auth.register.phoneNumber'))}
                                    {step === 'otp' && t('auth.register.verification')}
                                    {step === 'personal' && t('auth.register.personalDetails')}
                                    {step === 'account' && t('auth.register.accountSettings')}
                                </Text>
                                <Text className="text-slate-500 text-center mt-2 text-sm leading-5">
                                    {step === 'method' && t('auth.register.joinDesc')}
                                    {step === 'input' && t('auth.register.emailDesc')}
                                    {step === 'otp' && t('auth.register.verifyDesc', { method })}
                                    {step === 'personal' && t('auth.register.personalDesc')}
                                    {step === 'account' && t('auth.register.accountDesc')}
                                </Text>
                            </View>

                            {error ? (
                                <MotiView
                                    from={{ opacity: 0, translateY: -10 }}
                                    animate={{ opacity: 1, translateY: 0 }}
                                    className="bg-red-50 p-4 rounded-2xl mb-6 border border-red-100"
                                >
                                    <Text className="text-red-600 text-sm text-center font-bold">
                                        {error}
                                    </Text>
                                </MotiView>
                            ) : null}

                            {/* Step: Method Selection */}
                            {step === 'method' && (
                                <MotiView
                                    from={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ type: 'timing', duration: 300 }}
                                >
                                    <TouchableOpacity
                                        onPress={() => handleMethodSelect('email')}
                                        activeOpacity={0.7}
                                        className="flex-row items-center p-5 bg-slate-50 rounded-2xl border border-slate-100 mb-4"
                                    >
                                        <View className="w-12 h-12 bg-blue-600 rounded-xl items-center justify-center mr-4">
                                            <MailIcon size={24} color="white" />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-lg font-bold text-slate-900">
                                                {t('auth.register.emailAddress')}
                                            </Text>
                                            <Text className="text-slate-500 text-xs font-medium uppercase tracking-wider">
                                                {t('auth.register.mostProfessional')}
                                            </Text>
                                        </View>
                                        <ChevronRightIcon size={20} color="#94a3b8" />
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={() => handleMethodSelect('phone')}
                                        activeOpacity={0.7}
                                        className="flex-row items-center p-5 bg-slate-50 rounded-2xl border border-slate-100"
                                    >
                                        <View className="w-12 h-12 bg-slate-900 rounded-xl items-center justify-center mr-4">
                                            <SmartphoneIcon size={24} color="white" />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-lg font-bold text-slate-900">
                                                {t('auth.register.mobilePhone')}
                                            </Text>
                                            <Text className="text-slate-500 text-xs font-medium uppercase tracking-wider">
                                                {t('auth.register.fastestAccess')}
                                            </Text>
                                        </View>
                                        <ChevronRightIcon size={20} color="#94a3b8" />
                                    </TouchableOpacity>

                                    <View className="flex-row items-center my-6">
                                        <View className="flex-1 h-[1px] bg-slate-100" />
                                        <Text className="mx-4 text-slate-300 font-bold text-[10px] uppercase tracking-widest">
                                            {t('auth.register.or')}
                                        </Text>
                                        <View className="flex-1 h-[1px] bg-slate-100" />
                                    </View>

                                    <TouchableOpacity
                                        onPress={() => promptAsync?.()}
                                        disabled={!isReady || loading}
                                        className={`flex-row items-center justify-center h-14 bg-slate-50 border border-slate-100 rounded-2xl ${!isReady || loading ? 'opacity-50' : ''}`}
                                    >
                                        <GoogleIcon size={20} />
                                        <Text className="ml-3 text-slate-700 font-bold text-base">
                                            {t('auth.register.signUpWithGoogle')}
                                        </Text>
                                    </TouchableOpacity>
                                </MotiView>
                            )}

                            {/* Step: Input */}
                            {step === 'input' && (
                                <MotiView
                                    from={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ type: 'timing', duration: 300 }}
                                >
                                    <Input
                                        label={
                                            method === 'email'
                                                ? t('auth.register.professionalEmail')
                                                : t('auth.register.phoneNumber')
                                        }
                                        icon={
                                            method === 'email' ? (
                                                <MailIcon size={20} color="#64748b" />
                                            ) : (
                                                <SmartphoneIcon size={20} color="#64748b" />
                                            )
                                        }
                                        keyboardType={
                                            method === 'email' ? 'email-address' : 'phone-pad'
                                        }
                                        autoCapitalize="none"
                                        value={identifier}
                                        onChangeText={setIdentifier}
                                        placeholder={
                                            method === 'email'
                                                ? 'e.g. name@hospital.com'
                                                : 'e.g. +1 555 0123'
                                        }
                                    />
                                    <Button
                                        variant="primary"
                                        className="mt-6 py-5 rounded-2xl"
                                        onPress={handleSendOtp}
                                        isLoading={loading}
                                    >
                                        {t('auth.register.sendVerificationCode')}
                                    </Button>
                                </MotiView>
                            )}

                            {/* Step: OTP */}
                            {step === 'otp' && (
                                <MotiView
                                    from={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ type: 'timing', duration: 300 }}
                                >
                                    <View className="flex-row justify-between mb-8">
                                        {otp.map((digit, index) => (
                                            <TextInput
                                                key={index}
                                                ref={(ref: any) => (otpRefs.current[index] = ref)}
                                                className="w-[14%] h-16 bg-slate-50 border border-slate-200 rounded-xl text-center text-2xl font-bold text-slate-900"
                                                maxLength={1}
                                                keyboardType="number-pad"
                                                value={digit}
                                                onChangeText={(v) => handleOtpChange(v, index)}
                                                placeholder="•"
                                                placeholderTextColor="#cbd5e1"
                                                onKeyPress={({ nativeEvent }) => {
                                                    if (
                                                        nativeEvent.key === 'Backspace' &&
                                                        !digit &&
                                                        index > 0
                                                    ) {
                                                        otpRefs.current[index - 1]?.focus();
                                                    }
                                                }}
                                            />
                                        ))}
                                    </View>
                                    <Button
                                        variant="primary"
                                        className="py-5 rounded-2xl"
                                        onPress={handleVerifyOtp}
                                        isLoading={loading}
                                    >
                                        {t('auth.register.verifyAccount')}
                                    </Button>
                                    <TouchableOpacity className="mt-6" onPress={handleSendOtp}>
                                        <Text className="text-slate-400 text-center font-medium">
                                            {t('auth.register.didntReceive')}{' '}
                                            <Text className="text-blue-600 font-bold">
                                                {t('auth.register.resendCode')}
                                            </Text>
                                        </Text>
                                    </TouchableOpacity>
                                </MotiView>
                            )}

                            {/* Step: Personal */}
                            {step === 'personal' && (
                                <MotiView
                                    from={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ type: 'timing', duration: 300 }}
                                >
                                    <View className="flex-row gap-4 mb-2">
                                        <View className="flex-1">
                                            <Input
                                                label={t('auth.register.firstName')}
                                                value={formData.first_name}
                                                onChangeText={(v) =>
                                                    setFormData({ ...formData, first_name: v })
                                                }
                                                placeholder="John"
                                            />
                                        </View>
                                        <View className="flex-1">
                                            <Input
                                                label={t('auth.register.lastName')}
                                                value={formData.last_name}
                                                onChangeText={(v) =>
                                                    setFormData({ ...formData, last_name: v })
                                                }
                                                placeholder="Doe"
                                            />
                                        </View>
                                    </View>

                                    <View className="mb-6">
                                        <Text className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1">
                                            {t('auth.register.identifyAs')}
                                        </Text>
                                        <View className="flex-row gap-3">
                                            {[
                                                { value: 'Male', label: t('auth.register.male') },
                                                {
                                                    value: 'Female',
                                                    label: t('auth.register.female'),
                                                },
                                            ].map((g) => (
                                                <TouchableOpacity
                                                    key={g.value}
                                                    onPress={() =>
                                                        setFormData({
                                                            ...formData,
                                                            gender: g.value,
                                                        })
                                                    }
                                                    activeOpacity={0.8}
                                                    className={`flex-1 py-4 rounded-2xl border-2 items-center justify-center ${
                                                        formData.gender === g.value
                                                            ? 'border-blue-600 bg-blue-50'
                                                            : 'border-slate-100 bg-slate-50'
                                                    }`}
                                                >
                                                    <Text
                                                        className={`text-base ${formData.gender === g.value ? 'text-blue-700 font-bold' : 'text-slate-500 font-medium'}`}
                                                    >
                                                        {g.label}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>

                                    <TouchableOpacity
                                        onPress={() => setShowDatePicker(true)}
                                        activeOpacity={0.7}
                                        className="mb-2"
                                    >
                                        <Input
                                            label={t('auth.register.dateOfBirth')}
                                            icon={<CalendarIcon size={20} color="#64748b" />}
                                            value={formData.date_of_birth}
                                            editable={false}
                                            placeholder="YYYY-MM-DD"
                                            pointerEvents="none"
                                        />
                                    </TouchableOpacity>

                                    <Button
                                        variant="primary"
                                        className="mt-8 py-5 rounded-2xl"
                                        onPress={() => validatePersonal() && setStep('account')}
                                    >
                                        {t('auth.register.nextAccountSettings')}
                                    </Button>
                                </MotiView>
                            )}

                            {/* Step: Account */}
                            {step === 'account' && (
                                <MotiView
                                    from={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ type: 'timing', duration: 300 }}
                                >
                                    <Input
                                        label={t('auth.register.emailAddress')}
                                        icon={<MailIcon size={20} color="#64748b" />}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        value={formData.email}
                                        onChangeText={(v) => setFormData({ ...formData, email: v })}
                                        placeholder="name@hospital.com"
                                    />

                                    <Input
                                        label={t('auth.register.phoneNumber')}
                                        icon={<PhoneIcon size={20} color="#64748b" />}
                                        keyboardType="phone-pad"
                                        value={formData.phone}
                                        onChangeText={(v) => setFormData({ ...formData, phone: v })}
                                        placeholder="+92 300 1234567"
                                    />

                                    <Input
                                        label={t('auth.register.securePassword')}
                                        icon={<LockIcon size={20} color="#64748b" />}
                                        secureTextEntry
                                        value={formData.password}
                                        onChangeText={(v) =>
                                            setFormData({ ...formData, password: v })
                                        }
                                        placeholder="••••••••"
                                    />

                                    <Input
                                        label={t('auth.register.confirmPassword')}
                                        icon={<LockIcon size={20} color="#64748b" />}
                                        secureTextEntry
                                        value={formData.password_confirmation}
                                        onChangeText={(v) =>
                                            setFormData({ ...formData, password_confirmation: v })
                                        }
                                        placeholder="••••••••"
                                    />

                                    <Button
                                        variant="primary"
                                        className="mt-8 py-5 rounded-2xl shadow-lg shadow-blue-500/30"
                                        onPress={handleRegister}
                                        isLoading={loading}
                                    >
                                        {t('auth.register.createProfile')}
                                    </Button>
                                </MotiView>
                            )}
                        </MotiView>

                        <DatePicker
                            isOpen={showDatePicker}
                            onClose={() => setShowDatePicker(false)}
                            onSelect={(date) => {
                                const year = date.getFullYear();
                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                const day = String(date.getDate()).padStart(2, '0');
                                setFormData({
                                    ...formData,
                                    date_of_birth: `${year}-${month}-${day}`,
                                });
                            }}
                            initialDate={
                                formData.date_of_birth ? new Date(formData.date_of_birth) : null
                            }
                        />

                        {/* Footer */}
                        {step === 'method' && (
                            <MotiView
                                from={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 500 }}
                                className="mt-8 items-center"
                            >
                                <TouchableOpacity
                                    onPress={() => router.replace('/login')}
                                    className="flex-row items-center py-2"
                                >
                                    <Text className="text-slate-500 text-base">
                                        {t('auth.register.alreadyMember')}{' '}
                                    </Text>
                                    <Text className="text-blue-600 font-bold text-base">
                                        {t('auth.register.signIn')}
                                    </Text>
                                </TouchableOpacity>
                            </MotiView>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}
