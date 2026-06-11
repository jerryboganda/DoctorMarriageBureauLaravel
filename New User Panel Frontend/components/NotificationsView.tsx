import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Bell, ChevronRight, Heart, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import NotificationDetailModal, { NotificationDetailItem } from './NotificationDetailModal';
import { useAuthStore } from '../src/stores/authStore';
import { echo } from '../utils/echo';
import { api } from '../utils/api';

interface NotificationItem extends NotificationDetailItem {
    body?: string;
    created_at?: string;
    is_read?: boolean;
    notify_by?: string | number | null;
    info_id?: string | number | null;
    raw_data?: Record<string, any>;
}

interface NotificationsViewProps {
    onNavigate?: (view: string) => void;
    onOpenProfile?: (profileId: string) => void;
    refreshVersion?: number;
    onDataChanged?: () => void;
}

const normalizeNotificationType = (value: unknown): string =>
    String(value ?? '')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '_');

const sanitizeNotification = (item: any): NotificationItem => {
    const message = String(item?.message ?? item?.full_message ?? 'No details available');
    const title = String(item?.title ?? '').trim() || message || 'Notification';

    return {
        notification_id: String(item?.notification_id ?? item?.id ?? Math.random().toString()),
        title,
        message,
        body: String(item?.body ?? item?.message ?? item?.full_message ?? ''),
        full_message: String(item?.full_message ?? item?.message ?? 'No details available'),
        time: String(item?.time ?? ''),
        created_at: item?.created_at ? String(item.created_at) : undefined,
        read_at: String(item?.read_at ?? (item?.is_read ? 'read' : 'New')),
        is_read: Boolean(item?.is_read ?? item?.read_at === 'read'),
        photo: String(item?.photo ?? ''),
        type: normalizeNotificationType(item?.type ?? 'system'),
        route: item?.route ? String(item.route) : null,
        sender_name: item?.sender_name ? String(item.sender_name) : null,
        notify_by: item?.notify_by ?? null,
        info_id: item?.info_id ?? null,
        raw_data: item?.raw_data && typeof item.raw_data === 'object' ? item.raw_data : undefined,
    };
};

const formatNotificationDate = (iso: string, relative: string): string => {
    if (!iso) return relative;
    try {
        const date = new Date(iso);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        const timeStr = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const monthNames = [
            'Jan',
            'Feb',
            'Mar',
            'Apr',
            'May',
            'Jun',
            'Jul',
            'Aug',
            'Sep',
            'Oct',
            'Nov',
            'Dec',
        ];

        if (diffHours < 1) return relative;
        if (diffHours < 24) return `${relative} · Today at ${timeStr}`;

        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (date.toDateString() === yesterday.toDateString()) return `Yesterday at ${timeStr}`;

        if (diffHours < 168) {
            return `${dayNames[date.getDay()]} at ${timeStr}`;
        }

        return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} at ${timeStr}`;
    } catch {
        return relative;
    }
};

const NotificationsView: React.FC<NotificationsViewProps> = ({
    onNavigate,
    onOpenProfile,
    refreshVersion,
    onDataChanged,
}) => {
    const { t } = useTranslation();
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [requestActionLoading, setRequestActionLoading] = useState<'accept' | 'reject' | null>(
        null,
    );

    const fetchNotifications = useCallback(async () => {
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
    }, []);

    useEffect(() => {
        fetchNotifications();

        if (user?.id && echo) {
            echo.private(`notifications.${user.id}`).listen('.NotificationReceived', () => {
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

    const unreadCount = useMemo(
        () => notifications.filter((notification) => notification.read_at === 'New').length,
        [notifications],
    );

    const updateNotification = (
        notificationId: string,
        updater: (item: NotificationItem) => NotificationItem,
    ) => {
        setNotifications((current) =>
            current.map((item) => (item.notification_id === notificationId ? updater(item) : item)),
        );
        setSelectedNotification((current) =>
            current && current.notification_id === notificationId ? updater(current) : current,
        );
    };

    const isProfilePhotoRequestNotification = (notification: NotificationItem | null): boolean =>
        normalizeNotificationType(notification?.type) === 'profile_picture_view';

    const isRequestHandled = (notification: NotificationItem | null): boolean =>
        Boolean(notification?.raw_data?.profile_photo_request_handled);

    const markNotificationRead = async (notificationId: string, shouldRefresh = false) => {
        updateNotification(notificationId, (item) => ({
            ...item,
            read_at: 'read',
            is_read: true,
        }));

        try {
            await api.get(`/member/notification/${notificationId}`);
            if (shouldRefresh) {
                await fetchNotifications();
            }
            onDataChanged?.();
        } catch (error) {
            console.error('Failed to mark notification as read', error);
        }
    };

    const markAllRead = async () => {
        try {
            await api.get('/member/mark-all-as-read');
            setNotifications((current) =>
                current.map((item) => ({
                    ...item,
                    read_at: 'read',
                    is_read: true,
                })),
            );
            setSelectedNotification((current) =>
                current ? { ...current, read_at: 'read', is_read: true } : null,
            );
            onDataChanged?.();
        } catch (error) {
            console.error('Failed to mark all as read', error);
        }
    };

    const getNotificationTypeLabel = (type: string): string => {
        switch (type) {
            case 'express_interest':
                return t('notifications.typeLabels.proposal');
            case 'accept_interest':
                return t('notifications.typeLabels.acceptedProposal');
            case 'interest_rejected':
            case 'reject_interest':
                return t('notifications.typeLabels.rejectedProposal');
            case 'profile_viewed':
            case 'profile_view':
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

    const MEMBER_PROFILE_NOTIFICATION_TYPES = new Set([
        'express_interest',
        'accept_interest',
        'interest_rejected',
        'reject_interest',
        'profile_viewed',
        'profile_view',
        'gallery_image_view',
        'profile_picture_view',
    ]);

    const getTargetProfileId = (notification: NotificationItem | null): string | null => {
        if (!notification) return null;

        const normalizedType = normalizeNotificationType(notification.type);
        if (!MEMBER_PROFILE_NOTIFICATION_TYPES.has(normalizedType)) {
            return null;
        }

        const directNotifyBy = String(notification.notify_by ?? '').trim();
        if (directNotifyBy) return directNotifyBy;

        const rawNotifyBy = String(notification.raw_data?.notify_by ?? '').trim();
        if (rawNotifyBy) return rawNotifyBy;

        return null;
    };

    const getNavigationTarget = (notification: NotificationItem): string | null => {
        const normalizedType = normalizeNotificationType(notification.type);
        const route = String(notification.route ?? '').toLowerCase();
        const normalizedMessage = `${notification.title} ${notification.message}`.toLowerCase();

        const typeMap: Record<string, string> = {
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

        if (typeMap[normalizedType]) {
            return typeMap[normalizedType];
        }

        if (route.includes('interest') || route.includes('proposal')) return 'dashboard';
        if (route.includes('message') || route.includes('chat')) return 'messages';
        if (route.includes('profile')) return 'discovery';
        if (route.endsWith('/notifications') || route === 'notifications') return 'notifications';

        if (normalizedMessage.includes('proposal') || normalizedMessage.includes('interest'))
            return 'dashboard';
        if (normalizedMessage.includes('message') || normalizedMessage.includes('chat'))
            return 'messages';
        if (normalizedMessage.includes('view')) return 'discovery';

        return null;
    };

    const getNormalizedRouteUrl = (route?: string | null): string | null => {
        const rawRoute = String(route ?? '').trim();
        if (!rawRoute || rawRoute === 'notifications') {
            return null;
        }

        const origin = window.location.origin;

        try {
            if (/^https?:\/\//i.test(rawRoute)) {
                const url = new URL(rawRoute);
                return `${origin}${url.pathname}${url.search}${url.hash}`;
            }
        } catch (error) {
            console.error('Failed to normalize notification route', error);
        }

        if (rawRoute.startsWith('/')) {
            return `${origin}${rawRoute}`;
        }

        return `${origin}/${rawRoute.replace(/^\/+/, '')}`;
    };

    const canOpenRelatedPage = (notification: NotificationItem | null): boolean => {
        if (!notification) return false;

        if (getTargetProfileId(notification)) {
            return true;
        }

        const target = getNavigationTarget(notification);
        if (target && target !== 'notifications') {
            return true;
        }

        return Boolean(getNormalizedRouteUrl(notification.route));
    };

    const handleOpenRelatedPage = () => {
        if (!selectedNotification) return;

        const targetProfileId = getTargetProfileId(selectedNotification);
        if (targetProfileId && onOpenProfile) {
            setSelectedNotification(null);
            onOpenProfile(targetProfileId);
            return;
        }

        const target = getNavigationTarget(selectedNotification);
        if (target && target !== 'notifications' && onNavigate) {
            setSelectedNotification(null);
            onNavigate(target);
            return;
        }

        const routeUrl = getNormalizedRouteUrl(selectedNotification.route);
        if (routeUrl) {
            window.open(routeUrl, '_blank', 'noopener,noreferrer');
        }
    };

    const handleViewDetails = async (notification: NotificationItem) => {
        setSelectedNotification(notification);
        setDetailLoading(true);
        markNotificationRead(notification.notification_id, false);

        try {
            const response = await api.get(`/member/notifications/${notification.notification_id}`);
            const detail = sanitizeNotification(response.data?.data ?? notification);
            setSelectedNotification(detail);
            updateNotification(notification.notification_id, () => detail);
        } catch (error) {
            console.error('Failed to fetch notification details', error);
        } finally {
            setDetailLoading(false);
        }
    };

    const handleProfilePhotoRequestAction = async (action: 'accept' | 'reject') => {
        if (!selectedNotification || requestActionLoading) return;

        const requestId = String(selectedNotification.info_id ?? '').trim();
        if (!requestId) {
            console.error('Missing profile photo request id on notification');
            return;
        }

        setRequestActionLoading(action);

        try {
            const endpoint =
                action === 'accept'
                    ? '/member/profile-picture-view-request/accept'
                    : '/member/profile-picture-view-request/reject';

            await api.post(endpoint, {
                profile_pic_view_request_id: requestId,
            });

            updateNotification(selectedNotification.notification_id, (item) => ({
                ...item,
                read_at: 'read',
                is_read: true,
                raw_data: {
                    ...(item.raw_data ?? {}),
                    profile_photo_request_handled: true,
                },
                full_message:
                    action === 'accept'
                        ? t('notifications.photoRequestAccepted')
                        : t('notifications.photoRequestRejected'),
                message:
                    action === 'accept'
                        ? t('notifications.photoRequestAccepted')
                        : t('notifications.photoRequestRejected'),
                body:
                    action === 'accept'
                        ? t('notifications.photoRequestAccepted')
                        : t('notifications.photoRequestRejected'),
            }));

            await fetchNotifications();
            onDataChanged?.();
        } catch (error) {
            console.error(`Failed to ${action} profile photo request`, error);
        } finally {
            setRequestActionLoading(null);
        }
    };

    const displayedNotifications = notifications.filter((notification) =>
        activeTab === 'unread' ? notification.read_at === 'New' : true,
    );

    const getNotificationSummary = (notification: NotificationItem): string => {
        const title = notification.title.trim();
        const message = notification.message.trim();

        if (title && message && title !== message) {
            return message;
        }

        return t('notifications.checkList', { type: getNotificationTypeLabel(notification.type) });
    };

    return (
        <>
            <div className="relative flex h-full min-h-0 flex-1 flex-col bg-slate-50">
                <header className="sticky top-0 z-10 flex h-20 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-8">
                    <div>
                        <h1 className="flex items-center gap-3 text-2xl font-bold text-slate-900">
                            {t('notifications.title')}
                            {unreadCount > 0 ? (
                                <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-white">
                                    {unreadCount}
                                </span>
                            ) : null}
                        </h1>
                        <p className="text-sm text-slate-500">{t('notifications.subtitle')}</p>
                    </div>

                    <button
                        onClick={markAllRead}
                        className="rounded-lg px-3 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary/5"
                    >
                        {t('notifications.markAllRead')}
                    </button>
                </header>

                <div className="flex gap-4 border-b border-slate-200 bg-white px-8 py-4">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${activeTab === 'all' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                        {t('notifications.allActivity')}
                    </button>
                    <button
                        onClick={() => setActiveTab('unread')}
                        className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${activeTab === 'unread' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                        {t('notifications.unread')}
                    </button>
                </div>

                <div className="scrollbar-hide flex-1 space-y-4 overflow-y-auto p-4 md:p-8">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="animate-spin text-primary" size={32} />
                        </div>
                    ) : displayedNotifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                            <div className="mb-4 flex size-16 items-center justify-center rounded-full border border-slate-100 bg-white shadow-sm">
                                <Bell className="opacity-20" size={32} />
                            </div>
                            <p className="font-bold">{t('notifications.emptyTitle')}</p>
                            <p className="text-sm">{t('notifications.emptyDescription')}</p>
                        </div>
                    ) : (
                        displayedNotifications.map((notification) => {
                            const isUnread = notification.read_at === 'New';

                            return (
                                <div
                                    key={notification.notification_id}
                                    onClick={() =>
                                        markNotificationRead(notification.notification_id, false)
                                    }
                                    className={`group cursor-pointer rounded-2xl border bg-white p-4 transition-all md:p-6 ${isUnread ? 'border-primary/20 shadow-sm' : 'border-slate-100 opacity-80'}`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="relative shrink-0">
                                            <img
                                                src={notification.photo}
                                                alt={
                                                    notification.title ||
                                                    notification.type ||
                                                    'Notification'
                                                }
                                                className="size-12 rounded-2xl object-cover md:size-14"
                                            />
                                            <div
                                                className={`absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-lg border-2 border-white text-white ${notification.type === 'express_interest' ? 'bg-pink-500' : notification.type === 'gallery_image_view' ? 'bg-primary' : 'bg-slate-400'}`}
                                            >
                                                {notification.type === 'express_interest' ? (
                                                    <Heart size={12} fill="currentColor" />
                                                ) : (
                                                    <Bell size={12} />
                                                )}
                                            </div>
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="mb-1 flex items-start justify-between">
                                                <h3
                                                    className={`truncate text-slate-900 ${isUnread ? 'font-bold' : 'font-medium'}`}
                                                >
                                                    {notification.title}
                                                </h3>
                                                <span className="ml-2 whitespace-nowrap text-[10px] font-medium text-slate-400 md:text-xs">
                                                    {formatNotificationDate(
                                                        notification.created_at ?? '',
                                                        notification.time,
                                                    )}
                                                </span>
                                            </div>

                                            <p className="line-clamp-2 text-xs text-slate-500 md:text-sm">
                                                {notification.body?.trim() ||
                                                    getNotificationSummary(notification)}
                                            </p>

                                            <div className="mt-4 flex items-center gap-3">
                                                <button
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        handleViewDetails(notification);
                                                    }}
                                                    className="flex items-center gap-1 text-xs font-bold text-primary transition-all hover:gap-2 hover:underline"
                                                >
                                                    {t('notifications.viewDetails')}{' '}
                                                    <ChevronRight size={14} />
                                                </button>
                                                {isUnread ? (
                                                    <span className="size-2 rounded-full bg-primary"></span>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <NotificationDetailModal
                notification={
                    selectedNotification
                        ? {
                              ...selectedNotification,
                              type_label: getNotificationTypeLabel(selectedNotification.type),
                          }
                        : null
                }
                isLoading={detailLoading}
                showOpenAction={canOpenRelatedPage(selectedNotification)}
                showRequestActions={
                    isProfilePhotoRequestNotification(selectedNotification) &&
                    Boolean(selectedNotification?.info_id)
                }
                requestActionLoading={requestActionLoading}
                requestActionHandled={isRequestHandled(selectedNotification)}
                onClose={() => setSelectedNotification(null)}
                onOpenRelated={handleOpenRelatedPage}
                onAcceptRequest={() => handleProfilePhotoRequestAction('accept')}
                onRejectRequest={() => handleProfilePhotoRequestAction('reject')}
            />
        </>
    );
};

export default NotificationsView;
