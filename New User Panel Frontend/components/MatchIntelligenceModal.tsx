import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Zap, CheckCircle2, AlertTriangle, UserCheck, BrainCircuit, FileText, ArrowLeftRight, Loader2 } from 'lucide-react';
import { ProfileMatch, MatchIntelligence } from '../types';
import { api } from '../utils/api';

interface MatchIntelligenceModalProps {
  profile: ProfileMatch;
  onClose: () => void;
}

const MatchIntelligenceModal: React.FC<MatchIntelligenceModalProps> = ({ profile, onClose }) => {
  const { t } = useTranslation();
  const [showFriction, setShowFriction] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MatchIntelligence | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // Guard: if interest already exists, pre-set sent state
  const hasExistingInterest = profile.interestStatus === 0 || profile.interestStatus === '0' || profile.interestStatus === 'do_response';

  useEffect(() => {
    if (hasExistingInterest) setSent(true);
  }, [hasExistingInterest]);

  useEffect(() => {
    const fetchIntelligence = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/match-intelligence/${profile.id}`);
        if (response.data.success) {
            setData(response.data.data);
        } else {
            setError(t('modals.matchIntelligence.failedRetrieve'));
        }
      } catch (err: any) {
        console.error('Failed to fetch match intelligence', err);
        setError(t('modals.matchIntelligence.couldNotAnalyze'));
      } finally {
        setLoading(false);
      }
    };

    fetchIntelligence();
  }, [profile.id]);

  useEffect(() => {
    setSent(false);
    setSendError(null);
  }, [profile.id]);

  const handleSendProposal = async () => {
    if (sending || sent) return;
    try {
      setSending(true);
      setSendError(null);
      await api.post('/member/express-interest', { user_id: profile.id });
      setSent(true);
    } catch (err: any) {
      console.error('Failed to send proposal', err);
      setSendError(t('modals.matchIntelligence.couldNotSendProposal'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="h-16 border-b border-slate-100 flex items-center justify-between px-6 bg-white shrink-0">
            <div className="flex items-center gap-3">
                <div className="size-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <BrainCircuit size={20} />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-slate-900">{t('modals.matchIntelligence.title')}</h2>
                    <p className="text-xs text-slate-500">{data?.generatedAt || t('modals.matchIntelligence.analyzing')}</p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
            {loading ? (
                <div className="h-64 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="animate-spin text-primary" size={40} />
                    <p className="text-slate-500 font-medium">{t('modals.matchIntelligence.analyzingDeep')}</p>
                </div>
            ) : error || !data ? (
                <div className="h-64 flex flex-col items-center justify-center gap-4 text-center">
                    <div className="size-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
                        <AlertTriangle size={32} />
                    </div>
                    <p className="text-slate-600 font-medium max-w-xs">{error || t('modals.matchIntelligence.failedLoad')}</p>
                    <button onClick={() => window.location.reload()} className="text-primary font-bold hover:underline">{t('modals.matchIntelligence.retry')}</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    
                    {/* Left Col: The Score */}
                    <div className="md:col-span-1 flex flex-col items-center text-center border-r border-slate-100 pr-0 md:pr-8">
                        <div className="relative size-40 mb-6">
                            <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#d41173" strokeWidth="3" strokeDasharray={`${data.totalScore}, 100`} />
                            </svg>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                                <span className="text-4xl font-black text-slate-900">{data.totalScore}%</span>
                                <span className="text-xs font-bold text-primary uppercase tracking-wider">{t('modals.matchIntelligence.compatible')}</span>
                            </div>
                        </div>

                        <div className="w-full space-y-4">
                            {data.categories.map((cat, idx) => (
                                <div key={idx} className="w-full">
                                    <div className="flex justify-between items-end mb-1">
                                        <span className="text-xs font-bold text-slate-700">{cat.name}</span>
                                        <span className="text-xs font-bold text-slate-900">{cat.score}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-slate-800 rounded-full" style={{ width: `${cat.score}%` }}></div>
                                    </div>
                                    <div className="text-[10px] text-slate-400 text-left mt-0.5">{t('modals.matchIntelligence.weight', { value: cat.weight })}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Col: Analysis */}
                    <div className="md:col-span-2 space-y-8">
                        
                        {/* Mutual Fit */}
                        <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                            <div className="flex items-center gap-2 mb-4">
                                <ArrowLeftRight size={18} className="text-slate-500" />
                                <h3 className="font-bold text-slate-900 text-sm">{t('modals.matchIntelligence.mutualFit')}</h3>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex-1 text-center">
                                    <div className="text-2xl font-bold text-slate-900">{data.mutualFit.youMeetThem}%</div>
                                    <div className="text-xs text-slate-500">{t('modals.matchIntelligence.youMeetThem')}</div>
                                </div>
                                <div className="h-8 w-px bg-slate-200"></div>
                                <div className="flex-1 text-center">
                                    <div className="text-2xl font-bold text-slate-900">{data.mutualFit.theyMeetYou}%</div>
                                    <div className="text-xs text-slate-500">{t('modals.matchIntelligence.theyMeetYou')}</div>
                                </div>
                            </div>
                        </div>

                        {/* Reasons */}
                        <div>
                            <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
                                <Zap size={16} className="text-yellow-500 fill-yellow-500" />
                                {t('modals.matchIntelligence.topReasons')}
                            </h3>
                            <ul className="space-y-2">
                                {data.topReasons.map((reason, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                                        <CheckCircle2 size={16} className="text-green-500 shrink-0 mt-0.5" />
                                        {reason}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Friction */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                    <AlertTriangle size={16} className="text-orange-500" />
                                    {t('modals.matchIntelligence.frictionPoints')}
                                </h3>
                                <button 
                                    onClick={() => setShowFriction(!showFriction)}
                                    className="text-xs font-bold text-primary hover:underline"
                                >
                                    {showFriction ? t('modals.matchIntelligence.hide') : t('modals.matchIntelligence.viewOptIn')}
                                </button>
                            </div>
                            
                            <div className={`transition-all duration-300 ${showFriction ? 'opacity-100' : 'opacity-50 blur-sm select-none'}`}>
                                <ul className="space-y-2">
                                    {data.frictionPoints.map((point, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                                            <div className="size-1.5 rounded-full bg-orange-400 mt-2 shrink-0"></div>
                                            {point}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Agent Notes */}
                        {data.agentNotes && (
                            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <UserCheck size={16} className="text-purple-600" />
                                    <h3 className="font-bold text-purple-900 text-sm">{t('modals.matchIntelligence.matchmakerNote')}</h3>
                                </div>
                                <p className="text-sm text-purple-800 italic">"{data.agentNotes}"</p>
                            </div>
                        )}

                    </div>
                </div>
            )}
        </div>

        {sendError && (
            <div className="px-6 pb-2 text-xs text-red-600">{sendError}</div>
        )}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
             <button onClick={onClose} className="px-4 py-2 text-slate-600 font-bold text-sm hover:text-slate-900">{t('modals.matchIntelligence.close')}</button>
             <button
                onClick={handleSendProposal}
                disabled={sending || sent}
                className="px-6 py-2 bg-primary text-white rounded-full font-bold text-sm shadow-lg hover:bg-primary-hover disabled:opacity-60"
             >
                {sending ? t('modals.matchIntelligence.sending') : sent ? t('modals.matchIntelligence.proposalSent') : t('modals.matchIntelligence.sendProposal')}
             </button>
        </div>

      </div>
    </div>
  );
};

export default MatchIntelligenceModal;
