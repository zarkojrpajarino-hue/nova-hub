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

vi.mock('@/hooks/useNovaData', () => ({
  useProfiles: vi.fn(() => ({ data: [] })),
  useProjectMembers: vi.fn(() => ({ data: [] })),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
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

  it('shows empty state when no members exist', () => {
    renderComponent();
    expect(screen.getByText('No hay sugerencias de rotación en este momento')).toBeInTheDocument();
  });

  it('shows empty state hint about members with accepted roles', () => {
    renderComponent();
    expect(screen.getByText(/Las sugerencias aparecen cuando hay miembros/)).toBeInTheDocument();
  });

  it('renders an alert icon in empty state', () => {
    const { container } = renderComponent();
    const alertIcon = container.querySelector('.lucide-circle-alert');
    expect(alertIcon).toBeInTheDocument();
  });
});
