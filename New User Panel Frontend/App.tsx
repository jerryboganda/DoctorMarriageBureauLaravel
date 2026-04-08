import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useTranslation } from 'react-i18next';
import Sidebar from './components/Sidebar';
import RightSidebar from './components/RightSidebar';
import ProfileCard from './components/ProfileCard';
import ProfileTeaser from './components/ProfileTeaser';
import SettingsView from './components/SettingsView';
import OnboardingModal from './components/OnboardingModal';
import VerificationModal from './components/VerificationModal';
import ProfileEditView from './components/ProfileEditView';
import DiscoveryView from './components/DiscoveryView';
import ProposalModal from './components/ProposalModal';
import DeclineModal from './components/DeclineModal';
import MessagesView from './components/MessagesView';
import SubscriptionModal from './components/SubscriptionModal';
import PaymentModal from './components/PaymentModal';
import FamilyPortalView from './components/FamilyPortalView';
import CommunityView from './components/CommunityView';
import ProgressionView from './components/ProgressionView';
import NotificationsView from './components/NotificationsView';
import AuthModal from './components/AuthModal';
import WelcomeScreen from './components/WelcomeScreen';
import LanguageToggle from './components/LanguageToggle';
import FloatingContactButton from './components/FloatingContactButton';
import ProfileDetailModal from './components/ProfileDetailModal';
import { Bell, Menu, Heart, Search, Send, Inbox, ArrowUpRight, ArrowDownLeft, Undo2 } from 'lucide-react';
import { ProfileMatch } from './types';
import { AnimatePresence, motion } from 'framer-motion';
import { PAGE_VARIANTS } from './utils/motion';
import { useAuthStore } from './src/stores/authStore';
import { api } from './utils/api';

type IncomingInterest = {
    interestId: number;
    status?: string;
    profile: ProfileMatch;
};

type CheckoutItem = {
    id: number;
    name: string;
    amount: number;
    type: 'package' | 'addon';
};

const App: React.FC = () => {
    const { isAuthenticated, isLoading, checkAuth, logout } = useAuthStore();
    const { t } = useTranslation();

    const [currentView, setCurrentView] = useState('discovery');
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [showVerificationPrompt, setShowVerificationPrompt] = useState(false);
    const [isIdentityVerified, setIsIdentityVerified] = useState<boolean | null>(null); // null = loading, true = verified/pending, false = not submitted
    const [showDeclineModal, setShowDeclineModal] = useState(false);
    const [proposalTarget, setProposalTarget] = useState<ProfileMatch | null>(null);
    const [incomingInterests, setIncomingInterests] = useState<IncomingInterest[]>([]);
    const [sentInterests, setSentInterests] = useState<IncomingInterest[]>([]);
    const [declineInterestId, setDeclineInterestId] = useState<number | null>(null);
    const [dashboardTab, setDashboardTab] = useState<'all' | 'compatible' | 'recent'>('all');
    const [proposalDirection, setProposalDirection] = useState<'received' | 'sent'>('received');
    const [selectedProposalProfile, setSelectedProposalProfile] = useState<ProfileMatch | null>(null);

    // Mobile Sidebar State
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Auth Modal State
    const [showAuthModal, setShowAuthModal] = useState(false);

    // Billing & Subscription State
    const [showSubscription, setShowSubscription] = useState(false);
    const [checkoutItem, setCheckoutItem] = useState<CheckoutItem | null>(null);
    const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);
    const [profileTargetSection, setProfileTargetSection] = useState<string | null>(null);
    const [unreadNotifCount, setUnreadNotifCount] = useState(0);

    useEffect(() => {
        checkAuth();
    }, []);

    // Handle back button navigation
    useEffect(() => {
        const handlePopState = (event: PopStateEvent) => {
            if (event.state?.view) {
                setCurrentView(event.state.view);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    const mapInterestRow = (item: any): IncomingInterest => {
        const interestId = Number(item.id);
        const baseScore = Number.isFinite(interestId) ? 75 + (interestId % 20) : 80;
        const ageValue = Number(item.age);
        const age = Number.isFinite(ageValue) ? ageValue : 0;
        return {
            interestId,
            status: item.status,
            profile: {
                id: String(item.user_id ?? ''),
                name: item.name ?? t('nav.defaultName'),
                specialty: item.religion ? `Religion: ${item.religion}` : t('nav.defaultName'),
                hospital: item.mothere_tongue ? `Mother Tongue: ${item.mothere_tongue}` : '',
                location: item.country ?? '',
                age,
                matchPercentage: baseScore,
                avatarUrl: item.photo ?? '',
                isVerified: false
            }
        };
    };

    const fetchNotificationCount = async () => {
        try {
            const response = await api.get('/member/notifications');
            const rawData = Array.isArray(response.data?.data) ? response.data.data : [];
            setUnreadNotifCount(rawData.filter((n: any) => n?.read_at === 'New').length);
        } catch (error) {
            console.error('Failed to fetch notification count', error);
        }
    };

    const fetchIncomingInterests = async () => {
        try {
            const response = await api.get('/member/interest-requests');
            const rows = response.data?.data || [];
            setIncomingInterests(rows.map(mapInterestRow));
        } catch (error) {
            console.error('Failed to fetch incoming interests', error);
        }
    };

    const fetchSentInterests = async () => {
        try {
            const response = await api.get('/member/my-interests');
            const rows = response.data?.data || [];
            setSentInterests(rows.map(mapInterestRow));
        } catch (error) {
            console.error('Failed to fetch sent interests', error);
        }
    };

    const handleWithdrawInterest = async (interestId?: number) => {
        if (!interestId) return;
        try {
            await api.post('/member/interest-withdraw', { interest_id: interestId });
            await fetchSentInterests();
        } catch (error) {
            console.error('Failed to withdraw interest', error);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchIncomingInterests();
            fetchSentInterests();
            fetchNotificationCount();

            // Check verification status
            const checkVerification = async () => {
                try {
                    const res = await api.get('/member/is-approved');
                    const hasSubmitted = !!res.data?.verification_info;
                    const isApproved = res.data?.is_approved == 1;
                    setIsIdentityVerified(hasSubmitted || isApproved);
                    return hasSubmitted || isApproved;
                } catch {
                    setIsIdentityVerified(false);
                    return false;
                }
            };

            // Auto-trigger onboarding if profile is incomplete
            const checkOnboarding = async () => {
                try {
                    const res = await api.get('/full-profile');
                    if (res.data?.result) {
                        const b = res.data.basics || {};
                        const hasName = !!(b.firstName && b.lastName);
                        const hasGender = !!b.gender;
                        const hasDob = !!b.dateOfBirth;
                        
                        // If server says onboarding is completed, OR all essential fields exist (legacy users), skip
                        if (b.onboardingCompleted || (hasName && hasGender && hasDob)) {
                            localStorage.setItem('dmb_onboarding_complete', 'true');
                            // If legacy user had fields but flag was false, mark it complete on server
                            if (!b.onboardingCompleted && hasName && hasGender && hasDob) {
                                api.post('/full-profile/update', { onboardingCompleted: true }).catch(() => {});
                            }
                            // Onboarding done — check verification and auto-show if needed
                            const verified = await checkVerification();
                            if (!verified) {
                                setShowVerificationPrompt(true);
                            }
                            return;
                        }
                        // Essential fields are missing — show onboarding
                        setShowOnboarding(true);
                    }
                } catch {
                    // Ignore — don't block the app
                }
            };
            checkOnboarding();
        }
    }, [isAuthenticated]);

    const handleSelectPlan = (id: number, name: string, amount: number) => {
        setShowSubscription(false);
        setCheckoutItem({ id, name, amount, type: 'package' });
    };

    const handleSelectAddon = (id: number, name: string, amount: number) => {
        setShowSubscription(false);
        setCheckoutItem({ id, name, amount, type: 'addon' });
    };

    const handleSignOut = async () => {
        await logout();
        setCurrentView('dashboard');
    }

    const handleAcceptInterest = async (interestId?: number) => {
        if (!interestId) return;
        try {
            await api.post('/member/interest-accept', { interest_id: interestId });
            await fetchIncomingInterests();
            await fetchSentInterests();
        } catch (error) {
            console.error('Failed to accept interest', error);
        }
    };

    const handleDeclineInterestClick = (interestId?: number) => {
        if (!interestId) return;
        setDeclineInterestId(interestId);
        setShowDeclineModal(true);
    };

    const handleNavigate = (view: string) => {
        if (view === 'signout') {
            handleSignOut();
        } else {
            setCurrentView(view);
            // Push state to browser history to enable back button
            window.history.pushState({ view }, '', window.location.pathname);
            // Refresh notification count when navigating away from notifications
            fetchNotificationCount();
        }
        setIsMobileMenuOpen(false); // Close mobile menu on navigate
    };

    if (isLoading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID_PLACEHOLDER"}>
                <AnimatePresence mode="wait">
                    <motion.div key="welcome" exit={{ opacity: 0 }}>
                        <WelcomeScreen onComplete={() => checkAuth()} />
                    </motion.div>
                </AnimatePresence>
            </GoogleOAuthProvider>
        );
    }

    return (
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID_PLACEHOLDER"}>
            <div className="flex h-screen w-full bg-background-light overflow-hidden">
                {/* Mobile Sidebar Overlay */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                    )}
                </AnimatePresence>

                {/* Sidebar - Fixed/Drawer on Mobile, Relative on Desktop */}
                <motion.div
                    className={`fixed inset-y-0 left-0 h-full lg:relative lg:translate-x-0 ${isMobileMenuOpen ? 'z-50' : 'z-0 pointer-events-none lg:pointer-events-auto lg:z-20'}`}
                    initial={false}
                    animate={{ x: isMobileMenuOpen ? 0 : '0%' }}
                >
                    <div className={`h-full transition-transform duration-300 pointer-events-auto ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                        <Sidebar
                            currentView={currentView}
                            onNavigate={handleNavigate}
                            onUpgrade={() => {
                                setShowSubscription(true);
                                setIsMobileMenuOpen(false);
                            }}
                            onCloseMobile={() => setIsMobileMenuOpen(false)}
                        />
                    </div>
                </motion.div>

                {/* Center Main Content */}
                <main className="flex-1 flex flex-col h-full min-h-0 min-w-0 relative">

                    {/* Mobile Header Toggle */}
                    <div className="lg:hidden h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0 z-30">
                        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-slate-600" aria-label={t('common.openMenu')}>
                            <Menu size={24} />
                        </button>
                        <img src="/logo-v2.png" alt={t('common.logoAlt')} className="h-8 w-auto" />
                        <div className="flex items-center gap-1">
                            <LanguageToggle compact className="text-slate-500" />
                            <button
                                onClick={() => { setCurrentView('notifications'); fetchNotificationCount(); }}
                                className="relative p-2 text-slate-600 hover:text-primary transition-colors"
                                aria-label={t('common.notifications')}
                            >
                                <Bell size={22} />
                                {unreadNotifCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-white">
                                        {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentView}
                            className="flex-1 flex flex-col min-h-0 min-w-0 w-full"
                            variants={PAGE_VARIANTS}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                        >
                            {currentView === 'dashboard' ? (
                                <>
                                    {/* Dashboard Header/Tabs */}
                                    <header className="h-auto py-4 lg:h-20 shrink-0 flex flex-col lg:flex-row items-start lg:items-center justify-between px-4 lg:px-8 bg-background-light/95 backdrop-blur-sm sticky top-0 z-10 gap-4">
                                        <div className="flex gap-1 bg-white p-1 rounded-full shadow-sm border border-slate-100 overflow-x-auto max-w-full scrollbar-hide">
                                            <motion.button 
                                                whileTap={{ scale: 0.95 }} 
                                                onClick={() => setDashboardTab('all')}
                                                className={`px-4 lg:px-6 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                                                    dashboardTab === 'all' 
                                                        ? 'bg-slate-900 text-white font-bold shadow-md' 
                                                        : 'text-slate-500 hover:text-slate-900'
                                                }`}
                                            >
                                                {t('dashboard.tabs.allProposals')}
                                            </motion.button>
                                            <motion.button 
                                                whileTap={{ scale: 0.95 }} 
                                                onClick={() => setDashboardTab('compatible')}
                                                className={`px-4 lg:px-6 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                                                    dashboardTab === 'compatible' 
                                                        ? 'bg-slate-900 text-white font-bold shadow-md' 
                                                        : 'text-slate-500 hover:text-slate-900'
                                                }`}
                                            >
                                                {t('dashboard.tabs.highCompatibility')}
                                            </motion.button>
                                            <motion.button 
                                                whileTap={{ scale: 0.95 }} 
                                                onClick={() => setDashboardTab('recent')}
                                                className={`px-4 lg:px-6 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                                                    dashboardTab === 'recent' 
                                                        ? 'bg-slate-900 text-white font-bold shadow-md' 
                                                        : 'text-slate-500 hover:text-slate-900'
                                                }`}
                                            >
                                                {t('dashboard.tabs.recent')}
                                            </motion.button>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {/* Sent / Received Toggle Switch */}
                                            <div className="flex bg-white p-1 rounded-full shadow-sm border border-slate-100">
                                                <motion.button
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => setProposalDirection('received')}
                                                    className={`flex items-center gap-1.5 px-3 lg:px-4 py-2 rounded-full text-xs lg:text-sm font-medium transition-colors whitespace-nowrap ${
                                                        proposalDirection === 'received'
                                                            ? 'bg-primary text-white font-bold shadow-md'
                                                            : 'text-slate-500 hover:text-slate-900'
                                                    }`}
                                                >
                                                    <ArrowDownLeft size={14} />
                                                    {t('dashboard.received')}
                                                    {incomingInterests.length > 0 && (
                                                        <span className={`ml-1 text-[10px] font-bold rounded-full size-5 flex items-center justify-center ${
                                                            proposalDirection === 'received' ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                                                        }`}>{incomingInterests.length}</span>
                                                    )}
                                                </motion.button>
                                                <motion.button
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => setProposalDirection('sent')}
                                                    className={`flex items-center gap-1.5 px-3 lg:px-4 py-2 rounded-full text-xs lg:text-sm font-medium transition-colors whitespace-nowrap ${
                                                        proposalDirection === 'sent'
                                                            ? 'bg-primary text-white font-bold shadow-md'
                                                            : 'text-slate-500 hover:text-slate-900'
                                                    }`}
                                                >
                                                    <ArrowUpRight size={14} />
                                                    {t('dashboard.sent')}
                                                    {sentInterests.length > 0 && (
                                                        <span className={`ml-1 text-[10px] font-bold rounded-full size-5 flex items-center justify-center ${
                                                            proposalDirection === 'sent' ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                                                        }`}>{sentInterests.length}</span>
                                                    )}
                                                </motion.button>
                                            </div>

                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => { setCurrentView('notifications'); fetchNotificationCount(); }}
                                                className="hidden lg:flex size-10 rounded-full items-center justify-center transition-colors shadow-sm border border-slate-100 relative bg-white text-slate-600 hover:text-primary"
                                            >
                                                <Bell size={20} />
                                                {unreadNotifCount > 0 && (
                                                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-white">
                                                        {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
                                                    </span>
                                                )}
                                            </motion.button>
                                        </div>
                                    </header>

                                    {/* Scrollable Content */}
                                    <div className="flex-1 overflow-y-auto px-4 lg:px-8 pb-8 pt-2">
                                        <div className="max-w-3xl mx-auto flex flex-col gap-4">
                                            {(() => {
                                                const isReceived = proposalDirection === 'received';
                                                const source = isReceived ? incomingInterests : sentInterests;
                                                let filtered = [...source];
                                                if (dashboardTab === 'compatible') {
                                                    filtered = filtered.sort((a, b) => 
                                                        (b.profile.matchPercentage || 0) - (a.profile.matchPercentage || 0)
                                                    );
                                                } else if (dashboardTab === 'recent') {
                                                    filtered = filtered.sort((a, b) => b.interestId - a.interestId);
                                                }
                                                
                                                if (filtered.length === 0) {
                                                    return (
                                                        <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-slate-100">
                                                            <div className="size-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                                {isReceived ? <Inbox className="text-slate-400" size={28} /> : <Send className="text-slate-400" size={28} />}
                                                            </div>
                                                            <h3 className="font-bold text-slate-900 text-lg mb-2">
                                                                {isReceived ? t('empty.noReceivedProposals') : t('empty.noSentProposals')}
                                                            </h3>
                                                            <p className="text-slate-500 text-sm">
                                                                {isReceived
                                                                    ? t('empty.noReceivedProposalsDesc')
                                                                    : t('empty.noSentProposalsDesc')}
                                                            </p>
                                                            {!isReceived && (
                                                                <motion.button
                                                                    whileTap={{ scale: 0.95 }}
                                                                    onClick={() => setCurrentView('discovery')}
                                                                    className="mt-4 px-6 py-2 bg-primary text-white rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
                                                                >
                                                                    {t('dashboard.exploreProfiles')}
                                                                </motion.button>
                                                            )}
                                                        </div>
                                                    );
                                                }
                                                
                                                return filtered.map((interest) => {
                                                    const statusText = interest.status || 'Pending';
                                                    const isApproved = statusText === 'Approved';
                                                    const isPending = statusText === 'Pending';

                                                    return (
                                                        <motion.div
                                                            key={interest.interestId}
                                                            className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow"
                                                            whileHover={{ scale: 1.005 }}
                                                        >
                                                            {/* Clickable profile area */}
                                                            <div
                                                                className="flex items-center gap-3 sm:gap-4 p-4 cursor-pointer active:bg-slate-50 transition-colors"
                                                                onClick={() => setSelectedProposalProfile(interest.profile)}
                                                            >
                                                                <div
                                                                    className="size-12 sm:size-14 rounded-full bg-cover bg-center shrink-0 border-2 border-white shadow-sm hover:ring-2 hover:ring-primary/40 transition-all"
                                                                    style={{ backgroundImage: `url('${interest.profile.avatarUrl || '/assets/img/avatar-place.png'}')` }}
                                                                />
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        <h4 className="font-bold text-slate-900 truncate hover:text-primary transition-colors">{interest.profile.name}</h4>
                                                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                                                            isApproved
                                                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                                        }`}>
                                                                            <span className={`size-1.5 rounded-full ${isApproved ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                                                            {isApproved ? t('dashboard.accepted') : t('dashboard.pending')}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 text-sm text-slate-500 mt-0.5">
                                                                        {interest.profile.age > 0 && <span>{interest.profile.age} {t('dashboard.yrs')}</span>}
                                                                        {interest.profile.age > 0 && interest.profile.location && <span>·</span>}
                                                                        {interest.profile.location && <span>{interest.profile.location}</span>}
                                                                    </div>
                                                                    {interest.profile.specialty && (
                                                                        <p className="text-xs text-slate-400 mt-0.5">{interest.profile.specialty}</p>
                                                                    )}
                                                                </div>
                                                                {/* Desktop action buttons */}
                                                                <div className="hidden sm:flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                                                                    {isReceived && isPending && (
                                                                        <>
                                                                            <motion.button
                                                                                whileTap={{ scale: 0.9 }}
                                                                                onClick={() => handleAcceptInterest(interest.interestId)}
                                                                                className="px-4 py-2 bg-primary text-white rounded-full text-xs font-bold hover:bg-primary/90 transition-colors"
                                                                            >
                                                                                {t('dashboard.accept')}
                                                                            </motion.button>
                                                                            <motion.button
                                                                                whileTap={{ scale: 0.9 }}
                                                                                onClick={() => handleDeclineInterestClick(interest.interestId)}
                                                                                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-full text-xs font-bold hover:bg-slate-200 transition-colors"
                                                                            >
                                                                                {t('dashboard.decline')}
                                                                            </motion.button>
                                                                        </>
                                                                    )}
                                                                    {!isReceived && isPending && (
                                                                        <motion.button
                                                                            whileTap={{ scale: 0.9 }}
                                                                            onClick={() => handleWithdrawInterest(interest.interestId)}
                                                                            className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 rounded-full text-xs font-bold hover:bg-red-100 transition-colors"
                                                                        >
                                                                            <Undo2 size={12} />
                                                                            {t('dashboard.withdraw')}
                                                                        </motion.button>
                                                                    )}
                                                                    {isApproved && (
                                                                        <motion.button
                                                                            whileTap={{ scale: 0.9 }}
                                                                            onClick={() => setCurrentView('messages')}
                                                                            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold hover:bg-emerald-100 transition-colors"
                                                                        >
                                                                            {t('dashboard.message')}
                                                                        </motion.button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {/* Mobile action buttons — full-width row below the card */}
                                                            <div className="flex sm:hidden items-center gap-2 px-4 pb-3 pt-0">
                                                                {isReceived && isPending && (
                                                                    <>
                                                                        <motion.button
                                                                            whileTap={{ scale: 0.9 }}
                                                                            onClick={() => handleAcceptInterest(interest.interestId)}
                                                                            className="flex-1 py-2.5 bg-primary text-white rounded-full text-xs font-bold hover:bg-primary/90 transition-colors text-center"
                                                                        >
                                                                            {t('dashboard.accept')}
                                                                        </motion.button>
                                                                        <motion.button
                                                                            whileTap={{ scale: 0.9 }}
                                                                            onClick={() => handleDeclineInterestClick(interest.interestId)}
                                                                            className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-full text-xs font-bold hover:bg-slate-200 transition-colors text-center"
                                                                        >
                                                                            {t('dashboard.decline')}
                                                                        </motion.button>
                                                                    </>
                                                                )}
                                                                {!isReceived && isPending && (
                                                                    <motion.button
                                                                        whileTap={{ scale: 0.9 }}
                                                                        onClick={() => handleWithdrawInterest(interest.interestId)}
                                                                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-red-50 text-red-600 rounded-full text-xs font-bold hover:bg-red-100 transition-colors"
                                                                    >
                                                                        <Undo2 size={12} />
                                                                        {t('dashboard.withdraw')}
                                                                    </motion.button>
                                                                )}
                                                                {isApproved && (
                                                                    <motion.button
                                                                        whileTap={{ scale: 0.9 }}
                                                                        onClick={() => setCurrentView('messages')}
                                                                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold hover:bg-emerald-100 transition-colors"
                                                                    >
                                                                        {t('dashboard.message')}
                                                                    </motion.button>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    </div>
                                </>
                            ) : currentView === 'settings' ? (
                                <SettingsView
                                    onLaunchOnboarding={() => setShowOnboarding(true)}
                                    onOpenBilling={() => setShowSubscription(true)}
                                    onSelectPlan={handleSelectPlan}
                                    appliedCouponCode={appliedCouponCode}
                                    onApplyCoupon={(code) => setAppliedCouponCode(code)}
                                />
                            ) : currentView === 'profile' ? (
                                <ProfileEditView initialTab={profileTargetSection} />
                            ) : currentView === 'family' ? (
                                <FamilyPortalView />
                            ) : currentView === 'communities' ? (
                                <CommunityView />
                            ) : currentView === 'progression' ? (
                                <ProgressionView />
                            ) : currentView === 'notifications' ? (
                                <NotificationsView onNavigate={handleNavigate} />
                            ) : currentView === 'messages' ? (
                                <MessagesView />
                            ) : (
                                <DiscoveryView
                                    initialTab={currentView === 'agent_picks' ? 'agent' : 'all'}
                                    onSendProposal={(p) => setProposalTarget(p)}
                                    isIdentityVerified={isIdentityVerified}
                                    onRequireVerification={() => setShowVerificationPrompt(true)}
                                    onNavigate={handleNavigate}
                                    unreadNotifCount={unreadNotifCount}
                                />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </main>

                {currentView === 'dashboard' && (
                    <RightSidebar
                        onNavigateToProfile={(section) => {
                            setProfileTargetSection(section);
                            setCurrentView('profile');
                        }}
                    />
                )}

                <AnimatePresence>
                    {showOnboarding && <OnboardingModal onClose={() => {
                        setShowOnboarding(false);
                        // After onboarding closes, check verification and show prompt if not verified
                        if (isIdentityVerified === false || isIdentityVerified === null) {
                            api.get('/member/is-approved').then(res => {
                                const hasSubmitted = !!res.data?.verification_info;
                                const isApproved = res.data?.is_approved == 1;
                                setIsIdentityVerified(hasSubmitted || isApproved);
                                if (!hasSubmitted && !isApproved) {
                                    setTimeout(() => setShowVerificationPrompt(true), 300);
                                }
                            }).catch(() => {
                                setTimeout(() => setShowVerificationPrompt(true), 300);
                            });
                        }
                    }} />}
                </AnimatePresence>

                <AnimatePresence>
                    {showVerificationPrompt && (
                        <VerificationModal onClose={() => {
                            setShowVerificationPrompt(false);
                            // Re-check status in case user submitted verification
                            api.get('/member/is-approved').then(res => {
                                const hasSubmitted = !!res.data?.verification_info;
                                const isApproved = res.data?.is_approved == 1;
                                setIsIdentityVerified(hasSubmitted || isApproved);
                            }).catch(() => {});
                        }} />
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {showDeclineModal && (
                        <DeclineModal
                            interestId={declineInterestId}
                            onClose={() => {
                                setShowDeclineModal(false);
                                setDeclineInterestId(null);
                            }}
                            onDeclineSuccess={() => { fetchIncomingInterests(); fetchSentInterests(); }}
                        />
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {proposalTarget && (
                        <ProposalModal profile={proposalTarget} onClose={() => setProposalTarget(null)} onNavigate={handleNavigate} />
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {showSubscription && (
                        <SubscriptionModal
                            onClose={() => setShowSubscription(false)}
                            onSelectPlan={handleSelectPlan}
                            onSelectAddon={handleSelectAddon}
                        />
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {checkoutItem && (
                        <PaymentModal
                            itemId={checkoutItem.id}
                            itemName={checkoutItem.name}
                            amount={checkoutItem.amount}
                            purchaseType={checkoutItem.type}
                            appliedCouponCode={appliedCouponCode}
                            onCouponApplied={(code) => setAppliedCouponCode(code)}
                            onClose={() => setCheckoutItem(null)}
                        />
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {showAuthModal && (
                        <AuthModal
                            onClose={() => setShowAuthModal(false)}
                            onLogin={() => setShowAuthModal(false)}
                        />
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {selectedProposalProfile && (
                        <ProfileDetailModal
                            profile={selectedProposalProfile}
                            onClose={() => setSelectedProposalProfile(null)}
                            onSendProposal={(p) => { setSelectedProposalProfile(null); setProposalTarget(p); }}
                            onNavigate={handleNavigate}
                        />
                    )}
                </AnimatePresence>

                <style>{`
        /* Global Inputs */
        .form-input {
            width: 100%;
            padding: 0.625rem 1rem;
            border-radius: 0.5rem;
            border: 1px solid #cbd5e1;
            color: #0f172a;
            font-size: 0.875rem;
            background-color: white;
            transition: all 0.2s;
        }
        .form-input:focus {
            border-color: #d41173;
            outline: none;
            box-shadow: 0 0 0 1px rgba(212, 17, 115, 0.1);
        }

        /* Custom Scrollbar Design */
        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        ::-webkit-scrollbar-track {
            background: transparent;
        }
        ::-webkit-scrollbar-thumb {
            background-color: #cbd5e1; /* slate-300 */
            border-radius: 20px;
            border: 2px solid transparent;
            background-clip: content-box;
        }
        ::-webkit-scrollbar-thumb:hover {
            background-color: #d41173; /* Primary color on hover for theme consistency */
            border: 1px solid transparent;
        }

        /* Utility for hiding scrollbar when needed */
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}</style>
                <FloatingContactButton />
            </div>
        </GoogleOAuthProvider>
    );
};

export default App;
