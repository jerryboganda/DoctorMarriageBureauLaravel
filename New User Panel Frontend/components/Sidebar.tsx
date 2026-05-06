import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Compass, UserCheck, Heart, MessageSquare, Globe, Bell, UserCircle, ShieldCheck, LogOut, HeartPulse, X, Camera, Loader2, ChevronDown, Gift, Wallet, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { BTN_TAP } from '../utils/motion';
import { api } from '../utils/api';
import { useAuthStore } from '../src/stores/authStore';
import { compressImage } from '../utils/compression';
import LanguageToggle from './LanguageToggle';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  dataSyncVersion?: number;
  onUpgrade?: () => void;
  onCloseMobile?: () => void;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'https://api.doctormarriagebureau.com.pk';
const DEFAULT_AVATAR = `${API_BASE}/assets/img/avatar-place.png`;

const resolveAvatarUrl = (value?: string | null): string => {
  const candidate = `${value ?? ''}`.trim();

  if (!candidate) return DEFAULT_AVATAR;
  if (candidate.startsWith('http://') || candidate.startsWith('https://')) return candidate;
  if (candidate.startsWith('//')) return `https:${candidate}`;
  if (candidate.startsWith('/')) return `${API_BASE}${candidate}`;

  return `${API_BASE}/${candidate.replace(/^\/+/, '')}`;
};

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, dataSyncVersion, onUpgrade, onCloseMobile }) => {
  const { user, setUser } = useAuthStore();
  const { t } = useTranslation();
  const [counts, setCounts] = useState({
    agentPicks: 0,
    proposals: 0,
    messages: 0,
    notifications: 0,
  });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const lastDiscoveryFetchAtRef = useRef(0);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const compressedFile = await compressImage(file);

      const formData = new FormData();
      formData.append('photo', compressedFile);
      const response = await api.post('/upload-profile-picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success || response.data.result) {
        const updatedUser = {
          ...user,
          avatar: response.data.data.photo_url,
          avatar_original: response.data.data.photo_url,
          photo_approved: !response.data.data.requires_approval
        };
        setUser(updatedUser as any);
        alert(response.data.message || t('nav.profilePictureUploadSuccess'));
      }
    } catch (error: any) {
      console.error("Avatar upload failed", error);
      alert(error.response?.data?.message || t('nav.profilePictureUploadFailed'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    let isActive = true;
    let isFetching = false;

    const fetchCounts = async () => {
      if (isFetching) return;
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return;
      }
      isFetching = true;

      try {
        const now = Date.now();
        const shouldFetchDiscovery = now - lastDiscoveryFetchAtRef.current > 120000;
        const discoveryTask = shouldFetchDiscovery ? api.get('/discovery') : Promise.resolve({ data: null });
        const results = await Promise.allSettled([
          discoveryTask,
          api.get('/member/interest-requests'),
          api.get('/member/chat-list'),
          api.get('/member/notifications/feed'),
        ]);

        if (!isActive) return;

        const discoveryRes = results[0].status === 'fulfilled' ? results[0].value : null;
        const interestsRes = results[1].status === 'fulfilled' ? results[1].value : null;
        const chatsRes = results[2].status === 'fulfilled' ? results[2].value : null;
        const notificationsRes = results[3].status === 'fulfilled' ? results[3].value : null;

        const agentPicks = discoveryRes?.data?.data?.agent_picks?.length;
        const proposals = interestsRes?.data?.meta?.total ?? interestsRes?.data?.data?.length ?? 0;
        const messages = (chatsRes?.data?.data ?? []).reduce((sum: number, thread: any) => {
          const count = Number(thread?.unseen_message_count ?? 0);
          return sum + (Number.isFinite(count) ? count : 0);
        }, 0);
        const notifications = notificationsRes?.data?.unread_count ?? 0;

        setCounts((prev) => ({
          agentPicks: Number.isFinite(agentPicks) ? Number(agentPicks) : prev.agentPicks,
          proposals,
          messages,
          notifications,
        }));
        if (discoveryRes?.data?.data) {
          lastDiscoveryFetchAtRef.current = now;
        }
      } finally {
        isFetching = false;
      }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') fetchCounts();
    };
    const onFocus = () => fetchCounts();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocus);

    return () => {
      isActive = false;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
    };
  }, [dataSyncVersion]);

  const avatarUrl = resolveAvatarUrl(user?.avatar_original || user?.avatar); // kept for potential future use

  // Scroll indicator state
  const navRef = useRef<HTMLElement>(null);
  const [showScrollHint, setShowScrollHint] = useState(false);

  const checkScroll = useCallback(() => {
    const el = navRef.current;
    if (!el) return;
    const hasMore = el.scrollHeight - el.scrollTop - el.clientHeight > 8;
    setShowScrollHint(hasMore);
  }, []);

  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll]);

  return (
    <aside className="w-[280px] h-full flex flex-col bg-white border-r border-slate-200 shrink-0 relative shadow-xl lg:shadow-none">
      <div className="h-20 flex items-center justify-between px-6 shrink-0">
        <motion.div whileTap={BTN_TAP} className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('dashboard')}>
          <img src="/logo-v2.png" alt={t('nav.logoAlt')} className="h-10 w-auto" />
        </motion.div>
        <button onClick={onCloseMobile} className="lg:hidden p-2 text-slate-400 hover:text-slate-600">
          <X size={24} />
        </button>
      </div>

      <nav ref={navRef} className="flex-1 flex flex-col px-4 gap-1 py-4 overflow-y-auto scrollbar-hide relative">
        <div className="space-y-1">
          <NavItem icon={<Compass size={20} />} label={t('nav.exploreProfiles')} active={currentView === 'discovery'} onClick={() => onNavigate('discovery')} />
          <NavItem icon={<UserCheck size={20} />} label={t('nav.matchmakerProposals')} active={currentView === 'agent_picks'} onClick={() => onNavigate('agent_picks')} badge={counts.agentPicks || undefined} />
          <NavItem icon={<Heart size={20} />} label={t('nav.proposals')} active={currentView === 'dashboard'} onClick={() => onNavigate('dashboard')} badge={counts.proposals || undefined} />
          <NavItem icon={<MessageSquare size={20} />} label={t('nav.messages')} active={currentView === 'messages'} onClick={() => onNavigate('messages')} badge={counts.messages || undefined} />
          <NavItem icon={<Bell size={20} />} label={t('nav.notifications')} active={currentView === 'notifications'} onClick={() => onNavigate('notifications')} badge={counts.notifications || undefined} />
          <NavItem icon={<UserCircle size={20} />} label={t('nav.myProfile')} active={currentView === 'profile'} onClick={() => onNavigate('profile')} />
        </div>

        <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-4">{t('nav.familySocial')}</p>
        <div className="space-y-1">
          <NavItem icon={<Globe size={20} />} label={t('nav.communities')} active={currentView === 'communities'} onClick={() => onNavigate('communities')} />
        </div>

        <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-4">{t('nav.referralHeader')}</p>
        <div className="space-y-1">
          <NavItem icon={<Wallet size={20} />} label={t('nav.wallet')} active={currentView === 'wallet'} onClick={() => onNavigate('wallet')} />
          <NavItem icon={<Gift size={20} />} label={t('nav.referralSystem')} sublabel={t('nav.referralSublabel')} active={currentView === 'referral'} onClick={() => onNavigate('referral')} />
        </div>

        <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-4">{t('nav.settingsHeader')}</p>
        <div className="space-y-1">
          <NavItem icon={<ShieldCheck size={20} />} label={t('nav.privacyTrust')} active={currentView === 'settings'} onClick={() => onNavigate('settings')} />
        </div>
      </nav>

      {/* Scroll down indicator */}
      {showScrollHint && (
        <div
          className="absolute left-0 right-0 flex justify-center pointer-events-none z-10"
          style={{ bottom: 'calc(0px + 5.5rem)' }}
        >
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center size-7 rounded-full bg-white/90 border border-slate-200 shadow-md pointer-events-auto cursor-pointer backdrop-blur-sm"
            onClick={() => navRef.current?.scrollBy({ top: 120, behavior: 'smooth' })}
          >
            <ChevronDown size={16} className="text-slate-500 animate-bounce" />
          </motion.div>
        </div>
      )}

      <div className="shrink-0 p-4 bg-white border-t border-slate-100 space-y-1">
        <LanguageToggle compact={false} className="w-full justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-amber-50 hover:text-amber-700 transition-all" />
        <button onClick={() => onNavigate('signout')} className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all w-full font-bold text-sm">
          <LogOut size={18} /> {t('nav.signOut')}
        </button>
      </div>
    </aside>
  );
};

const NavItem = ({ icon, label, sublabel, active, badge, onClick }: any) => (
  <motion.button
    onClick={onClick}
    whileHover={{ scale: 1.02, x: 4 }}
    whileTap={{ scale: 0.98 }}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${active ? 'bg-primary/5 text-primary' : 'text-slate-600 hover:bg-slate-50'}`}
  >
    <span className={active ? 'text-primary' : 'text-slate-400'}>{icon}</span>
    <span className="flex-1 text-left">{label}{sublabel && <span className="ml-1.5 text-[10px] font-semibold text-pink-600 bg-pink-100 px-2 py-0.5 rounded-full">{sublabel}</span>}</span>
    {badge && <span className="text-[10px] bg-primary text-white font-bold px-1.5 py-0.5 rounded-md">{badge}</span>}
  </motion.button>
);

export default Sidebar;
