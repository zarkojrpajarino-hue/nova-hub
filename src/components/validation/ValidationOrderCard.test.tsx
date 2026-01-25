import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ValidationOrderCard } from './ValidationOrderCard';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
    rpc: vi.fn(() => Promise.resolve({ data: [], error: null })),
  },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ profile: { id: 'user1', nombre: 'Test User' } }),
}));

describe('ValidationOrderCard', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.clearAllMocks();
  });

  const renderComponent = () => render(
    <QueryClientProvider client={queryClient}>
      <ValidationOrderCard />
    </QueryClientProvider>
  );

  it('renders orden de validacion title', () => {
    renderComponent();
    expect(screen.getByText('Orden de Validación')).toBeInTheDocument();
  });

  it('renders yo valido a section', () => {
    renderComponent();
    expect(screen.getByText(/Yo valido a/)).toBeInTheDocument();
  });

  it('renders me validan section', () => {
    renderComponent();
    expect(screen.getByText(/Me validan/)).toBeInTheDocument();
  });
});
