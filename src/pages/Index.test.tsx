import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import Index from './Index';

// Mock hooks
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    profile: { id: 'user1', nombre: 'Test User' },
    signOut: vi.fn(),
  })),
}));

vi.mock('@/hooks/useOnboarding', () => ({
  useOnboarding: vi.fn(() => ({
    hasCompletedOnboarding: true,
    completeOnboarding: vi.fn(),
    isLoading: false,
  })),
}));

vi.mock('@/hooks/useNavigationHistory', () => ({
  useNavigationHistory: vi.fn(() => ({
    navigateTo: vi.fn(),
    goBack: vi.fn(() => null),
    canGoBack: false,
    currentView: { view: 'dashboard' },
  })),
}));

vi.mock('@/hooks/useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: vi.fn(),
}));

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: vi.fn(() => false),
}));

// Mock contexts
vi.mock('@/contexts/DemoModeContext', () => ({
  useDemoMode: vi.fn(() => ({ isDemoMode: false })),
  DemoModeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/contexts/CurrentProjectContext', () => ({
  useCurrentProject: vi.fn(() => ({ currentProject: null, switchProject: vi.fn() })),
  CurrentProjectProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/contexts/SearchContext', () => ({
  useSearch: vi.fn(() => ({
    isOpen: false,
    open: vi.fn(),
    close: vi.fn(),
  })),
  SearchProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/contexts/NavigationContext', () => ({
  NavigationProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock sidebar and heavy components
vi.mock('@/components/nova/NovaSidebar', () => ({
  NovaSidebar: () => <div data-testid="nova-sidebar">Sidebar</div>,
}));

vi.mock('@/components/search/GlobalSearch', () => ({
  GlobalSearch: () => null,
}));

vi.mock('@/components/demo/DemoModeBanner', () => ({
  DemoModeBanner: () => null,
}));

vi.mock('@/components/onboarding/WelcomeModal', () => ({
  WelcomeModal: () => null,
}));

// Mock all lazy-loaded views
vi.mock('./views/DashboardView', () => ({
  DashboardView: () => <div data-testid="dashboard-view">Dashboard</div>,
}));
vi.mock('./views/MiEspacioView', () => ({
  MiEspacioView: () => <div>MiEspacio</div>,
}));
vi.mock('./views/MiDesarrolloView', () => ({
  MiDesarrolloView: () => <div>MiDesarrollo</div>,
}));
vi.mock('./views/RankingsView', () => ({
  RankingsView: () => <div>Rankings</div>,
}));
vi.mock('./views/MastersView', () => ({
  MastersView: () => <div>Masters</div>,
}));
vi.mock('./views/RoleRotationView', () => ({
  default: () => <div>RoleRotation</div>,
}));
vi.mock('./views/ProjectsView', () => ({
  ProjectsView: () => <div>Projects</div>,
}));
vi.mock('./views/OBVCenterView', () => ({
  OBVCenterView: () => <div>OBVCenter</div>,
}));
vi.mock('./views/CRMView', () => ({
  CRMView: () => <div>CRM</div>,
}));
vi.mock('./views/FinancieroView', () => ({
  FinancieroView: () => <div>Financiero</div>,
}));
vi.mock('./views/KPIsView', () => ({
  KPIsView: () => <div>KPIs</div>,
}));
vi.mock('./views/RolesMeetingView', () => ({
  RolesMeetingView: () => <div>RolesMeeting</div>,
}));
vi.mock('./views/AnalyticsView', () => ({
  AnalyticsView: () => <div>Analytics</div>,
}));
vi.mock('./views/SettingsView', () => ({
  SettingsView: () => <div>Settings</div>,
}));
vi.mock('./views/NotificationsView', () => ({
  NotificationsView: () => <div>Notifications</div>,
}));
vi.mock('./views/ValidacionesView', () => ({
  ValidacionesView: () => <div>Validaciones</div>,
}));
vi.mock('./IntegrationsView', () => ({
  default: () => <div>Integrations</div>,
}));
vi.mock('./views/ExplorationDashboard', () => ({
  ExplorationDashboard: () => <div>Exploration</div>,
}));
vi.mock('./views/TeamPerformanceDashboard', () => ({
  TeamPerformanceDashboard: () => <div>TeamPerformance</div>,
}));
vi.mock('./PathToMasterPage', () => ({
  PathToMasterPage: () => <div>PathToMaster</div>,
}));
vi.mock('./views/GenerativeOnboardingView', () => ({
  GenerativeOnboardingView: () => <div>GenerativeOnboarding</div>,
}));
vi.mock('./views/UltraOnboardingView', () => ({
  UltraOnboardingView: () => <div>UltraOnboarding</div>,
}));
vi.mock('./MeetingIntelligencePage', () => ({
  default: () => <div>MeetingIntelligence</div>,
}));
vi.mock('./views/StartupOSView', () => ({
  StartupOSView: () => <div>StartupOS</div>,
}));

describe('Index', () => {
  it('renders without crashing', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { container } = render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <Index />
        </QueryClientProvider>
      </MemoryRouter>
    );
    expect(container).toBeInTheDocument();
  });
});
