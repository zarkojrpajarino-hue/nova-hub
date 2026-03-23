import "@testing-library/jest-dom";
import { vi } from 'vitest';
import React from 'react';
import { es } from '@/i18n/locales/es';

/**
 * Resolve a dotted key like 'financiero.cobrosPendientes' against the
 * nested Spanish translation object so tests that assert on visible
 * text still pass.  Falls back to the key itself when no translation exists.
 */
function resolve(key: string, opts?: Record<string, unknown>): string {
  const parts = key.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let node: any = es;
  for (const p of parts) {
    if (node && typeof node === 'object' && p in node) {
      node = node[p];
    } else {
      return key; // key not found - return as-is
    }
  }
  let result = typeof node === 'string' ? node : key;
  if (opts && typeof opts === 'object') {
    for (const [k, v] of Object.entries(opts)) {
      result = result.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v));
    }
  }
  return result;
}

// Expose t() as a global so module-level constants like
// `const LABELS = { x: t('key') }` don't crash with "t is not defined".
// This mirrors what happens in production where i18n.t is available globally
// after i18n initialization.
(globalThis as Record<string, unknown>).t = resolve;

// Mock react-i18next globally, resolving keys against the real Spanish translations
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: resolve,
    i18n: {
      language: 'es',
      changeLanguage: vi.fn().mockResolvedValue(undefined),
      exists: vi.fn().mockReturnValue(true),
    },
  }),
  Trans: ({ children }: { children: React.ReactNode }) => children,
  initReactI18next: { type: '3rdParty', init: vi.fn() },
  I18nextProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock i18next to provide a global t() for module-level usage (outside components)
vi.mock('i18next', () => {
  const i18nInstance = {
    t: resolve,
    language: 'es',
    changeLanguage: vi.fn().mockResolvedValue(undefined),
    use: vi.fn().mockReturnThis(),
    init: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    addResourceBundle: vi.fn(),
    exists: vi.fn().mockReturnValue(true),
  };
  return { default: i18nInstance, ...i18nInstance };
});

// Mock date-fns/locale with minimal valid locale stubs so i18n/index.ts doesn't crash
// and date-fns format/formatDistanceToNow can work without errors.
const fakeLocale = {
  code: 'es',
  formatDistance: (_token: string, count: number) => `${count}`,
  formatRelative: (_token: string) => '',
  localize: {
    ordinalNumber: (n: number) => `${n}`,
    era: () => '',
    quarter: () => '',
    month: (_n: number) => '',
    day: (_n: number) => '',
    dayPeriod: () => '',
  },
  formatLong: {
    date: () => ({ format: () => 'dd/MM/yyyy' }),
    time: () => ({ format: () => 'HH:mm' }),
    dateTime: () => ({ format: () => 'dd/MM/yyyy HH:mm' }),
  },
  match: {
    ordinalNumber: () => null,
    era: () => null,
    quarter: () => null,
    month: () => null,
    day: () => null,
    dayPeriod: () => null,
  },
  options: { weekStartsOn: 1, firstWeekContainsDate: 4 },
} as unknown as Record<string, unknown>;
vi.mock('date-fns/locale', () => ({
  es: fakeLocale,
  enUS: fakeLocale,
  fr: fakeLocale,
  de: fakeLocale,
  pt: fakeLocale,
  it: fakeLocale,
}));

// Mock i18next-browser-languagedetector
vi.mock('i18next-browser-languagedetector', () => ({
  default: { type: 'languageDetector', init: vi.fn(), detect: () => 'es', cacheUserLanguage: vi.fn() },
}));

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock scrollIntoView
Element.prototype.scrollIntoView = () => {};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof IntersectionObserver;

// Polyfill DOMRect — jsdom may not expose it globally; floating-ui calls DOMRect.fromRect()
class DOMRectPolyfill implements DOMRect {
  x: number; y: number; width: number; height: number;
  top: number; right: number; bottom: number; left: number;
  constructor(x = 0, y = 0, width = 0, height = 0) {
    this.x = x; this.y = y; this.width = width; this.height = height;
    this.top = y; this.right = x + width; this.bottom = y + height; this.left = x;
  }
  static fromRect(rect?: DOMRectInit) {
    return new DOMRectPolyfill(rect?.x, rect?.y, rect?.width, rect?.height);
  }
  toJSON() { return {}; }
}
if (typeof DOMRect === 'undefined') {
  (global as Record<string, unknown>).DOMRect = DOMRectPolyfill;
} else if (!DOMRect.fromRect) {
  DOMRect.fromRect = DOMRectPolyfill.fromRect;
}

// Polyfill document.elementFromPoint — input-otp calls it in a cleanup timeout
if (!document.elementFromPoint) {
  document.elementFromPoint = () => null;
}

// Global context mocks — tests can override these with their own vi.mock() calls
vi.mock('@/contexts/SearchContext', () => ({
  SearchProvider: ({ children }: { children: React.ReactNode }) => children,
  useSearch: () => ({
    isOpen: false,
    open: vi.fn(),
    close: vi.fn(),
    toggle: vi.fn(),
  }),
}));

vi.mock('@/contexts/NavigationContext', () => ({
  NavigationProvider: ({ children }: { children: React.ReactNode }) => children,
  useNavigation: () => ({
    navigate: vi.fn(),
    goBack: vi.fn(),
    canGoBack: false,
  }),
}));

vi.mock('@/contexts/CurrentProjectContext', () => ({
  CurrentProjectProvider: ({ children }: { children: React.ReactNode }) => children,
  useCurrentProject: () => ({
    currentProject: null,
    setCurrentProject: vi.fn(),
    userProjects: [],
    isLoading: false,
    hasProjects: false,
    isOwner: false,
    switchProject: vi.fn(),
    clearCurrentProject: vi.fn(),
  }),
}));

vi.mock('@/contexts/DemoModeContext', () => ({
  DemoModeProvider: ({ children }: { children: React.ReactNode }) => children,
  useDemoMode: () => ({
    isDemoMode: false,
    enableDemo: vi.fn(),
    disableDemo: vi.fn(),
  }),
}));
