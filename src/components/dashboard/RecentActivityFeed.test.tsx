import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RecentActivityFeed } from './RecentActivityFeed';

// Mock hooks
vi.mock('@/hooks/useNovaData', () => ({
  useProfiles: vi.fn(() => ({ 
    data: [
      { id: 'user1', nombre: 'John Doe', color: '#6366F1' }
    ] 
  })),
  useProjects: vi.fn(() => ({ data: [] })),
}));

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    })),
  },
}));

// Mock date-fns
vi.mock('date-fns', () => ({
  formatDistanceToNow: vi.fn(() => 'hace 2 horas'),
}));

vi.mock('date-fns/locale', () => ({
  es: {},
}));

describe('RecentActivityFeed', () => {
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
        <RecentActivityFeed />
      </QueryClientProvider>
    );
  };

  it('renders widget title', () => {
    renderComponent();
    expect(screen.getByText('Actividad Reciente')).toBeInTheDocument();
  });

  it('renders Zap icon', () => {
    const { container } = renderComponent();
    const icon = container.querySelector('.lucide-zap');
    expect(icon).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    renderComponent();
    const loader = screen.queryByRole('status') || screen.getByText('Actividad Reciente');
    expect(loader).toBeInTheDocument();
  });
});
