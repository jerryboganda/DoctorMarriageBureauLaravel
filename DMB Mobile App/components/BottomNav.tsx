import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { HomeIcon, HeartIcon, MessageIcon, UserIcon } from './Icons';
import { MotiView } from 'moti';

export type TabType = 'discover' | 'matches' | 'chat' | 'profile';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs: { id: TabType; icon: any; label: string }[] = [
  { id: 'discover', icon: HomeIcon, label: 'Discover' },
  { id: 'matches', icon: HeartIcon, label: 'Matches' },
  { id: 'chat', icon: MessageIcon, label: 'Chat' },
  { id: 'profile', icon: UserIcon, label: 'Profile' },
];

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <View className="flex-row items-center justify-between bg-white px-2 pb-6 pt-2 border-t border-slate-100 shadow-lg">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        
        return (
          <TouchableOpacity
            key={tab.id}
            onPress={() => onTabChange(tab.id)}
            className="flex-1 items-center justify-center h-14"
            activeOpacity={0.7}
          >
            {isActive && (
                 <MotiView
                    from={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring' }}
                    className="absolute inset-0 bg-blue-50 rounded-full mx-4"
                 />
            )}
            
            <View className={`items-center justify-center ${isActive ? 'transform -translate-y-1' : ''}`}>
               <Icon 
                  size={24} 
                  color={isActive ? '#2563eb' : '#94a3b8'} 
                  strokeWidth={isActive ? 2.5 : 2}
                />
               <Text className={`text-[10px] mt-1 font-medium ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
                   {tab.label}
               </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default BottomNav;
