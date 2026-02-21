import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert, TextInput as RNTextInput, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter, Link } from 'expo-router';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import Background from '../components/Background';
import Button from '../components/Button';
import Input from '../components/Input';
import { MailIcon, LockIcon, GoogleIcon, AppleIcon, CaduceusIcon, EyeIcon, EyeOffIcon, ChevronLeftIcon } from '../components/Icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../utils/api';
import { useAuthStore } from '../stores/authStore';
import * as Haptics from 'expo-haptics';
import { useGoogleAuth } from '../utils/useGoogleAuth';

export default function Login() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = useRef<RNTextInput>(null);

  const login = useAuthStore((state) => state.login);

  // Safe Google Auth
  const { request, response, promptAsync, isReady } = useGoogleAuth();

  useEffect(() => {
    if (response?.type === 'success') {
      const accessToken = response?.authentication?.accessToken || response?.params?.access_token;
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

        // Check if onboarding is needed
        if (user.birthday || user.phone) {
          router.replace('/(tabs)');
        } else {
          router.replace('/onboarding');
        }
      } else {
        Alert.alert(t('auth.login.loginFailedTitle'), t('auth.login.loginFailedMsg'));
      }
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error('Google Login Error:', error);
      Alert.alert(t('auth.login.googleLoginError'), error.response?.data?.message || t('auth.login.googleLoginFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t('auth.login.missingFieldsTitle'), t('auth.login.missingFieldsMsg'));
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      const response = await api.post('/signin', {
        email_or_phone: email,
        password
      });

      const data = response.data;

      // Handle 2FA required response
      if (data.two_factor_required) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        // TODO: Navigate to 2FA verification screen
        Alert.alert(t('auth.login.twoFactorTitle'), t('auth.login.twoFactorMsg'));
        return;
      }

      const { access_token, user } = data;

      if (access_token && user) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await login(access_token, user);

        // Check if onboarding is needed
        if (user.birthday || user.phone) {
          router.replace('/(tabs)');
        } else {
          router.replace('/onboarding');
        }
      } else {
        const message = data.message || t('auth.login.loginFailedMsg');
        Alert.alert(t('auth.login.loginFailedTitle'), message);
      }

    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error(error);
      const message = error.response?.data?.message || t('auth.login.genericError');
      Alert.alert(t('auth.login.loginFailedTitle'), message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-50">
      <LinearGradient
        colors={['#f8fafc', '#eff6ff', '#ffffff']}
        className="absolute inset-0"
      />

      {/* Subtle background effects */}
      <View className="absolute -top-20 -right-20 w-80 h-80 bg-blue-100/40 rounded-full blur-3xl" style={{ opacity: 0.5 }} />

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
              <ChevronLeftIcon size={20} color="#64748b" />
            </TouchableOpacity>

            {/* Modern Logo Header */}
            <MotiView
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="items-center mb-12"
            >
              <Image
                source={require('../assets/images/logo.png')}
                style={{ width: 160, height: 120, marginBottom: 16 }}
                resizeMode="contain"
              />
              <Text className="text-4xl font-black text-slate-900 tracking-tight text-center">
                {t('auth.login.welcomeBack')}
              </Text>
              <Text className="text-slate-500 text-lg mt-2 text-center font-medium">
                {t('auth.login.subtitle')}
              </Text>
            </MotiView>

            {/* Professional Form Card */}
            <MotiView
              from={{ opacity: 0, translateY: 30 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 200 }}
              className="bg-white p-8 rounded-[40px] shadow-2xl shadow-slate-200/60 border border-slate-50"
            >
              <Input
                label={t('auth.login.emailLabel')}
                icon={<MailIcon />}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />

              <View className="relative">
                <Input
                  ref={passwordRef}
                  label={t('auth.login.passwordLabel')}
                  icon={<LockIcon />}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-5"
                >
                  {showPassword ? <EyeOffIcon size={20} color="#94a3b8" /> : <EyeIcon size={20} color="#94a3b8" />}
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() => router.push('/forgot-password')}
                className="self-end mt-1 mb-8"
              >
                <Text className="text-blue-600 font-bold text-sm">{t('auth.login.forgotPassword')}</Text>
              </TouchableOpacity>

              <Button
                variant="primary"
                fullWidth
                onPress={handleLogin}
                isLoading={loading}
                style={{ height: 58, borderRadius: 20 }}
              >
                {t('auth.login.signIn')}
              </Button>

              <View className="flex-row items-center my-8">
                <View className="flex-1 h-[1px] bg-slate-100" />
                <Text className="mx-4 text-slate-400 font-bold text-[10px] uppercase tracking-widest">{t('auth.login.orContinueWith')}</Text>
                <View className="flex-1 h-[1px] bg-slate-100" />
              </View>

              <View className="flex-row gap-4">
                <TouchableOpacity
                  onPress={() => promptAsync?.()}
                  disabled={!isReady || loading}
                  className={`flex-1 h-14 bg-slate-50 border border-slate-100 rounded-2xl items-center justify-center ${(!isReady || loading) ? 'opacity-50' : ''}`}
                >
                  <GoogleIcon size={22} />
                </TouchableOpacity>
                <TouchableOpacity className="flex-1 h-14 bg-slate-50 border border-slate-100 rounded-2xl items-center justify-center">
                  <AppleIcon size={22} color="black" />
                </TouchableOpacity>
              </View>
            </MotiView>

            <View className="mt-10 mb-10 items-center">
              <Text className="text-slate-400 font-medium text-base">
                {t('auth.login.newHere')} <Text
                  onPress={() => router.push('/register')}
                  className="text-blue-600 font-bold"
                >{t('auth.login.createAccount')}</Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
