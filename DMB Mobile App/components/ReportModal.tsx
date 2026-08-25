import React from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, Alert } from 'react-native';
import { MotiView } from 'moti';
import { XCircleIcon, CheckCircleIcon } from './Icons';
import { api } from '../utils/api';
import Button from './Button';
import { useTranslation } from 'react-i18next';

interface ReportModalProps {
    visible: boolean;
    onClose: () => void;
    userId: string | number;
    userName: string;
}

const REPORT_REASONS = [
    { id: 'fake', label: 'Fake Profile', desc: 'False info or photos' },
    { id: 'harassment', label: 'Harassment', desc: 'Abusive messages' },
    { id: 'spam', label: 'Spam', desc: 'Selling goods/services' },
    { id: 'inappropriate', label: 'Inappropriate', desc: 'Offensive content' },
];

export default function ReportModal({ visible, onClose, userId, userName }: ReportModalProps) {
    const { t } = useTranslation();
    const [reason, setReason] = React.useState<string | null>(null);
    const [description, setDescription] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [step, setStep] = React.useState(1);

    const handleSubmit = async () => {
        if (!reason) return;
        setLoading(true);
        try {
            await api.post('/member/report-member', {
                user_id: userId,
                reason: `${reason}: ${description}`,
            });
            // Also block
            await api.post('/member/add-to-ignore-list', { user_id: userId });

            setStep(2); // Success
            setTimeout(() => {
                onClose();
                setStep(1);
                setReason(null);
                setDescription('');
            }, 2000);
        } catch (error) {
            Alert.alert(t('common.error'), t('report.reportFailed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
            <View className="flex-1 justify-end bg-black/50">
                <MotiView
                    from={{ translateY: 500 }}
                    animate={{ translateY: 0 }}
                    className="bg-white rounded-t-3xl p-6 min-h-[500px]"
                >
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-xl font-bold text-slate-900">
                            {t('report.title', { name: userName })}
                        </Text>
                        <TouchableOpacity
                            onPress={onClose}
                            className="p-2 bg-slate-100 rounded-full"
                        >
                            <XCircleIcon size={24} color="#64748b" />
                        </TouchableOpacity>
                    </View>

                    {step === 1 ? (
                        <>
                            <Text className="text-slate-500 mb-4">{t('report.description')}</Text>

                            <View className="space-y-3 mb-6">
                                {REPORT_REASONS.map((r) => (
                                    <TouchableOpacity
                                        key={r.id}
                                        onPress={() => setReason(r.label)}
                                        className={`p-4 rounded-xl border flex-row justify-between items-center ${
                                            reason === r.label
                                                ? 'bg-red-50 border-red-200'
                                                : 'bg-white border-slate-100'
                                        }`}
                                    >
                                        <View>
                                            <Text
                                                className={`font-bold ${reason === r.label ? 'text-red-700' : 'text-slate-900'}`}
                                            >
                                                {r.label}
                                            </Text>
                                            <Text className="text-xs text-slate-500">{r.desc}</Text>
                                        </View>
                                        {reason === r.label && (
                                            <CheckCircleIcon size={20} color="#dc2626" />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text className="font-bold text-slate-900 mb-2">
                                {t('report.additionalDetails')}{' '}
                                <Text className="text-[10px] font-semibold text-pink-600 bg-pink-100 px-2 py-0.5 rounded-full">
                                    Optional
                                </Text>
                            </Text>
                            <TextInput
                                className="bg-slate-50 border border-slate-200 rounded-xl p-4 h-24 mb-6 text-slate-900"
                                placeholder={t('report.describePlaceholder')}
                                multiline
                                textAlignVertical="top"
                                value={description}
                                onChangeText={setDescription}
                            />

                            <Button
                                onPress={handleSubmit}
                                title={t('report.submitReport')}
                                variant={reason ? 'danger' : 'outline'}
                                loading={loading}
                                disabled={!reason}
                            />
                        </>
                    ) : (
                        <View className="flex-1 items-center justify-center -mt-20">
                            <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-4">
                                <CheckCircleIcon size={48} color="#16a34a" />
                            </View>
                            <Text className="text-2xl font-bold text-slate-900">
                                {t('report.reportReceived')}
                            </Text>
                            <Text className="text-slate-500 text-center mt-2 px-8">
                                {t('report.reportReceivedDesc')}
                            </Text>
                        </View>
                    )}
                </MotiView>
            </View>
        </Modal>
    );
}
