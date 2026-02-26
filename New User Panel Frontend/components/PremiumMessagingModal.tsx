import React from 'react';
import { Crown, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PremiumMessagingModalProps {
  open: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

const PremiumMessagingModal: React.FC<PremiumMessagingModalProps> = ({ open, onClose, onUpgrade }) => {
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between px-5 pt-5">
          <div className="flex items-center gap-2 text-amber-600">
            <Crown size={20} />
            <h3 className="text-lg font-bold text-slate-900">{t('messages.premiumOnlyTitle')}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700" aria-label="close">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4">
          <p className="text-sm text-slate-600 leading-relaxed">{t('messages.premiumOnlyBody')}</p>
        </div>

        <div className="px-5 pb-5 flex items-center gap-3">
          <button
            onClick={onUpgrade}
            className="flex-1 rounded-xl bg-primary text-white text-sm font-bold py-2.5 hover:bg-primary/90 transition-colors"
          >
            {t('messages.upgradeNow')}
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold py-2.5 hover:bg-slate-200 transition-colors"
          >
            {t('messages.notNow')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PremiumMessagingModal;
