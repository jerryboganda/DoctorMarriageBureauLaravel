import React, { useState, useEffect, useMemo } from 'react';
import {
    X,
    MapPin,
    Briefcase,
    GraduationCap,
    Heart,
    Calendar,
    Users,
    BookOpen,
    Star,
    Zap,
    CheckCircle2,
    AlertTriangle,
    ArrowLeftRight,
    BrainCircuit,
    UserCheck,
    Loader2,
    Send,
    Lock,
    Eye,
    Ruler,
    Moon,
    Home,
    MessageSquare,
    Clock,
    Mic,
    Play,
    Pause,
    Volume2,
    Image as ImageIcon,
    EyeOff,
    Flag,
    Trash2,
} from 'lucide-react';
import { ProfileMatch, MatchIntelligence } from '../types';
import { api } from '../utils/api';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { BTN_TAP } from '../utils/motion';
import { resolveInterestState } from '../utils/interestStatus';
import { useAuthStore } from '../src/stores/authStore';
import ReportModal from './ReportModal';

const API_BASE =
    import.meta.env.VITE_API_BASE_URL?.replace('/api', '') ||
    'https://api.doctormarriagebureau.com.pk';
const DEFAULT_AVATAR = `${API_BASE}/assets/img/avatar-place.png`;
const DEFAULT_FEMALE_AVATAR = `${API_BASE}/assets/img/female-avatar-place.png`;

const isFemaleProfile = (gender?: number | string | null): boolean => {
    const normalized = `${gender ?? ''}`.trim().toLowerCase();
    return normalized === '2' || normalized === 'female' || normalized === 'f';
};

const isMaleDefaultAvatar = (url?: string | null): boolean => {
    const u = `${url ?? ''}`;
    // matches '...avatar-place.png' but NOT '...female-avatar-place.png'
    return /[/-]avatar-place\.png(\?|$)/.test(u) && !u.includes('female-avatar-place.png');
};
const swapAvatarForGender = (url: string, gender?: number | string | null): string => {
    if (isFemaleProfile(gender) && isMaleDefaultAvatar(url)) {
        return url.replace('avatar-place.png', 'female-avatar-place.png');
    }
    return url;
};

interface ProfileDetailModalProps {
    profile: ProfileMatch;
    onClose: () => void;
    onSendProposal: (profile: ProfileMatch) => void;
    onRequestMediaAccess?: (profile: ProfileMatch, kind?: 'photo' | 'gallery') => void;
    onNavigate?: (view: string) => void;
}

/* ────────────────────────────────────────────────────────────
   Helper: check if a data object has ANY displayable values
   ──────────────────────────────────────────────────────────── */
function hasAnyValue(obj: any, keys: string[]): boolean {
    if (!obj) return false;
    return keys.some((k) => {
        const v = obj[k];
        if (v === null || v === undefined || v === '' || v === 'N/A') return false;
        if (typeof v === 'object' && v?.name) return !!v.name;
        return true;
    });
}

const ProfileDetailModal: React.FC<ProfileDetailModalProps> = ({
    profile,
    onClose,
    onSendProposal,
    onRequestMediaAccess,
    onNavigate,
}) => {
    const { t } = useTranslation();
    const currentUserId = useAuthStore((state) => state.user?.id);
    const [activeTab, setActiveTab] = useState<'about' | 'compatibility'>('about');
    const [profileData, setProfileData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [intelligence, setIntelligence] = useState<MatchIntelligence | null>(null);
    const [intelLoading, setIntelLoading] = useState(false);
    const [intelError, setIntelError] = useState<string | null>(null);
    const [showFriction, setShowFriction] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [showPhotoPreview, setShowPhotoPreview] = useState(false);
    const [hiding, setHiding] = useState(false);
    const [removingFromShortlist, setRemovingFromShortlist] = useState(false);
    const displayProfile = profile;
    const isLiveProfile = Boolean(displayProfile.id);

    // interest_status from API: 1 = no interest, 0 = I sent interest, 'do_response' = they sent to me
    // interest_text tells us if it was accepted or pending
    const [interestState, setInterestState] = useState<
        'none' | 'sent_pending' | 'sent_accepted' | 'received_pending' | 'received_accepted'
    >(() => {
        return resolveInterestState(profile.interestStatus, profile.interestText);
    });

    useEffect(() => {
        setInterestState(resolveInterestState(profile.interestStatus, profile.interestText));
    }, [profile.id, profile.interestStatus, profile.interestText]);

    // Lock body scroll when modal is open
    useEffect(() => {
        const original = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = original;
        };
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        let isActive = true;
        const fetchProfile = async () => {
            try {
                setLoading(true);
                const [profileRes, memberInfoRes] = await Promise.all([
                    api.get(`/member/public-profile/${profile.id}`, { signal: controller.signal }),
                    api
                        .get(`/member/member-info/${profile.id}`, { signal: controller.signal })
                        .catch(() => null),
                ]);
                if (!isActive) return;
                if (profileRes.data.result) {
                    const data = profileRes.data.data;
                    setProfileData(data);
                } else {
                    setError('Could not load profile.');
                }
                // Update interest state from fresh member_info data
                if (memberInfoRes?.data?.data) {
                    const info = memberInfoRes.data.data;
                    setInterestState(
                        resolveInterestState(info.interest_status, info.interest_text),
                    );
                }
            } catch (err: any) {
                if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return;
                console.error('Failed to fetch profile', err);
                setError('Failed to load profile details.');
            } finally {
                if (isActive) setLoading(false);
            }
        };
        fetchProfile();
        return () => {
            isActive = false;
            controller.abort();
        };
    }, [profile.id]);

    useEffect(() => {
        if (activeTab === 'compatibility' && !intelligence && !intelLoading) {
            const fetchIntelligence = async () => {
                try {
                    setIntelLoading(true);
                    const response = await api.get(`/match-intelligence/${profile.id}`);
                    if (response.data.success) {
                        setIntelligence(response.data.data);
                    } else {
                        setIntelError('Failed to retrieve compatibility data.');
                    }
                } catch (err: any) {
                    console.error('Failed to fetch match intelligence', err);
                    setIntelError('Could not analyze compatibility at this time.');
                } finally {
                    setIntelLoading(false);
                }
            };
            fetchIntelligence();
        }
    }, [activeTab, profile.id]);

    const handleSendProposal = () => {
        if (interestState !== 'none') return;
        onSendProposal(profile);
    };

    const handleHideFromDiscovery = async () => {
        if (!isLiveProfile || !displayProfile.id || hiding) return;
        try {
            setHiding(true);
            await api.post('/member/add-to-ignore-list', { user_id: displayProfile.id });
            onClose();
            window.location.reload();
        } catch (error) {
            console.error('Failed to hide user from discovery', error);
        } finally {
            setHiding(false);
        }
    };

    const handleRemoveFromShortlist = async () => {
        if (!isLiveProfile || !displayProfile.id || removingFromShortlist) return;
        try {
            setRemovingFromShortlist(true);
            await api.post('/member/remove-from-shortlist', { user_id: displayProfile.id });
            onClose();
            window.location.reload();
        } catch (error) {
            console.error('Failed to remove user from shortlist', error);
        } finally {
            setRemovingFromShortlist(false);
        }
    };

    const basicInfo = profileData?.basic_info;
    const introduction = profileData?.intoduction?.introduction;
    const education = profileData?.education;
    const career = profileData?.career;
    const physical = profileData?.physical_attributes;
    const spiritual = profileData?.spiritual_backgrounds;
    const residence = profileData?.residence_info;
    const lifestyle = profileData?.lifestyles;
    const family = profileData?.families_information;
    const partnerExpectation = profileData?.partner_expectation;
    const hobbies = profileData?.hobbies_interest;
    const gallery = profileData?.photo_gallery;
    const screenshotDeterrence = profileData?.screenshot_deterrence;
    const galleryRequestState =
        `${profile.galleryImageRequestState ?? profileData?.gallery_image_request_state ?? 'none'}` as
            | 'none'
            | 'pending'
            | 'approved';
    const galleryRequestAccessible = Boolean(
        profile.galleryImageAccessible ?? profileData?.gallery_image_accessible,
    );
    const profilePhotoBlur = Boolean(
        profile.profilePhotoBlur ??
        profileData?.profile_photo_blur ??
        basicInfo?.profile_photo_blur,
    );
    const isOwnProfile = String(currentUserId ?? '') === String(profile.id ?? basicInfo?.id ?? '');

    const displayName = basicInfo
        ? `${basicInfo.firs_name || ''} ${basicInfo.last_name || ''}`.trim()
        : profile.name;
    const profileGender = basicInfo?.gender ?? profile.gender;
    const initialAvatarLooksDefault = `${profile.avatarUrl ?? ''}`.includes('avatar-place.png');
    const fallbackAvatar = isFemaleProfile(profileGender) ? DEFAULT_FEMALE_AVATAR : DEFAULT_AVATAR;
    const rawPhotoUrl =
        basicInfo?.photo || (initialAvatarLooksDefault ? '' : profile.avatarUrl) || fallbackAvatar;
    const photoUrl = swapAvatarForGender(rawPhotoUrl, profileGender);
    const shouldBlurPhoto = Boolean(
        profilePhotoBlur &&
        currentUserId != null &&
        !isOwnProfile &&
        photoUrl !== DEFAULT_AVATAR &&
        photoUrl !== DEFAULT_FEMALE_AVATAR,
    );

    const primaryProfession = useMemo(() => {
        const values: string[] = [];
        const append = (value: unknown) => {
            if (typeof value === 'number') {
                values.push(String(value));
                return;
            }
            if (typeof value !== 'string') return;
            const normalized = value.trim();
            if (normalized) values.push(normalized);
        };

        const profileAny = profile as any;

        const collectCareerItem = (item: any) => {
            if (!item) return;
            if (typeof item === 'string') {
                append(item);
                return;
            }
            append(item?.designation);
            append(item?.position);
            append(item?.occupation);
            append(item?.profession);
            append(item?.job_title);
            append(item?.title);
            append(item?.career);
            append(item?.company);
            append(item?.institution);
        };

        if (Array.isArray(career)) {
            career.forEach(collectCareerItem);
        } else {
            collectCareerItem(career);
        }

        if (Array.isArray(profileAny?.careers)) {
            profileAny.careers.forEach(collectCareerItem);
        }

        collectCareerItem(profileAny?.career);

        append(profileAny?.profession);
        append(profileAny?.occupation);
        append(profileAny?.job_title);
        append(profile.specialty);

        return values[0] || 'Not shared';
    }, [career, profile]);

    const primaryEducation = useMemo(() => {
        const values: string[] = [];
        const append = (value: unknown) => {
            if (typeof value === 'number') {
                values.push(String(value));
                return;
            }
            if (typeof value !== 'string') return;
            const normalized = value.trim();
            if (normalized) values.push(normalized);
        };

        const profileAny = profile as any;

        const collectEducationItem = (item: any) => {
            if (!item) return;
            if (typeof item === 'string') {
                append(item);
                return;
            }
            append(item?.degree);
            append(item?.education);
            append(item?.qualification);
            append(item?.title);
            append(item?.field_of_study);
            append(item?.institution);
            append(item?.school);
        };

        if (Array.isArray(education)) {
            education.forEach(collectEducationItem);
        } else {
            collectEducationItem(education);
        }

        if (Array.isArray(profileAny?.educations)) {
            profileAny.educations.forEach(collectEducationItem);
        }

        collectEducationItem(profileAny?.education);

        append(profileAny?.highest_education);
        append(profileAny?.qualification);

        return values[0] || 'Not shared';
    }, [education, profile]);

    const quickInfo = useMemo(() => {
        const items: { icon: React.ReactNode; text: string; wrap?: boolean }[] = [];
        if (Number(basicInfo?.age) > 0)
            items.push({ icon: <Calendar size={12} />, text: `${basicInfo.age} yrs` });
        if (basicInfo?.religion) items.push({ icon: <Moon size={12} />, text: basicInfo.religion });
        if (basicInfo?.maritial_status)
            items.push({ icon: <Heart size={12} />, text: basicInfo.maritial_status });
        if (profile.location) items.push({ icon: <MapPin size={12} />, text: profile.location });

        const professionText = primaryProfession.trim();
        const educationText = primaryEducation.trim();

        if (professionText && professionText !== 'Not shared') {
            items.push({
                icon: <Briefcase size={12} />,
                text: `Profession: ${professionText}`,
                wrap: true,
            });
        }

        if (educationText && educationText !== 'Not shared') {
            items.push({
                icon: <GraduationCap size={12} />,
                text: `Education: ${educationText}`,
                wrap: true,
            });
        }

        return items;
    }, [basicInfo, profile.location, primaryProfession, primaryEducation]);

    const visibleGallery = useMemo(() => {
        if (!gallery || !Array.isArray(gallery)) return [];
        return gallery.filter((img: any) => img.image && !img.is_blurred);
    }, [gallery]);

    const blurredGallery = useMemo(() => {
        if (!gallery || !Array.isArray(gallery)) return [];
        return gallery.filter((img: any) => img.is_blurred && img.thumbnail);
    }, [gallery]);

    const lockedCount = useMemo(() => {
        if (!gallery || !Array.isArray(gallery)) return 0;
        return gallery.filter((img: any) => !img.image && !img.thumbnail).length;
    }, [gallery]);
    const hasLockedGallery = blurredGallery.length > 0 || lockedCount > 0;
    const galleryAccessLabel =
        galleryRequestAccessible || galleryRequestState === 'approved'
            ? t('discovery.manageMediaAccess')
            : galleryRequestState === 'pending'
              ? t('discovery.galleryAccessRequested')
              : t('profile.galleryAccess');

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            {/* Position wrapper — no framer-motion, no flex, just raw positioning */}
            <div
                className="fixed bottom-0 left-0 right-0 flex h-[calc(100vh-16px)] flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:bottom-auto sm:left-1/2 sm:right-auto sm:top-1/2 sm:grid sm:h-auto sm:w-[calc(100vw-48px)] sm:max-w-[1180px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:grid-cols-[320px_minmax(0,1fr)] sm:rounded-2xl"
                style={{ maxHeight: 'calc(100vh - 48px)' }}
                onMouseDown={(e) => e.stopPropagation()}
            >
                {/* ═══════════════════════════════════════════
            HEADER — Compact mobile-first hero (non-scrollable)
           ═══════════════════════════════════════════ */}
                <aside className="flex shrink-0 flex-col border-b border-slate-100 bg-white sm:max-h-full sm:overflow-y-auto sm:border-b-0 sm:border-r">
                    <div className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-4 pb-12 pt-3 sm:px-5 sm:pb-5">
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
                        <div className="relative z-10 flex items-center justify-between">
                            <div className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-md">
                                <Zap size={13} className="text-primary fill-primary" />
                                <span className="text-xs sm:text-sm font-black text-primary">
                                    {profile.matchPercentage}% {t('common.match')}
                                </span>
                            </div>
                            <button
                                onClick={onClose}
                                className="size-9 rounded-full bg-white/15 text-white hover:bg-white/25 transition-colors flex items-center justify-center"
                                aria-label={t('common.close') || 'Close'}
                            >
                                <X size={19} />
                            </button>
                        </div>
                    </div>

                    <div className="relative z-10 -mt-9 px-4 pb-4 sm:mt-0 sm:px-5 sm:pt-5">
                        <div className="flex flex-col items-center text-center">
                            <button
                                type="button"
                                onClick={() => setShowPhotoPreview(true)}
                                className="group relative size-28 overflow-hidden rounded-2xl border-[4px] border-white bg-slate-100 shadow-xl focus:outline-none focus:ring-4 focus:ring-primary/25 sm:size-44 sm:border-0"
                                aria-label={t('profile.viewPhoto') || 'View profile photo'}
                            >
                                <img
                                    src={photoUrl}
                                    alt={displayName}
                                    className={`w-full h-full object-cover transition duration-300 group-hover:scale-[1.03] ${shouldBlurPhoto ? 'scale-110 blur-2xl' : ''}`}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = fallbackAvatar;
                                    }}
                                />
                                <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-slate-950/55 px-3 py-2 text-[11px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">
                                    <Eye size={13} /> {t('common.view') || 'View'}
                                </span>
                            </button>

                            <h2 className="mt-3 max-w-full text-xl font-black leading-tight text-slate-950 sm:text-2xl">
                                {displayName}
                            </h2>
                            <div className="mt-3 flex max-w-full flex-wrap justify-center gap-1.5 sm:flex-col sm:items-stretch">
                                {quickInfo.map((item, i) => (
                                    <span
                                        key={i}
                                        className="inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold leading-snug text-slate-600 sm:justify-start sm:rounded-xl sm:px-3"
                                    >
                                        <span className="text-primary/70 shrink-0">
                                            {item.icon}
                                        </span>
                                        <span className="whitespace-normal text-left">
                                            {item.text}
                                        </span>
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="mt-5">
                            {interestState === 'sent_accepted' ||
                            interestState === 'received_accepted' ? (
                                <motion.button
                                    whileTap={BTN_TAP}
                                    onClick={() => {
                                        onClose();
                                        onNavigate?.('messages');
                                    }}
                                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-600"
                                >
                                    <MessageSquare size={17} /> {t('profile.interestAccepted')}
                                </motion.button>
                            ) : interestState === 'sent_pending' ? (
                                <div className="flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 py-3.5 text-sm font-black text-amber-700 shadow-sm">
                                    <Clock size={17} /> {t('profile.pendingResponse')}
                                </div>
                            ) : interestState === 'received_pending' ? (
                                <motion.button
                                    whileTap={BTN_TAP}
                                    onClick={() => {
                                        onClose();
                                        onNavigate?.('dashboard');
                                    }}
                                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-500 py-3.5 text-sm font-black text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-600"
                                >
                                    <Heart size={17} /> {t('profile.respondToInterest')}
                                </motion.button>
                            ) : (
                                <motion.button
                                    whileTap={BTN_TAP}
                                    onClick={handleSendProposal}
                                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-black text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-hover"
                                >
                                    <Send size={17} /> {t('profile.sendProposal')}
                                </motion.button>
                            )}
                        </div>

                        {!isOwnProfile && (
                            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/90 p-3">
                                <div className="mb-3 flex items-center justify-between gap-3">
                                    <span className="text-[11px] font-black uppercase tracking-wide text-slate-400">
                                        {t('profile.safetyActions')}
                                    </span>
                                    <span className="h-px flex-1 bg-slate-200" />
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                    <button
                                        onClick={handleHideFromDiscovery}
                                        disabled={hiding || removingFromShortlist}
                                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <EyeOff size={15} className="text-slate-500" />
                                        {hiding
                                            ? t('profile.blocking')
                                            : t('profile.hideFromDiscovery')}
                                    </button>
                                    <button
                                        onClick={handleRemoveFromShortlist}
                                        disabled={hiding || removingFromShortlist}
                                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <Trash2 size={15} className="text-slate-500" />
                                        {removingFromShortlist
                                            ? t('profile.removingFromShortlist')
                                            : t('profile.removeFromShortlist')}
                                    </button>
                                    <button
                                        onClick={() => setShowReportModal(true)}
                                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-bold text-red-700 hover:bg-red-100"
                                    >
                                        <Flag size={15} />
                                        {t('profile.reportProfile')}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                </aside>

                <main className="flex min-h-0 flex-1 flex-col bg-slate-50/80">
                    <div className="shrink-0 border-b border-slate-100 bg-white px-4 sm:px-6">
                        <div className="flex items-stretch gap-2 overflow-x-auto scrollbar-hide">
                        <button
                            onClick={() => setActiveTab('about')}
                            className={`flex-1 sm:flex-none sm:px-5 py-3 text-xs sm:text-sm font-black border-b-2 transition-colors text-center ${
                                activeTab === 'about'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            {t('profile.profileDetails')}
                        </button>
                        <button
                            onClick={() => setActiveTab('compatibility')}
                            className={`flex-1 sm:flex-none sm:px-5 py-3 text-xs sm:text-sm font-black border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                                activeTab === 'compatibility'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            <BrainCircuit size={14} />
                            {t('profile.compatibility')}
                        </button>
                        {onRequestMediaAccess && (
                            <button
                                onClick={() => onRequestMediaAccess(profile, 'gallery')}
                                className="flex-1 sm:flex-none sm:px-5 py-3 text-xs sm:text-sm font-black border-b-2 border-transparent text-slate-500 hover:text-slate-700 transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
                                title={galleryAccessLabel}
                            >
                                <ImageIcon size={14} />
                                {galleryAccessLabel}
                            </button>
                        )}
                        </div>
                    </div>

                {/* ═══════════════════════════════════════════
            SCROLLABLE CONTENT AREA
           ═══════════════════════════════════════════ */}
                <div
                    className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-slate-50/80"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                >
                    {loading ? (
                        <div className="h-48 flex flex-col items-center justify-center gap-3">
                            <Loader2 className="animate-spin text-primary" size={28} />
                            <p className="text-slate-400 text-sm">{t('profile.loadingProfile')}</p>
                        </div>
                    ) : error ? (
                        <div className="h-48 flex flex-col items-center justify-center gap-3 text-center px-6">
                            <div className="size-11 bg-red-50 text-red-400 rounded-full flex items-center justify-center">
                                <AlertTriangle size={22} />
                            </div>
                            <p className="text-slate-500 text-sm">{error}</p>
                        </div>
                    ) : activeTab === 'about' ? (
                        <div className="space-y-3 p-4 sm:p-6">
                            {/* About */}
                            {introduction && (
                                <Section title={t('profile.about')} icon={<BookOpen size={15} />}>
                                    <p className="text-sm sm:text-[15px] text-slate-600 leading-relaxed">
                                        {introduction}
                                    </p>
                                </Section>
                            )}

                            {/* Voice Introduction */}
                            {profileData?.voice_intro_url && (
                                <Section
                                    title={t('profile.voiceIntroduction')}
                                    icon={<Mic size={15} />}
                                >
                                    <VoiceIntroPlayer
                                        url={profileData.voice_intro_url}
                                        name={displayName}
                                    />
                                </Section>
                            )}

                            {/* Basic Information */}
                            {basicInfo &&
                                hasAnyValue(basicInfo, [
                                    'gender',
                                    'age',
                                    'religion',
                                    'caste',
                                    'maritial_status',
                                    'no_of_children',
                                ]) && (
                                    <Section
                                        title={t('profile.basicInformation')}
                                        icon={<Users size={15} />}
                                    >
                                        <InfoGrid>
                                            <InfoItem label="Gender" value={basicInfo.gender} />
                                            <InfoItem
                                                label="Age"
                                                value={
                                                    Number(basicInfo.age) > 0
                                                        ? `${basicInfo.age} years`
                                                        : null
                                                }
                                            />
                                            <InfoItem label="Religion" value={basicInfo.religion} />
                                            <InfoItem label="Caste" value={basicInfo.caste} />
                                            <InfoItem
                                                label="Marital Status"
                                                value={basicInfo.maritial_status}
                                            />
                                            <InfoItem
                                                label="Children"
                                                value={basicInfo.no_of_children}
                                            />
                                        </InfoGrid>
                                    </Section>
                                )}

                            {/* Education */}
                            {education && education.length > 0 && (
                                <Section
                                    title={t('profile.education')}
                                    icon={<GraduationCap size={15} />}
                                >
                                    <div className="space-y-2">
                                        {education.map((edu: any, idx: number) => (
                                            <div
                                                key={idx}
                                                className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl"
                                            >
                                                <div className="size-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                                                    <GraduationCap size={14} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-semibold text-[13px] text-slate-900 truncate">
                                                        {edu.degree || 'Degree'}
                                                    </p>
                                                    {edu.institution && (
                                                        <p className="text-xs text-slate-500 truncate">
                                                            {edu.institution}
                                                        </p>
                                                    )}
                                                    {edu.start && (
                                                        <p className="text-[11px] text-slate-400 mt-0.5">
                                                            {edu.start}
                                                            {edu.end ? ` – ${edu.end}` : ''}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Section>
                            )}

                            {/* Career */}
                            {career && career.length > 0 && (
                                <Section title={t('profile.career')} icon={<Briefcase size={15} />}>
                                    <div className="space-y-2">
                                        {career.map((c: any, idx: number) => (
                                            <div
                                                key={idx}
                                                className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl"
                                            >
                                                <div className="size-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                                                    <Briefcase size={14} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-semibold text-[13px] text-slate-900 truncate">
                                                        {c.designation || 'Position'}
                                                    </p>
                                                    {c.company && (
                                                        <p className="text-xs text-slate-500 truncate">
                                                            {c.company}
                                                        </p>
                                                    )}
                                                    {c.start && (
                                                        <p className="text-[11px] text-slate-400 mt-0.5">
                                                            {c.start}
                                                            {c.end ? ` – ${c.end}` : ' – Present'}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Section>
                            )}

                            {/* Physical Attributes */}
                            {physical &&
                                hasAnyValue(physical, [
                                    'height',
                                    'weight',
                                    'eye_color',
                                    'hair_color',
                                    'body_type',
                                    'complexion',
                                    'blood_group',
                                    'disability',
                                ]) && (
                                    <Section
                                        title={t('profile.physicalAttributes')}
                                        icon={<Ruler size={15} />}
                                    >
                                        <InfoGrid>
                                            <InfoItem
                                                label="Height"
                                                value={
                                                    physical.height ? `${physical.height} cm` : null
                                                }
                                            />
                                            <InfoItem
                                                label="Weight"
                                                value={
                                                    physical.weight ? `${physical.weight} kg` : null
                                                }
                                            />
                                            <InfoItem
                                                label="Eye Color"
                                                value={physical.eye_color}
                                            />
                                            <InfoItem
                                                label="Hair Color"
                                                value={physical.hair_color}
                                            />
                                            <InfoItem
                                                label="Body Type"
                                                value={physical.body_type}
                                            />
                                            <InfoItem
                                                label="Complexion"
                                                value={physical.complexion}
                                            />
                                            <InfoItem
                                                label="Blood Group"
                                                value={physical.blood_group}
                                            />
                                            <InfoItem
                                                label="Disability"
                                                value={physical.disability}
                                            />
                                        </InfoGrid>
                                    </Section>
                                )}

                            {/* Religious Background */}
                            {spiritual &&
                                hasAnyValue(spiritual, [
                                    'religion',
                                    'caste',
                                    'sub_caste',
                                    'ethnicity',
                                ]) && (
                                    <Section
                                        title={t('profile.religiousBackground')}
                                        icon={<Moon size={15} />}
                                    >
                                        <InfoGrid>
                                            <InfoItem label="Religion" value={spiritual.religion} />
                                            <InfoItem label="Caste" value={spiritual.caste} />
                                            <InfoItem
                                                label="Sub Caste"
                                                value={spiritual.sub_caste}
                                            />
                                            <InfoItem
                                                label="Ethnicity"
                                                value={spiritual.ethnicity}
                                            />
                                        </InfoGrid>
                                    </Section>
                                )}

                            {/* Residence */}
                            {residence &&
                                hasAnyValue(residence, [
                                    'country',
                                    'state',
                                    'city',
                                    'nationality',
                                    'born_in',
                                    'grew_up_in',
                                ]) && (
                                    <Section
                                        title={t('profile.residence')}
                                        icon={<Home size={15} />}
                                    >
                                        <InfoGrid>
                                            <InfoItem label="Country" value={residence.country} />
                                            <InfoItem label="State" value={residence.state} />
                                            <InfoItem label="City" value={residence.city} />
                                            <InfoItem
                                                label="Nationality"
                                                value={residence.nationality}
                                            />
                                            <InfoItem label="Born In" value={residence.born_in} />
                                            <InfoItem
                                                label="Grew Up In"
                                                value={residence.grew_up_in}
                                            />
                                        </InfoGrid>
                                    </Section>
                                )}

                            {/* Family */}
                            {family &&
                                hasAnyValue(family, [
                                    'father',
                                    'mother',
                                    'siblings',
                                    'family_type',
                                    'family_value',
                                    'family_status',
                                ]) && (
                                    <Section
                                        title={t('profile.familyInformation')}
                                        icon={<Users size={15} />}
                                    >
                                        <InfoGrid>
                                            <InfoItem label="Father" value={family.father} />
                                            <InfoItem label="Mother" value={family.mother} />
                                            <InfoItem label="Siblings" value={family.siblings} />
                                            <InfoItem
                                                label="Family Type"
                                                value={family.family_type}
                                            />
                                            <InfoItem
                                                label="Family Values"
                                                value={family.family_value}
                                            />
                                            <InfoItem
                                                label="Family Status"
                                                value={family.family_status}
                                            />
                                        </InfoGrid>
                                    </Section>
                                )}

                            {/* Lifestyle */}
                            {lifestyle &&
                                hasAnyValue(lifestyle, [
                                    'diet',
                                    'drink',
                                    'smoke',
                                    'living_with',
                                ]) && (
                                    <Section
                                        title={t('profile.lifestyle')}
                                        icon={<Star size={15} />}
                                    >
                                        <InfoGrid>
                                            <InfoItem label="Diet" value={lifestyle.diet} />
                                            <InfoItem label="Drink" value={lifestyle.drink} />
                                            <InfoItem label="Smoke" value={lifestyle.smoke} />
                                            <InfoItem
                                                label="Living With"
                                                value={lifestyle.living_with}
                                            />
                                        </InfoGrid>
                                    </Section>
                                )}

                            {/* Hobbies & Interests */}
                            {hobbies &&
                                hasAnyValue(hobbies, [
                                    'hobbies',
                                    'interests',
                                    'music',
                                    'books',
                                    'movies',
                                    'sports',
                                    'cuisine',
                                    'dress_style',
                                ]) && (
                                    <Section
                                        title={t('profile.hobbiesAndInterests')}
                                        icon={<Heart size={15} />}
                                    >
                                        <InfoGrid>
                                            <InfoItem label="Hobbies" value={hobbies.hobbies} />
                                            <InfoItem label="Interests" value={hobbies.interests} />
                                            <InfoItem label="Music" value={hobbies.music} />
                                            <InfoItem label="Books" value={hobbies.books} />
                                            <InfoItem label="Movies" value={hobbies.movies} />
                                            <InfoItem label="Sports" value={hobbies.sports} />
                                            <InfoItem label="Cuisine" value={hobbies.cuisine} />
                                            <InfoItem
                                                label="Dress Style"
                                                value={hobbies.dress_style}
                                            />
                                        </InfoGrid>
                                    </Section>
                                )}

                            {/* Partner Expectations */}
                            {partnerExpectation &&
                                hasAnyValue(partnerExpectation, [
                                    'min_age',
                                    'max_age',
                                    'height',
                                    'weight',
                                    'religion_id',
                                    'caste_id',
                                    'residence_country_id',
                                    'marital_status',
                                    'education',
                                    'profession',
                                    'smoking_acceptable',
                                    'drinking_acceptable',
                                    'family_value_id',
                                    'general',
                                ]) && (
                                    <Section
                                        title={t('profile.partnerExpectations')}
                                        icon={<Heart size={15} className="text-pink-500" />}
                                    >
                                        <InfoGrid>
                                            <InfoItem
                                                label="Age Range"
                                                value={
                                                    partnerExpectation.min_age &&
                                                    partnerExpectation.max_age
                                                        ? `${partnerExpectation.min_age} – ${partnerExpectation.max_age} yrs`
                                                        : null
                                                }
                                            />
                                            <InfoItem
                                                label="Height"
                                                value={
                                                    partnerExpectation.height
                                                        ? `${partnerExpectation.height} cm`
                                                        : null
                                                }
                                            />
                                            <InfoItem
                                                label="Weight"
                                                value={
                                                    partnerExpectation.weight
                                                        ? `${partnerExpectation.weight} kg`
                                                        : null
                                                }
                                            />
                                            <InfoItem
                                                label="Religion"
                                                value={partnerExpectation.religion_id}
                                            />
                                            <InfoItem
                                                label="Caste"
                                                value={partnerExpectation.caste_id}
                                            />
                                            <InfoItem
                                                label="Residence"
                                                value={partnerExpectation.residence_country_id}
                                            />
                                            <InfoItem
                                                label="Marital Status"
                                                value={partnerExpectation.marital_status}
                                            />
                                            <InfoItem
                                                label="Education"
                                                value={partnerExpectation.education}
                                            />
                                            <InfoItem
                                                label="Profession"
                                                value={partnerExpectation.profession}
                                            />
                                            <InfoItem
                                                label="Smoking"
                                                value={partnerExpectation.smoking_acceptable}
                                            />
                                            <InfoItem
                                                label="Drinking"
                                                value={partnerExpectation.drinking_acceptable}
                                            />
                                            <InfoItem
                                                label="Family Value"
                                                value={partnerExpectation.family_value_id}
                                            />
                                        </InfoGrid>
                                        {partnerExpectation.general && (
                                            <div className="mt-3 p-4 bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl border border-pink-100">
                                                <p className="text-[11px] font-semibold text-pink-400 uppercase tracking-wider mb-1.5">
                                                    {t('profile.idealPartner')}
                                                </p>
                                                <p className="text-[13px] text-slate-700 leading-relaxed italic">
                                                    "{partnerExpectation.general}"
                                                </p>
                                            </div>
                                        )}
                                    </Section>
                                )}

                            {/* Gallery */}
                            {(visibleGallery.length > 0 || blurredGallery.length > 0) && (
                                <Section title={t('profile.gallery')} icon={<Eye size={15} />}>
                                    <div className="grid grid-cols-3 gap-1.5">
                                        {/* Visible (public) photos */}
                                        {visibleGallery.map((img: any, idx: number) => (
                                            <div
                                                key={`v-${idx}`}
                                                className="aspect-square rounded-lg overflow-hidden bg-slate-100 relative"
                                            >
                                                <img
                                                    src={img.image}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                />
                                                {/* Screenshot deterrence watermark */}
                                                {screenshotDeterrence && (
                                                    <div
                                                        className="absolute inset-0 pointer-events-none overflow-hidden select-none"
                                                        style={{ zIndex: 2 }}
                                                    >
                                                        <div
                                                            className="absolute inset-[-50%] flex items-center justify-center"
                                                            style={{
                                                                transform: 'rotate(-30deg)',
                                                                width: '200%',
                                                                height: '200%',
                                                            }}
                                                        >
                                                            <div
                                                                className="w-full h-full flex flex-wrap items-start justify-start gap-6 p-3"
                                                                style={{ opacity: 0.07 }}
                                                            >
                                                                {Array.from({ length: 16 }).map(
                                                                    (_, i) => (
                                                                        <span
                                                                            key={i}
                                                                            className="text-white text-[9px] font-bold whitespace-nowrap tracking-wider"
                                                                        >
                                                                            DMB PROTECTED
                                                                        </span>
                                                                    ),
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {/* Blurred (private) photos */}
                                        {blurredGallery.map((img: any, idx: number) => (
                                            <div
                                                key={`b-${idx}`}
                                                className="aspect-square rounded-lg overflow-hidden bg-slate-200 relative"
                                            >
                                                <img
                                                    src={img.thumbnail}
                                                    alt=""
                                                    className="w-full h-full object-cover scale-110"
                                                    style={{ filter: 'blur(20px)' }}
                                                />
                                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/10">
                                                    <Lock
                                                        size={16}
                                                        className="text-white/70 mb-1"
                                                    />
                                                    <span className="text-[9px] font-bold text-white/60 uppercase tracking-wider">
                                                        Private
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {lockedCount > 0 && (
                                        <div className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 py-1">
                                            <Lock size={11} />
                                            <span>
                                                {lockedCount}{' '}
                                                {t('profile.photosLocked', { count: lockedCount })}
                                            </span>
                                        </div>
                                    )}
                                    {onRequestMediaAccess && hasLockedGallery && (
                                        <button
                                            onClick={() => onRequestMediaAccess(profile, 'gallery')}
                                            className="mt-3 w-full sm:w-auto sm:px-4 py-2 rounded-xl border border-primary/15 bg-primary/5 text-primary font-bold text-sm hover:bg-primary/10 transition-colors"
                                        >
                                            {galleryRequestAccessible
                                                ? t('discovery.manageMediaAccess')
                                                : galleryRequestState === 'pending'
                                                  ? t('discovery.galleryAccessRequested')
                                                  : t('discovery.requestMediaAccess')}
                                        </button>
                                    )}
                                </Section>
                            )}

                            {/* Gallery — only locked images, no visible ones */}
                            {visibleGallery.length === 0 &&
                                blurredGallery.length === 0 &&
                                lockedCount > 0 && (
                                    <Section title={t('profile.gallery')} icon={<Eye size={15} />}>
                                        <div className="flex items-center justify-center gap-2 text-sm text-slate-400 py-6 bg-slate-50 rounded-xl">
                                            <Lock size={14} />
                                            <span>
                                                {lockedCount}{' '}
                                                {t('profile.photosLocked', { count: lockedCount })}
                                            </span>
                                        </div>
                                        {onRequestMediaAccess && (
                                            <button
                                                onClick={() =>
                                                    onRequestMediaAccess(profile, 'gallery')
                                                }
                                                className="mt-3 w-full sm:w-auto sm:px-4 py-2 rounded-xl border border-primary/15 bg-primary/5 text-primary font-bold text-sm hover:bg-primary/10 transition-colors"
                                            >
                                                {galleryRequestAccessible
                                                    ? t('discovery.manageMediaAccess')
                                                    : galleryRequestState === 'pending'
                                                      ? t('discovery.galleryAccessRequested')
                                                      : t('discovery.requestMediaAccess')}
                                            </button>
                                        )}
                                    </Section>
                                )}
                        </div>
                    ) : (
                        /* ═══════════════════════════════════════
               COMPATIBILITY TAB
               ═══════════════════════════════════════ */
                        <div className="p-4 sm:p-5">
                            {intelLoading ? (
                                <div className="h-48 flex flex-col items-center justify-center gap-3">
                                    <Loader2 className="animate-spin text-primary" size={28} />
                                    <p className="text-slate-400 text-sm">
                                        {t('profile.analyzingCompatibility')}
                                    </p>
                                </div>
                            ) : intelError || !intelligence ? (
                                <div className="h-48 flex flex-col items-center justify-center gap-3 text-center px-6">
                                    <div className="size-11 bg-red-50 text-red-400 rounded-full flex items-center justify-center">
                                        <AlertTriangle size={22} />
                                    </div>
                                    <p className="text-slate-500 text-sm">
                                        {intelError || t('profile.failedToLoadCompatibility')}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    {/* Score ring */}
                                    <div className="flex flex-col items-center text-center">
                                        <div className="relative size-28 sm:size-32 mb-3">
                                            <svg
                                                className="size-full -rotate-90"
                                                viewBox="0 0 36 36"
                                            >
                                                <path
                                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                    fill="none"
                                                    stroke="#f1f5f9"
                                                    strokeWidth="3"
                                                />
                                                <path
                                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                    fill="none"
                                                    stroke="#d41173"
                                                    strokeWidth="3"
                                                    strokeDasharray={`${intelligence.totalScore}, 100`}
                                                />
                                            </svg>
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                                                <span className="text-2xl sm:text-3xl font-black text-slate-900">
                                                    {intelligence.totalScore}%
                                                </span>
                                                <span className="text-[9px] font-bold text-primary uppercase tracking-wider">
                                                    {t('profile.compatible')}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="w-full max-w-xs space-y-2.5">
                                            {intelligence.categories.map(
                                                (cat: any, idx: number) => (
                                                    <div key={idx}>
                                                        <div className="flex justify-between items-end mb-0.5">
                                                            <span className="text-[11px] font-semibold text-slate-600">
                                                                {cat.name}
                                                            </span>
                                                            <span className="text-[11px] font-bold text-slate-800">
                                                                {cat.score}%
                                                            </span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all duration-500 ${
                                                                    cat.score >= 80
                                                                        ? 'bg-green-500'
                                                                        : cat.score >= 60
                                                                          ? 'bg-amber-500'
                                                                          : 'bg-red-400'
                                                                }`}
                                                                style={{ width: `${cat.score}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </div>

                                    {/* Mutual Fit */}
                                    <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                                        <div className="flex items-center gap-2 mb-2.5">
                                            <ArrowLeftRight size={14} className="text-slate-500" />
                                            <h3 className="font-bold text-slate-900 text-[13px]">
                                                {t('profile.mutualPreferenceFit')}
                                            </h3>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 text-center">
                                                <div className="text-lg font-bold text-slate-900">
                                                    {intelligence.mutualFit.youMeetThem}%
                                                </div>
                                                <div className="text-[11px] text-slate-500 leading-tight">
                                                    {t('profile.youMeetTheirCriteria')}
                                                </div>
                                            </div>
                                            <div className="h-7 w-px bg-slate-200" />
                                            <div className="flex-1 text-center">
                                                <div className="text-lg font-bold text-slate-900">
                                                    {intelligence.mutualFit.theyMeetYou}%
                                                </div>
                                                <div className="text-[11px] text-slate-500 leading-tight">
                                                    {t('profile.theyMeetYourCriteria')}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Top Reasons */}
                                    {intelligence.topReasons.length > 0 && (
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-[13px] mb-2 flex items-center gap-2">
                                                <Zap
                                                    size={13}
                                                    className="text-yellow-500 fill-yellow-500"
                                                />
                                                {t('profile.topReasonsCompatible')}
                                            </h3>
                                            <ul className="space-y-1.5">
                                                {intelligence.topReasons.map(
                                                    (reason: string, idx: number) => (
                                                        <li
                                                            key={idx}
                                                            className="flex items-start gap-2 text-[13px] text-slate-700"
                                                        >
                                                            <CheckCircle2
                                                                size={14}
                                                                className="text-green-500 shrink-0 mt-0.5"
                                                            />
                                                            {reason}
                                                        </li>
                                                    ),
                                                )}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Friction Points */}
                                    {intelligence.frictionPoints.length > 0 && (
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="font-bold text-slate-900 text-[13px] flex items-center gap-2">
                                                    <AlertTriangle
                                                        size={13}
                                                        className="text-orange-500"
                                                    />
                                                    {t('profile.potentialFrictionPoints')}
                                                </h3>
                                                <button
                                                    onClick={() => setShowFriction(!showFriction)}
                                                    className="text-xs font-bold text-primary hover:underline"
                                                >
                                                    {showFriction ? 'Hide' : 'View'}
                                                </button>
                                            </div>
                                            <div
                                                className={`transition-all duration-300 ${showFriction ? 'opacity-100' : 'opacity-50 blur-sm select-none'}`}
                                            >
                                                <ul className="space-y-1.5">
                                                    {intelligence.frictionPoints.map(
                                                        (point: string, idx: number) => (
                                                            <li
                                                                key={idx}
                                                                className="flex items-start gap-2 text-[13px] text-slate-600"
                                                            >
                                                                <div className="size-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                                                                {point}
                                                            </li>
                                                        ),
                                                    )}
                                                </ul>
                                            </div>
                                        </div>
                                    )}

                                    {/* Agent Notes */}
                                    {intelligence.agentNotes && (
                                        <div className="bg-purple-50 border border-purple-100 rounded-xl p-3.5">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <UserCheck size={14} className="text-purple-600" />
                                                <h3 className="font-bold text-purple-900 text-[13px]">
                                                    {t('profile.matchmakersNote')}
                                                </h3>
                                            </div>
                                            <p className="text-[13px] text-purple-800 italic leading-relaxed">
                                                "{intelligence.agentNotes}"
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
                </main>
            </div>
            {showPhotoPreview && (
                <div
                    className="fixed inset-0 z-[70] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) setShowPhotoPreview(false);
                    }}
                >
                    <button
                        onClick={() => setShowPhotoPreview(false)}
                        className="absolute right-4 top-4 size-10 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors flex items-center justify-center"
                        aria-label={t('common.close') || 'Close'}
                    >
                        <X size={22} />
                    </button>
                    <div className="max-h-[86vh] max-w-[92vw] rounded-2xl overflow-hidden bg-slate-900 shadow-2xl border border-white/10">
                        <img
                            src={photoUrl}
                            alt={displayName}
                            className={`max-h-[86vh] max-w-[92vw] object-contain ${shouldBlurPhoto ? 'scale-110 blur-2xl' : ''}`}
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = fallbackAvatar;
                            }}
                        />
                    </div>
                </div>
            )}
            {!isOwnProfile && showReportModal && (
                <ReportModal
                    onClose={() => setShowReportModal(false)}
                    userName={displayName}
                    userId={profile.id}
                    defaultBlockUser={false}
                />
            )}
        </div>
    );
};

/* ════════════════════════════════════════════════════════════
   HELPER COMPONENTS
   ════════════════════════════════════════════════════════════ */

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({
    title,
    icon,
    children,
}) => (
    <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm shadow-slate-200/30 sm:p-4">
        <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-primary">
                {icon}
            </span>
            <h3 className="text-sm font-black text-slate-900">{title}</h3>
        </div>
        {children}
    </div>
);

const InfoGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const validChildren = React.Children.toArray(children).filter(Boolean);
    if (validChildren.length === 0) return null;
    return (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {validChildren}
        </div>
    );
};

const InfoItem: React.FC<{ label: string; value: any }> = ({ label, value }) => {
    if (value === null || value === undefined || value === '' || value === 'N/A' || value === 0)
        return null;
    const displayValue = typeof value === 'object' && value?.name ? value.name : String(value);
    if (!displayValue || displayValue === '' || displayValue === 'N/A') return null;

    return (
        <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
            <p className="mb-1 text-[10px] font-black uppercase tracking-wide text-primary/70">
                {label}
            </p>
            <p className="break-words text-sm font-semibold leading-snug text-slate-800">
                {displayValue}
            </p>
        </div>
    );
};

const VoiceIntroPlayer: React.FC<{ url: string; name: string }> = ({ url, name: _name }) => {
    const { t } = useTranslation();
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const audioRef = React.useRef<HTMLAudioElement>(null);

    // Debug logging
    React.useEffect(() => {
        console.log('VoiceIntroPlayer initialized:', { url, isUrl: !!url, length: url?.length });
    }, [url]);

    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio || error) return;
        if (isPlaying) {
            audio.pause();
        } else {
            console.log('Attempting to play audio:', url);
            audio.play().catch((err) => {
                console.error('Voice intro playback error:', err);
                setError('Unable to play voice introduction');
            });
        }
    };

    const formatTime = (sec: number) => {
        if (!sec || !isFinite(sec) || isNaN(sec)) return '0:00';
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            const dur = audioRef.current.duration;
            // Some browsers return Infinity for certain audio formats (e.g. WebM w/o duration header)
            if (isFinite(dur) && !isNaN(dur) && dur > 0) {
                setDuration(dur);
            } else {
                // Fallback: try to discover duration by seeking to a large time
                audioRef.current.currentTime = 1e10;
                audioRef.current.addEventListener(
                    'timeupdate',
                    function seekHandler() {
                        if (audioRef.current) {
                            const realDur = audioRef.current.duration;
                            if (isFinite(realDur) && !isNaN(realDur) && realDur > 0) {
                                setDuration(realDur);
                            }
                            audioRef.current.currentTime = 0;
                            audioRef.current.removeEventListener('timeupdate', seekHandler);
                        }
                    },
                    { once: true },
                );
            }
            setIsLoading(false);
            console.log('Voice intro loaded successfully:', {
                url,
                duration: audioRef.current.duration,
            });
        }
    };

    const handleError = (e: any) => {
        console.error('Voice intro load error:', {
            url,
            errorCode: e.target?.error?.code,
            errorMsg: e.target?.error?.message,
            error: e,
        });
        setIsLoading(false);
        setError('Unable to load voice introduction');
    };

    return (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100/50">
            <audio
                ref={audioRef}
                src={url}
                preload="metadata"
                crossOrigin="anonymous"
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={() => {
                    if (audioRef.current) {
                        setCurrentTime(audioRef.current.currentTime);
                        setProgress(
                            audioRef.current.duration
                                ? (audioRef.current.currentTime / audioRef.current.duration) * 100
                                : 0,
                        );
                    }
                }}
                onPlay={() => {
                    setIsPlaying(true);
                    setError(null);
                }}
                onPause={() => setIsPlaying(false)}
                onEnded={() => {
                    setIsPlaying(false);
                    setProgress(0);
                    setCurrentTime(0);
                }}
                onError={handleError}
            />

            {error ? (
                <div className="flex items-center gap-3">
                    <AlertTriangle size={18} className="text-red-500 shrink-0" />
                    <div>
                        <p className="text-xs font-semibold text-red-600">
                            {t('common.error') || 'Error'}
                        </p>
                        <p className="text-[12px] text-red-500">{error}</p>
                    </div>
                </div>
            ) : (
                <div className="flex items-center gap-3">
                    <button
                        onClick={togglePlay}
                        disabled={isLoading}
                        className={`size-10 rounded-full flex items-center justify-center shadow-lg transition-all shrink-0 ${
                            isLoading
                                ? 'bg-purple-300 cursor-not-allowed'
                                : 'bg-purple-600 hover:bg-purple-700 text-white cursor-pointer'
                        }`}
                    >
                        {isLoading ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : isPlaying ? (
                            <Pause size={16} fill="white" />
                        ) : (
                            <Play size={16} fill="white" className="ml-0.5" />
                        )}
                    </button>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-1.5">
                                <Volume2 size={12} className="text-purple-500" />
                                <span className="text-xs font-semibold text-purple-700">
                                    {t('profile.voiceIntroduction')}
                                </span>
                            </div>
                            <span className="text-[10px] text-purple-400 font-medium tabular-nums">
                                {formatTime(currentTime)} / {formatTime(duration || 0)}
                            </span>
                        </div>
                        <div
                            className={`h-1.5 bg-purple-100 rounded-full overflow-hidden ${!isLoading ? 'cursor-pointer' : ''}`}
                            onClick={(e) => {
                                if (!audioRef.current || !duration || isLoading) return;
                                const rect = e.currentTarget.getBoundingClientRect();
                                const pct = (e.clientX - rect.left) / rect.width;
                                audioRef.current.currentTime = pct * duration;
                            }}
                        >
                            <div
                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-100"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileDetailModal;
