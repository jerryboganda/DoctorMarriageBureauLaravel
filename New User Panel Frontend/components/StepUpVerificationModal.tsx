import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Lock, Loader2, X } from 'lucide-react';
import { api } from '../utils/api';
import PasswordField from './PasswordField';

type StepUpPurpose = 'ownership_transfer' | '2fa_disable' | 'account_delete' | 'password_change';

interface StepUpVerificationModalProps {
    purpose: StepUpPurpose;
    actionLabel: string;
    onVerified: (token: string) => Promise<void> | void;
    onCancel: () => void;
}

const StepUpVerificationModal: React.FC<StepUpVerificationModalProps> = ({
    purpose,
    actionLabel,
    onVerified,
    onCancel,
}) => {
    const { t } = useTranslation();
    const [step, setStep] = useState<'loading' | 'password' | 'otp'>('loading');
    const [token, setToken] = useState<string | null>(null);
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        let isActive = true;

        const initiate = async () => {
            try {
                setStep('loading');
                const response = await api.post('/member/account/step-up/initiate', { purpose });
                if (!isActive) return;
                setToken(response.data?.data?.token ?? response.data?.token ?? null);
                setStep('password');
            } catch (err: any) {
                if (!isActive) return;
                setError(err.response?.data?.message || t('errors.failedStartVerification'));
            }
        };

        initiate();

        return () => {
            isActive = false;
        };
    }, [purpose]);

    const handleVerifyPassword = async () => {
        if (!token || !password) return;
        try {
            setSubmitting(true);
            setError(null);
            await api.post('/member/account/step-up/verify-password', { token, password });
            setStep('otp');
        } catch (err: any) {
            setError(err.response?.data?.message || t('errors.passwordVerificationFailed'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!token || otp.length < 6) return;
        try {
            setSubmitting(true);
            setError(null);
            await api.post('/member/account/step-up/verify-otp', { token, otp });
            await onVerified(token);
        } catch (err: any) {
            setError(err.response?.data?.message || t('errors.otpVerificationFailed'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 text-center border-b border-slate-100 relative">
                    <button
                        onClick={onCancel}
                        className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
                    >
                        <X size={18} />
                    </button>
                    <div className="size-14 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock size={28} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">
                        {t('modals.stepUp.securityVerification')}
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        {t('modals.stepUp.verifyIdentity', { actionLabel })}
                    </p>
                </div>

                <div className="p-6 space-y-4">
                    {step === 'loading' && (
                        <div className="flex items-center justify-center py-8 text-slate-500">
                            <Loader2 size={24} className="animate-spin" />
                        </div>
                    )}

                    {step === 'password' && (
                        <>
                            <PasswordField
                                label={t('modals.stepUp.accountPassword')}
                                autoFocus
                                placeholder={t('modals.stepUp.enterPassword')}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                inputClassName="border border-slate-300 rounded-xl py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
                                containerClassName="space-y-0"
                                labelClassName="block text-xs font-bold text-slate-700 mb-2"
                            />
                            {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
                            <button
                                onClick={handleVerifyPassword}
                                disabled={submitting || password.length < 4}
                                className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {submitting
                                    ? t('modals.stepUp.verifying')
                                    : t('modals.stepUp.continue')}
                            </button>
                        </>
                    )}

                    {step === 'otp' && (
                        <>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-2">
                                    {t('modals.stepUp.verificationCode')}
                                </label>
                                <input
                                    type="text"
                                    className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-center tracking-widest focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
                                    placeholder={t('modals.stepUp.otpPlaceholder')}
                                    value={otp}
                                    onChange={(e) =>
                                        setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                                    }
                                />
                            </div>
                            {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
                            <button
                                onClick={handleVerifyOtp}
                                disabled={submitting || otp.length < 6}
                                className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {submitting
                                    ? t('modals.stepUp.verifying')
                                    : t('modals.stepUp.confirm')}
                            </button>
                            <button
                                onClick={() => setStep('password')}
                                className="w-full text-sm text-slate-500 hover:text-slate-800"
                            >
                                {t('modals.stepUp.backToPassword')}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StepUpVerificationModal;
