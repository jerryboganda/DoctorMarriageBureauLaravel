import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Loader2, ChevronLeft, Mail, Lock } from 'lucide-react';
import { api } from '../utils/api';

interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
}

const PasswordResetModal: React.FC<PasswordResetModalProps> = ({ isOpen, onClose, defaultEmail = '' }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState<'email' | 'code' | 'new-password'>('email');
  const [email, setEmail] = useState(defaultEmail);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const codeRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (!isOpen) return;
    setStep('email');
    setEmail(defaultEmail);
    setCode(['', '', '', '', '', '']);
    setNewPassword('');
    setConfirmPassword('');
    setLoading(false);
    setError('');
    setSuccess('');
  }, [isOpen, defaultEmail]);

  if (!isOpen) return null;

  const sendCode = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setError(t('errors.enterCredentials'));
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      await api.post('/forgot/password', {
        email_or_phone: trimmed,
        send_code_by: 'email',
      });
      setSuccess('Reset code sent to your email.');
      setStep('code');
    } catch (err: any) {
      setError(err?.response?.data?.message || t('errors.somethingWrong'));
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    const otp = code.join('');
    if (otp.length < 6) {
      setError(t('errors.enterCode'));
      return;
    }

    try {
      setLoading(true);
      setError('');
      await api.post('/verify/password/reset', {
        email_or_phone: email.trim(),
        verification_code: otp,
      });
      setStep('new-password');
      setSuccess('');
    } catch (err: any) {
      setError(err?.response?.data?.message || t('errors.somethingWrong'));
    } finally {
      setLoading(false);
    }
  };

  const completeReset = async () => {
    if (!newPassword || newPassword.length < 8) {
      setError(t('auth.welcome.passwordMinChars'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('errors.passwordsMismatch'));
      return;
    }

    try {
      setLoading(true);
      setError('');
      await api.post('/password/reset/complete', {
        email_or_phone: email.trim(),
        verification_code: code.join(''),
        password: newPassword,
        password_confirmation: confirmPassword,
      });
      onClose();
      alert(t('auth.welcome.passwordResetSuccess'));
    } catch (err: any) {
      setError(err?.response?.data?.message || t('errors.somethingWrong'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{t('auth.welcome.resetPassword')}</h3>
            <p className="text-sm text-slate-500">{t('auth.welcome.resetPasswordDesc')}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-white" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {success && <div className="rounded-xl bg-emerald-50 text-emerald-700 text-sm px-3 py-2">{success}</div>}
          {error && <div className="rounded-xl bg-red-50 text-red-600 text-sm px-3 py-2">{error}</div>}

          {step === 'email' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">{t('auth.welcome.emailAddress')}</label>
                <div className="flex items-stretch bg-slate-50 border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                  <span className="pl-3 flex items-center text-slate-400"><Mail size={16} /></span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('auth.welcome.emailAddress')}
                    className="flex-1 bg-transparent px-3 py-3 outline-none font-bold text-slate-900 placeholder-slate-300 min-w-0 rounded-xl"
                  />
                </div>
              </div>
              <button
                onClick={sendCode}
                disabled={loading}
                className="w-full py-3.5 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/25 hover:bg-primary-hover flex items-center justify-center gap-2 transition-all disabled:opacity-70"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : t('auth.welcome.sendResetCode')}
              </button>
            </div>
          )}

          {step === 'code' && (
            <div className="space-y-4">
              <div className="text-sm text-slate-600">{t('auth.welcome.enterResetCodeDesc')}</div>
              <div className="flex gap-2 justify-between">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { codeRefs.current[index] = el; }}
                    type="text"
                    maxLength={1}
                    inputMode="numeric"
                    value={digit}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(-1);
                      const next = [...code];
                      next[index] = val;
                      setCode(next);
                      if (val && index < 5) codeRefs.current[index + 1]?.focus();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !code[index] && index > 0) {
                        codeRefs.current[index - 1]?.focus();
                      }
                    }}
                    className="size-11 border border-slate-200 bg-white rounded-xl text-center text-xl font-bold focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                  />
                ))}
              </div>
              <button
                onClick={verifyCode}
                disabled={loading || code.join('').length < 6}
                className="w-full py-3.5 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/25 hover:bg-primary-hover flex items-center justify-center gap-2 transition-all disabled:opacity-70"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : t('auth.welcome.continue')}
              </button>
              <button onClick={() => setStep('email')} className="w-full py-2 text-sm font-bold text-slate-500 hover:text-slate-800 flex items-center justify-center gap-2">
                <ChevronLeft size={14} /> {t('auth.welcome.backToLogin')}
              </button>
            </div>
          )}

          {step === 'new-password' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">{t('auth.welcome.newPassword')}</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-primary focus:bg-white transition-all font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">{t('auth.welcome.confirmPassword')}</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-primary focus:bg-white transition-all font-medium"
                />
              </div>
              <button
                onClick={completeReset}
                disabled={loading}
                className="w-full py-3.5 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/25 hover:bg-primary-hover flex items-center justify-center gap-2 transition-all disabled:opacity-70"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : t('auth.welcome.resetPassword')}
              </button>
              <button onClick={() => setStep('code')} className="w-full py-2 text-sm font-bold text-slate-500 hover:text-slate-800 flex items-center justify-center gap-2">
                <ChevronLeft size={14} /> {t('auth.welcome.back')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PasswordResetModal;
