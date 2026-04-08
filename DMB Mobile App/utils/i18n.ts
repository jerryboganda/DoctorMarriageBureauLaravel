import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as SecureStore from 'expo-secure-store';
import { I18nManager, Platform } from 'react-native';
import en from '../locales/en.json';
import ur from '../locales/ur.json';

// Language detector that reads from SecureStore
const secureStoreDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lang: string) => void) => {
    try {
      const lang = await SecureStore.getItemAsync('lang');
      callback(lang || 'en');
    } catch {
      callback('en');
    }
  },
  init: () => {},
  cacheUserLanguage: async (lang: string) => {
    try {
      await SecureStore.setItemAsync('lang', lang);
    } catch {
      // Ignore storage errors
    }
  },
};

// Apply RTL based on language
export function applyRTL(lang: string) {
  const isRTL = lang === 'ur';
  if (I18nManager.isRTL !== isRTL) {
    I18nManager.allowRTL(isRTL);
    I18nManager.forceRTL(isRTL);
    // Note: On native, RTL change requires app reload to take full effect.
    // On web (Expo), it takes effect immediately.
  }
}

i18n
  .use(secureStoreDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ur: { translation: ur },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'ur'],
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false, // Disable suspense for React Native
    },
  });

// Apply RTL on language change
i18n.on('languageChanged', (lang) => {
  applyRTL(lang);
});

export default i18n;
