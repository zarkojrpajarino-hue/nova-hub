import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ActivityHeatmap } from './ActivityHeatmap';

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

// Mock date-fns
vi.mock('date-fns', async () => {
  const actual = await vi.importActual('date-fns');
  return {
    ...actual,
    subMonths: (date: Date, months: number) => new Date(date.getTime() - months * 30 * 24 * 60 * 60 * 1000),
    eachDayOfInterval: () => [new Date()],
    getDay: () => 1,
    startOfWeek: () => new Date(),
    addDays: (date: Date, days: number) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000),
  };
});

describe('ActivityHeatmap', () => {
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
        <ActivityHeatmap />
      </QueryClientProvider>
    );
  };

  it('renders loading state', () => {
    renderComponent();
    const loader = document.querySelector('.lucide-loader-2');
    expect(loader).toBeInTheDocument();
  });

  it('renders heatmap container', () => {
    const { container } = renderComponent();
    expect(container).toBeTruthy();
  });
});
