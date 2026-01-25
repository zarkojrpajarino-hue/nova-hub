import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OBVCenterView } from './OBVCenterView';

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

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ profile: { id: 'user1', nombre: 'Test User' } }),
}));

vi.mock('@/components/nova/NovaHeader', () => ({
  NovaHeader: ({ title }: { title: string }) => <div data-testid="nova-header">{title}</div>,
}));

vi.mock('@/components/nova/OBVForm', () => ({
  OBVForm: () => <div data-testid="obv-form">Form</div>,
}));

vi.mock('@/components/nova/OBVValidationList', () => ({
  OBVValidationList: () => <div data-testid="validation-list">List</div>,
}));

vi.mock('@/components/ui/section-help', () => ({
  SectionHelp: () => <div data-testid="section-help">Help</div>,
  HelpWidget: () => <div data-testid="help-widget">Widget</div>,
}));

describe('OBVCenterView', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.clearAllMocks();
  });

  const renderComponent = () => render(
    <QueryClientProvider client={queryClient}>
      <OBVCenterView />
    </QueryClientProvider>
  );

  it('renders centro de obvs title', () => {
    renderComponent();
    expect(screen.getByText('Centro de OBVs')).toBeInTheDocument();
  });

  it('renders subir obv tab', () => {
    renderComponent();
    expect(screen.getByText('📤 Subir OBV')).toBeInTheDocument();
  });

  it('renders validar tab', () => {
    renderComponent();
    expect(screen.getByText('✅ Validar')).toBeInTheDocument();
  });

  it('renders mis obvs tab', () => {
    renderComponent();
    expect(screen.getByText('📋 Mis OBVs')).toBeInTheDocument();
  });
});
