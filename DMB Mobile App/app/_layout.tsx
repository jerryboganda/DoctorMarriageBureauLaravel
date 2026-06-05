import { Buffer } from 'buffer';
if (typeof global.Buffer === 'undefined') {
    global.Buffer = Buffer;
}

// i18n must be imported before any component that uses useTranslation
import '../utils/i18n';

import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import {
    NotoSansArabic_300Light,
    NotoSansArabic_400Regular,
    NotoSansArabic_500Medium,
    NotoSansArabic_600SemiBold,
    NotoSansArabic_700Bold,
} from '@expo-google-fonts/noto-sans-arabic';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '../stores/authStore';
import '../global.css';

SplashScreen.preventAutoHideAsync();

function AuthGuard({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading, checkAuth, user } = useAuthStore();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        checkAuth();
    }, []);

    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup =
            segments[0] === '(auth)' ||
            segments[0] === 'login' ||
            segments[0] === 'register' ||
            segments[0] === 'forgot-password' ||
            segments[0] === 'verify-otp' ||
            segments[0] === 'reset-password';
        const isRootSplash = !segments[0] || segments[0] === 'index';
        const isOnboarding = segments[0] === 'onboarding';

        // Heuristic for onboarding: check if user has a birthday/age set
        // This is safe because onboarding.tsx requires dateOfBirth
        const isOnboarded = user?.birthday || user?.phone;

        if (!isAuthenticated && !inAuthGroup && !isOnboarding && !isRootSplash) {
            router.replace('/login');
        } else if (isAuthenticated && inAuthGroup) {
            router.replace('/(tabs)');
        } else if (isAuthenticated && !isOnboarded && !isOnboarding) {
            router.replace('/onboarding');
        } else if (isAuthenticated && isOnboarded && isOnboarding) {
            router.replace('/(tabs)');
        }
    }, [isAuthenticated, isLoading, segments]);

    if (isLoading) {
        return (
            <View className="flex-1 items-center justify-center bg-white">
                <ActivityIndicator size="large" color="#1e3a8a" />
            </View>
        );
    }

    return <>{children}</>;
}

export default function RootLayout() {
    const [loaded, error] = useFonts({
        NotoSansArabic_300Light,
        NotoSansArabic_400Regular,
        NotoSansArabic_500Medium,
        NotoSansArabic_600SemiBold,
        NotoSansArabic_700Bold,
    });

    useEffect(() => {
        if (loaded || error) {
            SplashScreen.hideAsync();
        }
    }, [loaded, error]);

    if (!loaded && !error) {
        return null;
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <StatusBar style="dark" />
            <AuthGuard>
                <Stack
                    screenOptions={{
                        headerShown: false,
                        animation: 'slide_from_right',
                        contentStyle: { backgroundColor: '#ffffff' },
                    }}
                >
                    <Stack.Screen name="index" options={{ animation: 'fade' }} />
                    <Stack.Screen name="login" />
                    <Stack.Screen name="forgot-password" />
                    <Stack.Screen name="verify-otp" />
                    <Stack.Screen name="reset-password" />
                    <Stack.Screen name="register" options={{ animation: 'slide_from_bottom' }} />
                    <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
                    <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
                </Stack>
            </AuthGuard>
        </GestureHandlerRootView>
    );
}
