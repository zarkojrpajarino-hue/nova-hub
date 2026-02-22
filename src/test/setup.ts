import "@testing-library/jest-dom";
import { vi } from 'vitest';

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
