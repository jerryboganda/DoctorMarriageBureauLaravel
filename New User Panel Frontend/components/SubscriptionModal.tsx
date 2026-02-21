import React, { useEffect, useMemo, useState } from 'react';
import { X, Check, Star, Crown, Users, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { MODAL_BACKDROP, MODAL_PANEL, BTN_TAP, BTN_HOVER } from '../utils/motion';
import { api } from '../utils/api';
import { useTranslation } from 'react-i18next';

interface SubscriptionModalProps {
  onClose: () => void;
  onSelectPlan: (planId: number, planName: string, price: number) => void;
  onSelectAddon: (addonId: number, addonName: string, price: number) => void;
}

type PackagePlan = {
  id: number;
  name: string;
  price: number;
  priceText?: string;
  validity?: number;
  features: string[];
  recommended?: boolean;
  color: string;
  btnColor: string;
  icon: React.ReactNode;
};

const PLAN_STYLES = [
  {
    color: 'border-emerald-200 bg-emerald-50',
    btnColor: 'bg-emerald-600 hover:bg-emerald-700',
    icon: <Star size={24} className="text-emerald-600 fill-emerald-600" />,
  },
  {
    color: 'border-slate-900 bg-slate-50',
    btnColor: 'bg-slate-900 hover:bg-slate-800',
    icon: <Crown size={24} className="text-slate-900 fill-slate-900" />,
  },
  {
    color: 'border-purple-200 bg-purple-50',
    btnColor: 'bg-purple-600 hover:bg-purple-700',
    icon: <Users size={24} className="text-purple-600" />,
  },
];

const buildFeatures = (pkg: any, t: (key: string) => string) => {
  const features = [
    `${pkg.express_interest ?? 0} ${t('billing.subscription.expressInterests')}`,
    `${pkg.photo_gallery ?? 0} ${t('billing.subscription.photoGalleryViews')}`,
    `${pkg.contact ?? 0} ${t('billing.subscription.contactViews')}`,
    `${pkg.profile_viewers_view ?? 0} ${t('billing.subscription.profileViewerViews')}`,
    `${pkg.profile_image_view ?? 0} ${t('billing.subscription.profileImageViews')}`,
    `${pkg.gallery_image_view ?? 0} ${t('billing.subscription.galleryImageViews')}`,
    pkg.auto_profile_match ? t('billing.subscription.autoProfileMatch') : null,
  ];

  return features.filter(Boolean) as string[];
};

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ onClose, onSelectPlan, onSelectAddon }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'plans' | 'addons'>('plans');
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addons, setAddons] = useState<any[]>([]);
  const [loadingAddons, setLoadingAddons] = useState(true);
  const [addonError, setAddonError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const fetchPackages = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get('/packages');
        if (!isActive) return;
        setPackages(response.data?.data ?? []);
      } catch (err: any) {
        if (!isActive) return;
        setError(err.response?.data?.message || 'Failed to load packages.');
      } finally {
        if (isActive) setLoading(false);
      }
    };

    fetchPackages();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    const fetchAddons = async () => {
      try {
        setLoadingAddons(true);
        setAddonError(null);
        const response = await api.get('/addons');
        if (!isActive) return;
        setAddons(response.data?.data ?? []);
      } catch (err: any) {
        if (!isActive) return;
        setAddonError(err.response?.data?.message || 'Failed to load add-ons.');
      } finally {
        if (isActive) setLoadingAddons(false);
      }
    };

    fetchAddons();

    return () => {
      isActive = false;
    };
  }, []);

  const plans: PackagePlan[] = useMemo(() => {
    if (!packages.length) return [];
    const maxPrice = Math.max(...packages.map((pkg) => Number(pkg.price ?? 0)));

    return packages.map((pkg, index) => {
      const style = PLAN_STYLES[index % PLAN_STYLES.length];
      const priceValue = Number(pkg.price ?? 0);
      return {
        id: Number(pkg.package_id ?? pkg.id ?? 0),
        name: pkg.name ?? 'Premium Plan',
        price: Number.isFinite(priceValue) ? priceValue : 0,
        priceText: pkg.price_text,
        validity: pkg.validity,
        features: buildFeatures(pkg, t),
        recommended: priceValue === maxPrice && packages.length > 1,
        color: style.color,
        btnColor: style.btnColor,
        icon: style.icon,
      };
    });
  }, [packages]);

  const addonItems = useMemo(() => {
    if (!addons.length) return [];
    return addons.map((addon) => {
      const priceValue = Number(addon.price ?? 0);
      return {
        id: Number(addon.addon_id ?? addon.id ?? 0),
        name: addon.name ?? 'Add-on',
        description: addon.description ?? '',
        price: Number.isFinite(priceValue) ? priceValue : 0,
        priceText: addon.price_text,
        badge: addon.badge,
      };
    });
  }, [addons]);

  return (
    <motion.div 
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
      variants={MODAL_BACKDROP}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <motion.div 
        className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col h-full max-h-[90vh] md:h-auto md:max-h-[90vh]"
        variants={MODAL_PANEL}
      >
        
        <div className="flex flex-col items-center justify-center pt-8 pb-4 px-6 relative bg-white shrink-0">
             <button onClick={onClose} className="absolute right-6 top-6 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                <X size={20} />
            </button>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-2 text-center">{t('billing.subscription.title')}</h2>
            <p className="text-slate-500 text-center text-sm">{t('billing.subscription.subtitle')}</p>
            
            <div className="flex gap-1 bg-slate-100 p-1 rounded-full mt-6">
                <button 
                    onClick={() => setActiveTab('plans')}
                    className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'plans' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    {t('billing.subscription.membershipPlans')}
                </button>
                <button 
                    onClick={() => setActiveTab('addons')}
                    className={`px-6 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'addons' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <ShieldCheck size={14} className="fill-current" /> {t('billing.subscription.addons')}
                </button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50">
            {activeTab === 'plans' ? (
                <>
                    {loading && (
                        <div className="flex items-center justify-center py-16 text-slate-500">
                            <Loader2 className="animate-spin mr-2" size={20} />
                            Loading plans...
                        </div>
                    )}
                    {!loading && error && (
                        <div className="text-center py-12 text-sm text-red-600">{error}</div>
                    )}
                    {!loading && !error && plans.length === 0 && (
                        <div className="text-center py-12 text-slate-500">{t('billing.subscription.noPlans')}</div>
                    )}

                    {!loading && !error && plans.length > 0 && (
                        <>
                            <p className="text-center text-xs text-slate-500 mb-8">
                                {t('billing.subscription.validityNote')}
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                                {plans.map((plan) => (
                                    <motion.div 
                                        whileHover={{ y: -5 }}
                                        key={plan.id} 
                                        className={`relative flex flex-col bg-white rounded-2xl p-6 border-2 shadow-lg transition-transform ${plan.color} ${plan.recommended ? 'ring-2 ring-offset-2 ring-slate-900' : ''}`}
                                    >
                                        {plan.recommended && (
                                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm">
                                                {t('billing.subscription.mostPopular')}
                                            </div>
                                        )}
                                        <div className="mb-4">
                                            <div className="flex items-center gap-3 mb-2">
                                                {plan.icon}
                                                <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                                            </div>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-3xl font-black text-slate-900">
                                                    {plan.priceText ?? `Rs.${plan.price.toLocaleString()}`}
                                                </span>
                                                {plan.validity ? (
                                                    <span className="text-sm text-slate-500 font-medium">/ {plan.validity} days</span>
                                                ) : null}
                                            </div>
                                        </div>
                                        
                                        <ul className="space-y-3 mb-8 flex-1">
                                            {plan.features.slice(0, 5).map((feat, idx) => (
                                                <li key={idx} className="flex items-start gap-3 text-sm text-slate-700">
                                                    <Check size={16} className="text-green-600 shrink-0 mt-0.5" strokeWidth={3} />
                                                    {feat}
                                                </li>
                                            ))}
                                        </ul>

                                        <motion.button 
                                            whileTap={BTN_TAP}
                                            onClick={() => onSelectPlan(plan.id, plan.name, plan.price)}
                                            className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${plan.btnColor}`}
                                        >
                                            {t('billing.subscription.selectPlan')} <ArrowRight size={16} />
                                        </motion.button>
                                    </motion.div>
                                ))}
                            </div>
                        </>
                    )}
                </>
            ) : (
                <div className="max-w-3xl mx-auto space-y-6">
                    {loadingAddons && (
                        <div className="flex items-center justify-center py-16 text-slate-500">
                            <Loader2 className="animate-spin mr-2" size={20} />
                            Loading add-ons...
                        </div>
                    )}
                    {!loadingAddons && addonError && (
                        <div className="text-center py-12 text-sm text-red-600">{addonError}</div>
                    )}
                    {!loadingAddons && !addonError && addonItems.length === 0 && (
                        <div className="text-center py-12 text-slate-500">{t('billing.subscription.noAddons')}</div>
                    )}

                    {!loadingAddons && !addonError && addonItems.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {addonItems.map((addon) => (
                                <motion.div whileHover={BTN_HOVER} key={addon.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4 group hover:border-primary/50 transition-all">
                                    <div className="flex items-start gap-4">
                                        <div className="size-12 rounded-full bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                                            <ShieldCheck size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-slate-900">{addon.name}</h4>
                                                {addon.badge ? (
                                                    <span className="text-[10px] font-bold uppercase tracking-wide text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                                        {addon.badge}
                                                    </span>
                                                ) : null}
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1">{addon.description || t('billing.subscription.addonUpgrade')}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm font-bold text-slate-900">
                                            {addon.priceText ?? `Rs.${addon.price.toLocaleString()}`}
                                        </div>
                                        <motion.button
                                            whileTap={BTN_TAP}
                                            onClick={() => onSelectAddon(addon.id, addon.name, addon.price)}
                                            className="px-4 py-2 rounded-xl font-bold text-xs bg-slate-900 text-white hover:bg-slate-800"
                                        >
                                            {t('billing.subscription.purchaseAddon')}
                                        </motion.button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SubscriptionModal;
