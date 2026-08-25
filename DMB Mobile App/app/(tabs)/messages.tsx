import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Image,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import Background from '../../components/Background';
import { api } from '../../utils/api';
import { useAuthStore } from '../../stores/authStore';
import {
    SearchIcon,
    SendIcon,
    MessageIcon,
    ChevronLeftIcon,
    PhoneIcon,
    VideoIcon,
} from '../../components/Icons';
import * as Haptics from 'expo-haptics';

interface ChatThread {
    id: number;
    opponent_name: string;
    opponent_photo: string;
    last_message: string;
    last_message_time: string;
    unseen_message_count: number;
    is_request?: boolean;
}

interface ChatMessage {
    id: number;
    message: string;
    user_id: number;
    created_at: string;
    sender_name?: string;
}

export default function MessagesTab() {
    const insets = useSafeAreaInsets();
    const { user } = useAuthStore();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [threads, setThreads] = useState<ChatThread[]>([]);
    const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loadingChat, setLoadingChat] = useState(false);
    const [inputText, setInputText] = useState('');
    const [sending, setSending] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    const fetchThreads = useCallback(async () => {
        try {
            const response = await api.get('/member/chat-list');
            setThreads(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch chat list', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchThreads();
        const interval = setInterval(fetchThreads, 15000);
        return () => clearInterval(interval);
    }, [fetchThreads]);

    const fetchChat = async (threadId: number) => {
        try {
            setLoadingChat(true);
            const response = await api.get(`/member/chat-view/${threadId}`);
            setMessages(response.data.data?.messages || []);
        } catch (error) {
            console.error('Failed to fetch chat', error);
        } finally {
            setLoadingChat(false);
        }
    };

    useEffect(() => {
        if (selectedThread) {
            fetchChat(selectedThread.id);
            const interval = setInterval(() => fetchChat(selectedThread.id), 5000);
            return () => clearInterval(interval);
        }
    }, [selectedThread]);

    const handleSendMessage = async () => {
        if (!inputText.trim() || !selectedThread) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSending(true);
        try {
            await api.post('/member/chat-reply', {
                chat_thread_id: selectedThread.id,
                message: inputText,
            });
            setInputText('');
            await fetchChat(selectedThread.id);
            await fetchThreads();
        } catch (error) {
            console.error('Failed to send message', error);
        } finally {
            setSending(false);
        }
    };

    const renderThreadItem = ({ item }: { item: ChatThread }) => (
        <TouchableOpacity
            onPress={() => setSelectedThread(item)}
            className="flex-row items-center px-4 py-3 border-b border-slate-100 bg-white active:bg-slate-50"
        >
            {item.opponent_photo ? (
                <Image
                    source={{ uri: item.opponent_photo }}
                    className="w-12 h-12 rounded-full mr-3"
                />
            ) : (
                <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center mr-3">
                    <Text className="text-blue-600 font-bold">
                        {(item.opponent_name || 'M')[0].toUpperCase()}
                    </Text>
                </View>
            )}
            <View className="flex-1">
                <View className="flex-row justify-between items-center mb-1">
                    <Text className="font-bold text-slate-900 text-sm" numberOfLines={1}>
                        {item.opponent_name}
                    </Text>
                    <Text className="text-slate-400 text-[10px]">{item.last_message_time}</Text>
                </View>
                <Text className="text-slate-500 text-xs" numberOfLines={1}>
                    {item.last_message}
                </Text>
            </View>
            {item.unseen_message_count > 0 && (
                <View className="ml-2 bg-blue-600 rounded-full px-2 py-0.5 min-w-[20px] items-center">
                    <Text className="text-white text-[10px] font-bold">
                        {item.unseen_message_count}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );

    const renderMessage = ({ item }: { item: ChatMessage }) => {
        const isMe = item.user_id === user?.id;
        return (
            <MotiView
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                className={`mx-4 mb-2 max-w-[80%] ${isMe ? 'self-end' : 'self-start'}`}
            >
                <View
                    className={`px-4 py-3 rounded-2xl ${isMe ? 'bg-blue-600 rounded-br-md' : 'bg-slate-100 rounded-bl-md'}`}
                >
                    <Text className={`text-sm ${isMe ? 'text-white' : 'text-slate-900'}`}>
                        {item.message}
                    </Text>
                </View>
                <Text
                    className={`text-[10px] text-slate-400 mt-1 ${isMe ? 'text-right' : 'text-left'}`}
                >
                    {item.created_at}
                </Text>
            </MotiView>
        );
    };

    // Chat View
    if (selectedThread) {
        return (
            <View className="flex-1 bg-white">
                {/* Chat Header - Enhanced */}
                <LinearGradient
                    colors={['#ffffff', '#f8fafc']}
                    className="border-b border-slate-100"
                    style={{ paddingTop: insets.top }}
                >
                    <View className="flex-row items-center px-4 py-3">
                        <TouchableOpacity
                            onPress={() => setSelectedThread(null)}
                            className="p-2 -ml-2 mr-2"
                        >
                            <ChevronLeftIcon size={24} color="#334155" />
                        </TouchableOpacity>

                        {selectedThread.opponent_photo ? (
                            <Image
                                source={{ uri: selectedThread.opponent_photo }}
                                className="w-11 h-11 rounded-full mr-3"
                            />
                        ) : (
                            <View className="w-11 h-11 rounded-full bg-blue-100 items-center justify-center mr-3">
                                <Text className="text-blue-600 font-bold text-lg">
                                    {(selectedThread.opponent_name || 'M')[0]}
                                </Text>
                            </View>
                        )}

                        <View className="flex-1">
                            <Text className="font-bold text-slate-900 text-base">
                                {selectedThread.opponent_name}
                            </Text>
                            <MotiView
                                from={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{
                                    loop: true,
                                    type: 'timing',
                                    duration: 1500,
                                    repeatReverse: true,
                                }}
                            >
                                <Text className="text-green-500 text-xs font-medium">
                                    {t('messages.activeNow')}
                                </Text>
                            </MotiView>
                        </View>

                        {/* Action Buttons */}
                        <TouchableOpacity
                            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                            className="w-10 h-10 bg-slate-100 rounded-full items-center justify-center mr-2"
                        >
                            <PhoneIcon size={18} color="#1e3a8a" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                            className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center"
                        >
                            <VideoIcon size={18} color="#1e3a8a" />
                        </TouchableOpacity>
                    </View>
                </LinearGradient>

                {/* Messages */}
                {loadingChat ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator color="#1e3a8a" />
                    </View>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        renderItem={renderMessage}
                        keyExtractor={(item) => String(item.id)}
                        contentContainerStyle={{ paddingVertical: 16, flexGrow: 1 }}
                        onContentSizeChange={() =>
                            flatListRef.current?.scrollToEnd({ animated: true })
                        }
                        ListEmptyComponent={
                            <View className="flex-1 items-center justify-center py-20">
                                <Text className="text-slate-400">
                                    {t('messages.noMessagesYet')}
                                </Text>
                            </View>
                        }
                    />
                )}

                {/* Input */}
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <View
                        className="flex-row items-center px-4 py-3 border-t border-slate-100 bg-white"
                        style={{ paddingBottom: insets.bottom + 8 }}
                    >
                        <TextInput
                            className="flex-1 bg-slate-100 rounded-full px-4 py-3 text-sm text-slate-900"
                            placeholder={t('messages.typePlaceholder')}
                            placeholderTextColor="#94a3b8"
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                        />
                        <TouchableOpacity
                            onPress={handleSendMessage}
                            disabled={!inputText.trim() || sending}
                            className={`ml-3 w-11 h-11 rounded-full items-center justify-center ${inputText.trim() ? 'bg-blue-600' : 'bg-slate-200'}`}
                        >
                            {sending ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <SendIcon
                                    size={18}
                                    color={inputText.trim() ? 'white' : '#94a3b8'}
                                />
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </View>
        );
    }

    // Thread List View
    return (
        <View className="flex-1 bg-slate-50">
            <Background />

            {/* Header */}
            <View
                className="px-4 pb-3 bg-white/80 border-b border-slate-100"
                style={{ paddingTop: insets.top + 12 }}
            >
                <Text className="text-xl font-bold text-slate-900 mb-3">{t('messages.title')}</Text>
                <View className="flex-row items-center bg-slate-100 rounded-2xl px-4 h-11">
                    <SearchIcon size={16} color="#94a3b8" />
                    <TextInput
                        className="flex-1 ml-3 text-sm text-slate-900"
                        placeholder={t('messages.searchPlaceholder')}
                        placeholderTextColor="#94a3b8"
                    />
                </View>
            </View>

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator color="#1e3a8a" />
                </View>
            ) : threads.length === 0 ? (
                <View className="flex-1 items-center justify-center px-8">
                    <View className="w-20 h-20 bg-slate-100 rounded-full items-center justify-center mb-4">
                        <MessageIcon size={40} color="#94a3b8" />
                    </View>
                    <Text className="text-lg font-bold text-slate-900 text-center mb-2">
                        {t('messages.noConversationsTitle')}
                    </Text>
                    <Text className="text-slate-500 text-center text-sm">
                        {t('messages.noConversationsDesc')}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={threads}
                    renderItem={renderThreadItem}
                    keyExtractor={(item) => String(item.id)}
                    contentContainerStyle={{ paddingBottom: 100 }}
                />
            )}
        </View>
    );
}
