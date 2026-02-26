import React, { useState, useEffect } from 'react';
import {
    Bell, Mail, MessageCircle, Smartphone, Moon, Sun, Clock, Check, X,
    AlertTriangle, Shield, Heart, Search, FileText, ChevronRight, Zap,
    Calendar, PauseCircle, PlayCircle, Filter, Loader2, User
} from 'lucide-react';
import { api } from '../utils/api';
import { echo } from '../utils/echo';
import { useAuthStore } from '../src/stores/authStore';
import { useTranslation } from 'react-i18next';

interface NotificationItem {
    notification_id: string;
    message: string;
    body: string;
    time: string;
    created_at: string;
    read_at: string;
    photo: string;
    type: string;
}

const normalizeNotificationType = (value: unknown): string =>
    String(value ?? '')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '_');

const sanitizeNotification = (item: any): NotificationItem => ({
    notification_id: String(item?.notification_id ?? Math.random().toString()),
    message: String(item?.message ?? 'No details available'),
    body: String(item?.body ?? ''),
    time: String(item?.time ?? ''),
    created_at: String(item?.created_at ?? ''),
    read_at: String(item?.read_at ?? ''),
    photo: String(item?.photo ?? ''),
    type: normalizeNotificationType(item?.type ?? 'system')
});

const formatNotificationDate = (iso: string, relative: string): string => {
    if (!iso) return relative;
    try {
        const d = new Date(iso);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        const timeStr = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        if (diffHours < 1) return relative; // "X minutes ago" is fine for < 1 hour
        if (diffHours < 24) return `${relative} · Today at ${timeStr}`;

        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (d.toDateString() === yesterday.toDateString()) return `Yesterday at ${timeStr}`;

        if (diffHours < 168) { // within 7 days
            return `${dayNames[d.getDay()]} at ${timeStr}`;
        }

        return `${monthNames[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} at ${timeStr}`;
    } catch {
        return relative;
    }
};

interface NotificationsViewProps {
    onNavigate?: (view: string) => void;
    refreshVersion?: number;
    onDataChanged?: () => void;
}

const NotificationsView: React.FC<NotificationsViewProps> = ({ onNavigate, refreshVersion, onDataChanged }) => {
    const { t } = useTranslation();
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);

    useEffect(() => {
        fetchNotifications();
        
        if (user?.id && echo) {
            echo.private(`notifications.${user.id}`)
                .listen('.NotificationReceived', (e: any) => {
                    console.log('Real-time notification received:', e);
                    fetchNotifications();
                    onDataChanged?.();
                });
            
            return () => {
                echo.leaveChannel(`notifications.${user.id}`);
            };
        }
    }, [user?.id]);

    useEffect(() => {
        fetchNotifications();
    }, [refreshVersion]);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await api.get('/member/notifications');
            const rawData = Array.isArray(response.data?.data) ? response.data.data : [];
            setNotifications(rawData.map(sanitizeNotification));
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        } finally {
            setLoading(false);
        }
    };

    const markAllRead = async () => {
        try {
            await api.get('/member/mark-all-as-read');
            fetchNotifications();
            onDataChanged?.();
        } catch (error) {
            console.error('Failed to mark all as read', error);
        }
    };

    const handleRead = async (id: string) => {
        try {
            await api.get(`/member/notification/${id}`);
            await fetchNotifications();
            onDataChanged?.();
        } catch (error) {
            console.error('Failed to mark as read', error);
        }
    };


    const getNotificationTypeLabel = (type: string): string => {
        switch (type) {
            case 'express_interest':
                return t('notifications.typeLabels.proposal');
            case 'accept_interest':
                return t('notifications.typeLabels.acceptedProposal');
            case 'interest_rejected':
                return t('notifications.typeLabels.rejectedProposal');
            case 'profile_viewed':
                return t('notifications.typeLabels.profileViews');
            case 'gallery_image_view':
            case 'profile_picture_view':
                return t('notifications.typeLabels.galleryViews');
            case 'chat_message':
            case 'new_message':
                return t('notifications.typeLabels.messages');
            default:
                return t('notifications.typeLabels.updates');
        }
    };

    const getNavigationTarget = (type: string, message?: string): string | null => {
        const normalizedType = normalizeNotificationType(type);
        const map: Record<string, string> = {
            // Proposals are rendered inside the dashboard view in App.tsx
            express_interest: 'dashboard',
            accept_interest: 'dashboard',
            interest_rejected: 'dashboard',
            reject_interest: 'dashboard',
            profile_viewed: 'discovery',
            profile_view: 'discovery',
            gallery_image_view: 'profile',
            profile_picture_view: 'profile',
            chat_message: 'messages',
            new_message: 'messages',
            admin_notification: 'notifications',
        };
        if (map[normalizedType]) return map[normalizedType];

        const normalizedMessage = String(message ?? '').toLowerCase();
        if (normalizedMessage.includes('proposal') || normalizedMessage.includes('interest')) return 'dashboard';
        if (normalizedMessage.includes('message') || normalizedMessage.includes('chat')) return 'messages';
        if (normalizedMessage.includes('view')) return 'discovery';
        return 'notifications';
    };

    const handleViewDetails = async (n: NotificationItem) => {
        await handleRead(n.notification_id);
        const target = getNavigationTarget(n.type, n.message);
        if (target && onNavigate) {
            onNavigate(target);
            return;
        }
        onNavigate?.('dashboard');
    };

    const displayedNotifications = (Array.isArray(notifications) ? notifications : []).filter(n => {
        if (!n) return false;
        if (activeTab === 'unread') return n.read_at === 'New';
        return true;
    });

    return (
        <div className="flex-1 flex flex-col h-full min-h-0 bg-slate-50 relative">
            {/* Header */}
            <header className="h-20 shrink-0 flex items-center justify-between px-8 bg-white border-b border-slate-200 sticky top-0 z-10">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        {t('notifications.title')}
                        {Array.isArray(notifications) && notifications.filter(n => n && n.read_at === 'New').length > 0 && (
                            <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">
                                {notifications.filter(n => n && n.read_at === 'New').length}
                            </span>
                        )}
                    </h1>
                    <p className="text-sm text-slate-500">{t('notifications.subtitle')}</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={markAllRead}
                        className="text-xs font-bold text-primary hover:bg-primary/5 px-3 py-2 rounded-lg transition-colors"
                    >
                        {t('notifications.markAllRead')}
                    </button>
                </div>
            </header>

            {/* Filter Tabs */}
            <div className="px-8 py-4 bg-white border-b border-slate-200 flex gap-4">
                <button
                    onClick={() => setActiveTab('all')}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === 'all' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                    {t('notifications.allActivity')}
                </button>
                <button
                    onClick={() => setActiveTab('unread')}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === 'unread' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                    {t('notifications.unread')}
                </button>
            </div>

            {/* Main List */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 scrollbar-hide">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="animate-spin text-primary" size={32} />
                    </div>
                ) : displayedNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <div className="size-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-100">
                            <Bell className="opacity-20" size={32} />
                        </div>
                        <p className="font-bold">No notifications yet</p>
                        <p className="text-sm">We'll alert you when something important happens.</p>
                    </div>
                ) : (
                    displayedNotifications.map((n) => (
                        <div
                            key={n.notification_id}
                            onClick={() => handleViewDetails(n)}
                            className={`bg-white rounded-2xl p-4 md:p-6 border transition-all cursor-pointer group ${n.read_at === 'New' ? 'border-primary/20 shadow-sm' : 'border-slate-100 opacity-80'}`}
                        >
                            <div className="flex items-start gap-4">
                                <div className="relative shrink-0">
                                    <img src={n.photo} alt={n.type || 'Notification'} className="size-12 md:size-14 rounded-2xl object-cover" />
                                    <div className={`absolute -bottom-1 -right-1 size-6 rounded-lg flex items-center justify-center text-white border-2 border-white ${n.type === 'express_interest' ? 'bg-pink-500' :
                                        n.type === 'gallery_image_view' ? 'bg-primary' : 'bg-slate-400'
                                        }`}>
                                        {n.type === 'express_interest' ? <Heart size={12} fill="currentColor" /> : <Bell size={12} />}
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className={`font-bold text-slate-900 truncate ${n.read_at === 'New' ? '' : 'font-medium'}`}>
                                            {n.message}
                                        </h3>
                                        <span className="text-[10px] md:text-xs text-slate-400 font-medium whitespace-nowrap ml-2">
                                            {formatNotificationDate(n.created_at, n.time)}
                                        </span>
                                    </div>
                                    <p className="text-xs md:text-sm text-slate-500 line-clamp-2">
                                        {n.body || t('notifications.checkList', { type: getNotificationTypeLabel(n.type) })}
                                    </p>

                                    <div className="mt-4 flex items-center gap-3">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleViewDetails(n); }}
                                            className="text-xs font-bold text-primary flex items-center gap-1 group-hover:gap-2 transition-all hover:underline"
                                        >
                                            {t('notifications.viewDetails')} <ChevronRight size={14} />
                                        </button>
                                        {n.read_at === 'New' && (
                                            <span className="size-2 bg-primary rounded-full"></span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const TabButton: React.FC<{ label: string, active: boolean, onClick: () => void, count?: number }> = ({ label, active, onClick, count }) => (
    <button
        onClick={onClick}
        className={`
            px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2
            ${active ? 'bg-slate-900 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}
        `}
    >
        {label}
        {count && (
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${active ? 'bg-white text-slate-900' : 'bg-slate-200 text-slate-600'}`}>
                {count}
            </span>
        )}
    </button>
);

const ChannelToggle: React.FC<{ icon: React.ReactNode, label: string, desc: string, defaultChecked: boolean }> = ({ icon, label, desc, defaultChecked }) => (
    <div className="flex items-start gap-3">
        <div className="text-slate-400 mt-1">{icon}</div>
        <div className="flex-1">
            <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-900">{label}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked={defaultChecked} />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                </label>
            </div>
            <p className="text-xs text-slate-500">{desc}</p>
        </div>
    </div>
);

export default NotificationsView;
