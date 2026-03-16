import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Plane, Loader2, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

interface TravelModeModalProps {
  onClose: () => void;
  onEnable: (city: string, country: string) => void;
  loading: boolean;
  currentCity: string;
  currentCountry: string;
}

const TravelModeModal: React.FC<TravelModeModalProps> = ({ onClose, onEnable, loading, currentCity, currentCountry }) => {
  const { t } = useTranslation();
  const [city, setCity] = useState(currentCity || '');
  const [country, setCountry] = useState(currentCountry || '');

  const canSubmit = city.trim().length > 0 && country.trim().length > 0 && !loading;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Plane size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{t('discovery.travelModalTitle')}</h2>
              <p className="text-sm text-slate-500">{t('discovery.travelModalDesc')}</p>
            </div>
          </div>
          <button onClick={onClose} disabled={loading} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              <MapPin size={14} className="inline mr-1" />
              {t('discovery.cityPlaceholder')}
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={t('discovery.cityPlaceholder')}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-slate-800 placeholder-slate-400 transition-all"
              disabled={loading}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              <MapPin size={14} className="inline mr-1" />
              {t('discovery.countryPlaceholder')}
            </label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder={t('discovery.countryPlaceholder')}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-slate-800 placeholder-slate-400 transition-all"
              disabled={loading}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            {t('discovery.cancel')}
          </button>
          <button
            onClick={() => onEnable(city.trim(), country.trim())}
            disabled={!canSubmit}
            className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>{t('discovery.enableTravelMode')}</span>
              </>
            ) : (
              <>
                <Plane size={16} />
                <span>{t('discovery.enableTravelMode')}</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default TravelModeModal;
