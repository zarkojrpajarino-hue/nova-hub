import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GlobalSearch } from './GlobalSearch';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => Promise.resolve({ data: [], error: null })),
    })),
  },
}));

vi.mock('@/contexts/NavigationContext', () => ({
  useNavigation: () => ({ navigate: vi.fn() }),
}));

vi.mock('@/hooks/useNovaData', () => ({
  useProjects: vi.fn(() => ({ data: [] })),
  useProfiles: vi.fn(() => ({ data: [] })),
}));

describe('GlobalSearch', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.clearAllMocks();
  });

  const renderComponent = (open = true) => render(
    <QueryClientProvider client={queryClient}>
      <GlobalSearch open={open} onOpenChange={() => {}} />
    </QueryClientProvider>
  );

  it('renders buscar placeholder when open', () => {
    renderComponent(true);
    expect(screen.getByPlaceholderText(/Buscar/)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    renderComponent(false);
    expect(screen.queryByPlaceholderText(/Buscar/)).not.toBeInTheDocument();
  });

  it('renders proyectos section', () => {
    renderComponent(true);
    expect(screen.getByText('Proyectos')).toBeInTheDocument();
  });

  it('renders vistas section', () => {
    renderComponent(true);
    expect(screen.getAllByText('Vista').length).toBeGreaterThan(0);
  });
});
