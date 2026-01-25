import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnalyticsView } from './AnalyticsView';

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

// Mock data hooks
vi.mock('@/hooks/useNovaData', () => ({
  useMemberStats: vi.fn(() => ({ data: [], isLoading: false })),
  useProjects: vi.fn(() => ({ data: [], isLoading: false })),
  useProjectStats: vi.fn(() => ({ data: [], isLoading: false })),
}));

// Mock demo context
vi.mock('@/contexts/DemoModeContext', () => ({
  useDemoMode: vi.fn(() => ({ isDemoMode: false })),
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
    expect(screen.getByText('Análisis avanzado y comparativas')).toBeInTheDocument();
  });

  it('renders period selector', () => {
    renderComponent();
    expect(screen.getByText('Período:')).toBeInTheDocument();
  });

  it('renders export buttons', () => {
    const { container } = renderComponent();
    const downloadIcons = container.querySelectorAll('.lucide-download, .lucide-file-spreadsheet, .lucide-file-text');
    expect(downloadIcons.length).toBeGreaterThan(0);
  });
});
