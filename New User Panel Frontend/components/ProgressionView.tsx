import React, { useState, useEffect } from 'react';
import { 
    Calendar, CheckCircle2, Clock, MapPin, DollarSign, Store, ChevronRight, 
    Video, Phone, Users, HeartHandshake, PartyPopper, ArrowLeft, CalendarDays,
    Plus, Mail, Check, ExternalLink, Calculator, ShoppingBag, Loader2
} from 'lucide-react';
import { api } from '../utils/api';
import { useTranslation } from 'react-i18next';

interface Track {
    id: string;
    profile: {
        id: number;
        name: string;
        avatarUrl: string | null;
        specialty: string;
        hospital: string;
        location: string;
    };
    stage: string;
    stageLabel: string;
    lastInteraction: string;
    nextAction: string;
    progress: number;
}

const ProgressionView: React.FC = () => {
    const { t } = useTranslation();
    const [tracks, setTracks] = useState<Track[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
    const [progressionDetail, setProgressionDetail] = useState<any | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    useEffect(() => {
        fetchTracks();
    }, []);

    const fetchTracks = async () => {
        try {
            setLoading(true);
            const response = await api.get('/progression/active');
            if (response.data.result) {
                setTracks(response.data.tracks);
            }
        } catch (error) {
            console.error('Failed to fetch progressions:', error);
        } finally {
            setLoading(false);
        }
    };

    const selectedTrack = tracks.find(t => t.id === selectedTrackId);

    useEffect(() => {
        if (!selectedTrackId || !selectedTrack?.profile?.id) {
            setProgressionDetail(null);
            return;
        }

        const fetchDetail = async () => {
            try {
                setDetailLoading(true);
                const response = await api.get(`/progression/${selectedTrack.profile.id}`);
                if (response.data?.result) {
                    setProgressionDetail(response.data?.data ?? null);
                }
            } catch (error) {
                console.error('Failed to fetch progression detail:', error);
            } finally {
                setDetailLoading(false);
            }
        };

        fetchDetail();
    }, [selectedTrackId, selectedTrack?.profile?.id]);

    if (loading && tracks.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
                <Loader2 className="animate-spin text-primary size-12 mb-4" />
                <p className="text-slate-500 font-medium">Loading your journey...</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full min-h-0 bg-slate-50 relative">
            {/* Header */}
            <header className="h-auto md:h-20 shrink-0 flex flex-col md:flex-row items-start md:items-center justify-between px-4 md:px-8 py-4 bg-white border-b border-slate-200 sticky top-0 z-10 gap-3">
                <div className="flex items-center gap-4">
                    {selectedTrackId && (
                        <button 
                            onClick={() => setSelectedTrackId(null)}
                            className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold text-slate-900">
                            {selectedTrackId ? t('progression.relationshipJourney') : t('progression.title')}
                        </h2>
                        <p className="text-xs md:text-sm text-slate-500">
                            {selectedTrackId ? t('progression.managingConnection', { name: selectedTrack?.profile.name }) : t('progression.subtitle')}
                        </p>
                    </div>
                </div>

                {!selectedTrackId && (
                    <button 
                        onClick={() => {
                            // Generate ICS calendar file for upcoming meetings
                            if (tracks.length === 0) {
                                alert(t('progression.noActiveSync'));
                                return;
                            }
                            
                            // Create ICS content
                            const icsEvents = tracks.map(track => {
                                const eventDate = new Date();
                                eventDate.setDate(eventDate.getDate() + 7); // Default to 1 week from now
                                const formatDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
                                
                                return `BEGIN:VEVENT
DTSTART:${formatDate(eventDate)}
DTEND:${formatDate(new Date(eventDate.getTime() + 60*60*1000))}
SUMMARY:Follow up with ${track.profile.name}
DESCRIPTION:Next action: ${track.nextAction}\\nStage: ${track.stageLabel}
LOCATION:${track.profile.location || 'TBD'}
END:VEVENT`;
                            }).join('\n');
                            
                            const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Doctors Marriage Bureau//Calendar//EN
${icsEvents}
END:VCALENDAR`;
                            
                            // Download as .ics file
                            const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'dmb-meetings.ics';
                            a.click();
                            URL.revokeObjectURL(url);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold shadow-md hover:bg-slate-800 w-full md:w-auto justify-center"
                    >
                        <CalendarDays size={16} /> {t('progression.syncCalendar')}
                    </button>
                )}
            </header>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-hide">
                <div className="max-w-6xl mx-auto">
                    {selectedTrackId && selectedTrack ? (
                        <RelationshipDetail track={selectedTrack} detail={progressionDetail} loading={detailLoading} />
                    ) : (
                        <PipelineDashboard tracks={tracks} onSelect={(id) => setSelectedTrackId(id)} />
                    )}
                </div>
            </div>
        </div>
    );
};

/* --- Sub-Views --- */

const PipelineDashboard: React.FC<{tracks: Track[], onSelect: (id: string) => void}> = ({ tracks, onSelect }) => {
    const { t } = useTranslation();
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            {/* Quick Stats - Dynamically calculated */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="size-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Calendar size={24} />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 text-lg">
                            {tracks.filter(t => t.stage === 'meeting').length} {t('progression.meetings')}
                        </h4>
                        <p className="text-xs text-slate-500">{t('progression.meetingsDesc')}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="size-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                        <Users size={24} />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 text-lg">
                            {tracks.filter(t => t.stage === 'chatting').length} {t('progression.chatting')}
                        </h4>
                        <p className="text-xs text-slate-500">{t('progression.chattingDesc')}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="size-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                        <HeartHandshake size={24} />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 text-lg">
                            {tracks.filter(t => t.stage === 'courtship' || t.stage === 'engaged').length} {t('progression.formal')}
                        </h4>
                        <p className="text-xs text-slate-500">{t('progression.formalDesc')}</p>
                    </div>
                </div>
            </div>

            {/* Stages Grid */}
            <div>
                <h3 className="text-lg font-bold text-slate-900 mb-6">{t('progression.activeTracks')}</h3>
                {tracks.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200">
                        <p className="text-slate-500">{t('progression.noActiveTracks')}</p>
                        <button className="mt-4 text-primary font-bold hover:underline">{t('progression.startLooking')}</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {tracks.map(track => (
                            <div 
                                key={track.id}
                                onClick={() => onSelect(track.id)}
                                className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                            >
                                <div className="h-24 bg-gradient-to-r from-slate-100 to-slate-200 relative">
                                    <div className="absolute top-4 right-4 bg-white/50 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-slate-700">
                                        {track.stageLabel}
                                    </div>
                                </div>
                                <div className="px-6 pb-6 relative">
                                    <div className="size-20 rounded-full border-4 border-white bg-slate-300 -mt-10 mb-4 bg-cover bg-center shadow-md" style={{backgroundImage: `url(${track.profile.avatarUrl || '/assets/images/default-avatar.png'})`}}></div>
                                    
                                    <h4 className="text-xl font-bold text-slate-900">{track.profile.name}</h4>
                                    <p className="text-sm text-slate-500 mb-4">{track.profile.specialty}</p>

                                    {/* Progress Bar */}
                                    <div className="mb-4">
                                        <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                                            <span>{t('progression.stageProgress')}</span>
                                            <span>{track.progress}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{width: `${track.progress}%`}}></div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100 group-hover:bg-primary/5 group-hover:border-primary/20 group-hover:text-primary transition-colors">
                                        <div className="flex items-center gap-1">
                                            <Clock size={14} /> Last: {track.lastInteraction}
                                        </div>
                                        <div className="flex items-center gap-1 font-bold">
                                            Next: {track.nextAction} <ChevronRight size={14} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Discover New Matches */}
                        <div className="border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-8 text-slate-400 hover:border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer min-h-[200px]">
                            <div className="size-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                                <Plus size={24} />
                            </div>
                            <p className="font-bold text-sm">{t('progression.discoverNewMatches')}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const RelationshipDetail: React.FC<{track: Track; detail: any | null; loading: boolean}> = ({ track, detail, loading }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'planning'>('overview');
    const stageLabel = detail?.stage?.name ?? track.stageLabel;
    const stageSlug = detail?.stage?.slug ?? track.stage;
    const events = detail?.events ?? [];

    return (
        <div className="animate-in fade-in slide-in-from-right-8 duration-300">
            {/* Top Info Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8 flex flex-col md:flex-row items-center gap-6">
                 <div className="size-24 rounded-full bg-cover bg-center shrink-0 border-4 border-slate-50" style={{backgroundImage: `url(${track.profile.avatarUrl})`}}></div>
                 <div className="flex-1 text-center md:text-left w-full">
                     <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                        <h2 className="text-2xl font-bold text-slate-900">{track.profile.name}</h2>
                        <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full border border-green-200">
                            {stageLabel}
                        </span>
                     </div>
                     <p className="text-slate-500 text-sm mb-4">{track.profile.hospital} • {track.profile.location}</p>
                     {loading && <p className="text-xs text-slate-400">{t('progression.refreshing')}</p>}
                     
                     {/* Stepper */}
                     <div className="flex items-center justify-between max-w-lg relative mx-auto md:mx-0">
                         <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -z-10"></div>
                         {[{key: 'chatting', label: t('progression.stageChatting')}, {key: 'meeting', label: t('progression.stageMeeting')}, {key: 'courtship', label: t('progression.stageCourtship')}, {key: 'engaged', label: t('progression.stageEngaged')}].map((s, i) => {
                             const isCompleted = ['chatting', 'meeting', 'courtship'].indexOf(String(stageSlug).toLowerCase()) >= i;
                             const isCurrent = String(stageSlug).toLowerCase() === s.key;
                             return (
                                 <div key={s.key} className="flex flex-col items-center gap-2 bg-slate-50 px-2">
                                     <div className={`size-3 rounded-full border-2 ${isCompleted ? 'bg-primary border-primary' : 'bg-white border-slate-300'}`}></div>
                                     <span className={`text-[10px] font-bold uppercase ${isCurrent ? 'text-primary' : 'text-slate-400'}`}>{s.label}</span>
                                 </div>
                             )
                         })}
                     </div>
                 </div>
                 <div className="flex gap-2 shrink-0">
                     <button className="p-3 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200 hover:text-primary transition-colors"><Video size={20} /></button>
                     <button className="p-3 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200 hover:text-primary transition-colors"><Phone size={20} /></button>
                     <button className="p-3 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200 hover:text-primary transition-colors"><Mail size={20} /></button>
                 </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 bg-slate-200/50 p-1 rounded-xl w-full md:w-fit mb-8 overflow-x-auto">
                <button 
                    onClick={() => setActiveTab('overview')}
                    className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'overview' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    {t('progression.stageChecklists')}
                </button>
                <button 
                    onClick={() => setActiveTab('schedule')}
                    className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'schedule' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Calendar size={16} /> {t('progression.scheduling')}
                </button>
                <button 
                    onClick={() => setActiveTab('planning')}
                    disabled={String(stageSlug).toLowerCase() === 'chatting'}
                    className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'planning' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed'}`}
                >
                    <Store size={16} /> {t('progression.eventPlanning')}
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && <OverviewTab events={events} />}
            {activeTab === 'schedule' && <ScheduleTab events={events} />}
            {activeTab === 'planning' && <PlanningTab />}
        </div>
    );
};

// ... (Helper components remain mostly the same, ensuring flex containers wrap if needed)
const OverviewTab: React.FC<{events: any[]}> = ({ events }) => {
    const { t } = useTranslation();
    return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in">
        <div className="space-y-6">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="text-green-600" /> {t('progression.currentTasks')}
            </h3>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <TaskItem label={t('progression.task.exchangeBiodata')} completed />
                <TaskItem label={t('progression.task.verifyEmployment')} completed />
                <TaskItem label={t('progression.task.firstFamilyCall')} completed />
                <TaskItem label={t('progression.task.familyDinner')} />
                <TaskItem label={t('progression.task.financialCompatibility')} />
                <TaskItem label={t('progression.task.relocationPlans')} />
            </div>

             <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 flex gap-3">
                 <div className="mt-1"><Users size={20} className="text-blue-600" /></div>
                 <div>
                     <h4 className="font-bold text-blue-900 text-sm">{t('progression.familyFeedback')}</h4>
                     <p className="text-xs text-blue-700 mt-1">
                         "Mother liked her polite demeanor. Father wants to double check the hospital reputation."
                     </p>
                     <button className="text-xs font-bold text-blue-600 mt-2 hover:underline">{t('progression.addNote')}</button>
                 </div>
             </div>
        </div>

        <div className="space-y-6">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Clock className="text-orange-500" /> {t('progression.interactionLog')}
            </h3>
            <div className="bg-white rounded-xl border border-slate-200 p-6 relative">
                 <div className="absolute top-6 bottom-6 left-6 w-0.5 bg-slate-100"></div>
                 <div className="space-y-6">
                     {events.length > 0 ? (
                         events.map((event: any) => {
                             const dateLabel = event.event_at ? new Date(event.event_at).toLocaleString() : 'Upcoming';
                             const desc = event.notes || event.location || 'Scheduled event';
                             return (
                                 <TimelineItem 
                                    key={event.id}
                                    icon={<Calendar size={14} />} 
                                    title={event.title || 'Event'} 
                                    date={dateLabel} 
                                    desc={desc} 
                                 />
                             );
                         })
                     ) : (
                         <p className="text-xs text-slate-500">{t('progression.noInteractions')}</p>
                     )}
                 </div>
            </div>
        </div>
    </div>
    );
};

const ScheduleTab: React.FC<{events: any[]}> = ({ events }) => {
    const { t } = useTranslation();
    return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
            {/* ... Content same as before ... */}
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-900">{t('progression.proposeMeetingTime')}</h3>
                <div className="flex gap-2">
                     <button className="text-xs font-bold text-slate-500 hover:text-primary flex items-center gap-1">
                         <ExternalLink size={12} /> {t('progression.syncGoogleCal')}
                     </button>
                </div>
            </div>

            {events.length > 0 ? (
                <div className="space-y-3">
                    {events.map((event: any) => {
                        const dateLabel = event.event_at ? new Date(event.event_at).toLocaleString() : 'Upcoming';
                        const status = event.status || 'scheduled';
                        const statusClass = status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : status === 'cancelled'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-yellow-100 text-yellow-700';

                        return (
                            <div key={event.id} className="flex items-start justify-between p-4 border border-slate-200 rounded-xl">
                                <div>
                                    <p className="font-bold text-slate-900 text-sm">{event.title || 'Scheduled Event'}</p>
                                    <p className="text-xs text-slate-500">{dateLabel}</p>
                                    {event.location && <p className="text-xs text-slate-400">{event.location}</p>}
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${statusClass}`}>{status}</span>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <>
                    {/* Mock Calendar Grid */}
                    <div className="grid grid-cols-7 gap-2 mb-6 text-center">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                            <div key={d} className="text-xs font-bold text-slate-400 uppercase pb-2">{d}</div>
                        ))}
                        {Array.from({length: 31}, (_, i) => i + 1).map(d => {
                            const isToday = d === 24;
                            const isSelected = d === 26;
                            return (
                                <div 
                                    key={d} 
                                    className={`
                                        h-12 rounded-lg flex items-center justify-center text-sm font-medium cursor-pointer transition-colors
                                        ${isToday ? 'bg-slate-100 text-slate-900' : ''}
                                        ${isSelected ? 'bg-primary text-white shadow-md' : 'hover:bg-slate-50'}
                                    `}
                                >
                                    {d}
                                </div>
                            )
                        })}
                    </div>

                    <div className="border-t border-slate-100 pt-6">
                        <h4 className="font-bold text-sm text-slate-900 mb-3">{t('progression.availableSlots')}</h4>
                        <div className="flex flex-wrap gap-3">
                            {['10:00 AM', '02:00 PM', '04:30 PM', '08:00 PM'].map(t => (
                                <button key={t} className="px-4 py-2 rounded-lg border border-slate-200 text-sm hover:border-primary hover:text-primary transition-colors">
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>

        <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
                 <h3 className="font-bold text-slate-900 mb-4">{t('progression.availabilitySettings')}</h3>
                 <div className="space-y-3">
                     <label className="flex items-center justify-between p-2 hover:bg-slate-50 rounded cursor-pointer">
                         <span className="text-sm text-slate-700">{t('progression.shareCalendarBusy')}</span>
                         <input type="checkbox" className="accent-primary" defaultChecked />
                     </label>
                     <label className="flex items-center justify-between p-2 hover:bg-slate-50 rounded cursor-pointer">
                         <span className="text-sm text-slate-700">{t('progression.autoDetectTimezone')}</span>
                         <input type="checkbox" className="accent-primary" defaultChecked />
                     </label>
                 </div>
            </div>
        </div>
    </div>
    );
};

const PlanningTab = () => {
    const { t } = useTranslation();
    return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in">
        <div className="space-y-6">
             <div className="bg-white rounded-xl border border-slate-200 p-6">
                 <div className="flex justify-between items-center mb-4">
                     <h3 className="font-bold text-slate-900 flex items-center gap-2">
                         <Store className="text-primary" size={18} /> {t('progression.venueShortlist')}
                     </h3>
                     <button className="text-xs font-bold text-primary">{t('progression.addVenue')}</button>
                 </div>
                 
                 <div className="space-y-4">
                     <VenueCard 
                        name="Pearl Continental, Lahore" 
                        type="Engagement Venue" 
                        cost="Rs. Rs. Rs. Rs." 
                        rating="4.8" 
                        status="Shortlisted"
                     />
                     <VenueCard 
                        name="Gymkhana Club" 
                        type="Family Lunch" 
                        cost="Rs. Rs." 
                        rating="4.5" 
                        status="Visited"
                     />
                 </div>
             </div>
        </div>

        <div className="space-y-6">
             <div className="bg-white rounded-xl border border-slate-200 p-6">
                 <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
                     <Calculator className="text-green-600" size={18} /> {t('progression.budgetTracker')}
                 </h3>
                 
                 <div className="bg-slate-50 p-4 rounded-xl mb-6">
                     <div className="flex justify-between text-sm mb-2">
                         <span className="text-slate-500">{t('progression.totalBudget')}</span>
                         <span className="font-bold text-slate-900">Rs. 1,500,000</span>
                     </div>
                     <div className="flex justify-between text-sm mb-2">
                         <span className="text-slate-500">{t('progression.spentEst')}</span>
                         <span className="font-bold text-green-600">Rs. 150,000</span>
                     </div>
                     <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden mt-3">
                         <div className="h-full bg-green-500 w-[10%]"></div>
                     </div>
                 </div>

                 <div className="space-y-3">
                     <BudgetItem label="Engagement Ring" amount="Rs. 120,000" />
                     <BudgetItem label="Venue Advance" amount="Rs. 30,000" />
                 </div>
             </div>
        </div>
    </div>
    );
};

const TaskItem: React.FC<{label: string, completed?: boolean}> = ({ label, completed }) => (
    <div className={`p-4 border-b border-slate-100 flex items-center gap-3 ${completed ? 'bg-slate-50' : 'bg-white'}`}>
        <div className={`size-5 rounded-full border flex items-center justify-center ${completed ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300'}`}>
            {completed && <Check size={12} strokeWidth={3} />}
        </div>
        <span className={`text-sm ${completed ? 'text-slate-400 line-through' : 'text-slate-700 font-medium'}`}>{label}</span>
    </div>
);

const TimelineItem: React.FC<{icon: React.ReactNode, title: string, date: string, desc: string}> = ({ icon, title, date, desc }) => (
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

const VenueCard: React.FC<{name: string, type: string, cost: string, rating: string, status: string}> = ({ name, type, cost, rating, status }) => (
    <div className="flex items-start gap-4 p-3 border border-slate-200 rounded-lg hover:border-primary/50 transition-colors cursor-pointer">
        <div className="size-16 bg-slate-200 rounded-md shrink-0 bg-cover bg-center" style={{backgroundImage: 'url(https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=100&h=100)'}}></div>
        <div className="flex-1">
            <h5 className="font-bold text-slate-900 text-sm">{name}</h5>
            <p className="text-xs text-slate-500">{type} • {cost}</p>
            <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 rounded flex items-center gap-1">★ {rating}</span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 rounded">{status}</span>
            </div>
        </div>
    </div>
);

const BudgetItem: React.FC<{label: string, amount: string}> = ({ label, amount }) => (
    <div className="flex justify-between items-center p-2 border-b border-slate-50 last:border-0">
        <span className="text-sm text-slate-600">{label}</span>
        <span className="text-sm font-bold text-slate-900">{amount}</span>
    </div>
);

export default ProgressionView;
