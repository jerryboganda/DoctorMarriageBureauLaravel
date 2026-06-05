import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Crown, Gift, Sparkles, Wallet, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { MODAL_BACKDROP, MODAL_PANEL, BTN_HOVER, BTN_TAP } from '../utils/motion';

interface PremiumMessagingModalProps {
    open: boolean;
    onClose: () => void;
    onChooseReferral: () => void;
    onChoosePackage: () => void;
}

type UpgradeStep = 'intro' | 'options';

const PremiumMessagingModal: React.FC<PremiumMessagingModalProps> = ({
    open,
    onClose,
    onChooseReferral,
    onChoosePackage,
}) => {
    const { t } = useTranslation();
    const [step, setStep] = useState<UpgradeStep>('intro');

    useEffect(() => {
        if (open) {
            setStep('intro');
        }
    }, [open]);

    if (!open) return null;

    return (
        <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4"
            variants={MODAL_BACKDROP}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
        >
            <motion.div
                className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
                variants={MODAL_PANEL}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="relative border-b border-slate-100 bg-gradient-to-br from-amber-50 via-white to-rose-50 px-5 pt-5 pb-4 sm:px-6">
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 rounded-full bg-white/80 p-2 text-slate-400 transition-colors hover:text-slate-700"
                        aria-label="close"
                    >
                        <X size={18} />
                    </button>

                    <div className="pr-10">
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/80 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-700">
                            <Crown size={14} />
                            {t('messages.premiumOnlyBadge')}
                        </div>
                        <h3 className="text-xl font-black text-slate-900 sm:text-2xl">
                            {step === 'intro'
                                ? t('messages.premiumOnlyTitle')
                                : t('messages.upgradeChoiceTitle')}
                        </h3>
                        <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
                            {step === 'intro'
                                ? t('messages.premiumOnlyBody')
                                : t('messages.upgradeChoiceBody')}
                        </p>
                    </div>
                </div>

                <div className="px-5 py-5 sm:px-6 sm:py-6">
                    {step === 'intro' ? (
                        <>
                            <div className="grid gap-3 sm:grid-cols-3">
                                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                                    <div className="mb-2 flex items-center gap-2 text-amber-700">
                                        <Sparkles size={16} />
                                        <span className="text-xs font-bold uppercase tracking-wide">
                                            {t('messages.premiumBenefit1Label')}
                                        </span>
                                    </div>
                                    <p className="text-sm font-semibold text-slate-900">
                                        {t('messages.premiumBenefit1Title')}
                                    </p>
                                    <p className="mt-1 text-xs leading-relaxed text-slate-600">
                                        {t('messages.premiumBenefit1Body')}
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
                                    <div className="mb-2 flex items-center gap-2 text-rose-700">
                                        <Gift size={16} />
                                        <span className="text-xs font-bold uppercase tracking-wide">
                                            {t('messages.premiumBenefit2Label')}
                                        </span>
                                    </div>
                                    <p className="text-sm font-semibold text-slate-900">
                                        {t('messages.premiumBenefit2Title')}
                                    </p>
                                    <p className="mt-1 text-xs leading-relaxed text-slate-600">
                                        {t('messages.premiumBenefit2Body')}
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <div className="mb-2 flex items-center gap-2 text-slate-700">
                                        <Wallet size={16} />
                                        <span className="text-xs font-bold uppercase tracking-wide">
                                            {t('messages.premiumBenefit3Label')}
                                        </span>
                                    </div>
                                    <p className="text-sm font-semibold text-slate-900">
                                        {t('messages.premiumBenefit3Title')}
                                    </p>
                                    <p className="mt-1 text-xs leading-relaxed text-slate-600">
                                        {t('messages.premiumBenefit3Body')}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 flex items-center gap-3">
                                <button
                                    onClick={() => setStep('options')}
                                    className="flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-white transition-colors hover:bg-primary/90"
                                >
                                    {t('messages.upgradeNow')}
                                </button>
                                <button
                                    onClick={onClose}
                                    className="flex-1 rounded-xl bg-slate-100 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200"
                                >
                                    {t('messages.notNow')}
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="grid gap-4 md:grid-cols-2">
                                <motion.button
                                    type="button"
                                    whileHover={BTN_HOVER}
                                    whileTap={BTN_TAP}
                                    onClick={onChooseReferral}
                                    className="group rounded-3xl border border-rose-200 bg-gradient-to-br from-rose-50 via-white to-pink-50 p-5 text-left shadow-sm transition-all hover:border-rose-300 hover:shadow-lg"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex min-w-0 items-start gap-3">
                                            <div className="mt-0.5 flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-md">
                                                <Gift size={22} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-rose-600">
                                                    {t('messages.referralOptionBadge')}
                                                </p>
                                                <h4 className="mt-1 text-lg font-black text-slate-900">
                                                    {t('messages.referralOptionTitle')}
                                                </h4>
                                                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                                    {t('messages.referralOptionBody')}
                                                </p>
                                            </div>
                                        </div>
                                        <ArrowRight
                                            size={18}
                                            className="mt-1 shrink-0 text-rose-400 transition-transform group-hover:translate-x-1"
                                        />
                                    </div>

                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-rose-700 shadow-sm ring-1 ring-rose-100">
                                            {t('messages.referralOptionChip1')}
                                        </span>
                                        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-rose-700 shadow-sm ring-1 ring-rose-100">
                                            {t('messages.referralOptionChip2')}
                                        </span>
                                    </div>
                                </motion.button>

                                <motion.button
                                    type="button"
                                    whileHover={BTN_HOVER}
                                    whileTap={BTN_TAP}
                                    onClick={onChoosePackage}
                                    className="group rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-amber-50 p-5 text-left shadow-sm transition-all hover:border-slate-300 hover:shadow-lg"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex min-w-0 items-start gap-3">
                                            <div className="mt-0.5 flex size-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-md">
                                                <Wallet size={22} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                                                    {t('messages.packageOptionBadge')}
                                                </p>
                                                <h4 className="mt-1 text-lg font-black text-slate-900">
                                                    {t('messages.packageOptionTitle')}
                                                </h4>
                                                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                                    {t('messages.packageOptionBody')}
                                                </p>
                                            </div>
                                        </div>
                                        <ArrowRight
                                            size={18}
                                            className="mt-1 shrink-0 text-slate-400 transition-transform group-hover:translate-x-1"
                                        />
                                    </div>

                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200">
                                            {t('messages.packageOptionChip1')}
                                        </span>
                                        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200">
                                            {t('messages.packageOptionChip2')}
                                        </span>
                                    </div>
                                </motion.button>
                            </div>

                            <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                                <button
                                    onClick={() => setStep('intro')}
                                    className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200"
                                >
                                    <ArrowLeft size={16} />
                                    {t('messages.back')}
                                </button>
                                <button
                                    onClick={onClose}
                                    className="text-sm font-semibold text-slate-500 transition-colors hover:text-slate-700"
                                >
                                    {t('messages.notNow')}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default PremiumMessagingModal;
