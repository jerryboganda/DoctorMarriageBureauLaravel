import React, { lazy, Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useTranslation } from 'react-i18next';
import Sidebar from './components/Sidebar';
import LanguageToggle from './components/LanguageToggle';
import FloatingContactButton from './components/FloatingContactButton';
import LoadingTimeoutFallback from './components/LoadingTimeoutFallback';
import PasswordField from './components/PasswordField';
import {
    Bell,
    Menu,
    Send,
    Inbox,
    ArrowUpRight,
    ArrowDownLeft,
    Undo2,
    ShieldCheck,
} from 'lucide-react';
import { ProfileMatch } from './types';
import { AnimatePresence, motion } from 'framer-motion';
import { PAGE_VARIANTS } from './utils/motion';
import { useAuthStore } from './src/stores/authStore';
import { api } from './utils/api';
import { CanonicalInterestState } from './utils/interestStatus';
import { normalizePositiveAge } from './utils/age';

type IncomingInterest = {
    interestId: number;
    status?: string;
    profile: ProfileMatch;
};

type ProposalStateMapValue = {
    state: CanonicalInterestState;
    expiresAt: number;
};

type CheckoutItem = {
    id: number;
    name: string;
    amount: number;
    type: 'package' | 'addon';
};

type GateState =
    | 'gateLoading'
    | 'needsOnboarding'
    | 'needsVerification'
    | 'verificationPending'
    | 'gateUnlocked';
type VerificationLimitReason = 'message' | 'proposal';

const lazyRetry = <T extends React.ComponentType<any>>(importer: () => Promise<{ default: T }>) => {
    return () =>
        importer().catch((error) => {
            const message = String(error?.message || '');
            const isDynamicChunkError =
                message.includes('Failed to fetch dynamically imported module') ||
                message.includes('Importing a module script failed') ||
                message.includes('Loading chunk');

            if (isDynamicChunkError && typeof window !== 'undefined') {
                const reloadKey = 'dmb_chunk_reload_once';
                const alreadyReloaded = sessionStorage.getItem(reloadKey) === '1';
                if (!alreadyReloaded) {
                    sessionStorage.setItem(reloadKey, '1');
                    window.location.reload();
                    return new Promise<never>(() => {});
                }
            }

            throw error;
        });
};

const RightSidebar = lazy(lazyRetry(() => import('./components/RightSidebar')));
const SettingsView = lazy(lazyRetry(() => import('./components/SettingsView')));
const OnboardingModal = lazy(lazyRetry(() => import('./components/OnboardingModal')));
const VerificationModal = lazy(lazyRetry(() => import('./components/VerificationModal')));
const ProfileEditView = lazy(lazyRetry(() => import('./components/ProfileEditView')));
const DiscoveryView = lazy(lazyRetry(() => import('./components/DiscoveryView')));
const ProposalModal = lazy(lazyRetry(() => import('./components/ProposalModal')));
const DeclineModal = lazy(lazyRetry(() => import('./components/DeclineModal')));
const MessagesView = lazy(lazyRetry(() => import('./components/MessagesView')));
const SubscriptionModal = lazy(lazyRetry(() => import('./components/SubscriptionModal')));
const PremiumMessagingModal = lazy(lazyRetry(() => import('./components/PremiumMessagingModal')));
const PaymentModal = lazy(lazyRetry(() => import('./components/PaymentModal')));
const CommunityView = lazy(lazyRetry(() => import('./components/CommunityView')));
const WalletView = lazy(lazyRetry(() => import('./components/WalletView')));
const NotificationsView = lazy(lazyRetry(() => import('./components/NotificationsView')));
const ReferralView = lazy(lazyRetry(() => import('./components/ReferralView')));
const AuthModal = lazy(lazyRetry(() => import('./components/AuthModal')));
const WelcomeScreen = lazy(lazyRetry(() => import('./components/WelcomeScreen')));
const ProfileDetailModal = lazy(lazyRetry(() => import('./components/ProfileDetailModal')));
const ReferralPopupModal = lazy(lazyRetry(() => import('./components/ReferralPopupModal')));
const API_BASE =
    import.meta.env.VITE_API_BASE_URL?.replace('/api', '') ||
    'https://api.doctormarriagebureau.com.pk';
const DEFAULT_AVATAR = `${API_BASE}/assets/img/avatar-place.png`;

const buildNotificationProfileTarget = (profileId: string): ProfileMatch => ({
    id: profileId,
    name: 'Loading profile...',
    specialty: '',
    hospital: '',
    location: '',
    age: null,
    matchPercentage: 0,
    avatarUrl: DEFAULT_AVATAR,
    isVerified: false,
});

const resolveAvatarUrl = (value?: string | null): string => {
    const candidate = `${value ?? ''}`.trim();
    if (!candidate) return DEFAULT_AVATAR;
    if (candidate.startsWith('http://') || candidate.startsWith('https://')) return candidate;
    if (candidate.startsWith('//')) return `https:${candidate}`;
    if (candidate.startsWith('/')) return `${API_BASE}${candidate}`;
    return `${API_BASE}/${candidate.replace(/^\/+/, '')}`;
};

const App: React.FC = () => {
    const { isAuthenticated, isLoading, checkAuth, logout, user } = useAuthStore();
    const { t } = useTranslation();

    const [currentView, setCurrentView] = useState('discovery');
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [showVerificationPrompt, setShowVerificationPrompt] = useState(false);
    const [isIdentityVerified, setIsIdentityVerified] = useState<boolean>(false); // true only when admin approved
    const [hasSubmittedVerification, setHasSubmittedVerification] = useState<boolean>(false);
    const [gateState, setGateState] = useState<GateState>('gateLoading');
    const [showDeclineModal, setShowDeclineModal] = useState(false);
    const [proposalTarget, setProposalTarget] = useState<ProfileMatch | null>(null);
    const [incomingInterests, setIncomingInterests] = useState<IncomingInterest[]>([]);
    const [sentInterests, setSentInterests] = useState<IncomingInterest[]>([]);
    const [declineInterestId, setDeclineInterestId] = useState<number | null>(null);
    const [dashboardTab, setDashboardTab] = useState<'all' | 'verified' | 'unverified'>('all');
    const [proposalDirection, setProposalDirection] = useState<'received' | 'sent'>('received');
    const [selectedProposalProfile, setSelectedProposalProfile] = useState<ProfileMatch | null>(
        null,
    );
    const [sentProposalMap, setSentProposalMap] = useState<Record<string, boolean>>({});
    const [proposalStatusMap, setProposalStatusMap] = useState<
        Record<string, CanonicalInterestState>
    >({});
    const [dataSyncVersion, setDataSyncVersion] = useState(0);
    const optimisticProposalMapRef = useRef<Record<string, ProposalStateMapValue>>({});

    // Mobile Sidebar State
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Auth Modal State
    const [showAuthModal, setShowAuthModal] = useState(false);

    const [showReferralPopup, setShowReferralPopup] = useState(false);
    const [referralPopupConfig, setReferralPopupConfig] = useState<any>(null);

    // Billing & Subscription State
    const [showSubscription, setShowSubscription] = useState(false);
    const [showPremiumMessagingModal, setShowPremiumMessagingModal] = useState(false);
    const [verificationLimitReason, setVerificationLimitReason] =
        useState<VerificationLimitReason | null>(null);
    const [checkoutItem, setCheckoutItem] = useState<CheckoutItem | null>(null);
    const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);
    const [profileTargetSection, setProfileTargetSection] = useState<string | null>(null);
    const [messageTargetMemberId, setMessageTargetMemberId] = useState<string | null>(null);
    const isPremiumMessagingMember = Number(user?.membership) === 2;
    const mustChangePassword = isAuthenticated && Boolean(Number(user?.must_change_password ?? 0));
    const [forcePasswordOld, setForcePasswordOld] = useState('');
    const [forcePasswordNew, setForcePasswordNew] = useState('');
    const [forcePasswordConfirm, setForcePasswordConfirm] = useState('');
    const [forcePasswordSubmitting, setForcePasswordSubmitting] = useState(false);
    const [forcePasswordError, setForcePasswordError] = useState('');
    const [unreadNotifCount, setUnreadNotifCount] = useState(0);
    const refreshInFlightRef = useRef<Promise<void> | null>(null);
    const lastRefreshAtRef = useRef<number>(0);
    const verificationDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastHiddenAtRef = useRef<number | null>(null);
    const lastPassiveGateCheckAtRef = useRef<number>(0);

    useEffect(() => {
        checkAuth();
    }, []);

    // Referral Popup: fetch config and show to free-plan users
    useEffect(() => {
        if (!isAuthenticated || !user) return;

        // Only show to free plan users (membership !== 2)
        const membershipVal = Number(user.membership);
        if (membershipVal === 2) return;

        const controller = new AbortController();

        const fetchAndShow = async () => {
            try {
                const res = await api.get('/referral/settings-public', {
                    signal: controller.signal,
                });
                const popup = res.data?.popup;
                if (!popup?.enabled) return;

                // Check frequency-based dismissal
                const freq = popup.show_frequency || 'once_per_session';
                const dismissKey = 'referral_popup_dismissed';

                if (freq === 'once_ever') {
                    if (localStorage.getItem(dismissKey) === 'forever') return;
                } else if (freq === 'once_per_day') {
                    const lastDismissed = localStorage.getItem(dismissKey + '_date');
                    if (lastDismissed === new Date().toISOString().slice(0, 10)) return;
                } else if (freq === 'once_per_session') {
                    if (sessionStorage.getItem(dismissKey) === '1') return;
                }
                // 'every_login' always shows

                setReferralPopupConfig(popup);

                const delay = (popup.delay_seconds || 2) * 1000;
                const timer = setTimeout(() => {
                    setShowReferralPopup(true);
                }, delay);

                return () => clearTimeout(timer);
            } catch {
                // Silently ignore - popup is non-critical
            }
        };

        fetchAndShow();
        return () => controller.abort();
    }, [isAuthenticated, user]);

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

    const mapInterestRow = (item: any, direction: 'sent' | 'received'): IncomingInterest => {
        const interestId = Number(item.id);
        const baseScore = Number.isFinite(interestId) ? 75 + (interestId % 20) : 80;
        const age = normalizePositiveAge(item.age);
        const proposalStatus = String(item.proposal_status ?? '').toLowerCase();
        const statusText = String(item.status ?? '').toLowerCase();
        const isAccepted = proposalStatus.includes('accepted') || statusText === 'approved';
        const isReceived = proposalStatus.startsWith('received') || direction === 'received';
        const interestStatus = isReceived ? 'do_response' : isAccepted ? 'mutual' : 'sent interest';
        const interestText = isReceived
            ? isAccepted
                ? 'You Accepted Proposal'
                : 'Reply to Proposal'
            : isAccepted
              ? 'Proposal Accepted'
              : 'Proposal Sent';

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
                avatarUrl: resolveAvatarUrl(item.photo),
                isVerified: !!item.is_verified,
                interestStatus,
                interestText,
            },
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
            setIncomingInterests(rows.map((row: any) => mapInterestRow(row, 'received')));
        } catch (error) {
            console.error('Failed to fetch incoming interests', error);
        }
    };

    const fetchSentInterests = async () => {
        try {
            const response = await api.get('/member/my-interests');
            const rows = response.data?.data || [];
            setSentInterests(rows.map((row: any) => mapInterestRow(row, 'sent')));
        } catch (error) {
            console.error('Failed to fetch sent interests', error);
        }
    };

    const touchDataSync = () => {
        setDataSyncVersion((prev) => prev + 1);
    };

    const upsertProposalState = useCallback(
        (profileId: string, state: CanonicalInterestState, optimisticTtlMs: number = 0) => {
            const normalizedId = String(profileId || '').trim();
            if (!normalizedId) return;

            if (optimisticTtlMs > 0) {
                optimisticProposalMapRef.current[normalizedId] = {
                    state,
                    expiresAt: Date.now() + optimisticTtlMs,
                };
            } else {
                delete optimisticProposalMapRef.current[normalizedId];
            }

            setProposalStatusMap((prev) => ({ ...prev, [normalizedId]: state }));
            setSentProposalMap((prev) => ({
                ...prev,
                [normalizedId]: state === 'sent_pending' || state === 'sent_accepted',
            }));
        },
        [],
    );

    const refreshCoreData = async ({ force = false }: { force?: boolean } = {}) => {
        const now = Date.now();
        const minGapMs = 1500;

        if (refreshInFlightRef.current) {
            return refreshInFlightRef.current;
        }

        if (!force && now - lastRefreshAtRef.current < minGapMs) {
            return;
        }

        const task = (async () => {
            await Promise.allSettled([
                fetchIncomingInterests(),
                fetchSentInterests(),
                fetchNotificationCount(),
            ]);
            lastRefreshAtRef.current = Date.now();
            touchDataSync();
        })().finally(() => {
            refreshInFlightRef.current = null;
        });

        refreshInFlightRef.current = task;
        return task;
    };

    const handleWithdrawInterest = async (interestId?: number) => {
        if (!interestId) return;
        const target = sentInterests.find((item) => item.interestId === interestId);
        if (target?.profile?.id) {
            upsertProposalState(String(target.profile.id), 'none');
        }
        try {
            await api.post('/member/interest-withdraw', { interest_id: interestId });
            await refreshCoreData({ force: true });
        } catch (error) {
            console.error('Failed to withdraw interest', error);
            if (target?.profile?.id) {
                upsertProposalState(String(target.profile.id), 'sent_pending', 120000);
            }
        }
    };

    const fetchApprovalStatus = async () => {
        const res = await api.get('/member/is-approved');
        const hasSubmitted = !!res.data?.verification_info;
        const isApproved = res.data?.is_approved == 1 && hasSubmitted;
        return { isApproved, hasSubmitted };
    };

    const evaluateGate = async ({ silent = false }: { silent?: boolean } = {}) => {
        if (!silent) {
            setGateState('gateLoading');
        }
        try {
            const profileRes = await api.get('/full-profile');
            const onboardingCompleted =
                profileRes.data?.result && profileRes.data?.basics?.onboardingCompleted === true;

            if (!onboardingCompleted) {
                setIsIdentityVerified(false);
                setHasSubmittedVerification(false);
                setShowVerificationPrompt(false);
                setShowOnboarding(true);
                setGateState('needsOnboarding');
                return;
            }

            setShowOnboarding(false);
            const { isApproved, hasSubmitted } = await fetchApprovalStatus();
            setIsIdentityVerified(isApproved);
            setHasSubmittedVerification(hasSubmitted);

            setShowVerificationPrompt(false);
            setGateState('gateUnlocked');
            if (!isApproved && !hasSubmitted) {
                scheduleVerificationPrompt();
            }
        } catch (error) {
            console.error('Failed to evaluate onboarding/verification gate', error);
            // Fail closed for mission-critical flows.
            setIsIdentityVerified(false);
            setHasSubmittedVerification(false);
            setShowVerificationPrompt(false);
            setShowOnboarding(true);
            setGateState('needsOnboarding');
        }
    };

    const scheduleVerificationPrompt = () => {
        if (verificationDelayRef.current) {
            clearTimeout(verificationDelayRef.current);
        }
        verificationDelayRef.current = setTimeout(() => {
            setShowVerificationPrompt(true);
        }, 5000);
    };

    useEffect(() => {
        if (isAuthenticated) {
            if (mustChangePassword) {
                setGateState('gateUnlocked');
                setShowOnboarding(false);
                setShowVerificationPrompt(false);
                setIsIdentityVerified(true);
                return;
            }
            refreshCoreData({ force: true });
            evaluateGate();
        } else {
            setGateState('gateLoading');
            setShowOnboarding(false);
            setShowVerificationPrompt(false);
            setIsIdentityVerified(false);
            setHasSubmittedVerification(false);
        }
    }, [isAuthenticated, mustChangePassword]);

    useEffect(() => {
        const next: Record<string, CanonicalInterestState> = {};

        sentInterests.forEach((interest) => {
            const profileId = String(interest.profile?.id ?? '');
            if (!profileId) return;
            const statusText = String(interest.status ?? '').toLowerCase();
            next[profileId] = statusText === 'approved' ? 'sent_accepted' : 'sent_pending';
        });

        incomingInterests.forEach((interest) => {
            const profileId = String(interest.profile?.id ?? '');
            if (!profileId) return;
            const statusText = String(interest.status ?? '').toLowerCase();
            next[profileId] = statusText === 'approved' ? 'received_accepted' : 'received_pending';
        });

        const now = Date.now();
        Object.entries<ProposalStateMapValue>(optimisticProposalMapRef.current).forEach(
            ([profileId, optimistic]) => {
                if (optimistic.expiresAt < now) {
                    delete optimisticProposalMapRef.current[profileId];
                    return;
                }
                if (!(profileId in next)) {
                    next[profileId] = optimistic.state;
                } else {
                    delete optimisticProposalMapRef.current[profileId];
                }
            },
        );

        setProposalStatusMap(next);
        setSentProposalMap((prev) => {
            const merged: Record<string, boolean> = { ...prev };
            Object.entries(next).forEach(([profileId, state]) => {
                merged[profileId] = state === 'sent_pending' || state === 'sent_accepted';
            });
            return merged;
        });
    }, [sentInterests, incomingInterests]);

    useEffect(() => {
        return () => {
            if (verificationDelayRef.current) {
                clearTimeout(verificationDelayRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!isAuthenticated || gateState !== 'gateUnlocked') return;

        const MIN_PASSIVE_RECHECK_INTERVAL_MS = 30000;
        const MIN_HIDDEN_DURATION_MS = 5000;

        const runPassiveGateCheck = () => {
            const now = Date.now();
            if (now - lastPassiveGateCheckAtRef.current < MIN_PASSIVE_RECHECK_INTERVAL_MS) {
                return;
            }
            lastPassiveGateCheckAtRef.current = now;
            evaluateGate({ silent: true });
        };

        const handleFocus = () => {
            runPassiveGateCheck();
        };
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                lastHiddenAtRef.current = Date.now();
                return;
            }
            if (document.visibilityState === 'visible') {
                const hiddenFor = lastHiddenAtRef.current
                    ? Date.now() - lastHiddenAtRef.current
                    : 0;
                lastHiddenAtRef.current = null;
                if (hiddenFor >= MIN_HIDDEN_DURATION_MS) {
                    runPassiveGateCheck();
                }
            }
        };

        window.addEventListener('focus', handleFocus);
        window.addEventListener('pageshow', handleFocus);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('pageshow', handleFocus);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [isAuthenticated, gateState]);

    useEffect(() => {
        if (!isAuthenticated) return;

        const onVisibility = () => {
            if (document.visibilityState === 'visible') {
                refreshCoreData();
            }
        };
        const onFocus = () => {
            refreshCoreData();
        };

        document.addEventListener('visibilitychange', onVisibility);
        window.addEventListener('focus', onFocus);

        return () => {
            document.removeEventListener('visibilitychange', onVisibility);
            window.removeEventListener('focus', onFocus);
        };
    }, [isAuthenticated]);

    const openPremiumMessagingModal = () => {
        setShowPremiumMessagingModal(true);
    };

    const openVerificationLimitModal = (reason: VerificationLimitReason) => {
        setVerificationLimitReason(reason);
    };

    const closeVerificationLimitModal = () => {
        setVerificationLimitReason(null);
    };

    const openVerificationFromLimit = () => {
        setVerificationLimitReason(null);
        setShowVerificationPrompt(true);
    };

    const handleUpgradeMessaging = () => {
        setShowPremiumMessagingModal(false);
        setShowSubscription(true);
    };

    const handleUpgradeMessagingViaReferral = () => {
        setShowPremiumMessagingModal(false);
        handleNavigate('referral');
    };

    const handleSelectPlan = (id: number, name: string, amount: number) => {
        setShowSubscription(false);
        setCheckoutItem({ id, name, amount, type: 'package' });
    };

    const handleSelectAddon = (id: number, name: string, amount: number) => {
        setShowSubscription(false);
        setCheckoutItem({ id, name, amount, type: 'addon' });
    };

    const handleSignOut = async () => {
        if (verificationDelayRef.current) {
            clearTimeout(verificationDelayRef.current);
            verificationDelayRef.current = null;
        }
        await logout();
        setCurrentView('discovery');
    };

    const handleForcedPasswordChange = async () => {
        if (!forcePasswordOld || !forcePasswordNew || !forcePasswordConfirm) {
            setForcePasswordError('Please fill all password fields.');
            return;
        }
        if (forcePasswordNew.length < 8) {
            setForcePasswordError('New password must be at least 8 characters.');
            return;
        }
        if (forcePasswordNew !== forcePasswordConfirm) {
            setForcePasswordError('New password and confirm password do not match.');
            return;
        }

        try {
            setForcePasswordSubmitting(true);
            setForcePasswordError('');
            await api.post('/member/change/password', {
                old_password: forcePasswordOld,
                password: forcePasswordNew,
                password_confirmation: forcePasswordConfirm,
            });
            await checkAuth();
            setForcePasswordOld('');
            setForcePasswordNew('');
            setForcePasswordConfirm('');
        } catch (error: any) {
            setForcePasswordError(error?.response?.data?.message || 'Failed to update password.');
        } finally {
            setForcePasswordSubmitting(false);
        }
    };

    const handleAcceptInterest = async (interestId?: number) => {
        if (!interestId) return;
        const target = incomingInterests.find((item) => item.interestId === interestId);
        if (target?.profile?.id) {
            upsertProposalState(String(target.profile.id), 'received_accepted', 120000);
        }
        try {
            await api.post('/member/interest-accept', { interest_id: interestId });
            await refreshCoreData({ force: true });
        } catch (error) {
            console.error('Failed to accept interest', error);
            if (target?.profile?.id) {
                upsertProposalState(String(target.profile.id), 'received_pending', 120000);
            }
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
            return;
        }

        if (view !== 'messages') {
            setMessageTargetMemberId(null);
        }

        setCurrentView(view);
        // Push state to browser history to enable back button
        window.history.pushState({ view }, '', window.location.pathname);
        // Keep navigation light to preserve SPA responsiveness
        fetchNotificationCount();
        setIsMobileMenuOpen(false); // Close mobile menu on navigate
    };

    const handleAuthComplete = () => {
        setCurrentView('discovery');
        window.history.replaceState({ view: 'discovery' }, '', window.location.pathname);
        checkAuth();
    };

    const handleOpenNotificationProfile = (profileId: string) => {
        const normalizedProfileId = String(profileId || '').trim();
        if (!normalizedProfileId) return;

        setSelectedProposalProfile(buildNotificationProfileTarget(normalizedProfileId));
    };

    const handleProposalMessageClick = (profileId?: string) => {
        const normalizedProfileId = String(profileId || '').trim();

        if (isIdentityVerified && !isPremiumMessagingMember) {
            setMessageTargetMemberId(null);
            openPremiumMessagingModal();
            return;
        }

        setMessageTargetMemberId(normalizedProfileId || null);
        handleNavigate('messages');
    };

    if (isLoading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-white">
                <LoadingTimeoutFallback message="Loading your account..." onReload={checkAuth} />
            </div>
        );
    }

    if (!isAuthenticated) {
        const authPath = window.location.pathname.toLowerCase().replace(/\/+$/, '');
        const initialAuthStep =
            authPath === '/register' || authPath === '/signup'
                ? 'input'
                : authPath === '/forgot-password'
                  ? 'forgot-password'
                  : 'landing';

        return (
            <GoogleOAuthProvider
                clientId={
                    import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID_PLACEHOLDER'
                }
            >
                <Suspense
                    fallback={
                        <div className="h-screen w-full flex items-center justify-center bg-white">
                            <LoadingTimeoutFallback message="Loading welcome screen..." compact />
                        </div>
                    }
                >
                    <AnimatePresence mode="wait">
                        <motion.div key={initialAuthStep} exit={{ opacity: 0 }}>
                            <WelcomeScreen
                                initialStep={initialAuthStep}
                                onComplete={handleAuthComplete}
                            />
                        </motion.div>
                    </AnimatePresence>
                </Suspense>
            </GoogleOAuthProvider>
        );
    }

    if (gateState === 'gateLoading') {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-white">
                <LoadingTimeoutFallback
                    message="Checking onboarding and verification..."
                    onReload={() => evaluateGate({ silent: false })}
                />
            </div>
        );
    }

    const handleDismissReferralPopup = () => {
        setShowReferralPopup(false);
        if (referralPopupConfig) {
            const freq = referralPopupConfig.show_frequency || 'once_per_session';
            const dismissKey = 'referral_popup_dismissed';
            if (freq === 'once_ever') {
                localStorage.setItem(dismissKey, 'forever');
            } else if (freq === 'once_per_day') {
                localStorage.setItem(dismissKey + '_date', new Date().toISOString().slice(0, 10));
            } else if (freq === 'once_per_session') {
                sessionStorage.setItem(dismissKey, '1');
            }
        }
    };

    return (
        <GoogleOAuthProvider
            clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID_PLACEHOLDER'}
        >
            <div className="flex h-screen w-full bg-background-light overflow-hidden">
                {mustChangePassword && (
                    <div className="fixed inset-0 z-[120] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
                            <h2 className="text-xl font-bold text-slate-900 mb-2">
                                Change Password Required
                            </h2>
                            <p className="text-sm text-slate-600 mb-4">
                                For security, please change your password to continue.
                            </p>
                            {forcePasswordError && (
                                <div className="mb-3 rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2">
                                    {forcePasswordError}
                                </div>
                            )}
                            <div className="space-y-3">
                                <PasswordField
                                    value={forcePasswordOld}
                                    onChange={(e) => setForcePasswordOld(e.target.value)}
                                    placeholder="Current password"
                                    aria-label="Current password"
                                    inputClassName="w-full border border-slate-200 rounded-xl py-2 text-sm"
                                    containerClassName="space-y-0"
                                    showToggle
                                />
                                <PasswordField
                                    value={forcePasswordNew}
                                    onChange={(e) => setForcePasswordNew(e.target.value)}
                                    placeholder="New password"
                                    aria-label="New password"
                                    inputClassName="w-full border border-slate-200 rounded-xl py-2 text-sm"
                                    containerClassName="space-y-0"
                                    showToggle
                                />
                                <PasswordField
                                    value={forcePasswordConfirm}
                                    onChange={(e) => setForcePasswordConfirm(e.target.value)}
                                    placeholder="Confirm new password"
                                    aria-label="Confirm new password"
                                    inputClassName="w-full border border-slate-200 rounded-xl py-2 text-sm"
                                    containerClassName="space-y-0"
                                    showToggle
                                />
                            </div>
                            <button
                                onClick={handleForcedPasswordChange}
                                disabled={forcePasswordSubmitting}
                                className="mt-4 w-full bg-primary text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-60"
                            >
                                {forcePasswordSubmitting ? 'Updating...' : 'Update Password'}
                            </button>
                        </div>
                    </div>
                )}
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
                    <div
                        className={`h-full transition-transform duration-300 pointer-events-auto ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
                    >
                        <Sidebar
                            currentView={currentView}
                            onNavigate={handleNavigate}
                            dataSyncVersion={dataSyncVersion}
                            onUpgrade={() => {
                                openPremiumMessagingModal();
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
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="p-2 text-slate-600"
                            aria-label={t('common.openMenu')}
                        >
                            <Menu size={24} />
                        </button>
                        <img src="/logo-v2.png" alt={t('common.logoAlt')} className="h-8 w-auto" />
                        <div className="flex items-center gap-1">
                            <LanguageToggle compact className="text-slate-500" />
                            <button
                                onClick={() => {
                                    setCurrentView('notifications');
                                    fetchNotificationCount();
                                }}
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
                            <Suspense
                                fallback={
                                    <div className="h-full w-full flex items-center justify-center bg-white">
                                        <LoadingTimeoutFallback message="Loading view..." compact />
                                    </div>
                                }
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
                                                    onClick={() => setDashboardTab('verified')}
                                                    className={`px-4 lg:px-6 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                                                        dashboardTab === 'verified'
                                                            ? 'bg-slate-900 text-white font-bold shadow-md'
                                                            : 'text-slate-500 hover:text-slate-900'
                                                    }`}
                                                >
                                                    {t('dashboard.tabs.verifiedProposals')}
                                                </motion.button>
                                                <motion.button
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => setDashboardTab('unverified')}
                                                    className={`px-4 lg:px-6 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                                                        dashboardTab === 'unverified'
                                                            ? 'bg-slate-900 text-white font-bold shadow-md'
                                                            : 'text-slate-500 hover:text-slate-900'
                                                    }`}
                                                >
                                                    {t('dashboard.tabs.unverifiedProposals')}
                                                </motion.button>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                {/* Sent / Received Toggle Switch */}
                                                <div className="flex bg-white p-1 rounded-full shadow-sm border border-slate-100">
                                                    <motion.button
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() =>
                                                            setProposalDirection('received')
                                                        }
                                                        className={`flex items-center gap-1.5 px-3 lg:px-4 py-2 rounded-full text-xs lg:text-sm font-medium transition-colors whitespace-nowrap ${
                                                            proposalDirection === 'received'
                                                                ? 'bg-primary text-white font-bold shadow-md'
                                                                : 'text-slate-500 hover:text-slate-900'
                                                        }`}
                                                    >
                                                        <ArrowDownLeft size={14} />
                                                        {t('dashboard.received')}
                                                        {incomingInterests.length > 0 && (
                                                            <span
                                                                className={`ml-1 text-[10px] font-bold rounded-full size-5 flex items-center justify-center ${
                                                                    proposalDirection === 'received'
                                                                        ? 'bg-white/20 text-white'
                                                                        : 'bg-primary/10 text-primary'
                                                                }`}
                                                            >
                                                                {incomingInterests.length}
                                                            </span>
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
                                                            <span
                                                                className={`ml-1 text-[10px] font-bold rounded-full size-5 flex items-center justify-center ${
                                                                    proposalDirection === 'sent'
                                                                        ? 'bg-white/20 text-white'
                                                                        : 'bg-primary/10 text-primary'
                                                                }`}
                                                            >
                                                                {sentInterests.length}
                                                            </span>
                                                        )}
                                                    </motion.button>
                                                </div>

                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => {
                                                        setCurrentView('notifications');
                                                        fetchNotificationCount();
                                                    }}
                                                    className="hidden lg:flex size-10 rounded-full items-center justify-center transition-colors shadow-sm border border-slate-100 relative bg-white text-slate-600 hover:text-primary"
                                                >
                                                    <Bell size={20} />
                                                    {unreadNotifCount > 0 && (
                                                        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-white">
                                                            {unreadNotifCount > 99
                                                                ? '99+'
                                                                : unreadNotifCount}
                                                        </span>
                                                    )}
                                                </motion.button>
                                            </div>
                                        </header>

                                        {/* Scrollable Content */}
                                        <div className="flex-1 overflow-y-auto px-4 lg:px-8 pb-8 pt-2">
                                            <div className="max-w-3xl mx-auto flex flex-col gap-4">
                                                {(() => {
                                                    const isReceived =
                                                        proposalDirection === 'received';
                                                    const source = isReceived
                                                        ? incomingInterests
                                                        : sentInterests;
                                                    let filtered = [...source];
                                                    if (dashboardTab === 'verified') {
                                                        filtered = filtered.filter(
                                                            (a) => a.profile.isVerified === true,
                                                        );
                                                    } else if (dashboardTab === 'unverified') {
                                                        filtered = filtered.filter(
                                                            (a) => a.profile.isVerified !== true,
                                                        );
                                                    }

                                                    if (filtered.length === 0) {
                                                        return (
                                                            <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-slate-100">
                                                                <div className="size-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                                    {isReceived ? (
                                                                        <Inbox
                                                                            className="text-slate-400"
                                                                            size={28}
                                                                        />
                                                                    ) : (
                                                                        <Send
                                                                            className="text-slate-400"
                                                                            size={28}
                                                                        />
                                                                    )}
                                                                </div>
                                                                <h3 className="font-bold text-slate-900 text-lg mb-2">
                                                                    {isReceived
                                                                        ? t(
                                                                              'empty.noReceivedProposals',
                                                                          )
                                                                        : t(
                                                                              'empty.noSentProposals',
                                                                          )}
                                                                </h3>
                                                                <p className="text-slate-500 text-sm">
                                                                    {isReceived
                                                                        ? t(
                                                                              'empty.noReceivedProposalsDesc',
                                                                          )
                                                                        : t(
                                                                              'empty.noSentProposalsDesc',
                                                                          )}
                                                                </p>
                                                                {!isReceived && (
                                                                    <motion.button
                                                                        whileTap={{ scale: 0.95 }}
                                                                        onClick={() =>
                                                                            setCurrentView(
                                                                                'discovery',
                                                                            )
                                                                        }
                                                                        className="mt-4 px-6 py-2 bg-primary text-white rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
                                                                    >
                                                                        {t(
                                                                            'dashboard.exploreProfiles',
                                                                        )}
                                                                    </motion.button>
                                                                )}
                                                            </div>
                                                        );
                                                    }

                                                    return filtered.map((interest) => {
                                                        const statusText =
                                                            interest.status || 'Pending';
                                                        const isApproved =
                                                            statusText === 'Approved';
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
                                                                    onClick={() =>
                                                                        setSelectedProposalProfile(
                                                                            interest.profile,
                                                                        )
                                                                    }
                                                                >
                                                                    <div
                                                                        className="size-12 sm:size-14 rounded-full bg-cover bg-center shrink-0 border-2 border-white shadow-sm hover:ring-2 hover:ring-primary/40 transition-all"
                                                                        style={{
                                                                            backgroundImage: `url('${resolveAvatarUrl(interest.profile.avatarUrl)}')`,
                                                                        }}
                                                                    />
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center gap-2 flex-wrap">
                                                                            <h4 className="font-bold text-slate-900 truncate hover:text-primary transition-colors">
                                                                                {
                                                                                    interest.profile
                                                                                        .name
                                                                                }
                                                                            </h4>
                                                                            <span
                                                                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                                                                    isApproved
                                                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                                                }`}
                                                                            >
                                                                                <span
                                                                                    className={`size-1.5 rounded-full ${isApproved ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                                                                />
                                                                                {isApproved
                                                                                    ? t(
                                                                                          'dashboard.accepted',
                                                                                      )
                                                                                    : t(
                                                                                          'dashboard.pending',
                                                                                      )}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex items-center gap-2 text-sm text-slate-500 mt-0.5">
                                                                            {interest.profile.age >
                                                                                0 && (
                                                                                <span>
                                                                                    {
                                                                                        interest
                                                                                            .profile
                                                                                            .age
                                                                                    }{' '}
                                                                                    {t(
                                                                                        'dashboard.yrs',
                                                                                    )}
                                                                                </span>
                                                                            )}
                                                                            {interest.profile.age >
                                                                                0 &&
                                                                                interest.profile
                                                                                    .location && (
                                                                                    <span>Â·</span>
                                                                                )}
                                                                            {interest.profile
                                                                                .location && (
                                                                                <span>
                                                                                    {
                                                                                        interest
                                                                                            .profile
                                                                                            .location
                                                                                    }
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        {interest.profile
                                                                            .specialty && (
                                                                            <p className="text-xs text-slate-400 mt-0.5">
                                                                                {
                                                                                    interest.profile
                                                                                        .specialty
                                                                                }
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                    {/* Desktop action buttons */}
                                                                    <div
                                                                        className="hidden sm:flex items-center gap-2 shrink-0"
                                                                        onClick={(e) =>
                                                                            e.stopPropagation()
                                                                        }
                                                                    >
                                                                        {isReceived &&
                                                                            isPending && (
                                                                                <>
                                                                                    <motion.button
                                                                                        whileTap={{
                                                                                            scale: 0.9,
                                                                                        }}
                                                                                        onClick={() =>
                                                                                            handleAcceptInterest(
                                                                                                interest.interestId,
                                                                                            )
                                                                                        }
                                                                                        className="px-4 py-2 bg-primary text-white rounded-full text-xs font-bold hover:bg-primary/90 transition-colors"
                                                                                    >
                                                                                        {t(
                                                                                            'dashboard.accept',
                                                                                        )}
                                                                                    </motion.button>
                                                                                    <motion.button
                                                                                        whileTap={{
                                                                                            scale: 0.9,
                                                                                        }}
                                                                                        onClick={() =>
                                                                                            handleDeclineInterestClick(
                                                                                                interest.interestId,
                                                                                            )
                                                                                        }
                                                                                        className="px-4 py-2 bg-slate-100 text-slate-600 rounded-full text-xs font-bold hover:bg-slate-200 transition-colors"
                                                                                    >
                                                                                        {t(
                                                                                            'dashboard.decline',
                                                                                        )}
                                                                                    </motion.button>
                                                                                </>
                                                                            )}
                                                                        {!isReceived &&
                                                                            isPending && (
                                                                                <motion.button
                                                                                    whileTap={{
                                                                                        scale: 0.9,
                                                                                    }}
                                                                                    onClick={() =>
                                                                                        handleWithdrawInterest(
                                                                                            interest.interestId,
                                                                                        )
                                                                                    }
                                                                                    className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 rounded-full text-xs font-bold hover:bg-red-100 transition-colors"
                                                                                >
                                                                                    <Undo2
                                                                                        size={12}
                                                                                    />
                                                                                    {t(
                                                                                        'dashboard.withdraw',
                                                                                    )}
                                                                                </motion.button>
                                                                            )}
                                                                        {isApproved && (
                                                                            <motion.button
                                                                                whileTap={{
                                                                                    scale: 0.9,
                                                                                }}
                                                                                onClick={() =>
                                                                                    handleProposalMessageClick(
                                                                                        interest
                                                                                            .profile
                                                                                            .id,
                                                                                    )
                                                                                }
                                                                                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold hover:bg-emerald-100 transition-colors"
                                                                            >
                                                                                {t(
                                                                                    'dashboard.message',
                                                                                )}
                                                                            </motion.button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                {/* Mobile action buttons â€” full-width row below the card */}
                                                                <div className="flex sm:hidden items-center gap-2 px-4 pb-3 pt-0">
                                                                    {isReceived && isPending && (
                                                                        <>
                                                                            <motion.button
                                                                                whileTap={{
                                                                                    scale: 0.9,
                                                                                }}
                                                                                onClick={() =>
                                                                                    handleAcceptInterest(
                                                                                        interest.interestId,
                                                                                    )
                                                                                }
                                                                                className="flex-1 py-2.5 bg-primary text-white rounded-full text-xs font-bold hover:bg-primary/90 transition-colors text-center"
                                                                            >
                                                                                {t(
                                                                                    'dashboard.accept',
                                                                                )}
                                                                            </motion.button>
                                                                            <motion.button
                                                                                whileTap={{
                                                                                    scale: 0.9,
                                                                                }}
                                                                                onClick={() =>
                                                                                    handleDeclineInterestClick(
                                                                                        interest.interestId,
                                                                                    )
                                                                                }
                                                                                className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-full text-xs font-bold hover:bg-slate-200 transition-colors text-center"
                                                                            >
                                                                                {t(
                                                                                    'dashboard.decline',
                                                                                )}
                                                                            </motion.button>
                                                                        </>
                                                                    )}
                                                                    {!isReceived && isPending && (
                                                                        <motion.button
                                                                            whileTap={{
                                                                                scale: 0.9,
                                                                            }}
                                                                            onClick={() =>
                                                                                handleWithdrawInterest(
                                                                                    interest.interestId,
                                                                                )
                                                                            }
                                                                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-red-50 text-red-600 rounded-full text-xs font-bold hover:bg-red-100 transition-colors"
                                                                        >
                                                                            <Undo2 size={12} />
                                                                            {t(
                                                                                'dashboard.withdraw',
                                                                            )}
                                                                        </motion.button>
                                                                    )}
                                                                    {isApproved && (
                                                                        <motion.button
                                                                            whileTap={{
                                                                                scale: 0.9,
                                                                            }}
                                                                            onClick={() =>
                                                                                handleProposalMessageClick(
                                                                                    interest.profile
                                                                                        .id,
                                                                                )
                                                                            }
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
                                ) : currentView === 'communities' ? (
                                    <CommunityView />
                                ) : currentView === 'wallet' ? (
                                    <WalletView />
                                ) : currentView === 'referral' ? (
                                    <ReferralView />
                                ) : currentView === 'notifications' ? (
                                    <NotificationsView
                                        onNavigate={handleNavigate}
                                        onOpenProfile={handleOpenNotificationProfile}
                                        refreshVersion={dataSyncVersion}
                                        onDataChanged={refreshCoreData}
                                    />
                                ) : currentView === 'messages' ? (
                                    <MessagesView
                                        onSubscriptionRequired={openPremiumMessagingModal}
                                        onVerificationRequired={() =>
                                            openVerificationLimitModal('message')
                                        }
                                        initialMemberId={messageTargetMemberId}
                                        onInitialMemberIdConsumed={() =>
                                            setMessageTargetMemberId(null)
                                        }
                                    />
                                ) : (
                                    <DiscoveryView
                                        initialTab={'all'}
                                        onSendProposal={(p) => setProposalTarget(p)}
                                        onProposalStateChange={(profileId, state) => {
                                            upsertProposalState(profileId, state, 120000);
                                            refreshCoreData({ force: true });
                                        }}
                                        isIdentityVerified={isIdentityVerified}
                                        onRequireVerification={() => {
                                            setGateState('needsVerification');
                                            setShowVerificationPrompt(true);
                                        }}
                                        onNavigate={handleNavigate}
                                        unreadNotifCount={unreadNotifCount}
                                        sentProposalMap={sentProposalMap}
                                        proposalStatusMap={proposalStatusMap}
                                        refreshVersion={dataSyncVersion}
                                    />
                                )}
                            </Suspense>
                        </motion.div>
                    </AnimatePresence>
                </main>

                {currentView === 'dashboard' && (
                    <Suspense fallback={null}>
                        <RightSidebar
                            onNavigateToProfile={(section) => {
                                setProfileTargetSection(section);
                                setCurrentView('profile');
                            }}
                        />
                    </Suspense>
                )}

                <AnimatePresence>
                    {showOnboarding && (
                        <Suspense fallback={null}>
                            <OnboardingModal
                                onClose={() => {
                                    setShowOnboarding(false);
                                    setGateState('gateUnlocked');
                                    scheduleVerificationPrompt();
                                }}
                            />
                        </Suspense>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {showVerificationPrompt && (
                        <Suspense fallback={null}>
                            <VerificationModal
                                lockMode={gateState !== 'gateUnlocked'}
                                approvalPollIntervalMs={10000}
                                onApproved={() => {
                                    setIsIdentityVerified(true);
                                    setHasSubmittedVerification(true);
                                    setGateState('gateUnlocked');
                                    setShowVerificationPrompt(false);
                                }}
                                onClose={() => {
                                    setShowVerificationPrompt(false);
                                }}
                            />
                        </Suspense>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {showDeclineModal && (
                        <Suspense fallback={null}>
                            <DeclineModal
                                interestId={declineInterestId}
                                onClose={() => {
                                    setShowDeclineModal(false);
                                    setDeclineInterestId(null);
                                }}
                                onDeclineSuccess={() => {
                                    refreshCoreData();
                                }}
                            />
                        </Suspense>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {proposalTarget && (
                        <Suspense fallback={null}>
                            <ProposalModal
                                profile={proposalTarget}
                                onClose={() => setProposalTarget(null)}
                                onNavigate={handleNavigate}
                                onSent={(profileId) => {
                                    upsertProposalState(profileId, 'sent_pending', 120000);
                                    refreshCoreData({ force: true });
                                }}
                                onVerificationRequired={() =>
                                    openVerificationLimitModal('proposal')
                                }
                            />
                        </Suspense>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {showPremiumMessagingModal && (
                        <Suspense fallback={null}>
                            <PremiumMessagingModal
                                open={showPremiumMessagingModal}
                                onClose={() => setShowPremiumMessagingModal(false)}
                                onChooseReferral={handleUpgradeMessagingViaReferral}
                                onChoosePackage={handleUpgradeMessaging}
                            />
                        </Suspense>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {verificationLimitReason && (
                        <motion.div
                            className="fixed inset-0 z-[80] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center px-4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <motion.div
                                className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 p-6"
                                initial={{ scale: 0.96, y: 16 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.96, y: 16 }}
                            >
                                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                                    <ShieldCheck size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">
                                    {hasSubmittedVerification && !isIdentityVerified
                                        ? 'Verification under review'
                                        : verificationLimitReason === 'proposal'
                                          ? 'Verify to send more proposals'
                                          : 'Verify to continue messaging'}
                                </h3>
                                <p className="text-sm text-slate-600 leading-relaxed mb-5">
                                    {isIdentityVerified
                                        ? 'Your account is verified. Please refresh and try again.'
                                        : hasSubmittedVerification
                                          ? 'You have used your free unverified limit, and your candidate verification is already under review. You can continue once it is approved.'
                                          : verificationLimitReason === 'proposal'
                                            ? 'You have used your 5 free unverified proposals. Complete candidate verification to continue sending proposals.'
                                            : 'You have used your 5 free unverified messages. Complete candidate verification to continue messaging.'}
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={closeVerificationLimitModal}
                                        className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition"
                                    >
                                        Later
                                    </button>
                                    <button
                                        type="button"
                                        onClick={openVerificationFromLimit}
                                        className="flex-1 px-4 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition"
                                    >
                                        {hasSubmittedVerification && !isIdentityVerified
                                            ? 'View status'
                                            : 'Verify now'}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {showSubscription && (
                        <Suspense fallback={null}>
                            <SubscriptionModal
                                onClose={() => setShowSubscription(false)}
                                onSelectPlan={handleSelectPlan}
                                onSelectAddon={handleSelectAddon}
                            />
                        </Suspense>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {checkoutItem && (
                        <Suspense fallback={null}>
                            <PaymentModal
                                itemId={checkoutItem.id}
                                itemName={checkoutItem.name}
                                amount={checkoutItem.amount}
                                purchaseType={checkoutItem.type}
                                appliedCouponCode={appliedCouponCode}
                                onCouponApplied={(code) => setAppliedCouponCode(code)}
                                onClose={() => setCheckoutItem(null)}
                            />
                        </Suspense>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {showAuthModal && (
                        <Suspense fallback={null}>
                            <AuthModal
                                onClose={() => setShowAuthModal(false)}
                                onLogin={() => {
                                    setShowAuthModal(false);
                                    handleAuthComplete();
                                }}
                            />
                        </Suspense>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {selectedProposalProfile && (
                        <Suspense fallback={null}>
                            <ProfileDetailModal
                                profile={selectedProposalProfile}
                                onClose={() => setSelectedProposalProfile(null)}
                                onSendProposal={(p) => {
                                    setSelectedProposalProfile(null);
                                    setProposalTarget(p);
                                }}
                                onNavigate={handleNavigate}
                            />
                        </Suspense>
                    )}
                </AnimatePresence>

                {gateState !== 'gateUnlocked' && !showOnboarding && !showVerificationPrompt && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center">
                        <div className="bg-white rounded-2xl px-6 py-5 shadow-2xl text-center">
                            <LoadingTimeoutFallback
                                message="Preparing identity verification..."
                                timeoutMs={10000}
                                compact
                            />
                        </div>
                    </div>
                )}

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

                <AnimatePresence>
                    {showReferralPopup && referralPopupConfig && (
                        <Suspense fallback={null}>
                            <ReferralPopupModal
                                onClose={handleDismissReferralPopup}
                                onNavigate={(view) => {
                                    handleDismissReferralPopup();
                                    handleNavigate(view);
                                }}
                                popupConfig={referralPopupConfig}
                            />
                        </Suspense>
                    )}
                </AnimatePresence>

                <FloatingContactButton
                    placement={currentView === 'messages' ? 'chat' : 'default'}
                />
            </div>
        </GoogleOAuthProvider>
    );
};

export default App;
