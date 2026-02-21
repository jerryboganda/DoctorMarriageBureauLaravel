import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, FileText, Image, Users, Send, Wand2, Check, Loader2, AlertCircle, CheckCircle2, MessageSquare } from 'lucide-react';
import { ProfileMatch } from '../types';
import { api } from '../utils/api';

interface ProposalModalProps {
  profile: ProfileMatch;
  onClose: () => void;
  onNavigate?: (view: string) => void;
  onSent?: (profileId: string) => void;
}

const ProposalModal: React.FC<ProposalModalProps> = ({ profile, onClose, onNavigate, onSent }) => {
  const { t } = useTranslation();
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState({
    biodata: true,
    familyAlbum: false,
    references: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [alreadySent, setAlreadySent] = useState<'pending' | 'accepted' | 'received' | null>(null);

  // Guard: if interest already exists, don't allow sending again
  const hasExistingInterest = profile.interestStatus === 0 || profile.interestStatus === '0' || profile.interestStatus === 'do_response';

  // Check interest status on mount via API
  useEffect(() => {
    const checkInterestStatus = async () => {
      try {
        const res = await api.get(`/member/member-info/${profile.id}`);
        if (res.data?.data) {
          const info = res.data.data;
          const status = info.interest_status;
          const text = (info.interest_text || '').toLowerCase();
          if (status === 'mutual' || (status === 'sent interest' && text.includes('accepted'))) {
            setAlreadySent('accepted');
          } else if (status === 'sent interest') {
            setAlreadySent('pending');
          } else if (status === 'received interest') {
            setAlreadySent('received');
          } else if (status === 0 || status === '0') {
            const isAccepted = text.includes('accepted');
            setAlreadySent(isAccepted ? 'accepted' : 'pending');
          } else if (status === 'do_response') {
            setAlreadySent('received');
          }
        }
      } catch {
        // If check fails, allow normal flow
      } finally {
        setCheckingStatus(false);
      }
    };
    checkInterestStatus();
  }, [profile.id]);

  const templates = [
    t('modals.proposal.template1'),
    t('modals.proposal.template2'),
    t('modals.proposal.template3')
  ];

  const handleSendProposal = async () => {
    if (hasExistingInterest) return;
    setIsLoading(true);
    setError('');
    try {
        const response = await api.post('/member/express-interest', {
            user_id: profile.id,
            message: message // Note: current API might ignore this, but good for future-proofing
        });

        if (response.data.result) {
            onSent?.(String(profile.id));
            setIsSuccess(true);
            setTimeout(() => {
                onClose();
            }, 2000);
        } else {
            setError(response.data.message || t('errors.couldNotSendProposal'));
        }
    } catch (err: any) {
        setError(err.response?.data?.message || t('errors.couldNotSendProposal'));
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
                <label className="block text-sm font-bold text-slate-900 mb-2">{t('modals.proposal.personalNote')}</label>
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

            {/* Attachments */}
            <div>
                <label className="block text-sm font-bold text-slate-900 mb-3">{t('modals.proposal.packetAttachments')}</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <AttachmentOption 
                        icon={<FileText size={20} />} 
                        label={t('modals.proposal.standardBiodata')} 
                        subLabel={t('modals.proposal.autoGeneratedPDF')}
                        selected={attachments.biodata}
                        onClick={() => setAttachments({...attachments, biodata: !attachments.biodata})}
                    />
                    <AttachmentOption 
                        icon={<Image size={20} />} 
                        label={t('modals.proposal.familyAlbum')} 
                        subLabel={t('modals.proposal.accessToPhotos')}
                        selected={attachments.familyAlbum}
                        onClick={() => setAttachments({...attachments, familyAlbum: !attachments.familyAlbum})}
                    />
                    <AttachmentOption 
                        icon={<Users size={20} />} 
                        label={t('modals.proposal.referenceLetters')} 
                        subLabel={t('modals.proposal.verifiedReferences')}
                        selected={attachments.references}
                        onClick={() => setAttachments({...attachments, references: !attachments.references})}
                    />
                </div>
            </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50">
            {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle size={14} />
                    <span>{error}</span>
                </div>
            )}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="size-8 rounded-full bg-slate-200" />
                    <div className="text-xs">
                        <p className="font-bold text-slate-900">{t('modals.proposal.memberAccount')}</p>
                        <p className="text-slate-500">{t('modals.proposal.verifiedIdentity')}</p>
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

const AttachmentOption: React.FC<{
    icon: React.ReactNode, 
    label: string, 
    subLabel: string, 
    selected: boolean, 
    onClick: () => void
}> = ({ icon, label, subLabel, selected, onClick }) => (
    <div 
        onClick={onClick}
        className={`
            p-3 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3
            ${selected 
                ? 'border-primary bg-primary/5' 
                : 'border-slate-100 hover:border-slate-300'
            }
        `}
    >
        <div className={`p-2 rounded-lg ${selected ? 'bg-white text-primary' : 'bg-slate-100 text-slate-400'}`}>
            {icon}
        </div>
        <div>
            <div className="flex items-center gap-2">
                <p className={`text-sm font-bold ${selected ? 'text-slate-900' : 'text-slate-500'}`}>{label}</p>
                {selected && <Check size={12} className="text-primary" />}
            </div>
            <p className="text-[10px] text-slate-400">{subLabel}</p>
        </div>
    </div>
);

export default ProposalModal;
