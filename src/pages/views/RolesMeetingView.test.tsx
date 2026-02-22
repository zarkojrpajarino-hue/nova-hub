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

vi.mock('@/hooks/useNovaData', () => ({
  useMemberStats: () => ({ data: [], isLoading: false }),
  useProjects: () => ({ data: [] }),
  useProjectMembers: () => ({ data: [] }),
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

vi.mock('@/components/ui/how-it-works', () => ({
  HowItWorks: () => <div data-testid="how-it-works">How it works</div>,
}));

vi.mock('@/components/preview/CaminoMasterPreviewModal', () => ({
  CaminoMasterPreviewModal: () => <div data-testid="preview-modal" />,
}));

vi.mock('@/data/mockData', () => ({
  ROLE_CONFIG: {
    sales: { icon: () => null, label: 'Sales', color: '#EF4444', desc: 'Prospección, cierre, relación cliente' },
  },
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

  it('renders reuniones de rol title', () => {
    renderComponent();
    expect(screen.getByText('Reuniones de Rol')).toBeInTheDocument();
  });

  it('renders proxima reunion banner', () => {
    renderComponent();
    expect(screen.getByText(/Próxima Reunión de Rol/)).toBeInTheDocument();
  });

  it('renders sales role option', () => {
    renderComponent();
    expect(screen.getByText('Sales')).toBeInTheDocument();
  });
});
