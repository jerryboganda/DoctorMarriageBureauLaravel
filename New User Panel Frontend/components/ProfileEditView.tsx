import React, { useState, useEffect, useRef } from 'react';
import {
    User, Briefcase, Heart, Home, Image as ImageIcon, Sparkles,
    Lock, Eye, EyeOff, Mic, Video, Plus, Check, AlertCircle,
    Globe, Ruler, Moon, Coffee, Dumbbell, Shield, Umbrella, Loader2, Save, Star,
    FileDown, GraduationCap, Play, Square, Trash2, X, Camera, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../utils/api';
import { useAuthStore } from '../src/stores/authStore';
import { compressImage } from '../utils/compression';

interface ProfileEditViewProps {
    initialTab?: string | null;
}

const ProfileEditView: React.FC<ProfileEditViewProps> = ({ initialTab }) => {
    const { t } = useTranslation();

    const [activeTab, setActiveTab] = useState(initialTab || 'basics');
    const [loading, setLoading] = useState(true);
    const [profileData, setProfileData] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const [qualityScore, setQualityScore] = useState<any | null>(null);

    const normalizeMaritalStatuses = (raw: any): Array<{ id: string | number; name: string }> => {
        const items = Array.isArray(raw) ? raw : [];
        return items
            .map((item: any) => {
                const id = item?.id ?? item?.value ?? '';
                const name = item?.name ?? item?.label ?? item?.value ?? '';
                return { id, name: String(name).trim() };
            })
            .filter((item) => item.id !== '' && item.name !== '');
    };

    const fetchMaritalStatusesFallback = async (): Promise<Array<{ id: string | number; name: string }>> => {
        try {
            const res = await api.get('/member/maritial-status');
            const payload = res?.data;
            const candidates = [payload?.data, payload?.marital_statuses, payload];
            for (const candidate of candidates) {
                const normalized = normalizeMaritalStatuses(candidate);
                if (normalized.length) return normalized;
            }
        } catch (e) {
            console.error('Failed to fetch marital statuses fallback', e);
        }
        return [];
    };

    const emptyProfile = () => ({
        basics: {},
        lifestyle: {},
        career: {},
        family: {},
        expectations: {},
        media: {},
        salaryRanges: [],
        visibility: {},
        optionSets: {
            maritalStatuses: [],
        },
    });

    useEffect(() => {
        if (initialTab) {
            setActiveTab(initialTab);
        }
    }, [initialTab]);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const results = await Promise.allSettled([
                api.get('/full-profile'),
                api.get('/member/profile/quality-score'),
            ]);
            const profileRes = results[0].status === 'fulfilled' ? results[0].value : null;
            const qualityRes = results[1].status === 'fulfilled' ? results[1].value : null;
            const payload = profileRes?.data ?? {};
            const sourceOptionSets = payload?.optionSets ?? {};
            let maritalStatuses = normalizeMaritalStatuses(sourceOptionSets?.maritalStatuses || sourceOptionSets?.marital_statuses);
            if (!maritalStatuses.length) {
                maritalStatuses = await fetchMaritalStatusesFallback();
            }

            const normalizedProfile = {
                ...emptyProfile(),
                ...(payload && typeof payload === 'object' ? payload : {}),
                basics: {
                    ...emptyProfile().basics,
                    ...(payload?.basics || {}),
                },
                lifestyle: {
                    ...emptyProfile().lifestyle,
                    ...(payload?.lifestyle || {}),
                },
                career: {
                    ...emptyProfile().career,
                    ...(payload?.career || {}),
                },
                family: {
                    ...emptyProfile().family,
                    ...(payload?.family || {}),
                },
                expectations: {
                    ...emptyProfile().expectations,
                    ...(payload?.expectations || {}),
                },
                media: {
                    ...emptyProfile().media,
                    ...(payload?.media || {}),
                },
                salaryRanges: Array.isArray(payload?.salaryRanges) ? payload.salaryRanges : [],
                visibility: {
                    ...emptyProfile().visibility,
                    ...(payload?.visibility || {}),
                },
                optionSets: {
                    ...(sourceOptionSets || {}),
                    maritalStatuses,
                },
            };
            setProfileData(normalizedProfile);
            setQualityScore(qualityRes?.data?.data ?? null);
        } catch (error) {
            console.error('Failed to fetch profile', error);
            setProfileData(emptyProfile());
        } finally {
            setLoading(false);
        }
    };

    const handleNudgeClick = (action: string, section?: string) => {
        if (section) {
            setActiveTab(section);
            return;
        }
        const lower = action.toLowerCase();
        if (lower.includes('photo') || lower.includes('voice') || lower.includes('video')) setActiveTab('media');
        else if (lower.includes('employment') || lower.includes('career') || lower.includes('education')) setActiveTab('career');
        else if (lower.includes('value') || lower.includes('lifestyle') || lower.includes('diet') || lower.includes('hobbi') || lower.includes('interest') || lower.includes('drink') || lower.includes('smok') || lower.includes('sleep')) setActiveTab('lifestyle');
        else if (lower.includes('preference') || lower.includes('criteria') || lower.includes('preferred') || lower.includes('age range')) setActiveTab('preferences');
        else if (lower.includes('family') || lower.includes('father') || lower.includes('mother') || lower.includes('religion') || lower.includes('caste')) setActiveTab('family');
        else setActiveTab('basics');
    };

    const handleToggleVisibility = async (fieldName: string, currentValue: boolean) => {
        // Optimistic update — toggle immediately in local state
        setProfileData((prev: any) => ({
            ...prev,
            visibility: {
                ...prev.visibility,
                [fieldName]: !currentValue
            }
        }));
        try {
            await api.post('/member/profile/visibility', { field_name: fieldName, is_visible: !currentValue });
        } catch (e) {
            // Revert on failure
            console.error('Failed to toggle visibility', e);
            setProfileData((prev: any) => ({
                ...prev,
                visibility: {
                    ...prev.visibility,
                    [fieldName]: currentValue
                }
            }));
        }
    };

    const updateData = (section: string, field: string, value: any) => {
        setProfileData((prev: any) => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    const handleDownloadBiodata = async () => {
        try {
            const response = await api.get('/profile/download-biodata', {
                responseType: 'blob'
            });
            const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            window.open(blobUrl, '_blank', 'noopener');
            setTimeout(() => window.URL.revokeObjectURL(blobUrl), 10000);
        } catch (error) {
            console.error('Failed to download biodata', error);
            alert(t('profile.edit.biodataDownloadFailed'));
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const response = await api.post('/full-profile/update', profileData);
            if (response.data.result) {
                alert(t('profile.edit.updateSuccess'));
            } else {
                alert(response.data.message || t('profile.edit.updateFailed'));
            }
        } catch (error) {
            console.error('Failed to save profile', error);
            const message = (error as any)?.response?.data?.message || t('profile.edit.updateFailed');
            alert(message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <Loader2 className="animate-spin text-primary mx-auto mb-4" size={40} />
                    <p className="text-slate-500 font-medium">{t('profile.edit.preparing')}</p>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'basics', label: t('profile.edit.tabs.basics'), step: 1 },
        { id: 'family', label: t('profile.edit.tabs.family'), step: 2 },
        { id: 'career', label: t('profile.edit.tabs.career'), step: 3 },
        { id: 'lifestyle', label: t('profile.edit.tabs.lifestyle'), step: 4 },
        { id: 'preferences', label: t('profile.edit.tabs.partnerPreference'), step: 5 },
        { id: 'media', label: t('profile.edit.tabs.gallery'), step: 6 },
    ];

    return (
        <div className="flex-1 flex flex-col h-full min-h-0 bg-slate-50/50">
            {/* Header */}
            <header className="h-auto py-4 md:py-0 md:h-20 shrink-0 flex flex-col md:flex-row items-start md:items-center justify-between px-4 md:px-8 bg-white border-b border-slate-200 sticky top-0 z-10 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">{t('profile.edit.title')}</h2>
                    <p className="text-sm text-slate-500">{t('profile.edit.subtitle')}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 md:gap-4 w-full md:w-auto">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full border border-orange-100 text-xs font-bold whitespace-nowrap">
                        <AlertCircle size={14} />
                        <span>{t('profile.edit.completeness', { n: qualityScore?.total ?? 0 })}</span>
                    </div>
                    <button
                        onClick={handleDownloadBiodata}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-full hover:bg-slate-200 transition-all text-sm font-bold border border-slate-200 shadow-sm"
                    >
                        <FileDown size={16} className="text-slate-500" />
                        {t('profile.edit.biodata')}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center justify-center gap-2 flex-1 md:flex-none bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded-full font-bold text-sm shadow-md transition-all whitespace-nowrap disabled:opacity-50"
                    >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        {t('profile.edit.saveChanges')}
                    </button>
                </div>
            </header>

            {/* Main Layout */}
            <div className="flex-1 flex overflow-hidden min-h-0">
                {/* Navigation Tabs */}
                <div className="flex-1 min-w-0 flex flex-col overflow-y-auto p-4 md:p-8 scrollbar-hide">

                        {/* Tabs */}
                        <div className="flex gap-2 mb-6 md:mb-8 overflow-x-auto pb-2 scrollbar-hide max-w-full shrink-0">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                flex items-center gap-2 px-4 md:px-5 py-2 md:py-3 rounded-full font-bold text-sm whitespace-nowrap transition-all border shrink-0
                                ${activeTab === tab.id
                                            ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                                        }
                            `}
                                >
                                    <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 ${activeTab === tab.id ? 'bg-white text-slate-900' : 'bg-slate-200 text-slate-600'}`}>{tab.step}</span>
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                    <div className="max-w-5xl mx-auto w-full">

                        {/* Content Area */}
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 pb-8">
                            {activeTab === 'basics' && (
                                <BasicsSection
                                    data={profileData.basics}
                                    optionSets={profileData.optionSets}
                                    updateData={(field, val) => updateData('basics', field, val)}
                                    onRefresh={fetchProfile}
                                    visibility={profileData.visibility}
                                    onToggleVisibility={handleToggleVisibility}
                                />
                            )}
                            {activeTab === 'lifestyle' && (
                                <LifestyleSection
                                    data={profileData.lifestyle}
                                    optionSets={profileData.optionSets}
                                    updateData={(field, val) => updateData('lifestyle', field, val)}
                                />
                            )}
                            {activeTab === 'career' && (
                                <CareerSection
                                    data={profileData.career}
                                    salaryRanges={profileData.salaryRanges}
                                    optionSets={profileData.optionSets}
                                    updateData={(field, val) => updateData('career', field, val)}
                                    visibility={profileData.visibility}
                                    onToggleVisibility={handleToggleVisibility}
                                />
                            )}
                            {activeTab === 'family' && (
                                <FamilySection
                                    data={profileData.family}
                                    optionSets={profileData.optionSets}
                                    updateData={(field, val) => updateData('family', field, val)}
                                />
                            )}
                            {activeTab === 'preferences' && (
                                <PreferencesSection
                                    data={profileData.expectations}
                                    optionSets={profileData.optionSets}
                                    updateData={(field, val) => updateData('expectations', field, val)}
                                />
                            )}
                            {activeTab === 'media' && (
                                <MediaSection
                                    data={profileData.media}
                                    visibility={profileData.visibility}
                                    avatarUrl={profileData.basics.avatarUrl}
                                    onRefresh={fetchProfile}
                                />
                            )}

                            {/* Back / Next Navigation */}
                            <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200">
                                {(() => {
                                    const currentIndex = tabs.findIndex(t => t.id === activeTab);
                                    const prevTab = currentIndex > 0 ? tabs[currentIndex - 1] : null;
                                    const nextTab = currentIndex < tabs.length - 1 ? tabs[currentIndex + 1] : null;
                                    return (
                                        <>
                                            {prevTab ? (
                                                <button
                                                    onClick={() => { setActiveTab(prevTab.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-full hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                                                >
                                                    <ChevronLeft size={16} />
                                                    {t('profile.edit.backTo', { label: prevTab.label })}
                                                </button>
                                            ) : <div />}
                                            {nextTab ? (
                                                <button
                                                    onClick={() => { setActiveTab(nextTab.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-primary hover:bg-primary-hover rounded-full transition-all shadow-md"
                                                >
                                                    {t('profile.edit.nextLabel', { label: nextTab.label })}
                                                    <ChevronRight size={16} />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={handleSave}
                                                    disabled={saving}
                                                    className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-full transition-all shadow-md disabled:opacity-50"
                                                >
                                                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                                    {t('profile.edit.saveProfile')}
                                                </button>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Quality Sidebar (Right) */}
                <div className="w-72 bg-white border-l border-slate-200 p-5 hidden xl:block overflow-y-auto shrink-0">
                    <h3 className="font-bold text-slate-900 mb-4">{t('profile.edit.qualityScore')}</h3>
                    <div className="relative pt-1 mb-6">
                        <div className="flex mb-2 items-center justify-between">
                            <div>
                                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-primary bg-primary/10">
                                    {qualityScore?.level ?? 'N/A'}
                                </span>
                            </div>
                            <div className="text-right">
                                <span className="text-xs font-semibold inline-block text-primary">
                                    {qualityScore?.total ?? 0}%
                                </span>
                            </div>
                        </div>
                        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-primary/10">
                            <div style={{ width: `${qualityScore?.total ?? 0}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"></div>
                        </div>
                    </div>

                    <h4 className="font-bold text-sm text-slate-800 mb-3">{t('profile.edit.improveProfile')}</h4>
                    <div className="space-y-3">
                        {qualityScore?.improvements?.length ? (
                            qualityScore.improvements.map((item: any, index: number) => (
                                <NudgeItem
                                    key={`${item.action}-${index}`}
                                    label={item.action}
                                    points={`+${item.points}%`}
                                    onClick={() => handleNudgeClick(item.action, item.section)}
                                />
                            ))
                        ) : (
                            <p className="text-xs text-green-600 font-medium">{t('profile.edit.profileComplete')}</p>
                        )}
                    </div>

                    <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wide mb-2">{t('profile.edit.duplicateCheck')}</h4>
                        <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                            <Check size={16} />
                            <span>{t('profile.edit.noDuplicates')}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{t('profile.edit.duplicateDesc')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* --- Sub Components for Sections --- */

const normalizeStringList = (value: any): string[] => {
    if (Array.isArray(value)) {
        return value.map((item) => String(item).trim()).filter(Boolean);
    }
    if (typeof value === 'string') {
        return value
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
    }
    return [];
};

const resolveOptionValue = (currentValue: any, options: Array<{ value: any; label?: string }>) => {
    if (currentValue === null || currentValue === undefined || currentValue === '') {
        return '';
    }
    const match = options.find((option) => option.value === currentValue || option.label === currentValue);
    return match ? match.value : currentValue;
};

const ensureOptionValue = (currentValue: any, options: Array<{ value: any; label?: string }>) => {
    if (currentValue === null || currentValue === undefined || currentValue === '') {
        return options;
    }
    const cv = String(currentValue).toLowerCase().trim();
    const exists = options.some((option) => {
        const v = String(option.value ?? '').toLowerCase().trim();
        const l = String(option.label ?? '').toLowerCase().trim();
        return v === cv || l === cv;
    });
    if (exists) {
        return options;
    }
    return [{ value: currentValue, label: String(currentValue) }, ...options];
};

const resolveIdByName = (id: any, name: any, options: Array<{ id: any; name: string }>) => {
    if (id !== null && id !== undefined && id !== '') {
        return String(id);
    }
    if (!name) {
        return '';
    }
    const match = options.find(
        (option) => option.name && option.name.toLowerCase() === String(name).toLowerCase()
    );
    return match ? String(match.id) : '';
};

const formatHeightLabel = (heightCm: any) => {
    const numeric = Number(heightCm);
    if (!Number.isFinite(numeric) || numeric <= 0) {
        return '';
    }
    const totalInches = Math.round(numeric / 2.54);
    const feet = Math.floor(totalInches / 12);
    const inches = totalInches % 12;
    return `${feet}'${inches}"`;
};

const BasicsSection: React.FC<{ data: any, optionSets?: any, updateData: (field: string, val: any) => void, onRefresh: () => void, visibility?: any, onToggleVisibility?: (fieldName: string, currentValue: boolean) => void }> = ({ data, optionSets, updateData, onRefresh, visibility, onToggleVisibility }) => {
    const { t } = useTranslation();
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { user, setUser } = useAuthStore();

    const avatarUrl = data.avatarUrl || user?.avatar_original || user?.avatar || '';

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
                // Update global state
                const newPhotoUrl = response.data.data.photo_url;
                setUser({
                    ...user,
                    avatar: newPhotoUrl,
                    avatar_original: newPhotoUrl
                } as any);

                // Refresh local data
                onRefresh();
                alert("Profile picture updated successfully!");
            }
        } catch (error: any) {
            console.error("Avatar upload failed", error);
            alert(error.response?.data?.message || "Failed to upload profile picture.");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const genderOptions = ensureOptionValue(data?.gender, optionSets?.genders ?? []);
    const marriageTimelineOptions = ensureOptionValue(data?.marriageTimeline, optionSets?.marriageTimeline ?? []);
    const relocationOptions = ensureOptionValue(data?.relocationWillingness, optionSets?.relocationWillingness ?? []);
    const seriousnessOptions = ensureOptionValue(data?.seriousnessLevel, optionSets?.seriousnessLevel ?? []);
    const immigrationOptions = ensureOptionValue(data?.immigrationStatus, optionSets?.immigrationStatusOptions ?? []);
    const countryOptions = optionSets?.countries ?? [];
    const languageOptions = optionSets?.languages ?? [];
    const heightValue = Number.isFinite(Number(data?.height)) ? Number(data.height) : 170;
    const heightLabel = formatHeightLabel(heightValue);

    const [languages, setLanguages] = useState<string[]>(() => {
        return normalizeStringList(data?.languages ?? data?.language);
    });
    const [languageInput, setLanguageInput] = useState('');
    const [stateOptions, setStateOptions] = useState<any[]>([]);
    const [cityOptions, setCityOptions] = useState<any[]>([]);
    const [loadingStates, setLoadingStates] = useState(false);
    const [loadingCities, setLoadingCities] = useState(false);

    useEffect(() => {
        setLanguages(normalizeStringList(data?.languages ?? data?.language));
    }, [data?.languages, data?.language]);

    const applyLanguages = (nextLanguages: string[]) => {
        setLanguages(nextLanguages);
        updateData('languages', nextLanguages);
        updateData('language', nextLanguages.join(', '));
    };

    const handleAddLanguage = () => {
        const nextValue = languageInput.trim();
        if (!nextValue) return;
        if (languages.some((lang) => lang.toLowerCase() === nextValue.toLowerCase())) {
            setLanguageInput('');
            return;
        }
        applyLanguages([...languages, nextValue]);
        setLanguageInput('');
    };

    const handleRemoveLanguage = (label: string) => {
        applyLanguages(languages.filter((lang) => lang !== label));
    };

    useEffect(() => {
        const countryId = data?.currentResidencyCountryId;
        if (!countryId) {
            setStateOptions([]);
            return;
        }
        let isActive = true;
        setLoadingStates(true);
        api.get(`/member/states/${countryId}`)
            .then((response) => {
                if (!isActive) return;
                const payload = response.data?.data ?? response.data ?? [];
                setStateOptions(Array.isArray(payload) ? payload : []);
            })
            .catch(() => {
                if (!isActive) return;
                setStateOptions([]);
            })
            .finally(() => {
                if (!isActive) return;
                setLoadingStates(false);
            });
        return () => {
            isActive = false;
        };
    }, [data?.currentResidencyCountryId]);

    useEffect(() => {
        const stateId = data?.currentResidencyStateId;
        if (!stateId) {
            setCityOptions([]);
            return;
        }
        let isActive = true;
        setLoadingCities(true);
        api.get(`/member/cities/${stateId}`)
            .then((response) => {
                if (!isActive) return;
                const payload = response.data?.data ?? response.data ?? [];
                setCityOptions(Array.isArray(payload) ? payload : []);
            })
            .catch(() => {
                if (!isActive) return;
                setCityOptions([]);
            })
            .finally(() => {
                if (!isActive) return;
                setLoadingCities(false);
            });
        return () => {
            isActive = false;
        };
    }, [data?.currentResidencyStateId]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title={t('profile.edit.personalBasics')}>
                <div className="flex flex-col items-center mb-6 pb-6 border-b border-slate-100">
                    <div className="relative group">
                        <div
                            className={`size-24 rounded-full bg-slate-100 border-4 border-white shadow-xl bg-cover bg-center transition-all cursor-pointer ${uploading ? 'opacity-50' : 'hover:scale-105 hover:brightness-90'}`}
                            style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : undefined}
                            onClick={handleAvatarClick}
                        >
                            {!avatarUrl && !uploading && <User size={40} className="text-slate-300 absolute inset-0 m-auto" />}
                        </div>
                        <div
                            onClick={handleAvatarClick}
                            className="absolute bottom-0 right-0 size-8 bg-primary text-white rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:bg-primary-hover transition-colors"
                        >
                            <Camera size={14} />
                        </div>
                        {uploading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/40 rounded-full">
                                <Loader2 size={24} className="animate-spin text-primary" />
                            </div>
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 mt-3 uppercase tracking-widest">{t('profile.edit.clickToChangePhoto')}</p>
                </div>

                <div className="space-y-4">
                    <InputGroup label={t('profile.edit.fullName')}>
                        <input
                            type="text"
                            className="form-input"
                            value={data.firstName ?? ''}
                            onChange={(e) => updateData('firstName', e.target.value)}
                        />
                        {onToggleVisibility && (
                            <VisibilityToggle
                                fieldName="full_name"
                                isVisible={visibility?.full_name !== false}
                                onToggle={onToggleVisibility}
                            />
                        )}
                    </InputGroup>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InputGroup label={t('profile.edit.dateOfBirth')}>
                            <input
                                type="date"
                                className="form-input"
                                value={data.dateOfBirth?.split(' ')[0] ?? ''}
                                onChange={(e) => updateData('dateOfBirth', e.target.value)}
                            />
                        </InputGroup>
                        <InputGroup label={t('profile.edit.gender')}>
                            <select
                                className="form-input"
                                value={resolveOptionValue(data.gender, genderOptions)}
                                onChange={(e) => updateData('gender', e.target.value)}
                            >
                                <option value="">{t('profile.edit.selectGender')}</option>
                                {genderOptions.map((option: any) => (
                                    <option key={option.value} value={option.value}>{option.label ?? option.value}</option>
                                ))}
                            </select>
                        </InputGroup>
                    </div>

                    <InputGroup label={t('profile.edit.height')}>
                        <div className="flex items-center gap-3">
                            <Ruler size={18} className="text-slate-400" />
                            <input
                                type="range"
                                className="flex-1 accent-primary"
                                min="140"
                                max="220"
                                value={heightValue}
                                onChange={(e) => updateData('height', Number(e.target.value))}
                            />
                            <span className="text-sm font-bold text-slate-700 w-16">{heightLabel || "5'7\""}</span>
                        </div>
                    </InputGroup>

                    <InputGroup label={t('profile.edit.aboutMe')}>
                        <textarea
                            className="form-input min-h-[100px] resize-y"
                            placeholder={t('profile.edit.aboutMePlaceholder')}
                            value={data.introduction ?? ''}
                            onChange={(e) => updateData('introduction', e.target.value)}
                            maxLength={1000}
                        />
                        <p className="text-[10px] text-slate-400 mt-1 text-right">{(data.introduction?.length ?? 0)}/1000</p>
                    </InputGroup>
                </div>
            </Card>

            <Card title={t('profile.edit.originLocation')}>
                <div className="space-y-4">
                    <InputGroup label={t('profile.edit.languagesSpoken')}>
                        <div className="flex flex-wrap gap-2 items-center">
                            {languages.map((label) => (
                                <Badge key={label} label={label} onRemove={() => handleRemoveLanguage(label)} />
                            ))}
                            <input
                                type="text"
                                value={languageInput}
                                onChange={(e) => setLanguageInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddLanguage();
                                    }
                                }}
                                placeholder={t('profile.edit.addLanguage')}
                                className="text-xs border border-slate-200 rounded-md px-2 py-1 focus:border-primary focus:outline-none"
                                list="language-options"
                            />
                            <datalist id="language-options">
                                {languageOptions.map((option: any) => (
                                    <option key={option.id} value={option.name} />
                                ))}
                            </datalist>
                            <button
                                type="button"
                                onClick={handleAddLanguage}
                                disabled={!languageInput.trim()}
                                className="text-xs font-bold text-primary flex items-center gap-1 bg-primary/5 px-2 py-1 rounded-md hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Plus size={12} /> {t('profile.edit.add')}
                            </button>
                        </div>
                    </InputGroup>

                    <InputGroup label={t('profile.edit.nationality')}>
                        <div className="flex items-center gap-2 form-input bg-white">
                            <Globe size={16} className="text-slate-400" />
                            <select
                                className="flex-1 bg-transparent outline-none"
                                value={data.nationality ?? ''}
                                onChange={(e) => updateData('nationality', e.target.value)}
                            >
                                <option value="">{t('profile.edit.selectNationality')}</option>
                                {data.nationality && !countryOptions.some((country: any) => country.name === data.nationality) && (
                                    <option value={data.nationality}>{data.nationality}</option>
                                )}
                                {countryOptions.map((country: any) => (
                                    <option key={country.id ?? country.code} value={country.name}>{country.name}</option>
                                ))}
                            </select>
                        </div>
                    </InputGroup>

                    <InputGroup label={t('profile.edit.immigrationStatus')} optional>
                        <select
                            className="form-input"
                            value={resolveOptionValue(data.immigrationStatus, immigrationOptions)}
                            onChange={(e) => updateData('immigrationStatus', e.target.value)}
                        >
                            <option value="">{t('profile.edit.selectStatus')}</option>
                            {immigrationOptions.map((option: any) => (
                                <option key={option.value} value={option.value}>{option.label ?? option.value}</option>
                            ))}
                        </select>
                    </InputGroup>

                    <InputGroup label={t('profile.edit.currentResidency')}>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <select
                                className="form-input"
                                value={data.currentResidencyCountryId ?? ''}
                                onChange={(e) => {
                                    const nextValue = e.target.value ? Number(e.target.value) : null;
                                    updateData('currentResidencyCountryId', nextValue);
                                    updateData('currentResidencyStateId', null);
                                    updateData('currentResidencyCityId', null);
                                }}
                            >
                                <option value="">{t('profile.edit.selectCountry')}</option>
                                {countryOptions.map((country: any) => (
                                    <option key={country.id ?? country.code} value={country.id}>{country.name}</option>
                                ))}
                            </select>
                            <select
                                className="form-input"
                                value={data.currentResidencyStateId ?? ''}
                                onChange={(e) => {
                                    const nextValue = e.target.value ? Number(e.target.value) : null;
                                    updateData('currentResidencyStateId', nextValue);
                                    updateData('currentResidencyCityId', null);
                                }}
                                disabled={!data.currentResidencyCountryId || loadingStates}
                            >
                                <option value="">{loadingStates ? t('profile.edit.loadingStates') : t('profile.edit.selectState')}</option>
                                {stateOptions.map((state: any) => (
                                    <option key={state.id} value={state.id}>{state.name}</option>
                                ))}
                            </select>
                            <select
                                className="form-input"
                                value={data.currentResidencyCityId ?? ''}
                                onChange={(e) => updateData('currentResidencyCityId', e.target.value ? Number(e.target.value) : null)}
                                disabled={!data.currentResidencyStateId || loadingCities}
                            >
                                <option value="">{loadingCities ? t('profile.edit.loadingCities') : t('profile.edit.selectCity')}</option>
                                {cityOptions.map((city: any) => (
                                    <option key={city.id} value={city.id}>{city.name}</option>
                                ))}
                            </select>
                        </div>
                    </InputGroup>
                </div>
            </Card>

            <div className="md:col-span-2">
                <Card title={t('profile.edit.marriageIntent')}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <InputGroup label={t('profile.edit.timeline')} optional>
                            <select
                                className="form-input"
                                value={resolveOptionValue(data.marriageTimeline, marriageTimelineOptions)}
                                onChange={(e) => updateData('marriageTimeline', e.target.value)}
                            >
                                <option value="">{t('profile.edit.selectTimeline')}</option>
                                {marriageTimelineOptions.map((option: any) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </InputGroup>
                        <InputGroup label={t('profile.edit.relocationWillingness')} optional>
                            <select
                                className="form-input"
                                value={resolveOptionValue(data.relocationWillingness, relocationOptions)}
                                onChange={(e) => updateData('relocationWillingness', e.target.value)}
                            >
                                <option value="">{t('profile.edit.selectPreference')}</option>
                                {relocationOptions.map((option: any) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </InputGroup>
                        <InputGroup label={t('profile.edit.seriousness')} optional>
                            <div className="flex items-center gap-2 form-input bg-green-50 text-green-700 border border-green-200">
                                <Check size={16} />
                                <select
                                    className="flex-1 bg-transparent outline-none text-green-700 font-bold"
                                    value={resolveOptionValue(data.seriousnessLevel, seriousnessOptions)}
                                    onChange={(e) => updateData('seriousnessLevel', e.target.value)}
                                >
                                    <option value="">{t('profile.edit.selectLevel')}</option>
                                    {seriousnessOptions.map((option: any) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </div>
                        </InputGroup>
                    </div>
                </Card>
            </div>
        </div>
    );
};

const LifestyleSection: React.FC<{ data: any, optionSets?: any, updateData: (field: string, val: any) => void }> = ({ data, optionSets, updateData }) => {
    const { t } = useTranslation();
    const dietOptions = ensureOptionValue(data?.diet, optionSets?.dietOptions ?? []);
    const drinkOptions = ensureOptionValue(data?.drink, optionSets?.drinkOptions ?? []);
    const smokeOptions = ensureOptionValue(data?.smoke, optionSets?.smokeOptions ?? []);
    const sleepOptions = ensureOptionValue(data?.sleepSchedule, optionSets?.sleepScheduleOptions ?? []);
    const propertyOptions = ensureOptionValue(data?.property, optionSets?.propertyOptions ?? []);
    const livingWithOptions = ensureOptionValue(data?.livingWith, optionSets?.livingWithOptions ?? []);
    const personalityOptions = optionSets?.personalityTags ?? [];
    const personalValueOptions = ensureOptionValue(data?.personalValue, optionSets?.personalValues ?? []);
    const communityValueOptions = ensureOptionValue(data?.communityValue, optionSets?.communityValues ?? []);
    const familyValues = optionSets?.familyValues ?? [];

    const [hobbies, setHobbies] = useState<string[]>(() => normalizeStringList(data?.hobbies));
    const [interests, setInterests] = useState<string[]>(() => normalizeStringList(data?.interests));
    const [personalityTags, setPersonalityTags] = useState<string[]>(() => normalizeStringList(data?.personalityTags));
    const [hobbyInput, setHobbyInput] = useState('');
    const [interestInput, setInterestInput] = useState('');
    const [personalityInput, setPersonalityInput] = useState('');

    // Initialize property entries from the `properties` array or fallback to single entry
    const [properties, setProperties] = React.useState<any[]>(() => {
        if (data?.properties && data.properties.length > 0) {
            return data.properties.map((p: any) => ({ ...p }));
        }
        // Fallback: single legacy entry
        if (data?.propertyDetails) {
            return [{
                id: null,
                details: data.propertyDetails || '',
            }];
        }
        return [{ id: null, details: '' }];
    });

    // Sync properties array to parent data on change
    const syncProperties = React.useCallback((updated: any[]) => {
        setProperties(updated);
        updateData('properties', updated);
        // Also keep legacy field from first entry for backward compat
        if (updated.length > 0) {
            updateData('propertyDetails', updated[0].details);
        }
    }, [updateData]);

    const updateProperty = (index: number, field: string, value: any) => {
        const updated = [...properties];
        updated[index] = { ...updated[index], [field]: value };
        syncProperties(updated);
    };

    const addProperty = () => {
        syncProperties([...properties, { id: null, details: '' }]);
    };

    const removeProperty = (index: number) => {
        if (properties.length <= 1) return;
        const updated = properties.filter((_, i) => i !== index);
        syncProperties(updated);
    };

    useEffect(() => {
        setHobbies(normalizeStringList(data?.hobbies));
    }, [data?.hobbies]);

    useEffect(() => {
        setInterests(normalizeStringList(data?.interests));
    }, [data?.interests]);

    useEffect(() => {
        setPersonalityTags(normalizeStringList(data?.personalityTags));
    }, [data?.personalityTags]);

    useEffect(() => {
        if (data?.properties && data.properties.length > 0) {
            setProperties(data.properties.map((p: any) => ({ ...p })));
        } else if (data?.propertyDetails) {
            setProperties([{ id: null, details: data.propertyDetails }]);
        }
    }, [data?.properties, data?.propertyDetails]);

    const applyTagList = (nextList: string[], field: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
        setter(nextList);
        updateData(field, nextList);
    };

    const addTag = (value: string, field: string, list: string[], setter: React.Dispatch<React.SetStateAction<string[]>>) => {
        const nextValue = value.trim();
        if (!nextValue) return;
        if (list.some((item) => item.toLowerCase() === nextValue.toLowerCase())) return;
        applyTagList([...list, nextValue], field, setter);
    };

    const removeTag = (value: string, field: string, list: string[], setter: React.Dispatch<React.SetStateAction<string[]>>) => {
        applyTagList(list.filter((item) => item !== value), field, setter);
    };

    const togglePersonalityTag = (value: string) => {
        const exists = personalityTags.some((tag) => tag.toLowerCase() === value.toLowerCase());
        if (exists) {
            applyTagList(personalityTags.filter((tag) => tag.toLowerCase() !== value.toLowerCase()), 'personalityTags', setPersonalityTags);
        } else {
            applyTagList([...personalityTags, value], 'personalityTags', setPersonalityTags);
        }
    };

    const personalityLabel = (value: string) => {
        const match = personalityOptions.find((option: any) => option.value === value || option.label === value);
        return match?.label ?? value;
    };

    return (
        <div className="space-y-6">
            <Card title={t('profile.edit.habitsLifestyle')}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <InputGroup label={t('profile.edit.dietaryPreferences')}>
                        <select
                            className="form-input"
                            value={resolveOptionValue(data.diet, dietOptions)}
                            onChange={(e) => updateData('diet', e.target.value)}
                        >
                            <option value="">{t('profile.edit.selectDiet')}</option>
                            {dietOptions.map((option: any) => (
                                <option key={option.value} value={option.value}>{option.label ?? option.value}</option>
                            ))}
                        </select>
                    </InputGroup>
                    <InputGroup label={t('profile.edit.drinking')}>
                        <select
                            className="form-input"
                            value={resolveOptionValue(data.drink, drinkOptions)}
                            onChange={(e) => updateData('drink', e.target.value)}
                        >
                            <option value="">{t('profile.edit.selectOption')}</option>
                            {drinkOptions.map((option: any) => (
                                <option key={option.value} value={option.value}>{option.label ?? option.value}</option>
                            ))}
                        </select>
                    </InputGroup>
                    <InputGroup label={t('profile.edit.smoking')}>
                        <select
                            className="form-input"
                            value={resolveOptionValue(data.smoke, smokeOptions)}
                            onChange={(e) => updateData('smoke', e.target.value)}
                        >
                            <option value="">{t('profile.edit.selectOption')}</option>
                            {smokeOptions.map((option: any) => (
                                <option key={option.value} value={option.value}>{option.label ?? option.value}</option>
                            ))}
                        </select>
                    </InputGroup>
                    <InputGroup label={t('profile.edit.house')}>
                        <select
                            className="form-input"
                            value={resolveOptionValue(data.property, propertyOptions)}
                            onChange={(e) => updateData('property', e.target.value)}
                        >
                            <option value="">{t('profile.edit.selectHouseStatus')}</option>
                            {propertyOptions.map((option: any) => (
                                <option key={option.value} value={option.value}>{option.label ?? option.value}</option>
                            ))}
                        </select>
                    </InputGroup>
                    <InputGroup label={t('profile.edit.livingWith')}>
                        <select
                            className="form-input"
                            value={resolveOptionValue(data.livingWith, livingWithOptions)}
                            onChange={(e) => updateData('livingWith', e.target.value)}
                        >
                            <option value="">{t('profile.edit.selectArrangement')}</option>
                            {livingWithOptions.map((option: any) => (
                                <option key={option.value} value={option.value}>{option.label ?? option.value}</option>
                            ))}
                        </select>
                    </InputGroup>
                    <InputGroup label={t('profile.edit.sleepSchedule')}>
                        <div className="flex items-center gap-2 form-input">
                            <Moon size={16} className="text-slate-400" />
                            <select
                                className="flex-1 bg-transparent outline-none"
                                value={resolveOptionValue(data.sleepSchedule, sleepOptions)}
                                onChange={(e) => updateData('sleepSchedule', e.target.value)}
                            >
                                <option value="">{t('profile.edit.selectSchedule')}</option>
                                {sleepOptions.map((option: any) => (
                                    <option key={option.value} value={option.value}>{option.label ?? option.value}</option>
                                ))}
                            </select>
                        </div>
                    </InputGroup>
                </div>
            </Card>

            <Card title={t('profile.edit.property')} action={
                <button 
                    type="button" 
                    onClick={addProperty}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-full transition-colors"
                >
                    <Plus size={14} /> {t('profile.edit.addEntry')}
                </button>
            }>
                <div className="space-y-4">
                    {properties.map((prop, index) => (
                        <div key={prop.id || `new-prop-${index}`} className="flex items-start gap-4 p-6 bg-slate-50 rounded-xl border border-slate-100 relative group">
                            <div className="size-12 bg-white rounded-full border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                                <Home size={22} className="text-primary" />
                            </div>
                            <div className="flex-1 space-y-4">
                                {properties.length > 1 && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('profile.edit.entry', { n: index + 1 })}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeProperty(index)}
                                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            title="Remove this entry"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                )}
                                <InputGroup label={t('profile.edit.propertyPlaceholder')}>
                                    <input
                                        type="text"
                                        className="form-input bg-white"
                                        placeholder={t('profile.edit.propertyPlaceholder')}
                                        defaultValue={prop.details}
                                        onBlur={(e) => updateProperty(index, 'details', e.target.value)}
                                    />
                                </InputGroup>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            <Card title={t('profile.edit.personalityInterests')}>
                <div className="space-y-6">
                    <InputGroup label={t('profile.edit.hobbies')}>
                        <div className="flex flex-wrap gap-2 items-center">
                            {hobbies.map((tag) => (
                                <Badge key={tag} label={tag} color="blue" onRemove={() => removeTag(tag, 'hobbies', hobbies, setHobbies)} />
                            ))}
                            <input
                                type="text"
                                value={hobbyInput}
                                onChange={(e) => setHobbyInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        addTag(hobbyInput, 'hobbies', hobbies, setHobbies);
                                        setHobbyInput('');
                                    }
                                }}
                                placeholder={t('profile.edit.addHobby')}
                                className="text-xs border border-slate-200 rounded-md px-2 py-1 focus:border-primary focus:outline-none"
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    addTag(hobbyInput, 'hobbies', hobbies, setHobbies);
                                    setHobbyInput('');
                                }}
                                disabled={!hobbyInput.trim()}
                                className="text-xs font-bold text-primary flex items-center gap-1 bg-primary/5 px-2 py-1 rounded-md hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Plus size={12} /> {t('profile.edit.add')}
                            </button>
                        </div>
                        <p className="text-xs text-slate-400">{t('profile.edit.hobbyHint')}</p>
                    </InputGroup>

                    <InputGroup label={t('profile.edit.interests')}>
                        <div className="flex flex-wrap gap-2 items-center">
                            {interests.map((tag) => (
                                <Badge key={tag} label={tag} color="purple" onRemove={() => removeTag(tag, 'interests', interests, setInterests)} />
                            ))}
                            <input
                                type="text"
                                value={interestInput}
                                onChange={(e) => setInterestInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        addTag(interestInput, 'interests', interests, setInterests);
                                        setInterestInput('');
                                    }
                                }}
                                placeholder={t('profile.edit.addInterest')}
                                className="text-xs border border-slate-200 rounded-md px-2 py-1 focus:border-primary focus:outline-none"
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    addTag(interestInput, 'interests', interests, setInterests);
                                    setInterestInput('');
                                }}
                                disabled={!interestInput.trim()}
                                className="text-xs font-bold text-primary flex items-center gap-1 bg-primary/5 px-2 py-1 rounded-md hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Plus size={12} /> {t('profile.edit.add')}
                            </button>
                        </div>
                        <p className="text-xs text-slate-400">{t('profile.edit.interestHint')}</p>
                    </InputGroup>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="block text-sm font-bold text-slate-800 mb-3">{t('profile.edit.personalityTags')}</label>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {personalityTags.map((tag) => (
                                    <Badge key={tag} label={personalityLabel(tag)} color="orange" onRemove={() => removeTag(tag, 'personalityTags', personalityTags, setPersonalityTags)} />
                                ))}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {personalityOptions.map((option: any) => {
                                    const isSelected = personalityTags.some((tag) => tag.toLowerCase() === option.value.toLowerCase());
                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => togglePersonalityTag(option.value)}
                                            className={`px-3 py-1 rounded-full border text-xs transition-colors ${isSelected
                                                ? 'border-primary bg-primary/10 text-primary'
                                                : 'border-slate-200 text-slate-600 hover:border-primary hover:text-primary'
                                                }`}
                                        >
                                            {option.label ?? option.value}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="mt-3 flex items-center gap-2">
                                <input
                                    type="text"
                                    value={personalityInput}
                                    onChange={(e) => setPersonalityInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addTag(personalityInput, 'personalityTags', personalityTags, setPersonalityTags);
                                            setPersonalityInput('');
                                        }
                                    }}
                                    placeholder={t('profile.edit.addCustomTag')}
                                    className="text-xs border border-slate-200 rounded-md px-2 py-1 focus:border-primary focus:outline-none flex-1"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        addTag(personalityInput, 'personalityTags', personalityTags, setPersonalityTags);
                                        setPersonalityInput('');
                                    }}
                                    disabled={!personalityInput.trim()}
                                    className="text-xs font-bold text-primary bg-primary/5 px-2 py-1 rounded-md hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {t('profile.edit.add')}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-800 mb-3">{t('profile.edit.religiousCulturalValues')} <span className="text-[10px] font-semibold text-pink-600 bg-pink-100 px-2 py-0.5 rounded-full">{t('profile.edit.optional')}</span></label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <select
                                    className="form-input text-sm"
                                    value={resolveOptionValue(data.personalValue, personalValueOptions)}
                                    onChange={(e) => updateData('personalValue', e.target.value)}
                                >
                                    <option value="">{t('profile.edit.selectPersonalValue')}</option>
                                    {personalValueOptions.map((option: any) => (
                                        <option key={option.value} value={option.value}>{option.label ?? option.value}</option>
                                    ))}
                                </select>
                                <select
                                    className="form-input text-sm"
                                    value={resolveOptionValue(data.communityValue, communityValueOptions)}
                                    onChange={(e) => updateData('communityValue', e.target.value)}
                                >
                                    <option value="">{t('profile.edit.selectCommunityValue')}</option>
                                    {communityValueOptions.map((option: any) => (
                                        <option key={option.value} value={option.value}>{option.label ?? option.value}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="mt-4">
                                <select
                                    className="form-input text-sm"
                                    value={data.familyValueId ?? ''}
                                    onChange={(e) => updateData('familyValueId', e.target.value ? Number(e.target.value) : null)}
                                >
                                    <option value="">{t('profile.edit.selectFamilyValue')}</option>
                                    {familyValues.map((option: any) => (
                                        <option key={option.id} value={option.id}>{option.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

const CareerSection: React.FC<{ data: any, salaryRanges?: any[], optionSets?: any, updateData: (field: string, val: any) => void, visibility?: any, onToggleVisibility?: (fieldName: string, currentValue: boolean) => void }> = ({ data, salaryRanges = [], optionSets, updateData, visibility, onToggleVisibility }) => {
    const { t } = useTranslation();
    const workLocationOptions = ensureOptionValue(data?.workLocationType, optionSets?.workLocationOptions ?? []);

    // Initialize education entries from the `educations` array or fallback to single entry
    const [educations, setEducations] = React.useState<any[]>(() => {
        if (data?.educations && data.educations.length > 0) {
            return data.educations.map((e: any) => ({ ...e }));
        }
        // Fallback: single legacy entry
        if (data?.education || data?.institution) {
            return [{
                id: null,
                degree: data.education || '',
                institution: data.institution || '',
                start: data.educationStart || '',
                end: data.educationEnd || '',
                isHighestDegree: data.isHighestDegree || false,
            }];
        }
        return [{ id: null, degree: '', institution: '', start: '', end: '', isHighestDegree: false }];
    });

    // Initialize career entries from the `careers` array or fallback to single entry
    const [careers, setCareers] = React.useState<any[]>(() => {
        if (data?.careers && data.careers.length > 0) {
            return data.careers.map((c: any) => ({ ...c }));
        }
        // Fallback: single legacy entry
        if (data?.designation || data?.company) {
            return [{
                id: null,
                designation: data.designation || '',
                company: data.company || '',
                start: data.careerStart || '',
                end: data.careerEnd || '',
                present: data.careerPresent || false,
                workLocationType: data.workLocationType || '',
            }];
        }
        return [{ id: null, designation: '', company: '', start: '', end: '', present: false, workLocationType: '' }];
    });

    // Sync educations array to parent data on change
    const syncEducations = React.useCallback((updated: any[]) => {
        setEducations(updated);
        updateData('educations', updated);
        // Also keep legacy fields from first entry for backward compat
        if (updated.length > 0) {
            updateData('education', updated[0].degree);
            updateData('institution', updated[0].institution);
            updateData('educationStart', updated[0].start);
            updateData('educationEnd', updated[0].end);
            updateData('isHighestDegree', updated[0].isHighestDegree);
        }
    }, [updateData]);

    // Sync careers array to parent data on change
    const syncCareers = React.useCallback((updated: any[]) => {
        setCareers(updated);
        updateData('careers', updated);
        // Also keep legacy fields from first entry for backward compat
        if (updated.length > 0) {
            updateData('designation', updated[0].designation);
            updateData('company', updated[0].company);
            updateData('careerStart', updated[0].start);
            updateData('careerEnd', updated[0].end);
            updateData('careerPresent', updated[0].present);
            updateData('workLocationType', updated[0].workLocationType);
        }
    }, [updateData]);

    const updateEducation = (index: number, field: string, value: any) => {
        const updated = [...educations];
        updated[index] = { ...updated[index], [field]: value };
        syncEducations(updated);
    };

    const addEducation = () => {
        syncEducations([...educations, { id: null, degree: '', institution: '', start: '', end: '', isHighestDegree: false }]);
    };

    const removeEducation = (index: number) => {
        if (educations.length <= 1) return;
        const updated = educations.filter((_, i) => i !== index);
        syncEducations(updated);
    };

    const updateCareer = (index: number, field: string, value: any) => {
        const updated = [...careers];
        updated[index] = { ...updated[index], [field]: value };
        syncCareers(updated);
    };

    const addCareer = () => {
        syncCareers([...careers, { id: null, designation: '', company: '', start: '', end: '', present: false, workLocationType: '' }]);
    };

    const removeCareer = (index: number) => {
        if (careers.length <= 1) return;
        const updated = careers.filter((_, i) => i !== index);
        syncCareers(updated);
    };

    return (
        <div className="space-y-6">
            <Card title={t('profile.edit.educationBackground')} action={
                <button 
                    type="button" 
                    onClick={addEducation}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-full transition-colors"
                >
                    <Plus size={14} /> {t('profile.edit.addEntry')}
                </button>
            }>
                <div className="space-y-4">
                    {educations.map((edu, index) => (
                        <div key={edu.id || `new-edu-${index}`} className="flex items-start gap-4 p-6 bg-slate-50 rounded-xl border border-slate-100 relative group">
                            <div className="size-12 bg-white rounded-full border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                                <GraduationCap size={22} className="text-primary" />
                            </div>
                            <div className="flex-1 space-y-4">
                                {educations.length > 1 && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('profile.edit.entry', { n: index + 1 })}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeEducation(index)}
                                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            title="Remove this entry"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InputGroup label={t('profile.edit.degreeQualification')}>
                                        <input
                                            type="text"
                                            className="form-input bg-white"
                                            placeholder={t('profile.edit.degreePlaceholder')}
                                            defaultValue={edu.degree}
                                            onBlur={(e) => updateEducation(index, 'degree', e.target.value)}
                                        />
                                    </InputGroup>
                                    <InputGroup label={t('profile.edit.institutionUniversity')}>
                                        <input
                                            type="text"
                                            className="form-input bg-white"
                                            placeholder={t('profile.edit.institutionPlaceholder')}
                                            defaultValue={edu.institution}
                                            onBlur={(e) => updateEducation(index, 'institution', e.target.value)}
                                        />
                                    </InputGroup>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <InputGroup label={t('profile.edit.startYear')}>
                                        <input
                                            type="number"
                                            className="form-input bg-white text-sm"
                                            placeholder="YYYY"
                                            defaultValue={edu.start}
                                            onBlur={(e) => updateEducation(index, 'start', e.target.value)}
                                        />
                                    </InputGroup>
                                    <InputGroup label={t('profile.edit.endYear')}>
                                        <input
                                            type="number"
                                            className="form-input bg-white text-sm"
                                            placeholder="YYYY"
                                            defaultValue={edu.end}
                                            onBlur={(e) => updateEducation(index, 'end', e.target.value)}
                                        />
                                    </InputGroup>
                                    <div className="flex items-end pb-3">
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                className="size-4 rounded border-slate-300 text-primary focus:ring-primary"
                                                checked={!!edu.isHighestDegree}
                                                onChange={(e) => updateEducation(index, 'isHighestDegree', e.target.checked)}
                                            />
                                            <span className="text-xs font-bold text-slate-600 group-hover:text-primary transition-colors">{t('profile.edit.highestDegree')}</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            <Card title={t('profile.edit.currentEmployment')} action={
                <button 
                    type="button" 
                    onClick={addCareer}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-full transition-colors"
                >
                    <Plus size={14} /> {t('profile.edit.addEntry')}
                </button>
            }>
                <div className="space-y-6">
                    {careers.map((career, index) => (
                        <div key={career.id || `new-car-${index}`} className={`space-y-6 ${index > 0 ? 'pt-6 border-t border-slate-200' : ''}`}>
                            {careers.length > 1 && (
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('profile.edit.position', { n: index + 1 })}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeCareer(index)}
                                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Remove this entry"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputGroup label={t('profile.edit.professionDesignation')}>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder={t('profile.edit.professionPlaceholder')}
                                        defaultValue={career.designation}
                                        onBlur={(e) => updateCareer(index, 'designation', e.target.value)}
                                    />
                                </InputGroup>

                                <InputGroup label={t('profile.edit.employerHospital')}>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            className="form-input flex-1"
                                            placeholder={t('profile.edit.employerPlaceholder')}
                                            defaultValue={career.company}
                                            onBlur={(e) => updateCareer(index, 'company', e.target.value)}
                                        />
                                        {index === 0 && (
                                            <button
                                                type="button"
                                                onClick={() => onToggleVisibility && onToggleVisibility('company', visibility?.company !== false)}
                                                className={`flex items-center justify-center px-3 border rounded-lg transition-colors ${
                                                    visibility?.company === false
                                                        ? 'border-red-200 bg-red-50 text-red-500 hover:bg-red-100'
                                                        : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
                                                }`}
                                                title={visibility?.company === false ? 'Hidden from public view — click to show' : 'Visible — click to mask'}
                                            >
                                                {visibility?.company === false ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        )}
                                    </div>
                                </InputGroup>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <InputGroup label={t('profile.edit.startYear')}>
                                        <input
                                            type="number"
                                            className="form-input text-sm"
                                            placeholder="YYYY"
                                            defaultValue={career.start}
                                            onBlur={(e) => updateCareer(index, 'start', e.target.value)}
                                        />
                                    </InputGroup>
                                    <InputGroup label={t('profile.edit.endYear')}>
                                        <input
                                            type="number"
                                            className="form-input text-sm disabled:bg-slate-50 disabled:text-slate-400"
                                            placeholder="YYYY"
                                            disabled={!!career.present}
                                            defaultValue={career.end}
                                            onBlur={(e) => updateCareer(index, 'end', e.target.value)}
                                        />
                                    </InputGroup>
                                </div>
                                <div className="flex items-end pb-3">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            className="size-4 rounded border-slate-300 text-primary focus:ring-primary"
                                            checked={!!career.present}
                                            onChange={(e) => updateCareer(index, 'present', e.target.checked)}
                                        />
                                        <span className="text-xs font-bold text-slate-600 group-hover:text-primary transition-colors">{t('profile.edit.iCurrentlyWorkHere')}</span>
                                    </label>
                                </div>
                            </div>

                            {/* Income & Work Location only on first entry */}
                            {index === 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                                    <InputGroup label={t('profile.edit.annualIncome')} optional>
                                        <div className="flex gap-2">
                                            <select
                                                className="form-input flex-1"
                                                value={salaryRanges.length ? String(data.incomeRangeId ?? '') : (data.income ?? '')}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    if (salaryRanges.length) {
                                                        updateData('incomeRangeId', value ? Number(value) : null);
                                                        const selected = salaryRanges.find((range: any) => String(range.id) === value);
                                                        updateData('income', selected?.label ?? '');
                                                    } else {
                                                        updateData('income', value);
                                                    }
                                                }}
                                            >
                                                <option value="">{t('profile.edit.selectIncome')}</option>
                                                {salaryRanges.length ? (
                                                    salaryRanges.map((range: any) => (
                                                        <option key={range.id} value={range.id}>{range.label}</option>
                                                    ))
                                                ) : (
                                                    <option value={data.income ?? ''}>{data.income ?? t('profile.edit.noOptionsAvailable')}</option>
                                                )}
                                            </select>
                                            <button
                                                type="button"
                                                onClick={() => onToggleVisibility && onToggleVisibility('income', visibility?.income !== false)}
                                                className={`flex items-center justify-center px-3 border rounded-lg transition-colors ${
                                                    visibility?.income === false
                                                        ? 'border-green-200 bg-green-50 text-green-600 hover:bg-green-100'
                                                        : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
                                                }`}
                                                title={visibility?.income === false ? 'Income hidden — click to show to mutual matches' : 'Visible to mutual matches — click to hide'}
                                            >
                                                {visibility?.income === false ? <Lock size={18} /> : <Lock size={18} className="text-green-600" />}
                                            </button>
                                        </div>
                                    </InputGroup>

                                    <InputGroup label={t('profile.edit.workLocation')}>
                                        <select
                                            className="form-input"
                                            value={resolveOptionValue(career.workLocationType, workLocationOptions)}
                                            onChange={(e) => {
                                                updateCareer(0, 'workLocationType', e.target.value);
                                                updateData('workLocationType', e.target.value);
                                            }}
                                        >
                                            <option value="">{t('profile.edit.selectWorkLocation')}</option>
                                            {workLocationOptions.map((option: any) => (
                                                <option key={option.value} value={option.value}>{option.label ?? option.value}</option>
                                            ))}
                                        </select>
                                    </InputGroup>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
};

const FamilySection: React.FC<{ data: any, optionSets?: any, updateData: (field: string, val: any) => void }> = ({ data, optionSets, updateData }) => {
    const { t } = useTranslation();
    const [liveCastes, setLiveCastes] = useState<any[]>([]);
    const [liveSects, setLiveSects] = useState<any[]>([]);
    const [loadingCastes, setLoadingCastes] = useState(false);
    const familyTypeOptions = ensureOptionValue(data?.familyType, optionSets?.familyTypeOptions ?? []);
    const religionOptions = optionSets?.religions ?? [];
    const casteOptions = liveCastes.length ? liveCastes : (optionSets?.castes ?? []);
    const selectedReligionId = resolveIdByName(data?.religionId, data?.religion, religionOptions);
    const selectedCasteId = resolveIdByName(data?.casteId, data?.caste, casteOptions);

    useEffect(() => {
        let isMounted = true;
        const fetchLiveCastes = async () => {
            try {
                setLoadingCastes(true);
                const res = await api.get('/member/casts');
                const payload = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
                if (isMounted) {
                    setLiveCastes(payload);
                }
            } catch (error) {
                if (isMounted) {
                    setLiveCastes([]);
                }
            } finally {
                if (isMounted) {
                    setLoadingCastes(false);
                }
            }
        };
        const fetchLiveSects = async () => {
            try {
                const res = await api.get('/member/sects');
                const payload = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
                if (isMounted) {
                    setLiveSects(payload);
                }
            } catch (error) {
                if (isMounted) {
                    setLiveSects([]);
                }
            }
        };
        fetchLiveCastes();
        fetchLiveSects();
        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title={t('profile.edit.familyStructure')}>
                <div className="space-y-4">
                    <InputGroup label={t('profile.edit.familyType')}>
                        <select
                            className="form-input"
                            value={resolveOptionValue(data.familyType, familyTypeOptions)}
                            onChange={(e) => updateData('familyType', e.target.value)}
                        >
                            <option value="">{t('profile.edit.selectFamilyType')}</option>
                            {familyTypeOptions.map((option: any) => (
                                <option key={option.value} value={option.value}>{option.label ?? option.value}</option>
                            ))}
                        </select>
                    </InputGroup>
                    <div className="grid grid-cols-2 gap-4">
                        <InputGroup label={t('profile.edit.brothers')}>
                            <select
                                className="form-input"
                                value={data.brothers ?? 0}
                                onChange={(e) => updateData('brothers', e.target.value)}
                            >
                                <option value="0">0</option>
                                <option value="1">1</option>
                                <option value="2">2</option>
                                <option value="3">3+</option>
                            </select>
                        </InputGroup>
                        <InputGroup label={t('profile.edit.sisters')}>
                            <select
                                className="form-input"
                                value={data.sisters ?? 0}
                                onChange={(e) => updateData('sisters', e.target.value)}
                            >
                                <option value="0">0</option>
                                <option value="1">1</option>
                                <option value="2">2</option>
                                <option value="3">3+</option>
                            </select>
                        </InputGroup>
                    </div>
                </div>
            </Card>

            <Card title={t('profile.edit.parentalDetails')}>
                <div className="space-y-4">
                    <InputGroup label={t('profile.edit.fatherOccupation')}>
                        <input
                            type="text"
                            className="form-input"
                            placeholder={t('profile.edit.fatherOccupationPlaceholder')}
                            defaultValue={data.fatherOccupation}
                            onBlur={(e) => updateData('fatherOccupation', e.target.value)}
                        />
                    </InputGroup>
                    <InputGroup label={t('profile.edit.motherOccupation')}>
                        <input
                            type="text"
                            className="form-input"
                            placeholder={t('profile.edit.motherOccupationPlaceholder')}
                            defaultValue={data.motherOccupation}
                            onBlur={(e) => updateData('motherOccupation', e.target.value)}
                        />
                    </InputGroup>
                    <InputGroup label={t('profile.edit.familyLocation')}>
                        <input
                            type="text"
                            className="form-input"
                            placeholder={t('profile.edit.familyLocationPlaceholder')}
                            defaultValue={data.familyLocation}
                            onBlur={(e) => updateData('familyLocation', e.target.value)}
                        />
                    </InputGroup>
                </div>
            </Card>

            <div className="md:col-span-2">
                <Card title={t('profile.edit.communityCulture')}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <InputGroup label={t('profile.edit.religion')}>
                            <select
                                className="form-input"
                                value={selectedReligionId}
                                onChange={(e) => {
                                    const nextValue = e.target.value ? Number(e.target.value) : null;
                                    updateData('religionId', nextValue);
                                    const selected = religionOptions.find((item: any) => String(item.id) === e.target.value);
                                    updateData('religion', selected?.name ?? '');
                                    updateData('casteId', null);
                                    updateData('caste', '');
                                }}
                            >
                                <option value="">{t('profile.edit.selectReligion')}</option>
                                {religionOptions.map((option: any) => (
                                    <option key={option.id} value={option.id}>{option.name}</option>
                                ))}
                            </select>
                        </InputGroup>
                        <InputGroup label={t('profile.edit.sect')} optional>
                            <select
                                className="form-input"
                                value={data.sectId || ''}
                                onChange={(e) => {
                                    const nextValue = e.target.value ? Number(e.target.value) : null;
                                    updateData('sectId', nextValue);
                                    const selected = liveSects.find((item: any) => String(item.id) === e.target.value);
                                    updateData('sect', selected?.name ?? '');
                                }}
                                disabled={!liveSects.length}
                            >
                                <option value="">{t('profile.edit.selectSect', 'Select sect')}</option>
                                {liveSects.map((option: any) => (
                                    <option key={option.id} value={option.id}>{option.name}</option>
                                ))}
                            </select>
                        </InputGroup>
                        <InputGroup label={t('profile.edit.casteClan')} optional>
                            <select
                                className="form-input"
                                value={selectedCasteId}
                                onChange={(e) => {
                                    const nextValue = e.target.value ? Number(e.target.value) : null;
                                    updateData('casteId', nextValue);
                                    const selected = casteOptions.find((item: any) => String(item.id) === e.target.value);
                                    updateData('caste', selected?.name ?? '');
                                }}
                                disabled={!casteOptions.length || loadingCastes}
                            >
                                <option value="">{t('profile.edit.selectCaste')}</option>
                                {casteOptions.map((option: any) => (
                                    <option key={option.id} value={option.id}>{option.name}</option>
                                ))}
                            </select>
                        </InputGroup>
                    </div>
                </Card>
            </div>
        </div>
    );
};

const PreferencesSection: React.FC<{ data: any, optionSets?: any, updateData: (field: string, val: any) => void }> = ({ data, optionSets, updateData }) => {
    const { t } = useTranslation();
    const maritalStatusOptions = optionSets?.maritalStatuses ?? [];
    const religionOptions = optionSets?.religions ?? [];
    const languageOptions = optionSets?.languages ?? [];
    const countryOptions = optionSets?.countries ?? [];
    const familyValueOptions = optionSets?.familyValues ?? [];

    const ageRef = useRef<HTMLDivElement>(null);
    const heightRef = useRef<HTMLDivElement>(null);
    const maritalRef = useRef<HTMLDivElement>(null);
    const religionRef = useRef<HTMLDivElement>(null);
    const languageRef = useRef<HTMLDivElement>(null);
    const residenceRef = useRef<HTMLDivElement>(null);

    const scrollTo = (ref: React.RefObject<HTMLDivElement>) => {
        ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        ref.current?.classList.add('ring-4', 'ring-primary', 'ring-offset-2', 'bg-primary/5');
        setTimeout(() => ref.current?.classList.remove('ring-4', 'ring-primary', 'ring-offset-2', 'bg-primary/5'), 2000);
    };

    const selectedMaritalStatusId = resolveIdByName(data?.maritalStatusId, data?.marital_status, maritalStatusOptions);
    const selectedReligionId = resolveIdByName(data?.religionId, data?.religion, religionOptions);
    const selectedLanguageId = resolveIdByName(data?.languageId, data?.language, languageOptions);
    const selectedResidenceId = resolveIdByName(data?.residenceCountryId, data?.residence, countryOptions);
    const minHeightValue = Number.isFinite(Number(data?.min_height)) ? Number(data.min_height) : 150;

    const summaryMaritalStatus = data?.marital_status || maritalStatusOptions.find((item: any) => String(item.id) === selectedMaritalStatusId)?.name || t('profile.edit.any');
    const summaryReligion = data?.religion || religionOptions.find((item: any) => String(item.id) === selectedReligionId)?.name || t('profile.edit.any');
    const summaryLanguage = data?.language || languageOptions.find((item: any) => String(item.id) === selectedLanguageId)?.name || t('profile.edit.any');
    const summaryResidence = data?.residence || countryOptions.find((item: any) => String(item.id) === selectedResidenceId)?.name || t('profile.edit.any');
    const heightSummary = data?.min_height ? `${formatHeightLabel(data.min_height)} ${t('profile.edit.andAbove')}` : t('profile.edit.any');

    return (
        <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3">
                <AlertCircle className="text-blue-500 shrink-0 mt-0.5" />
                <div>
                    <h4 className="font-bold text-blue-900 text-sm">{t('profile.edit.smartMatching')}</h4>
                    <p className="text-xs text-blue-700 mt-1">
                        {t('profile.edit.smartMatchingDesc')}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Card title={t('profile.edit.demographicPreferences')}>
                    <div className="space-y-6">
                        <InputGroup label={t('profile.edit.ageRange')} innerRef={ageRef}>
                            <div className="flex items-center gap-4">
                                <input
                                    type="number"
                                    className="form-input w-24"
                                    placeholder="Min"
                                    defaultValue={data.min_age}
                                    onBlur={(e) => updateData('min_age', e.target.value)}
                                />
                                <span className="text-slate-400">to</span>
                                <input
                                    type="number"
                                    className="form-input w-24"
                                    placeholder="Max"
                                    defaultValue={data.max_age}
                                    onBlur={(e) => updateData('max_age', e.target.value)}
                                />
                            </div>
                            <ImportanceSelector
                                value={data.age_importance || 'Dealbreaker'}
                                onChange={(val) => updateData('age_importance', val)}
                            />
                        </InputGroup>

                        <InputGroup label={t('profile.edit.minimumHeight')} innerRef={heightRef}>
                            <div className="flex items-center gap-3">
                                <Ruler size={18} className="text-slate-400" />
                                <input
                                    type="range"
                                    className="flex-1 accent-primary"
                                    min="140"
                                    max="220"
                                    value={minHeightValue}
                                    onChange={(e) => updateData('min_height', Number(e.target.value))}
                                />
                                <span className="text-sm font-bold text-slate-700 w-16">{formatHeightLabel(minHeightValue)}</span>
                            </div>
                            <ImportanceSelector
                                value={data.height_importance || 'Nice to have'}
                                onChange={(val) => updateData('height_importance', val)}
                            />
                        </InputGroup>

                        <InputGroup label={t('profile.edit.maritalStatus')} innerRef={maritalRef}>
                            <select
                                className="form-input"
                                value={selectedMaritalStatusId}
                                onChange={(e) => {
                                    const nextValue = e.target.value ? Number(e.target.value) : null;
                                    updateData('maritalStatusId', nextValue);
                                    const selected = maritalStatusOptions.find((item: any) => String(item.id) === e.target.value);
                                    updateData('marital_status', selected?.name ?? '');
                                }}
                            >
                                <option value="">{t('profile.edit.any')}</option>
                                {maritalStatusOptions.map((option: any) => (
                                    <option key={option.id} value={option.id}>{option.name}</option>
                                ))}
                            </select>
                            <ImportanceSelector
                                value={data.marital_status_importance || 'Dealbreaker'}
                                onChange={(val) => updateData('marital_status_importance', val)}
                            />
                        </InputGroup>
                    </div>
                </Card>

                <Card title={t('profile.edit.culturalLifestyle')}>
                    <div className="space-y-6">
                        <InputGroup label={t('profile.edit.religion')} innerRef={religionRef}>
                            <select
                                className="form-input"
                                value={selectedReligionId}
                                onChange={(e) => {
                                    const nextValue = e.target.value ? Number(e.target.value) : null;
                                    updateData('religionId', nextValue);
                                    const selected = religionOptions.find((item: any) => String(item.id) === e.target.value);
                                    updateData('religion', selected?.name ?? '');
                                }}
                            >
                                <option value="">{t('profile.edit.any')}</option>
                                {religionOptions.map((option: any) => (
                                    <option key={option.id} value={option.id}>{option.name}</option>
                                ))}
                            </select>
                            <ImportanceSelector
                                value={data.religion_importance || 'Must have'}
                                onChange={(val) => updateData('religion_importance', val)}
                            />
                        </InputGroup>

                        <InputGroup label={t('profile.edit.preferredLanguage')} innerRef={languageRef}>
                            <select
                                className="form-input"
                                value={selectedLanguageId}
                                onChange={(e) => {
                                    const nextValue = e.target.value ? Number(e.target.value) : null;
                                    updateData('languageId', nextValue);
                                    const selected = languageOptions.find((item: any) => String(item.id) === e.target.value);
                                    updateData('language', selected?.name ?? '');
                                }}
                            >
                                <option value="">{t('profile.edit.any')}</option>
                                {languageOptions.map((option: any) => (
                                    <option key={option.id} value={option.id}>{option.name}</option>
                                ))}
                            </select>
                            <ImportanceSelector
                                value={data.language_importance || 'Nice to have'}
                                onChange={(val) => updateData('language_importance', val)}
                            />
                        </InputGroup>

                        <InputGroup label={t('profile.edit.preferredResidence')} innerRef={residenceRef}>
                            <select
                                className="form-input"
                                value={selectedResidenceId}
                                onChange={(e) => {
                                    const nextValue = e.target.value ? Number(e.target.value) : null;
                                    updateData('residenceCountryId', nextValue);
                                    const selected = countryOptions.find((item: any) => String(item.id) === e.target.value);
                                    updateData('residence', selected?.name ?? '');
                                }}
                            >
                                <option value="">{t('profile.edit.any')}</option>
                                {countryOptions.map((option: any) => (
                                    <option key={option.id ?? option.code} value={option.id}>{option.name}</option>
                                ))}
                            </select>
                            <ImportanceSelector
                                value={data.residence_importance || 'Nice to have'}
                                onChange={(val) => updateData('residence_importance', val)}
                            />
                        </InputGroup>

                        <InputGroup label={t('profile.edit.familyValues')}>
                            <select
                                className="form-input"
                                value={data.familyValueId ?? ''}
                                onChange={(e) => updateData('familyValueId', e.target.value ? Number(e.target.value) : null)}
                            >
                                <option value="">{t('profile.edit.any')}</option>
                                {familyValueOptions.map((option: any) => (
                                    <option key={option.id} value={option.id}>{option.name}</option>
                                ))}
                            </select>
                        </InputGroup>
                    </div>
                </Card>
            </div>

            <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm mb-2">{t('profile.edit.summaryMatchRules')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <PreferenceItem
                        label={t('profile.edit.ageRange')}
                        value={`${data.min_age || 20} - ${data.max_age || 40} ${t('profile.edit.years')}`}
                        type={data.age_importance || 'Dealbreaker'}
                        onEdit={() => scrollTo(ageRef)}
                    />
                    <PreferenceItem
                        label={t('profile.edit.height')}
                        value={heightSummary}
                        type={data.height_importance || 'Nice to have'}
                        onEdit={() => scrollTo(heightRef)}
                    />
                    <PreferenceItem
                        label={t('profile.edit.maritalStatus')}
                        value={summaryMaritalStatus}
                        type={data.marital_status_importance || 'Dealbreaker'}
                        onEdit={() => scrollTo(maritalRef)}
                    />
                    <PreferenceItem
                        label={t('profile.edit.religion')}
                        value={summaryReligion}
                        type={data.religion_importance || 'Must have'}
                        onEdit={() => scrollTo(religionRef)}
                    />
                    <PreferenceItem
                        label={t('profile.edit.preferredLanguage')}
                        value={summaryLanguage}
                        type={data.language_importance || 'Nice to have'}
                        onEdit={() => scrollTo(languageRef)}
                    />
                    <PreferenceItem
                        label={t('profile.edit.preferredResidence')}
                        value={summaryResidence}
                        type={data.residence_importance || 'Nice to have'}
                        onEdit={() => scrollTo(residenceRef)}
                    />
                </div>

                <div className="pt-4">
                    <button 
                        onClick={() => scrollTo(ageRef)}
                        className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 font-bold text-sm hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2 group"
                    >
                        <Plus size={18} className="group-hover:scale-110 transition-transform" /> {t('profile.edit.addPreference')}
                    </button>
                </div>
            </div>

            <Card>
                <h4 className="font-bold text-slate-900 text-sm mb-3">{t('profile.edit.idealPartner')}</h4>
                <textarea
                    value={data.general || ''}
                    onChange={(e) => updateData('general', e.target.value)}
                    placeholder={t('profile.edit.idealPartnerPlaceholder')}
                    className="form-input min-h-[120px] resize-y w-full"
                    maxLength={1000}
                />
                <div className="text-right text-xs text-slate-400 mt-1">
                    {(data.general || '').length} / 1,000
                </div>
            </Card>
        </div>
    );
};

/* ── Mini Audio Player (replaces raw <audio controls>) ── */
const MiniAudioPlayer: React.FC<{ src: string }> = ({ src }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [playing, setPlaying] = useState(false);
    const [cur, setCur] = useState(0);
    const [dur, setDur] = useState(0);
    const [loading, setLoading] = useState(true);

    const fmt = (sec: number) => {
        if (!sec || !isFinite(sec) || isNaN(sec)) return '0:00';
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handleMeta = () => {
        if (!audioRef.current) return;
        const d = audioRef.current.duration;
        if (isFinite(d) && !isNaN(d) && d > 0) {
            setDur(d);
            setLoading(false);
        } else {
            // Workaround: seek to large value to force browser to resolve real duration
            audioRef.current.currentTime = 1e10;
            audioRef.current.addEventListener('timeupdate', function handler() {
                if (audioRef.current) {
                    const realD = audioRef.current.duration;
                    if (isFinite(realD) && !isNaN(realD) && realD > 0) setDur(realD);
                    audioRef.current.currentTime = 0;
                    audioRef.current.removeEventListener('timeupdate', handler);
                }
                setLoading(false);
            }, { once: true });
        }
    };

    const toggle = () => {
        if (!audioRef.current) return;
        if (playing) { audioRef.current.pause(); } else { audioRef.current.play().catch(() => {}); }
    };

    const pct = dur > 0 ? (cur / dur) * 100 : 0;

    return (
        <div className="flex items-center gap-3 bg-white rounded-xl px-3 py-2 border border-purple-100 shadow-sm">
            <audio
                ref={audioRef}
                src={src}
                preload="metadata"
                onLoadedMetadata={handleMeta}
                onTimeUpdate={() => { if (audioRef.current) setCur(audioRef.current.currentTime); }}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onEnded={() => { setPlaying(false); setCur(0); }}
                onError={() => setLoading(false)}
            />
            <button
                onClick={toggle}
                disabled={loading}
                className={`size-8 shrink-0 rounded-full flex items-center justify-center transition-colors ${loading ? 'bg-purple-200 cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
            >
                {loading ? (
                    <Loader2 size={14} className="animate-spin text-white" />
                ) : playing ? (
                    <Square size={12} fill="white" />
                ) : (
                    <Play size={14} fill="white" className="ml-0.5" />
                )}
            </button>
            <div
                className="flex-1 h-1.5 bg-purple-100 rounded-full overflow-hidden cursor-pointer"
                onClick={(e) => {
                    if (!audioRef.current || !dur) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    audioRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * dur;
                }}
            >
                <div className="h-full bg-purple-500 rounded-full transition-all duration-100" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[11px] text-purple-500 font-medium tabular-nums whitespace-nowrap">
                {fmt(cur)} / {fmt(dur)}
            </span>
        </div>
    );
};

const VoiceIntroRecorder: React.FC<{
    existingUrl?: string,
    onUpload: (file: File) => Promise<void>,
    onDelete: () => Promise<void>
}> = ({ existingUrl, onUpload, onDelete }) => {
    const { t } = useTranslation();
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(existingUrl || null);
    const [isUploading, setIsUploading] = useState(false);
    const [recordingMimeType, setRecordingMimeType] = useState('audio/webm');
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Update audioUrl when existingUrl changes
    useEffect(() => {
        if (existingUrl) setAudioUrl(existingUrl);
    }, [existingUrl]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
            
            // Pick best supported MIME type
            const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4', 'audio/wav'];
            let selectedMime = '';
            for (const mime of mimeTypes) {
                if (MediaRecorder.isTypeSupported(mime)) { selectedMime = mime; break; }
            }
            
            const options: MediaRecorderOptions = selectedMime ? { mimeType: selectedMime } : {};
            const recorder = new MediaRecorder(stream, options);
            const actualMime = recorder.mimeType || selectedMime || 'audio/webm';
            setRecordingMimeType(actualMime);
            const chunks: Blob[] = [];

            recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: actualMime });
                setAudioBlob(blob);
                const url = URL.createObjectURL(blob);
                setAudioUrl(url);
            };

            recorder.start(100); // collect data every 100ms for reliability
            setMediaRecorder(recorder);
            setIsRecording(true);
            setRecordingTime(0);
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => {
                    if (prev >= 30) {
                        stopRecording();
                        return 30;
                    }
                    return prev + 1;
                });
            }, 1000);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert(t('profile.edit.microphoneError'));
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop();
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const handleUpload = async () => {
        if (!audioBlob) return;
        setIsUploading(true);
        try {
            // Determine proper file extension from MIME type
            const extMap: Record<string, string> = { 'audio/webm': 'webm', 'audio/ogg': 'ogg', 'audio/mp4': 'm4a', 'audio/wav': 'wav', 'audio/mpeg': 'mp3' };
            const ext = extMap[recordingMimeType.split(';')[0]] || 'webm';
            const file = new File([audioBlob], `voice_intro.${ext}`, { type: recordingMimeType });
            await onUpload(file);
            setAudioBlob(null);
        } catch (err) {
            console.error("Upload failed", err);
        } finally {
            setIsUploading(false);
        }
    };

    const handleCancel = () => {
        setAudioBlob(null);
        setAudioUrl(existingUrl || null);
    };

    return (
        <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                    <div className={`size-10 rounded-full flex items-center justify-center ${isRecording ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-purple-100 text-purple-600'}`}>
                        {isRecording ? <Square size={20} /> : <Mic size={20} />}
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 text-sm">{t('profile.edit.voiceIntro')}</h4>
                        <p className="text-xs text-slate-500">
                            {isRecording ? t('profile.edit.recording', { n: recordingTime }) : audioBlob ? t('profile.edit.recordingComplete') : t('profile.edit.recordGreeting')}
                        </p>
                    </div>
                </div>
                {!isRecording && !audioBlob && !existingUrl && (
                    <button
                        onClick={startRecording}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-purple-600 shadow-sm hover:bg-slate-50"
                    >
                        {t('profile.edit.record')}
                    </button>
                )}
                {isRecording && (
                    <button
                        onClick={stopRecording}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg text-xs font-bold shadow-sm hover:bg-red-600"
                    >
                        {t('profile.edit.stop')}
                    </button>
                )}
            </div>

            {(audioUrl || audioBlob) && !isRecording && (
                <div className="mt-4 flex flex-col gap-3">
                    <MiniAudioPlayer src={audioUrl || ''} />
                    <div className="flex gap-2 justify-end">
                        {audioBlob ? (
                            <>
                                <button
                                    onClick={handleCancel}
                                    className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold hover:bg-slate-200"
                                >
                                    {t('profile.edit.cancel')}
                                </button>
                                <button
                                    onClick={handleUpload}
                                    disabled={isUploading}
                                    className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-[10px] font-bold hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1"
                                >
                                    {isUploading ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                    {t('profile.edit.upload')}
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={onDelete}
                                className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-[10px] font-bold hover:bg-red-100 flex items-center gap-1"
                            >
                                <Trash2 size={12} /> {t('profile.edit.deleteVoice')}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const MediaSection: React.FC<{ data: any, visibility: any, avatarUrl: string, onRefresh: () => void }> = ({ data, visibility, avatarUrl, onRefresh }) => {
    const { t } = useTranslation();
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploading(true);
            const compressedFile = await compressImage(file);

            const formData = new FormData();
            formData.append('gallery_image', compressedFile);
            formData.append('privacy_level', 'public');
            const response = await api.post('/member/gallery-image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            if (response.data?.result === false) {
                alert(response.data?.message || t('profile.edit.uploadFailed'));
            } else {
                onRefresh();
            }
        } catch (error: any) {
            console.error('Failed to upload image', error);
            const message = error?.response?.data?.message || error?.message || t('profile.edit.failedUploadImage');
            alert(message);
        } finally {
            setUploading(false);
            if (e.target) e.target.value = '';
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm(t('profile.edit.confirmDeleteImage'))) return;
        try {
            await api.delete(`/member/gallery-image/${id}`);
            onRefresh();
        } catch (error) {
            console.error('Failed to delete image', error);
        }
    };

    const handleTogglePrivacy = async (imgId: number, currentPrivacy: string) => {
        const newPrivacy = currentPrivacy === 'vault' || currentPrivacy === 'private' ? 'public' : 'vault';
        try {
            await api.post('/member/profile/section/media', {
                gallery: [
                    { id: imgId, privacy_level: newPrivacy }
                ]
            });
            onRefresh();
        } catch (error) {
            console.error('Failed to update privacy', error);
        }
    };

    const handleSetMainAndAvatar = async (imgId: number) => {
        try {
            await api.post(`/member/gallery-image/${imgId}/set-as-avatar`);
            onRefresh();
        } catch (error) {
            console.error('Failed to set as profile picture', error);
        }
    };

    const handleToggleVisibility = async (fieldName: string, currentValue: boolean) => {
        try {
            await api.post('/member/profile/visibility', {
                field_name: fieldName,
                is_visible: !currentValue
            });
            onRefresh();
        } catch (error) {
            console.error('Failed to update visibility', error);
        }
    };

    const allPhotos = data.gallery || [];
    const isWatermarkActive = visibility?.screenshot_deterrence !== false;

    return (
        <div className="space-y-8">
            {/* ─── Unified Photo Gallery ─── */}
            <div>
                <div className="flex justify-between items-end mb-4">
                    <div>
                        <h3 className="font-bold text-slate-900 text-base">My Photos</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Upload photos and control visibility. Private photos appear blurred to others.</p>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium bg-slate-50 px-2 py-1 rounded-full">{allPhotos.length} photo{allPhotos.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {allPhotos.map((img: any) => {
                        const isPrivate = img.privacy_level === 'vault' || img.privacy_level === 'private';
                        const isMain = img.is_main;

                        return (
                            <div key={img.id} className="aspect-[3/4] rounded-xl overflow-hidden relative group bg-slate-100">
                                {/* Photo with optional watermark */}
                                <div className="relative w-full h-full">
                                    <img
                                        src={img.url}
                                        className={`w-full h-full object-cover transition-all duration-300 ${isPrivate ? 'brightness-75' : ''}`}
                                        alt="Gallery"
                                    />

                                    {/* Screenshot deterrence watermark overlay */}
                                    {isWatermarkActive && (
                                        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none" style={{ zIndex: 2 }}>
                                            <div
                                                className="absolute inset-[-50%] flex items-center justify-center"
                                                style={{
                                                    transform: 'rotate(-30deg)',
                                                    width: '200%',
                                                    height: '200%',
                                                }}
                                            >
                                                <div className="w-full h-full flex flex-wrap items-start justify-start gap-8 p-4" style={{ opacity: 0.08 }}>
                                                    {Array.from({ length: 20 }).map((_, i) => (
                                                        <span key={i} className="text-white text-[11px] font-bold whitespace-nowrap tracking-wider">
                                                            DMB PROTECTED
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Private overlay */}
                                    {isPrivate && (
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" style={{ zIndex: 3 }}>
                                            <div className="absolute bottom-0 left-0 right-0 p-2 flex items-center justify-center gap-1">
                                                <Lock size={11} className="text-white/80" />
                                                <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Private</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Main photo badge */}
                                {isMain && (
                                    <div className="absolute top-2 left-2 z-10 bg-green-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                                        <Star size={9} fill="currentColor" />
                                        Profile Pic
                                    </div>
                                )}

                                {/* Privacy indicator pill (always visible, top-right) */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleTogglePrivacy(img.id, img.privacy_level); }}
                                    className={`absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold shadow-md transition-all cursor-pointer ${
                                        isPrivate
                                            ? 'bg-slate-800/80 text-white hover:bg-slate-700'
                                            : 'bg-white/90 text-slate-600 hover:bg-white'
                                    }`}
                                    title={isPrivate ? 'Click to make public' : 'Click to make private'}
                                >
                                    {isPrivate ? <Lock size={9} /> : <Globe size={9} />}
                                    {isPrivate ? 'Private' : 'Public'}
                                </button>

                                {/* Hover overlay with actions */}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2" style={{ zIndex: 5 }}>
                                    {!isMain && (
                                        <button
                                            onClick={() => handleSetMainAndAvatar(img.id)}
                                            className="bg-white text-slate-900 px-3 py-1.5 rounded-full text-[10px] font-bold hover:bg-green-500 hover:text-white transition-colors flex items-center gap-1 shadow-lg"
                                        >
                                            <Star size={10} />
                                            Set as Profile Pic
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(img.id)}
                                        className="bg-red-500/90 text-white px-3 py-1.5 rounded-full text-[10px] font-bold hover:bg-red-600 transition-colors flex items-center gap-1 shadow-lg"
                                    >
                                        <Trash2 size={10} />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        );
                    })}

                    {/* Add Photo Placeholder */}
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-[3/4] rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-primary hover:text-primary hover:bg-primary/5 cursor-pointer transition-all duration-200"
                    >
                        {uploading ? (
                            <Loader2 size={24} className="animate-spin" />
                        ) : (
                            <>
                                <div className="p-3 bg-slate-100 rounded-full mb-2">
                                    <ImageIcon size={20} />
                                </div>
                                <span className="text-xs font-bold">{t('profile.edit.addPhoto')}</span>
                                <span className="text-[10px] text-slate-300 mt-0.5">Uploads as Public</span>
                            </>
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e)}
                        />
                    </div>
                </div>

                {/* Privacy legend */}
                <div className="flex items-center gap-4 mt-3 px-1">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <Globe size={10} />
                        <span>Public = visible to matches</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <Lock size={10} />
                        <span>Private = shown blurred to others</span>
                    </div>
                </div>
            </div>

            {/* ─── Screenshot Deterrence ─── */}
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <Umbrella size={20} className="text-slate-400" />
                <div className="flex-1">
                    <h4 className="text-sm font-bold text-slate-900">{t('profile.edit.screenshotDeterrence')}</h4>
                    <p className="text-xs text-slate-500">{isWatermarkActive ? 'Watermark overlay is active on all your photos.' : 'Enable to add watermark protection to your photos.'}</p>
                </div>
                <div
                    onClick={() => handleToggleVisibility('screenshot_deterrence', isWatermarkActive)}
                    className={`w-10 h-5 ${isWatermarkActive ? 'bg-primary' : 'bg-slate-300'} rounded-full relative cursor-pointer transition-colors`}
                >
                    <div className={`absolute ${isWatermarkActive ? 'right-0.5' : 'left-0.5'} top-0.5 size-4 bg-white rounded-full transition-all shadow-sm`}></div>
                </div>
            </div>

            <VoiceIntroRecorder
                existingUrl={data.voice_intro_url}
                onUpload={async (file) => {
                    const formData = new FormData();
                    formData.append('voice_file', file);
                    await api.post('/member/profile/media/voice', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    onRefresh();
                }}
                onDelete={async () => {
                    if (!confirm(t('profile.edit.confirmDeleteVoice'))) return;
                    await api.delete('/member/profile/media/voice');
                    onRefresh();
                }}
            />
        </div>
    );
};

/* --- Helper Components --- */

const Card: React.FC<{ title: string, children: React.ReactNode, action?: React.ReactNode }> = ({ title, children, action }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-100">
            <h3 className="font-bold text-slate-900">{title}</h3>
            {action && action}
        </div>
        {children}
    </div>
);

const InputGroup: React.FC<{ label: string, optional?: boolean, children: React.ReactNode, innerRef?: React.RefObject<HTMLDivElement> }> = ({ label, optional, children, innerRef }) => (
    <div ref={innerRef} className="transition-all duration-500 rounded-lg">
        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
            {label}
            {optional && <span className="ml-1.5 text-[10px] font-semibold text-pink-600 bg-pink-100 px-2 py-0.5 rounded-full normal-case tracking-normal">Optional</span>}
        </label>
        {children}
    </div>
);

const Badge: React.FC<{ label: string, color?: string, onRemove: () => void }> = ({ label, color = 'slate', onRemove }) => {
    const colors: Record<string, string> = {
        slate: 'bg-slate-100 text-slate-700',
        pink: 'bg-pink-50 text-pink-700',
        purple: 'bg-purple-50 text-purple-700',
        blue: 'bg-blue-50 text-blue-700',
        orange: 'bg-orange-50 text-orange-700',
    };
    return (
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${colors[color]}`}>
            {label}
            <button onClick={onRemove} className="inline-flex items-center justify-center size-4 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none hover:bg-red-600 transition-colors">x</button>
        </span>
    );
};

const VisibilityToggle: React.FC<{
    fieldName: string;
    isVisible: boolean;
    onToggle: (fieldName: string, currentValue: boolean) => void;
}> = ({ fieldName, isVisible, onToggle }) => {
    const { t } = useTranslation();
    const [toggling, setToggling] = useState(false);
    const handleClick = async () => {
        setToggling(true);
        try {
            await onToggle(fieldName, isVisible);
        } finally {
            setToggling(false);
        }
    };
    return (
        <div className="flex items-center gap-2 mt-1">
            <button
                type="button"
                onClick={handleClick}
                disabled={toggling}
                className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer border transition-colors ${
                    isVisible
                        ? 'text-green-600 bg-green-50 border-green-100 hover:bg-green-100'
                        : 'text-slate-500 bg-slate-50 border-slate-200 hover:bg-slate-100'
                } disabled:opacity-50`}
            >
                {toggling ? <Loader2 size={10} className="animate-spin" /> : isVisible ? <Eye size={10} /> : <EyeOff size={10} />}
                {isVisible ? t('profile.edit.visible') : t('profile.edit.hidden')}
            </button>
        </div>
    );
};

const PreferenceItem: React.FC<{
    label: string,
    value: string,
    type: string,
    onEdit?: () => void
}> = ({ label, value, type, onEdit }) => {
    const typeColors: Record<string, string> = {
        'Must have': 'bg-blue-100 text-blue-700',
        'Nice to have': 'bg-green-100 text-green-700',
        'Dealbreaker': 'bg-red-100 text-red-700',
    };

    return (
        <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors group">
            <div>
                <p className="text-xs text-slate-400 font-bold uppercase">{label}</p>
                <p className="font-bold text-slate-900">{value}</p>
            </div>
            <div className="flex items-center gap-3">
                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${typeColors[type] || 'bg-slate-100 text-slate-600'}`}>
                    {type}
                </span>
                <button
                    onClick={onEdit}
                    className="text-slate-300 hover:text-primary transition-colors p-1"
                    title="Edit Rule"
                >
                    <UserCogIcon />
                </button>
            </div>
        </div>
    );
}

const ImportanceSelector: React.FC<{ value: string, onChange: (val: string) => void }> = ({ value, onChange }) => {
    const levels = ['Dealbreaker', 'Must have', 'Nice to have'];
    const colors: Record<string, string> = {
        'Dealbreaker': 'bg-red-500',
        'Must have': 'bg-blue-500',
        'Nice to have': 'bg-green-500',
    };

    return (
        <div className="flex gap-2 mt-2">
            {levels.map(level => (
                <button
                    key={level}
                    type="button"
                    onClick={() => onChange(level)}
                    className={`text-[10px] font-bold uppercase px-2 py-1 rounded transition-all ${value === level
                        ? `${colors[level]} text-white shadow-sm ring-1 ring-offset-1 ring-${colors[level]?.split('-')[1]}-200`
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                >
                    {level}
                </button>
            ))}
        </div>
    );
};

const NudgeItem: React.FC<{ label: string, points: string, onClick?: () => void }> = ({ label, points, onClick }) => (
    <div
        onClick={onClick}
        className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer group"
    >
        <div className="flex items-center gap-2">
            <div className="size-1.5 rounded-full bg-orange-400"></div>
            <span className="text-sm text-slate-600 group-hover:text-primary transition-colors">{label}</span>
        </div>
        <span className="text-xs font-bold text-green-600">{points}</span>
    </div>
);

// Icon Wrappers for simple usage in maps
const InfoIcon = ({ className }: { className?: string }) => <svg className={`w-5 h-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const UserCogIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>;

/* Styles for Inputs */
const styles = `
    .form-input {
        @apply w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 bg-white;
    }
`;

export default ProfileEditView;
