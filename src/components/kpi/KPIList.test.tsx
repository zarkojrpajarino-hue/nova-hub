import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { KPIList } from './KPIList';

// Mock hooks
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({ profile: { id: 'user1', nombre: 'Test User' } })),
}));

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      })),
    })),
  },
}));

describe('KPIList', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderComponent = (type: 'lp' | 'bp' | 'cp' = 'lp') => {
    return render(
      <QueryClientProvider client={queryClient}>
        <KPIList type={type} />
      </QueryClientProvider>
    );
  };

  it('shows empty state for Learning Paths', () => {
    renderComponent('lp');
    expect(screen.getByText(/No tienes Learning Paths registrados/)).toBeInTheDocument();
  });

  it('shows empty state for Book Points', () => {
    renderComponent('bp');
    expect(screen.getByText(/No tienes Book Points registrados/)).toBeInTheDocument();
  });

  it('shows empty state for Community Points', () => {
    renderComponent('cp');
    expect(screen.getByText(/No tienes Community Points registrados/)).toBeInTheDocument();
  });

  it('shows helpful message in empty state', () => {
    renderComponent();
    expect(screen.getByText(/¡Sube tu primero usando el botón de arriba!/)).toBeInTheDocument();
  });
});
