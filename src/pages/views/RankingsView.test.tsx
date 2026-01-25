import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RankingsView } from './RankingsView';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(() => Promise.resolve({ data: [], error: null })),
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
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

describe('RankingsView', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.clearAllMocks();
  });

  const renderComponent = () => render(
    <QueryClientProvider client={queryClient}>
      <RankingsView />
    </QueryClientProvider>
  );

  it('renders rankings title', () => {
    renderComponent();
    expect(screen.getByText('Rankings por Rol')).toBeInTheDocument();
  });

  it('renders mi ranking section', () => {
    renderComponent();
    expect(screen.getByText('Mi Ranking')).toBeInTheDocument();
  });

  it('renders clasificacion general tab', () => {
    renderComponent();
    expect(screen.getByText('Clasificación General')).toBeInTheDocument();
  });

  it('renders tendencias tab', () => {
    renderComponent();
    expect(screen.getByText('Tendencias')).toBeInTheDocument();
  });
});
