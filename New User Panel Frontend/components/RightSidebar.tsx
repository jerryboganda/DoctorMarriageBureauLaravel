import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
    CheckCircle2,
    Lightbulb,
    Loader2,
    Eye,
    Heart,
    X,
    User as UserIcon,
    MapPin,
    ChevronRight,
    AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { api } from '../utils/api';
import { normalizePositiveAge } from '../utils/age';

const QUALITY_WEIGHTS: Record<string, number> = {
    basics: 20,
    photos: 20,
    lifestyle: 15,
    career: 15,
    family: 10,
    preferences: 10,
    media: 10,
};

const SECTION_ICONS: Record<string, string> = {
    basics: '👤',
    photos: '📸',
    lifestyle: '🌟',
    career: '💼',
    family: '👨‍👩‍👧‍👦',
    preferences: '💝',
    media: '🎙️',
};

const cleanTemplateText = (text: string) =>
    text
        .replace(/\{\{\s*name\s*\}\}/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

interface ProfileItem {
    user_id: number;
    name: string;
    photo: string;
    age?: number | null;
    religion?: string;
    country?: string;
    mothere_tongue?: string;
    status?: string;
}

interface Improvement {
    action: string;
    points: number;
    section: string;
}

interface RightSidebarProps {
    onNavigateToProfile?: (section: string) => void;
}

/* ─── Stats Popup Modal (rendered via portal) ─── */
const StatsPopup: React.FC<{
    title: string;
    icon: React.ReactNode;
    items: ProfileItem[];
    loading: boolean;
    onClose: () => void;
    accentColor: string;
}> = ({ title, icon, items, loading, onClose, accentColor }) => {
    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                onClick={onClose}
            >
                {/* Backdrop */}
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: 'spring', duration: 0.4 }}
                    className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div
                        className={`flex items-center justify-between p-5 border-b border-slate-100 ${accentColor}`}
                    >
                        <div className="flex items-center gap-3">
                            {icon}
                            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-full hover:bg-slate-100 transition-colors"
                        >
                            <X size={18} className="text-slate-500" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-3">
                                <Loader2 className="animate-spin text-primary" size={28} />
                                <span className="text-sm text-slate-400">Loading...</span>
                            </div>
                        ) : items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                                <div className="p-4 bg-slate-50 rounded-full">
                                    <UserIcon size={32} className="text-slate-300" />
                                </div>
                                <p className="text-sm text-slate-500 font-medium">
                                    No profiles to show yet
                                </p>
                                <p className="text-xs text-slate-400">
                                    Check back later as your profile gets more visibility
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {items.map((item, idx) => (
                                    <motion.div
                                        key={item.user_id || idx}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
                                    >
                                        {/* Avatar */}
                                        <div className="w-11 h-11 rounded-full overflow-hidden bg-slate-100 shrink-0 ring-2 ring-white shadow-sm">
                                            <img
                                                src={item.photo}
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src =
                                                        'https://ui-avatars.com/api/?name=' +
                                                        encodeURIComponent(item.name || 'U') +
                                                        '&background=d41173&color=fff';
                                                }}
                                            />
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-800 truncate">
                                                {item.name || 'Unknown'}
                                            </p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                {item.age && (
                                                    <span className="text-xs text-slate-500">
                                                        {item.age} yrs
                                                    </span>
                                                )}
                                                {item.age && (item.country || item.religion) && (
                                                    <span className="text-slate-300">•</span>
                                                )}
                                                {item.country && (
                                                    <span className="text-xs text-slate-500 flex items-center gap-0.5">
                                                        <MapPin size={10} />
                                                        {item.country}
                                                    </span>
                                                )}
                                                {item.religion && !item.country && (
                                                    <span className="text-xs text-slate-500">
                                                        {item.religion}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Status badge (for interests) */}
                                        {item.status && (
                                            <span
                                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                                    item.status === 'Approved'
                                                        ? 'bg-green-50 text-green-600'
                                                        : 'bg-amber-50 text-amber-600'
                                                }`}
                                            >
                                                {item.status}
                                            </span>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {!loading && items.length > 0 && (
                        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
                            <p className="text-[11px] text-slate-400 text-center">
                                Showing {items.length} profile{items.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body,
    );
};

const RightSidebar: React.FC<RightSidebarProps> = ({ onNavigateToProfile }) => {
    const { t } = useTranslation();
    const [stats, setStats] = useState({
        total_views: 0,
        total_likes: 0,
        total_matches: 0,
    });
    const [qualityMetrics, setQualityMetrics] = useState<
        {
            key: string;
            label: string;
            percentage: number;
            color: 'primary' | 'yellow' | 'red';
        }[]
    >([]);
    const [qualityTotal, setQualityTotal] = useState(0);
    const [qualityLevel, setQualityLevel] = useState('');
    const [improvements, setImprovements] = useState<Improvement[]>([]);
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Popup state
    const [popupType, setPopupType] = useState<'viewers' | 'interests' | null>(null);
    const [popupItems, setPopupItems] = useState<ProfileItem[]>([]);
    const [popupLoading, setPopupLoading] = useState(false);

    const activityText = useCallback(
        (key: string, fallback: string, name: string) => {
            const translated = t(key, { name, defaultValue: fallback });
            return cleanTemplateText(translated || fallback);
        },
        [t],
    );

    useEffect(() => {
        let isActive = true;
        let isFetching = false;

        const fetchData = async () => {
            if (isFetching) return;
            if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
                return;
            }
            isFetching = true;

            try {
                const results = await Promise.allSettled([
                    api.get('/dashboard/stats'),
                    api.get('/dashboard/recent-visitors'),
                    api.get('/dashboard/message-preview'),
                    api.get('/dashboard/incoming-interest'),
                    api.get('/member/profile/quality-score'),
                ]);

                if (!isActive) return;

                const statsRes = results[0].status === 'fulfilled' ? results[0].value : null;
                const visitorsRes = results[1].status === 'fulfilled' ? results[1].value : null;
                const messagesRes = results[2].status === 'fulfilled' ? results[2].value : null;
                const interestsRes = results[3].status === 'fulfilled' ? results[3].value : null;
                const qualityRes = results[4].status === 'fulfilled' ? results[4].value : null;

                if (statsRes?.data) {
                    setStats(statsRes.data);
                }

                // Quality score - show all sections
                const qualityData = qualityRes?.data?.data ?? {};
                const breakdown = qualityData.breakdown ?? {};
                setQualityTotal(qualityData.total ?? 0);
                setQualityLevel(qualityData.level ?? '');
                setImprovements((qualityData.improvements ?? []).slice(0, 4));

                const allSections = [
                    { key: 'basics', label: t('dashboard.sidebar.basics', 'Basics') },
                    { key: 'photos', label: t('dashboard.sidebar.photos', 'Photos') },
                    { key: 'lifestyle', label: t('dashboard.sidebar.lifestyle', 'Lifestyle') },
                    { key: 'career', label: t('dashboard.sidebar.career', 'Career') },
                    { key: 'family', label: t('dashboard.sidebar.family', 'Family') },
                    {
                        key: 'preferences',
                        label: t('dashboard.sidebar.preferences', 'Preferences'),
                    },
                    { key: 'media', label: t('dashboard.sidebar.media', 'Media') },
                ];

                const metrics = allSections.map((item) => {
                    const value = Number(breakdown[item.key] ?? 0);
                    const weight = QUALITY_WEIGHTS[item.key] ?? 1;
                    const percentage = Math.max(
                        0,
                        Math.min(100, Math.round((value / weight) * 100)),
                    );
                    return {
                        key: item.key,
                        label: item.label,
                        percentage,
                        color:
                            percentage >= 75
                                ? ('primary' as const)
                                : percentage >= 40
                                  ? ('yellow' as const)
                                  : ('red' as const),
                    };
                });

                setQualityMetrics(metrics);

                const visitorItems = (visitorsRes?.data ?? []).map((visitor: any) => ({
                    id: `view-${visitor.id}`,
                    type: 'view',
                    user: visitor.name,
                    time: visitor.visited_time,
                }));

                const messageItems = (messagesRes?.data ?? []).map((message: any) => ({
                    id: `message-${message.thread_id}`,
                    type: 'message',
                    user: message.sender_name,
                    message: message.message_preview,
                    time: message.time_ago,
                    isNew: (message.unread_count ?? 0) > 0,
                }));

                const interestItems = (interestsRes?.data ?? []).map((interest: any) => ({
                    id: `interest-${interest.interest_id}`,
                    type: 'interest',
                    user: interest.name,
                    message: `${normalizePositiveAge(interest.age) ? `${normalizePositiveAge(interest.age)} yrs` : 'Member'} - ${interest.location ?? 'Location hidden'}`,
                    time: 'New interest',
                }));

                setActivities([...messageItems, ...visitorItems, ...interestItems].slice(0, 6));
            } catch (error) {
                console.error('Failed to fetch sidebar data:', error);
            } finally {
                isFetching = false;
                if (isActive) {
                    setLoading(false);
                }
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 45000);
        const onVisibility = () => {
            if (document.visibilityState === 'visible') fetchData();
        };
        const onFocus = () => fetchData();
        document.addEventListener('visibilitychange', onVisibility);
        window.addEventListener('focus', onFocus);

        return () => {
            isActive = false;
            clearInterval(interval);
            document.removeEventListener('visibilitychange', onVisibility);
            window.removeEventListener('focus', onFocus);
        };
    }, []);

    const openViewersPopup = useCallback(async () => {
        setPopupType('viewers');
        setPopupLoading(true);
        setPopupItems([]);
        try {
            const res = await api.get('/member/my-profile-viewers');
            const data = res?.data?.data ?? res?.data ?? [];
            const items: ProfileItem[] = (Array.isArray(data) ? data : [])
                .filter(Boolean)
                .map((v: any) => ({
                    user_id: v.user_id,
                    name: v.name || 'Unknown',
                    photo: v.photo || '',
                    age: normalizePositiveAge(v.age),
                    religion: v.religion,
                    country: v.country,
                    mothere_tongue: v.mothere_tongue,
                }));
            setPopupItems(items);
        } catch (err) {
            console.error('Failed to fetch profile viewers:', err);
            setPopupItems([]);
        } finally {
            setPopupLoading(false);
        }
    }, []);

    const openInterestsPopup = useCallback(async () => {
        setPopupType('interests');
        setPopupLoading(true);
        setPopupItems([]);
        try {
            const res = await api.get('/member/my-interests');
            const data = res?.data?.data ?? res?.data ?? [];
            const items: ProfileItem[] = (Array.isArray(data) ? data : [])
                .filter(Boolean)
                .map((v: any) => ({
                    user_id: v.user_id,
                    name: v.name || 'Unknown',
                    photo: v.photo || '',
                    age: normalizePositiveAge(v.age),
                    religion: v.religion,
                    country: v.country,
                    mothere_tongue: v.mothere_tongue,
                    status: v.status,
                }));
            setPopupItems(items);
        } catch (err) {
            console.error('Failed to fetch interests:', err);
            setPopupItems([]);
        } finally {
            setPopupLoading(false);
        }
    }, []);

    const closePopup = useCallback(() => {
        setPopupType(null);
        setPopupItems([]);
    }, []);

    const levelColor =
        qualityLevel === 'EXCELLENT'
            ? 'text-green-600 bg-green-50'
            : qualityLevel === 'GOOD'
              ? 'text-blue-600 bg-blue-50'
              : qualityLevel === 'FAIR'
                ? 'text-amber-600 bg-amber-50'
                : 'text-red-600 bg-red-50';

    return (
        <aside className="w-[340px] h-full flex flex-col bg-white border-l border-slate-200 shrink-0 p-6 overflow-y-auto hidden xl:flex">
            {/* Dynamic Stats View */}
            <div className="mb-8">
                <h3 className="text-lg font-bold text-slate-900 mb-4">
                    {t('dashboard.sidebar.yourDashboard')}
                </h3>
                <div className="grid grid-cols-2 gap-3 mb-6">
                    {/* Profile Views - CLICKABLE */}
                    <button
                        onClick={openViewersPopup}
                        className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left transition-all duration-200 hover:border-blue-200 hover:bg-blue-50/30 hover:shadow-md hover:shadow-blue-100/50 active:scale-[0.97] group cursor-pointer"
                    >
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg w-fit mb-2 group-hover:bg-blue-100 transition-colors">
                            <Eye size={16} />
                        </div>
                        <div className="text-xl font-bold text-slate-900">
                            {loading ? '...' : stats.total_views}
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-blue-500 transition-colors flex items-center gap-1">
                            {t('dashboard.sidebar.profileViews')}
                            <ChevronRight
                                size={10}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                            />
                        </div>
                    </button>

                    {/* Total Interests - CLICKABLE */}
                    <button
                        onClick={openInterestsPopup}
                        className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left transition-all duration-200 hover:border-primary/20 hover:bg-primary/5 hover:shadow-md hover:shadow-primary/10 active:scale-[0.97] group cursor-pointer"
                    >
                        <div className="p-2 bg-primary/10 text-primary rounded-lg w-fit mb-2 group-hover:bg-primary/20 transition-colors">
                            <Heart size={16} fill="currentColor" />
                        </div>
                        <div className="text-xl font-bold text-slate-900">
                            {loading ? '...' : stats.total_likes}
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-primary transition-colors flex items-center gap-1">
                            {t('dashboard.sidebar.totalInterests')}
                            <ChevronRight
                                size={10}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                            />
                        </div>
                    </button>
                </div>
            </div>

            {/* Vitals Check - Real-time quality score with all sections */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-900">
                        {t('dashboard.sidebar.vitalsCheck')}
                    </h3>
                    {!loading && qualityLevel && (
                        <span
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${levelColor}`}
                        >
                            {qualityTotal}% — {qualityLevel}
                        </span>
                    )}
                </div>

                <div className="bg-background-light rounded-xl p-5 space-y-3">
                    <p className="text-xs font-medium text-slate-500 mb-2">
                        {t('dashboard.sidebar.basedOnQuality')}
                    </p>

                    {loading ? (
                        <div className="flex items-center justify-center py-6">
                            <Loader2 className="animate-spin text-primary" size={22} />
                        </div>
                    ) : (
                        <>
                            {/* All quality metrics - clickable to navigate */}
                            {qualityMetrics.map((metric) => (
                                <button
                                    key={metric.key}
                                    onClick={() => onNavigateToProfile?.(metric.key)}
                                    className="w-full text-left group cursor-pointer hover:bg-white/60 rounded-lg p-1.5 -mx-1.5 transition-colors"
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                                            <span className="text-sm">
                                                {SECTION_ICONS[metric.key]}
                                            </span>
                                            {metric.label}
                                            <ChevronRight
                                                size={10}
                                                className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                            />
                                        </span>
                                        <span
                                            className={`text-xs font-bold ${
                                                metric.percentage >= 75
                                                    ? 'text-green-600'
                                                    : metric.percentage >= 40
                                                      ? 'text-amber-600'
                                                      : 'text-red-500'
                                            }`}
                                        >
                                            {metric.percentage}%
                                        </span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-700 ${
                                                metric.color === 'primary'
                                                    ? 'bg-green-500'
                                                    : metric.color === 'yellow'
                                                      ? 'bg-amber-400'
                                                      : 'bg-red-400'
                                            }`}
                                            style={{ width: `${metric.percentage}%` }}
                                        />
                                    </div>
                                </button>
                            ))}

                            {/* Improvement Suggestions */}
                            {improvements.length > 0 && (
                                <div className="pt-3 border-t border-slate-200 mt-3 space-y-2">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                                        Quick Improvements
                                    </p>
                                    {improvements.map((imp, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => onNavigateToProfile?.(imp.section)}
                                            className="w-full flex items-start gap-2 p-2 rounded-lg hover:bg-white/80 transition-colors cursor-pointer group text-left"
                                        >
                                            <AlertCircle
                                                size={13}
                                                className="text-amber-500 mt-0.5 shrink-0"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[11px] text-slate-600 leading-snug group-hover:text-slate-800">
                                                    {imp.action}
                                                </p>
                                                <p className="text-[10px] text-primary font-medium mt-0.5">
                                                    +{imp.points} pts
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div className="pt-2 border-t border-slate-200 mt-2">
                                <div className="flex items-start gap-2">
                                    <CheckCircle2
                                        size={18}
                                        className="text-green-500 mt-0.5 shrink-0"
                                    />
                                    <p className="text-xs text-slate-600 leading-snug">
                                        {t('dashboard.sidebar.keepUpdated')}
                                    </p>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Recent Activity */}
            <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4">
                    {t('dashboard.sidebar.recentActivity')}
                </h3>
                <div className="relative pl-2 border-l-2 border-slate-100 space-y-6">
                    {loading ? (
                        <div className="flex items-center gap-2 text-slate-400 text-sm pl-6">
                            <Loader2 size={16} className="animate-spin" />
                            <span>{t('dashboard.sidebar.loadingActivity')}</span>
                        </div>
                    ) : activities.length === 0 ? (
                        <div className="text-sm text-slate-400 text-center py-6">
                            {t('dashboard.sidebar.noRecentActivity')}
                        </div>
                    ) : (
                        activities.map((activity) => (
                            <div key={activity.id} className="relative pl-6">
                                <div
                                    className={`
                  absolute -left-[9px] top-1 size-4 rounded-full bg-white border-2 
                  ${
                      activity.type === 'view'
                          ? 'border-primary'
                          : activity.type === 'message'
                            ? 'border-blue-500'
                            : 'border-emerald-500'
                  }
                `}
                                ></div>

                                <div className="flex flex-col gap-1">
                                    {activity.type === 'view' && (
                                        <p className="text-sm text-slate-800">
                                            <span className="font-bold">{activity.user}</span>{' '}
                                            {activityText(
                                                'dashboard.sidebar.viewedProfile',
                                                'viewed your profile',
                                                activity.user,
                                            )}
                                        </p>
                                    )}
                                    {activity.type === 'message' && (
                                        <>
                                            <p className="text-sm text-slate-800">
                                                {activityText(
                                                    'dashboard.sidebar.newMessage',
                                                    'New message from',
                                                    activity.user,
                                                )}{' '}
                                                <span className="font-bold">{activity.user}</span>
                                            </p>
                                            <div className="bg-background-light p-2 rounded-lg mt-1">
                                                <p className="text-xs text-slate-500 italic">
                                                    {activity.message}
                                                </p>
                                            </div>
                                        </>
                                    )}
                                    {activity.type === 'interest' && (
                                        <>
                                            <p className="text-sm text-slate-800">
                                                <span className="font-bold">{activity.user}</span>{' '}
                                                {activityText(
                                                    'dashboard.sidebar.sentInterest',
                                                    'sent you an interest',
                                                    activity.user,
                                                )}
                                            </p>
                                            <div className="bg-background-light p-2 rounded-lg mt-1">
                                                <p className="text-xs text-slate-500 italic">
                                                    {activity.message}
                                                </p>
                                            </div>
                                        </>
                                    )}
                                    <span className="text-xs text-slate-400">{activity.time}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Quick Tip Card */}
            <div className="mt-auto pt-8">
                <div className="bg-gradient-to-br from-primary/10 to-transparent p-4 rounded-xl border border-primary/20">
                    <div className="flex gap-3 mb-2">
                        <Lightbulb size={20} className="text-primary fill-primary/20" />
                        <h4 className="font-bold text-primary text-sm">
                            {t('dashboard.sidebar.profileTip')}
                        </h4>
                    </div>
                    <p className="text-xs text-slate-600">{t('dashboard.sidebar.tipContent')}</p>
                </div>
            </div>

            {/* Popup Modals */}
            {popupType === 'viewers' && (
                <StatsPopup
                    title="Profile Viewers"
                    icon={
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <Eye size={18} />
                        </div>
                    }
                    items={popupItems}
                    loading={popupLoading}
                    onClose={closePopup}
                    accentColor="bg-white"
                />
            )}
            {popupType === 'interests' && (
                <StatsPopup
                    title="Interests Sent"
                    icon={
                        <div className="p-2 bg-primary/10 text-primary rounded-lg">
                            <Heart size={18} fill="currentColor" />
                        </div>
                    }
                    items={popupItems}
                    loading={popupLoading}
                    onClose={closePopup}
                    accentColor="bg-white"
                />
            )}
        </aside>
    );
};

export default RightSidebar;
