import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
    User,
    ArrowRight,
    ArrowLeft,
    Check,
    Loader2,
    AlertCircle,
    MapPin,
    Briefcase,
    Ruler,
    Heart,
    Camera,
    Upload,
    Sparkles,
} from 'lucide-react';
import { api } from '../utils/api';
import LoadingTimeoutFallback from './LoadingTimeoutFallback';
import { compressImage } from '../utils/compression';

interface OnboardingModalProps {
    onClose: () => void;
}

const STEPS_ICONS = [User, MapPin, Briefcase, Ruler, Heart, Camera];

const FieldGroup: React.FC<{ label: string; children: React.ReactNode }> = ({
    label,
    children,
}) => (
    <div>
        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
            {label}
        </label>
        {children}
    </div>
);

const inputClass =
    'w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none transition-colors bg-white placeholder:text-slate-300';

const OnboardingModal: React.FC<OnboardingModalProps> = ({ onClose }) => {
    const { t } = useTranslation();
    const MAX_PROFILE_PHOTO_BYTES = 10 * 1024 * 1024; // 10MB
    const STEPS = [
        { label: t('auth.onboarding.stepPersonal'), icon: STEPS_ICONS[0] },
        { label: t('auth.onboarding.stepLocation'), icon: STEPS_ICONS[1] },
        { label: t('auth.onboarding.stepCareer'), icon: STEPS_ICONS[2] },
        { label: t('auth.onboarding.stepAppearance'), icon: STEPS_ICONS[3] },
        { label: t('auth.onboarding.stepAboutMe'), icon: STEPS_ICONS[4] },
        { label: t('auth.onboarding.stepPhoto'), icon: STEPS_ICONS[5] },
    ];
    const [step, setStep] = useState(1);
    const [initialStepSet, setInitialStepSet] = useState(false);
    const totalSteps = STEPS.length;
    const onboardingTitleText = 'Complete Profile';
    const finishSetupText = t('modals.twoFactor.completeSetup') || 'Complete Setup';

    // All form data
    const [data, setData] = useState<any>({
        firstName: '',
        lastName: '',
        gender: '',
        dateOfBirth: '',
        maritalStatusId: '',
        currentResidencyCountryId: '',
        currentResidencyStateId: '',
        currentResidencyCityId: '',
        religionId: '',
        sectId: '',
        casteId: '',
        designation: '',
        company: '',
        education: '',
        institution: '',
        incomeRangeId: '',
        jobTitleId: '',
        specialityId: '',
        height: '',
        weight: '',
        complexion: '',
        introduction: '',
        avatarUrl: '',
        hasProfilePhoto: false,
    });
    const [optionSets, setOptionSets] = useState<any>({});
    const [salaryRanges, setSalaryRanges] = useState<any[]>([]);
    const [liveCastes, setLiveCastes] = useState<any[]>([]);
    const [liveSects, setLiveSects] = useState<any[]>([]);

    // Photo
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Real-time profile completion calculation (mirrors backend logic)
    const computeLocalCompletion = () => {
        const step1 = [
            data.firstName?.trim(),
            data.lastName?.trim(),
            data.gender,
            data.dateOfBirth,
            data.maritalStatusId,
        ];
        const step2 = [
            data.currentResidencyCountryId,
            data.currentResidencyStateId,
            data.currentResidencyCityId,
            data.religionId,
            data.casteId,
        ];
        const step3 = [
            data.designation?.trim(),
            data.company?.trim(),
            data.education?.trim(),
            data.institution?.trim(),
            data.incomeRangeId,
        ];
        const step4 = [data.height, data.weight, data.complexion?.trim()];
        const step5 = [(data.introduction || '').trim()];
        const step6 = [photoFile || data.hasProfilePhoto ? 'yes' : ''];

        const allSteps = [step1, step2, step3, step4, step5, step6];
        let totalFields = 0;
        let filledFields = 0;
        const stepComplete: boolean[] = [];

        allSteps.forEach((fields) => {
            const filled = fields.filter(
                (v) => v !== '' && v !== null && v !== undefined && v !== false && v !== 0,
            ).length;
            totalFields += fields.length;
            filledFields += filled;
            stepComplete.push(filled === fields.length);
        });

        const percentage = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;
        return { percentage, stepComplete, filledFields, totalFields };
    };

    const { percentage: livePercentage, stepComplete: liveStepComplete } = computeLocalCompletion();

    // States & cities for location
    const [states, setStates] = useState<any[]>([]);
    const [cities, setCities] = useState<any[]>([]);

    // Loading/Error
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

    const fetchMaritalStatusesFallback = async (): Promise<
        Array<{ id: string | number; name: string }>
    > => {
        try {
            const res = await api.get('/member/maritial-status');
            const payload = res?.data;
            const candidates = [payload?.data, payload?.marital_statuses, payload];
            for (const candidate of candidates) {
                const normalized = normalizeMaritalStatuses(candidate);
                if (normalized.length) {
                    return normalized;
                }
            }
        } catch (fallbackErr) {
            console.error('Failed to fetch marital statuses fallback', fallbackErr);
        }
        return [];
    };

    const fetchStates = async (countryId: string | number) => {
        try {
            const res = await api.get(`/member/states/${countryId}`);
            setStates(res.data?.data || res.data || []);
        } catch {
            setStates([]);
        }
    };

    const fetchCities = async (stateId: string | number) => {
        try {
            const res = await api.get(`/member/cities/${stateId}`);
            setCities(res.data?.data || res.data || []);
        } catch {
            setCities([]);
        }
    };

    const fetchCastes = async () => {
        try {
            const res = await api.get('/member/casts');
            const payload = Array.isArray(res.data?.data)
                ? res.data.data
                : Array.isArray(res.data)
                  ? res.data
                  : [];
            setLiveCastes(payload);
        } catch {
            setLiveCastes([]);
        }
    };

    const fetchSects = async () => {
        try {
            const res = await api.get('/member/sects');
            const payload = Array.isArray(res.data?.data)
                ? res.data.data
                : Array.isArray(res.data)
                  ? res.data
                  : [];
            setLiveSects(payload);
        } catch {
            setLiveSects([]);
        }
    };

    // Fetch existing profile data on mount
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                const response = await api.get('/full-profile');
                if (response.data?.result) {
                    const d = response.data;
                    setData({
                        firstName: d.basics?.firstName || '',
                        lastName: d.basics?.lastName || '',
                        gender: d.basics?.gender || '',
                        dateOfBirth: d.basics?.dateOfBirth || '',
                        maritalStatusId: d.basics?.maritalStatusId || '',
                        currentResidencyCountryId: d.basics?.currentResidencyCountryId || '',
                        currentResidencyStateId: d.basics?.currentResidencyStateId || '',
                        currentResidencyCityId: d.basics?.currentResidencyCityId || '',
                        religionId: d.family?.religionId || '',
                        sectId: d.family?.sectId || '',
                        casteId: d.family?.casteId || '',
                        designation: d.career?.designation || '',
                        company: d.career?.company || '',
                        jobTitleId: d.career?.jobTitleId || '',
                        specialityId: d.career?.specialityId || '',
                        education: d.career?.education || '',
                        institution: d.career?.institution || '',
                        incomeRangeId: d.career?.incomeRangeId || '',
                        height: d.basics?.height || '',
                        weight: d.basics?.weight || '',
                        complexion: d.basics?.complexion || '',
                        introduction: d.basics?.introduction || '',
                        avatarUrl: d.basics?.avatarUrl || '',
                        hasProfilePhoto: !!d.basics?.hasProfilePhoto,
                    });

                    // Auto-navigate to the first incomplete step
                    if (d.profileCompletion?.firstIncompleteStep && !initialStepSet) {
                        setStep(d.profileCompletion.firstIncompleteStep);
                        setInitialStepSet(true);
                    }
                    const incomingOptionSets = d.optionSets || {};
                    let maritalStatuses = normalizeMaritalStatuses(
                        incomingOptionSets?.maritalStatuses || incomingOptionSets?.marital_statuses,
                    );
                    if (!maritalStatuses.length) {
                        maritalStatuses = await fetchMaritalStatusesFallback();
                    }
                    setOptionSets({
                        ...incomingOptionSets,
                        maritalStatuses,
                    });
                    if (!maritalStatuses.length) {
                        setError('Unable to load marital status options. Please refresh once.');
                    }
                    setSalaryRanges(d.salaryRanges || []);

                    if (d.basics?.currentResidencyCountryId) {
                        fetchStates(d.basics.currentResidencyCountryId);
                    }
                    if (d.basics?.currentResidencyStateId) {
                        fetchCities(d.basics.currentResidencyStateId);
                    }
                } else {
                    const maritalStatuses = await fetchMaritalStatusesFallback();
                    setOptionSets((prev: any) => ({
                        ...(prev || {}),
                        maritalStatuses,
                    }));
                    if (!maritalStatuses.length) {
                        setError('Unable to load marital status options. Please refresh once.');
                    }
                }
            } catch (err) {
                console.error('Failed to load profile', err);
                const maritalStatuses = await fetchMaritalStatusesFallback();
                setOptionSets((prev: any) => ({
                    ...(prev || {}),
                    maritalStatuses,
                }));
                if (!maritalStatuses.length) {
                    setError('Unable to load marital status options. Please refresh once.');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
        fetchCastes();
        fetchSects();
    }, []);

    const updateField = (field: string, value: any) => {
        setData((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleCountryChange = (countryId: string) => {
        updateField('currentResidencyCountryId', countryId);
        updateField('currentResidencyStateId', '');
        updateField('currentResidencyCityId', '');
        setCities([]);
        if (countryId) fetchStates(countryId);
        else setStates([]);
    };

    const handleStateChange = (stateId: string) => {
        updateField('currentResidencyStateId', stateId);
        updateField('currentResidencyCityId', '');
        if (stateId) fetchCities(stateId);
        else setCities([]);
    };

    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const extension = file.name.split('.').pop()?.toLowerCase() || '';
            const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif'];
            const isAllowedType =
                file.type.startsWith('image/') ||
                file.type === '' ||
                file.type === 'application/octet-stream';

            if (!allowedExtensions.includes(extension) || !isAllowedType) {
                setError(
                    'Unsupported file type. Please upload JPG, PNG, GIF, WEBP, HEIC, or HEIF.',
                );
                setPhotoFile(null);
                setPhotoPreview(null);
                return;
            }

            if (file.size > MAX_PROFILE_PHOTO_BYTES) {
                setError('Photo is too large. Maximum allowed size is 10MB.');
                setPhotoFile(null);
                setPhotoPreview(null);
                return;
            }

            setError(null);
            setPhotoFile(file);
            const reader = new FileReader();
            reader.onload = () => setPhotoPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const saveStepData = async (): Promise<boolean> => {
        setSaving(true);
        setError(null);
        try {
            if (step >= 1 && step <= 5) {
                const payload: any = {};

                if (step === 1) {
                    payload.basics = {
                        firstName: data.firstName,
                        lastName: data.lastName,
                        gender: data.gender,
                        dateOfBirth: data.dateOfBirth,
                        maritalStatusId: data.maritalStatusId || null,
                    };
                } else if (step === 2) {
                    payload.basics = {
                        currentResidencyCountryId: data.currentResidencyCountryId || null,
                        currentResidencyStateId: data.currentResidencyStateId || null,
                        currentResidencyCityId: data.currentResidencyCityId || null,
                    };
                    payload.family = {
                        religionId: data.religionId || null,
                        sectId: data.sectId || null,
                        casteId: data.casteId || null,
                    };
                } else if (step === 3) {
                    payload.career = {
                        designation: data.designation,
                        company: data.company,
                        education: data.education,
                        institution: data.institution,
                        incomeRangeId: data.incomeRangeId || null,
                        jobTitleId: data.jobTitleId || null,
                        specialityId: data.specialityId || null,
                        careerPresent: true,
                        isHighestDegree: true,
                    };
                } else if (step === 4) {
                    payload.basics = {
                        height: data.height || null,
                        weight: data.weight || null,
                        complexion: data.complexion || null,
                    };
                } else if (step === 5) {
                    payload.basics = {
                        introduction: data.introduction,
                    };
                }

                await api.post('/full-profile/update', payload);
            }

            // Upload photo first (if on photo step and a file was selected).
            // Do not continue onboarding completion when photo upload fails.
            if (step === 6 && photoFile) {
                try {
                    const formData = new FormData();
                    const uploadFile = await compressImage(photoFile);
                    formData.append('photo', uploadFile);
                    const uploadResponse = await api.post('/upload-profile-picture', formData);
                    if (!uploadResponse?.data?.success && !uploadResponse?.data?.result) {
                        throw { response: uploadResponse };
                    }
                    const uploadedPhotoUrl =
                        uploadResponse?.data?.data?.photo_url || uploadResponse?.data?.photo_url;
                    const uploadedPhotoId =
                        uploadResponse?.data?.data?.photo_id || uploadResponse?.data?.photo_id;
                    setData((current: any) => ({
                        ...current,
                        avatarUrl: uploadedPhotoUrl || current.avatarUrl,
                        profilePhotoId: uploadedPhotoId || current.profilePhotoId,
                        hasProfilePhoto: true,
                    }));
                } catch (uploadErr: any) {
                    const status = uploadErr?.response?.status;
                    const serverMessage = uploadErr?.response?.data?.message;
                    const uploadErrorMessage =
                        status === 413
                            ? 'Photo is too large for upload. Please upload an image up to 10MB.'
                            : serverMessage ||
                              'Photo upload failed. Please upload JPG, PNG, GIF, WEBP, HEIC, or HEIF and try again.';
                    setError(uploadErrorMessage);
                    setSaving(false);
                    return false;
                }
            }

            // On the final step, re-send ALL accumulated data + mark complete.
            // This ensures no data is lost even if an earlier step save failed.
            if (step === totalSteps) {
                const fullPayload: any = {
                    basics: {
                        firstName: data.firstName,
                        lastName: data.lastName,
                        gender: data.gender,
                        dateOfBirth: data.dateOfBirth,
                        maritalStatusId: data.maritalStatusId || null,
                        currentResidencyCountryId: data.currentResidencyCountryId || null,
                        currentResidencyStateId: data.currentResidencyStateId || null,
                        currentResidencyCityId: data.currentResidencyCityId || null,
                        height: data.height || null,
                        weight: data.weight || null,
                        complexion: data.complexion || null,
                        introduction: data.introduction,
                    },
                    family: {
                        religionId: data.religionId || null,
                        sectId: data.sectId || null,
                        casteId: data.casteId || null,
                    },
                    career: {
                        designation: data.designation,
                        company: data.company,
                        education: data.education,
                        institution: data.institution,
                        incomeRangeId: data.incomeRangeId || null,
                        jobTitleId: data.jobTitleId || null,
                        specialityId: data.specialityId || null,
                        careerPresent: true,
                        isHighestDegree: true,
                    },
                    onboardingCompleted: true,
                };
                await api.post('/full-profile/update', fullPayload);
            }

            setSaving(false);
            return true;
        } catch (err: any) {
            const serverMsg = err?.response?.data?.message;
            const missingFields = err?.response?.data?.missingFields;
            if (missingFields && Array.isArray(missingFields) && missingFields.length > 0) {
                setError(`${t('auth.onboarding.saveFailed')}: ${missingFields.join(', ')}`);
            } else {
                setError(serverMsg || t('auth.onboarding.saveFailed'));
            }
            setSaving(false);
            return false;
        }
    };

    const handleNext = async () => {
        const success = await saveStepData();
        if (success) {
            if (step < totalSteps) {
                setStep((s) => s + 1);
                setError(null);
            } else {
                onClose();
            }
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep((s) => s - 1);
            setError(null);
        }
    };

    const canProceed = () => {
        if (step === 1) {
            return !!(
                data.firstName &&
                data.lastName &&
                data.gender &&
                data.dateOfBirth &&
                data.maritalStatusId
            );
        }
        if (step === 2) {
            return !!(
                data.currentResidencyCountryId &&
                data.currentResidencyStateId &&
                data.currentResidencyCityId &&
                data.religionId &&
                data.sectId &&
                data.casteId
            );
        }
        if (step === 3) {
            return !!(
                data.designation &&
                data.company &&
                data.education &&
                data.institution &&
                data.incomeRangeId
            );
        }
        if (step === 4) {
            return !!(data.height && data.weight && data.complexion);
        }
        if (step === 5) {
            return !!String(data.introduction || '').trim();
        }
        if (step === 6) {
            return !!(photoFile || data.hasProfilePhoto);
        }
        return false;
    };

    const filteredCastes = liveCastes.length ? liveCastes : optionSets?.castes || [];

    if (loading) {
        return (
            <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 text-center">
                    <LoadingTimeoutFallback
                        message={t('auth.onboarding.loading')}
                        timeoutMs={10000}
                        reloadLabel={t('common.reloadPage', 'Reload page')}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header with progress */}
                <div className="px-6 pt-5 pb-4 bg-gradient-to-r from-primary/5 to-pink-50 border-b border-slate-100 shrink-0">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Sparkles size={20} className="text-primary" />
                                {onboardingTitleText}
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {t('auth.onboarding.stepLabel', {
                                    n: step,
                                    total: totalSteps,
                                    label: STEPS[step - 1].label,
                                })}
                            </p>
                        </div>
                        <div className="text-right">
                            <span
                                className={`text-2xl font-black ${livePercentage === 100 ? 'text-emerald-600' : 'text-primary'}`}
                            >
                                {livePercentage}%
                            </span>
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                                {t('auth.onboarding.complete')}
                            </p>
                        </div>
                    </div>

                    {/* Step progress bars — clickable to navigate */}
                    <div className="flex gap-1.5">
                        {STEPS.map((s, i) => (
                            <button
                                key={i}
                                className="flex-1 flex flex-col items-center gap-1 cursor-pointer group"
                                onClick={() => !saving && setStep(i + 1)}
                            >
                                <div
                                    className={`h-1.5 w-full rounded-full transition-all duration-300 ${
                                        liveStepComplete[i]
                                            ? 'bg-emerald-500'
                                            : i + 1 === step
                                              ? 'bg-primary'
                                              : 'bg-slate-200 group-hover:bg-slate-300'
                                    }`}
                                />
                                <span
                                    className={`text-[9px] font-semibold hidden sm:block ${
                                        liveStepComplete[i]
                                            ? 'text-emerald-600'
                                            : i + 1 === step
                                              ? 'text-slate-600'
                                              : 'text-slate-400'
                                    }`}
                                >
                                    {s.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 md:p-8 flex-1 overflow-y-auto">
                    {error && (
                        <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 flex items-center gap-2 text-sm font-medium">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    {/* Step 1: Personal Info */}
                    {step === 1 && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="text-center mb-6">
                                <h2 className="text-xl font-bold text-slate-900">
                                    {t('auth.onboarding.personalTitle')}
                                </h2>
                                <p className="text-sm text-slate-500">
                                    {t('auth.onboarding.personalSubtitle')}
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FieldGroup label={t('auth.onboarding.firstName')}>
                                    <input
                                        type="text"
                                        className={inputClass}
                                        value={data.firstName}
                                        onChange={(e) => updateField('firstName', e.target.value)}
                                        placeholder={t('auth.onboarding.firstNamePlaceholder')}
                                    />
                                </FieldGroup>
                                <FieldGroup label={t('auth.onboarding.lastName')}>
                                    <input
                                        type="text"
                                        className={inputClass}
                                        value={data.lastName}
                                        onChange={(e) => updateField('lastName', e.target.value)}
                                        placeholder={t('auth.onboarding.lastNamePlaceholder')}
                                    />
                                </FieldGroup>
                            </div>
                            <FieldGroup label={t('auth.onboarding.gender')}>
                                <div className="flex gap-3">
                                    {[
                                        { value: 'Male', label: t('auth.onboarding.male') },
                                        { value: 'Female', label: t('auth.onboarding.female') },
                                    ].map((g) => (
                                        <button
                                            key={g.value}
                                            onClick={() => updateField('gender', g.value)}
                                            className={`flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all ${
                                                data.gender === g.value
                                                    ? 'border-primary bg-primary/5 text-primary shadow-sm'
                                                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
                                            }`}
                                        >
                                            {g.label}
                                        </button>
                                    ))}
                                </div>
                            </FieldGroup>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FieldGroup label={t('auth.onboarding.dateOfBirth')}>
                                    <input
                                        type="date"
                                        required
                                        className={inputClass}
                                        value={data.dateOfBirth}
                                        onChange={(e) => updateField('dateOfBirth', e.target.value)}
                                    />
                                </FieldGroup>
                                <FieldGroup label={t('auth.onboarding.maritalStatus')}>
                                    <select
                                        className={inputClass}
                                        value={data.maritalStatusId || ''}
                                        onChange={(e) =>
                                            updateField('maritalStatusId', e.target.value)
                                        }
                                    >
                                        <option value="">
                                            {t('auth.onboarding.selectStatus')}
                                        </option>
                                        {(optionSets?.maritalStatuses || []).map((o: any) => (
                                            <option key={o.id} value={o.id}>
                                                {o.name}
                                            </option>
                                        ))}
                                    </select>
                                </FieldGroup>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Location & Religion */}
                    {step === 2 && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="text-center mb-6">
                                <h2 className="text-xl font-bold text-slate-900">
                                    {t('auth.onboarding.locationTitle')}
                                </h2>
                                <p className="text-sm text-slate-500">
                                    {t('auth.onboarding.locationSubtitle')}
                                </p>
                            </div>
                            <FieldGroup label={t('auth.onboarding.country')}>
                                <select
                                    className={inputClass}
                                    value={data.currentResidencyCountryId || ''}
                                    onChange={(e) => handleCountryChange(e.target.value)}
                                >
                                    <option value="">{t('auth.onboarding.selectCountry')}</option>
                                    {(optionSets?.countries || []).map((c: any) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </FieldGroup>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FieldGroup label={t('auth.onboarding.state')}>
                                    <select
                                        className={inputClass}
                                        value={data.currentResidencyStateId || ''}
                                        onChange={(e) => handleStateChange(e.target.value)}
                                        disabled={!states.length}
                                    >
                                        <option value="">{t('auth.onboarding.selectState')}</option>
                                        {states.map((s: any) => (
                                            <option key={s.id} value={s.id}>
                                                {s.name}
                                            </option>
                                        ))}
                                    </select>
                                </FieldGroup>
                                <FieldGroup label={t('auth.onboarding.city')}>
                                    <select
                                        className={inputClass}
                                        value={data.currentResidencyCityId || ''}
                                        onChange={(e) =>
                                            updateField('currentResidencyCityId', e.target.value)
                                        }
                                        disabled={!cities.length}
                                    >
                                        <option value="">{t('auth.onboarding.selectCity')}</option>
                                        {cities.map((c: any) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                </FieldGroup>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FieldGroup label={t('auth.onboarding.religion')}>
                                    <select
                                        className={inputClass}
                                        value={data.religionId || ''}
                                        onChange={(e) => {
                                            updateField('religionId', e.target.value);
                                            updateField('casteId', '');
                                        }}
                                    >
                                        <option value="">
                                            {t('auth.onboarding.selectReligion')}
                                        </option>
                                        {(optionSets?.religions || []).map((r: any) => (
                                            <option key={r.id} value={r.id}>
                                                {r.name}
                                            </option>
                                        ))}
                                    </select>
                                </FieldGroup>
                                <FieldGroup label={t('auth.onboarding.sect')}>
                                    <select
                                        className={inputClass}
                                        value={data.sectId || ''}
                                        onChange={(e) => updateField('sectId', e.target.value)}
                                        disabled={!liveSects.length}
                                    >
                                        <option value="">{t('auth.onboarding.selectSect')}</option>
                                        {liveSects.map((s: any) => (
                                            <option key={s.id} value={s.id}>
                                                {s.name}
                                            </option>
                                        ))}
                                    </select>
                                </FieldGroup>
                                <FieldGroup label={t('auth.onboarding.casteClan')}>
                                    <select
                                        className={inputClass}
                                        value={data.casteId || ''}
                                        onChange={(e) => updateField('casteId', e.target.value)}
                                        disabled={!filteredCastes.length}
                                    >
                                        <option value="">{t('auth.onboarding.selectCaste')}</option>
                                        {filteredCastes.map((c: any) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                </FieldGroup>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Career & Education */}
                    {step === 3 && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="text-center mb-6">
                                <h2 className="text-xl font-bold text-slate-900">
                                    {t('auth.onboarding.careerTitle')}
                                </h2>
                                <p className="text-sm text-slate-500">
                                    {t('auth.onboarding.careerSubtitle')}
                                </p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FieldGroup label={t('auth.onboarding.designation')}>
                                    <select
                                        className={inputClass}
                                        value={String(data.jobTitleId ?? '')}
                                        onChange={(e) => {
                                            const id = e.target.value;
                                            const label =
                                                (optionSets?.jobTitles || []).find(
                                                    (o: any) => String(o.id) === id,
                                                )?.name || '';
                                            setData((prev: any) => ({
                                                ...prev,
                                                jobTitleId: id,
                                                designation: label,
                                            }));
                                        }}
                                    >
                                        <option value="">
                                            {t('auth.onboarding.designationPlaceholder')}
                                        </option>
                                        {(optionSets?.jobTitles || []).map((o: any) => (
                                            <option key={o.id} value={String(o.id)}>
                                                {o.name}
                                            </option>
                                        ))}
                                    </select>
                                </FieldGroup>
                                <FieldGroup label="Speciality">
                                    <select
                                        className={inputClass}
                                        value={String(data.specialityId ?? '')}
                                        onChange={(e) =>
                                            updateField('specialityId', e.target.value)
                                        }
                                    >
                                        <option value="">Select Speciality</option>
                                        {(optionSets?.specialities || []).map((o: any) => (
                                            <option key={o.id} value={String(o.id)}>
                                                {o.name}
                                            </option>
                                        ))}
                                    </select>
                                </FieldGroup>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FieldGroup label={t('auth.onboarding.hospital')}>
                                    <input
                                        type="text"
                                        className={inputClass}
                                        value={data.company}
                                        onChange={(e) => updateField('company', e.target.value)}
                                        placeholder={t('auth.onboarding.hospitalPlaceholder')}
                                    />
                                </FieldGroup>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FieldGroup label={t('auth.onboarding.highestDegree')}>
                                    <input
                                        type="text"
                                        className={inputClass}
                                        value={data.education}
                                        onChange={(e) => updateField('education', e.target.value)}
                                        placeholder={t('auth.onboarding.degreePlaceholder')}
                                    />
                                </FieldGroup>
                                <FieldGroup label={t('auth.onboarding.institution')}>
                                    <input
                                        type="text"
                                        className={inputClass}
                                        value={data.institution}
                                        onChange={(e) => updateField('institution', e.target.value)}
                                        placeholder={t('auth.onboarding.institutionPlaceholder')}
                                    />
                                </FieldGroup>
                            </div>
                            <FieldGroup label={t('auth.onboarding.incomeRange')}>
                                <select
                                    className={inputClass}
                                    value={data.incomeRangeId || ''}
                                    onChange={(e) => updateField('incomeRangeId', e.target.value)}
                                >
                                    <option value="">
                                        {t('auth.onboarding.selectIncomeRange')}
                                    </option>
                                    {salaryRanges.map((r: any) => (
                                        <option key={r.id} value={r.id}>
                                            {r.label}
                                        </option>
                                    ))}
                                </select>
                            </FieldGroup>
                        </div>
                    )}

                    {/* Step 4: Physical */}
                    {step === 4 && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="text-center mb-6">
                                <h2 className="text-xl font-bold text-slate-900">
                                    {t('auth.onboarding.appearanceTitle')}
                                </h2>
                                <p className="text-sm text-slate-500">
                                    {t('auth.onboarding.appearanceSubtitle')}
                                </p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FieldGroup label={t('auth.onboarding.height')}>
                                    <input
                                        type="text"
                                        className={inputClass}
                                        value={data.height}
                                        onChange={(e) => updateField('height', e.target.value)}
                                        placeholder={t('auth.onboarding.heightPlaceholder')}
                                    />
                                </FieldGroup>
                                <FieldGroup label={t('auth.onboarding.weight')}>
                                    <input
                                        type="number"
                                        className={inputClass}
                                        value={data.weight}
                                        onChange={(e) => updateField('weight', e.target.value)}
                                        placeholder={t('auth.onboarding.weightPlaceholder')}
                                    />
                                </FieldGroup>
                                <FieldGroup label={t('auth.onboarding.complexion')}>
                                    <select
                                        className={inputClass}
                                        value={data.complexion || ''}
                                        onChange={(e) => updateField('complexion', e.target.value)}
                                    >
                                        <option value="">
                                            {t('auth.onboarding.selectComplexion')}
                                        </option>
                                        <option value="Very Fair">
                                            {t('auth.onboarding.veryFair')}
                                        </option>
                                        <option value="Fair">{t('auth.onboarding.fair')}</option>
                                        <option value="Wheatish">
                                            {t('auth.onboarding.wheatish')}
                                        </option>
                                        <option value="Dark">{t('auth.onboarding.dark')}</option>
                                    </select>
                                </FieldGroup>
                            </div>
                        </div>
                    )}

                    {/* Step 5: About Me */}
                    {step === 5 && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="text-center mb-6">
                                <h2 className="text-xl font-bold text-slate-900">
                                    {t('auth.onboarding.aboutMeTitle')}
                                </h2>
                                <p className="text-sm text-slate-500">
                                    {t('auth.onboarding.aboutMeSubtitle')}
                                </p>
                            </div>
                            <FieldGroup label={t('auth.onboarding.introLabel')}>
                                <textarea
                                    className={`${inputClass} min-h-[160px] resize-none`}
                                    value={data.introduction}
                                    onChange={(e) => updateField('introduction', e.target.value)}
                                    placeholder={t('auth.onboarding.introPlaceholder')}
                                    maxLength={1000}
                                />
                                <p className="text-xs text-slate-400 mt-1 text-right">
                                    {(data.introduction || '').length} / 1000
                                </p>
                            </FieldGroup>
                        </div>
                    )}

                    {/* Step 6: Photo */}
                    {step === 6 && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="text-center mb-6">
                                <h2 className="text-xl font-bold text-slate-900">
                                    {t('auth.onboarding.photoTitle')}
                                </h2>
                                <p className="text-sm text-slate-500">
                                    {t('auth.onboarding.photoSubtitle')}
                                </p>
                            </div>
                            <div className="flex flex-col items-center gap-6">
                                <div className="relative">
                                    <div
                                        className="size-40 rounded-full bg-cover bg-center border-4 border-white shadow-lg bg-slate-100"
                                        style={{
                                            backgroundImage:
                                                photoPreview || data.hasProfilePhoto
                                                    ? `url('${photoPreview || data.avatarUrl}')`
                                                    : undefined,
                                        }}
                                    >
                                        {!photoPreview && !data.hasProfilePhoto && (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                <Camera size={48} />
                                            </div>
                                        )}
                                    </div>
                                    {(photoPreview || data.hasProfilePhoto) && (
                                        <div className="absolute bottom-1 right-1 size-8 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-md">
                                            <Check size={16} />
                                        </div>
                                    )}
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handlePhotoSelect}
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold text-slate-700 transition-colors"
                                >
                                    <Upload size={16} />
                                    {photoPreview || data.hasProfilePhoto
                                        ? t('auth.onboarding.changePhoto')
                                        : t('auth.onboarding.uploadPhoto')}
                                </button>
                                <p className="text-xs text-slate-400 text-center max-w-xs">
                                    {t('auth.onboarding.photoHint')}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-slate-100 bg-slate-50/80 flex justify-between items-center shrink-0">
                    <button
                        onClick={handleBack}
                        disabled={step === 1 || saving}
                        className={`flex items-center gap-1.5 text-sm font-bold px-4 py-2.5 rounded-full transition-colors ${
                            step === 1
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        <ArrowLeft size={16} />
                        {t('auth.onboarding.back')}
                    </button>
                    <button
                        onClick={handleNext}
                        disabled={saving || !canProceed()}
                        className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />{' '}
                                {t('auth.onboarding.saving')}
                            </>
                        ) : step === totalSteps ? (
                            <>
                                <Check size={16} /> {finishSetupText}
                            </>
                        ) : (
                            <>
                                {t('auth.onboarding.continue')} <ArrowRight size={16} />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OnboardingModal;
