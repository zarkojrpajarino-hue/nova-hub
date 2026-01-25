import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CreateRotationDialog } from './CreateRotationDialog';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ profile: { id: 'user1', nombre: 'Test User' } }),
}));

describe('CreateRotationDialog', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.clearAllMocks();
  });

  const renderComponent = (open = true) => render(
    <QueryClientProvider client={queryClient}>
      <CreateRotationDialog open={open} onOpenChange={() => {}} />
    </QueryClientProvider>
  );

  it('renders solicitar rotacion title when open', () => {
    renderComponent(true);
    expect(screen.getByText('Solicitar Rotación de Rol')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    renderComponent(false);
    expect(screen.queryByText('Solicitar Rotación de Rol')).not.toBeInTheDocument();
  });

  it('renders selecciona con quien label', () => {
    renderComponent(true);
    expect(screen.getByText(/Selecciona con quién/)).toBeInTheDocument();
  });
});
