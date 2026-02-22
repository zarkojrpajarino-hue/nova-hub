import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnalyticsView } from './AnalyticsView';

// Mock NovaHeader (uses SearchContext and NavigationContext which aren't provided in tests)
vi.mock('@/components/nova/NovaHeader', () => ({
  NovaHeader: ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div>
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </div>
  ),
}));

// Mock all analytics components
vi.mock('@/components/analytics/PartnerComparisonTable', () => ({
  PartnerComparisonTable: () => <div data-testid="partner-comparison-table">Table</div>,
}));
vi.mock('@/components/analytics/PartnerRadarChart', () => ({
  PartnerRadarChart: () => <div data-testid="partner-radar-chart">Radar</div>,
}));
vi.mock('@/components/analytics/ProjectComparisonCharts', () => ({
  ProjectComparisonCharts: () => <div data-testid="project-comparison-charts">Charts</div>,
}));
vi.mock('@/components/analytics/TemporalEvolutionChart', () => ({
  TemporalEvolutionChart: () => <div data-testid="temporal-evolution-chart">Temporal</div>,
}));
vi.mock('@/components/analytics/ActivityHeatmap', () => ({
  ActivityHeatmap: () => <div data-testid="activity-heatmap">Heatmap</div>,
}));
vi.mock('@/components/analytics/PredictionsWidget', () => ({
  PredictionsWidget: () => <div data-testid="predictions-widget">Predictions</div>,
}));
vi.mock('@/components/analytics/AnalyticsFilters', () => ({
  AnalyticsFilters: () => <div data-testid="analytics-filters">Filters</div>,
}));

// Mock shared UI components
vi.mock('@/components/ui/how-it-works', () => ({
  HowItWorks: () => <div data-testid="how-it-works">How it works</div>,
}));
vi.mock('@/components/ui/section-help', () => ({
  HelpWidget: () => <div data-testid="help-widget">Help</div>,
  SectionHelp: () => <div data-testid="section-help">Help</div>,
}));
vi.mock('@/components/preview/AnalyticsPreviewModal', () => ({
  AnalyticsPreviewModal: () => null,
}));
vi.mock('@/components/export/ExportButton', () => ({
  ExportButton: () => <button data-testid="export-button">Export</button>,
}));

// Mock data hooks
vi.mock('@/hooks/useNovaData', () => ({
  useMemberStats: vi.fn(() => ({ data: [], isLoading: false })),
  useProjects: vi.fn(() => ({ data: [], isLoading: false })),
  useProjectStats: vi.fn(() => ({ data: [], isLoading: false })),
}));

describe('AnalyticsView', () => {
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
        <AnalyticsView />
      </QueryClientProvider>
    );
  };

  it('renders page title', () => {
    renderComponent();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });

  it('renders subtitle', () => {
    renderComponent();
    expect(screen.getByText(/Deep dives en métricas/)).toBeInTheDocument();
  });

  it('renders period selector', () => {
    renderComponent();
    expect(screen.getByText('Período:')).toBeInTheDocument();
  });

  it('renders export buttons', () => {
    renderComponent();
    expect(screen.getAllByTestId('export-button').length).toBeGreaterThan(0);
  });
});
