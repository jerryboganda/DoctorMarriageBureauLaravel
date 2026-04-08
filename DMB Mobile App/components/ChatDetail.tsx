import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { ChevronLeftIcon, VideoIcon, PhoneIcon, SendIcon, MicIcon, PlusIcon } from './Icons';
import CallModal from './CallModal';
import { useTranslation } from 'react-i18next';

interface ChatDetailProps {
    chat: any;
    onBack: () => void;
}

export default function ChatDetail({ chat, onBack }: ChatDetailProps) {
    const { t } = useTranslation();
    const [messages, setMessages] = useState([
        { id: 1, text: chat.message || "Hi there!", sender: 'them', time: '10:00 AM' },
        { id: 2, text: "Hey! Nice to meet you.", sender: 'me', time: '10:05 AM' },
    ]);
    const [inputText, setInputText] = useState('');
    const [callType, setCallType] = useState<'video' | 'audio' | null>(null);

    const scrollViewRef = useRef<ScrollView>(null);

    const handleSend = () => {
        if (!inputText.trim()) return;
        setMessages([...messages, { 
            id: Date.now(), 
            text: inputText, 
            sender: 'me', 
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        }]);
        setInputText('');
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    };

    return (
        <View className="flex-1 bg-white">
            {/* Header */}
            <View className="pt-12 pb-4 px-4 border-b border-slate-100 flex-row items-center justify-between bg-white z-10">
                <View className="flex-row items-center gap-3">
                    <TouchableOpacity onPress={onBack} className="w-10 h-10 items-center justify-center -ml-2">
                        <ChevronLeftIcon size={24} color="#0f172a" />
                    </TouchableOpacity>
                    <View className="items-center justify-center w-10 h-10 bg-slate-100 rounded-full overflow-hidden">
                        {chat.img ? (
                             <Text className="text-lg font-bold text-slate-500">{chat.name?.[0]}</Text>
                        ) : (
                             <Text className="text-lg font-bold text-slate-500">?</Text>
                        )}
                    </View>
                    <View>
                        <Text className="font-bold text-slate-900 text-base">{chat.name}</Text>
                        <Text className="text-green-600 text-xs font-bold">{t('chat.online')}</Text>
                    </View>
                </View>
                <View className="flex-row gap-4 mr-2">
                    <TouchableOpacity onPress={() => setCallType('audio')}>
                        <PhoneIcon size={22} color="#0f172a" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setCallType('video')}>
                        <VideoIcon size={22} color="#0f172a" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Messages */}
            <ScrollView 
                ref={scrollViewRef}
                className="flex-1 px-4 py-4 bg-slate-50"
                contentContainerStyle={{ paddingBottom: 20 }}
            >
                {messages.map((msg) => (
                    <View 
                        key={msg.id} 
                        className={`flex-row mb-4 ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                    >
                        <View 
                            className={`max-w-[75%] px-4 py-3 rounded-2xl ${
                                msg.sender === 'me' 
                                ? 'bg-blue-600 rounded-tr-none' 
                                : 'bg-white border border-slate-100 rounded-tl-none shadow-sm'
                            }`}
                        >
                            <Text className={`${msg.sender === 'me' ? 'text-white' : 'text-slate-800'} text-base`}>
                                {msg.text}
                            </Text>
                            <Text className={`text-[10px] mt-1 ${msg.sender === 'me' ? 'text-blue-200' : 'text-slate-400'} text-right`}>
                                {msg.time}
                            </Text>
                        </View>
                    </View>
                ))}
            </ScrollView>

            {/* Input */}
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={20}>
                <View className="p-4 bg-white border-t border-slate-100 flex-row items-center gap-3 pb-8">
                    <TouchableOpacity className="w-10 h-10 bg-slate-100 rounded-full items-center justify-center">
                        <PlusIcon size={20} color="#64748b" />
                    </TouchableOpacity>
                    <View className="flex-1 bg-slate-50 border border-slate-200 rounded-full h-11 flex-row items-center px-4">
                        <TextInput 
                            className="flex-1 h-full text-slate-800 text-base"
                            placeholder={t('chat.messagePlaceholder')}
                            value={inputText}
                            onChangeText={setInputText}
                            onSubmitEditing={handleSend}
                        />
                    </View>
                    {inputText.trim() ? (
                         <TouchableOpacity onPress={handleSend} className="w-11 h-11 bg-blue-600 rounded-full items-center justify-center shadow-lg shadow-blue-500/30">
                             <SendIcon size={20} color="white" />
                         </TouchableOpacity>
                    ) : (
                         <TouchableOpacity className="w-11 h-11 bg-slate-100 rounded-full items-center justify-center">
                             <MicIcon size={20} color="#64748b" />
                         </TouchableOpacity>
                    )}
                </View>
            </KeyboardAvoidingView>

            {/* Call Modal */}
            <CallModal 
                visible={!!callType}
                type={callType || 'video'}
                participantName={chat.name}
                participantImage="https://i.pravatar.cc/300?img=5" 
                onEndCall={() => setCallType(null)}
            />
        </View>
    );
}
