import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RolesMeetingView } from './RolesMeetingView';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
  },
}));

vi.mock('@/components/nova/NovaHeader', () => ({
  NovaHeader: ({ title }: { title: string }) => <div data-testid="nova-header">{title}</div>,
}));

vi.mock('@/components/roles/AIRoleQuestionsGenerator', () => ({
  AIRoleQuestionsGenerator: () => <div data-testid="ai-generator">Generator</div>,
}));

vi.mock('@/components/ui/section-help', () => ({
  SectionHelp: () => <div data-testid="section-help">Help</div>,
  HelpWidget: () => <div data-testid="help-widget">Widget</div>,
}));

describe('RolesMeetingView', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.clearAllMocks();
  });

  const renderComponent = () => render(
    <QueryClientProvider client={queryClient}>
      <RolesMeetingView />
    </QueryClientProvider>
  );

  it('renders juntas de rol title', () => {
    renderComponent();
    expect(screen.getByText('Juntas de Rol')).toBeInTheDocument();
  });

  it('renders selecciona un rol title', () => {
    renderComponent();
    expect(screen.getByText('Selecciona un Rol')).toBeInTheDocument();
  });

  it('renders sales role option', () => {
    renderComponent();
    expect(screen.getByText('Comercial')).toBeInTheDocument();
  });
});
