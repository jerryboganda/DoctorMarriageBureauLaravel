import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { MotiView } from 'moti';
import { TuneIcon, ChevronRightIcon, XCircleIcon, CheckIcon, FilterIcon } from './Icons';
import { api } from '../utils/api';
import Button from './Button';
import { useTranslation } from 'react-i18next';

interface MatchTunerModalProps {
    visible: boolean;
    onClose: () => void;
}

const TUNING_OPTIONS = [
    { 
        id: 'dealbreaker', 
        question: "What's your biggest dealbreaker?",
        options: ['Smoking', 'Drinking', 'Non-Vegetarian', 'Different Religion']
    },
    { 
        id: 'careerLevel', 
        question: "Preferred partner career stage?",
        options: ['Student/Resident', 'Practicing Specialist', 'Consultant/Senior', 'Any']
    },
    { 
        id: 'familyLevel', 
        question: "Family affluence preference?",
        options: ['Middle Class', 'Upper Middle', 'High Net Worth', 'Doesn\'t Matter']
    }
];

export default function MatchTunerModal({ visible, onClose }: MatchTunerModalProps) {
    const { t } = useTranslation();
    const [step, setStep] = useState(0);
    const [selections, setSelections] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    const handleSelect = (value: string) => {
        const key = TUNING_OPTIONS[step].id;
        const newSelections = { ...selections, [key]: value };
        setSelections(newSelections);

        if (step < TUNING_OPTIONS.length - 1) {
            setStep(step + 1);
        } else {
            submitTuning(newSelections);
        }
    };

    const submitTuning = async (data: any) => {
        setLoading(true);
        try {
            await api.post('/match-tuner/tune', data);
            Alert.alert(t('common.success'), t('matchTuner.successMsg'));
            onClose();
            setStep(0);
            setSelections({});
        } catch (error) {
            Alert.alert(t('common.error'), t('matchTuner.failedMsg'));
        } finally {
            setLoading(false);
        }
    };

    if (!visible) return null;

    const currentOption = TUNING_OPTIONS[step];

    return (
        <Modal animationType="fade" visible={visible} onRequestClose={onClose} transparent>
            <View className="flex-1 bg-black/60 justify-center px-6">
                <MotiView 
                    from={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white rounded-3xl p-6 shadow-2xl"
                >
                    <View className="flex-row justify-between items-center mb-6">
                        <View className="flex-row items-center gap-2">
                             <View className="bg-blue-100 p-2 rounded-full">
                                <FilterIcon size={20} color="#2563eb" />
                             </View>
                             <View>
                                <Text className="text-lg font-bold text-slate-900">{t('matchTuner.title')}</Text>
                                <Text className="text-xs text-slate-500">{t('matchTuner.stepOf', { current: step + 1, total: TUNING_OPTIONS.length })}</Text>
                             </View>
                        </View>
                        <TouchableOpacity onPress={onClose}>
                            <XCircleIcon size={24} color="#94a3b8" />
                        </TouchableOpacity>
                    </View>

                    <Text className="text-xl font-bold text-slate-800 mb-6 text-center">
                        {currentOption.question}
                    </Text>

                    <View className="space-y-3">
                        {currentOption.options.map((opt) => (
                            <TouchableOpacity
                                key={opt}
                                onPress={() => handleSelect(opt)}
                                disabled={loading}
                                className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex-row justify-between items-center active:bg-blue-50 active:border-blue-200"
                            >
                                <Text className="font-semibold text-slate-700">{opt}</Text>
                                <ChevronRightIcon size={16} color="#cbd5e1" />
                            </TouchableOpacity>
                        ))}
                    </View>

                    {loading && (
                        <View className="absolute inset-0 bg-white/50 items-center justify-center rounded-3xl">
                             <Text className="font-bold text-blue-600">{t('matchTuner.saving')}</Text>
                        </View>
                    )}
                </MotiView>
            </View>
        </Modal>
    );
}
