import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { XCircleIcon, CheckIcon, CrownIcon, ShieldIcon } from './Icons';
import Button from './Button';
import { useTranslation } from 'react-i18next';

interface SubscriptionModalProps {
    visible: boolean;
    onClose: () => void;
}

const PLANS = [
    {
        id: 'gold',
        name: 'Gold',
        price: '₹2,999',
        period: '/ 3 months',
        features: ['Send Unlimited Interest', 'View Contact Numbers', 'Verified Badge'],
        color: ['#f59e0b', '#d97706'],
        popular: false,
        buttonVariant: 'secondary',
    },
    {
        id: 'platinum',
        name: 'Platinum',
        price: '₹5,999',
        period: '/ 6 months',
        features: [
            'All Gold Features',
            'Relationship Manager',
            'Priority Support',
            'Family Portal Access',
        ],
        color: ['#4f46e5', '#3730a3'],
        popular: true,
        buttonVariant: 'primary',
    },
];

export default function SubscriptionModal({ visible, onClose }: SubscriptionModalProps) {
    const { t } = useTranslation();

    const handleSubscribe = (plan: string) => {
        Alert.alert(
            t('subscription.paymentGateway'),
            t('subscription.paymentInitiating', { plan }),
        );
        // Integrate Razorpay/Paystack here
    };

    return (
        <Modal
            animationType="slide"
            visible={visible}
            onRequestClose={onClose}
            presentationStyle="pageSheet"
        >
            <View className="flex-1 bg-slate-50">
                <View className="p-4 pt-6 flex-row justify-between items-center bg-white border-b border-slate-100">
                    <Text className="text-xl font-bold text-slate-900">
                        {t('subscription.upgradeMembership')}
                    </Text>
                    <TouchableOpacity onPress={onClose} className="p-2 bg-slate-100 rounded-full">
                        <XCircleIcon size={24} color="#64748b" />
                    </TouchableOpacity>
                </View>

                <ScrollView className="flex-1 p-6">
                    <View className="items-center mb-8">
                        <View className="w-20 h-20 bg-amber-100 rounded-full items-center justify-center mb-4">
                            <CrownIcon size={40} color="#d97706" />
                        </View>
                        <Text className="text-2xl font-bold text-slate-900 text-center mb-2">
                            {t('subscription.investInFuture')}
                        </Text>
                        <Text className="text-slate-500 text-center leading-6 px-4">
                            {t('subscription.premiumDesc')}
                        </Text>
                    </View>

                    <View className="space-y-6 mb-10">
                        {PLANS.map((plan, index) => (
                            <MotiView
                                key={plan.id}
                                from={{ opacity: 0, translateY: 20 }}
                                animate={{ opacity: 1, translateY: 0 }}
                                transition={{ delay: index * 100 }}
                                className="bg-white rounded-3xl overflow-hidden shadow-xl shadow-slate-200/50 border border-slate-100"
                            >
                                <LinearGradient
                                    colors={plan.color as [string, string]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    className="p-6 relative"
                                >
                                    {plan.popular && (
                                        <View className="absolute top-4 right-4 bg-white/20 px-3 py-1 rounded-full border border-white/30">
                                            <Text className="text-white text-xs font-bold">
                                                {t('subscription.mostPopular')}
                                            </Text>
                                        </View>
                                    )}
                                    <View className="flex-row items-baseline gap-1 mb-2">
                                        <Text className="text-white text-3xl font-bold">
                                            {plan.price}
                                        </Text>
                                        <Text className="text-white/80 font-medium">
                                            {plan.period}
                                        </Text>
                                    </View>
                                    <Text className="text-white text-xl font-bold">
                                        {t('subscription.membership', { plan: plan.name })}
                                    </Text>
                                </LinearGradient>

                                <View className="p-6">
                                    <View className="space-y-4 mb-6">
                                        {plan.features.map((feature, i) => (
                                            <View key={i} className="flex-row items-center gap-3">
                                                <View className="w-6 h-6 rounded-full bg-green-100 items-center justify-center">
                                                    <CheckIcon size={14} color="#16a34a" />
                                                </View>
                                                <Text className="text-slate-700 font-medium">
                                                    {feature}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>

                                    <Button
                                        onPress={() => handleSubscribe(plan.name)}
                                        title={t('subscription.getPlan', { plan: plan.name })}
                                        variant={
                                            plan.buttonVariant === 'secondary'
                                                ? 'outline'
                                                : 'primary'
                                        }
                                    />
                                </View>
                            </MotiView>
                        ))}
                    </View>

                    <View className="flex-row justify-center items-center gap-2 mb-8 pb-8">
                        <ShieldIcon size={16} color="#64748b" />
                        <Text className="text-slate-500 text-xs">
                            {t('subscription.securePayment')}
                        </Text>
                    </View>
                </ScrollView>
            </View>
        </Modal>
    );
}
