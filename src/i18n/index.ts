import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import {
  es as esDateFns, enUS, fr as frDateFns, de as deDateFns,
  pt as ptDateFns, it as itDateFns,
} from 'date-fns/locale';
import { es } from './locales/es';
import { en } from './locales/en';
import { fr } from './locales/fr';
import { de } from './locales/de';
import { pt } from './locales/pt';
import { it } from './locales/it';

export const SUPPORTED_LANGUAGES = [
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
] as const;

/** date-fns locale matching the current i18n language */
const DATE_FNS_LOCALES: Record<string, Locale> = {
  es: esDateFns,
  en: enUS,
  fr: frDateFns,
  de: deDateFns,
  pt: ptDateFns,
  it: itDateFns,
};

/** Get the date-fns locale for the current language */
export function getDateFnsLocale(): Locale {
  const lang = i18n.language?.split('-')[0] ?? 'es';
  return DATE_FNS_LOCALES[lang] ?? esDateFns;
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: es },
      en: { translation: en },
      fr: { translation: fr },
      de: { translation: de },
      pt: { translation: pt },
      it: { translation: it },
    },
    fallbackLng: 'es',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
