import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Send, Wand2, Check, Loader2, AlertCircle, CheckCircle2, MessageSquare, ArrowUpCircle, Settings, ShieldOff } from 'lucide-react';
import { ProfileMatch } from '../types';
import { api } from '../utils/api';
import { resolveInterestState } from '../utils/interestStatus';
import { useAuthStore } from '../src/stores/authStore';

interface ProposalModalProps {
  profile: ProfileMatch;
  onClose: () => void;
  onNavigate?: (view: string) => void;
  onSent?: (profileId: string) => void;
  onVerificationRequired?: () => void;
}

const ProposalModal: React.FC<ProposalModalProps> = ({ profile, onClose, onNavigate, onSent, onVerificationRequired }) => {
  const { t } = useTranslation();
  const { user, checkAuth } = useAuthStore();
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [alreadySent, setAlreadySent] = useState<'pending' | 'accepted' | 'received' | null>(null);

  // Guard: if interest already exists, don't allow sending again
  const hasExistingInterest = resolveInterestState(profile.interestStatus, profile.interestText) !== 'none';
  const userName = user?.name || t('nav.defaultName', 'Member Account');
  const membershipLabel = user?.membership === 2 || user?.membership === '2'
    ? t('nav.premiumMember', 'Premium Member')
    : t('nav.basicMember', 'Basic Member');
  const isVerified = Boolean(user?.approved || user?.email_verified_at || user?.photo_approved);
  const verificationLabel = isVerified
    ? t('modals.verification.verified', 'Verified')
    : t('profile.unverified', 'Unverified');
  const userAvatar = user?.avatar_original || user?.avatar;

  useEffect(() => {
    checkAuth().catch(() => undefined);
  }, [checkAuth]);

  // Check interest status on mount via API
  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;
    const checkInterestStatus = async () => {
      try {
        const res = await api.get(`/member/member-info/${profile.id}`, { signal: controller.signal });
        if (!isActive) return;
        if (res.data?.data) {
          const info = res.data.data;
          const state = resolveInterestState(info.interest_status, info.interest_text);
          if (state === 'sent_accepted' || state === 'received_accepted') {
            setAlreadySent('accepted');
          } else if (state === 'sent_pending') {
            setAlreadySent('pending');
          } else if (state === 'received_pending') {
            setAlreadySent('received');
          } else {
            setAlreadySent(null);
          }
        }
      } catch (err: any) {
        if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return;
        // If check fails, allow normal flow
      } finally {
        if (isActive) setCheckingStatus(false);
      }
    };
    checkInterestStatus();
    return () => {
      isActive = false;
      controller.abort();
    };
  }, [profile.id]);

  const templates = [
    t('modals.proposal.template1'),
    t('modals.proposal.template2'),
    t('modals.proposal.template3')
  ];

  const handleSendProposal = async () => {
    if (hasExistingInterest || alreadySent) return;
    setIsLoading(true);
    setError('');
    setErrorCode(null);
    try {
        const response = await api.post('/member/express-interest', {
            user_id: profile.id,
            message: message // Note: current API might ignore this, but good for future-proofing
        });

        if (response.data.result) {
            onSent?.(String(profile.id));
            setAlreadySent('pending');
            setIsSuccess(true);
            setTimeout(() => {
                onClose();
            }, 2000);
        } else {
            if (response.data.code === 'VERIFICATION_REQUIRED') {
                onVerificationRequired?.();
                return;
            }
            setErrorCode(response.data.error_code || null);
            setError(response.data.message || t('errors.couldNotSendProposal'));
        }
    } catch (err: any) {
        const data = err.response?.data;
        if (data?.code === 'VERIFICATION_REQUIRED') {
            onVerificationRequired?.();
            return;
        }
        setErrorCode(data?.error_code || null);
        setError(data?.message || t('errors.couldNotSendProposal'));
    } finally {
        setIsLoading(false);
    }
  };

  if (isSuccess) {
      return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-12 text-center animate-in zoom-in-95 duration-200">
                <div className="size-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">{t('modals.proposal.sent')}</h3>
                <p className="text-slate-500 mt-2">{t('modals.proposal.connecting', { name: profile.name })}</p>
            </div>
        </div>
      );
  }

  // Loading state while checking interest status
  if (checkingStatus) {
      return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-12 text-center animate-in zoom-in-95 duration-200">
                <Loader2 size={32} className="animate-spin text-primary mx-auto mb-4" />
                <p className="text-slate-500 text-sm">{t('common.loading')}...</p>
            </div>
        </div>
      );
  }

  // Already sent / accepted — show informative popup instead of proposal form
  if (alreadySent || hasExistingInterest) {
      const isAccepted = alreadySent === 'accepted';
      const isReceived = alreadySent === 'received';
      return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-8 text-center">
                    <div className={`size-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                        isAccepted ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                    }`}>
                        {isAccepted ? <CheckCircle2 size={32} /> : <Check size={32} />}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                        {isReceived 
                            ? t('modals.proposal.receivedProposal')
                            : isAccepted 
                                ? t('modals.proposal.proposalAccepted')
                                : t('modals.proposal.alreadySent')
                        }
                    </h3>
                    <p className="text-slate-500 text-sm mb-6">
                        {isReceived
                            ? t('modals.proposal.receivedProposalDesc', { name: profile.name })
                            : isAccepted
                                ? t('modals.proposal.proposalAcceptedDesc', { name: profile.name })
                                : t('modals.proposal.alreadySentDesc', { name: profile.name })
                        }
                    </p>
                    <div className="flex flex-col gap-3">
                        {isAccepted && (
                            <button
                                onClick={() => { onClose(); onNavigate?.('messages'); }}
                                className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all"
                            >
                                <MessageSquare size={16} />
                                {t('modals.proposal.sendMessage')}
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-colors"
                        >
                            {t('common.close')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-4 duration-300">
        
        {/* Header */}
        <div className="h-16 border-b border-slate-100 flex items-center justify-between px-6 bg-slate-50">
            <div>
                <h2 className="text-lg font-bold text-slate-900">{t('modals.proposal.sendProposal')}</h2>
                <p className="text-xs text-slate-500">{t('modals.proposal.to', { name: profile.name })}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
                <X size={20} />
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Match Highlights */}
            <div className="bg-primary/5 border border-primary/10 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                    <Wand2 size={16} className="text-primary" />
                    <h3 className="text-sm font-bold text-primary">{t('modals.proposal.highlights')}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                    {profile.matchReasons?.map((reason, idx) => (
                        <span key={idx} className="px-2 py-1 bg-white border border-primary/20 rounded-md text-xs font-medium text-primary-hover shadow-sm">
                            {reason}
                        </span>
                    ))}
                    <span className="px-2 py-1 bg-white border border-primary/20 rounded-md text-xs font-medium text-primary-hover shadow-sm">
                        {profile.matchPercentage}{t('modals.proposal.compatibility')}
                    </span>
                </div>
            </div>

            {/* Message Builder */}
            <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">Write Your Message</label>
                <div className="relative">
                    <textarea 
                        className="w-full h-32 p-4 border border-slate-200 rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none"
                        placeholder={t('modals.proposal.notePlaceholder')}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    ></textarea>
                    <div className="absolute bottom-3 right-3 text-xs text-slate-400">
                        {message.length}/500
                    </div>
                </div>
                
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
                    {templates.map((tpl, i) => (
                        <button 
                            key={i} 
                            onClick={() => setMessage(tpl)}
                            className="whitespace-nowrap px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-xs text-slate-600 font-medium transition-colors"
                        >
                            {tpl}
                        </button>
                    ))}
                </div>
            </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50">
            {error && (
                <div className={`mb-4 p-4 rounded-xl text-xs ${
                    errorCode === 'quota_exhausted' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                    errorCode === 'account_deactivated' ? 'bg-orange-50 text-orange-800 border border-orange-200' :
                    errorCode === 'account_blocked' ? 'bg-red-50 text-red-800 border border-red-200' :
                    'bg-red-50 text-red-600 border border-red-100'
                }`}>
                    <div className="flex items-start gap-2">
                        {errorCode === 'quota_exhausted' ? <ArrowUpCircle size={16} className="shrink-0 mt-0.5" /> :
                         errorCode === 'account_deactivated' ? <Settings size={16} className="shrink-0 mt-0.5" /> :
                         errorCode === 'account_blocked' ? <ShieldOff size={16} className="shrink-0 mt-0.5" /> :
                         <AlertCircle size={14} className="shrink-0 mt-0.5" />}
                        <div className="flex-1">
                            <span>{error}</span>
                            {errorCode === 'quota_exhausted' && (
                                <button
                                    onClick={() => { onClose(); onNavigate?.('packages'); }}
                                    className="mt-2 block w-full text-center py-2 bg-amber-600 text-white rounded-lg font-bold text-xs hover:bg-amber-700 transition-colors"
                                >
                                    {t('modals.proposal.upgradePackage', 'Upgrade Package')}
                                </button>
                            )}
                            {errorCode === 'account_deactivated' && (
                                <button
                                    onClick={() => { onClose(); onNavigate?.('settings'); }}
                                    className="mt-2 block w-full text-center py-2 bg-orange-600 text-white rounded-lg font-bold text-xs hover:bg-orange-700 transition-colors"
                                >
                                    {t('modals.proposal.goToSettings', 'Go to Settings')}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div
                        className="size-8 rounded-full bg-slate-200 bg-cover bg-center border border-white shadow-sm"
                        style={userAvatar ? { backgroundImage: `url(${userAvatar})` } : undefined}
                    />
                    <div className="text-xs">
                        <p className="font-bold text-slate-900">{userName}</p>
                        <p className="text-slate-500">{membershipLabel} - {verificationLabel}</p>
                    </div>
                </div>
                <button 
                    onClick={handleSendProposal}
                    disabled={isLoading}
                    className="bg-primary hover:bg-primary-hover text-white px-8 py-3 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg shadow-primary/20 transition-all disabled:opacity-70"
                >
                    {isLoading ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                    {isLoading ? t('modals.proposal.sending') : t('modals.proposal.sendProposal')}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ProposalModal;
