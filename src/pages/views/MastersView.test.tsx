import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MastersView } from './MastersView';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
  },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ profile: { id: 'user1', nombre: 'Test User' } }),
}));

vi.mock('@/contexts/DemoModeContext', () => ({
  useDemoMode: () => ({ isDemoMode: false }),
}));

vi.mock('@/components/nova/NovaHeader', () => ({
  NovaHeader: ({ title }: { title: string }) => <div data-testid="nova-header">{title}</div>,
}));

vi.mock('@/components/ui/section-help', () => ({
  SectionHelp: () => <div data-testid="section-help">Help</div>,
  HelpWidget: () => <div data-testid="help-widget">Widget</div>,
}));

describe('MastersView', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.clearAllMocks();
  });

  const renderComponent = () => render(
    <QueryClientProvider client={queryClient}>
      <MastersView />
    </QueryClientProvider>
  );

  it('renders masters de nova title', () => {
    renderComponent();
    expect(screen.getByText('Masters de NOVA')).toBeInTheDocument();
  });

  it('renders masters activos stat', () => {
    renderComponent();
    expect(screen.getByText('Masters Activos')).toBeInTheDocument();
  });

  it('renders en votacion stat', () => {
    renderComponent();
    expect(screen.getByText('En Votación')).toBeInTheDocument();
  });

  it('renders desafios activos stat', () => {
    renderComponent();
    expect(screen.getByText('Desafíos Activos')).toBeInTheDocument();
  });
});
