import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AIRotationSuggestions } from './AIRotationSuggestions';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => Promise.resolve({ data: [], error: null })),
    })),
    functions: {
      invoke: vi.fn(() => Promise.resolve({ data: [], error: null })),
    },
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe('AIRotationSuggestions', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.clearAllMocks();
  });

  const renderComponent = () => render(
    <QueryClientProvider client={queryClient}>
      <AIRotationSuggestions />
    </QueryClientProvider>
  );

  it('renders sugerencias de ia title', () => {
    renderComponent();
    expect(screen.getByText(/Sugerencias de IA/)).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    renderComponent();
    expect(screen.getByText(/Analizando/)).toBeInTheDocument();
  });

  it('renders generar nuevas button', () => {
    renderComponent();
    expect(screen.getByText(/Generar nuevas/)).toBeInTheDocument();
  });
});
