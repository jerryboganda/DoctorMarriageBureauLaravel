import React, { useEffect, useState } from 'react';
import { View, Text, Dimensions, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    withSequence,
    withDelay,
    withRepeat,
    Easing,
    interpolate,
} from 'react-native-reanimated';
import { MotiView, AnimatePresence } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../stores/authStore';
import { HeartIcon, ShieldIcon, StarIcon, ChevronRightIcon } from '../components/Icons';
import Svg, { Circle, Path, Line, Ellipse } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');
const LOGO_SIZE = Math.min(width * 0.55, 240);

const FEATURES = [
    {
        icon: ShieldIcon,
        title: 'Verified Doctors',
        subtitle: 'Only licensed medical professionals',
    },
    { icon: HeartIcon, title: 'Smart Matching', subtitle: 'AI-powered compatibility scores' },
    { icon: StarIcon, title: 'Premium Experience', subtitle: 'Elegant and secure platform' },
];

/* ─── Animated Logo Component ──────────────────────────────────────── */
function AnimatedLogo({ size, phase }: { size: number; phase: 'splash' | 'welcome' }) {
    const s = size;
    const cx = s / 2;
    const cy = s / 2;
    const r = s * 0.4; // circle radius

    // Ring animations
    const ringRotation = useSharedValue(0);
    const ringScale = useSharedValue(0);
    const ringOpacity = useSharedValue(0);
    const pulseScale = useSharedValue(1);

    // Starburst rays
    const raysOpacity = useSharedValue(0);
    const raysRotation = useSharedValue(0);

    // Inner elements
    const caduceusScale = useSharedValue(0);
    const caduceusOpacity = useSharedValue(0);

    // Halo
    const haloOpacity = useSharedValue(0);
    const haloScale = useSharedValue(0.5);

    // Wings
    const leftWingScale = useSharedValue(0);
    const rightWingScale = useSharedValue(0);
    const wingOpacity = useSharedValue(0);

    useEffect(() => {
        // Phase 1: Golden ring appears with scale + fade in
        ringScale.value = withDelay(200, withSpring(1, { damping: 14, stiffness: 80 }));
        ringOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));

        // Phase 2: Starburst rays fade in
        raysOpacity.value = withDelay(600, withTiming(0.7, { duration: 800 }));

        // Phase 3: Caduceus draws in from center
        caduceusScale.value = withDelay(800, withSpring(1, { damping: 12, stiffness: 90 }));
        caduceusOpacity.value = withDelay(700, withTiming(1, { duration: 500 }));

        // Phase 4: Wings sweep outward
        wingOpacity.value = withDelay(1000, withTiming(1, { duration: 400 }));
        leftWingScale.value = withDelay(1000, withSpring(1, { damping: 10, stiffness: 100 }));
        rightWingScale.value = withDelay(1100, withSpring(1, { damping: 10, stiffness: 100 }));

        // Phase 5: Halo appears
        haloOpacity.value = withDelay(1300, withTiming(1, { duration: 600 }));
        haloScale.value = withDelay(1300, withSpring(1, { damping: 14 }));

        // Continuous subtle rotation for rays
        raysRotation.value = withDelay(
            1500,
            withRepeat(withTiming(360, { duration: 40000, easing: Easing.linear }), -1, false),
        );

        // Continuous subtle pulse
        pulseScale.value = withDelay(
            2000,
            withRepeat(
                withSequence(
                    withTiming(1.03, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
                    withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
                ),
                -1,
                true,
            ),
        );
    }, []);

    const ringStyle = useAnimatedStyle(() => ({
        transform: [{ scale: ringScale.value * pulseScale.value }],
        opacity: ringOpacity.value,
    }));

    const raysStyle = useAnimatedStyle(() => ({
        opacity: raysOpacity.value,
        transform: [{ rotate: `${raysRotation.value}deg` }],
    }));

    const caduceusStyle = useAnimatedStyle(() => ({
        transform: [{ scale: caduceusScale.value }],
        opacity: caduceusOpacity.value,
    }));

    const haloStyle = useAnimatedStyle(() => ({
        transform: [{ scale: haloScale.value }],
        opacity: haloOpacity.value,
    }));

    const leftWingStyle = useAnimatedStyle(() => ({
        transform: [
            { scaleX: leftWingScale.value },
            { translateX: interpolate(leftWingScale.value, [0, 1], [20, 0]) },
        ] as const,
        opacity: wingOpacity.value,
    }));

    const rightWingStyle = useAnimatedStyle(() => ({
        transform: [
            { scaleX: rightWingScale.value },
            { translateX: interpolate(rightWingScale.value, [0, 1], [-20, 0]) },
        ] as const,
        opacity: wingOpacity.value,
    }));

    // Starburst ray lines
    const rayCount = 12;
    const innerR = r * 0.82;
    const outerR = r * 1.05;

    return (
        <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }}>
            {/* Layer 1: Rotating sun rays */}
            <Animated.View
                style={[
                    StyleSheet.absoluteFill,
                    raysStyle,
                    { alignItems: 'center', justifyContent: 'center' },
                ]}
            >
                <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
                    {Array.from({ length: rayCount }).map((_, i) => {
                        const angle = (((i * 360) / rayCount - 90) * Math.PI) / 180;
                        const x1 = cx + innerR * Math.cos(angle);
                        const y1 = cy + innerR * Math.sin(angle);
                        const x2 = cx + outerR * Math.cos(angle);
                        const y2 = cy + outerR * Math.sin(angle);
                        return (
                            <Line
                                key={i}
                                x1={x1}
                                y1={y1}
                                x2={x2}
                                y2={y2}
                                stroke="#E5A63B"
                                strokeWidth={2.5}
                                strokeLinecap="round"
                                opacity={0.6}
                            />
                        );
                    })}
                </Svg>
            </Animated.View>

            {/* Layer 2: Golden ring */}
            <Animated.View
                style={[
                    StyleSheet.absoluteFill,
                    ringStyle,
                    { alignItems: 'center', justifyContent: 'center' },
                ]}
            >
                <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
                    <Circle
                        cx={cx}
                        cy={cy}
                        r={r}
                        fill="none"
                        stroke="#E5A63B"
                        strokeWidth={3}
                        opacity={0.9}
                    />
                    <Circle
                        cx={cx}
                        cy={cy}
                        r={r - 4}
                        fill="none"
                        stroke="#E5A63B"
                        strokeWidth={0.5}
                        opacity={0.3}
                    />
                </Svg>
            </Animated.View>

            {/* Layer 3: Wings */}
            <View
                style={[
                    StyleSheet.absoluteFill,
                    { alignItems: 'center', justifyContent: 'center' },
                ]}
            >
                {/* Left Wing */}
                <Animated.View
                    style={[
                        {
                            position: 'absolute',
                            left: cx - r * 0.95,
                            top: cy - r * 0.55,
                        },
                        leftWingStyle,
                    ]}
                >
                    <Svg width={r * 0.85} height={r * 0.55} viewBox="0 0 85 55">
                        <Path
                            d="M85 30 C 70 30, 55 5, 40 12 C 28 18, 15 5, 0 15 C 12 22, 30 38, 50 38 C 65 38, 78 34, 85 30Z"
                            fill="#EF4444"
                            opacity={0.9}
                        />
                        <Path
                            d="M85 34 C 72 34, 55 15, 38 20 C 25 24, 12 15, 3 22 C 15 28, 35 42, 55 42 C 70 42, 80 38, 85 34Z"
                            fill="#DC2626"
                            opacity={0.7}
                        />
                    </Svg>
                </Animated.View>

                {/* Right Wing */}
                <Animated.View
                    style={[
                        {
                            position: 'absolute',
                            right: cx - r * 0.95,
                            top: cy - r * 0.55,
                        },
                        rightWingStyle,
                    ]}
                >
                    <Svg
                        width={r * 0.85}
                        height={r * 0.55}
                        viewBox="0 0 85 55"
                        style={{ transform: [{ scaleX: -1 }] }}
                    >
                        <Path
                            d="M85 30 C 70 30, 55 5, 40 12 C 28 18, 15 5, 0 15 C 12 22, 30 38, 50 38 C 65 38, 78 34, 85 30Z"
                            fill="#EF4444"
                            opacity={0.9}
                        />
                        <Path
                            d="M85 34 C 72 34, 55 15, 38 20 C 25 24, 12 15, 3 22 C 15 28, 35 42, 55 42 C 70 42, 80 38, 85 34Z"
                            fill="#DC2626"
                            opacity={0.7}
                        />
                    </Svg>
                </Animated.View>
            </View>

            {/* Layer 4: Caduceus staff */}
            <Animated.View
                style={[
                    StyleSheet.absoluteFill,
                    caduceusStyle,
                    { alignItems: 'center', justifyContent: 'center' },
                ]}
            >
                <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
                    {/* Main staff */}
                    <Line
                        x1={cx}
                        y1={cy - r * 0.5}
                        x2={cx}
                        y2={cy + r * 0.65}
                        stroke="#2563EB"
                        strokeWidth={3.5}
                        strokeLinecap="round"
                    />
                    {/* Head circle */}
                    <Circle cx={cx} cy={cy - r * 0.52} r={r * 0.08} fill="#2563EB" />
                    {/* Intertwined snakes (left helix) */}
                    <Path
                        d={`M${cx} ${cy + r * 0.6} Q ${cx + r * 0.22} ${cy + r * 0.35} ${cx} ${cy + r * 0.15} Q ${cx - r * 0.22} ${cy - r * 0.05} ${cx} ${cy - r * 0.22} Q ${cx + r * 0.15} ${cy - r * 0.35} ${cx} ${cy - r * 0.42}`}
                        stroke="#2563EB"
                        strokeWidth={3}
                        fill="none"
                        strokeLinecap="round"
                    />
                    {/* Intertwined snakes (right helix) */}
                    <Path
                        d={`M${cx} ${cy + r * 0.6} Q ${cx - r * 0.22} ${cy + r * 0.35} ${cx} ${cy + r * 0.15} Q ${cx + r * 0.22} ${cy - r * 0.05} ${cx} ${cy - r * 0.22} Q ${cx - r * 0.15} ${cy - r * 0.35} ${cx} ${cy - r * 0.42}`}
                        stroke="#2563EB"
                        strokeWidth={3}
                        fill="none"
                        strokeLinecap="round"
                    />
                </Svg>
            </Animated.View>

            {/* Layer 5: Halo */}
            <Animated.View
                style={[
                    {
                        position: 'absolute',
                        top: cy - r * 0.75,
                        alignSelf: 'center',
                    },
                    haloStyle,
                ]}
            >
                <Svg width={r * 0.4} height={r * 0.22} viewBox="0 0 40 22">
                    <Ellipse
                        cx={20}
                        cy={11}
                        rx={18}
                        ry={8}
                        fill="none"
                        stroke="#9CA3AF"
                        strokeWidth={2.5}
                        opacity={0.6}
                    />
                    <Ellipse
                        cx={20}
                        cy={11}
                        rx={18}
                        ry={8}
                        fill="none"
                        stroke="#D1D5DB"
                        strokeWidth={1}
                        opacity={0.3}
                    />
                </Svg>
            </Animated.View>
        </View>
    );
}

/* ─── Main Welcome Screen ──────────────────────────────────────────── */
export default function WelcomeScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
    const [phase, setPhase] = useState<'splash' | 'welcome'>('splash');
    const [currentFeature, setCurrentFeature] = useState(0);

    // Title text animations
    const titleOpacity = useSharedValue(0);
    const titleTranslateY = useSharedValue(20);
    const subtitleOpacity = useSharedValue(0);
    const contentOpacity = useSharedValue(0);

    useEffect(() => {
        checkAuth();
    }, []);

    useEffect(() => {
        // Phase: Title text appears after logo animation
        titleOpacity.value = withDelay(1600, withTiming(1, { duration: 700 }));
        titleTranslateY.value = withDelay(1600, withSpring(0, { damping: 14 }));
        subtitleOpacity.value = withDelay(2000, withTiming(1, { duration: 700 }));

        const timer = setTimeout(() => {
            if (!isLoading) {
                if (isAuthenticated) {
                    router.replace('/(tabs)');
                } else {
                    setPhase('welcome');
                    contentOpacity.value = withTiming(1, { duration: 800 });
                }
            }
        }, 3200);

        return () => clearTimeout(timer);
    }, [isLoading, isAuthenticated]);

    // Feature rotation
    useEffect(() => {
        if (phase !== 'welcome') return;
        const interval = setInterval(() => {
            setCurrentFeature((prev) => (prev + 1) % FEATURES.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [phase]);

    const titleStyle = useAnimatedStyle(() => ({
        opacity: titleOpacity.value,
        transform: [{ translateY: titleTranslateY.value }],
    }));

    const subtitleStyle = useAnimatedStyle(() => ({
        opacity: subtitleOpacity.value,
    }));

    const contentStyle = useAnimatedStyle(() => ({
        opacity: contentOpacity.value,
        transform: [{ translateY: interpolate(contentOpacity.value, [0, 1], [50, 0]) }],
    }));

    const handleGetStarted = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push('/login');
    };

    const handleSignUp = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/register');
    };

    const CurrentIcon = FEATURES[currentFeature].icon;

    return (
        <View className="flex-1 bg-white">
            {/* Dynamic Background */}
            <View className="absolute inset-0">
                <LinearGradient
                    colors={['#f8fafc', '#eef2ff', '#f0f9ff', '#ffffff']}
                    locations={[0, 0.3, 0.6, 1]}
                    className="absolute inset-0"
                />
                {/* Soft ambient glow behind logo */}
                <MotiView
                    from={{ opacity: 0, scale: 0.3 }}
                    animate={{ opacity: 0.15, scale: 1 }}
                    transition={{ type: 'timing', duration: 2000 }}
                    style={{
                        position: 'absolute',
                        top: height * 0.12,
                        left: (width - LOGO_SIZE * 1.8) / 2,
                        width: LOGO_SIZE * 1.8,
                        height: LOGO_SIZE * 1.8,
                        borderRadius: LOGO_SIZE,
                        backgroundColor: '#bfdbfe',
                    }}
                />
                <MotiView
                    from={{ opacity: 0, scale: 0.3 }}
                    animate={{ opacity: 0.08, scale: 1 }}
                    transition={{ type: 'timing', duration: 2800, delay: 500 }}
                    style={{
                        position: 'absolute',
                        bottom: height * 0.15,
                        right: -60,
                        width: 300,
                        height: 300,
                        borderRadius: 150,
                        backgroundColor: '#c7d2fe',
                    }}
                />
            </View>

            <View className="flex-1" style={{ paddingTop: insets.top }}>
                {/* Logo Section – centered in upper portion */}
                <View
                    style={{
                        flex: phase === 'welcome' ? 0.52 : 1,
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <AnimatedLogo size={LOGO_SIZE} phase={phase} />

                    {/* Brand Name Text */}
                    <Animated.View style={[titleStyle, { marginTop: 16 }]} className="items-center">
                        <Text
                            style={{
                                fontSize: 15,
                                fontWeight: '900',
                                letterSpacing: 4,
                                color: '#EF4444',
                                textTransform: 'uppercase',
                            }}
                        >
                            Doctors Marriage
                        </Text>
                        <View className="flex-row items-center mt-1" style={{ gap: 8 }}>
                            <View
                                style={{
                                    width: 28,
                                    height: 2.5,
                                    backgroundColor: '#2563EB',
                                    borderRadius: 2,
                                }}
                            />
                            <Text
                                style={{
                                    fontSize: 20,
                                    fontWeight: '900',
                                    letterSpacing: 5,
                                    color: '#2563EB',
                                    textTransform: 'uppercase',
                                }}
                            >
                                Bureau
                            </Text>
                            <View
                                style={{
                                    width: 28,
                                    height: 2.5,
                                    backgroundColor: '#2563EB',
                                    borderRadius: 2,
                                }}
                            />
                        </View>
                    </Animated.View>

                    {/* Tagline - only visible on splash phase */}
                    {phase === 'splash' && (
                        <Animated.View style={subtitleStyle} className="mt-4">
                            <Text className="text-slate-400 text-sm font-semibold tracking-widest text-center uppercase">
                                Where Medicine Meets Matrimony
                            </Text>
                        </Animated.View>
                    )}
                </View>

                {/* Welcome Content */}
                {phase === 'welcome' && (
                    <Animated.View
                        style={[contentStyle, { flex: 0.48, paddingBottom: insets.bottom + 20 }]}
                        className="px-7"
                    >
                        {/* Feature Card */}
                        <View
                            style={{ minHeight: 200, justifyContent: 'center' }}
                            className="bg-white/80 backdrop-blur-xl rounded-[36px] p-7 mb-7 border border-slate-100 shadow-xl shadow-slate-200/40"
                        >
                            <AnimatePresence exitBeforeEnter>
                                <MotiView
                                    key={currentFeature}
                                    from={{ opacity: 0, translateX: 40 }}
                                    animate={{ opacity: 1, translateX: 0 }}
                                    exit={{ opacity: 0, translateX: -40 }}
                                    transition={{
                                        type: 'timing',
                                        duration: 500,
                                        easing: Easing.bezier(0.2, 1, 0.3, 1),
                                    }}
                                    className="items-center"
                                >
                                    <View className="w-14 h-14 bg-blue-50 rounded-2xl items-center justify-center mb-5 border border-blue-100">
                                        <CurrentIcon size={28} color="#2563EB" />
                                    </View>
                                    <Text className="text-xl font-black text-slate-900 text-center">
                                        {FEATURES[currentFeature].title}
                                    </Text>
                                    <Text className="text-slate-500 text-center mt-2 text-base font-medium leading-relaxed">
                                        {FEATURES[currentFeature].subtitle}
                                    </Text>
                                </MotiView>
                            </AnimatePresence>

                            {/* Progress Dots */}
                            <View className="flex-row justify-center gap-2 mt-6">
                                {FEATURES.map((_, i) => (
                                    <MotiView
                                        key={i}
                                        animate={{
                                            width: i === currentFeature ? 28 : 8,
                                            backgroundColor:
                                                i === currentFeature ? '#2563EB' : '#e2e8f0',
                                        }}
                                        transition={{ type: 'timing', duration: 400 }}
                                        style={{ height: 5, borderRadius: 4 }}
                                    />
                                ))}
                            </View>
                        </View>

                        {/* CTA Buttons */}
                        <View style={{ gap: 12 }}>
                            <TouchableOpacity
                                onPress={handleGetStarted}
                                activeOpacity={0.9}
                                style={{ height: 64, borderRadius: 24 }}
                                className="bg-blue-600 flex-row items-center justify-center shadow-xl shadow-blue-500/30"
                            >
                                <Text className="text-white font-black text-lg mr-2">
                                    Get Started
                                </Text>
                                <ChevronRightIcon size={22} color="white" />
                            </TouchableOpacity>

                            <TouchableOpacity onPress={handleSignUp} className="items-center py-2">
                                <Text className="text-slate-400 font-bold text-base">
                                    New here? <Text className="text-blue-600">Create Account</Text>
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <Text className="text-slate-300 text-center text-[10px] mt-5 font-bold uppercase tracking-[3px]">
                            Professional • Secure • Doctors Only
                        </Text>
                    </Animated.View>
                )}
            </View>
        </View>
    );
}
