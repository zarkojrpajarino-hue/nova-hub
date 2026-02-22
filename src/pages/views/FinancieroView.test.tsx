import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FinancieroView } from './FinancieroView';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(() => Promise.resolve({ data: [], error: null })),
    from: vi.fn(() => ({
      select: vi.fn(() => Promise.resolve({ data: [], error: null })),
    })),
  },
}));

vi.mock('@/contexts/DemoModeContext', () => ({
  useDemoMode: () => ({ isDemoMode: false }),
}));

vi.mock('@/components/nova/NovaHeader', () => ({
  NovaHeader: ({ title }: { title: string }) => <div data-testid="nova-header">{title}</div>,
}));

vi.mock('@/components/financiero/RevenueEvolutionChart', () => ({
  RevenueEvolutionChart: () => <div data-testid="revenue-chart">Chart</div>,
}));

vi.mock('@/components/financiero/ProjectBreakdownChart', () => ({
  ProjectBreakdownChart: () => <div data-testid="breakdown-chart">Chart</div>,
}));

vi.mock('@/components/ui/section-help', () => ({
  SectionHelp: () => <div data-testid="section-help">Help</div>,
  HelpWidget: () => <div data-testid="help-widget">Widget</div>,
}));

vi.mock('@/components/ui/how-it-works', () => ({
  HowItWorks: () => <div data-testid="how-it-works">How it works</div>,
}));

vi.mock('@/components/preview/FinancieroPreviewModal', () => ({
  FinancieroPreviewModal: () => null,
}));

vi.mock('@/components/nova/StatCard', () => ({
  StatCard: () => <div data-testid="stat-card">Stat</div>,
}));

vi.mock('@/components/financiero/PendingPaymentsCard', () => ({
  PendingPaymentsCard: () => <div data-testid="pending-payments-card">Pending</div>,
}));

vi.mock('@/components/financiero/FinancialAlertsCard', () => ({
  FinancialAlertsCard: () => <div data-testid="financial-alerts-card">Alerts</div>,
}));

vi.mock('@/components/financiero/AIForecastWidget', () => ({
  AIForecastWidget: () => <div data-testid="ai-forecast-widget">Forecast</div>,
}));

vi.mock('@/components/export/ExportButton', () => ({
  ExportButton: () => <div data-testid="export-button">Export</div>,
}));

vi.mock('@/hooks/useFinancieroData', () => ({
  useFinancieroData: vi.fn(() => ({
    isLoading: false,
    sortedByFacturacion: [],
    financialMetrics: [],
    pendingPayments: [],
    overduePayments: [],
    upcomingPayments: [],
    objectivesMap: { facturacion: 15000, margen: 7500 },
    metrics: {
      totalFacturacion: 0,
      totalMargen: 0,
      margenPromedio: 0,
      totalPending: 0,
      overdueCount: 0,
      monthlyGrowth: 0,
      metaAnual: 0,
      progresoAnual: 0,
    },
  })),
}));

describe('FinancieroView', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.clearAllMocks();
  });

  const renderComponent = () => render(
    <QueryClientProvider client={queryClient}>
      <FinancieroView />
    </QueryClientProvider>
  );

  it('renders financiero title', () => {
    renderComponent();
    expect(screen.getByText('Financiero')).toBeInTheDocument();
  });

  it('renders dashboard tab', () => {
    renderComponent();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders gestion cobros tab', () => {
    renderComponent();
    expect(screen.getByText('Gestión Cobros')).toBeInTheDocument();
  });

  it('renders proyecciones tab', () => {
    renderComponent();
    expect(screen.getByText('Proyecciones')).toBeInTheDocument();
  });
});
