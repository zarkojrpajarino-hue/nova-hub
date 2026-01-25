import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TemporalEvolutionChart } from './TemporalEvolutionChart';

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        gte: vi.fn(() => ({
          lte: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    })),
  },
}));

// Mock Recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
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

  const renderComponent = (period: 'week' | 'month' | 'quarter' | 'year' = 'week') => {
    return render(
      <QueryClientProvider client={queryClient}>
        <TemporalEvolutionChart period={period} />
      </QueryClientProvider>
    );
  };

  it('renders loading state initially', () => {
    renderComponent();
    const loader = screen.getByTestId(/loader/i);
    expect(loader).toBeInTheDocument();
  });

  it('renders for week period', () => {
    renderComponent('week');
    expect(screen.getByTestId(/loader/i)).toBeInTheDocument();
  });

  it('renders for month period', () => {
    renderComponent('month');
    expect(screen.getByTestId(/loader/i)).toBeInTheDocument();
  });

  it('renders for quarter period', () => {
    renderComponent('quarter');
    expect(screen.getByTestId(/loader/i)).toBeInTheDocument();
  });

  it('renders for year period', () => {
    renderComponent('year');
    expect(screen.getByTestId(/loader/i)).toBeInTheDocument();
  });

  it('displays Loader2 icon while loading', () => {
    const { container } = renderComponent();
    const loaderIcon = container.querySelector('.lucide-loader-2');
    expect(loaderIcon).toBeInTheDocument();
  });
});
