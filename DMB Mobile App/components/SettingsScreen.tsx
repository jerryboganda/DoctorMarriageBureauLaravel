import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { ChevronLeftIcon, UserIcon, ShieldIcon, BellIcon, LockIcon, LogOutIcon, ChevronRightIcon, SmartphoneIcon, GlobeIcon, MailIcon, FileTextIcon } from './Icons';
import { MotiView } from 'moti';

interface SettingsScreenProps {
    onBack: () => void;
    section?: 'account' | 'privacy';
}

export default function SettingsScreen({ onBack, section = 'account' }: SettingsScreenProps) {
    const [notifications, setNotifications] = useState(true);
    const [privacyMode, setPrivacyMode] = useState(false);
    const [biometrics, setBiometrics] = useState(true);

    const renderHeader = () => (
        <View className="px-5 pt-12 pb-4 bg-white border-b border-slate-100 flex-row items-center gap-3">
             <TouchableOpacity onPress={onBack} className="w-10 h-10 items-center justify-center -ml-2 bg-slate-50 rounded-full">
                 <ChevronLeftIcon size={24} color="#0f172a" />
             </TouchableOpacity>
             <Text className="text-xl font-bold text-slate-900">
                 {section === 'account' ? 'Account Settings' : 'Privacy & Security'}
             </Text>
        </View>
    );

    const SettingsItem = ({ icon: Icon, label, value, onPress, isSwitch, switchValue, onSwitch }: any) => (
        <TouchableOpacity 
            onPress={onPress}
            disabled={isSwitch}
            className="flex-row items-center justify-between py-4 border-b border-slate-50"
        >
            <View className="flex-row items-center gap-4">
                <View className="w-10 h-10 rounded-full bg-slate-50 items-center justify-center">
                    <Icon size={20} color="#64748b" />
                </View>
                <Text className="font-bold text-slate-700 text-base">{label}</Text>
            </View>
            
            {isSwitch ? (
                <Switch 
                    value={switchValue} 
                    onValueChange={onSwitch}
                    trackColor={{ false: '#cbd5e1', true: '#2563eb' }}
                    thumbColor={'white'}
                />
            ) : (
                <View className="flex-row items-center gap-2">
                    {value && <Text className="text-slate-400 text-sm font-medium">{value}</Text>}
                    <ChevronRightIcon size={16} color="#cbd5e1" />
                </View>
            )}
        </TouchableOpacity>
    );

    const renderAccount = () => (
        <View className="p-5">
             <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Profile & Personal</Text>
             <SettingsItem icon={UserIcon} label="Edit Profile" onPress={() => Alert.alert('Edit Profile')} />
             <SettingsItem icon={SmartphoneIcon} label="Phone Number" value="+91 98765 43210" onPress={() => {}} />
             <SettingsItem icon={MailIcon} label="Email Address" value="doctor@example.com" onPress={() => {}} />
             <SettingsItem icon={GlobeIcon} label="Language" value="English" onPress={() => {}} />

             <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 mt-8">App Settings</Text>
             <SettingsItem 
                icon={BellIcon} 
                label="Push Notifications" 
                isSwitch 
                switchValue={notifications} 
                onSwitch={setNotifications} 
             />
             <SettingsItem 
                icon={FileTextIcon} 
                label="Terms of Service" 
                onPress={() => {}} 
             />

             <TouchableOpacity className="mt-8 flex-row items-center gap-3 p-4 bg-red-50 rounded-2xl justify-center">
                 <LogOutIcon size={20} color="#ef4444" />
                 <Text className="font-bold text-red-500">Sign Out</Text>
             </TouchableOpacity>

             <Text className="text-center text-slate-300 text-xs font-bold mt-6">Version 2.4.0 (Build 108)</Text>
        </View>
    );

    const renderPrivacy = () => (
        <View className="p-5">
             <View className="bg-blue-50 p-4 rounded-2xl mb-8 border border-blue-100">
                 <View className="flex-row gap-3">
                     <ShieldIcon size={24} color="#2563eb" />
                     <View className="flex-1">
                         <Text className="font-bold text-blue-800 text-lg mb-1">Secure Mode Active</Text>
                         <Text className="text-blue-600 text-xs leading-5">Your profile is currently visible only to verified doctors.</Text>
                     </View>
                 </View>
             </View>

             <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Visibility</Text>
             <SettingsItem 
                icon={LockIcon} 
                label="Incognito Mode" 
                isSwitch 
                switchValue={privacyMode} 
                onSwitch={setPrivacyMode} 
             />
             <SettingsItem icon={UserIcon} label="Blocked Users" value="2" onPress={() => {}} />

             <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 mt-8">Security</Text>
             <SettingsItem icon={LockIcon} label="Change Password" onPress={() => {}} />
             <SettingsItem 
                icon={SmartphoneIcon} 
                label="Biometric Login" 
                isSwitch 
                switchValue={biometrics} 
                onSwitch={setBiometrics} 
             />
             <SettingsItem icon={ShieldIcon} label="Two-Factor Auth" value="Enabled" onPress={() => {}} />
        </View>
    );

    return (
        <View className="flex-1 bg-white">
            {renderHeader()}
            <ScrollView className="flex-1">
                {section === 'account' ? renderAccount() : renderPrivacy()}
            </ScrollView>
        </View>
    );
}
