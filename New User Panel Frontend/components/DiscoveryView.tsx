import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Search, Sliders, MapPin, Heart, X, ChevronDown, Eye, EyeOff, Map as MapIcon, 
  Grid, Zap, Star, Plane, Filter, ArrowUpDown, Bell, Crown, UserCheck, Send, Loader2, MessageSquare, Clock, CheckCircle2, Camera, Bookmark, Sparkles
} from 'lucide-react';
import ProfileDetailModal from './ProfileDetailModal';
import MatchTunerModal from './MatchTunerModal';
import LanguageToggle from './LanguageToggle';
import { ProfileMatch } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { STAGGER_CONTAINER, FADE_UP_ITEM, BTN_TAP } from '../utils/motion';
import { api } from '../utils/api';

// API base URL for assets
const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'https://api.doctormarriagebureau.com.pk';
const DEFAULT_AVATAR = `${API_BASE}/assets/img/avatar-place.png`;
const DEFAULT_FEMALE_AVATAR = `${API_BASE}/assets/img/female-avatar-place.png`;

interface DiscoveryViewProps {
    onSendProposal: (profile: ProfileMatch) => void;
    initialTab?: 'all' | 'agent' | 'intent';
    isIdentityVerified?: boolean | null;
    onRequireVerification?: () => void;
    onNavigate?: (view: string) => void;
    unreadNotifCount?: number;
}

const normalizeProfile = (profile: any): ProfileMatch => {
  const fullName = profile.name || [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim();
  const gender = profile.gender;
  const fallbackAvatar = gender === 2 ? DEFAULT_FEMALE_AVATAR : DEFAULT_AVATAR;
  let avatarUrl = profile.avatarUrl ?? profile.photo ?? '';
  // If avatarUrl is empty, numeric, or doesn't look like a URL, use fallback
  if (!avatarUrl || avatarUrl === '' || (!avatarUrl.startsWith('http') && !avatarUrl.startsWith('/'))) {
    avatarUrl = fallbackAvatar;
  }

  return {
    id: String(profile.id ?? profile.user_id ?? profile.code ?? ''),
    name: fullName,
    specialty: profile.specialty ?? profile.designation ?? '',
    hospital: profile.hospital ?? profile.company ?? '',
    location: profile.location ?? profile.country ?? '',
    age: profile.age ?? 0,
    matchPercentage: profile.matchPercentage ?? profile.match_percentage ?? 0,
    avatarUrl,
    isVerified: profile.isVerified ?? profile.approved ?? false,
    isAgentPick: profile.isAgentPick ?? profile.is_agent_pick ?? false,
    isHighIntent: profile.isHighIntent ?? profile.is_high_intent ?? false,
    coverGradient: profile.coverGradient,
    bio: profile.bio,
    tags: profile.tags,
    education: profile.education,
    career: profile.career,
    matchReasons: profile.matchReasons ?? profile.match_reasons,
    isOnline: profile.isOnline ?? profile.is_online,
    intelligence: profile.intelligence,
    educations: profile.educations,
    careers: profile.careers,
    interestStatus: profile.interest_status ?? profile.interestStatus,
    interestText: profile.interest_text ?? profile.interestText,
  };
};

type DiscoveryFilters = {
  familyApprovedOnly: boolean;
  ageMin: string;
  ageMax: string;
  religion: string;
  profession: string;
};

const DEFAULT_FILTERS: DiscoveryFilters = {
  familyApprovedOnly: false,
  ageMin: '',
  ageMax: '',
  religion: '',
  profession: ''
};

const DiscoveryView: React.FC<DiscoveryViewProps> = ({ onSendProposal, initialTab = 'all', isIdentityVerified, onRequireVerification, onNavigate, unreadNotifCount = 0 }) => {
  const { t } = useTranslation();
  const [showFilters, setShowFilters] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isTravelMode, setIsTravelMode] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [selectedProfile, setSelectedProfile] = useState<ProfileMatch | null>(null);
  const [showTuner, setShowTuner] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'agent' | 'intent'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ProfileMatch[]>([]);
  const [filters, setFilters] = useState<DiscoveryFilters>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<DiscoveryFilters>(DEFAULT_FILTERS);
  const [photoRequesting, setPhotoRequesting] = useState<Record<string, boolean>>({});
  const [photoRequested, setPhotoRequested] = useState<Record<string, boolean>>({});
  const [shortlistProcessing, setShortlistProcessing] = useState<Record<string, boolean>>({});
  const [shortlisted, setShortlisted] = useState<Record<string, boolean>>({});
  const [superLikeProcessing, setSuperLikeProcessing] = useState<Record<string, boolean>>({});
  const [superLiked, setSuperLiked] = useState<Record<string, boolean>>({});
  const [profiles, setProfiles] = useState<{
      agent_picks: ProfileMatch[],
      high_intent: ProfileMatch[],
      recently_active: ProfileMatch[]
  }>({
      agent_picks: [],
      high_intent: [],
      recently_active: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDiscoveryData = async () => {
        setLoading(true);
        try {
            const response = await api.get('/discovery');
            if (response.data.result) {
                const data = response.data.data || {};
                const normalized = {
                    agent_picks: (data.agent_picks || []).map(normalizeProfile),
                    high_intent: (data.high_intent || []).map(normalizeProfile),
                    recently_active: (data.recently_active || []).map(normalizeProfile)
                };
                setProfiles(normalized);

                // Pre-populate sent-interest state from API data
                const allProfiles = [...normalized.agent_picks, ...normalized.high_intent, ...normalized.recently_active];
                const alreadySent: Record<string, boolean> = {};
                const alreadyShortlisted: Record<string, boolean> = {};
                allProfiles.forEach(p => {
                  if (p.interestStatus === 0 || p.interestStatus === 'do_response') {
                    alreadySent[p.id] = true;
                  }
                });
                setSuperLiked(prev => ({ ...prev, ...alreadySent }));
                setShortlisted(prev => ({ ...prev, ...alreadyShortlisted }));
            }
        } catch (error) {
            console.error('Failed to fetch discovery profiles', error);
        } finally {
            setLoading(false);
        }
    };
    fetchDiscoveryData();
  }, []);

  const fetchSearchResults = async (query: string, filterSet: DiscoveryFilters) => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (query) params.q = query;
      if (filterSet.ageMin) params.age_min = filterSet.ageMin;
      if (filterSet.ageMax) params.age_max = filterSet.ageMax;
      if (filterSet.religion) params.religion = filterSet.religion;
      if (filterSet.profession) params.profession = filterSet.profession;

      const response = await api.get('/discovery/search', { params });
      const results = response.data?.data || [];
      const normalized = results.map(normalizeProfile);
      setSearchResults(normalized);

      // Pre-populate sent-interest state from search results
      const alreadySent: Record<string, boolean> = {};
      normalized.forEach((p: ProfileMatch) => {
        if (p.interestStatus === 0 || p.interestStatus === 'do_response') {
          alreadySent[p.id] = true;
        }
      });
      setSuperLiked(prev => ({ ...prev, ...alreadySent }));
    } catch (error) {
      console.error('Failed to search discovery profiles', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const query = searchQuery.trim();
    const hasFilters = appliedFilters.familyApprovedOnly ||
      appliedFilters.ageMin !== '' ||
      appliedFilters.ageMax !== '' ||
      appliedFilters.religion.trim() !== '' ||
      appliedFilters.profession.trim() !== '';

    if (!query && !hasFilters) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      fetchSearchResults(query, appliedFilters);
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, appliedFilters]);

  const handleApplyFilters = () => {
    setAppliedFilters({
      familyApprovedOnly: filters.familyApprovedOnly,
      ageMin: filters.ageMin,
      ageMax: filters.ageMax,
      religion: filters.religion.trim(),
      profession: filters.profession.trim()
    });
    setShowFilters(false);
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
  };

  // Verification gate: intercept all profile actions if not verified
  const requireVerification = () => {
    if (isIdentityVerified === false) {
      onRequireVerification?.();
      return true; // blocked
    }
    return false; // allowed
  };

  const handleRequestPhotoAccess = async (profile: ProfileMatch) => {
    if (requireVerification()) return;
    const profileId = String(profile.id || '');
    if (!profileId || photoRequesting[profileId] || photoRequested[profileId]) return;

    try {
      setPhotoRequesting((prev) => ({ ...prev, [profileId]: true }));
      await api.post('/member/profile-picture-view-request', { id: profileId });
      setPhotoRequested((prev) => ({ ...prev, [profileId]: true }));
    } catch (error) {
      console.error('Failed to request photo access', error);
    } finally {
      setPhotoRequesting((prev) => ({ ...prev, [profileId]: false }));
    }
  };

  const handleShortlist = async (profile: ProfileMatch) => {
    if (requireVerification()) return;
    const profileId = String(profile.id || '');
    if (!profileId || shortlistProcessing[profileId] || shortlisted[profileId]) return;

    try {
      setShortlistProcessing((prev) => ({ ...prev, [profileId]: true }));
      await api.post('/member/add-to-shortlist', { user_id: profileId });
      setShortlisted((prev) => ({ ...prev, [profileId]: true }));
    } catch (error) {
      console.error('Failed to shortlist profile', error);
    } finally {
      setShortlistProcessing((prev) => ({ ...prev, [profileId]: false }));
    }
  };

  const handleSuperLike = async (profile: ProfileMatch) => {
    if (requireVerification()) return;
    const profileId = String(profile.id || '');
    if (!profileId || superLikeProcessing[profileId] || superLiked[profileId]) return;

    try {
      setSuperLikeProcessing((prev) => ({ ...prev, [profileId]: true }));
      await api.post('/member/express-interest', { user_id: profileId });
      setSuperLiked((prev) => ({ ...prev, [profileId]: true }));
    } catch (error) {
      console.error('Failed to send super like', error);
    } finally {
      setSuperLikeProcessing((prev) => ({ ...prev, [profileId]: false }));
    }
  };

  const getDisplayedProfiles = () => {
    if (activeTab === 'agent') return profiles.agent_picks;
    if (activeTab === 'intent') return profiles.high_intent;
    return profiles.recently_active;
  };

  const filtersActive = appliedFilters.familyApprovedOnly ||
    appliedFilters.ageMin !== '' ||
    appliedFilters.ageMax !== '' ||
    appliedFilters.religion.trim() !== '' ||
    appliedFilters.profession.trim() !== '';
  const isSearchActive = searchQuery.trim().length > 0 || filtersActive;
  const baseProfiles = isSearchActive ? searchResults : getDisplayedProfiles();
  const displayedProfiles = appliedFilters.familyApprovedOnly
    ? baseProfiles.filter((profile) => profile.isVerified)
    : baseProfiles;

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-slate-50 relative">
      
      {/* Top Search & Controls Bar */}
      <div className="h-auto md:h-18 bg-white border-b border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between px-4 md:px-6 py-3 shrink-0 z-30 shadow-sm gap-4">
         {/* Search Input */}
         <div className="flex-1 md:max-w-xl relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
                type="text" 
                placeholder={t('discovery.searchPlaceholder')} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all"
            />
         </div>

         {/* Actions */}
         <div className="flex items-center gap-2 md:gap-3 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
             <motion.button 
                whileTap={BTN_TAP}
                onClick={() => setShowTuner(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-md whitespace-nowrap"
             >
                <Sliders size={14} /> {t('discovery.matchTuner')}
             </motion.button>

             {/* Travel Mode */}
             <motion.button 
                whileTap={BTN_TAP}
                onClick={() => setIsTravelMode(!isTravelMode)}
                className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-bold transition-all border whitespace-nowrap ${isTravelMode ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
             >
                <Plane size={16} />
                <span className="hidden xl:inline">{t('discovery.travelMode')}</span>
             </motion.button>

             {/* Anonymous Toggle */}
             <motion.button 
                whileTap={BTN_TAP}
                onClick={() => setIsAnonymous(!isAnonymous)}
                className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-bold transition-all border whitespace-nowrap ${isAnonymous ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                title={t('discovery.browseAnonymouslyTitle')}
             >
                {isAnonymous ? <EyeOff size={16} /> : <Eye size={16} />}
                <span className="hidden xl:inline">{isAnonymous ? t('discovery.anonymous') : t('discovery.visible')}</span>
             </motion.button>

             <div className="h-6 w-px bg-slate-200 mx-1 hidden md:block"></div>

             {/* Language Toggle */}
             <div className="hidden md:block">
               <LanguageToggle compact />
             </div>

             {/* Notifications */}
             <button 
                onClick={() => onNavigate?.('notifications')}
                className="p-2 text-slate-500 hover:text-primary transition-colors relative hidden md:block"
                title={t('discovery.notifications')}
             >
                <Bell size={20} />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 border-2 border-white">
                    {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
                  </span>
                )}
             </button>
         </div>
      </div>

      {/* Toolbar / Subheader */}
      <div className="h-auto py-2 md:py-0 md:h-14 bg-white border-b border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between px-4 md:px-6 shrink-0 z-20 gap-3">
         <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide">
            <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold border transition-colors whitespace-nowrap ${showFilters ? 'bg-primary/5 border-primary text-primary' : 'border-slate-300 text-slate-700 hover:border-slate-400'}`}
            >
                <Filter size={16} />
                {t('discovery.filters')}
                {showFilters ? <ChevronDown size={16} className="rotate-180 transition-transform" /> : <ChevronDown size={16} className="transition-transform" />}
            </button>
            
            {/* Discovery Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-lg shrink-0">
                <TabButton label={t('discovery.allProfiles')} active={activeTab === 'all'} onClick={() => setActiveTab('all')} />
                <TabButton label={t('discovery.matchmakerPicks')} active={activeTab === 'agent'} onClick={() => setActiveTab('agent')} icon={<UserCheck size={14} />} />
                <TabButton label={t('discovery.highIntent')} active={activeTab === 'intent'} onClick={() => setActiveTab('intent')} icon={<Crown size={14} />} />
            </div>
         </div>

         <div className="flex items-center justify-between md:justify-end gap-4">
             <div className="flex items-center gap-1 text-sm font-medium text-slate-600 cursor-pointer hover:text-slate-900">
                <ArrowUpDown size={14} />
                <span>{t('discovery.sortRelevance')}</span>
             </div>
             
             <div className="flex bg-slate-100 p-1 rounded-lg">
                <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Grid size={16} />
                </button>
                <button 
                    onClick={() => setViewMode('map')}
                    className={`p-1.5 rounded-md transition-all ${viewMode === 'map' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <MapIcon size={16} />
                </button>
             </div>
         </div>
      </div>

      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        {/* Filters Panel (Slide Over) */}
        <div className={`absolute left-0 top-0 bottom-0 w-full sm:w-72 bg-white border-r border-slate-200 shadow-lg z-[5] transition-transform duration-300 ease-in-out ${showFilters ? 'translate-x-0' : '-translate-x-full'}`}>
             <div className="h-full flex flex-col p-6 overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-900">{t('discovery.advancedFilters')}</h3>
                    <button onClick={() => setShowFilters(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
                </div>
                
                <div className="space-y-6">
                    <FilterGroup label={t('discovery.specialFilter')}>
                        <label className="flex items-center gap-2 p-2 rounded-lg bg-purple-50 border border-purple-100 cursor-pointer">
                            <input
                                type="checkbox"
                                className="accent-purple-600"
                                checked={filters.familyApprovedOnly}
                                onChange={(e) => setFilters({ ...filters, familyApprovedOnly: e.target.checked })}
                            />
                            <span className="text-sm font-bold text-purple-900">{t('discovery.familyApprovedOnly')}</span>
                        </label>
                    </FilterGroup>

                    <FilterGroup label={t('discovery.ageRange')}>
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="number"
                                min={18}
                                max={80}
                                placeholder={t('discovery.min')}
                                value={filters.ageMin}
                                onChange={(e) => setFilters({ ...filters, ageMin: e.target.value })}
                                className="w-full text-sm p-2 border border-slate-200 rounded-md focus:outline-none focus:border-primary"
                            />
                            <input
                                type="number"
                                min={18}
                                max={80}
                                placeholder={t('discovery.max')}
                                value={filters.ageMax}
                                onChange={(e) => setFilters({ ...filters, ageMax: e.target.value })}
                                className="w-full text-sm p-2 border border-slate-200 rounded-md focus:outline-none focus:border-primary"
                            />
                        </div>
                    </FilterGroup>

                    <FilterGroup label={t('discovery.locationRadius')}>
                        <div className="flex items-center gap-2 mb-2">
                            <input type="checkbox" className="accent-primary" />
                            <span className="text-sm text-slate-700">{t('discovery.nearMe')}</span>
                        </div>
                         <div className="flex items-center gap-2">
                            <input type="checkbox" className="accent-primary" defaultChecked />
                            <span className="text-sm text-slate-700">{t('discovery.anywhereInPakistan')}</span>
                        </div>
                    </FilterGroup>

                    <FilterGroup label={t('discovery.sectCaste')}>
                         <input
                            type="text"
                            placeholder={t('discovery.sectCastePlaceholder')}
                            value={filters.religion}
                            onChange={(e) => setFilters({ ...filters, religion: e.target.value })}
                            className="w-full text-sm p-2 border border-slate-200 rounded-md focus:outline-none focus:border-primary"
                         />
                    </FilterGroup>

                    <FilterGroup label={t('discovery.profession')}>
                         <div className="flex flex-wrap gap-2">
                            {['Doctor', 'Surgeon', 'Dentist', 'Medical Student'].map(p => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setFilters({ ...filters, profession: p })}
                                    className={`px-2 py-1 text-xs rounded border transition-colors ${
                                        filters.profession === p
                                        ? 'bg-primary/10 text-primary border-primary/40'
                                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:border-slate-300'
                                    }`}
                                >
                                    {p}
                                </button>
                            ))}
                         </div>
                         <input
                            type="text"
                            placeholder={t('discovery.customProfession')}
                            value={filters.profession}
                            onChange={(e) => setFilters({ ...filters, profession: e.target.value })}
                            className="w-full text-sm p-2 border border-slate-200 rounded-md focus:outline-none focus:border-primary mt-3"
                         />
                    </FilterGroup>
                </div>

                <div className="mt-auto pt-6 border-t border-slate-100">
                    <button
                        onClick={handleApplyFilters}
                        className="w-full bg-primary text-white py-2.5 rounded-lg font-bold text-sm hover:bg-primary-hover shadow-lg shadow-primary/20"
                    >
                        {t('discovery.applyFilters')}
                    </button>
                    <button
                        onClick={handleResetFilters}
                        className="w-full text-slate-500 py-2.5 text-xs font-bold mt-2 hover:text-slate-700"
                    >
                        {t('discovery.resetAll')}
                    </button>
                </div>
             </div>
        </div>

        {/* Content Area */}
        <div className={`flex-1 overflow-y-auto p-4 md:p-6 transition-all duration-300 ${showFilters ? 'sm:ml-72' : ''} scrollbar-hide`}>
            
            {loading ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                    <Loader2 className="animate-spin text-primary" size={48} />
                    <p className="text-slate-500 font-medium">{t('discovery.findingMatches')}</p>
                </div>
            ) : (
                <>
                    {/* Top Picks / Header */}
                    {!isSearchActive && activeTab === 'all' && (
                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Star size={18} className="text-yellow-500 fill-yellow-500" /> 
                            {t('discovery.matchmakerPicks')}
                        </h3>
                        <motion.div 
                            className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
                            variants={STAGGER_CONTAINER}
                            initial="hidden"
                            animate="visible"
                        >
                            {profiles.agent_picks.map(profile => (
                                <motion.div 
                                    variants={FADE_UP_ITEM}
                                    key={profile.id} 
                                    onClick={() => setSelectedProfile(profile)}
                                    className="min-w-[280px] bg-white rounded-xl p-3 border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex gap-3 items-center"
                                >
                                    <div className="size-16 rounded-full bg-cover bg-center shrink-0" style={{backgroundImage: `url(${profile.avatarUrl})`}}></div>
                                    <div>
                                        <h4 className="font-bold text-slate-900">{profile.name}</h4>
                                        <p className="text-xs text-slate-500">{profile.specialty}</p>
                                        <span className="text-xs font-bold text-primary mt-1 block">{profile.matchPercentage}% {t('discovery.match')}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
            )}

            {/* Main Grid */}
            <div>
                 <h3 className="text-lg font-bold text-slate-900 mb-4">
                 {isSearchActive 
                        ? (searchQuery.trim()
                            ? t('discovery.searchResultsFor', { query: searchQuery.trim() })
                            : t('discovery.filteredResults'))
                        : activeTab === 'agent' ? t('discovery.matchmakerRecommendations') : activeTab === 'intent' ? t('discovery.highIntentProfiles') : t('discovery.exploreProfiles')
                    }
                 </h3>
                 {viewMode === 'grid' ? (
                     <motion.div 
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                        variants={STAGGER_CONTAINER}
                        initial="hidden"
                        animate="visible"
                        key={activeTab} // Forces re-animation when tab changes
                     >
                        <AnimatePresence mode="popLayout">
                            {displayedProfiles.map(profile => (
                                <motion.div key={profile.id} variants={FADE_UP_ITEM} layout>
                                    <ProfileGridCard 
                                        profile={profile} 
                                        onClick={() => setSelectedProfile(profile)}
                                        onProposal={() => { if (!requireVerification()) onSendProposal(profile); }}
                                        onRequestPhoto={() => handleRequestPhotoAccess(profile)}
                                        requestingPhoto={photoRequesting[profile.id]}
                                        requestedPhoto={photoRequested[profile.id]}
                                        onSuperLike={() => handleSuperLike(profile)}
                                        superLiked={superLiked[profile.id]}
                                        superLikeProcessing={superLikeProcessing[profile.id]}
                                        onLike={() => handleShortlist(profile)}
                                        liked={shortlisted[profile.id]}
                                        shortlistProcessing={shortlistProcessing[profile.id]}
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                     </motion.div>
                 ) : (
                     <div className="h-96 bg-slate-200 rounded-xl flex items-center justify-center text-slate-500 border border-slate-300">
                        <div className="text-center">
                            <MapIcon size={48} className="mx-auto mb-2 opacity-50" />
                            <p className="font-bold">{t('discovery.mapViewPlaceholder')}</p>
                            <p className="text-xs">{t('discovery.locationDiscovery')}</p>
                        </div>
                     </div>
                 )}
            </div>

            {/* Similar Profiles Strip (Bottom) */}
             <div className="mt-12 pt-8 border-t border-slate-200">
                 <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">{t('discovery.peopleAlsoViewed')}</h3>
                 <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide opacity-70 hover:opacity-100 transition-opacity">
                      {[1,2,3,4,5].map(i => (
                          <div key={i} className="size-12 rounded-full bg-slate-300 shrink-0"></div>
                      ))}
                 </div>
             </div>
             </>
            )}
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {selectedProfile && (
            <ProfileDetailModal 
              profile={selectedProfile} 
              onClose={() => setSelectedProfile(null)}
              onSendProposal={(p) => { if (!requireVerification()) onSendProposal(p); }}
              onNavigate={onNavigate}
            />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showTuner && (
            <MatchTunerModal onClose={() => setShowTuner(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

const FilterGroup: React.FC<{label: string, children: React.ReactNode}> = ({ label, children }) => (
    <div>
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-2">{label}</h4>
        {children}
    </div>
);

const TabButton: React.FC<{label: string, active: boolean, onClick: () => void, icon?: React.ReactNode}> = ({ label, active, onClick, icon }) => (
    <button 
        onClick={onClick}
        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${active ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
    >
        {icon} {label}
    </button>
);

const ProfileGridCard: React.FC<{
    profile: ProfileMatch;
    onClick: () => void;
    onProposal: () => void;
    onRequestPhoto: () => void;
    requestingPhoto?: boolean;
    requestedPhoto?: boolean;
    onSuperLike: () => void;
    superLiked?: boolean;
    superLikeProcessing?: boolean;
    onLike: () => void;
    liked?: boolean;
    shortlistProcessing?: boolean;
}> = ({ profile, onClick, onProposal, onRequestPhoto, requestingPhoto, requestedPhoto, onSuperLike, superLiked, superLikeProcessing, onLike, liked, shortlistProcessing }) => {
    const { t } = useTranslation();
    return (
        <div 
            className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group relative cursor-pointer"
        >
            {/* Compatibility Overlay (Hover) */}
            <div className="absolute top-2 right-2 z-20 flex flex-col gap-1 items-end pointer-events-none">
                 <div className="bg-white/90 backdrop-blur-md rounded-full px-2 py-1 text-xs font-bold text-primary shadow-sm flex items-center gap-1">
                    <Zap size={12} fill="currentColor" />
                    {profile.matchPercentage}%
                 </div>
                 {profile.isAgentPick && (
                     <div className="bg-purple-600/90 text-white backdrop-blur-md rounded-full px-2 py-1 text-[10px] font-bold shadow-sm flex items-center gap-1">
                        <UserCheck size={10} /> {t('discovery.pick')}
                     </div>
                 )}
            </div>

            <div className="aspect-[4/5] bg-slate-200 relative" onClick={onClick}>
                <img 
                    src={profile.avatarUrl || DEFAULT_AVATAR} 
                    alt={profile.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_AVATAR; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>
                
                <div className="absolute bottom-0 left-0 p-4 w-full text-white">
                    <h3 className="font-bold text-lg leading-tight">{profile.name}</h3>
                    <div className="flex items-center gap-1 text-xs opacity-90 mt-1">
                        <span className="bg-white/20 px-1.5 py-0.5 rounded backdrop-blur-sm">{profile.age}</span>
                        <span>-</span>
                        <span>{profile.specialty}</span>
                    </div>
                </div>
            </div>
            
            <div className="p-3 flex justify-between items-center bg-white">
                <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                    <MapPin size={12} />
                    {profile.location}
                </div>
                {/* Interactions Row */}
                <div className="flex gap-1.5">
                     <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={BTN_TAP}
                        onClick={(e) => { e.stopPropagation(); onRequestPhoto(); }}
                        disabled={requestingPhoto || requestedPhoto}
                        className={`p-1.5 rounded-full bg-slate-50 transition-colors ${
                            requestedPhoto ? 'text-primary bg-primary/10' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200'
                        }`}
                        title={requestedPhoto ? t('discovery.photoAccessRequested') : t('discovery.requestPhotoAccess')}
                     >
                        {requestingPhoto ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                     </motion.button>
                     {(() => {
                        const status = profile.interestStatus;
                        const text = (profile.interestText || '').toLowerCase();
                        const isAccepted = text.includes('accepted');
                        // Mutual match / accepted
                        if ((status === 0 || status === '0') && isAccepted) {
                          return (
                            <div className="p-1.5 rounded-full bg-emerald-50 text-emerald-600 flex items-center gap-1" title={t('discovery.chatNow')}>
                              <MessageSquare size={14} />
                              <span className="text-[10px] font-bold pr-1">{t('discovery.chatNow')}</span>
                            </div>
                          );
                        }
                        // I sent interest, pending
                        if (superLiked || status === 0 || status === '0') {
                          return (
                            <div className="p-1.5 rounded-full bg-amber-50 text-amber-600 flex items-center gap-1" title={t('discovery.pendingResponse')}>
                              <Clock size={14} />
                              <span className="text-[10px] font-bold pr-1">{t('discovery.proposalSent')}</span>
                            </div>
                          );
                        }
                        // They sent me interest, accepted
                        if (status === 'do_response' && isAccepted) {
                          return (
                            <div className="p-1.5 rounded-full bg-emerald-50 text-emerald-600 flex items-center gap-1" title={t('discovery.chatNow')}>
                              <MessageSquare size={14} />
                              <span className="text-[10px] font-bold pr-1">{t('discovery.chatNow')}</span>
                            </div>
                          );
                        }
                        // They sent me interest, pending response
                        if (status === 'do_response') {
                          return (
                            <div className="p-1.5 rounded-full bg-blue-50 text-blue-600 flex items-center gap-1" title={t('discovery.respondToInterest')}>
                              <Heart size={14} />
                              <span className="text-[10px] font-bold pr-1">{t('discovery.respondToInterest')}</span>
                            </div>
                          );
                        }
                        // No interest — show send buttons
                        return (
                          <>
                            <motion.button 
                              whileHover={{ scale: 1.1 }}
                              whileTap={BTN_TAP}
                              onClick={(e) => { e.stopPropagation(); onProposal(); }}
                              className="p-1.5 rounded-full bg-slate-50 text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors"
                              title={t('discovery.sendProposal')}
                            >
                              <Send size={16} />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={BTN_TAP}
                              onClick={(e) => { e.stopPropagation(); onSuperLike(); }}
                              disabled={superLikeProcessing}
                              className={`p-1.5 rounded-full bg-slate-50 transition-colors ${
                                  superLiked ? 'text-yellow-500 bg-yellow-50' : 'text-slate-400 hover:text-yellow-500 hover:bg-yellow-50'
                              }`}
                              title={t('discovery.expressInterest')}
                            >
                              {superLikeProcessing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                            </motion.button>
                          </>
                        );
                     })()}
                     <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={BTN_TAP}
                        onClick={(e) => { e.stopPropagation(); onLike(); }}
                        disabled={shortlistProcessing}
                        className={`p-1.5 rounded-full bg-slate-50 transition-colors ${
                            liked ? 'text-red-500 bg-red-50' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'
                        }`}
                        title={t('discovery.like')}
                    >
                        {shortlistProcessing ? <Loader2 size={16} className="animate-spin" /> : <Bookmark size={16} />}
                     </motion.button>
                </div>
            </div>
        </div>
    );
}

export default DiscoveryView;
