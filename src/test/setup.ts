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
