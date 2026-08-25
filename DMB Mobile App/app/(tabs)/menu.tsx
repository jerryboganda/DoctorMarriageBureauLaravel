import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Background from '../../components/Background';
import {
    UsersIcon,
    BuildingIcon,
    ChartBarIcon,
    SettingsIcon,
    BellIcon,
    ShieldIcon,
    LogOutIcon,
    ChevronRightIcon,
    CrownIcon,
} from '../../components/Icons';
import SubscriptionModal from '../../components/SubscriptionModal';
import { useAuthStore } from '../../stores/authStore';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 48) / 2;

export default function MenuTab() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { logout } = useAuthStore();
    const { t } = useTranslation();
    const [showSubscription, setShowSubscription] = useState(false);

    const menuItems = [
        {
            id: 'family',
            label: t('menu.familyPortal'),
            icon: UsersIcon,
            color: '#2563eb',
            bg: 'bg-blue-50',
            route: '/family-portal',
            desc: t('menu.familyPortalDesc'),
        },
        {
            id: 'community',
            label: t('menu.communities'),
            icon: BuildingIcon,
            color: '#059669',
            bg: 'bg-emerald-50',
            route: '/communities',
            desc: t('menu.communitiesDesc'),
        },
        {
            id: 'progression',
            label: t('menu.relationshipJourney'),
            icon: ChartBarIcon,
            color: '#9333ea',
            bg: 'bg-purple-50',
            route: '/progression',
            desc: t('menu.relationshipJourneyDesc'),
        },
        {
            id: 'notifications',
            label: t('menu.notifications'),
            icon: BellIcon,
            color: '#ea580c',
            bg: 'bg-orange-50',
            route: '/notifications',
            desc: t('menu.notificationsDesc'),
        },
    ];

    const secondaryItems = [
        { id: 'settings', label: t('menu.settings'), icon: SettingsIcon, route: '/settings' },
        { id: 'help', label: t('menu.helpSupport'), icon: ShieldIcon, route: '/settings' }, // Placeholder
    ];

    return (
        <View className="flex-1 bg-slate-50">
            <Background />

            <LinearGradient
                colors={['#1e3a8a', '#3b82f6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ paddingTop: insets.top + 20, paddingBottom: 24 }}
                className="px-6 rounded-b-[32px] shadow-sm z-10"
            >
                <Text className="text-white text-2xl font-bold">{t('menu.title')}</Text>
                <Text className="text-blue-100 text-sm">{t('menu.exploreFeatures')}</Text>
            </LinearGradient>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
                {/* Premium Banner */}
                <TouchableOpacity onPress={() => setShowSubscription(true)} className="mb-8">
                    <LinearGradient
                        colors={['#f59e0b', '#d97706']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        className="p-4 rounded-2xl flex-row items-center justify-between shadow-md shadow-orange-500/20"
                    >
                        <View className="flex-row items-center gap-3">
                            <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center border border-white/20">
                                <CrownIcon size={24} color="white" />
                            </View>
                            <View>
                                <Text className="text-white font-bold text-lg">
                                    {t('menu.goPremium')}
                                </Text>
                                <Text className="text-white/80 text-sm">
                                    {t('menu.unlockFeatures')}
                                </Text>
                            </View>
                        </View>
                        <View className="bg-white/20 p-2 rounded-full">
                            <ChevronRightIcon size={20} color="white" />
                        </View>
                    </LinearGradient>
                </TouchableOpacity>

                <Text className="text-slate-900 font-bold text-lg mb-4">{t('menu.features')}</Text>
                <View className="flex-row flex-wrap gap-4">
                    {menuItems.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <MotiView
                                key={item.id}
                                from={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 100 }}
                            >
                                <TouchableOpacity
                                    onPress={() => router.push(item.route as any)}
                                    activeOpacity={0.8}
                                    style={{ width: ITEM_WIDTH }}
                                    className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm min-h-[140px] justify-between"
                                >
                                    <View
                                        className={`w-10 h-10 rounded-full items-center justify-center ${item.bg} mb-3`}
                                    >
                                        <Icon size={20} color={item.color} />
                                    </View>
                                    <View>
                                        <Text className="font-bold text-slate-900 text-base mb-1">
                                            {item.label}
                                        </Text>
                                        <Text className="text-xs text-slate-500 leading-4">
                                            {item.desc}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            </MotiView>
                        );
                    })}
                </View>

                <Text className="text-slate-900 font-bold text-lg mt-8 mb-4">
                    {t('menu.general')}
                </Text>
                <View className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                    {secondaryItems.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <TouchableOpacity
                                key={item.id}
                                onPress={() => router.push(item.route as any)}
                                className={`flex-row items-center p-4 ${index !== secondaryItems.length - 1 ? 'border-b border-slate-50' : ''}`}
                            >
                                <View className="w-8 h-8 rounded-full bg-slate-50 items-center justify-center mr-3">
                                    <Icon size={16} color="#475569" />
                                </View>
                                <Text className="flex-1 font-bold text-slate-700">
                                    {item.label}
                                </Text>
                                <ChevronRightIcon size={16} color="#cbd5e1" />
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <TouchableOpacity
                    onPress={logout}
                    className="mt-6 flex-row items-center justify-center gap-2 p-4 rounded-xl bg-red-50 border border-red-100"
                >
                    <LogOutIcon size={18} color="#dc2626" />
                    <Text className="text-red-600 font-bold">{t('menu.signOut')}</Text>
                </TouchableOpacity>
            </ScrollView>

            <SubscriptionModal
                visible={showSubscription}
                onClose={() => setShowSubscription(false)}
            />
        </View>
    );
}
