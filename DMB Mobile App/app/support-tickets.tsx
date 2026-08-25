import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    RefreshControl,
    TextInput,
    Modal,
    Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import Background from '../components/Background';
import { api } from '../utils/api';
import { useAuthStore } from '../stores/authStore';
import {
    LifeBuoyIcon,
    ChevronLeftIcon,
    PlusIcon,
    MessageCircleIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    SendIcon,
    ImagePlusIcon,
    ChevronRightIcon,
    AlertCircleIcon,
} from '../components/Icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';

interface SupportTicket {
    id: number;
    ticket_id: string;
    subject: string;
    category: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high';
    created_at: string;
    updated_at: string;
    last_reply_at: string | null;
    unread_count: number;
}

const categories = [
    { value: 'account', label: 'Account Issues' },
    { value: 'payment', label: 'Payment & Billing' },
    { value: 'profile', label: 'Profile Help' },
    { value: 'matching', label: 'Matching Issues' },
    { value: 'technical', label: 'Technical Problems' },
    { value: 'other', label: 'Other' },
];

// Map category values to backend IDs
// These should match the support_categories table in the database
const categoryIdMap: Record<string, number> = {
    account: 1,
    payment: 2,
    profile: 3,
    matching: 4,
    technical: 5,
    other: 6,
};

const priorities = [
    { value: 'low', label: 'Low', color: '#22c55e' },
    { value: 'medium', label: 'Medium', color: '#f59e0b' },
    { value: 'high', label: 'High', color: '#ef4444' },
];

const SupportTicketsScreen = () => {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newTicket, setNewTicket] = useState({
        subject: '',
        category: 'account',
        priority: 'medium',
        message: '',
        attachments: [] as string[],
    });

    const fetchTickets = useCallback(async () => {
        try {
            const response = await api.get('/member/my-tickets');
            if (response.data.result && response.data.data) {
                // Normalize status to lowercase for mobile app compatibility
                const normalizedTickets = response.data.data.map((ticket: any) => ({
                    ...ticket,
                    status: (ticket.status_key || ticket.status || 'open').toLowerCase(),
                }));
                setTickets(normalizedTickets);
            }
        } catch (error) {
            console.error('Failed to fetch tickets', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchTickets();
    }, [fetchTickets]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchTickets();
    };

    const handleCreateTicket = async () => {
        if (!newTicket.subject.trim()) {
            Alert.alert(t('common.error'), t('support.enterSubject'));
            return;
        }
        if (!newTicket.message.trim()) {
            Alert.alert(t('common.error'), t('support.describeIssue'));
            return;
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setCreating(true);
        try {
            // Map frontend params to backend expected params
            const payload = {
                subject: newTicket.subject,
                support_category_id: categoryIdMap[newTicket.category] || 1,
                description: newTicket.message,
                priority: newTicket.priority,
            };
            const response = await api.post('/member/support-ticket/store', payload);
            if (response.data.result) {
                Alert.alert(t('common.success'), t('support.ticketCreated'));
                setShowCreateModal(false);
                setNewTicket({
                    subject: '',
                    category: 'account',
                    priority: 'medium',
                    message: '',
                    attachments: [],
                });
                fetchTickets();
            } else {
                Alert.alert(t('common.error'), response.data.message || t('support.createFailed'));
            }
        } catch (error: any) {
            Alert.alert(
                t('common.error'),
                error.response?.data?.message || t('support.createFailed'),
            );
        } finally {
            setCreating(false);
        }
    };

    const handleAddAttachment = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setNewTicket((prev) => ({
                ...prev,
                attachments: [...prev.attachments, result.assets[0].uri],
            }));
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open':
                return { bg: 'bg-blue-100', text: 'text-blue-600' };
            case 'in_progress':
                return { bg: 'bg-amber-100', text: 'text-amber-600' };
            case 'resolved':
                return { bg: 'bg-emerald-100', text: 'text-emerald-600' };
            case 'closed':
                return { bg: 'bg-slate-100', text: 'text-slate-600' };
            default:
                return { bg: 'bg-slate-100', text: 'text-slate-600' };
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'open':
                return <AlertCircleIcon size={14} color="#3b82f6" />;
            case 'in_progress':
                return <ClockIcon size={14} color="#f59e0b" />;
            case 'resolved':
                return <CheckCircleIcon size={14} color="#22c55e" />;
            case 'closed':
                return <XCircleIcon size={14} color="#64748b" />;
            default:
                return <ClockIcon size={14} color="#64748b" />;
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <View className="flex-1 bg-slate-50">
                <LinearGradient
                    colors={['#7c3aed', '#8b5cf6', '#a78bfa']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="flex-1 items-center justify-center"
                >
                    <MotiView
                        from={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', damping: 15 }}
                        className="items-center"
                    >
                        <View className="w-20 h-20 rounded-full bg-white/20 items-center justify-center mb-4">
                            <LifeBuoyIcon size={40} color="white" />
                        </View>
                        <ActivityIndicator size="large" color="white" />
                        <Text className="text-white/90 mt-4 font-medium">
                            {t('support.loading')}
                        </Text>
                    </MotiView>
                </LinearGradient>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-slate-50">
            <Background />

            {/* Header */}
            <LinearGradient
                colors={['#7c3aed', '#8b5cf6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ paddingTop: insets.top }}
            >
                <View className="flex-row items-center justify-between px-4 py-4">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
                    >
                        <ChevronLeftIcon size={24} color="white" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-white">{t('support.title')}</Text>
                    <TouchableOpacity
                        onPress={() => setShowCreateModal(true)}
                        className="w-10 h-10 rounded-full bg-white items-center justify-center"
                    >
                        <PlusIcon size={20} color="#7c3aed" />
                    </TouchableOpacity>
                </View>

                {/* Stats */}
                <View className="flex-row justify-center gap-8 pb-6">
                    <View className="items-center">
                        <Text className="text-3xl font-bold text-white">
                            {tickets.filter((t) => t.status === 'open').length}
                        </Text>
                        <Text className="text-white/70 text-xs">{t('support.open')}</Text>
                    </View>
                    <View className="w-px bg-white/30" />
                    <View className="items-center">
                        <Text className="text-3xl font-bold text-white">
                            {tickets.filter((t) => t.status === 'in_progress').length}
                        </Text>
                        <Text className="text-white/70 text-xs">{t('support.inProgress')}</Text>
                    </View>
                    <View className="w-px bg-white/30" />
                    <View className="items-center">
                        <Text className="text-3xl font-bold text-white">
                            {tickets.filter((t) => t.status === 'resolved').length}
                        </Text>
                        <Text className="text-white/70 text-xs">{t('support.resolved')}</Text>
                    </View>
                </View>
            </LinearGradient>

            {/* Tickets List */}
            <ScrollView
                className="flex-1 px-4 pt-4"
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor="#8b5cf6"
                    />
                }
            >
                {tickets.length === 0 ? (
                    <MotiView
                        from={{ opacity: 0, translateY: 20 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        className="items-center py-20"
                    >
                        <View className="w-24 h-24 rounded-full bg-purple-100 items-center justify-center mb-4">
                            <MessageCircleIcon size={48} color="#8b5cf6" />
                        </View>
                        <Text className="text-xl font-bold text-slate-900 mb-2">
                            {t('support.noTickets')}
                        </Text>
                        <Text className="text-slate-500 text-center px-8">
                            {t('support.noTicketsDesc')}
                        </Text>
                        <TouchableOpacity
                            onPress={() => setShowCreateModal(true)}
                            className="mt-6 bg-purple-500 px-8 py-3 rounded-full flex-row items-center"
                        >
                            <PlusIcon size={18} color="white" />
                            <Text className="text-white font-bold ml-2">
                                {t('support.newTicket')}
                            </Text>
                        </TouchableOpacity>
                    </MotiView>
                ) : (
                    <View className="pb-28">
                        {tickets.map((ticket, index) => {
                            const statusStyle = getStatusColor(ticket.status);
                            return (
                                <MotiView
                                    key={ticket.id}
                                    from={{ opacity: 0, translateX: -20 }}
                                    animate={{ opacity: 1, translateX: 0 }}
                                    transition={{ delay: index * 50 }}
                                >
                                    <TouchableOpacity
                                        onPress={() => router.push(`/support/${ticket.id}`)}
                                        className="bg-white rounded-2xl p-4 mb-3 border border-slate-100"
                                    >
                                        <View className="flex-row items-start justify-between">
                                            <View className="flex-1">
                                                <View className="flex-row items-center gap-2 mb-1">
                                                    <View
                                                        className={`px-2 py-0.5 rounded-full flex-row items-center ${statusStyle.bg}`}
                                                    >
                                                        {getStatusIcon(ticket.status)}
                                                        <Text
                                                            className={`text-xs font-semibold ml-1 capitalize ${statusStyle.text}`}
                                                        >
                                                            {ticket.status.replace('_', ' ')}
                                                        </Text>
                                                    </View>
                                                    {ticket.unread_count > 0 && (
                                                        <View className="bg-red-500 px-2 py-0.5 rounded-full">
                                                            <Text className="text-white text-xs font-bold">
                                                                {ticket.unread_count}
                                                            </Text>
                                                        </View>
                                                    )}
                                                </View>
                                                <Text
                                                    className="text-base font-bold text-slate-900"
                                                    numberOfLines={2}
                                                >
                                                    {ticket.subject}
                                                </Text>
                                                <View className="flex-row items-center mt-2">
                                                    <Text className="text-slate-400 text-xs">
                                                        #{ticket.ticket_id}
                                                    </Text>
                                                    <Text className="text-slate-300 mx-2">•</Text>
                                                    <Text className="text-slate-400 text-xs">
                                                        {formatDate(ticket.updated_at)}
                                                    </Text>
                                                </View>
                                            </View>
                                            <ChevronRightIcon size={20} color="#94a3b8" />
                                        </View>
                                    </TouchableOpacity>
                                </MotiView>
                            );
                        })}
                    </View>
                )}
            </ScrollView>

            {/* Create Ticket Modal */}
            <Modal
                visible={showCreateModal}
                animationType="slide"
                transparent
                onRequestClose={() => setShowCreateModal(false)}
            >
                <View className="flex-1 bg-black/50 justify-end">
                    <MotiView
                        from={{ translateY: 500 }}
                        animate={{ translateY: 0 }}
                        className="bg-white rounded-t-3xl"
                        style={{ paddingBottom: insets.bottom + 16, maxHeight: '90%' }}
                    >
                        <View className="w-12 h-1 bg-slate-300 rounded-full self-center my-4" />

                        <ScrollView className="px-6" showsVerticalScrollIndicator={false}>
                            <Text className="text-2xl font-bold text-slate-900 mb-6">
                                {t('support.newSupportTicket')}
                            </Text>

                            {/* Subject */}
                            <View className="mb-4">
                                <Text className="text-xs font-bold text-slate-500 uppercase mb-2">
                                    {t('support.subject')}
                                </Text>
                                <TextInput
                                    className="bg-slate-100 rounded-xl px-4 py-3 text-base text-slate-900"
                                    value={newTicket.subject}
                                    onChangeText={(v) =>
                                        setNewTicket((prev) => ({ ...prev, subject: v }))
                                    }
                                    placeholder="Brief description of your issue"
                                    placeholderTextColor="#94a3b8"
                                />
                            </View>

                            {/* Category */}
                            <View className="mb-4">
                                <Text className="text-xs font-bold text-slate-500 uppercase mb-2">
                                    {t('support.category')}
                                </Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    {categories.map((cat) => (
                                        <TouchableOpacity
                                            key={cat.value}
                                            onPress={() => {
                                                Haptics.selectionAsync();
                                                setNewTicket((prev) => ({
                                                    ...prev,
                                                    category: cat.value,
                                                }));
                                            }}
                                            className={`px-4 py-2 rounded-full mr-2 border ${
                                                newTicket.category === cat.value
                                                    ? 'bg-purple-500 border-purple-500'
                                                    : 'bg-white border-slate-200'
                                            }`}
                                        >
                                            <Text
                                                className={
                                                    newTicket.category === cat.value
                                                        ? 'text-white font-semibold'
                                                        : 'text-slate-600'
                                                }
                                            >
                                                {cat.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            {/* Priority */}
                            <View className="mb-4">
                                <Text className="text-xs font-bold text-slate-500 uppercase mb-2">
                                    {t('support.priority')}
                                </Text>
                                <View className="flex-row gap-2">
                                    {priorities.map((pri) => (
                                        <TouchableOpacity
                                            key={pri.value}
                                            onPress={() => {
                                                Haptics.selectionAsync();
                                                setNewTicket((prev) => ({
                                                    ...prev,
                                                    priority: pri.value,
                                                }));
                                            }}
                                            className={`flex-1 py-3 rounded-xl border items-center ${
                                                newTicket.priority === pri.value
                                                    ? 'border-2'
                                                    : 'bg-white border-slate-200'
                                            }`}
                                            style={
                                                newTicket.priority === pri.value
                                                    ? {
                                                          borderColor: pri.color,
                                                          backgroundColor: pri.color + '10',
                                                      }
                                                    : {}
                                            }
                                        >
                                            <Text
                                                style={{
                                                    color:
                                                        newTicket.priority === pri.value
                                                            ? pri.color
                                                            : '#64748b',
                                                }}
                                                className="font-semibold"
                                            >
                                                {pri.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Message */}
                            <View className="mb-4">
                                <Text className="text-xs font-bold text-slate-500 uppercase mb-2">
                                    {t('support.describeYourIssue')}
                                </Text>
                                <TextInput
                                    className="bg-slate-100 rounded-xl px-4 py-3 text-base text-slate-900 min-h-[120px]"
                                    value={newTicket.message}
                                    onChangeText={(v) =>
                                        setNewTicket((prev) => ({ ...prev, message: v }))
                                    }
                                    placeholder="Please provide as much detail as possible..."
                                    placeholderTextColor="#94a3b8"
                                    multiline
                                    textAlignVertical="top"
                                />
                            </View>

                            {/* Attachments */}
                            <View className="mb-6">
                                <Text className="text-xs font-bold text-slate-500 uppercase mb-2">
                                    {t('support.attachments')}
                                </Text>
                                <View className="flex-row flex-wrap gap-2">
                                    {newTicket.attachments.map((uri, idx) => (
                                        <Image
                                            key={idx}
                                            source={{ uri }}
                                            className="w-16 h-16 rounded-lg"
                                        />
                                    ))}
                                    <TouchableOpacity
                                        onPress={handleAddAttachment}
                                        className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-300 items-center justify-center"
                                    >
                                        <ImagePlusIcon size={24} color="#94a3b8" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Buttons */}
                            <View className="flex-row gap-3 mb-6">
                                <TouchableOpacity
                                    onPress={() => setShowCreateModal(false)}
                                    className="flex-1 bg-slate-200 py-4 rounded-xl items-center"
                                >
                                    <Text className="text-slate-700 font-bold text-lg">
                                        {t('common.cancel')}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleCreateTicket}
                                    disabled={creating}
                                    className={`flex-1 py-4 rounded-xl items-center flex-row justify-center ${
                                        creating ? 'bg-slate-300' : 'bg-purple-500'
                                    }`}
                                >
                                    {creating ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <>
                                            <SendIcon size={18} color="white" />
                                            <Text className="text-white font-bold text-lg ml-2">
                                                {t('common.submit')}
                                            </Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </MotiView>
                </View>
            </Modal>
        </View>
    );
};

export default SupportTicketsScreen;
