import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MiDesarrolloView } from './MiDesarrolloView';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
    rpc: vi.fn(() => Promise.resolve({ data: [], error: null })),
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

vi.mock('@/components/development/InsightsList', () => ({
  InsightsList: () => <div data-testid="insights-list">Insights</div>,
}));

vi.mock('@/components/ui/section-help', () => ({
  SectionHelp: () => <div data-testid="section-help">Help</div>,
  HelpWidget: () => <div data-testid="help-widget">Widget</div>,
}));

describe('MiDesarrolloView', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.clearAllMocks();
  });

  const renderComponent = () => render(
    <QueryClientProvider client={queryClient}>
      <MiDesarrolloView />
    </QueryClientProvider>
  );

  it('renders mi desarrollo title', () => {
    renderComponent();
    expect(screen.getByText('Mi Desarrollo')).toBeInTheDocument();
  });

  it('renders rendimiento tab', () => {
    renderComponent();
    expect(screen.getByText('Rendimiento')).toBeInTheDocument();
  });

  it('renders insights tab', () => {
    renderComponent();
    expect(screen.getByText('Insights')).toBeInTheDocument();
  });

  it('renders playbook tab', () => {
    renderComponent();
    expect(screen.getByText('Playbook')).toBeInTheDocument();
  });
});
