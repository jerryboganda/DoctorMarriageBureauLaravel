import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { XIcon } from './Icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';

const { height } = Dimensions.get('window');

interface FilterModalProps {
    visible: boolean;
    onClose: () => void;
    onApply: (filters: FilterState) => void;
    initialFilters?: Partial<FilterState>;
}

export interface FilterState {
    ageMin: number;
    ageMax: number;
    gender: 'Male' | 'Female' | 'Any';
    religions: string[];
    professions: string[];
    locations: string[];
}

const RELIGIONS = [
    'Hindu',
    'Muslim',
    'Christian',
    'Sikh',
    'Jain',
    'Buddhist',
    'Parsi',
    'Jewish',
    'Other',
];
const PROFESSIONS = [
    'Doctor',
    'Engineer',
    'Surgeon',
    'Specialist',
    'Consultant',
    'Professor',
    'Researcher',
];
const AGE_OPTIONS = Array.from({ length: 43 }, (_, i) => i + 18); // 18-60

const ChipButton = ({
    label,
    selected,
    onPress,
}: {
    label: string;
    selected: boolean;
    onPress: () => void;
}) => (
    <TouchableOpacity
        onPress={() => {
            Haptics.selectionAsync();
            onPress();
        }}
        activeOpacity={0.8}
        className={`px-4 py-2.5 rounded-full mr-2 mb-2 border-2 ${
            selected ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-200'
        }`}
    >
        <Text className={`text-sm font-semibold ${selected ? 'text-white' : 'text-slate-600'}`}>
            {label}
        </Text>
    </TouchableOpacity>
);

export default function FilterModal({
    visible,
    onClose,
    onApply,
    initialFilters,
}: FilterModalProps) {
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();
    const [filters, setFilters] = useState<FilterState>({
        ageMin: 25,
        ageMax: 40,
        gender: 'Any',
        religions: [],
        professions: [],
        locations: [],
        ...initialFilters,
    });

    const toggleArrayItem = (key: keyof FilterState, item: string) => {
        const current = filters[key] as string[];
        if (current.includes(item)) {
            setFilters({ ...filters, [key]: current.filter((i) => i !== item) });
        } else {
            setFilters({ ...filters, [key]: [...current, item] });
        }
    };

    const handleApply = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onApply(filters);
        onClose();
    };

    const handleReset = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setFilters({
            ageMin: 18,
            ageMax: 60,
            gender: 'Any',
            religions: [],
            professions: [],
            locations: [],
        });
    };

    const activeFilterCount = [
        filters.gender !== 'Any' ? 1 : 0,
        filters.religions.length,
        filters.professions.length,
        filters.ageMin > 18 || filters.ageMax < 60 ? 1 : 0,
    ].reduce((a, b) => a + b, 0);

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-slate-50">
                {/* Header */}
                <View
                    className="bg-white px-5 pb-4 border-b border-slate-100 flex-row items-center justify-between"
                    style={{ paddingTop: insets.top + 12 }}
                >
                    <View>
                        <Text className="text-xl font-bold text-slate-900">
                            {t('filter.title')}
                        </Text>
                        {activeFilterCount > 0 && (
                            <Text className="text-xs text-blue-600 font-semibold mt-0.5">
                                {t('filter.activeFilters', { count: activeFilterCount })}
                            </Text>
                        )}
                    </View>
                    <View className="flex-row items-center gap-3">
                        <TouchableOpacity onPress={handleReset} className="px-4 py-2">
                            <Text className="text-blue-600 font-semibold">{t('filter.reset')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={onClose}
                            className="w-10 h-10 bg-slate-100 rounded-full items-center justify-center"
                        >
                            <XIcon size={20} color="#64748b" />
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Gender Filter */}
                    <View className="mb-8">
                        <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                            {t('filter.lookingFor')}
                        </Text>
                        <View className="flex-row gap-3">
                            {(['Male', 'Female', 'Any'] as const).map((gender) => (
                                <TouchableOpacity
                                    key={gender}
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        setFilters({ ...filters, gender });
                                    }}
                                    className={`flex-1 py-4 rounded-2xl border-2 items-center ${
                                        filters.gender === gender
                                            ? 'border-blue-600 bg-blue-50'
                                            : 'border-slate-200 bg-white'
                                    }`}
                                >
                                    <Text
                                        className={`font-bold ${
                                            filters.gender === gender
                                                ? 'text-blue-700'
                                                : 'text-slate-600'
                                        }`}
                                    >
                                        {gender}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Age Range */}
                    <View className="mb-8">
                        <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                            {t('filter.ageRange')}
                        </Text>
                        <View className="bg-white rounded-2xl p-4 border border-slate-100">
                            <View className="flex-row items-center justify-between mb-4">
                                <Text className="text-slate-600">{t('filter.ageBetween')}</Text>
                                <View className="bg-blue-50 px-4 py-2 rounded-xl">
                                    <Text className="text-blue-700 font-bold">
                                        {filters.ageMin} — {filters.ageMax} {t('filter.years')}
                                    </Text>
                                </View>
                            </View>

                            {/* Age Selectors */}
                            <View className="flex-row items-center gap-4">
                                <View className="flex-1">
                                    <Text className="text-xs text-slate-400 mb-2 text-center">
                                        {t('filter.min')}
                                    </Text>
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        className="bg-slate-50 rounded-xl p-2"
                                    >
                                        {AGE_OPTIONS.filter((a) => a <= filters.ageMax).map(
                                            (age) => (
                                                <TouchableOpacity
                                                    key={`min-${age}`}
                                                    onPress={() =>
                                                        setFilters({ ...filters, ageMin: age })
                                                    }
                                                    className={`w-12 h-10 rounded-lg items-center justify-center mr-1 ${
                                                        filters.ageMin === age
                                                            ? 'bg-blue-600'
                                                            : 'bg-white'
                                                    }`}
                                                >
                                                    <Text
                                                        className={`font-semibold ${
                                                            filters.ageMin === age
                                                                ? 'text-white'
                                                                : 'text-slate-600'
                                                        }`}
                                                    >
                                                        {age}
                                                    </Text>
                                                </TouchableOpacity>
                                            ),
                                        )}
                                    </ScrollView>
                                </View>
                                <View className="flex-1">
                                    <Text className="text-xs text-slate-400 mb-2 text-center">
                                        {t('filter.max')}
                                    </Text>
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        className="bg-slate-50 rounded-xl p-2"
                                    >
                                        {AGE_OPTIONS.filter((a) => a >= filters.ageMin).map(
                                            (age) => (
                                                <TouchableOpacity
                                                    key={`max-${age}`}
                                                    onPress={() =>
                                                        setFilters({ ...filters, ageMax: age })
                                                    }
                                                    className={`w-12 h-10 rounded-lg items-center justify-center mr-1 ${
                                                        filters.ageMax === age
                                                            ? 'bg-blue-600'
                                                            : 'bg-white'
                                                    }`}
                                                >
                                                    <Text
                                                        className={`font-semibold ${
                                                            filters.ageMax === age
                                                                ? 'text-white'
                                                                : 'text-slate-600'
                                                        }`}
                                                    >
                                                        {age}
                                                    </Text>
                                                </TouchableOpacity>
                                            ),
                                        )}
                                    </ScrollView>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Religion Filter */}
                    <View className="mb-8">
                        <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                            {t('filter.religionCommunity')}
                        </Text>
                        <View className="flex-row flex-wrap">
                            {RELIGIONS.map((religion) => (
                                <ChipButton
                                    key={religion}
                                    label={religion}
                                    selected={filters.religions.includes(religion)}
                                    onPress={() => toggleArrayItem('religions', religion)}
                                />
                            ))}
                        </View>
                    </View>

                    {/* Profession Filter */}
                    <View className="mb-8">
                        <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                            {t('filter.profession')}
                        </Text>
                        <View className="flex-row flex-wrap">
                            {PROFESSIONS.map((profession) => (
                                <ChipButton
                                    key={profession}
                                    label={profession}
                                    selected={filters.professions.includes(profession)}
                                    onPress={() => toggleArrayItem('professions', profession)}
                                />
                            ))}
                        </View>
                    </View>
                </ScrollView>

                {/* Apply Button */}
                <View
                    className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-5 pt-4"
                    style={{ paddingBottom: insets.bottom + 16 }}
                >
                    <TouchableOpacity
                        onPress={handleApply}
                        activeOpacity={0.9}
                        className="bg-blue-600 py-4 rounded-2xl items-center shadow-lg shadow-blue-500/30"
                    >
                        <Text className="text-white font-bold text-lg">
                            {t('filter.applyFilters')}{' '}
                            {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}
