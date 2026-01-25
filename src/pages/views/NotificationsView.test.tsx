import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NotificationsView } from './NotificationsView';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    })),
  },
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

vi.mock('date-fns', () => ({
  formatDistanceToNow: () => 'hace 2 horas',
  format: () => '2026-01-25',
}));

vi.mock('date-fns/locale', () => ({
  es: {},
}));

describe('NotificationsView', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.clearAllMocks();
  });

  const renderComponent = () => render(
    <QueryClientProvider client={queryClient}>
      <NotificationsView onNavigate={() => {}} />
    </QueryClientProvider>
  );

  it('renders notificaciones title', () => {
    renderComponent();
    expect(screen.getByText('Notificaciones')).toBeInTheDocument();
  });

  it('renders historial title', () => {
    renderComponent();
    expect(screen.getByText('Historial de notificaciones')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    renderComponent();
    expect(screen.getByText('No tienes notificaciones')).toBeInTheDocument();
  });
});
