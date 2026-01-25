import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SmartAlertsWidget } from './SmartAlertsWidget';

// Mock hooks
vi.mock('@/hooks/useNovaData', () => ({
  useProfiles: vi.fn(() => ({ data: [] })),
  useProjects: vi.fn(() => ({ data: [] })),
  useMemberStats: vi.fn(() => ({ data: [] })),
  useObjectives: vi.fn(() => ({ data: [] })),
}));

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        gte: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
          lt: vi.fn(() => ({
            neq: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          })),
        })),
      })),
    })),
  },
}));

// Mock date-fns
vi.mock('date-fns', () => ({
  differenceInDays: () => 3,
}));

describe('SmartAlertsWidget', () => {
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
        <SmartAlertsWidget />
      </QueryClientProvider>
    );
  };

  it('renders Alertas title', () => {
    renderComponent();
    expect(screen.getByText('Alertas')).toBeInTheDocument();
  });

  it('renders AlertTriangle icon', () => {
    const { container } = renderComponent();
    const icon = container.querySelector('.lucide-alert-triangle');
    expect(icon).toBeInTheDocument();
  });

  it('shows loading state', () => {
    const { container } = renderComponent();
    const loader = container.querySelector('.animate-spin');
    expect(loader).toBeInTheDocument();
  });
});
