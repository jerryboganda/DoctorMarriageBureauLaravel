import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, ShieldCheck, Mail, Smartphone, Loader2, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../utils/api';

interface CredentialVerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'email' | 'phone';
    value: string; // The email or phone to verify
    onVerified: () => void;
}

const CredentialVerificationModal: React.FC<CredentialVerificationModalProps> = ({
    isOpen, onClose, type, value, onVerified
}) => {
    const { t } = useTranslation();
    const [step, setStep] = useState<'send' | 'verify' | 'success'>('send');
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [contactValue, setContactValue] = useState(value);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setStep('send');
            setCode('');
            setError(null);
            setLoading(false);
            setContactValue(value);
        }
    }, [isOpen, type, value]);

    if (!isOpen) return null;

    const handleSendCode = async () => {
        setLoading(true);
        setError(null);
        try {
            const endpoint = type === 'email'
                ? '/send-email-verification'
                : '/send-phone-verification';

            const payload = type === 'email' ? { email: contactValue } : { phone: contactValue };

            await api.post(endpoint, payload);
            setStep('verify');
        } catch (err: any) {
            setError(err.response?.data?.message || t('errors.failedSendVerification'));
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async () => {
        if (code.length < 6) {
            setError(t('errors.pleaseEnterSixDigitCode'));
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const endpoint = type === 'email'
                ? '/verify-email-code'
                : '/verify-phone-code';

            const payload = type === 'email'
                ? { email: contactValue, code }
                : { phone: contactValue, code };

            const response = await api.post(endpoint, payload);

            if (response.data?.success || response.data?.result) {
                setStep('success');
                setTimeout(() => {
                    onVerified();
                    onClose();
                }, 2000);
            } else {
                setError(response.data?.message || t('errors.verificationFailed'));
            }
        } catch (err: any) {
            setError(err.response?.data?.message || t('errors.invalidVerificationCode'));
        } finally {
            setLoading(false);
        }
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <ShieldCheck className="text-primary" size={20} />
                        {type === 'email' ? t('modals.credentialVerification.verifyEmail') : t('modals.credentialVerification.verifyPhone')}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="p-6">
                    {/* Content based on step */}
                    {step === 'send' && (
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <div className="text-center space-y-2">
                                    <div className="size-16 bg-blue-50 text-primary rounded-full flex items-center justify-center mx-auto">
                                        {type === 'email' ? <Mail size={32} /> : <Smartphone size={32} />}
                                    </div>
                                    <h4 className="font-bold text-slate-900 text-lg">
                                        {t('modals.credentialVerification.confirmDetail')}
                                    </h4>
                                    <p className="text-sm text-slate-500">
                                        {t('modals.credentialVerification.sendCodeDesc')}
                                    </p>
                                </div>

                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">
                                        {type === 'email' ? t('modals.credentialVerification.emailLabel') : t('modals.credentialVerification.phoneLabel')}
                                    </label>
                                    <input
                                        type={type === 'email' ? 'email' : 'tel'}
                                        value={contactValue}
                                        onChange={(e) => setContactValue(e.target.value)}
                                        className="w-full bg-transparent font-bold text-slate-900 outline-none text-lg"
                                        placeholder={type === 'email' ? t('modals.credentialVerification.emailPlaceholder') : t('modals.credentialVerification.phonePlaceholder')}
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-start gap-2">
                                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleSendCode}
                                disabled={loading || !contactValue}
                                className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                            >
                                {loading ? <Loader2 className="animate-spin" size={18} /> : null}
                                {loading ? t('modals.credentialVerification.sendingCode') : t('modals.credentialVerification.sendVerificationCode')}
                            </button>
                        </div>
                    )}

                    {step === 'verify' && (
                        <div className="space-y-6">
                            <div className="text-center space-y-2">
                                <h4 className="font-bold text-slate-900 text-lg">{t('modals.credentialVerification.enterOTP')}</h4>
                                <p className="text-sm text-slate-500">
                                    {t('modals.credentialVerification.enterCodeSentTo', { contact: contactValue })}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <input
                                    type="text"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                                    className="w-full text-center text-3xl font-bold tracking-[1em] border border-slate-300 rounded-xl py-4 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:tracking-normal"
                                    placeholder="••••••"
                                    maxLength={6}
                                    autoFocus
                                />
                                <div className="flex justify-between text-xs px-1">
                                    <span className="text-slate-400">{t('modals.credentialVerification.usuallyArrives')}</span>
                                    <button
                                        onClick={handleSendCode}
                                        disabled={loading}
                                        className="text-primary font-bold hover:underline disabled:opacity-50"
                                    >
                                        {t('modals.credentialVerification.resendCode')}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-start gap-2">
                                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleVerifyCode}
                                disabled={loading || code.length !== 6}
                                className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
                            >
                                {loading ? <Loader2 className="animate-spin" size={18} /> : <ArrowRight size={18} />}
                                {loading ? t('modals.credentialVerification.verifying') : t('modals.credentialVerification.verifyAndContinue')}
                            </button>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="text-center space-y-4 py-8 animate-in zoom-in duration-300">
                            <div className="size-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle2 size={40} />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 text-xl">{t('modals.credentialVerification.verified')}</h4>
                                <p className="text-slate-500 mt-1">{type === 'email' ? t('modals.credentialVerification.successEmail') : t('modals.credentialVerification.successPhone')}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CredentialVerificationModal;
