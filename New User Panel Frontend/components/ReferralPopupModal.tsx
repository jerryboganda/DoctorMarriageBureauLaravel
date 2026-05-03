import React from 'react';
import { X, Gift, Share2, UserPlus, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import { MODAL_BACKDROP, MODAL_PANEL, BTN_TAP, BTN_HOVER } from '../utils/motion';
import { useTranslation } from 'react-i18next';

export interface ReferralPopupConfig {
  enabled: boolean;
  headline: string;
  body: string;
  cta_text: string;
  bonus_days: number;
  referrals_needed: number;
}

interface ReferralPopupModalProps {
  onClose: () => void;
  onNavigate: (view: string) => void;
  popupConfig: ReferralPopupConfig;
}

const steps = [
  { icon: Share2, labelKey: 'referralPopup.step1', descKey: 'referralPopup.step1Desc' },
  { icon: UserPlus, labelKey: 'referralPopup.step2', descKey: 'referralPopup.step2Desc' },
  { icon: Award, labelKey: 'referralPopup.step3', descKey: 'referralPopup.step3Desc' },
];

const ReferralPopupModal: React.FC<ReferralPopupModalProps> = ({ onClose, onNavigate, popupConfig }) => {
  const { t } = useTranslation();

  const handleCTA = () => {
    onClose();
    onNavigate('referral');
  };

  return (
    <motion.div
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
      variants={MODAL_BACKDROP}
      initial="hidden"
      animate="visible"
      exit="exit"
      onClick={onClose}
    >
      <motion.div
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        variants={MODAL_PANEL}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative pt-8 pb-4 px-6 bg-gradient-to-br from-pink-50 via-white to-emerald-50">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
          >
            <X size={18} />
          </button>

          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg">
              <Gift size={28} className="text-white" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
              {popupConfig.headline || t('referralPopup.defaultHeadline')}
            </h2>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-5 overflow-y-auto max-h-[60vh]">
          {/* Description */}
          <p className="text-sm text-slate-600 text-center leading-relaxed">
            {popupConfig.body || t('referralPopup.defaultBody', { days: popupConfig.bonus_days, count: popupConfig.referrals_needed })}
          </p>

          {/* Reward Highlight */}
          <div className="bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 rounded-2xl p-4 text-center">
            <p className="text-xs font-medium text-pink-600 uppercase tracking-wide mb-1">
              {t('referralPopup.rewardLabel')}
            </p>
            <p className="text-2xl font-bold text-pink-700">
              {popupConfig.bonus_days} {t('referralPopup.daysOfPremium')}
            </p>
            <p className="text-xs text-pink-500 mt-1">
              {t('referralPopup.referralsNeeded', { count: popupConfig.referrals_needed })}
            </p>
          </div>

          {/* How It Works Steps */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">
              {t('referralPopup.howItWorks')}
            </h3>
            <div className="grid gap-3">
              {steps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div
                    key={idx}
                    className="flex items-start gap-3 bg-slate-50 rounded-xl p-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                      <Icon size={16} className="text-pink-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{t(step.labelKey)}</p>
                      <p className="text-xs text-slate-500 leading-relaxed">{t(step.descKey)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CTA Button */}
          <motion.button
            whileHover={BTN_HOVER}
            whileTap={BTN_TAP}
            onClick={handleCTA}
            className="w-full py-3.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-semibold rounded-xl shadow-lg shadow-pink-200 transition-all text-sm"
          >
            {popupConfig.cta_text || t('referralPopup.defaultCTA')}
          </motion.button>

          {/* Dismiss Link */}
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors text-center pb-1"
          >
            {t('referralPopup.maybeLater')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ReferralPopupModal;
