import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, MessageSquareOff, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../utils/api';

interface DeclineModalProps {
  onClose: () => void;
  interestId?: number | null;
  onDeclineSuccess?: () => void;
}

const DeclineModal: React.FC<DeclineModalProps> = ({ onClose, interestId, onDeclineSuccess }) => {
  const { t } = useTranslation();
  const [reason, setReason] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const reasons = [
    t('modals.decline.locationMismatch'),
    t('modals.decline.careerAlignment'),
    t('modals.decline.ageGap'),
    t('modals.decline.horoscope'),
    t('modals.decline.differentValues'),
    t('modals.decline.other')
  ];

  const handleSubmit = async () => {
    if (!interestId) {
      onClose();
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await api.post('/member/interest-reject', { interest_id: interestId, reason });
      onDeclineSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to decline interest', err);
      setError(t('errors.declineFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <MessageSquareOff className="text-slate-400" size={20} />
                {t('modals.decline.title')}
            </h2>
            <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
        </div>

        <div className="p-6">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex gap-2 mb-6">
                <AlertCircle size={16} className="text-blue-600 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800">
                    {t('modals.decline.description')}
                </p>
            </div>
            {error && (
                <div className="mb-4 text-xs font-bold text-red-600">{error}</div>
            )}

            <h3 className="text-sm font-bold text-slate-900 mb-3">{t('modals.decline.selectReason')} <span className="ml-1 text-[10px] font-semibold text-pink-600 bg-pink-100 px-2 py-0.5 rounded-full">Optional</span></h3>
            <div className="space-y-2">
                {reasons.map(r => (
                    <label key={r} className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                        <input 
                            type="radio" 
                            name="declineReason" 
                            className="accent-primary size-4"
                            checked={reason === r}
                            onChange={() => setReason(r)}
                        />
                        <span className="text-sm text-slate-700">{r}</span>
                    </label>
                ))}
            </div>

            <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">{t('modals.decline.messagePreview')}</h4>
                <p className="text-sm text-slate-600 italic">
                    {t('modals.decline.defaultMessage')}
                </p>
            </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-slate-500 font-bold text-sm hover:text-slate-800">{t('modals.decline.cancel')}</button>
            <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-bold text-sm disabled:opacity-60"
            >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : t('modals.decline.sendDecline')}
            </button>
        </div>
      </div>
    </div>
  );
};

export default DeclineModal;
