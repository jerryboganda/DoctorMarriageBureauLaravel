import React from 'react';
import { Tabs } from 'expo-router';
import { View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import {
    HeartIcon,
    MessageIcon,
    SearchIcon,
    UserIcon,
    SettingsIcon,
    MenuIcon,
} from '../../components/Icons';

export default function TabLayout() {
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#ffffff',
                    borderTopWidth: 1,
                    borderTopColor: '#f1f5f9',
                    height: 60 + (insets.bottom > 0 ? insets.bottom : 20),
                    paddingTop: 8,
                    paddingBottom: insets.bottom > 0 ? insets.bottom : 20,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    elevation: 10,
                },
                tabBarActiveTintColor: '#1e3a8a',
                tabBarInactiveTintColor: '#94a3b8',
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '600',
                    marginTop: 4,
                },
            }}
            screenListeners={{
                tabPress: () => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: t('tabs.proposals'),
                    tabBarIcon: ({ color, focused }) => (
                        <View className={focused ? 'scale-110' : ''}>
                            <HeartIcon size={24} color={color} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="discovery"
                options={{
                    title: t('tabs.discover'),
                    tabBarIcon: ({ color, focused }) => (
                        <View className={focused ? 'scale-110' : ''}>
                            <SearchIcon size={24} color={color} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="messages"
                options={{
                    title: t('tabs.messages'),
                    tabBarIcon: ({ color, focused }) => (
                        <View className={focused ? 'scale-110' : ''}>
                            <MessageIcon size={24} color={color} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: t('tabs.profile'),
                    tabBarIcon: ({ color, focused }) => (
                        <View className={focused ? 'scale-110' : ''}>
                            <UserIcon size={24} color={color} />
                        </View>
                    ),
                }}
            />{' '}
            <Tabs.Screen
                name="menu"
                options={{
                    title: t('tabs.menu'),
                    tabBarIcon: ({ color, focused }) => (
                        <View className={focused ? 'scale-110' : ''}>
                            <MenuIcon size={24} color={color} />
                        </View>
                    ),
                }}
            />{' '}
            <Tabs.Screen
                name="settings"
                options={{
                    title: t('tabs.settings'),
                    tabBarIcon: ({ color, focused }) => (
                        <View className={focused ? 'scale-110' : ''}>
                            <SettingsIcon size={24} color={color} />
                        </View>
                    ),
                }}
            />
        </Tabs>
    );
}
