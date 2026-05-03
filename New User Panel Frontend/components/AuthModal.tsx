import React, { useState, useEffect, useRef } from 'react';
import {
    X, ShieldCheck, ArrowRight, Lock,
    Users, User, Briefcase, AlertCircle, Clock, Monitor, ShieldAlert,
    Key, ChevronLeft, Shield, HelpCircle, MessageCircle
} from 'lucide-react';
import { api } from '../utils/api';
import { useAuthStore } from '../src/stores/authStore';
import PasswordField from './PasswordField';
import PasswordResetModal from './PasswordResetModal';
import { useGoogleLogin } from '@react-oauth/google';
import FacebookLogin from '@greatsumini/react-facebook-login';
import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AuthModalProps {
    onClose: () => void;
    onLogin: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose, onLogin }) => {
    const { t } = useTranslation();
    const { setUser } = useAuthStore();
    const [step, setStep] = useState<'role' | 'input' | 'otp' | 'password' | 'mfa'>('role');
    const [role, setRole] = useState<'candidate' | 'guardian' | 'agent'>('candidate');
    const [identifier, setIdentifier] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [rateLimitTimer, setRateLimitTimer] = useState(0);
    const [failedAttempts, setFailedAttempts] = useState(0);
    const [isLocked, setIsLocked] = useState(false);
    const [trustDevice, setTrustDevice] = useState(false);
    const [showOtpHelp, setShowOtpHelp] = useState(false);
    const [twoFactorToken, setTwoFactorToken] = useState<string | null>(null);
    const [showPasswordReset, setShowPasswordReset] = useState(false);
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const facebookAppId = import.meta.env.VITE_FACEBOOK_APP_ID;
    const isGoogleConfigured = Boolean(googleClientId && googleClientId !== 'YOUR_GOOGLE_CLIENT_ID_PLACEHOLDER');
    const isFacebookConfigured = Boolean(facebookAppId && facebookAppId !== 'YOUR_FB_APP_ID_PLACEHOLDER');

    // Refs
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        let interval: number;
        if (rateLimitTimer > 0) {
            interval = setInterval(() => {
                setRateLimitTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [rateLimitTimer]);

    const handleSocialLogin = async (provider: string, token: string) => {
        // If we're locked, don't allow
        if (isLocked) return;

        // We might need to ask for role if it's a new user?
        // For now, we'll assume the backend handles role assignment or we pass the current selected role?
        // The backend socialLogin logic creates a user. 
        // We should pass the role if possible, but the current backend endpoint implementation 
        // doesn't seem to explicitly look for 'role' in the request, 
        // it defaults or uses what's in the user record.
        // However, for consistency, let's just log them in.

        try {
            const response = await api.post('/social-login', {
                social_provider: provider,
                access_token: token,
                role: role // Best effort passing role
            });
            if (response.data.result) {
                const { user, access_token } = response.data;
                localStorage.setItem('auth_token', access_token);
                setUser(user);
                onLogin();
                onClose();
            } else {
                setError(response.data.message || 'Social login failed');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Social login failed');
        }
    };

    const googleLogin = useGoogleLogin({
        onSuccess: tokenResponse => handleSocialLogin('google', tokenResponse.access_token),
        onError: () => setError('Google Login Failed'),
    });

    const handleIdentifierSubmit = () => {
        if (!identifier.includes('@')) {
            setError('Please enter a valid email address');
            return;
        }
        setError('');
        setStep('password');
    };

    const handleLogin = async () => {
        if (isLocked) return;

        const code = otp.join('');
        if (code.length !== 6) {
            setError('Please enter the 6-digit code.');
            return;
        }

        if (step === 'mfa' && twoFactorToken) {
            try {
                setError('');
                const response = await api.post('/auth/2fa/challenge', {
                    two_factor_token: twoFactorToken,
                    code,
                });

                const accessToken = response.data?.access_token;
                if (response.data?.success && accessToken) {
                    localStorage.setItem('auth_token', accessToken);
                    const userResponse = await api.get('/user-by-token');
                    const resolvedUser = userResponse.data?.id ? userResponse.data : (userResponse.data?.user ?? null);
                    setUser(resolvedUser);
                    onLogin();
                    onClose();
                    return;
                }
                setError(response.data?.message || 'Two-factor verification failed.');
            } catch (err: any) {
                const responseData = err.response?.data;
                if (responseData?.is_locked) {
                    setIsLocked(true);
                }
                setError(responseData?.message || 'Two-factor verification failed.');
            }
            return;
        }

        setError('Email verification is required. Please sign in with your email and password.');
    };

    const handlePasswordLogin = async () => {
        if (!password) {
            setError('Please enter password');
            return;
        }

        try {
            setError('');
            const response = await api.post('/signin', {
                email_or_phone: identifier,
                password: password,
                identity_matrix: 'member'
            });

            if (response.data?.two_factor_required) {
                setTwoFactorToken(response.data?.two_factor_token ?? null);
                setOtp(['', '', '', '', '', '']);
                setFailedAttempts(0);
                setIsLocked(false);
                setStep('mfa');
                return;
            }

            if (response.data.result) {
                const { user, access_token } = response.data;
                localStorage.setItem('auth_token', access_token);
                setUser(user);
                onLogin();
                onClose();
            } else {
                setError(response.data.message || 'Authentication failed');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Something went wrong during login');
        }
    };

    const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
        const val = e.target.value;
        if (!/^\d*$/.test(val)) return;

        const newOtp = [...otp];
        newOtp[idx] = val.substring(val.length - 1);
        setOtp(newOtp);
        setError('');

        if (val && idx < 5) {
            otpRefs.current[idx + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
        if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
            otpRefs.current[idx - 1]?.focus();
        }
    };

    const getMaskedIdentifier = () => {
        const [name, domain] = identifier.split('@');
        if (!domain) return identifier;
        return `${name.slice(0, 2)}••••••@${domain}`;
    };

    return (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 z-10">
                    <X size={24} />
                </button>

                {/* Branding Header */}
                <div className="bg-slate-50 border-b border-slate-100 p-8 pb-6 text-center">
                    <div className="size-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShieldCheck size={28} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">{t('auth.modal.secureLogin')}</h2>
                    <p className="text-slate-500 text-sm mt-1">{t('auth.modal.trustedMatrimony')}</p>
                </div>

                <div className="p-8">
                    {/* Step 1: Multi-Actor Selection */}
                    {step === 'role' && (
                        <div className="space-y-6 animate-in slide-in-from-right">
                            <div className="text-center mb-4">
                                <h3 className="font-bold text-slate-900">{t('auth.modal.whoIsLoggingIn')}</h3>
                                <p className="text-xs text-slate-500">{t('auth.modal.customizeSecurity')}</p>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                <RoleButton
                                    icon={<User size={20} />}
                                    title={t('auth.modal.candidate')}
                                    desc={t('auth.modal.candidateDesc')}
                                    onClick={() => { setRole('candidate'); setStep('input'); }}
                                />
                                <RoleButton
                                    icon={<Users size={20} />}
                                    title={t('auth.modal.parentGuardian')}
                                    desc={t('auth.modal.parentGuardianDesc')}
                                    onClick={() => { setRole('guardian'); setStep('input'); }}
                                />
                                <RoleButton
                                    icon={<Briefcase size={20} />}
                                    title={t('auth.modal.matchmakerAgent')}
                                    desc={t('auth.modal.matchmakerAgentDesc')}
                                    onClick={() => { setRole('agent'); setStep('input'); }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 2: Regional Readiness Input */}
                    {step === 'input' && (
                        <div className="space-y-6 animate-in slide-in-from-right">
                            <div className="text-center">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                    Login as {role === 'agent' ? t('auth.modal.matchmakerAgent') : role === 'guardian' ? t('auth.modal.parentGuardian') : t('auth.modal.candidate')}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <button
                                    onClick={() => isGoogleConfigured ? googleLogin() : setError(t('auth.modal.socialUnavailable', { provider: t('auth.modal.google') }))}
                                    className={`p-3 border border-slate-200 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors text-xs ${isGoogleConfigured ? 'text-slate-700 hover:bg-slate-50' : 'text-slate-400 bg-slate-50 cursor-not-allowed'}`}
                                    aria-disabled={!isGoogleConfigured}
                                >
                                    <Globe size={16} /> {t('auth.modal.google')}
                                </button>
                                {isFacebookConfigured ? (
                                    <FacebookLogin
                                        appId={facebookAppId}
                                        onSuccess={(response) => {
                                            handleSocialLogin('facebook', response.accessToken);
                                        }}
                                        onFail={() => {
                                            setError(t('auth.modal.socialLoginFailed', { provider: t('auth.modal.facebook') }));
                                        }}
                                        render={({ onClick }) => (
                                            <button
                                                onClick={onClick}
                                                className="p-3 border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors text-xs"
                                            >
                                                <svg viewBox="0 0 24 24" className="size-4" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12c0-5.523-4.477-10-10-10z" /></svg> {t('auth.modal.facebook')}
                                            </button>
                                        )}
                                    />
                                ) : (
                                    <button
                                        onClick={() => setError(t('auth.modal.socialUnavailable', { provider: t('auth.modal.facebook') }))}
                                        className="p-3 border border-slate-200 rounded-xl font-bold text-slate-400 bg-slate-50 flex items-center justify-center gap-2 transition-colors text-xs cursor-not-allowed"
                                        aria-disabled
                                    >
                                        <svg viewBox="0 0 24 24" className="size-4" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12c0-5.523-4.477-10-10-10z" /></svg> {t('auth.modal.facebook')}
                                    </button>
                                )}
                            </div>

                            <div className="relative py-2">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                                <span className="relative bg-white px-2 text-slate-400 text-[10px] font-bold uppercase mx-auto flex w-fit">{t('auth.modal.orUseEmailPhone')}</span>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-2">
                                    {t('auth.modal.emailAddress')}
                                </label>
                                <div className={`relative flex items-stretch border rounded-xl transition-all ${error ? 'border-red-500' : 'border-slate-300 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary'}`}>
                                    <input
                                        type="email"
                                        inputMode="email"
                                        className="flex-1 py-3 text-slate-900 outline-none bg-white font-bold rounded-xl pl-4"
                                        placeholder="doctor@example.com"
                                        value={identifier}
                                        onChange={(e) => {
                                            setError('');
                                            setIdentifier(e.target.value);
                                        }}
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleIdentifierSubmit(); }}
                                        aria-label="Email Address"
                                    />
                                </div>
                                {error && (
                                    <div className="flex gap-2 items-start mt-2 text-red-500 text-xs font-bold">
                                        <AlertCircle size={14} className="shrink-0 mt-0.5" />
                                        <span>{error}</span>
                                    </div>
                                )}
                                <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1.5 px-1">
                                    <Lock size={10} />
                                    {t('auth.modal.privacyNote')}
                                </p>
                            </div>

                            <div className="flex items-center gap-2 text-[10px] text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <AlertCircle size={14} className="shrink-0" />
                                {t('auth.modal.emailHint')}
                            </div>

                            <button
                                onClick={handleIdentifierSubmit}
                                disabled={!identifier || rateLimitTimer > 0}
                                className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                            >
                                {rateLimitTimer > 0 ? `${t('auth.modal.tryAgainIn')} ${rateLimitTimer}s` : <>{t('auth.modal.continue')} <ArrowRight size={16} /></>}
                            </button>
                        </div>
                    )}
                    {/* Step 3: Password */}
                    {step === 'password' && (
                        <div className="space-y-6 animate-in slide-in-from-right">
                            <button onClick={() => setStep('input')} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 mb-2">
                                <ChevronLeft size={16} /> {t('auth.modal.back')}
                            </button>

                            <div className="text-center">
                                <h2 className="text-xl font-bold text-slate-900">{t('auth.modal.welcomeBack')}</h2>
                                <p className="text-slate-500 text-sm mt-1">
                                    {t('auth.modal.signingInAs')} <span className="font-bold text-slate-900">{getMaskedIdentifier()}</span>
                                </p>
                            </div>

                            <PasswordField
                                autoFocus
                                placeholder={t('auth.modal.password')}
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setError('');
                                }}
                                onKeyDown={(e) => { if (e.key === 'Enter') handlePasswordLogin(); }}
                                inputClassName="h-12 px-4 bg-white border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                containerClassName="space-y-0"
                            />

                            {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}

                            <div className="flex justify-between items-center text-xs font-bold">
                                <button onClick={() => setShowPasswordReset(true)} className="text-slate-500 hover:text-slate-800">
                                    {t('auth.modal.forgotPassword')}
                                </button>
                            </div>

                            <button
                                onClick={handlePasswordLogin}
                                className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary-hover shadow-lg"
                            >
                                {t('auth.modal.signIn')}
                            </button>
                        </div>
                    )}

                    {/* Step 5: OTP & MFA */}
                    {(step === 'otp' || step === 'mfa') && (
                        <div className="space-y-6 animate-in slide-in-from-right">
                            <div className="text-center">
                                {step === 'mfa' ? (
                                    <>
                                        <div className="size-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Shield size={24} />
                                        </div>
                                        <h3 className="font-bold text-slate-900">{t('auth.modal.securityCheck')}</h3>
                                        <p className="text-slate-500 text-xs mt-1">{t('auth.modal.unusualActivity')}</p>
                                    </>
                                ) : (
                                    <>
                                        <h3 className="font-bold text-slate-900">{t('auth.modal.verifyItsYou')}</h3>
                                        <p className="text-xs text-slate-500 mt-1 flex items-center justify-center gap-2">
                                            {t('auth.modal.codeSentTo')} <span className="font-bold text-slate-900 font-mono tracking-wide">{getMaskedIdentifier()}</span>
                                        </p>
                                    </>
                                )}
                            </div>

                            {isLocked ? (
                                <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-center">
                                    <ShieldAlert size={32} className="text-red-500 mx-auto mb-2" />
                                    <h3 className="font-bold text-red-900 text-sm">{t('auth.modal.accountLocked')}</h3>
                                    <p className="text-xs text-red-700 mt-1">{t('auth.modal.tooManyAttempts')}</p>
                                    <button className="mt-2 text-xs font-bold text-slate-600 underline">{t('auth.modal.contactSupport')}</button>
                                </div>
                            ) : (
                                <>
                                    <div className="flex gap-2 justify-center">
                                        {otp.map((digit, idx) => (
                                            <input
                                                key={idx}
                                                ref={el => otpRefs.current[idx] = el}
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={1}
                                                className={`size-12 border rounded-lg text-center text-xl font-bold outline-none ${step === 'mfa' ? 'border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20' : 'border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20'}`}
                                                value={digit}
                                                autoFocus={idx === 0}
                                                aria-label={`Digit ${idx + 1}`}
                                                onChange={(e) => handleOtpChange(e, idx)}
                                                onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                                            />
                                        ))}
                                    </div>

                                    {error && (
                                        <div className="bg-red-50 border border-red-100 rounded-lg p-3 mt-2 flex gap-3 items-start animate-in slide-in-from-top-1">
                                            <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-red-700">{error}</p>
                                                {failedAttempts >= 2 && (
                                                    <button onClick={() => setStep('input')} className="text-xs font-bold text-red-600 hover:text-red-800 mt-1 underline">
                                                        {t('auth.modal.changeMethod')}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {step !== 'mfa' && (
                                        <label className="flex items-center justify-center gap-2 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={trustDevice}
                                                onChange={(e) => setTrustDevice(e.target.checked)}
                                                className="rounded text-primary focus:ring-primary border-slate-300"
                                            />
                                            <span className="text-xs text-slate-600 font-bold group-hover:text-slate-900 flex items-center gap-1">
                                                {t('auth.modal.trustDevice')} <Monitor size={12} className="text-slate-400" />
                                            </span>
                                        </label>
                                    )}

                                    <button
                                        onClick={handleLogin}
                                        className={`w-full text-white py-3 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${step === 'mfa' ? 'bg-slate-900 hover:bg-slate-800' : 'bg-primary hover:bg-primary-hover shadow-primary/20'}`}
                                    >
                                        <Lock size={16} /> {step === 'mfa' ? t('auth.modal.verifyAndContinue') : t('auth.modal.continue')}
                                    </button>

                                    <div className="flex flex-col items-center gap-3">
                                        <button
                                            disabled={rateLimitTimer > 0}
                                            onClick={() => {
                                                setRateLimitTimer(30);
                                                setOtp(['', '', '', '', '', '']);
                                                setShowOtpHelp(true);
                                            }}
                                            className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 disabled:opacity-50"
                                        >
                                            <Clock size={14} />
                                            {rateLimitTimer > 0 ? `${t('auth.modal.resendAvailableIn')} ${rateLimitTimer}s` : t('auth.modal.resendCode')}
                                        </button>

                                        {(showOtpHelp || rateLimitTimer > 0) && (
                                            <div className="mt-2 text-xs text-slate-500 bg-slate-50 p-4 rounded-lg w-full text-left border border-slate-100 animate-in fade-in slide-in-from-top-2">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <HelpCircle size={14} className="text-slate-400" />
                                                    <p className="font-bold text-slate-700">{t('auth.modal.troubleReceiving')}</p>
                                                </div>
                                                <ul className="space-y-2 pl-1">
                                                    <li className="flex gap-2">
                                                        <MessageCircle size={12} className="shrink-0 mt-0.5 text-slate-400" />
                                                        <span>{t('auth.modal.checkSpam')}</span>
                                                    </li>
                                                    <li className="flex gap-2">
                                                        <Clock size={12} className="shrink-0 mt-0.5 text-slate-400" />
                                                        <span>{t('auth.modal.waitBeforeResend')}</span>
                                                    </li>
                                                </ul>
                                            </div>
                                        )}

                                        <button onClick={() => setStep('input')} className="text-xs text-slate-400 hover:text-slate-600 mt-2">
                                            {t('auth.modal.changeEmail')}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Trust Signal */}
                <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
                    <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                        <Lock size={10} /> {t('auth.modal.encryptionBadge')}
                    </p>
                </div>
            </div>
            <PasswordResetModal
                isOpen={showPasswordReset}
                onClose={() => setShowPasswordReset(false)}
                defaultEmail={identifier}
            />
        </div >
    );
};

const RoleButton: React.FC<{ icon: React.ReactNode, title: string, desc: string, onClick: () => void }> = ({ icon, title, desc, onClick }) => (
    <button
        onClick={onClick}
        className="flex items-center gap-4 p-4 border border-slate-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-left w-full group"
    >
        <div className="size-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 group-hover:bg-white group-hover:text-primary transition-colors">
            {icon}
        </div>
        <div>
            <h4 className="text-sm font-bold text-slate-900">{title}</h4>
            <p className="text-xs text-slate-500">{desc}</p>
        </div>
        <ArrowRight size={16} className="ml-auto text-slate-300 group-hover:text-primary transition-colors" />
    </button>
);

export default AuthModal;
