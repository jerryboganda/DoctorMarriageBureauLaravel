import React from 'react';
import { Text, ActivityIndicator, Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ButtonProps } from '../types';
import { cn } from '../utils/cn';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const Button: React.FC<ButtonProps> = ({
    children,
    title,
    variant = 'primary',
    isLoading,
    loading,
    icon,
    className,
    textClassName,
    style,
    onPress,
    onClick,
    fullWidth,
    onPressIn,
    onPressOut,
    disabled,
    ...props
}) => {
    const scale = useSharedValue(1);
    const actuallyLoading = isLoading || loading;
    const activeOnPress = onPress || onClick;

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
        };
    });

    const handlePressIn = (event: any) => {
        if (disabled || actuallyLoading) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
        onPressIn?.(event);
    };

    const handlePressOut = (event: any) => {
        if (disabled || actuallyLoading) return;
        scale.value = withSpring(1, { damping: 15, stiffness: 400 });
        onPressOut?.(event);
    };

    const baseContainerStyle =
        'h-14 rounded-2xl flex-row items-center justify-center overflow-hidden';

    const variants: any = {
        primary: 'bg-brand-blue shadow-lg shadow-brand-blue/30',
        secondary: 'bg-white border border-slate-200 shadow-sm',
        outline: 'bg-white border border-slate-200 shadow-sm',
        danger: 'bg-red-500 shadow-lg shadow-red-500/30',
        ghost: 'bg-transparent',
        social: 'bg-white border-2 border-slate-100 shadow-sm',
    };

    const baseTextStyle = 'font-bold text-base text-center';

    const textVariants: any = {
        primary: 'text-white',
        secondary: 'text-slate-700',
        outline: 'text-slate-700',
        danger: 'text-white',
        ghost: 'text-slate-500',
        social: 'text-slate-700',
    };

    return (
        <AnimatedPressable
            onPress={actuallyLoading || disabled ? undefined : activeOnPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            className={cn(
                baseContainerStyle,
                variants[variant],
                fullWidth && 'w-full',
                className,
                (actuallyLoading || disabled) && 'opacity-80',
            )}
            style={[animatedStyle, style as any]}
            disabled={actuallyLoading || disabled}
            {...props}
        >
            {actuallyLoading ? (
                <View className="flex-row items-center gap-2">
                    <ActivityIndicator
                        color={variant === 'primary' || variant === 'danger' ? 'white' : '#334155'}
                    />
                    <Text className={cn(baseTextStyle, textVariants[variant], textClassName)}>
                        Processing...
                    </Text>
                </View>
            ) : (
                <View className="flex-row items-center justify-center gap-2 px-4">
                    {icon && <View>{icon}</View>}
                    {title ? (
                        <Text className={cn(baseTextStyle, textVariants[variant], textClassName)}>
                            {title}
                        </Text>
                    ) : typeof children === 'string' ? (
                        <Text className={cn(baseTextStyle, textVariants[variant], textClassName)}>
                            {children}
                        </Text>
                    ) : (
                        children
                    )}
                </View>
            )}
        </AnimatedPressable>
    );
};

export default Button;
