import React, { useState, forwardRef, useEffect } from 'react';
import { View, TextInput, Text } from 'react-native';
import Animated, {
    useAnimatedStyle,
    withTiming,
    useSharedValue,
    interpolate,
    Extrapolation,
} from 'react-native-reanimated';
import { MotiView } from 'moti';
import { InputProps } from '../types';
import { cn } from '../utils/cn';

const Input = forwardRef<TextInput, InputProps>(
    (
        {
            label,
            icon,
            error,
            className,
            containerClassName,
            onFocus,
            onBlur,
            value,
            onChangeText,
            defaultValue,
            type,
            onClick,
            placeholder,
            ...props
        },
        ref,
    ) => {
        const [isFocused, setIsFocused] = useState(false);

        const secureTextEntry = type === 'password' || props.secureTextEntry;
        const keyboardType =
            type === 'email' ? 'email-address' : type === 'tel' ? 'phone-pad' : props.keyboardType;

        // Calculate if we have a value to keep the label floating
        const hasValue =
            (value !== undefined && value !== '') ||
            (defaultValue !== undefined && defaultValue !== '');

        const animationProgress = useSharedValue(hasValue ? 1 : 0);

        useEffect(() => {
            animationProgress.value = withTiming(isFocused || hasValue ? 1 : 0, { duration: 200 });
        }, [isFocused, hasValue]);

        const labelStyle = useAnimatedStyle(() => {
            const translateY = interpolate(
                animationProgress.value,
                [0, 1],
                [0, -18],
                Extrapolation.CLAMP,
            );
            const scale = interpolate(
                animationProgress.value,
                [0, 1],
                [1, 0.75],
                Extrapolation.CLAMP,
            );
            const translateX = interpolate(
                animationProgress.value,
                [0, 1],
                [0, icon ? -28 : -8],
                Extrapolation.CLAMP,
            );

            return {
                transform: [{ translateY }, { translateX }, { scale }] as any,
            };
        });

        const borderStyle = useAnimatedStyle(() => {
            return {
                borderColor: withTiming(isFocused ? '#2563EB' : '#e2e8f0', { duration: 200 }),
                borderWidth: withTiming(isFocused ? 2 : 1, { duration: 200 }),
            };
        });

        return (
            <View className={cn('w-full mb-5', containerClassName)}>
                {/* Floating Label */}
                {label && (
                    <Animated.View
                        style={[labelStyle]}
                        className={cn(
                            'absolute top-[18px] z-20 pointer-events-none',
                            icon ? 'left-12' : 'left-4',
                        )}
                    >
                        <Text
                            className={cn(
                                'text-base font-medium text-slate-400',
                                isFocused ? 'text-blue-600' : '',
                            )}
                        >
                            {label}
                        </Text>
                    </Animated.View>
                )}

                <Animated.View
                    className={cn(
                        'flex-row items-center w-full h-[58px] rounded-2xl bg-slate-50/50 px-4 border-slate-200 border',
                        isFocused && 'bg-white',
                    )}
                    style={[borderStyle]}
                    onTouchEnd={onClick as any}
                >
                    {icon && (
                        <View className={cn('mr-3', isFocused ? 'opacity-100' : 'opacity-40')}>
                            {React.cloneElement(
                                icon as React.ReactElement,
                                {
                                    width: 20,
                                    height: 20,
                                    color: isFocused ? '#2563EB' : '#64748b',
                                } as any,
                            )}
                        </View>
                    )}

                    <View className="flex-1 h-full justify-center pt-1">
                        <TextInput
                            ref={ref}
                            className={cn(
                                'w-full text-base font-semibold text-slate-900 h-full',
                                className,
                            )}
                            onFocus={(e) => {
                                setIsFocused(true);
                                onFocus?.(e);
                            }}
                            onBlur={(e) => {
                                setIsFocused(false);
                                onBlur?.(e);
                            }}
                            value={value}
                            onChangeText={onChangeText}
                            placeholder={isFocused ? placeholder : ''}
                            underlineColorAndroid="transparent"
                            placeholderTextColor="#94a3b8"
                            secureTextEntry={secureTextEntry}
                            keyboardType={keyboardType as any}
                            {...props}
                        />
                    </View>
                </Animated.View>

                {error && (
                    <MotiView
                        from={{ opacity: 0, translateY: -5 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        className="flex-row items-center gap-1.5 mt-2 ml-1"
                    >
                        <View className="w-1 h-1 bg-rose-500 rounded-full" />
                        <Text className="text-rose-500 text-xs font-semibold">{error}</Text>
                    </MotiView>
                )}
            </View>
        );
    },
);

export default Input;
