import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Search,
    MapPin,
    Heart,
    X,
    ChevronDown,
    Eye,
    EyeOff,
    Map as MapIcon,
    Zap,
    Plane,
    Filter,
    Bell,
    UserCheck,
    Send,
    Loader2,
    MessageSquare,
    Clock,
    CheckCircle2,
    Camera,
    Bookmark,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import ProfileDetailModal from './ProfileDetailModal';
import MediaAccessRequestModal from './MediaAccessRequestModal';
import MatchTunerModal from './MatchTunerModal';
import LanguageToggle from './LanguageToggle';
import { ProfileMatch } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { STAGGER_CONTAINER, FADE_UP_ITEM, BTN_TAP } from '../utils/motion';
import { normalizePositiveAge } from '../utils/age';
import { api } from '../utils/api';
import { useAuthStore } from '../src/stores/authStore';
import {
    CanonicalInterestState,
    getInterestFlagsFromState,
    resolveInterestState,
} from '../utils/interestStatus';
import {
    MediaAccessBundle,
    MediaAccessSnapshot,
    resolveMediaAccessBundle,
} from '../utils/mediaAccess';

// API base URL for assets
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

const resolveAvatarUrl = (value?: string | null): string => {
    const candidate = `${value ?? ''}`.trim();
    if (!candidate) return DEFAULT_AVATAR;
    if (candidate.startsWith('http://') || candidate.startsWith('https://')) return candidate;
    if (candidate.startsWith('//')) return `https:${candidate}`;
    if (candidate.startsWith('/')) return `${API_BASE}${candidate}`;
    return `${API_BASE}/${candidate.replace(/^\/+/, '')}`;
};

const unwrapList = <T,>(payload: any): T[] => {
    if (Array.isArray(payload)) return payload as T[];
    if (Array.isArray(payload?.data)) return payload.data as T[];
    if (Array.isArray(payload?.data?.data)) return payload.data.data as T[];
    return [];
};

interface DiscoveryViewProps {
    onSendProposal: (profile: ProfileMatch) => void;
    onProposalStateChange?: (profileId: string, state: CanonicalInterestState) => void;
    initialTab?: 'all' | 'verified' | 'unverified' | 'bookmarked';
    isIdentityVerified?: boolean | null;
    onRequireVerification?: () => void;
    onNavigate?: (view: string) => void;
    unreadNotifCount?: number;
    sentProposalMap?: Record<string, boolean>;
    proposalStatusMap?: Record<string, CanonicalInterestState>;
    refreshVersion?: number;
}

const getInterestFlags = (profile: ProfileMatch, isLocallySent = false) =>
    getInterestFlagsFromState(
        resolveInterestState(profile.interestStatus, profile.interestText, {
            localSent: isLocallySent,
        }),
    );

const isProfileBookmarked = (profile: ProfileMatch): boolean =>
    Number(profile.shortlistStatus) === 0;

type MediaAccessStateMap = Record<string, MediaAccessBundle>;

const normalizeProfile = (profile: any): ProfileMatch => {
    const fullName =
        profile.name || [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim();
    const gender = profile.gender;
    const fallbackAvatar = isFemaleProfile(gender) ? DEFAULT_FEMALE_AVATAR : DEFAULT_AVATAR;
    let avatarUrl = profile.avatarUrl ?? profile.photo ?? '';
    const mediaAccess = resolveMediaAccessBundle(profile);
    // If avatarUrl is empty, numeric, or doesn't look like a URL, use fallback
    if (
        !avatarUrl ||
        avatarUrl === '' ||
        (!avatarUrl.startsWith('http') && !avatarUrl.startsWith('/'))
    ) {
        avatarUrl = fallbackAvatar;
    }
    avatarUrl = swapAvatarForGender(avatarUrl, gender);

    return {
        id: String(profile.id ?? profile.user_id ?? profile.code ?? ''),
        name: fullName,
        specialty: profile.specialty ?? profile.designation ?? '',
        hospital: profile.hospital ?? profile.company ?? '',
        location: profile.location ?? profile.country ?? '',
        age: normalizePositiveAge(profile.age),
        matchPercentage: profile.matchPercentage ?? profile.match_percentage ?? 0,
        avatarUrl,
        gender,
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
        interestStatus:
            profile.interest_status ?? profile.interestStatus ?? profile.proposal_status,
        interestText: profile.interest_text ?? profile.interestText,
        shortlistStatus: profile.shortlist_status ?? profile.shortlistStatus,
        shortlistText: profile.shortlist_text ?? profile.shortlistText,
        photoRequestState: mediaAccess.profilePhoto.state,
        photoRequestText: mediaAccess.profilePhoto.text,
        photoRequestRequested: mediaAccess.profilePhoto.requested,
        photoRequestApproved: mediaAccess.profilePhoto.approved,
        photoRequestRequired: mediaAccess.profilePhoto.required,
        photoAccessible: mediaAccess.profilePhoto.accessible,
        photoExists: mediaAccess.profilePhoto.exists,
        galleryImageRequestState: mediaAccess.galleryImage.state,
        galleryImageRequestText: mediaAccess.galleryImage.text,
        galleryImageRequestRequested: mediaAccess.galleryImage.requested,
        galleryImageRequestApproved: mediaAccess.galleryImage.approved,
        galleryImageRequestRequired: mediaAccess.galleryImage.required,
        galleryImageAccessible: mediaAccess.galleryImage.accessible,
        galleryImageExists: mediaAccess.galleryImage.exists,
        profilePhotoBlur: Boolean(profile.profile_photo_blur ?? profile.profilePhotoBlur ?? false),
        travel_mode: profile.travel_mode ?? false,
        travel_city: profile.travel_city ?? '',
        travel_country: profile.travel_country ?? '',
    };
};

type DiscoveryFilters = {
    verifiedOnly: boolean;
    ageMin: string;
    ageMax: string;
    country: string;
    state: string;
    city: string;
    maritalStatus: string;
    religion: string;
    sect: string;
    caste: string;
    professionId: string;
    profession: string;
};

const DEFAULT_FILTERS: DiscoveryFilters = {
    verifiedOnly: false,
    ageMin: '',
    ageMax: '',
    country: '',
    state: '',
    city: '',
    maritalStatus: '',
    religion: '',
    sect: '',
    caste: '',
    professionId: '',
    profession: '',
};

const DiscoveryView: React.FC<DiscoveryViewProps> = ({
    onSendProposal,
    onProposalStateChange,
    initialTab = 'all',
    isIdentityVerified,
    onRequireVerification,
    onNavigate,
    unreadNotifCount = 0,
    sentProposalMap = {},
    proposalStatusMap = {},
    refreshVersion,
}) => {
    const { t } = useTranslation();
    const { user, setUser } = useAuthStore();
    const userAvatarUrl = resolveAvatarUrl(user?.avatar_original || user?.avatar);
    const userDisplayName = user?.name ?? t('nav.defaultName');
    const userMembershipLabel =
        user?.membership === 2 ? t('nav.premiumMember') : t('nav.basicMember');
    const [showFilters, setShowFilters] = useState(false);
    const [isAnonymous, setIsAnonymous] = useState(() => user?.incognito === true);
    const [anonymousLoading, setAnonymousLoading] = useState(false);
    const [isTravelMode, setIsTravelMode] = useState(() => user?.travel_mode === true);
    const [travelCity, setTravelCity] = useState(() => user?.travel_city || '');
    const [travelCountry, setTravelCountry] = useState(() => user?.travel_country || '');
    const [travelLoading, setTravelLoading] = useState(false);
    const [showTravelModal, setShowTravelModal] = useState(false);
    useEffect(() => {
        setIsAnonymous(user?.incognito === true);
    }, [user?.incognito]);
    const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
    const [selectedProfile, setSelectedProfile] = useState<ProfileMatch | null>(null);
    const [showTuner, setShowTuner] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'verified' | 'unverified' | 'bookmarked'>(
        initialTab,
    );
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<ProfileMatch[]>([]);
    const [filters, setFilters] = useState<DiscoveryFilters>(DEFAULT_FILTERS);
    const [appliedFilters, setAppliedFilters] = useState<DiscoveryFilters>(DEFAULT_FILTERS);
    const [countries, setCountries] = useState<
        Array<{ id: string | number; name: string; code?: string }>
    >([]);
    const [states, setStates] = useState<Array<{ id: string | number; name: string }>>([]);
    const [cities, setCities] = useState<Array<{ id: string | number; name: string }>>([]);
    const [maritalStatuses, setMaritalStatuses] = useState<
        Array<{ id: string | number; name: string }>
    >([]);
    const [religions, setReligions] = useState<Array<{ id: string | number; name: string }>>([]);
    const [sects, setSects] = useState<Array<{ id: string | number; name: string }>>([]);
    const [castes, setCastes] = useState<
        Array<{ id: string | number; name: string; religion_id?: string | number }>
    >([]);
    const [jobTitles, setJobTitles] = useState<Array<{ id: string | number; name: string }>>([]);
    const [mediaAccessStates, setMediaAccessStates] = useState<MediaAccessStateMap>({});
    const [mediaAccessRequesting, setMediaAccessRequesting] = useState<
        Record<string, { profilePhoto?: boolean; galleryImage?: boolean }>
    >({});
    const [showMediaAccessModal, setShowMediaAccessModal] = useState(false);
    const [mediaAccessTarget, setMediaAccessTarget] = useState<ProfileMatch | null>(null);
    const [mediaAccessPriority, setMediaAccessPriority] = useState<'photo' | 'gallery'>('photo');
    const [shortlistProcessing, setShortlistProcessing] = useState<Record<string, boolean>>({});
    const [shortlisted, setShortlisted] = useState<Record<string, boolean>>({});
    const [superLiked, setSuperLiked] = useState<Record<string, boolean>>({});
    const [profiles, setProfiles] = useState<{
        agent_picks: ProfileMatch[];
        high_intent: ProfileMatch[];
        all_profiles: ProfileMatch[];
    }>({
        agent_picks: [],
        high_intent: [],
        all_profiles: [],
    });
    const [pagination, setPagination] = useState<{
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number | null;
        to: number | null;
    }>({ current_page: 1, last_page: 1, per_page: 20, total: 0, from: null, to: null });
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const discoveryRequestSeqRef = useRef(0);
    const searchRequestSeqRef = useRef(0);
    const discoveryAbortRef = useRef<AbortController | null>(null);
    const searchAbortRef = useRef<AbortController | null>(null);

    const mergeInterest = (profile: ProfileMatch): ProfileMatch => {
        const status = proposalStatusMap[String(profile.id)];
        if (!status) return profile;

        const override = (() => {
            switch (status) {
                case 'sent_pending':
                    return { interestStatus: 'sent interest', interestText: 'Proposal Sent' };
                case 'sent_accepted':
                    return { interestStatus: 'mutual', interestText: 'Proposal Accepted' };
                case 'received_pending':
                    return { interestStatus: 'do_response', interestText: 'Reply to Proposal' };
                case 'received_accepted':
                    return { interestStatus: 'do_response', interestText: 'You Accepted Proposal' };
                default:
                    return null;
            }
        })();

        if (!override) return profile;
        return {
            ...profile,
            interestStatus: override.interestStatus,
            interestText: override.interestText ?? profile.interestText,
        };
    };

    const applyInterestStateToProfile = useCallback(
        (profile: ProfileMatch, state: CanonicalInterestState): ProfileMatch => {
            switch (state) {
                case 'sent_pending':
                    return {
                        ...profile,
                        interestStatus: 'sent interest',
                        interestText: 'Proposal Sent',
                    };
                case 'sent_accepted':
                    return {
                        ...profile,
                        interestStatus: 'mutual',
                        interestText: 'Proposal Accepted',
                    };
                case 'received_pending':
                    return {
                        ...profile,
                        interestStatus: 'do_response',
                        interestText: 'Reply to Proposal',
                    };
                case 'received_accepted':
                    return {
                        ...profile,
                        interestStatus: 'do_response',
                        interestText: 'You Accepted Proposal',
                    };
                default:
                    return profile;
            }
        },
        [],
    );

    const buildMediaAccessStateMap = useCallback((list: ProfileMatch[]) => {
        return list.reduce<MediaAccessStateMap>((acc, profile) => {
            acc[profile.id] = resolveMediaAccessBundle(profile);
            return acc;
        }, {});
    }, []);

    const buildShortlistedMap = (items: ProfileMatch[]): Record<string, boolean> => {
        return items.reduce<Record<string, boolean>>((acc, profile) => {
            if (isProfileBookmarked(profile)) {
                acc[profile.id] = true;
            }
            return acc;
        }, {});
    };

    const updateMediaAccessState = useCallback(
        (
            profile: ProfileMatch,
            kind: 'profilePhoto' | 'galleryImage',
            patch: Partial<MediaAccessSnapshot>,
        ) => {
            setMediaAccessStates((prev) => {
                const current = prev[profile.id] ?? resolveMediaAccessBundle(profile);
                return {
                    ...prev,
                    [profile.id]: {
                        ...current,
                        [kind]: {
                            ...current[kind],
                            ...patch,
                        },
                    },
                };
            });
        },
        [],
    );

    // ── Anonymous/Visible Toggle ───────────────────────────────────
    const handleToggleAnonymous = useCallback(async () => {
        if (anonymousLoading) return;
        const next = !isAnonymous;
        setAnonymousLoading(true);
        try {
            const res = await api.post('/member/profile/visibility', {
                incognito: next,
            });
            const visibilityData = res.data?.data ?? {};
            if (res.data.success) {
                const resolvedIncognito = visibilityData.incognito ?? next;
                const resolvedVisible = visibilityData.profile_visible ?? user?.is_visible ?? true;
                setIsAnonymous(resolvedIncognito);
                if (user)
                    setUser({ ...user, is_visible: resolvedVisible, incognito: resolvedIncognito });
            }
        } catch (err) {
            console.error('Failed to toggle anonymous mode', err);
        } finally {
            setAnonymousLoading(false);
        }
    }, [anonymousLoading, isAnonymous, user, setUser]);

    // ── Travel Mode Handlers ───────────────────────────────────────
    const handleEnableTravelMode = useCallback(
        async (city: string, country: string) => {
            if (travelLoading) return;
            setTravelLoading(true);
            try {
                const res = await api.post('/member/discovery/travel-mode/enable', {
                    city,
                    country,
                });
                if (res.data.success) {
                    setIsTravelMode(true);
                    setTravelCity(city);
                    setTravelCountry(country);
                    setShowTravelModal(false);
                    if (user)
                        setUser({
                            ...user,
                            travel_mode: true,
                            travel_city: city,
                            travel_country: country,
                        });
                }
            } catch (err) {
                console.error('Failed to enable travel mode', err);
            } finally {
                setTravelLoading(false);
            }
        },
        [travelLoading, user, setUser],
    );

    const handleDisableTravelMode = useCallback(async () => {
        if (travelLoading) return;
        setTravelLoading(true);
        try {
            const res = await api.post('/member/discovery/travel-mode/disable');
            if (res.data.success) {
                setIsTravelMode(false);
                setTravelCity('');
                setTravelCountry('');
                if (user)
                    setUser({
                        ...user,
                        travel_mode: false,
                        travel_city: null,
                        travel_country: null,
                    });
            }
        } catch (err) {
            console.error('Failed to disable travel mode', err);
        } finally {
            setTravelLoading(false);
        }
    }, [travelLoading, user, setUser]);

    const handleTravelModeClick = useCallback(() => {
        if (isTravelMode) {
            // Disable travel mode
            handleDisableTravelMode();
        } else {
            // Show modal to pick destination
            setShowTravelModal(true);
        }
    }, [handleDisableTravelMode, isTravelMode]);

    useEffect(() => {
        let isMounted = true;

        const loadFilterOptions = async () => {
            try {
                const [countriesRes, maritalStatusesRes, religionsRes, sectsRes, profileRes] =
                    await Promise.all([
                        api.get('/member/countries'),
                        api.get('/member/maritial-status'),
                        api.get('/member/religions'),
                        api.get('/member/sects'),
                        api.get('/full-profile'),
                    ]);

                if (!isMounted) return;

                setCountries(unwrapList(countriesRes.data));
                setMaritalStatuses(unwrapList(maritalStatusesRes.data));
                setReligions(unwrapList(religionsRes.data));
                setSects(unwrapList(sectsRes.data));

                const optionSets =
                    profileRes.data?.optionSets ?? profileRes.data?.data?.optionSets ?? {};
                setJobTitles(unwrapList(optionSets?.jobTitles));
            } catch (error) {
                if (isMounted) {
                    console.error('Failed to load discovery filter options', error);
                }
            }
        };

        loadFilterOptions();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        let isMounted = true;

        const loadStates = async () => {
            if (!filters.country) {
                setStates([]);
                setCities([]);
                return;
            }

            try {
                const response = await api.get(`/member/states/${filters.country}`);
                if (!isMounted) return;
                setStates(unwrapList(response.data));
            } catch (error) {
                if (isMounted) {
                    console.error('Failed to load province options', error);
                    setStates([]);
                    setCities([]);
                }
            }
        };

        loadStates();

        return () => {
            isMounted = false;
        };
    }, [filters.country]);

    useEffect(() => {
        let isMounted = true;

        const loadCities = async () => {
            if (!filters.state) {
                setCities([]);
                return;
            }

            try {
                const response = await api.get(`/member/cities/${filters.state}`);
                if (!isMounted) return;
                setCities(unwrapList(response.data));
            } catch (error) {
                if (isMounted) {
                    console.error('Failed to load city options', error);
                    setCities([]);
                }
            }
        };

        loadCities();

        return () => {
            isMounted = false;
        };
    }, [filters.state]);

    useEffect(() => {
        let isMounted = true;

        const loadCastes = async () => {
            if (!filters.religion) {
                setCastes([]);
                return;
            }

            try {
                const response = await api.get(`/member/casts/${filters.religion}`);
                if (!isMounted) return;
                setCastes(unwrapList(response.data));
            } catch (error) {
                if (isMounted) {
                    console.error('Failed to load caste options', error);
                    setCastes([]);
                }
            }
        };

        loadCastes();

        return () => {
            isMounted = false;
        };
    }, [filters.religion]);

    const fetchDiscoveryData = useCallback(
        async (page: number = 1, tab: 'all' | 'verified' | 'unverified' | 'bookmarked' = 'all') => {
            const requestSeq = ++discoveryRequestSeqRef.current;
            searchAbortRef.current?.abort();
            discoveryAbortRef.current?.abort();
            const controller = new AbortController();
            discoveryAbortRef.current = controller;

            setLoading(true);
            try {
                const params: Record<string, string | number> = { page };
                if (tab === 'verified') params.verified = 'yes';
                else if (tab === 'unverified') params.verified = 'no';
                else if (tab === 'bookmarked') params.bookmarked = 'yes';

                const response = await api.get('/discovery', { params, signal: controller.signal });
                if (requestSeq !== discoveryRequestSeqRef.current) return;

                if (response.data.result) {
                    const data = response.data.data || {};
                    const normalized = {
                        agent_picks: (data.agent_picks || []).map(normalizeProfile),
                        high_intent: (data.high_intent || []).map(normalizeProfile),
                        all_profiles: (data.all_profiles || []).map(normalizeProfile),
                    };
                    setProfiles(normalized);
                    const bookmarkedProfiles = buildShortlistedMap([
                        ...normalized.agent_picks,
                        ...normalized.high_intent,
                        ...normalized.all_profiles,
                    ]);
                    setShortlisted((prev) => ({ ...prev, ...bookmarkedProfiles }));
                    const mediaStates = buildMediaAccessStateMap([
                        ...normalized.agent_picks,
                        ...normalized.high_intent,
                        ...normalized.all_profiles,
                    ]);
                    setMediaAccessStates((prev) => ({ ...prev, ...mediaStates }));

                    if (response.data.pagination) {
                        setPagination(response.data.pagination);
                    }

                    const allProfiles = [
                        ...normalized.agent_picks,
                        ...normalized.high_intent,
                        ...normalized.all_profiles,
                    ];
                    const alreadySent: Record<string, boolean> = {};
                    allProfiles.forEach((p) => {
                        const flags = getInterestFlags(p);
                        if (flags.isPendingByMe) {
                            alreadySent[p.id] = true;
                        }
                    });
                    setSuperLiked((prev) => ({ ...prev, ...alreadySent }));
                }
            } catch (error: any) {
                if (error?.name !== 'CanceledError' && error?.code !== 'ERR_CANCELED') {
                    console.error('Failed to fetch discovery profiles', error);
                }
            } finally {
                if (requestSeq === discoveryRequestSeqRef.current) {
                    setLoading(false);
                }
            }
        },
        [],
    );

    useEffect(() => {
        return () => {
            discoveryAbortRef.current?.abort();
            searchAbortRef.current?.abort();
        };
    }, []);

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= pagination.last_page && page !== currentPage) {
            setCurrentPage(page);
            // Scroll to top of content area
            document
                .querySelector('.discovery-content-area')
                ?.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const fetchSearchResults = useCallback(
        async (
            query: string,
            filterSet: DiscoveryFilters,
            tab: 'all' | 'verified' | 'unverified' | 'bookmarked' = 'all',
            page: number = 1,
        ) => {
            const requestSeq = ++searchRequestSeqRef.current;
            discoveryAbortRef.current?.abort();
            searchAbortRef.current?.abort();
            const controller = new AbortController();
            searchAbortRef.current = controller;

            setLoading(true);
            try {
                const params: Record<string, string | number> = { page };
                if (query) params.q = query;
                if (tab === 'verified') params.verified = 'yes';
                else if (tab === 'unverified') params.verified = 'no';
                else if (tab === 'bookmarked') params.bookmarked = 'yes';
                if (filterSet.ageMin) params.age_min = filterSet.ageMin;
                if (filterSet.ageMax) params.age_max = filterSet.ageMax;
                if (filterSet.country) params.country = filterSet.country;
                if (filterSet.state) params.state = filterSet.state;
                if (filterSet.city) params.city = filterSet.city;
                if (filterSet.maritalStatus) params.marital_status = filterSet.maritalStatus;
                if (filterSet.religion) params.religion = filterSet.religion;
                if (filterSet.sect) params.sect = filterSet.sect;
                if (filterSet.caste) params.caste = filterSet.caste;
                if (filterSet.professionId) params.job_title_id = filterSet.professionId;
                if (filterSet.profession) params.profession = filterSet.profession;

                const response = await api.get('/discovery/search', {
                    params,
                    signal: controller.signal,
                });
                if (requestSeq !== searchRequestSeqRef.current) return;

                const results = response.data?.data || [];
                const normalized = results.map(normalizeProfile);
                setSearchResults(normalized);
                setShortlisted((prev) => ({ ...prev, ...buildShortlistedMap(normalized) }));
                setMediaAccessStates((prev) => ({
                    ...prev,
                    ...buildMediaAccessStateMap(normalized),
                }));
                if (response.data?.pagination) {
                    setPagination(response.data.pagination);
                }

                const alreadySent: Record<string, boolean> = {};
                normalized.forEach((p: ProfileMatch) => {
                    const flags = getInterestFlags(p);
                    if (flags.isPendingByMe) {
                        alreadySent[p.id] = true;
                    }
                });
                setSuperLiked((prev) => ({ ...prev, ...alreadySent }));
            } catch (error: any) {
                if (error?.name !== 'CanceledError' && error?.code !== 'ERR_CANCELED') {
                    console.error('Failed to search discovery profiles', error);
                }
            } finally {
                if (requestSeq === searchRequestSeqRef.current) {
                    setLoading(false);
                }
            }
        },
        [],
    );

    useEffect(() => {
        const query = searchQuery.trim();
        const hasFilters =
            appliedFilters.verifiedOnly ||
            appliedFilters.ageMin !== '' ||
            appliedFilters.ageMax !== '' ||
            appliedFilters.country !== '' ||
            appliedFilters.state !== '' ||
            appliedFilters.city !== '' ||
            appliedFilters.maritalStatus !== '' ||
            appliedFilters.religion.trim() !== '' ||
            appliedFilters.sect.trim() !== '' ||
            appliedFilters.caste.trim() !== '' ||
            appliedFilters.professionId.trim() !== '' ||
            appliedFilters.profession.trim() !== '';

        if (query || hasFilters) {
            const timeoutId = setTimeout(() => {
                fetchSearchResults(query, appliedFilters, activeTab, currentPage);
            }, 350);

            return () => clearTimeout(timeoutId);
        }

        fetchDiscoveryData(currentPage, activeTab);
    }, [
        searchQuery,
        appliedFilters,
        activeTab,
        currentPage,
        refreshVersion,
        fetchSearchResults,
        fetchDiscoveryData,
    ]);

    useEffect(() => {
        if (!sentProposalMap || Object.keys(sentProposalMap).length === 0) return;
        const patchSentStatus = (profile: ProfileMatch): ProfileMatch => {
            if (!sentProposalMap[String(profile.id)]) return profile;
            const mappedState = proposalStatusMap[String(profile.id)] ?? 'sent_pending';
            return applyInterestStateToProfile(profile, mappedState);
        };

        setSuperLiked((prev) => ({ ...prev, ...sentProposalMap }));
        setProfiles((prev) => ({
            agent_picks: prev.agent_picks.map(patchSentStatus),
            high_intent: prev.high_intent.map(patchSentStatus),
            all_profiles: prev.all_profiles.map(patchSentStatus),
        }));
        setSearchResults((prev) => prev.map(patchSentStatus));
        setSelectedProfile((prev) => (prev ? patchSentStatus(prev) : prev));
    }, [sentProposalMap, proposalStatusMap, applyInterestStateToProfile]);

    useEffect(() => {
        setSelectedProfile((prev) => {
            if (!prev) return prev;
            const state = proposalStatusMap[String(prev.id)];
            if (!state) return prev;
            return applyInterestStateToProfile(prev, state);
        });
    }, [proposalStatusMap, applyInterestStateToProfile]);

    const handleApplyFilters = () => {
        setAppliedFilters({
            verifiedOnly: filters.verifiedOnly,
            ageMin: filters.ageMin,
            ageMax: filters.ageMax,
            country: filters.country,
            state: filters.state,
            city: filters.city,
            maritalStatus: filters.maritalStatus,
            religion: filters.religion.trim(),
            sect: filters.sect.trim(),
            caste: filters.caste.trim(),
            professionId: filters.professionId.trim(),
            profession: filters.profession.trim(),
        });
        setCurrentPage(1);
        setShowFilters(false);
    };

    const handleResetFilters = () => {
        setFilters(DEFAULT_FILTERS);
        setAppliedFilters(DEFAULT_FILTERS);
        setCurrentPage(1);
    };

    // Verification gate: intercept all profile actions if not verified
    const requireVerification = () => {
        if (isIdentityVerified === false) {
            onRequireVerification?.();
            return true; // blocked
        }
        return false; // allowed
    };

    const openMediaAccessModal = useCallback(
        (profile: ProfileMatch, preferredKind: 'photo' | 'gallery' = 'photo') => {
            if (requireVerification()) return;
            setMediaAccessStates((prev) => ({
                ...prev,
                [profile.id]: resolveMediaAccessBundle(profile),
            }));
            setMediaAccessTarget(profile);
            setMediaAccessPriority(preferredKind);
            setShowMediaAccessModal(true);
        },
        [requireVerification],
    );

    const closeMediaAccessModal = useCallback(() => {
        setShowMediaAccessModal(false);
        setMediaAccessTarget(null);
        setMediaAccessPriority('photo');
    }, []);

    const handleRequestProfilePhotoAccess = useCallback(
        async (profile: ProfileMatch) => {
            if (requireVerification()) return;
            const profileId = String(profile.id || '');
            if (!profileId) return;
            const currentMediaAccess =
                mediaAccessStates[profileId] ?? resolveMediaAccessBundle(profile);
            const snapshot = currentMediaAccess.profilePhoto;
            if (
                mediaAccessRequesting[profileId]?.profilePhoto ||
                snapshot.state !== 'none' ||
                !snapshot.required ||
                snapshot.accessible ||
                !snapshot.exists
            )
                return;

            try {
                setMediaAccessRequesting((prev) => ({
                    ...prev,
                    [profileId]: { ...(prev[profileId] ?? {}), profilePhoto: true },
                }));
                await api.post('/member/profile-picture-view-request', { id: profileId });
                updateMediaAccessState(profile, 'profilePhoto', {
                    state: 'pending',
                    requested: true,
                    approved: false,
                    text: t('discovery.photoAccessRequested'),
                });
            } catch (error) {
                const message = `${(error as any)?.response?.data?.message ?? ''}`.toLowerCase();
                if (message.includes('already requested')) {
                    updateMediaAccessState(profile, 'profilePhoto', {
                        state: 'pending',
                        requested: true,
                        approved: false,
                        text: t('discovery.photoAccessRequested'),
                    });
                }
                console.error('Failed to request photo access', error);
            } finally {
                setMediaAccessRequesting((prev) => ({
                    ...prev,
                    [profileId]: { ...(prev[profileId] ?? {}), profilePhoto: false },
                }));
            }
        },
        [mediaAccessRequesting, mediaAccessStates, requireVerification, t, updateMediaAccessState],
    );

    const handleRequestGalleryImagesAccess = useCallback(
        async (profile: ProfileMatch) => {
            if (requireVerification()) return;
            const profileId = String(profile.id || '');
            if (!profileId) return;
            const currentMediaAccess =
                mediaAccessStates[profileId] ?? resolveMediaAccessBundle(profile);
            const snapshot = currentMediaAccess.galleryImage;
            if (
                mediaAccessRequesting[profileId]?.galleryImage ||
                snapshot.state !== 'none' ||
                !snapshot.required ||
                snapshot.accessible ||
                !snapshot.exists
            )
                return;

            try {
                setMediaAccessRequesting((prev) => ({
                    ...prev,
                    [profileId]: { ...(prev[profileId] ?? {}), galleryImage: true },
                }));
                await api.post('/member/gallery-image-view-request', { id: profileId });
                updateMediaAccessState(profile, 'galleryImage', {
                    state: 'pending',
                    requested: true,
                    approved: false,
                    text: t('discovery.galleryAccessRequested'),
                });
            } catch (error) {
                const message = `${(error as any)?.response?.data?.message ?? ''}`.toLowerCase();
                if (message.includes('already requested')) {
                    updateMediaAccessState(profile, 'galleryImage', {
                        state: 'pending',
                        requested: true,
                        approved: false,
                        text: t('discovery.galleryAccessRequested'),
                    });
                }
                console.error('Failed to request gallery image access', error);
            } finally {
                setMediaAccessRequesting((prev) => ({
                    ...prev,
                    [profileId]: { ...(prev[profileId] ?? {}), galleryImage: false },
                }));
            }
        },
        [mediaAccessRequesting, mediaAccessStates, requireVerification, t, updateMediaAccessState],
    );

    const handleShortlist = async (profile: ProfileMatch) => {
        if (requireVerification()) return;
        const profileId = String(profile.id || '');
        if (
            !profileId ||
            shortlistProcessing[profileId] ||
            shortlisted[profileId] ||
            isProfileBookmarked(profile)
        )
            return;

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

    const getDisplayedProfiles = () => {
        // Backend now handles verified/unverified filtering via ?verified= param
        return profiles.all_profiles;
    };

    const filtersActive =
        appliedFilters.verifiedOnly ||
        appliedFilters.ageMin !== '' ||
        appliedFilters.ageMax !== '' ||
        appliedFilters.country !== '' ||
        appliedFilters.state !== '' ||
        appliedFilters.city !== '' ||
        appliedFilters.maritalStatus !== '' ||
        appliedFilters.religion.trim() !== '' ||
        appliedFilters.sect.trim() !== '' ||
        appliedFilters.caste.trim() !== '' ||
        appliedFilters.professionId.trim() !== '' ||
        appliedFilters.profession.trim() !== '';
    const isSearchActive = searchQuery.trim().length > 0 || filtersActive;
    const baseProfiles = isSearchActive ? searchResults : getDisplayedProfiles();
    const displayedProfiles = baseProfiles;
    const bookmarkedEmptyState =
        !isSearchActive && activeTab === 'bookmarked' && displayedProfiles.length === 0;
    const emptyStateTitle = bookmarkedEmptyState
        ? t('discovery.noBookmarkedProfiles')
        : t('discovery.noMatchingProfiles');
    const emptyStateDescription = bookmarkedEmptyState
        ? t('discovery.noBookmarkedProfilesDesc')
        : t('discovery.noMatchingProfilesDesc');

    return (
        <div className="flex-1 flex flex-col h-full min-h-0 bg-slate-50 relative">
            {/* Top Search & Controls Bar */}
            <div className="h-auto md:h-18 bg-white border-b border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between px-4 md:px-6 py-3 shrink-0 z-30 shadow-sm gap-4">
                {/* Search Input */}
                <div className="flex-1 md:max-w-xl relative">
                    <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        size={18}
                    />
                    <input
                        type="text"
                        placeholder={t('discovery.searchPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all"
                    />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 md:gap-3 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
                    {/* Anonymous Toggle */}
                    <motion.button
                        whileTap={BTN_TAP}
                        onClick={handleToggleAnonymous}
                        disabled={anonymousLoading}
                        className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-bold transition-all border whitespace-nowrap ${isAnonymous ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'} ${anonymousLoading ? 'opacity-60 cursor-wait' : ''}`}
                        title={t('discovery.browseAnonymouslyTitle')}
                    >
                        {anonymousLoading ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : isAnonymous ? (
                            <EyeOff size={16} />
                        ) : (
                            <Eye size={16} />
                        )}
                        <span className="hidden xl:inline">
                            {isAnonymous ? t('discovery.anonymous') : t('discovery.visible')}
                        </span>
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

                    {/* User Info */}
                    <div className="h-6 w-px bg-slate-200 mx-1 hidden md:block"></div>
                    <div
                        className="hidden md:flex items-center gap-2.5 pl-1 cursor-pointer"
                        onClick={() => onNavigate?.('profile')}
                    >
                        <div
                            className="size-8 rounded-full bg-slate-200 bg-cover bg-center border border-white shadow-sm shrink-0"
                            style={
                                userAvatarUrl
                                    ? { backgroundImage: `url(${userAvatarUrl})` }
                                    : undefined
                            }
                        />
                        <div className="overflow-hidden max-w-[120px]">
                            <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                                {userDisplayName}
                            </p>
                            <p className="text-[10px] text-slate-500 truncate leading-tight">
                                {userMembershipLabel}
                            </p>
                        </div>
                    </div>
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
                        {showFilters ? (
                            <ChevronDown size={16} className="rotate-180 transition-transform" />
                        ) : (
                            <ChevronDown size={16} className="transition-transform" />
                        )}
                    </button>

                    {/* Discovery Tabs */}
                    <div className="flex bg-slate-100 p-1 rounded-lg shrink-0">
                        <TabButton
                            label={t('discovery.allProfiles')}
                            active={activeTab === 'all'}
                            onClick={() => {
                                setActiveTab('all');
                                setCurrentPage(1);
                            }}
                        />
                        <TabButton
                            label={t('discovery.verifiedProfiles')}
                            active={activeTab === 'verified'}
                            onClick={() => {
                                setActiveTab('verified');
                                setCurrentPage(1);
                            }}
                            icon={<UserCheck size={14} />}
                        />
                        <TabButton
                            label={t('discovery.unverifiedProfiles')}
                            active={activeTab === 'unverified'}
                            onClick={() => {
                                setActiveTab('unverified');
                                setCurrentPage(1);
                            }}
                            icon={<AlertCircle size={14} />}
                        />
                        <TabButton
                            label={t('discovery.bookmarkedProfiles')}
                            active={activeTab === 'bookmarked'}
                            onClick={() => {
                                setActiveTab('bookmarked');
                                setCurrentPage(1);
                            }}
                            icon={<Bookmark size={14} />}
                        />
                    </div>
                </div>
            </div>

            <div className="flex-1 flex min-h-0 relative overflow-hidden">
                {/* Filters Panel (Slide Over) */}
                <div
                    className={`absolute left-0 top-0 bottom-0 w-full sm:w-72 bg-white border-r border-slate-200 shadow-lg z-[5] transition-transform duration-300 ease-in-out ${showFilters ? 'translate-x-0' : '-translate-x-full'}`}
                >
                    <div className="h-full flex flex-col p-6 overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-slate-900">
                                {t('discovery.advancedFilters')}
                            </h3>
                            <button
                                onClick={() => setShowFilters(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <FilterGroup label={t('discovery.specialFilter')}>
                                <label className="flex items-center gap-2 p-2 rounded-lg bg-purple-50 border border-purple-100 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="accent-purple-600"
                                        checked={filters.verifiedOnly}
                                        onChange={(e) =>
                                            setFilters({
                                                ...filters,
                                                verifiedOnly: e.target.checked,
                                            })
                                        }
                                    />
                                    <span className="text-sm font-bold text-purple-900">
                                        Verified only
                                    </span>
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
                                        onChange={(e) =>
                                            setFilters({ ...filters, ageMin: e.target.value })
                                        }
                                        className="w-full text-sm p-2 border border-slate-200 rounded-md focus:outline-none focus:border-primary"
                                    />
                                    <input
                                        type="number"
                                        min={18}
                                        max={80}
                                        placeholder={t('discovery.max')}
                                        value={filters.ageMax}
                                        onChange={(e) =>
                                            setFilters({ ...filters, ageMax: e.target.value })
                                        }
                                        className="w-full text-sm p-2 border border-slate-200 rounded-md focus:outline-none focus:border-primary"
                                    />
                                </div>
                            </FilterGroup>

                            <FilterGroup label="Location">
                                <select
                                    value={filters.country}
                                    onChange={(e) =>
                                        setFilters((prev) => ({
                                            ...prev,
                                            country: e.target.value,
                                            state: '',
                                            city: '',
                                        }))
                                    }
                                    className="w-full text-sm p-2 border border-slate-200 rounded-md focus:outline-none focus:border-primary"
                                >
                                    <option value="">Any country</option>
                                    {countries.map((country) => (
                                        <option key={String(country.id)} value={String(country.id)}>
                                            {country.name}
                                            {country.code ? ` (${country.code})` : ''}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    value={filters.state}
                                    onChange={(e) =>
                                        setFilters((prev) => ({
                                            ...prev,
                                            state: e.target.value,
                                            city: '',
                                        }))
                                    }
                                    className="w-full text-sm p-2 border border-slate-200 rounded-md focus:outline-none focus:border-primary mt-3"
                                    disabled={!filters.country}
                                >
                                    <option value="">
                                        {filters.country
                                            ? 'Any province'
                                            : 'Choose a country first'}
                                    </option>
                                    {states.map((state) => (
                                        <option key={String(state.id)} value={String(state.id)}>
                                            {state.name}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    value={filters.city}
                                    onChange={(e) =>
                                        setFilters((prev) => ({ ...prev, city: e.target.value }))
                                    }
                                    className="w-full text-sm p-2 border border-slate-200 rounded-md focus:outline-none focus:border-primary mt-3"
                                    disabled={!filters.state}
                                >
                                    <option value="">
                                        {filters.state ? 'Any city' : 'Choose a province first'}
                                    </option>
                                    {cities.map((city) => (
                                        <option key={String(city.id)} value={String(city.id)}>
                                            {city.name}
                                        </option>
                                    ))}
                                </select>
                            </FilterGroup>

                            <FilterGroup label="Marital Status">
                                <select
                                    value={filters.maritalStatus}
                                    onChange={(e) =>
                                        setFilters((prev) => ({
                                            ...prev,
                                            maritalStatus: e.target.value,
                                        }))
                                    }
                                    className="w-full text-sm p-2 border border-slate-200 rounded-md focus:outline-none focus:border-primary"
                                >
                                    <option value="">Any marital status</option>
                                    {maritalStatuses.map((status) => (
                                        <option key={String(status.id)} value={String(status.id)}>
                                            {status.name}
                                        </option>
                                    ))}
                                </select>
                            </FilterGroup>

                            <FilterGroup label="Caste">
                                <select
                                    value={filters.caste}
                                    onChange={(e) =>
                                        setFilters((prev) => ({ ...prev, caste: e.target.value }))
                                    }
                                    className="w-full text-sm p-2 border border-slate-200 rounded-md focus:outline-none focus:border-primary"
                                    disabled={!filters.religion}
                                >
                                    <option value="">
                                        {filters.religion ? 'Any caste' : 'Choose a religion first'}
                                    </option>
                                    {castes.map((caste) => (
                                        <option key={String(caste.id)} value={String(caste.id)}>
                                            {caste.name}
                                        </option>
                                    ))}
                                </select>
                            </FilterGroup>

                            <FilterGroup label="Religion">
                                <select
                                    value={filters.religion}
                                    onChange={(e) =>
                                        setFilters((prev) => ({
                                            ...prev,
                                            religion: e.target.value,
                                            caste: '',
                                        }))
                                    }
                                    className="w-full text-sm p-2 border border-slate-200 rounded-md focus:outline-none focus:border-primary"
                                >
                                    <option value="">Any religion</option>
                                    {religions.map((religion) => (
                                        <option
                                            key={String(religion.id)}
                                            value={String(religion.id)}
                                        >
                                            {religion.name}
                                        </option>
                                    ))}
                                </select>
                            </FilterGroup>

                            <FilterGroup label="Sect">
                                <select
                                    value={filters.sect}
                                    onChange={(e) =>
                                        setFilters((prev) => ({ ...prev, sect: e.target.value }))
                                    }
                                    className="w-full text-sm p-2 border border-slate-200 rounded-md focus:outline-none focus:border-primary"
                                >
                                    <option value="">Any sect</option>
                                    {sects.map((sect) => (
                                        <option key={String(sect.id)} value={String(sect.id)}>
                                            {sect.name}
                                        </option>
                                    ))}
                                </select>
                            </FilterGroup>

                            <FilterGroup label="Profession">
                                <select
                                    value={filters.professionId}
                                    onChange={(e) => {
                                        const selectedId = e.target.value;
                                        setFilters((prev) => ({
                                            ...prev,
                                            professionId: selectedId,
                                            profession: '',
                                        }));
                                    }}
                                    className="w-full text-sm p-2 border border-slate-200 rounded-md focus:outline-none focus:border-primary"
                                >
                                    <option value="">Any profession</option>
                                    {jobTitles.map((jobTitle) => (
                                        <option
                                            key={String(jobTitle.id)}
                                            value={String(jobTitle.id)}
                                        >
                                            {jobTitle.name}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    type="text"
                                    placeholder="Any Other Professional"
                                    value={filters.profession}
                                    onChange={(e) =>
                                        setFilters({
                                            ...filters,
                                            profession: e.target.value,
                                            professionId: '',
                                        })
                                    }
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
                <div
                    className={`flex-1 overflow-y-auto p-4 md:p-6 transition-all duration-300 ${showFilters ? 'sm:ml-72' : ''} scrollbar-hide discovery-content-area`}
                >
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4">
                            <Loader2 className="animate-spin text-primary" size={48} />
                            <p className="text-slate-500 font-medium">
                                {t('discovery.findingMatches')}
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Main Grid */}
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 mb-4">
                                    {isSearchActive
                                        ? searchQuery.trim()
                                            ? t('discovery.searchResultsFor', {
                                                  query: searchQuery.trim(),
                                              })
                                            : t('discovery.filteredResults')
                                        : activeTab === 'verified'
                                          ? t('discovery.verifiedProfiles')
                                          : activeTab === 'unverified'
                                            ? t('discovery.unverifiedProfiles')
                                            : activeTab === 'bookmarked'
                                              ? t('discovery.bookmarkedProfiles')
                                              : t('discovery.exploreProfiles')}
                                </h3>
                                {viewMode === 'grid' ? (
                                    displayedProfiles.length > 0 ? (
                                        <motion.div
                                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                                            variants={STAGGER_CONTAINER}
                                            initial="hidden"
                                            animate="visible"
                                            key={activeTab}
                                        >
                                            <AnimatePresence mode="popLayout">
                                                {displayedProfiles.map((profile) => {
                                                    const mergedProfile = mergeInterest(profile);
                                                    return (
                                                        <motion.div
                                                            key={mergedProfile.id}
                                                            variants={FADE_UP_ITEM}
                                                            layout
                                                        >
                                                            <ProfileGridCard
                                                                profile={mergedProfile}
                                                                onClick={() =>
                                                                    setSelectedProfile(
                                                                        mergedProfile,
                                                                    )
                                                                }
                                                                onProposal={() => {
                                                                    if (!requireVerification())
                                                                        onSendProposal(
                                                                            mergedProfile,
                                                                        );
                                                                }}
                                                                onRequestMediaAccess={() =>
                                                                    openMediaAccessModal(
                                                                        mergedProfile,
                                                                        'photo',
                                                                    )
                                                                }
                                                                mediaAccess={
                                                                    mediaAccessStates[
                                                                        mergedProfile.id
                                                                    ] ??
                                                                    resolveMediaAccessBundle(
                                                                        mergedProfile,
                                                                    )
                                                                }
                                                                superLiked={
                                                                    superLiked[mergedProfile.id]
                                                                }
                                                                onLike={() =>
                                                                    handleShortlist(mergedProfile)
                                                                }
                                                                liked={Boolean(
                                                                    shortlisted[mergedProfile.id] ??
                                                                    isProfileBookmarked(
                                                                        mergedProfile,
                                                                    ),
                                                                )}
                                                                shortlistProcessing={
                                                                    shortlistProcessing[
                                                                        mergedProfile.id
                                                                    ]
                                                                }
                                                            />
                                                        </motion.div>
                                                    );
                                                })}
                                            </AnimatePresence>
                                        </motion.div>
                                    ) : (
                                        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
                                            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                                                <Search size={20} />
                                            </div>
                                            <h4 className="text-base font-bold text-slate-900">
                                                {emptyStateTitle}
                                            </h4>
                                            <p className="mt-2 text-sm text-slate-500">
                                                {emptyStateDescription}
                                            </p>
                                        </div>
                                    )
                                ) : (
                                    <div className="h-96 bg-slate-200 rounded-xl flex items-center justify-center text-slate-500 border border-slate-300">
                                        <div className="text-center">
                                            <MapIcon
                                                size={48}
                                                className="mx-auto mb-2 opacity-50"
                                            />
                                            <p className="font-bold">
                                                {t('discovery.mapViewPlaceholder')}
                                            </p>
                                            <p className="text-xs">
                                                {t('discovery.locationDiscovery')}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Pagination Controls */}
                            {pagination.last_page > 1 && (
                                <div className="mt-8 flex flex-col items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage <= 1}
                                            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <ChevronLeft size={16} />
                                            {t('discovery.previous', 'Previous')}
                                        </button>

                                        <div className="flex items-center gap-1">
                                            {(() => {
                                                const pages: (number | string)[] = [];
                                                const total = pagination.last_page;
                                                const current = currentPage;

                                                if (total <= 7) {
                                                    for (let i = 1; i <= total; i++) pages.push(i);
                                                } else {
                                                    pages.push(1);
                                                    if (current > 3) pages.push('...');
                                                    for (
                                                        let i = Math.max(2, current - 1);
                                                        i <= Math.min(total - 1, current + 1);
                                                        i++
                                                    ) {
                                                        pages.push(i);
                                                    }
                                                    if (current < total - 2) pages.push('...');
                                                    pages.push(total);
                                                }

                                                return pages.map((page, idx) =>
                                                    typeof page === 'string' ? (
                                                        <span
                                                            key={`dots-${idx}`}
                                                            className="px-2 py-1 text-slate-400 text-sm"
                                                        >
                                                            ...
                                                        </span>
                                                    ) : (
                                                        <button
                                                            key={page}
                                                            onClick={() => handlePageChange(page)}
                                                            className={`min-w-[36px] h-9 rounded-lg text-sm font-bold transition-colors ${
                                                                page === currentPage
                                                                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                                                                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                                            }`}
                                                        >
                                                            {page}
                                                        </button>
                                                    ),
                                                );
                                            })()}
                                        </div>

                                        <button
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage >= pagination.last_page}
                                            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {t('discovery.next', 'Next')}
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        {t('discovery.showingResults', {
                                            from: pagination.from ?? 0,
                                            to: pagination.to ?? 0,
                                            total: pagination.total,
                                            defaultValue: `Showing ${pagination.from ?? 0}-${pagination.to ?? 0} of ${pagination.total} profiles`,
                                        })}
                                    </p>
                                </div>
                            )}

                            {/* Search Results Pagination */}
                            {isSearchActive && pagination.total > 0 && (
                                <div className="mt-8 flex justify-center">
                                    <p className="text-sm text-slate-500">
                                        {t('discovery.resultsCount', {
                                            count: pagination.total,
                                            defaultValue: `${pagination.total} results found`,
                                        })}
                                    </p>
                                </div>
                            )}

                            {/* Similar Profiles Strip (Bottom) */}
                            <div className="mt-12 pt-8 border-t border-slate-200">
                                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">
                                    {t('discovery.peopleAlsoViewed')}
                                </h3>
                                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide opacity-70 hover:opacity-100 transition-opacity">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <div
                                            key={i}
                                            className="size-12 rounded-full bg-slate-300 shrink-0"
                                        ></div>
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
                        profile={mergeInterest(selectedProfile)}
                        onClose={() => setSelectedProfile(null)}
                        onSendProposal={(p) => {
                            if (requireVerification()) return;
                            setSelectedProfile(null);
                            onSendProposal(p);
                        }}
                        onRequestMediaAccess={(p, kind = 'photo') => openMediaAccessModal(p, kind)}
                        onNavigate={onNavigate}
                    />
                )}
            </AnimatePresence>
            <AnimatePresence>
                {showMediaAccessModal && mediaAccessTarget && (
                    <MediaAccessRequestModal
                        profile={mediaAccessTarget}
                        mediaAccess={
                            mediaAccessStates[mediaAccessTarget.id] ??
                            resolveMediaAccessBundle(mediaAccessTarget)
                        }
                        onClose={closeMediaAccessModal}
                        onRequestProfilePhoto={() =>
                            handleRequestProfilePhotoAccess(mediaAccessTarget)
                        }
                        onRequestGalleryImages={() =>
                            handleRequestGalleryImagesAccess(mediaAccessTarget)
                        }
                        requestingProfilePhoto={Boolean(
                            mediaAccessRequesting[mediaAccessTarget.id]?.profilePhoto,
                        )}
                        requestingGalleryImages={Boolean(
                            mediaAccessRequesting[mediaAccessTarget.id]?.galleryImage,
                        )}
                        priorityKind={mediaAccessPriority}
                    />
                )}
            </AnimatePresence>
            <AnimatePresence>
                {showTuner && <MatchTunerModal onClose={() => setShowTuner(false)} />}
            </AnimatePresence>
        </div>
    );
};

const FilterGroup: React.FC<{ label: string; children: React.ReactNode }> = ({
    label,
    children,
}) => (
    <div>
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-2">{label}</h4>
        {children}
    </div>
);

const TabButton: React.FC<{
    label: string;
    active: boolean;
    onClick: () => void;
    icon?: React.ReactNode;
}> = ({ label, active, onClick, icon }) => (
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
    onRequestMediaAccess: () => void;
    mediaAccess: MediaAccessBundle;
    superLiked?: boolean;
    onLike: () => void;
    liked?: boolean;
    shortlistProcessing?: boolean;
}> = ({
    profile,
    onClick,
    onProposal,
    onRequestMediaAccess,
    mediaAccess,
    superLiked,
    onLike,
    liked,
    shortlistProcessing,
}) => {
    const { t } = useTranslation();
    const interestFlags = getInterestFlags(profile, Boolean(superLiked));
    const profilePhotoAccess = mediaAccess.profilePhoto;
    const fallbackAvatar = isFemaleProfile(profile.gender) ? DEFAULT_FEMALE_AVATAR : DEFAULT_AVATAR;
    const avatarUrl = swapAvatarForGender(profile.avatarUrl || fallbackAvatar, profile.gender);
    const shouldBlurAvatar = Boolean(
        profile.profilePhotoBlur &&
        profile.photoExists &&
        avatarUrl !== DEFAULT_AVATAR &&
        avatarUrl !== DEFAULT_FEMALE_AVATAR,
    );
    const photoRequestTitle =
        profilePhotoAccess.state === 'approved' || profilePhotoAccess.accessible
            ? t('discovery.manageMediaAccess')
            : profilePhotoAccess.state === 'pending'
              ? t('discovery.mediaAccessRequested')
              : profilePhotoAccess.required
                ? t('discovery.requestMediaAccess')
                : t('discovery.noRequestNeeded');

    return (
        <div className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group relative cursor-pointer">
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
                {interestFlags.isPendingByMe && (
                    <div className="bg-amber-500/90 text-white backdrop-blur-md rounded-full px-2 py-1 text-[10px] font-bold shadow-sm flex items-center gap-1">
                        <Clock size={10} />{' '}
                        {t('discovery.pendingResponse', 'Proposal Sent - Waiting for Reply')}
                    </div>
                )}
                <div
                    className={`backdrop-blur-md rounded-full px-2 py-1 text-[10px] font-bold shadow-sm flex items-center gap-1 ${
                        profile.isVerified
                            ? 'bg-emerald-500/90 text-white'
                            : 'bg-yellow-400/90 text-slate-900'
                    }`}
                >
                    {profile.isVerified ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                    {profile.isVerified
                        ? t('modals.verification.verified', 'Verified')
                        : t('profile.unverified', 'Unverified')}
                </div>
                {profile.travel_mode && profile.travel_city && (
                    <div className="bg-blue-500/90 text-white backdrop-blur-md rounded-full px-2 py-1 text-[10px] font-bold shadow-sm flex items-center gap-1">
                        <Plane size={10} /> {t('discovery.travelingTo', 'Visiting')}{' '}
                        {profile.travel_city}
                    </div>
                )}
            </div>

            <div className="aspect-[4/5] bg-slate-200 relative overflow-hidden" onClick={onClick}>
                <img
                    src={avatarUrl}
                    alt={profile.name}
                    className={`w-full h-full object-cover transition duration-300 ${shouldBlurAvatar ? 'scale-110 blur-2xl' : ''}`}
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = fallbackAvatar;
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>

                <div className="absolute bottom-0 left-0 p-4 w-full text-white">
                    <h3 className="font-bold text-lg leading-tight">{profile.name}</h3>
                    <div className="flex items-center gap-1 text-xs opacity-90 mt-1">
                        <span className="bg-white/20 px-1.5 py-0.5 rounded backdrop-blur-sm">
                            {profile.age && profile.age > 0 ? profile.age : t('profile.ageNA')}
                        </span>
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
                        onClick={(e) => {
                            e.stopPropagation();
                            onRequestMediaAccess();
                        }}
                        className={`p-1.5 rounded-full bg-slate-50 transition-colors ${
                            profilePhotoAccess.state === 'approved' || profilePhotoAccess.accessible
                                ? 'text-emerald-600 bg-emerald-50 border border-emerald-200 shadow-sm'
                                : profilePhotoAccess.state === 'pending'
                                  ? 'text-primary bg-primary/10 border border-primary/20 shadow-sm'
                                  : profilePhotoAccess.required
                                    ? 'text-slate-400 hover:text-slate-600 hover:bg-slate-200 border border-transparent'
                                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200 border border-transparent'
                        }`}
                        title={photoRequestTitle}
                    >
                        {profilePhotoAccess.state === 'pending' ? (
                            <Clock size={16} />
                        ) : profilePhotoAccess.state === 'approved' ||
                          profilePhotoAccess.accessible ? (
                            <CheckCircle2 size={16} />
                        ) : (
                            <Camera size={16} />
                        )}
                    </motion.button>
                    {(() => {
                        // Mutual match / accepted
                        if (!interestFlags.isReceived && interestFlags.isAccepted) {
                            return (
                                <div
                                    className="p-1.5 rounded-full bg-emerald-50 text-emerald-600 flex items-center gap-1"
                                    title={t('discovery.chatNow')}
                                >
                                    <MessageSquare size={14} />
                                    <span className="text-[10px] font-bold pr-1">
                                        {t('discovery.chatNow')}
                                    </span>
                                </div>
                            );
                        }
                        // I sent interest, pending
                        if (interestFlags.isPendingByMe) {
                            return (
                                <div
                                    className="p-1.5 rounded-full bg-amber-50 text-amber-600 flex items-center gap-1"
                                    title={t('discovery.pendingResponse')}
                                >
                                    <Clock size={14} />
                                    <span className="text-[10px] font-bold pr-1">
                                        {t('discovery.proposalSent')}
                                    </span>
                                </div>
                            );
                        }
                        // They sent me interest, accepted
                        if (interestFlags.isReceived && interestFlags.isAccepted) {
                            return (
                                <div
                                    className="p-1.5 rounded-full bg-emerald-50 text-emerald-600 flex items-center gap-1"
                                    title={t('discovery.chatNow')}
                                >
                                    <MessageSquare size={14} />
                                    <span className="text-[10px] font-bold pr-1">
                                        {t('discovery.chatNow')}
                                    </span>
                                </div>
                            );
                        }
                        // They sent me interest, pending response
                        if (interestFlags.isReceived) {
                            return (
                                <div
                                    className="p-1.5 rounded-full bg-blue-50 text-blue-600 flex items-center gap-1"
                                    title={t('discovery.respondToInterest')}
                                >
                                    <Heart size={14} />
                                    <span className="text-[10px] font-bold pr-1">
                                        {t('discovery.respondToInterest')}
                                    </span>
                                </div>
                            );
                        }
                        // No interest — show send buttons
                        return (
                            <>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={BTN_TAP}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onProposal();
                                    }}
                                    className="p-1.5 rounded-full bg-slate-50 text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors"
                                    title={t('discovery.sendProposal')}
                                >
                                    <Send size={16} />
                                </motion.button>
                            </>
                        );
                    })()}
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={BTN_TAP}
                        onClick={(e) => {
                            e.stopPropagation();
                            onLike();
                        }}
                        disabled={shortlistProcessing}
                        className={`p-1.5 rounded-full bg-slate-50 transition-colors ${
                            liked
                                ? 'text-red-500 bg-red-50 border border-red-200 shadow-sm'
                                : 'text-slate-400 hover:text-red-500 hover:bg-red-50 border border-transparent'
                        }`}
                        title={liked ? t('discovery.bookmarked') : t('discovery.bookmark')}
                    >
                        {shortlistProcessing ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : liked ? (
                            <Bookmark size={16} fill="currentColor" />
                        ) : (
                            <Bookmark size={16} />
                        )}
                    </motion.button>
                </div>
            </div>
        </div>
    );
};

export default DiscoveryView;
