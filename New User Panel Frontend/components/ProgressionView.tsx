import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ArrowLeft,
    Calendar,
    CalendarDays,
    Check,
    CheckCircle2,
    Clock,
    ExternalLink,
    Loader2,
    Mail,
    Plus,
    RotateCcw,
    Save,
    Store,
    Trash2,
    Users,
    Video,
    Phone,
    HeartHandshake,
    Calculator,
    ChevronRight,
} from 'lucide-react';
import { api } from '../utils/api';
import { echo } from '../utils/echo';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../src/stores/authStore';

type Track = {
    id: string;
    partner_id?: number | null;
    profile: {
        id: number;
        name: string;
        avatarUrl: string | null;
        profilePhotoBlur?: boolean;
        specialty: string | null;
        hospital: string | null;
        location: string | null;
    };
    stage: string;
    stageLabel: string;
    lastInteraction: string | null;
    nextAction: string | null;
    progress: number;
};

type Detail = {
    id: string;
    partner_id: number;
    stage: { id: number; slug: string; name: string; progress_percent: number } | null;
    profile: Track['profile'];
    events: Array<{
        id: number;
        title: string;
        event_at: string | null;
        location: string | null;
        status: 'scheduled' | 'completed' | 'cancelled';
        notes: string | null;
    }>;
    checklist_items: Array<{
        id: number;
        title: string;
        is_completed: boolean;
        completed_at: string | null;
        sort_order: number;
    }>;
    family_notes: Array<{ id: number; note: string }>;
    venues: Array<{
        id: number;
        name: string;
        venue_type: string | null;
        estimated_cost: number | null;
        rating: number | null;
        status: 'shortlisted' | 'visited' | 'confirmed' | 'rejected';
        notes: string | null;
    }>;
    budget: {
        target_budget: number | null;
        spent_estimate: number;
        items: Array<{
            id: number;
            label: string;
            amount: number;
            category: string | null;
            status: 'planned' | 'reserved' | 'spent' | 'paid';
            notes: string | null;
        }>;
    };
    settings: {
        share_calendar_busy: boolean;
        auto_detect_timezone: boolean;
        timezone: string | null;
        budget_target: number | null;
    };
    summary: {
        checklist_total: number;
        checklist_completed: number;
        notes_count: number;
        venues_count: number;
        events_count: number;
    };
    progress: number;
    next_action: string | null;
};

type ItemKind = 'checklist' | 'note' | 'venue' | 'budget' | 'event';
type Settings = Detail['settings'];
type VenueForm = {
    name: string;
    venue_type: string;
    estimated_cost: string;
    rating: string;
    status: 'shortlisted' | 'visited' | 'confirmed' | 'rejected';
    notes: string;
};
type BudgetForm = {
    label: string;
    amount: string;
    category: string;
    status: 'planned' | 'reserved' | 'spent' | 'paid';
    notes: string;
};
type EventForm = {
    title: string;
    event_at: string;
    location: string;
    status: 'scheduled' | 'completed' | 'cancelled';
    notes: string;
};
type Props = { onNavigate?: (view: string) => void };

const emptyVenue = (): VenueForm => ({
    name: '',
    venue_type: '',
    estimated_cost: '',
    rating: '',
    status: 'shortlisted',
    notes: '',
});
const emptyBudget = (): BudgetForm => ({
    label: '',
    amount: '',
    category: '',
    status: 'planned',
    notes: '',
});
const emptyEvent = (): EventForm => ({
    title: '',
    event_at: '',
    location: '',
    status: 'scheduled',
    notes: '',
});
const defaultSettings: Settings = {
    share_calendar_busy: true,
    auto_detect_timezone: true,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Karachi',
    budget_target: null,
};

const num = (value: string) => {
    const v = value.trim();
    if (!v) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
};
const money = (value?: number | null) =>
    value === null || value === undefined || Number.isNaN(Number(value))
        ? 'Not set'
        : `Rs. ${Number(value).toLocaleString('en-PK')}`;
const when = (value?: string | null) =>
    value
        ? Number.isNaN(new Date(value).getTime())
            ? 'Not scheduled'
            : new Date(value).toLocaleString()
        : 'Not scheduled';
const localDateTime = (value?: string | null) =>
    value
        ? new Date(new Date(value).getTime() - new Date(value).getTimezoneOffset() * 60000)
              .toISOString()
              .slice(0, 16)
        : '';
const isDefaultAvatar = (value?: string | null) => !value || value.includes('default-avatar.png');

const ProgressionView: React.FC<Props> = ({ onNavigate }) => {
    const { t } = useTranslation();
    const { user } = useAuthStore();
    const [tracks, setTracks] = useState<Track[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [partnerId, setPartnerId] = useState<number | null>(null);
    const [detail, setDetail] = useState<Detail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState<string | null>(null);
    const [saving, setSaving] = useState<string | null>(null);

    const loadTracks = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get('/progression/active');
            setTracks(res.data?.result ? res.data.tracks || [] : []);
            if (!res.data?.result) setError(res.data?.message || 'Unable to load progressions.');
        } catch (e: any) {
            setTracks([]);
            setError(e?.response?.data?.message || 'Unable to load progressions.');
        } finally {
            setLoading(false);
        }
    }, []);

    const loadDetail = useCallback(async (id: number) => {
        setDetailLoading(true);
        setDetailError(null);
        try {
            const res = await api.get(`/progression/${id}`);
            setDetail(res.data?.result ? res.data.data || null : null);
            if (!res.data?.result) setDetailError(res.data?.message || 'Unable to load details.');
        } catch (e: any) {
            setDetail(null);
            setDetailError(e?.response?.data?.message || 'Unable to load details.');
        } finally {
            setDetailLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!user?.id) {
            setLoading(false);
            setTracks([]);
            setDetail(null);
            setPartnerId(null);
            return;
        }
        void loadTracks();
    }, [user?.id, loadTracks]);

    useEffect(() => {
        if (partnerId) void loadDetail(partnerId);
        else setDetail(null);
    }, [partnerId, loadDetail]);
    useEffect(() => {
        if (!partnerId) return;
        if (!tracks.some((t) => Number(t.partner_id ?? t.profile.id) === partnerId)) {
            setPartnerId(null);
            setDetail(null);
        }
    }, [tracks, partnerId]);

    useEffect(() => {
        if (!user?.id || !echo) return;
        const name = `progression.${user.id}`;
        echo.private(name).listen('.progression.updated', () => {
            void loadTracks();
            if (partnerId) void loadDetail(partnerId);
        });
        return () => {
            echo.leave(name);
        };
    }, [user?.id, partnerId, loadTracks, loadDetail]);

    const mutate = useCallback(
        async (key: string, run: () => Promise<any>) => {
            setSaving(key);
            setDetailError(null);
            try {
                const res = await run();
                if (!res?.data?.result)
                    throw new Error(res?.data?.message || 'Unable to save progression item.');
                if (res.data?.data) setDetail(res.data.data);
                await loadTracks();
                return res.data?.data ?? null;
            } catch (e: any) {
                setDetailError(
                    e?.response?.data?.message || e?.message || 'Unable to save progression item.',
                );
                throw e;
            } finally {
                setSaving(null);
            }
        },
        [loadTracks],
    );

    const saveItem = useCallback(
        (kind: ItemKind, payload: Record<string, any>, id?: number) => {
            if (!detail?.id) return Promise.resolve(null);
            const url = id
                ? `/progression/${detail.id}/items/${id}`
                : `/progression/${detail.id}/items`;
            return mutate(`${kind}:${id ?? 'new'}`, () =>
                id ? api.patch(url, { kind, ...payload }) : api.post(url, { kind, ...payload }),
            );
        },
        [detail?.id, mutate],
    );
    const deleteItem = useCallback(
        (kind: ItemKind, id: number) =>
            detail?.id
                ? mutate(`${kind}:delete:${id}`, () =>
                      api.delete(`/progression/${detail.id}/items/${id}`, { data: { kind } }),
                  )
                : Promise.resolve(null),
        [detail?.id, mutate],
    );
    const saveSettings = useCallback(
        (payload: Settings) =>
            detail?.id
                ? mutate('settings', () => api.patch(`/progression/${detail.id}/settings`, payload))
                : Promise.resolve(null),
        [detail?.id, mutate],
    );

    const selected = useMemo(
        () =>
            partnerId
                ? tracks.find((t) => Number(t.partner_id ?? t.profile.id) === partnerId) || null
                : null,
        [tracks, partnerId],
    );
    if (loading && !tracks.length && !error)
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <Loader2 className="animate-spin text-primary size-12" />
            </div>
        );

    return (
        <div className="flex-1 flex flex-col h-full min-h-0 bg-slate-50">
            <header className="h-auto md:h-20 shrink-0 flex flex-col md:flex-row items-start md:items-center justify-between px-4 md:px-8 py-4 bg-white border-b border-slate-200 sticky top-0 z-10 gap-3">
                <div className="flex items-center gap-4">
                    {selected && (
                        <button
                            onClick={() => {
                                setPartnerId(null);
                                setDetail(null);
                            }}
                            className="p-2 rounded-full hover:bg-slate-100 text-slate-500"
                        >
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold text-slate-900">
                            {selected
                                ? t('progression.relationshipJourney')
                                : t('progression.title')}
                        </h2>
                        <p className="text-xs md:text-sm text-slate-500">
                            {selected
                                ? t('progression.managingConnection', {
                                      name: selected.profile.name,
                                  })
                                : t('progression.subtitle')}
                        </p>
                    </div>
                </div>
                {!selected && (
                    <button
                        onClick={() => onNavigate?.('discovery')}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold"
                    >
                        <CalendarDays size={16} /> {t('progression.discoverNewMatches')}
                    </button>
                )}
            </header>
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-6xl mx-auto">
                    {error && (
                        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}
                    {selected ? (
                        <DetailView
                            track={selected}
                            detail={detail}
                            loading={detailLoading}
                            error={detailError}
                            saving={saving}
                            onSaveItem={saveItem}
                            onDeleteItem={deleteItem}
                            onSaveSettings={saveSettings}
                        />
                    ) : (
                        <Dashboard
                            tracks={tracks}
                            loading={loading}
                            onSelect={(id) => setPartnerId(id)}
                            onStart={() => onNavigate?.('discovery')}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

type DetailProps = {
    track: Track;
    detail: Detail | null;
    loading: boolean;
    error: string | null;
    saving: string | null;
    onSaveItem: (kind: ItemKind, payload: Record<string, any>, id?: number) => Promise<any>;
    onDeleteItem: (kind: ItemKind, id: number) => Promise<any>;
    onSaveSettings: (payload: Settings) => Promise<any>;
};

const DetailView: React.FC<DetailProps> = ({
    track,
    detail,
    loading,
    error,
    saving,
    onSaveItem,
    onDeleteItem,
    onSaveSettings,
}) => {
    const { t } = useTranslation();
    const [tab, setTab] = useState<'overview' | 'schedule' | 'planning'>('overview');
    const [checklist, setChecklist] = useState('');
    const [checkOrder, setCheckOrder] = useState('1');
    const [note, setNote] = useState('');
    const [venue, setVenue] = useState(emptyVenue());
    const [budget, setBudget] = useState(emptyBudget());
    const [event, setEvent] = useState(emptyEvent());
    const [settings, setSettings] = useState<Settings>(defaultSettings);

    useEffect(() => {
        setSettings(detail?.settings || defaultSettings);
        setChecklist('');
        setCheckOrder('1');
        setNote('');
        setVenue(emptyVenue());
        setBudget(emptyBudget());
        setEvent(emptyEvent());
    }, [detail?.id]);
    useEffect(() => {
        setSettings(detail?.settings || defaultSettings);
    }, [detail?.settings]);

    const stageSlug = detail?.stage?.slug || track.stage;
    const stageName = detail?.stage?.name || track.stageLabel;
    const checklistItems = detail?.checklist_items || [];
    const notes = detail?.family_notes || [];
    const venues = detail?.venues || [];
    const budgetItems = detail?.budget?.items || [];
    const events = detail?.events || [];
    const summary = detail?.summary || {
        checklist_total: 0,
        checklist_completed: 0,
        notes_count: 0,
        venues_count: 0,
        events_count: 0,
    };

    const saveChecklist = async () => {
        if (!checklist.trim()) return;
        await onSaveItem('checklist', {
            title: checklist.trim(),
            sort_order: num(checkOrder) ?? checklistItems.length + 1,
        });
        setChecklist('');
        setCheckOrder('1');
    };
    const saveNote = async () => {
        if (!note.trim()) return;
        await onSaveItem('note', { note: note.trim() });
        setNote('');
    };
    const saveVenue = async () => {
        if (!venue.name.trim()) return;
        await onSaveItem('venue', {
            name: venue.name.trim(),
            venue_type: venue.venue_type.trim() || undefined,
            estimated_cost: num(venue.estimated_cost),
            rating: num(venue.rating),
            status: venue.status,
            notes: venue.notes.trim() || undefined,
        });
        setVenue(emptyVenue());
    };
    const saveBudget = async () => {
        if (!budget.label.trim()) return;
        await onSaveItem('budget', {
            label: budget.label.trim(),
            amount: num(budget.amount) ?? 0,
            category: budget.category.trim() || undefined,
            status: budget.status,
            notes: budget.notes.trim() || undefined,
        });
        setBudget(emptyBudget());
    };
    const saveEvent = async () => {
        if (!event.title.trim() || !event.event_at) return;
        await onSaveItem('event', {
            title: event.title.trim(),
            event_at: new Date(event.event_at).toISOString(),
            location: event.location.trim() || undefined,
            status: event.status,
            notes: event.notes.trim() || undefined,
        });
        setEvent(emptyEvent());
    };

    return (
        <div className="animate-in fade-in slide-in-from-right-8 duration-300">
            <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8 flex flex-col md:flex-row items-center gap-6">
                <div
                    className={`size-24 rounded-full bg-cover bg-center shrink-0 border-4 border-slate-50 bg-slate-100 overflow-hidden ${track.profile.profilePhotoBlur && !isDefaultAvatar(track.profile.avatarUrl) ? 'scale-110 blur-2xl' : ''}`}
                    style={{
                        backgroundImage: `url(${track.profile.avatarUrl || '/assets/images/default-avatar.png'})`,
                    }}
                />
                <div className="flex-1 text-center md:text-left w-full">
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                        <h2 className="text-2xl font-bold text-slate-900">{track.profile.name}</h2>
                        <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-full border ${stageSlug === 'meeting' ? 'bg-blue-50 text-blue-700 border-blue-100' : stageSlug === 'courtship' ? 'bg-purple-50 text-purple-700 border-purple-100' : stageSlug === 'engaged' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-slate-50 text-slate-700 border-slate-100'}`}
                        >
                            {stageName}
                        </span>
                    </div>
                    <p className="text-slate-500 text-sm mb-4">
                        {track.profile.hospital || 'Hospital not set'}{' '}
                        <span className="mx-1">•</span>{' '}
                        {track.profile.location || 'Location not set'}
                    </p>
                    {loading && (
                        <p className="text-xs text-slate-400">{t('progression.refreshing')}</p>
                    )}
                    {error && <p className="text-xs text-red-600">{error}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                    <button className="p-3 bg-slate-100 rounded-full text-slate-600">
                        <Video size={20} />
                    </button>
                    <button className="p-3 bg-slate-100 rounded-full text-slate-600">
                        <Phone size={20} />
                    </button>
                    <button className="p-3 bg-slate-100 rounded-full text-slate-600">
                        <Mail size={20} />
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-1 bg-slate-200/50 p-1 rounded-xl w-full md:w-fit mb-8 overflow-x-auto">
                <button
                    onClick={() => setTab('overview')}
                    className={`px-6 py-2 rounded-lg text-sm font-bold whitespace-nowrap ${tab === 'overview' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                >
                    {t('progression.stageChecklists')}
                </button>
                <button
                    onClick={() => setTab('schedule')}
                    className={`px-6 py-2 rounded-lg text-sm font-bold whitespace-nowrap flex items-center gap-2 ${tab === 'schedule' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                >
                    <Calendar size={16} /> {t('progression.scheduling')}
                </button>
                <button
                    onClick={() => setTab('planning')}
                    disabled={stageSlug === 'chatting'}
                    className={`px-6 py-2 rounded-lg text-sm font-bold whitespace-nowrap flex items-center gap-2 ${tab === 'planning' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                >
                    <Store size={16} /> {t('progression.eventPlanning')}
                </button>
            </div>

            {tab === 'overview' && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <MiniStat
                                label={t('progression.stageChecklists')}
                                value={`${summary.checklist_completed}/${summary.checklist_total}`}
                            />
                            <MiniStat
                                label={t('progression.familyFeedback')}
                                value={String(summary.notes_count)}
                            />
                            <MiniStat
                                label={t('progression.venueShortlist')}
                                value={String(summary.venues_count)}
                            />
                            <MiniStat
                                label={t('progression.interactionLog')}
                                value={String(summary.events_count)}
                            />
                        </div>
                        <section className="bg-white rounded-xl border border-slate-200 p-6">
                            <div className="flex items-center justify-between gap-3 mb-4">
                                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                    <CheckCircle2 className="text-green-600" />{' '}
                                    {t('progression.currentTasks')}
                                </h3>
                                <button
                                    onClick={() => void saveChecklist()}
                                    disabled={!checklist.trim() || Boolean(saving)}
                                    className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white"
                                >
                                    <Save size={12} /> Add
                                </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-3 mb-4">
                                <input
                                    value={checklist}
                                    onChange={(e) => setChecklist(e.target.value)}
                                    placeholder="Task title"
                                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                                />
                                <input
                                    value={checkOrder}
                                    onChange={(e) => setCheckOrder(e.target.value)}
                                    type="number"
                                    min={1}
                                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                                />
                            </div>
                            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                {checklistItems.length ? (
                                    checklistItems.map((item) => (
                                        <div
                                            key={item.id}
                                            className="p-4 border-b border-slate-100 flex items-center justify-between gap-3"
                                        >
                                            <div className="flex items-start gap-3">
                                                <button
                                                    onClick={() =>
                                                        void onSaveItem(
                                                            'checklist',
                                                            {
                                                                title: item.title,
                                                                is_completed: !item.is_completed,
                                                                sort_order: item.sort_order,
                                                            },
                                                            item.id,
                                                        )
                                                    }
                                                    disabled={Boolean(saving)}
                                                    className={`size-5 rounded-full border flex items-center justify-center mt-0.5 ${item.is_completed ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300'}`}
                                                >
                                                    {item.is_completed && (
                                                        <Check size={12} strokeWidth={3} />
                                                    )}
                                                </button>
                                                <div>
                                                    <p
                                                        className={`text-sm font-medium ${item.is_completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}
                                                    >
                                                        {item.title}
                                                    </p>
                                                    <p className="text-[11px] text-slate-400">
                                                        Order {item.sort_order}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() =>
                                                    void onDeleteItem('checklist', item.id)
                                                }
                                                className="p-2 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="p-4 text-sm text-slate-500">
                                        No checklist items yet.
                                    </p>
                                )}
                            </div>
                        </section>
                        <section className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                            <div className="flex items-start gap-3">
                                <Users size={20} className="text-blue-600 mt-1" />
                                <div className="flex-1">
                                    <h4 className="font-bold text-blue-900 text-sm mb-3">
                                        {t('progression.familyFeedback')}
                                    </h4>
                                    <textarea
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        rows={4}
                                        placeholder="Add a family note"
                                        className="w-full rounded-xl border border-blue-200 px-4 py-3 text-sm bg-white"
                                    />
                                    <div className="flex items-center gap-2 mt-3">
                                        <button
                                            onClick={() => void saveNote()}
                                            disabled={!note.trim() || Boolean(saving)}
                                            className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white"
                                        >
                                            <Save size={12} /> Add note
                                        </button>
                                        <button
                                            onClick={() => setNote('')}
                                            className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-white"
                                        >
                                            Reset
                                        </button>
                                    </div>
                                    <div className="mt-4 space-y-3">
                                        {notes.length ? (
                                            notes.map((n) => (
                                                <div
                                                    key={n.id}
                                                    className="rounded-lg bg-white border border-blue-100 p-3 flex items-start justify-between gap-2"
                                                >
                                                    <p className="text-sm text-slate-700 whitespace-pre-line">
                                                        {n.note}
                                                    </p>
                                                    <button
                                                        onClick={() =>
                                                            void onDeleteItem('note', n.id)
                                                        }
                                                        className="p-1.5 rounded-md hover:bg-red-50 text-slate-500 hover:text-red-600"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-xs text-blue-700">
                                                No family feedback notes yet.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                    <div className="space-y-6">
                        <section className="bg-white rounded-xl border border-slate-200 p-6">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
                                <Clock className="text-orange-500" />{' '}
                                {t('progression.interactionLog')}
                            </h3>
                            <div className="space-y-6">
                                {events.length ? (
                                    events.map((e) => (
                                        <TimelineItem
                                            key={e.id}
                                            icon={<Calendar size={14} />}
                                            title={e.title || 'Event'}
                                            date={when(e.event_at)}
                                            desc={e.notes || e.location || 'Scheduled event'}
                                        />
                                    ))
                                ) : (
                                    <p className="text-xs text-slate-500">
                                        {t('progression.noInteractions')}
                                    </p>
                                )}
                            </div>
                        </section>
                        <section className="bg-white rounded-xl border border-slate-200 p-6">
                            <h3 className="font-bold text-slate-900 mb-4">Journey summary</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <MiniStat
                                    label="Checklist"
                                    value={`${summary.checklist_completed}/${summary.checklist_total}`}
                                />
                                <MiniStat label="Notes" value={String(summary.notes_count)} />
                                <MiniStat label="Venues" value={String(summary.venues_count)} />
                                <MiniStat label="Events" value={String(summary.events_count)} />
                            </div>
                        </section>
                    </div>
                </div>
            )}
            {tab === 'schedule' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-slate-900">
                                {t('progression.proposeMeetingTime')}
                            </h3>
                            <button className="text-xs font-bold text-slate-500 hover:text-primary flex items-center gap-1">
                                <ExternalLink size={12} /> {t('progression.syncGoogleCal')}
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input
                                value={event.title}
                                onChange={(e) => setEvent((p) => ({ ...p, title: e.target.value }))}
                                placeholder="Event title"
                                className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
                            />
                            <input
                                value={event.event_at}
                                onChange={(e) =>
                                    setEvent((p) => ({ ...p, event_at: e.target.value }))
                                }
                                type="datetime-local"
                                className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
                            />
                            <input
                                value={event.location}
                                onChange={(e) =>
                                    setEvent((p) => ({ ...p, location: e.target.value }))
                                }
                                placeholder="Location"
                                className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
                            />
                            <select
                                value={event.status}
                                onChange={(e) =>
                                    setEvent((p) => ({
                                        ...p,
                                        status: e.target.value as EventForm['status'],
                                    }))
                                }
                                className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
                            >
                                <option value="scheduled">Scheduled</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                            <textarea
                                value={event.notes}
                                onChange={(e) => setEvent((p) => ({ ...p, notes: e.target.value }))}
                                rows={3}
                                placeholder="Event notes"
                                className="md:col-span-2 rounded-xl border border-slate-200 px-4 py-3 text-sm"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => void saveEvent()}
                                disabled={!event.title.trim() || !event.event_at || Boolean(saving)}
                                className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white"
                            >
                                <Save size={14} /> Add event
                            </button>
                            <button
                                onClick={() => setEvent(emptyEvent())}
                                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
                            >
                                <RotateCcw size={14} /> Reset
                            </button>
                        </div>
                        <div className="space-y-3">
                            {events.length ? (
                                events.map((e) => (
                                    <div
                                        key={e.id}
                                        className="flex items-start justify-between p-4 border border-slate-200 rounded-xl gap-4"
                                    >
                                        <div>
                                            <p className="font-bold text-slate-900 text-sm">
                                                {e.title || 'Scheduled Event'}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {when(e.event_at)}
                                            </p>
                                            {e.location && (
                                                <p className="text-xs text-slate-400">
                                                    {e.location}
                                                </p>
                                            )}
                                            {e.notes && (
                                                <p className="text-xs text-slate-500 mt-1 whitespace-pre-line">
                                                    {e.notes}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`text-[10px] font-bold px-2 py-1 rounded-full ${e.status === 'completed' ? 'bg-green-100 text-green-700' : e.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}
                                            >
                                                {e.status}
                                            </span>
                                            <button
                                                onClick={() => void onDeleteItem('event', e.id)}
                                                className="p-2 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
                                    No events scheduled yet.
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="space-y-6">
                        <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
                            <h3 className="font-bold text-slate-900">
                                {t('progression.availabilitySettings')}
                            </h3>
                            <label className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl border border-slate-100">
                                <span className="text-sm text-slate-700">
                                    {t('progression.shareCalendarBusy')}
                                </span>
                                <input
                                    type="checkbox"
                                    className="accent-primary"
                                    checked={settings.share_calendar_busy}
                                    onChange={(e) =>
                                        setSettings((p) => ({
                                            ...p,
                                            share_calendar_busy: e.target.checked,
                                        }))
                                    }
                                />
                            </label>
                            <label className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl border border-slate-100">
                                <span className="text-sm text-slate-700">
                                    {t('progression.autoDetectTimezone')}
                                </span>
                                <input
                                    type="checkbox"
                                    className="accent-primary"
                                    checked={settings.auto_detect_timezone}
                                    onChange={(e) =>
                                        setSettings((p) => ({
                                            ...p,
                                            auto_detect_timezone: e.target.checked,
                                        }))
                                    }
                                />
                            </label>
                            <input
                                value={settings.timezone || ''}
                                onChange={(e) =>
                                    setSettings((p) => ({ ...p, timezone: e.target.value }))
                                }
                                placeholder="Timezone"
                                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                            />
                            <input
                                value={settings.budget_target ?? ''}
                                onChange={(e) =>
                                    setSettings((p) => ({
                                        ...p,
                                        budget_target: e.target.value.trim()
                                            ? Number(e.target.value)
                                            : null,
                                    }))
                                }
                                type="number"
                                min={0}
                                placeholder="Budget target"
                                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                            />
                            <button
                                onClick={() => void onSaveSettings(settings)}
                                disabled={Boolean(saving)}
                                className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white"
                            >
                                {saving === 'settings' ? 'Saving...' : 'Save settings'}
                            </button>
                        </section>
                        <section className="bg-white rounded-xl border border-slate-200 p-6">
                            <h3 className="font-bold text-slate-900 mb-4">
                                {t('progression.totalBudget')}
                            </h3>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-slate-500">{t('progression.spentEst')}</span>
                                <span className="font-bold text-green-600">
                                    {money(detail?.budget?.spent_estimate)}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-slate-500">Target</span>
                                <span className="font-bold text-slate-900">
                                    {money(detail?.budget?.target_budget)}
                                </span>
                            </div>
                            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden mt-3">
                                <div
                                    className="h-full bg-green-500"
                                    style={{
                                        width: detail?.budget?.target_budget
                                            ? `${Math.min(100, Math.round(((detail?.budget?.spent_estimate ?? 0) / detail.budget.target_budget) * 100))}%`
                                            : '0%',
                                    }}
                                />
                            </div>
                        </section>
                    </div>
                </div>
            )}

            {tab === 'planning' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <section className="bg-white rounded-xl border border-slate-200 p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                    <Store className="text-primary" size={18} />{' '}
                                    {t('progression.venueShortlist')}
                                </h3>
                                <button
                                    className="text-xs font-bold text-primary"
                                    onClick={() => setVenue(emptyVenue())}
                                >
                                    {t('progression.addVenue')}
                                </button>
                            </div>
                            <div className="space-y-3 mb-5">
                                <input
                                    value={venue.name}
                                    onChange={(e) =>
                                        setVenue((p) => ({ ...p, name: e.target.value }))
                                    }
                                    placeholder="Venue name"
                                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                                />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <input
                                        value={venue.venue_type}
                                        onChange={(e) =>
                                            setVenue((p) => ({ ...p, venue_type: e.target.value }))
                                        }
                                        placeholder="Venue type"
                                        className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
                                    />
                                    <select
                                        value={venue.status}
                                        onChange={(e) =>
                                            setVenue((p) => ({
                                                ...p,
                                                status: e.target.value as VenueForm['status'],
                                            }))
                                        }
                                        className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
                                    >
                                        <option value="shortlisted">Shortlisted</option>
                                        <option value="visited">Visited</option>
                                        <option value="confirmed">Confirmed</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                    <input
                                        value={venue.estimated_cost}
                                        onChange={(e) =>
                                            setVenue((p) => ({
                                                ...p,
                                                estimated_cost: e.target.value,
                                            }))
                                        }
                                        type="number"
                                        min={0}
                                        placeholder="Estimated cost"
                                        className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
                                    />
                                    <input
                                        value={venue.rating}
                                        onChange={(e) =>
                                            setVenue((p) => ({ ...p, rating: e.target.value }))
                                        }
                                        type="number"
                                        min={0}
                                        max={5}
                                        step={0.1}
                                        placeholder="Rating"
                                        className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
                                    />
                                </div>
                                <textarea
                                    value={venue.notes}
                                    onChange={(e) =>
                                        setVenue((p) => ({ ...p, notes: e.target.value }))
                                    }
                                    rows={3}
                                    placeholder="Venue notes"
                                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                                />
                                <button
                                    onClick={() => void saveVenue()}
                                    disabled={!venue.name.trim() || Boolean(saving)}
                                    className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white"
                                >
                                    <Save size={14} /> Add venue
                                </button>
                            </div>
                            <div className="space-y-4">
                                {venues.length ? (
                                    venues.map((v) => (
                                        <div
                                            key={v.id}
                                            className="flex items-start gap-4 p-3 border border-slate-200 rounded-lg"
                                        >
                                            <div
                                                className="size-16 bg-slate-200 rounded-md shrink-0 bg-cover bg-center"
                                                style={{
                                                    backgroundImage:
                                                        'url(https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=100&h=100)',
                                                }}
                                            />
                                            <div className="flex-1">
                                                <h5 className="font-bold text-slate-900 text-sm">
                                                    {v.name}
                                                </h5>
                                                <p className="text-xs text-slate-500">
                                                    {v.venue_type || 'Venue'} •{' '}
                                                    {money(v.estimated_cost)}
                                                </p>
                                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                    <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 rounded">
                                                        ★ {v.rating ?? 'N/A'}
                                                    </span>
                                                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 rounded">
                                                        {v.status}
                                                    </span>
                                                </div>
                                                {v.notes && (
                                                    <p className="text-xs text-slate-500 mt-2 whitespace-pre-line">
                                                        {v.notes}
                                                    </p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => void onDeleteItem('venue', v.id)}
                                                className="p-2 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-slate-500">
                                        No venues shortlisted yet.
                                    </p>
                                )}
                            </div>
                        </section>
                    </div>
                    <div className="space-y-6">
                        <section className="bg-white rounded-xl border border-slate-200 p-6">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
                                <Calculator className="text-green-600" size={18} />{' '}
                                {t('progression.budgetTracker')}
                            </h3>
                            <div className="bg-slate-50 p-4 rounded-xl mb-6">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-slate-500">
                                        {t('progression.totalBudget')}
                                    </span>
                                    <span className="font-bold text-slate-900">
                                        {money(detail?.budget?.target_budget)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-slate-500">
                                        {t('progression.spentEst')}
                                    </span>
                                    <span className="font-bold text-green-600">
                                        {money(detail?.budget?.spent_estimate)}
                                    </span>
                                </div>
                                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden mt-3">
                                    <div
                                        className="h-full bg-green-500"
                                        style={{
                                            width: detail?.budget?.target_budget
                                                ? `${Math.min(100, Math.round(((detail?.budget?.spent_estimate ?? 0) / detail.budget.target_budget) * 100))}%`
                                                : '0%',
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="space-y-3 mb-5">
                                <input
                                    value={budget.label}
                                    onChange={(e) =>
                                        setBudget((p) => ({ ...p, label: e.target.value }))
                                    }
                                    placeholder="Budget item"
                                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                                />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <input
                                        value={budget.amount}
                                        onChange={(e) =>
                                            setBudget((p) => ({ ...p, amount: e.target.value }))
                                        }
                                        type="number"
                                        min={0}
                                        placeholder="Amount"
                                        className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
                                    />
                                    <input
                                        value={budget.category}
                                        onChange={(e) =>
                                            setBudget((p) => ({ ...p, category: e.target.value }))
                                        }
                                        placeholder="Category"
                                        className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
                                    />
                                    <select
                                        value={budget.status}
                                        onChange={(e) =>
                                            setBudget((p) => ({
                                                ...p,
                                                status: e.target.value as BudgetForm['status'],
                                            }))
                                        }
                                        className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
                                    >
                                        <option value="planned">Planned</option>
                                        <option value="reserved">Reserved</option>
                                        <option value="spent">Spent</option>
                                        <option value="paid">Paid</option>
                                    </select>
                                </div>
                                <textarea
                                    value={budget.notes}
                                    onChange={(e) =>
                                        setBudget((p) => ({ ...p, notes: e.target.value }))
                                    }
                                    rows={3}
                                    placeholder="Budget notes"
                                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                                />
                                <button
                                    onClick={() => void saveBudget()}
                                    disabled={!budget.label.trim() || Boolean(saving)}
                                    className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white"
                                >
                                    <Save size={14} /> Add budget item
                                </button>
                            </div>
                            <div className="space-y-3">
                                {budgetItems.length ? (
                                    budgetItems.map((b) => (
                                        <div
                                            key={b.id}
                                            className="rounded-xl border border-slate-200 p-4 flex items-start justify-between gap-3"
                                        >
                                            <div>
                                                <p className="font-bold text-slate-900 text-sm">
                                                    {b.label}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {b.category || 'General'} • {money(b.amount)}
                                                </p>
                                                {b.notes && (
                                                    <p className="text-xs text-slate-500 mt-2 whitespace-pre-line">
                                                        {b.notes}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                                                    {b.status}
                                                </span>
                                                <button
                                                    onClick={() =>
                                                        void onDeleteItem('budget', b.id)
                                                    }
                                                    className="p-2 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-slate-500">No budget items yet.</p>
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            )}
        </div>
    );
};
const Dashboard: React.FC<{
    tracks: Track[];
    loading: boolean;
    onSelect: (id: number) => void;
    onStart: () => void;
}> = ({ tracks, loading, onSelect, onStart }) => {
    const { t } = useTranslation();
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card
                    tone="bg-blue-50 text-blue-600"
                    icon={<Calendar size={24} />}
                    title={`${tracks.filter((t) => t.stage === 'meeting').length} ${t('progression.meetings')}`}
                    description={t('progression.meetingsDesc')}
                />
                <Card
                    tone="bg-purple-50 text-purple-600"
                    icon={<Users size={24} />}
                    title={`${tracks.filter((t) => t.stage === 'chatting').length} ${t('progression.chatting')}`}
                    description={t('progression.chattingDesc')}
                />
                <Card
                    tone="bg-green-50 text-green-600"
                    icon={<HeartHandshake size={24} />}
                    title={`${tracks.filter((t) => ['courtship', 'engaged'].includes(t.stage)).length} ${t('progression.formal')}`}
                    description={t('progression.formalDesc')}
                />
            </div>
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900">
                    {t('progression.activeTracks')}
                </h3>
                <button
                    onClick={onStart}
                    className="text-sm font-bold text-primary hover:underline"
                >
                    {t('progression.startLooking')}
                </button>
            </div>
            {tracks.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200">
                    {loading ? (
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="animate-spin text-primary size-10" />
                            <p className="text-slate-500">{t('progression.refreshing')}</p>
                        </div>
                    ) : (
                        <>
                            <p className="text-slate-500">{t('progression.noActiveTracks')}</p>
                            <button
                                onClick={onStart}
                                className="mt-4 text-primary font-bold hover:underline"
                            >
                                {t('progression.discoverNewMatches')}
                            </button>
                        </>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {tracks.map((track) => (
                        <button
                            key={track.id}
                            onClick={() => onSelect(Number(track.partner_id ?? track.profile.id))}
                            className="text-left bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all"
                        >
                            <div className="h-24 bg-gradient-to-r from-slate-100 to-slate-200 relative">
                                <div
                                    className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold border ${track.stage === 'meeting' ? 'bg-blue-50 text-blue-700 border-blue-100' : track.stage === 'courtship' ? 'bg-purple-50 text-purple-700 border-purple-100' : track.stage === 'engaged' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-slate-50 text-slate-700 border-slate-100'}`}
                                >
                                    {track.stageLabel}
                                </div>
                            </div>
                            <div className="px-6 pb-6 relative">
                                <div
                                    className={`size-20 rounded-full border-4 border-white bg-slate-300 -mt-10 mb-4 bg-cover bg-center shadow-md overflow-hidden ${track.profile.profilePhotoBlur && !isDefaultAvatar(track.profile.avatarUrl) ? 'scale-110 blur-2xl' : ''}`}
                                    style={{
                                        backgroundImage: `url(${track.profile.avatarUrl || '/assets/images/default-avatar.png'})`,
                                    }}
                                />
                                <h4 className="text-xl font-bold text-slate-900">
                                    {track.profile.name}
                                </h4>
                                <p className="text-sm text-slate-500 mb-4">
                                    {track.profile.specialty || 'Specialty not set'}
                                </p>
                                <div className="mb-4">
                                    <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                                        <span>{t('progression.stageProgress')}</span>
                                        <span>{track.progress}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary rounded-full"
                                            style={{ width: `${track.progress}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <div className="flex items-center gap-1">
                                        <Clock size={14} /> Last:{' '}
                                        {track.lastInteraction || 'Recently'}
                                    </div>
                                    <div className="flex items-center gap-1 font-bold">
                                        Next: {track.nextAction || 'Add the next milestone'}{' '}
                                        <ChevronRight size={14} />
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))}
                    <button
                        onClick={onStart}
                        className="border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-8 text-slate-400 hover:border-slate-300 hover:bg-slate-50 min-h-[200px]"
                    >
                        <div className="size-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                            <Plus size={24} />
                        </div>
                        <p className="font-bold text-sm">{t('progression.discoverNewMatches')}</p>
                    </button>
                </div>
            )}
        </div>
    );
};

const Card: React.FC<{
    tone: string;
    icon: React.ReactNode;
    title: string;
    description: string;
}> = ({ tone, icon, title, description }) => (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className={`size-12 rounded-full flex items-center justify-center ${tone}`}>
            {icon}
        </div>
        <div>
            <h4 className="font-bold text-slate-900 text-lg">{title}</h4>
            <p className="text-xs text-slate-500">{description}</p>
        </div>
    </div>
);

const MiniStat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-1 text-base font-bold text-slate-900">{value}</p>
    </div>
);

const TimelineItem: React.FC<{
    icon: React.ReactNode;
    title: string;
    date: string;
    desc: string;
}> = ({ icon, title, date, desc }) => (
    <div className="flex gap-4 relative z-10">
        <div className="size-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 shrink-0 shadow-sm">
            {icon}
        </div>
        <div>
            <div className="flex items-center gap-2">
                <h5 className="text-sm font-bold text-slate-900">{title}</h5>
                <span className="text-[10px] text-slate-400">{date}</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
        </div>
    </div>
);

export default ProgressionView;
