import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, ShieldAlert, ChevronRight, Upload, Lock, Loader2 } from 'lucide-react';
import { api } from '../utils/api';

interface ReportModalProps {
  onClose: () => void;
  userName: string;
  userId: string | number;
}

const ReportModal: React.FC<ReportModalProps> = ({ onClose, userName, userId }) => {
  const { t } = useTranslation();
  const [reason, setReason] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [blockUser, setBlockUser] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reportReasons = [
    { id: 'fake', label: t('modals.report.fakeProfile'), desc: t('modals.report.fakeProfileDesc') },
    { id: 'harassment', label: t('modals.report.harassment'), desc: t('modals.report.harassmentDesc') },
    { id: 'spam', label: t('modals.report.spam'), desc: t('modals.report.spamDesc') },
    { id: 'inappropriate', label: t('modals.report.inappropriate'), desc: t('modals.report.inappropriateDesc') },
    { id: 'underage', label: t('modals.report.underage'), desc: t('modals.report.underageDesc') },
  ];

  const handleSubmit = async () => {
    if (!reason || description.trim().length < 10) return;

    const selectedReason = reportReasons.find((r) => r.id === reason)?.label || reason;
    const reportText = `${selectedReason}: ${description.trim()}`;

    try {
      setSubmitting(true);
      setError(null);
      await api.post('/member/report-member', {
        user_id: userId,
        reason: reportText
      });
      if (blockUser) {
        await api.post('/member/add-to-ignore-list', { user_id: userId });
      }
      onClose();
    } catch (err) {
      console.error('Failed to submit report', err);
      setError(t('errors.reportFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-4 duration-200">
        
        <div className="h-16 border-b border-red-100 bg-red-50 flex items-center justify-between px-6">
            <div className="flex items-center gap-2 text-red-700">
                <ShieldAlert size={20} />
                <h2 className="text-lg font-bold">{t('modals.report.title', { name: userName })}</h2>
            </div>
            <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-red-700" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
            {!reason ? (
                <div className="space-y-4">
                    <p className="text-sm font-bold text-slate-900 mb-2">{t('modals.report.whyReporting')}</p>
                    {reportReasons.map((r) => (
                        <button 
                            key={r.id}
                            onClick={() => setReason(r.id)}
                            className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-red-300 hover:bg-red-50 transition-all group"
                        >
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-slate-800 group-hover:text-red-800">{r.label}</span>
                                <ChevronRight size={16} className="text-slate-300 group-hover:text-red-400" />
                            </div>
                            <p className="text-xs text-slate-500">{r.desc}</p>
                        </button>
                    ))}
                </div>
            ) : (
                <div className="space-y-6 animate-in slide-in-from-right duration-300">
                    <button onClick={() => setReason(null)} className="text-xs font-bold text-slate-500 hover:text-slate-800 mb-2">
                        {t('modals.report.backToReasons')}
                    </button>

                    {error && (
                        <div className="text-xs font-bold text-red-600">{error}</div>
                    )}
                    
                    <div>
                        <label className="block text-sm font-bold text-slate-900 mb-2">{t('modals.report.addDetails')}</label>
                        <textarea 
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full h-32 p-3 border border-slate-300 rounded-xl text-sm focus:border-red-500 focus:ring-1 focus:ring-red-200 outline-none resize-none"
                            placeholder={t('modals.report.detailsPlaceholder')}
                        ></textarea>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-900 mb-2">{t('modals.report.attachEvidence')} <span className="ml-1 text-[10px] font-semibold text-pink-600 bg-pink-100 px-2 py-0.5 rounded-full">Optional</span></label>
                        <div className="flex items-center gap-4">
                            <button className="px-4 py-3 border border-slate-300 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                                <Upload size={16} /> {t('modals.report.uploadScreenshots')}
                            </button>
                            <span className="text-xs text-slate-400">{t('modals.report.filesSelected')}</span>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={blockUser}
                                onChange={(e) => setBlockUser(e.target.checked)}
                                className="size-4 accent-red-600"
                            />
                            <div>
                                <span className="block text-sm font-bold text-slate-900">{t('modals.report.blockUser', { name: userName })}</span>
                                <span className="text-xs text-slate-500">{t('modals.report.blockDesc')}</span>
                            </div>
                        </label>
                    </div>

                    <div className="bg-yellow-50 p-3 rounded-lg flex gap-2 text-xs text-yellow-800">
                        <Lock size={14} className="shrink-0 mt-0.5" />
                        <p>{t('modals.report.anonymous', { name: userName })}</p>
                    </div>
                </div>
            )}
        </div>

        {reason && (
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <button onClick={onClose} className="px-4 py-2 text-slate-500 font-bold text-sm hover:text-slate-800">{t('modals.report.cancel')}</button>
                <button 
                    onClick={handleSubmit}
                    disabled={description.length < 10 || submitting}
                    className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-full font-bold text-sm shadow-lg shadow-red-200"
                >
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : t('modals.report.submitReport')}
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default ReportModal;
