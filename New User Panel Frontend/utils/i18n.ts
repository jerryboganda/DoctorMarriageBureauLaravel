import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from '../locales/en.json';
import ur from '../locales/ur.json';

// Apply RTL/LTR direction to the document root
function applyDirection(lang: string) {
  const dir = lang === 'ur' ? 'rtl' : 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = lang;

  // Apply Noto Sans Arabic font for Urdu
  if (lang === 'ur') {
    document.documentElement.style.fontFamily = '"Noto Sans Arabic", "Noto Sans", sans-serif';
  } else {
    document.documentElement.style.fontFamily = '"Inter", sans-serif';
  }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ur: { translation: ur },
    },
    fallbackLng: 'en',
    debug: false,
    saveMissing: false,
    updateMissing: false,
    supportedLngs: ['en', 'ur'],
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'lang',
      caches: ['localStorage'],
    },
  });

// Apply direction on init
applyDirection(i18n.language?.startsWith('ur') ? 'ur' : 'en');

// Apply direction on language change
i18n.on('languageChanged', (lang) => {
  applyDirection(lang);
});

export default i18n;
