import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardView } from './DashboardView';

// Mock NovaHeader (uses SearchContext and NavigationContext which aren't provided in tests)
vi.mock('@/components/nova/NovaHeader', () => ({
  NovaHeader: ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div>
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </div>
  ),
}));

// Mock dashboard components
vi.mock('@/components/dashboard/WeeklyEvolutionChart', () => ({
  WeeklyEvolutionChart: () => <div data-testid="weekly-evolution-chart">Chart</div>,
}));
vi.mock('@/components/dashboard/TopRankingsWidget', () => ({
  TopRankingsWidget: () => <div data-testid="top-rankings-widget">Rankings</div>,
}));
vi.mock('@/components/dashboard/RecentActivityFeed', () => ({
  RecentActivityFeed: () => <div data-testid="recent-activity-feed">Activity</div>,
}));
vi.mock('@/components/dashboard/PendingValidationsWidget', () => ({
  PendingValidationsWidget: () => <div data-testid="pending-validations-widget">Validations</div>,
}));
vi.mock('@/components/dashboard/SmartAlertsWidget', () => ({
  SmartAlertsWidget: () => <div data-testid="smart-alerts-widget">Alerts</div>,
}));

// Mock shared UI components
vi.mock('@/components/ui/how-it-works', () => ({
  HowItWorks: () => <div data-testid="how-it-works">How it works</div>,
}));
vi.mock('@/components/ui/section-help', () => ({
  HelpWidget: () => <div data-testid="help-widget">Help</div>,
  SectionHelp: () => <div data-testid="section-help">Help</div>,
}));
vi.mock('@/components/preview/DashboardPreviewModal', () => ({
  DashboardPreviewModal: () => null,
}));
vi.mock('@/components/onboarding/OnboardingProgressBanner', () => ({
  OnboardingProgressBanner: () => null,
}));
vi.mock('@/components/onboarding/RegenerationTriggersWidget', () => ({
  RegenerationTriggersWidget: () => null,
}));
vi.mock('@/components/onboarding/GamificationWidget', () => ({
  GamificationWidget: () => null,
}));

// Mock supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: null } })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
    })),
  },
}));

// Mock data hooks
vi.mock('@/hooks/useNovaData', () => ({
  useMemberStats: vi.fn(() => ({
    data: [
      { id: 'user1', nombre: 'Test User', obvs: 10, lps: 2, bps: 15, cps: 8, facturacion: 5000, margen: 2500, color: '#6366F1' }
    ],
    isLoading: false
  })),
  useObjectives: vi.fn(() => ({ data: [], isLoading: false })),
}));

// Mock demo context
vi.mock('@/contexts/DemoModeContext', () => ({
  useDemoMode: vi.fn(() => ({ isDemoMode: false })),
}));

// Mock react-router-dom useParams
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: vi.fn(() => ({ projectId: undefined })),
  };
});

describe('DashboardView', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <DashboardView />
      </QueryClientProvider>
    );
  };

  it('renders page title', () => {
    renderComponent();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders subtitle', () => {
    renderComponent();
    expect(screen.getByText(/Consolida métricas de proyectos/)).toBeInTheDocument();
  });

  it('renders stat cards', () => {
    renderComponent();
    expect(screen.getByText('OBVs Totales')).toBeInTheDocument();
  });

  it('displays team totals', () => {
    renderComponent();
    const totalsSection = screen.getByText('OBVs Totales').closest('div');
    expect(totalsSection).toBeTruthy();
  });

  it('renders dashboard widgets', () => {
    renderComponent();
    expect(screen.getByTestId('weekly-evolution-chart')).toBeInTheDocument();
    expect(screen.getByTestId('top-rankings-widget')).toBeInTheDocument();
  });
});
