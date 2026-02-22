import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TemporalEvolutionChart } from './TemporalEvolutionChart';

// Mock supabase - keep pending so queries never resolve → loading state persists
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        gte: vi.fn(() => ({
          lte: vi.fn(() => new Promise(() => {})), // never resolves → isLoading stays true
        })),
      })),
    })),
  },
}));

// Mock Recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }: { children: ReactNode }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
}));

// Mock date-fns
vi.mock('date-fns', async () => {
  const actual = await vi.importActual('date-fns');
  return {
    ...actual,
    format: () => 'Mock Date',
    subDays: (date: Date) => date,
    subWeeks: (date: Date) => date,
    subMonths: (date: Date) => date,
    startOfWeek: () => new Date(),
    startOfMonth: () => new Date(),
    eachDayOfInterval: () => [new Date()],
    eachWeekOfInterval: () => [new Date()],
    eachMonthOfInterval: () => [new Date()],
  };
});

vi.mock('date-fns/locale', () => ({
  es: {},
}));

// Mock premium demo data for isDemoMode tests
vi.mock('@/data/premiumDemoData', () => ({
  PREMIUM_DEMO_DATA: {
    analytics: {
      temporal: {
        labels: ['Lun', 'Mar', 'Mié'],
        obvs: [3, 5, 2],
        tasks: [10, 12, 8],
        revenue: [1000, 2000, 1500],
      },
    },
  },
}));

describe('TemporalEvolutionChart', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  // Renders with pending queries → loading state
  const renderComponent = (period: 'week' | 'month' | 'quarter' | 'year' = 'week') => {
    return render(
      <QueryClientProvider client={queryClient}>
        <TemporalEvolutionChart period={period} />
      </QueryClientProvider>
    );
  };

  // Renders in demo mode → skips queries, renders chart directly
  const renderDemoComponent = (period: 'week' | 'month' | 'quarter' | 'year' = 'week') => {
    return render(
      <QueryClientProvider client={queryClient}>
        <TemporalEvolutionChart period={period} isDemoMode={true} />
      </QueryClientProvider>
    );
  };

  it('renders loading state initially', () => {
    const { container } = renderComponent();
    const loaderIcon = container.querySelector('.lucide-loader-circle');
    expect(loaderIcon).toBeInTheDocument();
  });

  it('renders for week period in demo mode', () => {
    const { container } = renderDemoComponent('week');
    expect(container.firstChild).toBeTruthy();
  });

  it('renders for month period in demo mode', () => {
    const { container } = renderDemoComponent('month');
    expect(container.firstChild).toBeTruthy();
  });

  it('renders for quarter period in demo mode', () => {
    const { container } = renderDemoComponent('quarter');
    expect(container.firstChild).toBeTruthy();
  });

  it('renders for year period in demo mode', () => {
    const { container } = renderDemoComponent('year');
    expect(container.firstChild).toBeTruthy();
  });

  it('displays Loader2 icon while loading', () => {
    const { container } = renderComponent();
    const loaderIcon = container.querySelector('.lucide-loader-circle');
    expect(loaderIcon).toBeInTheDocument();
  });
});
