import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { MotiView, MotiText } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { SparklesIcon, XCircleIcon, CheckCircleIcon, StarIcon, BrainIcon } from './Icons';
import { useTranslation } from 'react-i18next';

interface MatchIntelligenceModalProps {
    visible: boolean;
    onClose: () => void;
    match: {
        name: string;
        percentage?: number;
        specialty?: string;
    } | null;
}

const TRAITS = [
    { label: 'Lifestyle Sync', score: 92, color: 'bg-green-500' },
    { label: 'Career Goals', score: 88, color: 'bg-blue-500' },
    { label: 'Family Values', score: 95, color: 'bg-indigo-500' },
    { label: 'Religious Views', score: 100, color: 'bg-purple-500' },
    { label: 'Personality', score: 84, color: 'bg-pink-500' },
];

import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MatchIntelligenceModal({ visible, onClose, match }: MatchIntelligenceModalProps) {
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();

    if (!match) return null;

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-end">
                <TouchableOpacity
                    className="absolute inset-0 bg-black/50"
                    onPress={onClose}
                    activeOpacity={1}
                />

                <MotiView
                    from={{ translateY: 500 }}
                    animate={{ translateY: 0 }}
                    transition={{ type: 'spring', damping: 20 }}
                    className="bg-white rounded-t-[32px] overflow-hidden max-h-[85%]"
                    style={{ paddingBottom: insets.bottom }}
                >
                    <LinearGradient
                        colors={['#1e3a8a', '#1e40af']}
                        className="p-6 pb-12 items-center relative"
                    >
                        <TouchableOpacity
                            onPress={onClose}
                            className="absolute right-4 top-4 z-10 p-2 bg-white/20 rounded-full"
                        >
                            <XCircleIcon size={24} color="white" />
                        </TouchableOpacity>

                        <View className="w-16 h-16 bg-white/20 rounded-full items-center justify-center mb-4 backdrop-blur-sm">
                            <SparklesIcon size={32} color="#fbbf24" />
                        </View>

                        <Text className="text-white text-3xl font-bold mb-1">{t('matchIntelligence.match', { percentage: match.percentage || 94 })}</Text>
                        <Text className="text-blue-200 font-medium">{t('matchIntelligence.excellentCompatibility')}</Text>
                    </LinearGradient>

                    <ScrollView className="flex-1 px-6 pt-6 -mt-6 bg-white rounded-t-[32px]">
                        <View className="mb-8">
                            <Text className="text-lg font-bold text-slate-800 mb-4">{t('matchIntelligence.whyYouMatch', { name: match.name })}</Text>
                            <Text className="text-slate-600 leading-6 bg-blue-50 p-4 rounded-2xl border border-blue-100">
                                <Text className="font-bold text-blue-800">{t('matchIntelligence.aiInsight')}</Text>
                                {t('matchIntelligence.aiInsightDesc', { specialty: match.specialty || 'medicine' })}
                            </Text>
                        </View>

                        <View className="mb-8">
                            <Text className="text-lg font-bold text-slate-800 mb-4">{t('matchIntelligence.compatibilityBreakdown')}</Text>
                            <View className="space-y-4">
                                {TRAITS.map((trait, index) => (
                                    <View key={index}>
                                        <View className="flex-row justify-between mb-2">
                                            <Text className="text-slate-600 font-medium">{trait.label}</Text>
                                            <Text className="text-slate-900 font-bold">{trait.score}%</Text>
                                        </View>
                                        <View className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <MotiView
                                                from={{ width: '0%' }}
                                                animate={{ width: `${trait.score}%` }}
                                                transition={{
                                                    type: 'timing',
                                                    duration: 1000,
                                                    delay: 300 + (index * 100)
                                                }}
                                                className={`h-full rounded-full ${trait.color}`}
                                            />
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>

                        <View className="mb-10 p-4 border border-green-100 bg-green-50 rounded-2xl flex-row items-center gap-4">
                            <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center">
                                <CheckCircleIcon size={20} color="#16a34a" />
                            </View>
                            <View className="flex-1">
                                <Text className="font-bold text-green-900">{t('matchIntelligence.recommendedTopic')}</Text>
                                <Text className="text-green-700 text-sm">{t('matchIntelligence.recommendedTopicDesc', { specialty: match.specialty || 'their field' })}</Text>
                            </View>
                        </View>
                    </ScrollView>
                </MotiView>
            </View>
        </Modal>
    );
}
