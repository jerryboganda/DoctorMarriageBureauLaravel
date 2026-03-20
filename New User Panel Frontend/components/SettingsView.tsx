import React, { useEffect, useState } from 'react';
import {
    Shield, Smartphone, Mail, Globe, Users, Lock, Eye, EyeOff, PauseCircle, Download, FileText,
    Check, ChevronRight, UserCog, ShieldCheck, Siren, Ban, UserX, ScanFace, Building2,
    Ghost, Fingerprint, Trash2, Key, History, Umbrella, CreditCard, Receipt, Gift,
    UserPlus, SmartphoneNfc, LogOut, Laptop, Tablet, Bell, Zap, Star, Loader2
} from 'lucide-react';
import VerificationModal from './VerificationModal';
import StepUpVerificationModal from './StepUpVerificationModal';
import TwoFactorSetupModal from './TwoFactorSetupModal';
import { api } from '../utils/api';
import CredentialVerificationModal from './CredentialVerificationModal';
import CountryCodeSelector from './CountryCodeSelector';
import { Country, getDefaultCountry, countries } from '../utils/countries';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../src/stores/authStore';

interface SettingsViewProps {
    onLaunchOnboarding: () => void;
    onOpenBilling?: () => void;
    onSelectPlan?: (id: number, name: string, amount: number) => void;
    appliedCouponCode?: string | null;
    onApplyCoupon?: (code: string | null) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ onLaunchOnboarding, onOpenBilling, onSelectPlan, appliedCouponCode, onApplyCoupon }) => {
    const { t } = useTranslation();
    const { user, setUser } = useAuthStore();
    const [activeTab, setActiveTab] = useState<'account' | 'privacy' | 'safety' | 'billing'>('account');
    const [loading, setLoading] = useState(true);
    const [managementMode, setManagementMode] = useState<'self' | 'family' | 'matchmaker' | 'dual'>('self');
    const [availableModes, setAvailableModes] = useState<any[]>([]);
    const [showVerification, setShowVerification] = useState(false);

    const [securityStatus, setSecurityStatus] = useState<any | null>(null);
    const [notificationPrefs, setNotificationPrefs] = useState<any | null>(null);
    const [visibility, setVisibility] = useState<Record<string, boolean>>({});
    const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
    const [packageDetails, setPackageDetails] = useState<any | null>(null);
    const [purchaseHistory, setPurchaseHistory] = useState<any[]>([]);
    const [addonPurchaseHistory, setAddonPurchaseHistory] = useState<any[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
    const [availablePackages, setAvailablePackages] = useState<any[]>([]);
    const [pendingTransfer, setPendingTransfer] = useState<any | null>(null);

    const [couponInput, setCouponInput] = useState(appliedCouponCode ?? '');
    const [couponStatus, setCouponStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [couponMessage, setCouponMessage] = useState<string | null>(null);

    // 2FA State
    const [is2FAEnabled, setIs2FAEnabled] = useState(false);
    const [show2FAModal, setShow2FAModal] = useState(false);
    const [twoFactorMode, setTwoFactorMode] = useState<'setup' | 'recovery'>('setup');

    // Verification State
    const [showCredentialVerification, setShowCredentialVerification] = useState(false);
    const [verificationType, setVerificationType] = useState<'email' | 'phone'>('email');
    const [verificationValue, setVerificationValue] = useState('');

    // Device Management State
    const [devices, setDevices] = useState<any[]>([]);
    const [loginAlerts, setLoginAlerts] = useState({ email: true });

    // Privacy State
    const [incognito, setIncognito] = useState(false);
    const [watermark, setWatermark] = useState(true);
    const [profilePhotoBlur, setProfilePhotoBlur] = useState(false);
    const [photoVisibility, setPhotoVisibility] = useState('requests');
    const [visibilitySavingKey, setVisibilitySavingKey] = useState<string | null>(null);
    const [visibilityStatus, setVisibilityStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [visibilityStatusMessage, setVisibilityStatusMessage] = useState<string | null>(null);
    const visibilityStatusTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    // Recovery State
    const [trustedContacts, setTrustedContacts] = useState<any[]>([]);
    const [showTrustedForm, setShowTrustedForm] = useState(false);
    const [trustedCountry, setTrustedCountry] = useState<Country>(getDefaultCountry());
    const [trustedForm, setTrustedForm] = useState({
        name: '',
        relationship: 'parent',
        email: '',
        phone: '',
    });

    const [showTransferForm, setShowTransferForm] = useState(false);
    const [transferCountry, setTransferCountry] = useState<Country>(getDefaultCountry());
    const [transferForm, setTransferForm] = useState({
        to_name: '',
        to_email: '',
        to_phone: '',
        reason: '',
    });
    const [transferSubmitting, setTransferSubmitting] = useState(false);

    const [stepUpContext, setStepUpContext] = useState<{
        purpose: 'ownership_transfer' | '2fa_disable' | 'account_delete';
        label: string;
        onVerified: (token: string) => Promise<void>;
    } | null>(null);

    const applyVisibilitySnapshot = React.useCallback((visibilityData: Record<string, any>) => {
        setVisibility(visibilityData);
        setIncognito(visibilityData.incognito === true);
        setWatermark(visibilityData.screenshot_deterrence !== false);
        setProfilePhotoBlur(visibilityData.profile_photo_blur === true);
        const visibilityPublic = visibilityData.photo_visibility_public !== false;
        const visibilityMembers = visibilityData.photo_visibility_members !== false;
        setPhotoVisibility(visibilityPublic ? 'everyone' : visibilityMembers ? 'members' : 'requests');
        setVisibilitySavingKey(null);
        setVisibilityStatus((current) => current === 'saving' ? 'saved' : current);

        if (user) {
            setUser({
                ...user,
                is_visible: visibilityData.profile_visible !== false,
                incognito: visibilityData.incognito === true,
            });
        }
    }, [setUser, user]);

    useEffect(() => {
        return () => {
            if (visibilityStatusTimerRef.current) {
                clearTimeout(visibilityStatusTimerRef.current);
            }
        };
    }, []);

    const handleTrustedPhoneChange = (value: string) => {
        // User types only the local part (dial code is shown in the selector)
        const digits = value.replace(/\D/g, '').replace(/^0+/, '');
        setTrustedForm(prev => ({ ...prev, phone: digits ? trustedCountry.dialCode + digits : '' }));
    };

    const handleTransferPhoneChange = (value: string) => {
        // User types only the local part (dial code is shown in the selector)
        const digits = value.replace(/\D/g, '').replace(/^0+/, '');
        setTransferForm(prev => ({ ...prev, to_phone: digits ? transferCountry.dialCode + digits : '' }));
    };

    // Auto-update dial code prefix when country changes
    useEffect(() => {
        if (showTrustedForm && trustedForm.phone) {
            const oldCountry = countries.find(c => trustedForm.phone.startsWith(c.dialCode));
            const localPart = oldCountry ? trustedForm.phone.slice(oldCountry.dialCode.length) : trustedForm.phone.replace(/^\+?\d*/, '');
            setTrustedForm(prev => ({ ...prev, phone: localPart ? trustedCountry.dialCode + localPart : '' }));
        }
    }, [trustedCountry]);

    useEffect(() => {
        if (showTransferForm && transferForm.to_phone) {
            const oldCountry = countries.find(c => transferForm.to_phone.startsWith(c.dialCode));
            const localPart = oldCountry ? transferForm.to_phone.slice(oldCountry.dialCode.length) : transferForm.to_phone.replace(/^\+?\d*/, '');
            setTransferForm(prev => ({ ...prev, to_phone: localPart ? transferCountry.dialCode + localPart : '' }));
        }
    }, [transferCountry]);

    // Safety State
    const [tickets, setTickets] = useState<any[]>([]);
    const [showSafetyModal, setShowSafetyModal] = useState(false);
    const [safetyModalContent, setSafetyModalContent] = useState<{ title: string; content: React.ReactNode } | null>(null);
    const [reportSubject, setReportSubject] = useState('');
    const [reportDescription, setReportDescription] = useState('');
    const [reportSubmitting, setReportSubmitting] = useState(false);

    useEffect(() => {
        let isActive = true;

        const loadData = async () => {
            setLoading(true);
            const results = await Promise.allSettled([
                api.get('/member/account/security-status'),
                api.get('/member/account/ownership'),
                api.get('/member/notifications/preferences'),
                api.get('/member/profile/visibility'),
                api.get('/member/ignored-user-list'),
                api.get('/member/package-details'),
                api.get('/member/package-purchase-history'),
                api.get('/member/addon-purchase-history'),
                api.get('/payment-types', { params: { payment_type: 'package_payment' } }),
                api.get('/packages'),
                api.get('/member/my-tickets'),
            ]);

            if (!isActive) return;

            const [
                securityRes,
                ownershipRes,
                prefsRes,
                visibilityRes,
                ignoredRes,
                packageRes,
                historyRes,
                addonHistoryRes,
                paymentRes,
                packagesRes,
                ticketsRes,
            ] = results.map((result) => (result.status === 'fulfilled' ? result.value : null));

            const securityData = securityRes?.data?.data ?? null;
            setSecurityStatus(securityData);
            setDevices(securityData?.devices ?? []);
            setTrustedContacts(securityData?.trusted_contacts ?? []);
            setIs2FAEnabled(Boolean(securityData?.two_factor?.enabled));

            const ownershipData = ownershipRes?.data?.data ?? null;
            if (ownershipData?.management_mode) {
                setManagementMode(ownershipData.management_mode);
            }
            if (ownershipData?.available_modes) {
                setAvailableModes(ownershipData.available_modes);
            }
            setPendingTransfer(ownershipData?.pending_transfer ?? null);

            const prefsData = prefsRes?.data?.preferences ?? null;
            setNotificationPrefs(prefsData);
            if (prefsData) {
                setLoginAlerts({
                    email: Boolean(prefsData.email_digest),
                });
            }

            const visibilityData = visibilityRes?.data?.data ?? {};
            applyVisibilitySnapshot(visibilityData);

            setBlockedUsers(ignoredRes?.data?.data ?? []);
            setPackageDetails(packageRes?.data?.data ?? null);
            setPurchaseHistory(historyRes?.data?.data ?? []);
            setAddonPurchaseHistory(addonHistoryRes?.data?.data ?? []);
            setPaymentMethods(paymentRes?.data?.data ?? []);
            setAvailablePackages(packagesRes?.data?.data ?? []);
            setTickets(ticketsRes?.data?.data ?? []);

            setLoading(false);
        };

        loadData();

        return () => {
            isActive = false;
        };
    }, []);

    useEffect(() => {
        if (appliedCouponCode === undefined) return;
        setCouponInput(appliedCouponCode ?? '');
    }, [appliedCouponCode]);

    const updateVisibilitySetting = async (fieldName: string, isVisible: boolean) => {
        setVisibility((prev) => ({ ...prev, [fieldName]: isVisible }));
        setVisibilitySavingKey(fieldName);
        setVisibilityStatus('saving');
        setVisibilityStatusMessage(null);
        if (fieldName === 'incognito') {
            setIncognito(isVisible);
        }
        if (fieldName === 'screenshot_deterrence') {
            setWatermark(isVisible);
        }
        if (fieldName === 'profile_photo_blur') {
            setProfilePhotoBlur(isVisible);
        }
        try {
            const response = await api.post('/member/profile/visibility', {
                field_name: fieldName,
                is_visible: isVisible,
            });
            const nextVisibility = response.data?.data ?? {};
            if (Object.keys(nextVisibility).length > 0) {
                applyVisibilitySnapshot(nextVisibility);
                setVisibilityStatusMessage(response.data?.message ?? t('settings.privacy.saved'));
            }
            setVisibilityStatus('saved');
            if (visibilityStatusTimerRef.current) clearTimeout(visibilityStatusTimerRef.current);
            visibilityStatusTimerRef.current = setTimeout(() => {
                setVisibilityStatus((current) => current === 'saved' ? 'idle' : current);
                setVisibilityStatusMessage(null);
            }, 2200);
            return true;
        } catch (error) {
            console.error('Failed to update visibility', error);
            setVisibilityStatus('error');
            setVisibilityStatusMessage(t('settings.privacy.saveFailed'));
            try {
                const refresh = await api.get('/member/profile/visibility');
                applyVisibilitySnapshot(refresh.data?.data ?? {});
            } catch (refreshError) {
                console.error('Failed to refresh visibility after error', refreshError);
            }
            if (visibilityStatusTimerRef.current) clearTimeout(visibilityStatusTimerRef.current);
            visibilityStatusTimerRef.current = setTimeout(() => {
                setVisibilityStatus((current) => current === 'error' ? 'idle' : current);
                setVisibilityStatusMessage(null);
            }, 3500);
            return false;
        } finally {
            setVisibilitySavingKey(null);
        }
    };

    const handleManagementMode = async (mode: 'self' | 'family' | 'matchmaker' | 'dual') => {
        setManagementMode(mode);
        try {
            await api.put('/member/account/management-mode', { mode });
        } catch (error) {
            console.error('Failed to update management mode', error);
        }
    };

    const handleRevokeDevice = async (id: number) => {
        try {
            await api.delete(`/member/account/devices/${id}`);
            setDevices((prev) => prev.filter((device) => device.id !== id));
        } catch (error) {
            console.error('Failed to revoke device', error);
        }
    };

    const handleRevokeAll = async () => {
        try {
            await api.delete('/member/account/devices-others');
            setDevices((prev) => prev.filter((device) => device.is_current));
        } catch (error) {
            console.error('Failed to revoke other devices', error);
        }
    };

    const refreshSecurityStatus = async () => {
        try {
            const securityRes = await api.get('/member/account/security-status');
            const securityData = securityRes?.data?.data ?? null;
            setSecurityStatus(securityData);
            setDevices(securityData?.devices ?? []);
            setTrustedContacts(securityData?.trusted_contacts ?? []);
            setIs2FAEnabled(Boolean(securityData?.two_factor?.enabled));
        } catch (error) {
            console.error('Failed to refresh security status', error);
        }
    };

    const handleAlertsChange = async (next: { email: boolean }) => {
        setLoginAlerts(next);
        setNotificationPrefs((prev) => (prev ? { ...prev, email_digest: next.email, sms: false } : prev));
        try {
            await api.post('/member/notifications/preferences', {
                email_digest: next.email,
                sms: false,
                whatsapp: notificationPrefs?.whatsapp ?? true,
                push_notifications: notificationPrefs?.push_notifications ?? true,
                weekly_digest: notificationPrefs?.weekly_digest ?? true,
            });
        } catch (error) {
            console.error('Failed to update notification preferences', error);
        }
    };

    const handleApplyCoupon = async () => {
        const code = couponInput.trim();
        if (!code) {
            setCouponStatus('error');
            setCouponMessage(t('settings.billing.enterGiftCode'));
            return;
        }

        setCouponStatus('loading');
        setCouponMessage(null);

        try {
            const response = await api.post('/member/coupons/validate', {
                code,
                purchase_type: 'any',
            });
            if (response.data?.result || response.data?.success) {
                const resolvedCode = response.data?.data?.code ?? code;
                setCouponInput(resolvedCode);
                setCouponStatus('success');
                setCouponMessage(t('settings.billing.codeSaved'));
                onApplyCoupon?.(resolvedCode);
            } else {
                setCouponStatus('error');
                setCouponMessage(response.data?.message || t('settings.billing.invalidCode'));
            }
        } catch (error: any) {
            setCouponStatus('error');
            setCouponMessage(error.response?.data?.message || t('settings.billing.failedApplyCode'));
        }
    };

    const handleAddTrustedContact = async () => {
        try {
            const response = await api.post('/member/account/trusted-contacts', trustedForm);
            setTrustedContacts((prev) => [response.data?.data, ...prev].filter(Boolean));
            setTrustedForm({ name: '', relationship: 'parent', email: '', phone: '' });
            setShowTrustedForm(false);
        } catch (error) {
            console.error('Failed to add trusted contact', error);
        }
    };

    const handleRemoveTrustedContact = async (id: number) => {
        try {
            await api.delete(`/member/account/trusted-contacts/${id}`);
            setTrustedContacts((prev) => prev.filter((contact) => contact.id !== id));
        } catch (error) {
            console.error('Failed to remove trusted contact', error);
        }
    };

    const handleResendTrustedContact = async (id: number) => {
        try {
            await api.post(`/member/account/trusted-contacts/${id}/resend`);
        } catch (error) {
            console.error('Failed to resend trusted contact verification', error);
        }
    };

    const handlePhotoVisibilityChange = async (value: 'everyone' | 'members' | 'requests') => {
        const payload = value === 'everyone'
            ? { photo_visibility_public: true, photo_visibility_members: true }
            : value === 'members'
                ? { photo_visibility_public: false, photo_visibility_members: true }
                : { photo_visibility_public: false, photo_visibility_members: false };

        setPhotoVisibility(value);
        setVisibilitySavingKey('photo_visibility');
        setVisibilityStatus('saving');
        setVisibilityStatusMessage(null);
        try {
            const response = await api.post('/member/profile/visibility', payload);
            applyVisibilitySnapshot(response.data?.data ?? payload);
            setVisibilityStatus('saved');
            setVisibilityStatusMessage(response.data?.message ?? t('settings.privacy.saved'));
            if (visibilityStatusTimerRef.current) clearTimeout(visibilityStatusTimerRef.current);
            visibilityStatusTimerRef.current = setTimeout(() => {
                setVisibilityStatus((current) => current === 'saved' ? 'idle' : current);
                setVisibilityStatusMessage(null);
            }, 2200);
        } catch (error) {
            console.error('Failed to update photo visibility', error);
            setVisibilityStatus('error');
            setVisibilityStatusMessage(t('settings.privacy.saveFailed'));
            try {
                const refresh = await api.get('/member/profile/visibility');
                applyVisibilitySnapshot(refresh.data?.data ?? {});
            } catch (refreshError) {
                console.error('Failed to refresh visibility after photo visibility error', refreshError);
            }
            if (visibilityStatusTimerRef.current) clearTimeout(visibilityStatusTimerRef.current);
            visibilityStatusTimerRef.current = setTimeout(() => {
                setVisibilityStatus((current) => current === 'error' ? 'idle' : current);
                setVisibilityStatusMessage(null);
            }, 3500);
        } finally {
            setVisibilitySavingKey(null);
        }
    };

    const handleDeactivateAccount = async () => {
        try {
            await api.post('/member/account/deactivate', { deacticvation_status: 1 });
        } catch (error) {
            console.error('Failed to deactivate account', error);
        }
    };

    const handleDeleteAccount = async () => {
        setStepUpContext({
            purpose: 'account_delete',
            label: t('settings.security.deleteYourAccount'),
            onVerified: async () => {
                await api.post('/member/account/delete');
            },
        });
    };

    const handleCancelTransfer = async () => {
        try {
            await api.post('/member/account/ownership/cancel');
            setPendingTransfer(null);
        } catch (error) {
            console.error('Failed to cancel ownership transfer', error);
        }
    };

    const handleInitiateTransfer = async () => {
        if (!transferForm.to_name.trim() || (!transferForm.to_email.trim() && !transferForm.to_phone.trim())) {
            return;
        }

        setStepUpContext({
            purpose: 'ownership_transfer',
            label: t('settings.security.transferOwnershipAction'),
            onVerified: async (token: string) => {
                try {
                    setTransferSubmitting(true);
                    const response = await api.post('/member/account/ownership/transfer', {
                        step_up_token: token,
                        ...transferForm,
                    });
                    setPendingTransfer(response.data?.data ?? null);
                    setTransferForm({ to_name: '', to_email: '', to_phone: '', reason: '' });
                    setShowTransferForm(false);
                } finally {
                    setTransferSubmitting(false);
                }
            },
        });
    };

    const handleUnblockUser = async (userId: number) => {
        try {
            await api.post('/member/remove-from-ignored-list', { user_id: userId });
            setBlockedUsers((prev) => prev.filter((user) => user.user_id !== userId));
        } catch (error) {
            console.error('Failed to unblock user', error);
        }
    };

    const formatDeviceLastActive = (value?: string | null) => {
        if (!value) return t('settings.security.unknown');
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return value;
        return parsed.toLocaleString();
    };

    const handleOpenSafetyModal = (type: 'tips' | 'report' | 'ghosting' | 'data') => {
        if (type === 'tips') {
            setSafetyModalContent({
                title: t('settings.safety.safeMarriageTips'),
                content: (
                    <div className="space-y-4 text-sm text-slate-600">
                        <p>{t('settings.safety.tip1')}</p>
                        <p>{t('settings.safety.tip2')}</p>
                        <p>{t('settings.safety.tip3')}</p>
                        <p>{t('settings.safety.tip4')}</p>
                    </div>
                )
            });
        } else if (type === 'ghosting') {
            setSafetyModalContent({
                title: t('settings.safety.ghostingPolicy'),
                content: (
                    <div className="space-y-4 text-sm text-slate-600">
                        <p>{t('settings.safety.ghostingBody1')}</p>
                        <p>{t('settings.safety.ghostingBody2')}</p>
                    </div>
                )
            });
        } else if (type === 'data') {
            setSafetyModalContent({
                title: t('settings.safety.dataProtection'),
                content: (
                    <div className="space-y-4 text-sm text-slate-600">
                        <p>{t('settings.safety.dataBody1')}</p>
                        <p>{t('settings.safety.dataBody2')}</p>
                    </div>
                )
            });
        } else if (type === 'report') {
            setSafetyModalContent({
                title: t('settings.safety.reportIncident'),
                content: 'form'
            });
        }
        setShowSafetyModal(true);
    };

    const handleSubmitReport = async () => {
        if (!reportSubject.trim() || !reportDescription.trim()) return;
        setReportSubmitting(true);
        try {
            await api.post('/member/support-ticket/store', {
                subject: reportSubject,
                details: reportDescription,
                category: 'Safety Incident' // Assuming backend handles this or just plain text
            });
            setShowSafetyModal(false);
            setReportSubject('');
            setReportDescription('');
            // Refresh tickets
            const res = await api.get('/member/my-tickets');
            setTickets(res.data?.data ?? []);
        } catch (error) {
            console.error('Failed to submit report', error);
        } finally {
            setReportSubmitting(false);
        }
    };

    const emailCredential = securityStatus?.credentials?.email;
    const phoneCredential = securityStatus?.credentials?.phone;
    const profileVisible = visibility.profile_visible !== false;
    const verifiedContactCount = trustedContacts.filter((contact) => contact.is_verified).length;
    const trustScore = [
        emailCredential?.verified ? 30 : 0,
        phoneCredential?.verified ? 30 : 0,
        is2FAEnabled ? 20 : 0,
        verifiedContactCount > 0 ? 20 : 0,
    ].reduce((sum, val) => sum + val, 0);
    const trustLabel = trustScore >= 80 ? t('settings.safety.excellent') : trustScore >= 60 ? t('settings.safety.good') : trustScore >= 40 ? t('settings.safety.fair') : t('settings.safety.needsWork');
    const canAddTrustedContact = trustedContacts.length < 3;


    return (
        <div className="flex-1 flex flex-col h-full min-h-0">
            {/* Header */}
            <header className="h-auto md:h-20 shrink-0 flex flex-col md:flex-row items-start md:items-center justify-between px-4 md:px-8 py-4 bg-white border-b border-slate-200 sticky top-0 z-10 gap-4">
                <div className="w-full md:w-auto">
                    <h2 className="text-2xl font-bold text-slate-900">{t('settings.title')}</h2>
                    <div className="flex gap-6 mt-1 overflow-x-auto scrollbar-hide w-full pb-1">
                        <button
                            onClick={() => setActiveTab('account')}
                            className={`text-sm font-bold transition-colors border-b-2 pb-0.5 whitespace-nowrap ${activeTab === 'account' ? 'text-primary border-primary' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
                        >
                            {t('settings.tabs.accountSecurity')}
                        </button>
                        <button
                            onClick={() => setActiveTab('billing')}
                            className={`text-sm font-bold transition-colors border-b-2 pb-0.5 flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'billing' ? 'text-primary border-primary' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
                        >
                            <CreditCard size={14} /> {t('settings.tabs.billingPlans')}
                        </button>
                        <button
                            onClick={() => setActiveTab('privacy')}
                            className={`text-sm font-bold transition-colors border-b-2 pb-0.5 flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'privacy' ? 'text-primary border-primary' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
                        >
                            <EyeOff size={14} /> {t('settings.tabs.privacy')}
                        </button>
                        <button
                            onClick={() => setActiveTab('safety')}
                            className={`text-sm font-bold transition-colors border-b-2 pb-0.5 flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'safety' ? 'text-primary border-primary' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
                        >
                            <ShieldCheck size={14} /> {t('settings.tabs.safety')}
                        </button>
                    </div>
                </div>
                <button
                    onClick={onLaunchOnboarding}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-full transition-colors flex items-center gap-2 shadow-lg w-full md:w-auto justify-center"
                >
                    <UserCog size={18} />
                    {t('settings.tabs.profileOnboarding')}
                </button>
            </header>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-hide">
                <div className="max-w-6xl mx-auto">

                    {activeTab === 'account' && (
                        loading ? (
                            <div className="flex items-center justify-center p-20">
                                <div className="flex flex-col items-center gap-3 text-slate-400">
                                    <Loader2 size={32} className="animate-spin text-primary" />
                                    <p className="text-sm font-medium">{t('settings.security.loading')}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4">
                                {/* Account & Identity Column */}
                                <div className="space-y-6">
                                    <SectionHeader title={t('settings.security.accessCredentials')} icon={<Shield size={20} className="text-primary" />} />

                                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                        <div className="p-6 border-b border-slate-100">
                                            <h4 className="font-bold text-slate-900 mb-4">{t('settings.security.registrationMethods')}</h4>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className="size-10 bg-white rounded-full flex items-center justify-center border border-slate-200 shrink-0">
                                                            <Mail size={18} className="text-slate-600" />
                                                        </div>
                                                        <div className="overflow-hidden">
                                                            <p className="text-sm font-bold text-slate-900">{t('settings.security.emailAddress')}</p>
                                                            <p className="text-xs text-slate-500 truncate">{emailCredential?.value ?? t('settings.security.notSet')}</p>
                                                        </div>
                                                    </div>
                                                    <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full shrink-0 ${emailCredential?.verified ? 'text-green-600 bg-green-50' : 'text-slate-500 bg-slate-100'}`}>
                                                        {emailCredential?.verified ? (
                                                            <><Check size={12} /> {t('settings.security.verified')}</>
                                                        ) : (
                                                            <button
                                                                onClick={() => {
                                                                    setVerificationType('email');
                                                                    setVerificationValue(emailCredential?.raw ?? emailCredential?.value ?? '');
                                                                    setShowCredentialVerification(true);
                                                                }}
                                                                className="hover:text-primary hover:underline flex items-center gap-1"
                                                            >
                                                                {t('settings.security.verifyNow')} <ChevronRight size={10} />
                                                            </button>
                                                        )}
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className="size-10 bg-white rounded-full flex items-center justify-center border border-slate-200 shrink-0">
                                                            <Smartphone size={18} className="text-slate-600" />
                                                        </div>
                                                        <div className="overflow-hidden">
                                                            <p className="text-sm font-bold text-slate-900">{t('settings.security.phoneOTP')}</p>
                                                            <p className="text-xs text-slate-500 truncate">{phoneCredential?.value ?? t('settings.security.notSet')}</p>
                                                        </div>
                                                    </div>
                                                    <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full shrink-0 ${phoneCredential?.verified ? 'text-green-600 bg-green-50' : 'text-slate-500 bg-slate-100'}`}>
                                                        {phoneCredential?.verified ? (
                                                            <><Check size={12} /> {t('settings.security.verified')}</>
                                                        ) : (
                                                            <button
                                                                onClick={() => {
                                                                    setVerificationType('phone');
                                                                    setVerificationValue(phoneCredential?.raw ?? phoneCredential?.value ?? '');
                                                                    setShowCredentialVerification(true);
                                                                }}
                                                                className="hover:text-primary hover:underline flex items-center gap-1"
                                                            >
                                                                {t('settings.security.verifyNow')} <ChevronRight size={10} />
                                                            </button>
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Credential Verification Modal */}
                                        <CredentialVerificationModal
                                            isOpen={showCredentialVerification}
                                            onClose={() => setShowCredentialVerification(false)}
                                            type={verificationType}
                                            value={verificationValue}
                                            onVerified={() => {
                                                setShowCredentialVerification(false);
                                                refreshSecurityStatus();
                                            }}
                                        />

                                        {/* Recoverability Section */}
                                        <div className="p-6 bg-slate-50/50">
                                            <div className="flex justify-between items-center mb-4">
                                                <h4 className="font-bold text-slate-900 flex items-center gap-2">
                                                    <Key size={16} className="text-orange-500" /> {t('settings.security.accountRecovery')}
                                                </h4>
                                                <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-bold">{t('settings.security.recommended')}</span>
                                            </div>

                                            <div className="space-y-4">
                                                {trustedContacts.length > 0 && (
                                                    <div className="space-y-2">
                                                        {trustedContacts.map((contact) => (
                                                            <div key={contact.id} className="p-3 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`size-8 rounded-full flex items-center justify-center ${contact.is_verified ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                                                                        <ShieldCheck size={16} />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-bold text-slate-900">{contact.name}</p>
                                                                        <p className="text-xs text-slate-500">
                                                                            {contact.relationship} • {contact.email || contact.phone || t('settings.security.contactAdded')}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    {!contact.is_verified && (
                                                                        <button onClick={() => handleResendTrustedContact(contact.id)} className="text-xs font-bold text-primary hover:underline">
                                                                            {t('settings.security.resend')}
                                                                        </button>
                                                                    )}
                                                                    <button onClick={() => handleRemoveTrustedContact(contact.id)} className="text-xs text-red-500 font-bold hover:underline">
                                                                        {t('settings.security.remove')}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {showTrustedForm ? (
                                                    <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            <div>
                                                                <label className="block text-xs font-bold text-slate-700 mb-1">{t('settings.security.fullName')}</label>
                                                                <input
                                                                    type="text"
                                                                    value={trustedForm.name}
                                                                    onChange={(e) => setTrustedForm((prev) => ({ ...prev, name: e.target.value }))}
                                                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-bold text-slate-700 mb-1">{t('settings.security.relationship')}</label>
                                                                <select
                                                                    value={trustedForm.relationship}
                                                                    onChange={(e) => setTrustedForm((prev) => ({ ...prev, relationship: e.target.value }))}
                                                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                                                                >
                                                                    <option value="parent">{t('settings.security.relationParent')}</option>
                                                                    <option value="sibling">{t('settings.security.relationSibling')}</option>
                                                                    <option value="spouse">{t('settings.security.relationSpouse')}</option>
                                                                    <option value="friend">{t('settings.security.relationFriend')}</option>
                                                                    <option value="relative">{t('settings.security.relationRelative')}</option>
                                                                    <option value="other">{t('settings.security.relationOther')}</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-bold text-slate-700 mb-1">{t('settings.security.emailOptional')} <span className="ml-1 text-[10px] font-semibold text-pink-600 bg-pink-100 px-2 py-0.5 rounded-full">Optional</span></label>
                                                                <input
                                                                    type="email"
                                                                    value={trustedForm.email}
                                                                    onChange={(e) => setTrustedForm((prev) => ({ ...prev, email: e.target.value }))}
                                                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-bold text-slate-700 mb-1">{t('settings.security.phoneOptional')} <span className="ml-1 text-[10px] font-semibold text-pink-600 bg-pink-100 px-2 py-0.5 rounded-full">Optional</span></label>
                                                                <div className="flex items-stretch bg-white border border-slate-300 rounded-lg focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all overflow-hidden">
                                                                    <CountryCodeSelector
                                                                        selectedCountry={trustedCountry}
                                                                        onSelect={setTrustedCountry}
                                                                        variant="simple"
                                                                    />
                                                                    <input
                                                                        type="tel"
                                                                        value={trustedForm.phone.startsWith(trustedCountry.dialCode) ? trustedForm.phone.slice(trustedCountry.dialCode.length) : trustedForm.phone.replace(/^\+\d+/, '')}
                                                                        onChange={(e) => handleTrustedPhoneChange(e.target.value)}
                                                                        className="flex-1 bg-transparent px-3 py-2 text-sm outline-none"
                                                                        placeholder={t('settings.security.phoneNumber')}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-wrap gap-2">
                                                            <button
                                                                onClick={handleAddTrustedContact}
                                                                disabled={!trustedForm.name.trim() || (!trustedForm.email.trim() && !trustedForm.phone.trim())}
                                                                className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 disabled:opacity-60"
                                                            >
                                                                {t('settings.security.saveContact')}
                                                            </button>
                                                            <button onClick={() => setShowTrustedForm(false)} className="px-4 py-2 border border-slate-200 text-xs font-bold rounded-lg text-slate-600 hover:bg-slate-50">
                                                                {t('settings.security.cancel')}
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    canAddTrustedContact && (
                                                        <button
                                                            onClick={() => setShowTrustedForm(true)}
                                                            className="w-full p-3 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center gap-2 text-slate-500 hover:border-primary hover:text-primary hover:bg-white transition-all"
                                                        >
                                                            <UserPlus size={18} />
                                                            <span className="text-sm font-bold">{t('settings.security.addTrustedContact')}</span>
                                                        </button>
                                                    )
                                                )}

                                                <p className="text-xs text-slate-400 leading-relaxed">
                                                    {t('settings.security.trustedContactDesc')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Active Sessions & Devices */}
                                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                        <div className="flex justify-between items-center mb-6">
                                            <h4 className="font-bold text-slate-900 flex items-center gap-2">
                                                <SmartphoneNfc size={18} className="text-slate-600" /> {t('settings.security.deviceManagement')}
                                            </h4>
                                            {devices.length > 1 && (
                                                <button
                                                    onClick={handleRevokeAll}
                                                    className="text-xs font-bold text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                                >
                                                    {t('settings.security.signOutDevices')}
                                                </button>
                                            )}
                                        </div>

                                        <div className="space-y-3">
                                            {devices.map((device) => {
                                                const deviceType = device.device_type ?? device.type ?? 'unknown';
                                                const isCurrent = Boolean(device.is_current ?? device.current);
                                                const deviceName = device.device_name ?? device.name ?? t('settings.security.unknownDevice');
                                                const locationLabel = device.location || device.ip_address || t('settings.security.unknownLocation');
                                                const lastActive = formatDeviceLastActive(device.last_used_at ?? device.lastActive);

                                                return (
                                                    <div key={device.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`size-10 rounded-full flex items-center justify-center ${isCurrent ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                                                                {deviceType === 'mobile' ? <Smartphone size={20} /> : deviceType === 'tablet' ? <Tablet size={20} /> : <Laptop size={20} />}
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <p className="text-sm font-bold text-slate-900">{deviceName}</p>
                                                                    {isCurrent && <span className="text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded uppercase tracking-wider">{t('settings.security.thisDevice')}</span>}
                                                                </div>
                                                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                                                    {locationLabel} â€¢ <span className={isCurrent ? 'text-green-600 font-bold' : ''}>{lastActive}</span>
                                                                </p>
                                                            </div>
                                                        </div>
                                                        {!isCurrent && (
                                                            <button
                                                                onClick={() => handleRevokeDevice(device.id)}
                                                                className="text-xs font-bold text-slate-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                                                title={t('settings.security.signOut')}
                                                            >
                                                                <LogOut size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="mt-6 pt-6 border-t border-slate-100">
                                            <h5 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                                                <Bell size={16} className="text-orange-500" /> {t('settings.security.securityAlerts')}
                                            </h5>
                                            <div className="space-y-3">
                                                <label className="flex items-center justify-between cursor-pointer group">
                                                    <span className="text-sm text-slate-600 group-hover:text-slate-900">{t('settings.security.emailAlertNewDevice')}</span>
                                                    <input
                                                        type="checkbox"
                                                        checked={loginAlerts.email}
                                                        onChange={(e) => handleAlertsChange({ ...loginAlerts, email: e.target.checked })}
                                                        className="accent-primary size-4"
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Profile Management Column */}
                                <div className="space-y-6">
                                    <SectionHeader title={t('settings.security.profileRoles')} icon={<Users size={20} className="text-primary" />} />

                                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                        <h4 className="font-bold text-slate-900 mb-4">{t('settings.security.whoManages')}</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                                            {availableModes.length > 0 ? availableModes.map((mode) => (
                                                <RoleOption
                                                    key={mode.id}
                                                    label={mode.label}
                                                    desc={mode.description}
                                                    selected={managementMode === mode.id}
                                                    onClick={() => handleManagementMode(mode.id)}
                                                />
                                            )) : (
                                                <>
                                                    <RoleOption
                                                        label={t('settings.security.selfManaged')}
                                                        desc={t('settings.security.selfManagedDesc')}
                                                        selected={managementMode === 'self'}
                                                        onClick={() => handleManagementMode('self')}
                                                    />
                                                    <RoleOption
                                                        label={t('settings.security.familyManaged')}
                                                        desc={t('settings.security.familyManagedDesc')}
                                                        selected={managementMode === 'family'}
                                                        onClick={() => handleManagementMode('family')}
                                                    />
                                                    <RoleOption
                                                        label={t('settings.security.matchmaker')}
                                                        desc={t('settings.security.matchmakerDesc')}
                                                        selected={managementMode === 'matchmaker'}
                                                        onClick={() => handleManagementMode('matchmaker')}
                                                    />
                                                    <RoleOption
                                                        label={t('settings.security.dualControl')}
                                                        desc={t('settings.security.dualControlDesc')}
                                                        selected={managementMode === 'dual'}
                                                        onClick={() => handleManagementMode('dual')}
                                                    />
                                                </>
                                            )}
                                        </div>

                                        <div className="border-t border-slate-100 pt-6">
                                            <h4 className="font-bold text-slate-900 mb-3">{t('settings.security.ownershipControls')}</h4>
                                            {pendingTransfer ? (
                                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-900">{t('settings.security.transferPending')}</p>
                                                            <p className="text-xs text-slate-500">
                                                                To {pendingTransfer.to_name || t('settings.security.newOwner')} {pendingTransfer.to_email ? `(${pendingTransfer.to_email})` : ''}
                                                            </p>
                                                            {pendingTransfer.reason && (
                                                                <p className="text-xs text-slate-500 mt-1">{t('settings.security.reason')}: {pendingTransfer.reason}</p>
                                                            )}
                                                            <p className="text-xs text-slate-400 mt-1">
                                                                {t('settings.security.expiresInDays', { n: pendingTransfer.days_remaining ?? 0 })}
                                                            </p>
                                                        </div>
                                                        <span className="text-[10px] font-bold bg-orange-100 text-orange-700 px-2 py-1 rounded-full">{t('settings.security.pending')}</span>
                                                    </div>
                                                    <button onClick={handleCancelTransfer} className="text-xs font-bold text-red-600 hover:underline">
                                                        {t('settings.security.cancelTransfer')}
                                                    </button>
                                                </div>
                                            ) : showTransferForm ? (
                                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="block text-xs font-bold text-slate-700 mb-1">{t('settings.security.newOwnerName')}</label>
                                                            <input
                                                                type="text"
                                                                value={transferForm.to_name}
                                                                onChange={(e) => setTransferForm((prev) => ({ ...prev, to_name: e.target.value }))}
                                                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-bold text-slate-700 mb-1">{t('settings.security.emailOptional')} <span className="ml-1 text-[10px] font-semibold text-pink-600 bg-pink-100 px-2 py-0.5 rounded-full">Optional</span></label>
                                                            <input
                                                                type="email"
                                                                value={transferForm.to_email}
                                                                onChange={(e) => setTransferForm((prev) => ({ ...prev, to_email: e.target.value }))}
                                                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-bold text-slate-700 mb-1">{t('settings.security.phoneOptional')} <span className="ml-1 text-[10px] font-semibold text-pink-600 bg-pink-100 px-2 py-0.5 rounded-full">Optional</span></label>
                                                            <div className="flex items-stretch bg-white border border-slate-300 rounded-lg focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all overflow-hidden">
                                                                <CountryCodeSelector
                                                                    selectedCountry={transferCountry}
                                                                    onSelect={setTransferCountry}
                                                                    variant="simple"
                                                                />
                                                                <input
                                                                    type="tel"
                                                                    value={transferForm.to_phone.startsWith(transferCountry.dialCode) ? transferForm.to_phone.slice(transferCountry.dialCode.length) : transferForm.to_phone.replace(/^\+\d+/, '')}
                                                                    onChange={(e) => handleTransferPhoneChange(e.target.value)}
                                                                    className="flex-1 bg-transparent px-3 py-2 text-sm outline-none"
                                                                    placeholder={t('settings.security.phoneNumber')}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="sm:col-span-2">
                                                            <label className="block text-xs font-bold text-slate-700 mb-1">{t('settings.security.reasonOptional')} <span className="ml-1 text-[10px] font-semibold text-pink-600 bg-pink-100 px-2 py-0.5 rounded-full">Optional</span></label>
                                                            <textarea
                                                                value={transferForm.reason}
                                                                onChange={(e) => setTransferForm((prev) => ({ ...prev, reason: e.target.value }))}
                                                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                                                                rows={2}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        <button
                                                            onClick={handleInitiateTransfer}
                                                            disabled={transferSubmitting || !transferForm.to_name.trim() || (!transferForm.to_email.trim() && !transferForm.to_phone.trim())}
                                                            className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 disabled:opacity-60"
                                                        >
                                                            {transferSubmitting ? t('settings.security.sending') : t('settings.security.sendTransferInvite')}
                                                        </button>
                                                        <button onClick={() => setShowTransferForm(false)} className="px-4 py-2 border border-slate-200 text-xs font-bold rounded-lg text-slate-600 hover:bg-slate-50">
                                                            {t('settings.security.cancel')}
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setShowTransferForm(true)}
                                                    className="w-full flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-8 bg-slate-100 rounded-full flex items-center justify-center">
                                                            <Users size={16} className="text-slate-600" />
                                                        </div>
                                                        <div className="text-left">
                                                            <p className="text-sm font-bold text-slate-800">{t('settings.security.transferOwnership')}</p>
                                                            <p className="text-xs text-slate-500">{t('settings.security.transferOwnershipDesc')}</p>
                                                        </div>
                                                    </div>
                                                    <ChevronRight size={18} className="text-slate-400 group-hover:text-slate-600" />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className={`rounded-xl shadow-sm border p-6 transition-colors ${!is2FAEnabled ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-200'}`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-bold text-slate-900 flex items-center gap-2">
                                                {t('settings.security.twoFactor')}
                                                {!is2FAEnabled ? (
                                                    <span className="bg-orange-200 text-orange-800 text-[10px] px-2 py-0.5 rounded-full font-bold">{t('settings.security.recommended')}</span>
                                                ) : (
                                                    <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><Check size={10} /> {t('settings.security.active')}</span>
                                                )}
                                            </h4>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={is2FAEnabled}
                                                    onChange={() => {
                                                        if (!is2FAEnabled) {
                                                            setTwoFactorMode('setup');
                                                            setShow2FAModal(true);
                                                        } else {
                                                            setStepUpContext({
                                                                purpose: '2fa_disable',
                                                                label: t('settings.security.disable2fa'),
                                                                onVerified: async (token: string) => {
                                                                    await api.delete('/member/account/2fa', {
                                                                        data: { step_up_token: token },
                                                                    });
                                                                    setIs2FAEnabled(false);
                                                                },
                                                            });
                                                        }
                                                    }}
                                                />
                                                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                                            </label>
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            {t('settings.security.twoFactorDesc')}
                                        </p>
                                        {is2FAEnabled && (
                                            <div className="mt-4 flex gap-2">
                                                <button onClick={() => { setTwoFactorMode('setup'); setShow2FAModal(true); }} className="text-xs font-bold text-primary hover:underline">{t('settings.security.reconfigure')}</button>
                                                <span className="text-slate-300">|</span>
                                                <button onClick={() => { setTwoFactorMode('recovery'); setShow2FAModal(true); }} className="text-xs font-bold text-slate-500 hover:text-slate-800">{t('settings.security.viewBackupCodes')}</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    )}

                    {
                        activeTab === 'billing' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4">
                                <div className="space-y-6">
                                    <SectionHeader title={t('settings.billing.membershipPlan')} icon={<CreditCard size={20} className="text-primary" />} />

                                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                        <div className="p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white relative overflow-hidden">
                                            <div className="relative z-10">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <p className="text-xs font-bold opacity-70 uppercase tracking-wider">{t('settings.billing.currentPlan')}</p>
                                                        <h3 className="text-2xl font-bold flex items-center gap-2">{packageDetails?.name ?? t('settings.billing.basicMember')}</h3>
                                                    </div>
                                                    <div className="bg-white/20 p-2 rounded-lg">
                                                        <UserX size={24} className="text-white" />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    {packageDetails ? (
                                                        <>
                                                            <div className="flex items-center gap-2 text-sm text-slate-300">
                                                                <Check size={14} className="text-green-400" /> {packageDetails.express_interest ?? 0} {t('settings.billing.expressInterests')}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-sm text-slate-300">
                                                                <Check size={14} className="text-green-400" /> {packageDetails.contact ?? 0} {t('settings.billing.contactViews')}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-sm text-slate-300">
                                                                <Check size={14} className="text-green-400" /> {packageDetails.photo_gallery ?? 0} {t('settings.billing.photoGalleryViews')}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="flex items-center gap-2 text-sm text-slate-300">
                                                                <Check size={14} className="text-green-400" /> {t('settings.billing.limitedProfileViews')}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-sm text-slate-300">
                                                                <Check size={14} className="text-green-400" /> {t('settings.billing.noDirectMessaging')}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="absolute -right-6 -bottom-6 text-white/5">
                                                <CreditCard size={150} />
                                            </div>
                                        </div>
                                        <div className="p-6 bg-white">
                                            <div className="flex items-center justify-between mb-4 text-sm text-slate-600">
                                                <span>
                                                    {packageDetails?.validity ? (
                                                        <>Validity: <b>{t('settings.billing.validityDays', { n: packageDetails.validity })}</b></>
                                                    ) : (
                                                        <>{t('settings.billing.renewsFreeForever')}</>
                                                    )}
                                                </span>
                                                <span className="text-green-600 font-bold">{t('settings.security.active')}</span>
                                            </div>
                                            <button
                                                onClick={onOpenBilling}
                                                className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover shadow-lg transition-all flex items-center justify-center gap-2"
                                            >
                                                <Zap size={18} fill="currentColor" /> {t('settings.billing.upgradePremium')}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                        <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                            <Receipt size={18} className="text-slate-500" /> {t('settings.billing.invoiceHistory')}
                                        </h4>
                                        <div className="space-y-3">
                                            {purchaseHistory.length > 0 ? (
                                                purchaseHistory.map((invoice) => (
                                                    <div key={invoice.package_payment_id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm">
                                                        <div>
                                                            <p className="font-bold text-slate-900">{t('settings.billing.invoice')} #{invoice.payment_code}</p>
                                                            <p className="text-xs text-slate-500">{invoice.date}</p>
                                                            <p className="text-xs text-slate-400">{invoice.package_name} • {invoice.payment_method}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-bold text-slate-900">{invoice.amount}</p>
                                                            <span className={`text-xs font-bold ${invoice.payment_status === 'Paid' ? 'text-green-600' : 'text-orange-600'}`}>
                                                                {invoice.payment_status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-center text-xs text-slate-400 pt-2">{t('settings.billing.noTransactions')}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                        <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                            <ShieldCheck size={18} className="text-slate-500" /> {t('settings.billing.addonPurchases')}
                                        </h4>
                                        <div className="space-y-3">
                                            {addonPurchaseHistory.length > 0 ? (
                                                addonPurchaseHistory.map((purchase) => (
                                                    <div key={purchase.addon_purchase_id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm">
                                                        <div>
                                                            <p className="font-bold text-slate-900">{t('settings.billing.invoice')} #{purchase.payment_code}</p>
                                                            <p className="text-xs text-slate-500">{purchase.date}</p>
                                                            <p className="text-xs text-slate-400">{purchase.addon_name ?? t('settings.billing.addon')} • {purchase.payment_method}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-bold text-slate-900">{purchase.amount}</p>
                                                            <span className={`text-xs font-bold ${purchase.payment_status === 'Paid' ? 'text-green-600' : 'text-orange-600'}`}>
                                                                {purchase.payment_status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-center text-xs text-slate-400 pt-2">{t('settings.billing.noAddons')}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {/* Available Plans Section */}
                                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                        <SectionHeader title={t('settings.billing.availablePlans')} icon={<Star size={20} className="text-primary" />} />
                                        <div className="space-y-4 max-h-[500px] overflow-y-auto scrollbar-hide pr-1">
                                            {availablePackages.length > 0 ? (
                                                availablePackages.map((pkg) => (
                                                    <div key={pkg.package_id} className="border border-slate-200 rounded-xl p-4 hover:border-primary/50 transition-colors relative overflow-hidden group">
                                                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                                            <Star size={64} className="text-primary" />
                                                        </div>
                                                        <div className="relative z-10">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <div>
                                                                    <h4 className="font-bold text-slate-900 text-lg">{pkg.name}</h4>
                                                                    <p className="text-xs text-slate-500">{t('settings.billing.validForDays', { n: pkg.package_active_days })}</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <span className="block text-xl font-bold text-primary">{pkg.package_price}</span>
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-2 my-3">
                                                                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                                                    <Check size={12} className="text-green-500" />
                                                                    <span>{pkg.express_interest} {t('settings.billing.interests')}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                                                    <Check size={12} className="text-green-500" />
                                                                    <span>{pkg.contact} {t('settings.billing.contacts')}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                                                    <Check size={12} className="text-green-500" />
                                                                    <span>{pkg.photo_gallery} {t('settings.billing.galleryViews')}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                                                    <Check size={12} className="text-green-500" />
                                                                    <span>{t('settings.billing.profileBadge')}</span>
                                                                </div>
                                                            </div>

                                                            <button
                                                                onClick={() => onSelectPlan?.(pkg.package_id, pkg.name, parseFloat(pkg.package_price))}
                                                                className="w-full py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                                                            >
                                                                {t('settings.billing.choosePlan')} <ChevronRight size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-8 text-slate-400">
                                                    <Loader2 size={24} className="animate-spin mx-auto mb-2" />
                                                    <p className="text-xs">{t('settings.billing.loadingPlans')}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <SectionHeader title={t('settings.billing.paymentMethods')} icon={<WalletIcon className="text-primary" />} />

                                    {paymentMethods.length > 0 ? (
                                        <div className="space-y-3">
                                            {paymentMethods.map((method) => (
                                                <div key={method.payment_type_key || method.payment_type} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                                                    <div className="size-10 bg-slate-50 rounded-full flex items-center justify-center overflow-hidden border border-slate-100">
                                                        {method.image ? (
                                                            <img src={method.image} alt={method.name} className="size-8 object-contain" />
                                                        ) : (
                                                            <CreditCard size={18} className="text-slate-400" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900">{method.name}</p>
                                                        <p className="text-xs text-slate-500">{method.title}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center text-center min-h-[150px]">
                                            <div className="size-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-3">
                                                <CreditCard size={24} />
                                            </div>
                                            <h4 className="font-bold text-slate-900 text-sm">{t('settings.billing.noPaymentMethods')}</h4>
                                            <p className="text-xs text-slate-500 mb-0 max-w-xs">{t('settings.billing.enableGateway')}</p>
                                        </div>
                                    )}

                                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3">
                                        <Gift size={20} className="text-blue-600 shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="font-bold text-blue-900 text-sm">{t('settings.billing.haveGiftCode')}</h4>
                                            <p className="text-xs text-blue-700 mb-2">{t('settings.billing.redeemOffers')}</p>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder={t('settings.billing.enterCode')}
                                                    value={couponInput}
                                                    onChange={(e) => setCouponInput(e.target.value)}
                                                    className="px-3 py-1.5 rounded-lg border border-blue-200 text-xs w-full focus:outline-none focus:border-blue-400"
                                                />
                                                <button
                                                    onClick={handleApplyCoupon}
                                                    disabled={couponStatus === 'loading' || !couponInput.trim()}
                                                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 disabled:opacity-70"
                                                >
                                                    {couponStatus === 'loading' ? t('settings.billing.applying') : t('settings.billing.apply')}
                                                </button>
                                            </div>
                                            {couponMessage && (
                                                <p className={`text-[11px] mt-2 ${couponStatus === 'error' ? 'text-red-600' : 'text-green-700'}`}>
                                                    {couponMessage}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    }

                    {
                        activeTab === 'privacy' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4">
                                <div className="space-y-6">
                                    <SectionHeader title={t('settings.privacy.visibilitySettings')} icon={<Eye size={20} className="text-primary" />} />

                                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                                {visibilityStatus === 'saving' && t('settings.privacy.saving')}
                                                {visibilityStatus === 'saved' && t('settings.privacy.saved')}
                                                {visibilityStatus === 'error' && t('settings.privacy.saveFailed')}
                                                {visibilityStatus === 'idle' && t('settings.privacy.liveSync')}
                                            </p>
                                            {visibilityStatusMessage && (
                                                <p className={`text-xs font-medium ${
                                                    visibilityStatus === 'error' ? 'text-red-600' : 'text-emerald-600'
                                                }`}>
                                                    {visibilityStatusMessage}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="font-bold text-slate-900">{t('settings.privacy.profileStatus')}</h4>
                                                <p className="text-xs text-slate-500">{t('settings.privacy.profileStatusDesc')}</p>
                                            </div>
                                            <label className={`relative inline-flex items-center ${visibilitySavingKey ? 'cursor-wait opacity-70' : 'cursor-pointer'}`}>
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={profileVisible}
                                                    disabled={visibilitySavingKey !== null}
                                                    onChange={(e) => updateVisibilitySetting('profile_visible', e.target.checked)}
                                                />
                                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                            </label>
                                        </div>

                                        <hr className="border-slate-100" />

                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold text-slate-900">{t('settings.privacy.incognitoMode')}</h4>
                                                    <span className="bg-yellow-100 text-yellow-800 text-[10px] font-bold px-2 py-0.5 rounded">{t('settings.privacy.premium')}</span>
                                                </div>
                                                <p className="text-xs text-slate-500">{t('settings.privacy.incognitoDesc')}</p>
                                            </div>
                                            <label className={`relative inline-flex items-center ${visibilitySavingKey ? 'cursor-wait opacity-70' : 'cursor-pointer'}`}>
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={incognito}
                                                    disabled={visibilitySavingKey !== null}
                                                    onChange={(e) => {
                                                        const next = e.target.checked;
                                                        setIncognito(next);
                                                        updateVisibilitySetting('incognito', next);
                                                    }}
                                                />
                                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                                            </label>
                                        </div>

                                        <hr className="border-slate-100" />

                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="font-bold text-slate-900">{t('settings.privacy.screenshotDeterrence')}</h4>
                                                <p className="text-xs text-slate-500">{t('settings.privacy.screenshotDesc')}</p>
                                            </div>
                                            <label className={`relative inline-flex items-center ${visibilitySavingKey ? 'cursor-wait opacity-70' : 'cursor-pointer'}`}>
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={watermark}
                                                    disabled={visibilitySavingKey !== null}
                                                    onChange={(e) => {
                                                        const next = e.target.checked;
                                                        setWatermark(next);
                                                        updateVisibilitySetting('screenshot_deterrence', next);
                                                    }}
                                                />
                                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                                            </label>
                                        </div>

                                        <hr className="border-slate-100" />

                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="font-bold text-slate-900">{t('settings.privacy.blurProfilePicture')}</h4>
                                                <p className="text-xs text-slate-500">{t('settings.privacy.blurProfilePictureDesc')}</p>
                                            </div>
                                            <label className={`relative inline-flex items-center ${visibilitySavingKey ? 'cursor-wait opacity-70' : 'cursor-pointer'}`}>
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={profilePhotoBlur}
                                                    disabled={visibilitySavingKey !== null}
                                                    onChange={(e) => {
                                                        const next = e.target.checked;
                                                        setProfilePhotoBlur(next);
                                                        updateVisibilitySetting('profile_photo_blur', next);
                                                    }}
                                                />
                                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                                            </label>
                                        </div>

                                        <hr className="border-slate-100" />

                                        <div>
                                            <h4 className="font-bold text-slate-900 mb-3">{t('settings.privacy.whoCanSeePhotos')}</h4>
                                            <div className="space-y-3">
                                                {['everyone', 'members', 'requests'].map((opt) => (
                                                    <label key={opt} className={`flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors ${visibilitySavingKey ? 'cursor-wait opacity-70' : 'cursor-pointer'}`}>
                                                        <input
                                                            type="radio"
                                                            name="photoVisibility"
                                                            className="accent-primary size-4"
                                                            checked={photoVisibility === opt}
                                                            disabled={visibilitySavingKey !== null}
                                                            onChange={() => handlePhotoVisibilityChange(opt as 'everyone' | 'members' | 'requests')}
                                                        />
                                                        <span className="text-sm text-slate-700 capitalize">
                                                            {opt === 'everyone' ? t('settings.privacy.publicAllVisitors') : opt === 'members' ? t('settings.privacy.registeredMembersOnly') : t('settings.privacy.onlyOnRequest')}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <SectionHeader title={t('settings.privacy.dataBlocking')} icon={<Lock size={20} className="text-primary" />} />

                                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                        <h4 className="font-bold text-slate-900 mb-4 flex items-center justify-between">
                                            {t('settings.privacy.blockedUsers')}
                                            <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-full">{blockedUsers.length}</span>
                                        </h4>
                                        <div className="space-y-3 mb-4">
                                            {blockedUsers.length > 0 ? (
                                                blockedUsers.map((user) => (
                                                    <div key={user.user_id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                                        <div className="flex items-center gap-3">
                                                            <div className="size-8 bg-slate-200 rounded-full overflow-hidden">
                                                                {user.photo ? (
                                                                    <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
                                                                ) : null}
                                                            </div>
                                                            <span className="text-sm font-bold text-slate-700">{user.name}</span>
                                                        </div>
                                                        <button onClick={() => handleUnblockUser(user.user_id)} className="text-xs font-bold text-red-600 hover:underline">
                                                            {t('settings.privacy.unblock')}
                                                        </button>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-xs text-slate-400">{t('settings.privacy.noBlockedUsers')}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-red-50 border border-red-100 p-6 rounded-xl space-y-4">
                                        <h4 className="font-bold text-red-900">{t('settings.privacy.dangerZone')}</h4>

                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-bold text-red-800 text-sm">{t('settings.privacy.deactivateAccount')}</p>
                                                <p className="text-xs text-red-600/70">{t('settings.privacy.deactivateDesc')}</p>
                                            </div>
                                            <button onClick={handleDeactivateAccount} className="px-3 py-1.5 bg-white border border-red-200 text-red-600 text-xs font-bold rounded hover:bg-red-50">
                                                {t('settings.privacy.deactivate')}
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-red-200/50">
                                            <div>
                                                <p className="font-bold text-red-800 text-sm">{t('settings.privacy.deleteAccount')}</p>
                                                <p className="text-xs text-red-600/70">{t('settings.privacy.deleteDesc')}</p>
                                            </div>
                                            <button onClick={handleDeleteAccount} className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-700">
                                                {t('settings.privacy.delete')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    }

                    {
                        activeTab === 'safety' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4">
                                <div className="lg:col-span-2 space-y-6">
                                    <SectionHeader title={t('settings.safety.identityVerification')} icon={<ShieldCheck size={20} className="text-primary" />} />

                                    <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-8 text-white relative overflow-hidden shadow-xl">
                                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                                            <div className="bg-white/10 p-4 rounded-full backdrop-blur-sm border border-white/20">
                                                <ScanFace size={48} className="text-green-400" />
                                            </div>
                                            <div className="text-center md:text-left">
                                                <h3 className="text-2xl font-bold mb-2">{t('settings.safety.getVerifiedBadge')}</h3>
                                                <p className="text-slate-300 text-sm mb-6 max-w-md">
                                                    {t('settings.safety.verificationDesc')}
                                                </p>
                                                <button
                                                    onClick={() => setShowVerification(true)}
                                                    className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-green-500/30"
                                                >
                                                    {t('settings.safety.startVerification')}
                                                </button>
                                            </div>
                                        </div>
                                        {/* Background decoration */}
                                        <div className="absolute top-0 right-0 -mr-16 -mt-16 size-64 bg-primary/20 rounded-full blur-3xl"></div>
                                    </div>

                                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                        <h4 className="font-bold text-slate-900 mb-6">{t('settings.safety.safetyCenter')}</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <SafetyCard
                                                onClick={() => handleOpenSafetyModal('tips')}
                                                icon={<Umbrella size={24} />}
                                                title={t('settings.safety.safeMarriageTips')}
                                                desc={t('settings.safety.safeMarriageTipsDesc')}
                                            />
                                            <SafetyCard
                                                onClick={() => handleOpenSafetyModal('report')}
                                                icon={<Siren size={24} />}
                                                title={t('settings.safety.reportIncident')}
                                                desc={t('settings.safety.reportIncidentDesc')}
                                            />
                                            <SafetyCard
                                                onClick={() => handleOpenSafetyModal('ghosting')}
                                                icon={<Ghost size={24} />}
                                                title={t('settings.safety.ghostingPolicy')}
                                                desc={t('settings.safety.ghostingPolicyDesc')}
                                            />
                                            <SafetyCard
                                                onClick={() => handleOpenSafetyModal('data')}
                                                icon={<Shield size={24} />}
                                                title={t('settings.safety.dataProtection')}
                                                desc={t('settings.safety.dataProtectionDesc')}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <SectionHeader title={t('settings.safety.communityTrust')} icon={<Star size={20} className="text-primary" />} />

                                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center">
                                        <div className="size-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                                            <ShieldCheck size={32} />
                                        </div>
                                        <h4 className="font-bold text-slate-900 text-lg">{t('settings.safety.trustScore', { score: trustScore })}</h4>
                                        <p className="text-xs text-slate-500 mt-2 mb-6">
                                            {trustLabel}! {t('settings.safety.completeSecuritySteps')}
                                        </p>
                                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-2">
                                            <div className="bg-green-500 h-full rounded-full" style={{ width: `${trustScore}%` }}></div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                                        <h5 className="font-bold text-slate-900 text-sm mb-3">{t('settings.safety.reportingHistory')}</h5>
                                        {tickets.length > 0 ? (
                                            <div className="space-y-2">
                                                {tickets.slice(0, 3).map((ticket: any) => (
                                                    <div key={ticket.id} className="text-left bg-white p-2 rounded border border-slate-100">
                                                        <p className="text-xs font-bold text-slate-800 truncate">{ticket.subject}</p>
                                                        <div className="flex justify-between items-center mt-1">
                                                            <span className="text-[10px] text-slate-400">{ticket.created_at}</span>
                                                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${ticket.status === 'Open' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                                                {ticket.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                                {tickets.length > 3 && (
                                                    <p className="text-[10px] text-center text-slate-400">{t('settings.safety.moreTickets', { n: tickets.length - 3 })}</p>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-center py-6 text-slate-400">
                                                <CheckCircleIcon className="mx-auto mb-2 opacity-50" />
                                                <p className="text-xs">{t('settings.safety.noReports')}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    }

                </div >
            </div >

            {showVerification && <VerificationModal onClose={() => setShowVerification(false)} />}
            {
                stepUpContext && (
                    <StepUpVerificationModal
                        purpose={stepUpContext.purpose}
                        actionLabel={stepUpContext.label}
                        onCancel={() => setStepUpContext(null)}
                        onVerified={async (token) => {
                            await stepUpContext.onVerified(token);
                            setStepUpContext(null);
                        }}
                    />
                )
            }
            {
                show2FAModal && (
                    <TwoFactorSetupModal
                        onClose={() => setShow2FAModal(false)}
                        mode={twoFactorMode}
                        onComplete={() => {
                            setIs2FAEnabled(true);
                            setShow2FAModal(false);
                            setTwoFactorMode('setup');
                        }}
                    />
                )
            }
            {
                showSafetyModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-slate-900">{safetyModalContent?.title}</h3>
                                <button onClick={() => setShowSafetyModal(false)} className="text-slate-400 hover:text-slate-600">
                                    <span className="sr-only">{t('settings.safety.close')}</span>
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            {safetyModalContent?.content === 'form' ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">{t('settings.safety.subject')}</label>
                                        <input
                                            type="text"
                                            value={reportSubject}
                                            onChange={(e) => setReportSubject(e.target.value)}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none"
                                            placeholder={t('settings.safety.subjectPlaceholder')}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">{t('settings.safety.details')}</label>
                                        <textarea
                                            value={reportDescription}
                                            onChange={(e) => setReportDescription(e.target.value)}
                                            rows={4}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none"
                                            placeholder={t('settings.safety.detailsPlaceholder')}
                                        />
                                    </div>
                                    <button
                                        onClick={handleSubmitReport}
                                        disabled={reportSubmitting || !reportSubject || !reportDescription}
                                        className="w-full py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-50 flex justify-center"
                                    >
                                        {reportSubmitting ? <Loader2 size={18} className="animate-spin" /> : t('settings.safety.submitReport')}
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    {safetyModalContent?.content}
                                    <button onClick={() => setShowSafetyModal(false)} className="mt-6 w-full py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200">{t('settings.safety.close')}</button>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }
        </div >
    );
};

const SectionHeader: React.FC<{ title: string, icon: React.ReactNode }> = ({ title, icon }) => (
    <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60 mb-2">
        {icon}
        <h3 className="font-bold text-slate-800 uppercase tracking-wide text-sm">{title}</h3>
    </div>
);

const RoleOption: React.FC<{ label: string, desc: string, selected: boolean, onClick: () => void }> = ({ label, desc, selected, onClick }) => (
    <div
        onClick={onClick}
        className={`
            p-3 rounded-lg border cursor-pointer transition-all
            ${selected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-slate-200 hover:border-slate-300'}
        `}
    >
        <div className="flex items-center justify-between mb-1">
            <span className={`text-sm font-bold ${selected ? 'text-primary' : 'text-slate-800'}`}>{label}</span>
            {selected && <Check size={14} className="text-primary" />}
        </div>
        <p className="text-xs text-slate-500">{desc}</p>
    </div>
);

const SafetyCard: React.FC<{ icon: React.ReactNode, title: string, desc: string, onClick?: () => void }> = ({ icon, title, desc, onClick }) => (
    <div onClick={onClick} className="p-4 border border-slate-100 rounded-xl hover:shadow-md hover:border-primary/20 transition-all cursor-pointer group">
        <div className="text-slate-400 group-hover:text-primary mb-3 transition-colors">{icon}</div>
        <h5 className="font-bold text-slate-900 text-sm mb-1">{title}</h5>
        <p className="text-xs text-slate-500">{desc}</p>
    </div>
);

const WalletIcon = ({ className }: { className?: string }) => <svg className={`w-5 h-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
const CheckCircleIcon = ({ className }: { className?: string }) => <svg className={`w-8 h-8 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

export default SettingsView;



