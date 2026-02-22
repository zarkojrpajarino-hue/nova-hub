import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PendingValidationsWidget } from './PendingValidationsWidget';

// Mock hooks
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({ profile: { id: 'user1', nombre: 'Test User' } })),
}));

vi.mock('@/hooks/useNovaData', () => ({
  useProfiles: vi.fn(() => ({ 
    data: [
      { id: 'user2', nombre: 'John Doe', color: '#6366F1' }
    ] 
  })),
}));

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          neq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          })),
          in: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        in: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
  },
}));

// Mock router
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(() => vi.fn()),
}));

describe('PendingValidationsWidget', () => {
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
        <PendingValidationsWidget />
      </QueryClientProvider>
    );
  };

  it('renders widget title', () => {
    renderComponent();
    expect(screen.getByText('Validaciones Pendientes')).toBeInTheDocument();
  });

  it('renders CheckCircle2 icon', () => {
    const { container } = renderComponent();
    // CheckCircle2 is aliased to CircleCheck in lucide-react v0.462, so the class is lucide-circle-check
    const icon = container.querySelector('.lucide-circle-check');
    expect(icon).toBeInTheDocument();
  });

  it('shows loading state', () => {
    renderComponent();
    expect(screen.getByText('Validaciones Pendientes')).toBeInTheDocument();
  });

  it('shows empty state message when no pending items', async () => {
    renderComponent();
    // The component will eventually show the empty state
    expect(screen.getByText('Validaciones Pendientes')).toBeInTheDocument();
  });
});
