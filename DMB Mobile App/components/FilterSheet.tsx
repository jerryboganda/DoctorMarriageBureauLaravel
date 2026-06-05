import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { XIcon } from './Icons';
import { useTranslation } from 'react-i18next';

interface FilterSheetProps {
    visible: boolean;
    onClose: () => void;
}

const SPECIALTIES = [
    'Cardiology',
    'Neurology',
    'Surgery',
    'Pediatrics',
    'Dermatology',
    'Psychiatry',
];
const RELIGIONS = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Jain', 'Other'];

export default function FilterSheet({ visible, onClose }: FilterSheetProps) {
    const { t } = useTranslation();
    const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>(['Cardiology']);
    const [selectedReligions, setSelectedReligions] = useState<string[]>([]);
    const [strictMode, setStrictMode] = useState(false);

    const toggleSelection = (list: string[], setList: (val: string[]) => void, item: string) => {
        if (list.includes(item)) {
            setList(list.filter((i) => i !== item));
        } else {
            setList([...list, item]);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-slate-50">
                {/* Header */}
                <View className="px-5 py-4 bg-white border-b border-slate-100 flex-row justify-between items-center">
                    <Text className="text-xl font-bold text-slate-900">{t('filter.title')}</Text>
                    <TouchableOpacity
                        onPress={onClose}
                        className="w-8 h-8 bg-slate-100 rounded-full items-center justify-center"
                    >
                        <XIcon size={20} color="#64748b" />
                    </TouchableOpacity>
                </View>

                <ScrollView className="flex-1 p-5">
                    {/* Specialty Section */}
                    <View className="mb-8">
                        <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                            {t('filter.medicalSpecialty')}
                        </Text>
                        <View className="flex-row flex-wrap gap-3">
                            {SPECIALTIES.map((spec) => {
                                const isSelected = selectedSpecialties.includes(spec);
                                return (
                                    <TouchableOpacity
                                        key={spec}
                                        onPress={() =>
                                            toggleSelection(
                                                selectedSpecialties,
                                                setSelectedSpecialties,
                                                spec,
                                            )
                                        }
                                        className={`px-4 py-2.5 rounded-xl border ${isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-200'}`}
                                    >
                                        <Text
                                            className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-slate-600'}`}
                                        >
                                            {spec}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* Religion Section */}
                    <View className="mb-8">
                        <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                            {t('filter.religionCommunity')}
                        </Text>
                        <View className="flex-row flex-wrap gap-3">
                            {RELIGIONS.map((rel) => {
                                const isSelected = selectedReligions.includes(rel);
                                return (
                                    <TouchableOpacity
                                        key={rel}
                                        onPress={() =>
                                            toggleSelection(
                                                selectedReligions,
                                                setSelectedReligions,
                                                rel,
                                            )
                                        }
                                        className={`px-4 py-2.5 rounded-xl border ${isSelected ? 'bg-slate-900 border-slate-900' : 'bg-white border-slate-200'}`}
                                    >
                                        <Text
                                            className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-slate-600'}`}
                                        >
                                            {rel}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* Strict Mode */}
                    <View className="bg-white p-5 rounded-2xl border border-slate-100 flex-row items-center justify-between mb-8">
                        <View className="flex-1 pr-4">
                            <Text className="font-bold text-slate-900 text-lg mb-1">
                                {t('filter.strictMode')}
                            </Text>
                            <Text className="text-slate-500 text-xs">
                                {t('filter.strictModeDesc')}
                            </Text>
                        </View>
                        <Switch
                            value={strictMode}
                            onValueChange={setStrictMode}
                            trackColor={{ false: '#cbd5e1', true: '#2563eb' }}
                            thumbColor={'white'}
                        />
                    </View>
                </ScrollView>

                {/* Footer Buttons */}
                <View className="p-5 bg-white border-t border-slate-100 flex-row gap-4 mb-5">
                    <TouchableOpacity
                        onPress={() => {
                            setSelectedSpecialties([]);
                            setSelectedReligions([]);
                            setStrictMode(false);
                        }}
                        className="flex-1 py-4 rounded-xl items-center justify-center bg-slate-100"
                    >
                        <Text className="font-bold text-slate-500">{t('filter.reset')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={onClose}
                        className="flex-[2] py-4 rounded-xl items-center justify-center bg-blue-600 shadow-lg shadow-blue-500/30"
                    >
                        <Text className="font-bold text-white text-lg">
                            {t('filter.showMatches')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}
