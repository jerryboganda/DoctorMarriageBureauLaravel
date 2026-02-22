import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Smartphone,
    Heart,
    ArrowRight,
    ShieldCheck,
    ChevronLeft,
    Globe,
    Lock,
    Mail,
    AlertCircle,
    ChevronDown,
    HelpCircle,
    CheckCircle2,
    Loader2,
    User,
    Calendar,
    Stethoscope,
    Check
} from 'lucide-react';
import { api } from '../utils/api';
import { useAuthStore } from '../src/stores/authStore';
import CountryCodeSelector from './CountryCodeSelector';
import { Country, getDefaultCountry, countries } from '../utils/countries';
import { useGoogleLogin } from '@react-oauth/google';

interface WelcomeScreenProps {
    onComplete: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onComplete }) => {
    const { t } = useTranslation();
    const { setUser } = useAuthStore();
    const [step, setStep] = useState<'landing' | 'input' | 'otp' | 'onboarding' | 'forgot-password' | 'reset-otp' | 'new-password' | 'two-factor'>('landing');
    const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('email');
    const defaultCountry = getDefaultCountry();
    const [identifier, setIdentifier] = useState('');
    const [selectedCountry, setSelectedCountry] = useState<Country>(defaultCountry);
    const [contactPhone, setContactPhone] = useState('');
    const [requiresPhone, setRequiresPhone] = useState(false);
    const [profileFor, setProfileFor] = useState('Myself');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [twoFactorToken, setTwoFactorToken] = useState('');
    const [referralCode, setReferralCode] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Onboarding Form State
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        gender: 'Male',
        on_behalf: '1',
        date_of_birth: '',
        password: '',
        password_confirmation: ''
    });

    // Password Reset State
    const [resetOtp, setResetOtp] = useState(['', '', '', '', '', '']);
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const resetOtpRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Capture referral code from URL
    React.useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const ref = params.get('ref');
        if (ref) {
            setReferralCode(ref);
        }
    }, []);

    const handleSocialLogin = async (provider: string, token: string) => {
        setIsLoading(true);
        setError('');
        try {
            const response = await api.post('/social-login', {
                social_provider: provider,
                access_token: token
            });
            if (response.data.result) {
                const { user, access_token } = response.data;
                localStorage.setItem('auth_token', access_token);
                setUser(user);
                onComplete();
            } else {
                setError(response.data.message || t('errors.socialLoginFailed'));
            }
        } catch (err: any) {
            setError(err.response?.data?.message || t('errors.socialLoginFailed'));
        } finally {
            setIsLoading(false);
        }
    };

    const googleLogin = useGoogleLogin({
        onSuccess: tokenResponse => handleSocialLogin('google', tokenResponse.access_token),
        onError: () => setError(t('errors.googleLoginFailed')),
    });

    const handleIdentifierChange = (value: string) => {
        setError('');
        if (authMethod === 'phone') {
            // User types only the local part (dial code is shown in the selector)
            const digits = value.replace(/\D/g, '').replace(/^0+/, '');
            setIdentifier(digits ? selectedCountry.dialCode + digits : selectedCountry.dialCode);
        } else {
            setIdentifier(value);
        }
    };

    const handleContactPhoneChange = (value: string) => {
        setError('');
        // User types only the local part (dial code is shown in the selector)
        const digits = value.replace(/\D/g, '').replace(/^0+/, '');
        setContactPhone(digits ? selectedCountry.dialCode + digits : '');
    };

    // Handle country change to update phone prefix
    React.useEffect(() => {
        if (authMethod === 'phone' && (step === 'landing' || step === 'input' || step === 'forgot-password')) {
            if (!identifier || identifier === '+') {
                setIdentifier(selectedCountry.dialCode);
            } else {
                const oldCountry = countries.find(c => identifier.startsWith(c.dialCode));
                const localPart = oldCountry ? identifier.slice(oldCountry.dialCode.length) : identifier.replace(/^\+?\d*/, '');
                setIdentifier(selectedCountry.dialCode + localPart);
            }
        } else if (authMethod === 'email' && (step === 'input' || step === 'forgot-password')) {
            if (identifier.startsWith('+')) {
                setIdentifier('');
            }
        }
    }, [selectedCountry, authMethod, step]);

    const formatErrorMessage = (message: string) => {
        // Only format if it's a validation field name from Laravel
        if (message === 'phone') return t('errors.phoneRequired');
        if (message === 'email') return t('errors.emailRequired');
        if (message === 'password') return t('errors.passwordRequired');

        // Otherwise return the actual message from backend
        return message;
    };

    const applyError = (message: string) => {
        if (!message) return;
        const normalized = message.toLowerCase();
        if (normalized.includes('phone')) {
            setRequiresPhone(true);
        }
        setError(formatErrorMessage(message));
    };

    const handleIdentifierSubmit = async () => {
        if (!identifier) {
            setError(authMethod === 'phone' ? t('errors.enterPhone') : t('errors.enterEmail'));
            return;
        }

        setIsLoading(true);
        setError('');
        try {
            let response;
            if (authMethod === 'phone') {
                response = await api.post('/send-phone-verification', {
                    phone: identifier,
                    intent: 'signup'
                });
            } else {
                response = await api.post('/send-email-verification', {
                    email: identifier,
                    intent: 'signup'
                });
            }

            if (response.data.success) {
                setStep('otp');
            } else {
                applyError(response.data.message || t('errors.somethingWrong'));
            }
        } catch (err: any) {
            applyError(err.response?.data?.message || t('errors.somethingWrong'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
        const val = e.target.value;
        if (authMethod === 'phone' && !/^\d*$/.test(val)) return;
        const newOtp = [...otp];
        newOtp[idx] = val.slice(-1);
        setOtp(newOtp);
        if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
    };

    const handleLogin = async () => {
        if (!identifier || !formData.password) {
            setError(t('errors.enterCredentials'));
            return;
        }

        setIsLoading(true);
        setError('');
        try {
            const response = await api.post('/signin', {
                email_or_phone: identifier,
                password: formData.password,
                identity_matrix: 'member'
            });

            if (response.data.result) {
                if (response.data.two_factor_required) {
                    setTwoFactorToken(response.data.two_factor_token);
                    setStep('two-factor');
                    setOtp(['', '', '', '', '', '']); // Reuse OTP state for 2FA
                    return;
                }
                const { user, access_token } = response.data;
                localStorage.setItem('auth_token', access_token);
                setUser(user);
                onComplete();
            } else {
                setError(response.data.message || t('errors.invalidCredentials'));
            }
        } catch (err: any) {
            setError(err.response?.data?.message || t('errors.loginFailed'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleTwoFactorVerify = async () => {
        const code = otp.join('');
        if (code.length < 6) {
            setError(t('errors.enterCode'));
            return;
        }

        setIsLoading(true);
        setError('');
        try {
            const response = await api.post('/auth/2fa/challenge', {
                two_factor_token: twoFactorToken,
                code: code
            });

            if (response.data.success) {
                const { access_token } = response.data;
                localStorage.setItem('auth_token', access_token);
                // After 2FA we need to fetch user data
                const userResponse = await api.get('/user-by-token');
                setUser(userResponse.data?.id ? userResponse.data : userResponse.data.user);
                onComplete();
            } else {
                setError(response.data.message || t('errors.invalidVerificationCode'));
            }
        } catch (err: any) {
            setError(err.response?.data?.message || t('errors.twoFactorFailed'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerify = async () => {
        const code = otp.join('');
        if (code.length < 6) {
            setError(t('errors.enterCode'));
            return;
        }

        setIsLoading(true);
        setError('');
        try {
            let response;
            if (authMethod === 'phone') {
                const fullPhone = identifier.startsWith('+') ? identifier : `${selectedCountry.dialCode}${identifier.replace(/^0+/, '')}`;
                response = await api.post('/verify-phone-code', {
                    phone: fullPhone,
                    code: code
                });
            } else {
                response = await api.post('/verify-email-code', {
                    email: identifier,
                    code: code
                });
            }

            if (response.data.result && response.data.user) {
                // Existing user logged in
                const { user, access_token } = response.data;
                localStorage.setItem('auth_token', access_token);
                setUser(user);
                onComplete();
            } else if (response.data.success) {
                // New user verified, proceed to onboarding
                setStep('onboarding');
            } else {
                applyError(response.data.message || t('errors.invalidCode'));
            }
        } catch (err: any) {
            applyError(err.response?.data?.message || t('errors.verificationFailed'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleOnboardingSubmit = async () => {
        if (authMethod === 'email' && !contactPhone.trim()) {
            setRequiresPhone(true);
            setError(t('errors.phoneRequired'));
            return;
        }

        // Basic validation
        if (!formData.first_name || !formData.last_name || !formData.date_of_birth || !formData.password) {
            setError(t('errors.fillRequired'));
            return;
        }

        if (formData.password !== formData.password_confirmation) {
            setError(t('errors.passwordsMismatch'));
            return;
        }

        setIsLoading(true);
        setError('');
        try {
            const fullPhone = authMethod === 'phone'
                ? (identifier.startsWith('+') ? identifier : `${selectedCountry.dialCode}${identifier.replace(/^0+/, '')}`)
                : contactPhone
                    ? (contactPhone.startsWith('+') ? contactPhone : `${selectedCountry.dialCode}${contactPhone.replace(/^0+/, '')}`)
                    : null;
            const email = authMethod === 'email' ? identifier : null;

            const payload = {
                ...formData,
                phone: fullPhone,
                email: email,
                on_behalf: parseInt(formData.on_behalf),
                referral_code: referralCode
            };

            const response = await api.post('/signup', payload);

            if (response.data.result && response.data.user) {
                const { user, access_token } = response.data;
                localStorage.setItem('auth_token', access_token);
                setUser(user);
                onComplete();
            } else {
                const message = Array.isArray(response.data.message) ? response.data.message[0] : (response.data.message || t('errors.signupFailed'));
                applyError(message);
            }
        } catch (err: any) {
            const msg = err.response?.data?.message;
            applyError(Array.isArray(msg) ? msg[0] : (msg || t('errors.signupFailed')));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full bg-white font-sans overflow-hidden lg:overflow-hidden">
            {/* Left Panel - Dark Blue Branding (Hidden on Mobile) */}
            <div className="hidden lg:flex w-5/12 bg-[#0B0F19] relative flex-col justify-between p-12 text-white">

                {/* Logo */}
                <div className="flex items-center gap-3">
                    <img src="/logo-v2.png" alt={t('auth.welcome.logoAlt')} className="h-12 w-auto" />
                </div>

                {/* Hero Text */}
                <div className="relative z-10 mt-12">
                    <h1 className="text-5xl font-bold tracking-tight leading-[1.15] mb-6">
                        {t('auth.welcome.heroTitle')}
                    </h1>
                    <p className="text-lg text-slate-400 max-w-md leading-relaxed">
                        {t('auth.welcome.heroSubtitle')}
                    </p>
                    <p className="text-xs text-slate-500 mt-4">{t('auth.welcome.version')}</p>
                </div>

                {/* Bottom Verification Card */}
                <div className="mt-auto space-y-8">
                    <div className="bg-[#1E293B] p-5 rounded-2xl border border-slate-700/50 flex items-start gap-4 shadow-xl">
                        <div className="size-10 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 shrink-0">
                            <ShieldCheck size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-sm">{t('auth.welcome.verifiedProfiles')}</h3>
                            <p className="text-xs text-slate-400 mt-1">{t('auth.welcome.verifiedProfilesDesc')}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex -space-x-3">
                            {["/doctors/doctor1.png", "/doctors/doctor2.png", "/doctors/doctor3.png", "/doctors/doctor4.png"].map((src, i) => (
                                <div key={i} className="size-10 rounded-full border-2 border-[#0B0F19] bg-slate-700 bg-cover bg-center" style={{ backgroundImage: `url(${src})` }} />
                            ))}
                        </div>
                        <div className="bg-white text-slate-900 px-4 py-1.5 rounded-full text-xs font-bold shadow-lg">
                            {t('auth.welcome.successStories')}
                        </div>
                    </div>
                </div>

                {/* Background Gradients */}
                <div className="absolute top-[-20%] right-[-20%] w-[500px] h-[500px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute bottom-[-20%] left-[-20%] w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
            </div>

            {/* Right Panel - Auth Flow */}
            <div className="flex-1 flex flex-col relative bg-white overflow-y-auto">
                <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 min-h-0">
                    <div className="w-full max-w-md space-y-8">

                        {step === 'landing' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="text-center space-y-2">
                                    <h2 className="text-3xl font-bold text-slate-900">{t('auth.welcome.welcomeBack')}</h2>
                                    <p className="text-slate-500">{t('auth.welcome.welcomeBackSubtitle')}</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-700 uppercase mb-1 block">{t('auth.welcome.emailAddress')}</label>
                                            <div className={`flex items-stretch bg-slate-50 border ${error ? 'border-red-500' : 'border-slate-200'} rounded-xl focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all`}>
                                                {authMethod === 'phone' && (
                                                    <CountryCodeSelector
                                                        selectedCountry={selectedCountry}
                                                        onSelect={setSelectedCountry}
                                                    />
                                                )}
                                                <input
                                                    type={authMethod === 'phone' ? 'tel' : 'email'}
                                                    value={authMethod === 'phone' && identifier.startsWith(selectedCountry.dialCode) ? identifier.slice(selectedCountry.dialCode.length) : identifier}
                                                    onChange={(e) => handleIdentifierChange(e.target.value)}
                                                    className={`flex-1 bg-transparent px-4 py-3 outline-none font-bold text-slate-900 placeholder-slate-300 min-w-0 ${authMethod === 'phone' ? 'rounded-r-xl' : 'rounded-xl'}`}
                                                    placeholder={authMethod === 'phone' ? t('auth.welcome.phoneNumber') : t('auth.welcome.emailAddress')}
                                                />
                                            </div>

                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-700 uppercase mb-1 block">{t('auth.welcome.password')}</label>
                                            <input
                                                type="password"
                                                value={formData.password}
                                                onChange={(e) => { setFormData({ ...formData, password: e.target.value }); setError(''); }}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary focus:bg-white transition-all font-medium"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                        <div className="flex justify-end">
                                            <button
                                                onClick={() => { setStep('forgot-password'); setIdentifier(''); setError(''); }}
                                                className="text-sm font-bold text-primary hover:underline"
                                            >
                                                {t('auth.welcome.forgotPassword')}
                                            </button>
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                                            <AlertCircle size={14} />
                                            <span>{error}</span>
                                        </div>
                                    )}

                                    <button
                                        onClick={handleLogin}
                                        disabled={isLoading}
                                        className="w-full py-4 bg-[#0F172A] text-white rounded-xl font-bold shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
                                    >
                                        {isLoading ? <Loader2 className="animate-spin" size={18} /> : t('auth.welcome.signIn')}
                                    </button>

                                    <div className="relative py-2">
                                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                                        <span className="relative bg-white px-4 text-slate-400 text-xs font-bold uppercase mx-auto flex w-fit">{t('auth.welcome.orContinueWith')}</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <button onClick={() => googleLogin()} className="p-3 border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors">
                                            <Globe size={18} /> {t('auth.welcome.google')}
                                        </button>
                                        <button
                                            onClick={() => {
                                                alert(t('auth.welcome.appleComingSoon'));
                                            }}
                                            className="p-3 border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors"
                                        >
                                            <svg viewBox="0 0 24 24" className="size-5" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" /></svg> {t('auth.welcome.apple')}
                                        </button>
                                    </div>

                                    <div className="text-center">
                                        <span className="text-slate-500 text-sm">{t('auth.welcome.noAccount')} </span>
                                        <button
                                            onClick={() => { setStep('input'); setIdentifier(''); setError(''); }}
                                            className="text-primary font-bold hover:underline"
                                        >
                                            {t('auth.welcome.signUp')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 'forgot-password' && (
                            <div className="space-y-6 animate-in slide-in-from-right duration-300">
                                <button onClick={() => setStep('landing')} disabled={isLoading} className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase hover:text-slate-900 transition-colors disabled:opacity-50">
                                    <ChevronLeft size={16} /> {t('auth.welcome.backToLogin')}
                                </button>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900">{t('auth.welcome.resetPassword')}</h2>
                                    <p className="text-slate-500 mt-1 text-sm">{t('auth.welcome.resetPasswordDesc')}</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700 uppercase mb-1 block">{t('auth.welcome.emailAddress')}</label>
                                        <div className={`flex items-stretch bg-slate-50 border ${error ? 'border-red-500' : 'border-slate-200'} rounded-xl focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all`}>
                                            {authMethod === 'phone' && (
                                                <CountryCodeSelector
                                                    selectedCountry={selectedCountry}
                                                    onSelect={setSelectedCountry}
                                                />
                                            )}
                                            <input
                                                type={authMethod === 'phone' ? 'tel' : 'email'}
                                                value={authMethod === 'phone' && identifier.startsWith(selectedCountry.dialCode) ? identifier.slice(selectedCountry.dialCode.length) : identifier}
                                                onChange={(e) => handleIdentifierChange(e.target.value)}
                                                className={`flex-1 bg-transparent px-4 py-3 outline-none font-bold text-slate-900 placeholder-slate-300 min-w-0 ${authMethod === 'phone' ? 'rounded-r-xl' : 'rounded-xl'}`}
                                                placeholder={authMethod === 'phone' ? t('auth.welcome.phoneNumber') : t('auth.welcome.emailAddress')}
                                            />
                                        </div>

                                    </div>

                                    {error && (
                                        <div className={`p-3 rounded-xl text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-1 ${error.includes('sent') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                            <AlertCircle size={14} />
                                            <span>{error}</span>
                                        </div>
                                    )}

                                    <button
                                        onClick={async () => {
                                            if (!identifier) { setError(t('errors.enterCredentials')); return; }
                                            setIsLoading(true);
                                            try {
                                                const type = identifier.includes('@') ? 'email' : 'phone';
                                                await api.post('/forgot/password', {
                                                    email_or_phone: identifier,
                                                    send_code_by: type
                                                });
                                                setResetOtp(['', '', '', '', '', '']);
                                                setStep('reset-otp');
                                            } catch (err: any) {
                                                setError(err.response?.data?.message || t('errors.somethingWrong'));
                                            } finally {
                                                setIsLoading(false);
                                            }
                                        }}
                                        disabled={isLoading}
                                        className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/25 hover:bg-primary-hover flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                                    >
                                        {isLoading ? <Loader2 className="animate-spin" size={18} /> : t('auth.welcome.sendResetCode')}
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 'reset-otp' && (
                            <div className="space-y-6 animate-in slide-in-from-right duration-300">
                                <button onClick={() => setStep('forgot-password')} disabled={isLoading} className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase hover:text-slate-900 transition-colors disabled:opacity-50">
                                    <ChevronLeft size={16} /> {t('auth.welcome.back')}
                                </button>
                                <div className="text-center space-y-2">
                                    <h2 className="text-2xl font-bold text-slate-900">{t('auth.welcome.enterResetCode')}</h2>
                                    <p className="text-slate-500 text-sm">{t('auth.welcome.enterResetCodeDesc')}</p>
                                </div>
                                <div className="space-y-6">
                                    <div className="flex gap-2 justify-between px-2">
                                        {resetOtp.map((d, i) => (
                                            <input
                                                key={i}
                                                ref={el => resetOtpRefs.current[i] = el}
                                                type="text"
                                                maxLength={1}
                                                value={d}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (!/^\d*$/.test(val)) return;
                                                    const newOtp = [...resetOtp];
                                                    newOtp[i] = val.slice(-1);
                                                    setResetOtp(newOtp);
                                                    if (val && i < 5) resetOtpRefs.current[i + 1]?.focus();
                                                }}
                                                onKeyDown={e => {
                                                    if (e.key === 'Backspace' && !resetOtp[i] && i > 0) resetOtpRefs.current[i - 1]?.focus();
                                                }}
                                                disabled={isLoading}
                                                className="size-10 sm:size-12 border border-slate-200 bg-white rounded-xl text-center text-xl sm:text-2xl font-bold focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                            />
                                        ))}
                                    </div>

                                    {error && (
                                        <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-1 justify-center">
                                            <AlertCircle size={14} />
                                            <span>{error}</span>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => {
                                            const code = resetOtp.join('');
                                            if (code.length < 6) {
                                                setError(t('errors.enterCode'));
                                                return;
                                            }
                                            setError('');
                                            setStep('new-password');
                                        }}
                                        disabled={isLoading || resetOtp.join('').length < 6}
                                        className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/25 hover:bg-primary-hover transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                                    >
                                        {t('auth.welcome.continue')}
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 'new-password' && (
                            <div className="space-y-6 animate-in slide-in-from-right duration-300">
                                <button onClick={() => setStep('reset-otp')} disabled={isLoading} className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase hover:text-slate-900 transition-colors disabled:opacity-50">
                                    <ChevronLeft size={16} /> {t('auth.welcome.back')}
                                </button>
                                <div className="text-center space-y-2">
                                    <h2 className="text-2xl font-bold text-slate-900">{t('auth.welcome.setNewPassword')}</h2>
                                    <p className="text-slate-500 text-sm">{t('auth.welcome.setNewPasswordDesc')}</p>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-700 uppercase mb-1 block">{t('auth.welcome.newPassword')}</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                                                className="w-full px-4 py-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary focus:bg-white transition-all font-medium"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-700 uppercase mb-1 block">{t('auth.welcome.confirmPassword')}</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                type="password"
                                                value={confirmNewPassword}
                                                onChange={(e) => { setConfirmNewPassword(e.target.value); setError(''); }}
                                                className="w-full px-4 py-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary focus:bg-white transition-all font-medium"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                                            <AlertCircle size={14} />
                                            <span>{error}</span>
                                        </div>
                                    )}

                                    <button
                                        onClick={async () => {
                                            if (!newPassword || newPassword.length < 8) {
                                                setError(t('auth.welcome.passwordMinChars'));
                                                return;
                                            }
                                            if (newPassword !== confirmNewPassword) {
                                                setError(t('errors.passwordsMismatch'));
                                                return;
                                            }
                                            setIsLoading(true);
                                            setError('');
                                            try {
                                                const type = identifier.includes('@') ? 'email' : 'phone';
                                                await api.post('/reset/password', {
                                                    email_or_phone: identifier,
                                                    send_code_by: type,
                                                    verification_code: resetOtp.join(''),
                                                    password: newPassword,
                                                    password_confirmation: confirmNewPassword
                                                });
                                                setStep('landing');
                                                setError('');
                                                alert(t('auth.welcome.passwordResetSuccess'));
                                            } catch (err: any) {
                                                setError(err.response?.data?.message || t('errors.somethingWrong'));
                                            } finally {
                                                setIsLoading(false);
                                            }
                                        }}
                                        disabled={isLoading}
                                        className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/25 hover:bg-primary-hover flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70"
                                    >
                                        {isLoading ? <Loader2 className="animate-spin" size={18} /> : t('auth.welcome.resetPassword')}
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 'two-factor' && (
                            <div className="space-y-6 animate-in slide-in-from-right duration-300">
                                <button onClick={() => setStep('landing')} disabled={isLoading} className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase hover:text-slate-900 transition-colors disabled:opacity-50">
                                    <ChevronLeft size={16} /> {t('auth.welcome.backToLogin')}
                                </button>
                                <div className="text-center space-y-2">
                                    <h2 className="text-2xl font-bold text-slate-900">{t('auth.welcome.twoFactorAuth')}</h2>
                                    <p className="text-slate-500 text-sm">{t('auth.welcome.twoFactorAuthDesc')}</p>
                                </div>
                                <div className="space-y-6">
                                    <div className="flex gap-2 justify-between px-2">
                                        {otp.map((d, i) => (
                                            <input
                                                key={i}
                                                ref={el => otpRefs.current[i] = el}
                                                type="text"
                                                maxLength={1}
                                                value={d}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (!/^\d*$/.test(val)) return;
                                                    const newOtp = [...otp];
                                                    newOtp[i] = val.slice(-1);
                                                    setOtp(newOtp);
                                                    if (val && i < 5) otpRefs.current[i + 1]?.focus();
                                                }}
                                                onKeyDown={e => {
                                                    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
                                                }}
                                                disabled={isLoading}
                                                className="size-10 sm:size-12 border border-slate-200 bg-white rounded-xl text-center text-xl sm:text-2xl font-bold focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                            />
                                        ))}
                                    </div>

                                    {error && (
                                        <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-1 justify-center">
                                            <AlertCircle size={14} />
                                            <span>{error}</span>
                                        </div>
                                    )}

                                    <button
                                        onClick={handleTwoFactorVerify}
                                        disabled={isLoading || otp.join('').length < 6}
                                        className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/25 hover:bg-primary-hover transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                                    >
                                        {isLoading ? <Loader2 className="animate-spin" size={18} /> : t('auth.welcome.verifyCode')}
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 'input' && (
                            <div className="space-y-6 animate-in slide-in-from-right duration-300">
                                <button onClick={() => setStep('landing')} disabled={isLoading} className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase hover:text-slate-900 transition-colors disabled:opacity-50">
                                    <ChevronLeft size={16} /> {t('auth.welcome.backToLogin')}
                                </button>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900">{t('auth.welcome.createAccount')}</h2>
                                    <p className="text-slate-500 mt-1 text-sm">{t('auth.welcome.createAccountDesc')}</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('auth.welcome.creatingProfileFor')}</label>
                                        <div className="relative">
                                            <select
                                                className="w-full p-4 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium appearance-none focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none cursor-pointer hover:border-slate-300 transition-colors"
                                                value={profileFor}
                                                onChange={(e) => setProfileFor(e.target.value)}
                                            >
                                                <option>{t('auth.welcome.myself')}</option>
                                                <option>{t('auth.welcome.mySon')}</option>
                                                <option>{t('auth.welcome.myDaughter')}</option>
                                                <option>{t('auth.welcome.myBrother')}</option>
                                                <option>{t('auth.welcome.mySister')}</option>
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                                        </div>
                                    </div>

                                    <div className={`flex items-stretch bg-white border ${error ? 'border-red-500' : 'border-slate-200'} rounded-xl focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all`}>
                                        {authMethod === 'phone' && (
                                            <CountryCodeSelector
                                                selectedCountry={selectedCountry}
                                                onSelect={setSelectedCountry}
                                            />
                                        )}
                                        <input
                                            type={authMethod === 'phone' ? 'tel' : 'email'}
                                            value={authMethod === 'phone' && identifier.startsWith(selectedCountry.dialCode) ? identifier.slice(selectedCountry.dialCode.length) : identifier}
                                            onChange={(e) => handleIdentifierChange(e.target.value)}
                                            className={`flex-1 bg-transparent px-4 py-3 outline-none font-bold text-lg text-slate-900 placeholder-slate-300 min-w-0 ${authMethod === 'phone' ? 'rounded-r-xl' : 'rounded-xl'}`}
                                            placeholder={authMethod === 'phone' ? t('auth.welcome.phoneNumber') : t('auth.welcome.emailAddress')}
                                            autoFocus
                                            disabled={isLoading}
                                        />
                                    </div>



                                    {error && (
                                        <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                                            <AlertCircle size={14} />
                                            <span>{error}</span>
                                        </div>
                                    )}

                                    <button
                                        onClick={handleIdentifierSubmit}
                                        disabled={isLoading}
                                        className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/25 hover:bg-primary-hover flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="animate-spin" size={18} />
                                                {t('auth.welcome.verifying')}
                                            </>
                                        ) : (
                                            <>
                                                {t('auth.welcome.continue')} <ArrowRight size={18} />
                                            </>
                                        )}
                                    </button>

                                    <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-600 flex gap-2">
                                        <ShieldCheck size={14} className="shrink-0 mt-0.5" />
                                        <span>{t('auth.welcome.verifySecureNote')}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 'otp' && (
                            <div className="space-y-6 animate-in slide-in-from-right duration-300">
                                <button onClick={() => setStep('input')} disabled={isLoading} className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase hover:text-slate-900 transition-colors disabled:opacity-50">
                                    <ChevronLeft size={16} /> {t('auth.welcome.back')}
                                </button>
                                <div className="text-center space-y-2">
                                    <h2 className="text-2xl font-bold text-slate-900">{t('auth.welcome.enterVerificationCode')}</h2>
                                    <p className="text-slate-500 text-sm">
                                        {t('auth.welcome.enterCodeSentTo', { method: authMethod === 'phone' ? t('auth.welcome.phone') : t('auth.welcome.email') })}
                                    </p>
                                </div>
                                <div className="space-y-8">
                                    <div className="flex gap-2 justify-between px-2">
                                        {otp.map((d, i) => (
                                            <input
                                                key={i}
                                                ref={el => otpRefs.current[i] = el}
                                                type="text"
                                                maxLength={1}
                                                value={d}
                                                onChange={(e) => handleOtpChange(e, i)}
                                                onKeyDown={e => {
                                                    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
                                                }}
                                                disabled={isLoading}
                                                className={`size-10 sm:size-12 border ${error ? 'border-red-500 bg-red-50' : 'border-slate-200 bg-white'} rounded-xl text-center text-xl sm:text-2xl font-bold focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all`}
                                            />
                                        ))}
                                    </div>

                                    {error && (
                                        <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-1 justify-center">
                                            <AlertCircle size={14} />
                                            <span>{error}</span>
                                        </div>
                                    )}

                                    <button
                                        onClick={handleVerify}
                                        disabled={isLoading || otp.join('').length < 6}
                                        className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/25 hover:bg-primary-hover transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                                    >
                                        {isLoading ? <Loader2 className="animate-spin" size={18} /> : t('auth.welcome.verifyAndContinue')}
                                    </button>

                                    <p className="text-center text-xs text-slate-400">
                                        {t('auth.welcome.didntReceiveCode')} <button className="text-primary font-bold hover:underline" disabled={isLoading} onClick={handleIdentifierSubmit}>{t('auth.welcome.resendOTP')}</button>
                                    </p>
                                </div>
                            </div>
                        )}

                        {step === 'onboarding' && (
                            <div className="space-y-6 animate-in slide-in-from-right duration-300">
                                <div className="text-center space-y-2">
                                    <h2 className="text-2xl font-bold text-slate-900">{t('auth.welcome.completeProfile')}</h2>
                                    <p className="text-slate-500 text-sm">{t('auth.welcome.completeProfileDesc')}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1 col-span-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase">{t('auth.welcome.creatingProfileFor')}</label>
                                        <div className="relative">
                                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <select
                                                value={formData.on_behalf}
                                                onChange={(e) => setFormData({ ...formData, on_behalf: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-primary focus:bg-white transition-all text-sm font-medium appearance-none"
                                            >
                                                <option value="1">{t('auth.welcome.self')}</option>
                                                <option value="2">{t('auth.welcome.son')}</option>
                                                <option value="3">{t('auth.welcome.daughter')}</option>
                                                <option value="4">{t('auth.welcome.brother')}</option>
                                                <option value="5">{t('auth.welcome.sister')}</option>
                                                <option value="6">{t('auth.welcome.friend')}</option>
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-400 uppercase">{t('auth.welcome.firstName')}</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                type="text"
                                                value={formData.first_name}
                                                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-primary focus:bg-white transition-all text-sm font-medium"
                                                placeholder={t('auth.welcome.firstNamePlaceholder')}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-400 uppercase">{t('auth.welcome.lastName')}</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                type="text"
                                                value={formData.last_name}
                                                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-primary focus:bg-white transition-all text-sm font-medium"
                                                placeholder={t('auth.welcome.lastNamePlaceholder')}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-400 uppercase">{t('auth.welcome.gender')}</label>
                                        <select
                                            value={formData.gender}
                                            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none focus:border-primary focus:bg-white transition-all text-sm font-medium appearance-none"
                                        >
                                            <option value="Male">{t('auth.welcome.male')}</option>
                                            <option value="Female">{t('auth.welcome.female')}</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-400 uppercase">{t('auth.welcome.dateOfBirth')}</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                type="date"
                                                value={formData.date_of_birth}
                                                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-primary focus:bg-white transition-all text-sm font-medium"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase">{t('auth.welcome.setPasswordLabel')}</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-primary focus:bg-white transition-all text-sm font-medium"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase">{t('auth.welcome.confirmPassword')}</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="password"
                                            value={formData.password_confirmation}
                                            onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-primary focus:bg-white transition-all text-sm font-medium"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>

                                {(authMethod === 'email' || requiresPhone) && (
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-400 uppercase">{t('auth.welcome.phoneNumber')}</label>
                                        <div className={`flex items-stretch bg-white border ${error ? 'border-red-500' : 'border-slate-200'} rounded-xl focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all`}>
                                            <CountryCodeSelector
                                                selectedCountry={selectedCountry}
                                                onSelect={setSelectedCountry}
                                            />
                                            <input
                                                type="tel"
                                                value={contactPhone.startsWith(selectedCountry.dialCode) ? contactPhone.slice(selectedCountry.dialCode.length) : contactPhone}
                                                onChange={(e) => handleContactPhoneChange(e.target.value)}
                                                className="flex-1 bg-transparent px-4 py-3 outline-none font-bold text-lg text-slate-900 placeholder-slate-300 rounded-r-xl min-w-0"
                                                placeholder="321 7654321"
                                                disabled={isLoading}
                                            />
                                        </div>
                                    </div>
                                )}

                                {error && (
                                    <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                                        <AlertCircle size={14} />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <button
                                    onClick={handleOnboardingSubmit}
                                    disabled={isLoading}
                                    className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/25 hover:bg-primary-hover flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" size={18} /> : t('auth.welcome.completeRegistration')}
                                </button>
                            </div>
                        )}

                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center text-xs text-slate-400 gap-4 bg-white">
                    <div className="flex gap-4 sm:gap-6 flex-wrap justify-center">
                        <a href="#" className="hover:text-slate-600 transition-colors">{t('auth.welcome.termsOfService')}</a>
                        <a href="#" className="hover:text-slate-600 transition-colors">{t('auth.welcome.privacyPolicy')}</a>
                        <a href="#" className="hover:text-slate-600 transition-colors">{t('auth.welcome.cookiePolicy')}</a>
                    </div>
                    <a href="#" className="flex items-center gap-1 hover:text-slate-600 transition-colors">
                        <HelpCircle size={14} /> {t('auth.welcome.helpSupport')}
                    </a>
                </div>
            </div>
        </div>
    );
};

export default WelcomeScreen;
