import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

interface LanguageToggleProps {
  /** Compact mode shows only icon + short label */
  compact?: boolean;
  className?: string;
}

const LanguageToggle: React.FC<LanguageToggleProps> = ({ compact = false, className = '' }) => {
  const { i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';

  const toggle = () => {
    i18n.changeLanguage(isUrdu ? 'en' : 'ur');
  };

  if (compact) {
    return (
      <button
        onClick={toggle}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium
          text-slate-600 hover:text-primary hover:bg-pink-50 transition-colors ${className}`}
        title={isUrdu ? 'Switch to English' : 'اردو میں تبدیل کریں'}
        aria-label="Toggle language"
      >
        <Globe className="w-3.5 h-3.5" />
        <span>{isUrdu ? 'EN' : 'اردو'}</span>
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
        text-slate-600 hover:text-primary hover:bg-pink-50 transition-colors ${className}`}
      title={isUrdu ? 'Switch to English' : 'اردو میں تبدیل کریں'}
      aria-label="Toggle language"
    >
      <Globe className="w-5 h-5 shrink-0" />
      <span>{isUrdu ? 'English' : 'اردو'}</span>
    </button>
  );
};

export default LanguageToggle;
