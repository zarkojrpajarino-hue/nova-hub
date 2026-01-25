import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardView } from './DashboardView';

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
    expect(screen.getByText(/Vista general del rendimiento del equipo/)).toBeInTheDocument();
  });

  it('renders stat cards', () => {
    renderComponent();
    expect(screen.getByText('OBVs del Equipo')).toBeInTheDocument();
  });

  it('displays team totals', () => {
    renderComponent();
    const totalsSection = screen.getByText('OBVs del Equipo').closest('div');
    expect(totalsSection).toBeTruthy();
  });

  it('renders dashboard widgets', () => {
    renderComponent();
    expect(screen.getByTestId('weekly-evolution-chart')).toBeInTheDocument();
    expect(screen.getByTestId('top-rankings-widget')).toBeInTheDocument();
  });
});
