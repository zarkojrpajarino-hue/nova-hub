import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import {
  es as esDateFns, enUS, fr as frDateFns, de as deDateFns,
  pt as ptDateFns, it as itDateFns,
} from 'date-fns/locale';

// S5.1 — Only import fallback locale statically; others load on demand
import { es } from './locales/es';

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

/** Lazy-load a locale bundle and add it to i18n */
const loadedLocales = new Set<string>(['es']);

async function loadLocale(lang: string): Promise<void> {
  if (loadedLocales.has(lang)) return;

  try {
    // Vite dynamic import — each locale becomes its own chunk
    const module = await import(`./locales/${lang}.ts`);
    const key = Object.keys(module)[0]; // export name varies (en, fr, de, pt, it)
    i18n.addResourceBundle(lang, 'translation', module[key], true, true);
    loadedLocales.add(lang);
  } catch (err) {
    console.warn(`[i18n] Failed to load locale "${lang}":`, err);
  }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: es },
    },
    fallbackLng: 'es',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

// After init, load the detected language if it's not the fallback
const detectedLang = i18n.language?.split('-')[0] ?? 'es';
if (detectedLang !== 'es') {
  // Load the detected locale immediately (before first render settles)
  loadLocale(detectedLang);
}

// Load locale on every language change
i18n.on('languageChanged', (lng: string) => {
  const lang = lng.split('-')[0];
  loadLocale(lang);
});

export default i18n;
