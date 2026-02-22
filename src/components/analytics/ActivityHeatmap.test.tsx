import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ActivityHeatmap } from './ActivityHeatmap';

// Mock supabase - keep pending to preserve loading state
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        gte: vi.fn(() => ({
          lte: vi.fn(() => new Promise(() => {})), // never resolves → keeps isLoading true
        })),
      })),
    })),
  },
}));

// Mock Tooltip components to avoid TooltipProvider requirement
vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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

  const renderDemoComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ActivityHeatmap isDemoMode={true} />
      </QueryClientProvider>
    );
  };

  it('renders loading state', () => {
    const { container } = renderComponent();
    const loader = container.querySelector('.lucide-loader-circle');
    expect(loader).toBeInTheDocument();
  });

  it('renders heatmap container in demo mode', () => {
    const { container } = renderDemoComponent();
    // In demo mode queries are disabled so heatmap renders immediately
    expect(container.firstChild).toBeTruthy();
  });
});
