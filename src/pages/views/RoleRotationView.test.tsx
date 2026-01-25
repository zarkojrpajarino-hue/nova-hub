import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RoleRotationView from './RoleRotationView';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
  },
}));

vi.mock('@/contexts/DemoModeContext', () => ({
  useDemoMode: () => ({ isDemoMode: false }),
}));

vi.mock('@/components/rotation/RotationRequestsList', () => ({
  RotationRequestsList: () => <div data-testid="requests-list">List</div>,
}));

vi.mock('@/components/ui/section-help', () => ({
  SectionHelp: () => <div data-testid="section-help">Help</div>,
  HelpWidget: () => <div data-testid="help-widget">Widget</div>,
}));

describe('RoleRotationView', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.clearAllMocks();
  });

  const renderComponent = () => render(
    <QueryClientProvider client={queryClient}>
      <RoleRotationView />
    </QueryClientProvider>
  );

  it('renders rotacion de roles title', () => {
    renderComponent();
    expect(screen.getByText('Rotación de Roles')).toBeInTheDocument();
  });

  it('renders solicitudes activas tab', () => {
    renderComponent();
    expect(screen.getByText('Solicitudes Activas')).toBeInTheDocument();
  });

  it('renders mis solicitudes tab', () => {
    renderComponent();
    expect(screen.getByText('Mis Solicitudes')).toBeInTheDocument();
  });

  it('renders historial tab', () => {
    renderComponent();
    expect(screen.getByText('Historial')).toBeInTheDocument();
  });
});
