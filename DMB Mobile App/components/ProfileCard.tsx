import React from 'react';
import { View, Text, Dimensions, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { MapPinIcon, BriefcaseIcon, GraduationCapIcon, StarIcon, UsersIcon, CheckCircleIcon, StethoscopeIcon } from './Icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.9;
const CARD_HEIGHT = 520;

interface ProfileCardProps {
    id: string | number;
    name: string;
    age: number | string;
    specialty: string;
    location: string;
    education: string;
    matchScore: number;
    avatarUrl?: string;
    isVerified?: boolean;
    isOnline?: boolean;
    hospital?: string;
    onPress: () => void;
}

export default function ProfileCard({ 
    name, 
    age, 
    specialty, 
    location, 
    education, 
    matchScore, 
    avatarUrl, 
    onPress,
    isVerified = false,
    isOnline = false,
    hospital
}: ProfileCardProps) {
    const { t } = useTranslation();
    const blurhash = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

    return (
        <TouchableOpacity 
            activeOpacity={0.92} 
            onPress={onPress}
            className="items-center"
        >
            <View 
                className="bg-white rounded-[36px] overflow-hidden shadow-2xl shadow-slate-200/60 border border-slate-100" 
                style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
            >
                {/* Image Section */}
                <View className="h-[78%] relative">
                    {avatarUrl ? (
                         <Image 
                            source={{ uri: avatarUrl }} 
                            placeholder={blurhash}
                            contentFit="cover"
                            transition={500}
                            className="w-full h-full"
                        />
                    ) : (
                        <View className="w-full h-full bg-slate-100 items-center justify-center">
                            <UsersIcon size={80} color="#cbd5e1" />
                        </View>
                    )}
                   
                    {/* Gradient Overlay */}
                    <LinearGradient
                        colors={['transparent', 'transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.85)']}
                        locations={[0, 0.4, 0.7, 1]}
                        className="absolute inset-0 justify-end px-6 pb-6"
                    >
                        {/* Name & Age */}
                        <View className="flex-row items-center gap-2">
                             <Text className="text-white text-[32px] font-bold tracking-tight">{name}</Text>
                             {isVerified && (
                                 <CheckCircleIcon size={24} color="#3b82f6" fill="white" className="mt-1" />
                             )}
                             <Text className="text-white/90 text-2xl font-light ml-1">{age}</Text>
                        </View>

                        {/* Specialty / Profession */}
                        <View className="mt-2 flex-row items-center gap-2">
                            <View className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl flex-row items-center gap-1.5 border border-white/10">
                                <StethoscopeIcon size={14} color="white" />
                                <Text className="text-white font-semibold text-sm">{specialty}</Text>
                            </View>
                            {hospital && (
                                <Text className="text-white/80 text-sm font-medium truncate shield-check" numberOfLines={1}>
                                    @{hospital}
                                </Text>
                            )}
                        </View>
                    </LinearGradient>

                    {/* Match Badge (Top Right) */}
                    <View className="absolute top-5 right-5 bg-white/90 backdrop-blur-xl px-3 pl-2.5 py-1.5 rounded-full flex-row items-center gap-1.5 shadow-sm border border-white/50">
                        <StarIcon size={14} color="#d97706" fill="#d97706" />
                        <Text className="text-slate-900 font-extrabold text-xs">{t('profileCard.match', { score: matchScore })}</Text>
                    </View>

                    {/* Online Indicator (Top Left) */}
                    {isOnline && (
                        <View className="absolute top-5 left-5 bg-green-500/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20 shadow-sm">
                            <Text className="text-white font-bold text-[10px] uppercase tracking-wider">{t('profileCard.online')}</Text>
                        </View>
                    )}
                </View>

                {/* Details Section */}
                <View className="flex-1 px-6 py-5 justify-between bg-white relative">
                    <View className="flex-row items-start pt-1">
                        {/* Location */}
                        <View className="flex-1 flex-row gap-3 pr-2 border-r border-slate-100">
                            <View className="w-8 h-8 rounded-full bg-blue-50 items-center justify-center">
                                <MapPinIcon size={16} color="#3b82f6" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-0.5">{t('profileCard.location')}</Text>
                                <Text className="text-slate-700 font-semibold text-sm leading-5" numberOfLines={2}>{location}</Text>
                            </View>
                        </View>

                        {/* Education */}
                        <View className="flex-1 flex-row gap-3 pl-4">
                            <View className="w-8 h-8 rounded-full bg-indigo-50 items-center justify-center">
                                <GraduationCapIcon size={16} color="#4f46e5" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-0.5">{t('profileCard.education')}</Text>
                                <Text className="text-slate-700 font-semibold text-sm leading-5" numberOfLines={2}>{education}</Text>
                            </View>
                        </View>
                    </View>
                    
                    {/* Decorative bottom line */}
                    <View className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-80" />
                </View>
            </View>
        </TouchableOpacity>
    );
}
