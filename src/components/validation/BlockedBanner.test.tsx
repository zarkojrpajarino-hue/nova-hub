import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BlockedBanner } from './BlockedBanner';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
    rpc: vi.fn(() => Promise.resolve({ data: false, error: null })),
  },
}));

vi.mock('date-fns', () => ({
  formatDistanceToNow: () => 'hace 2 días',
}));

vi.mock('date-fns/locale', () => ({
  es: {},
}));

describe('BlockedBanner', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.clearAllMocks();
  });

  const renderComponent = () => render(
    <QueryClientProvider client={queryClient}>
      <BlockedBanner />
    </QueryClientProvider>
  );

  it('does not render when not blocked', () => {
    renderComponent();
    expect(screen.queryByText('Estás bloqueado')).not.toBeInTheDocument();
  });

  it('renders ir a validaciones button when provided callback', () => {
    const onNavigate = vi.fn();
    render(
      <QueryClientProvider client={queryClient}>
        <BlockedBanner onNavigateToValidations={onNavigate} />
      </QueryClientProvider>
    );
    // Should not render if not blocked
    expect(screen.queryByText('Ir a Validaciones')).not.toBeInTheDocument();
  });
});
