import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WeeklyEvolutionChart } from './WeeklyEvolutionChart';

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        gte: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    })),
  },
}));

// Mock Recharts
vi.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  Legend: () => <div data-testid="legend" />,
}));

// Mock date-fns
vi.mock('date-fns', () => ({
  startOfWeek: vi.fn((date: Date) => date),
  endOfWeek: vi.fn((date: Date) => date),
  subWeeks: vi.fn((date: Date, weeks: number) => new Date(date.getTime() - weeks * 7 * 24 * 60 * 60 * 1000)),
  format: vi.fn(() => '1 Ene'),
}));

vi.mock('date-fns/locale', () => ({
  es: {},
}));

describe('WeeklyEvolutionChart', () => {
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
        <WeeklyEvolutionChart />
      </QueryClientProvider>
    );
  };

  it('renders chart title', () => {
    renderComponent();
    expect(screen.getByText('Evolución Semanal')).toBeInTheDocument();
  });

  it('renders TrendingUp icon', () => {
    const { container } = renderComponent();
    const icon = container.querySelector('.lucide-trending-up');
    expect(icon).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    renderComponent();
    expect(screen.getByText('Evolución Semanal')).toBeInTheDocument();
  });
});
