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

vi.mock('@/hooks/useRoleRotation', () => ({
  useRotationRequests: () => ({ data: [] }),
  useMyRotationRequests: () => ({ data: [] }),
  useRoleHistory: () => ({ data: [] }),
}));

vi.mock('@/contexts/DemoModeContext', () => ({
  useDemoMode: () => ({ isDemoMode: false }),
}));

vi.mock('@/components/rotation/RotationRequestsList', () => ({
  RotationRequestsList: () => <div data-testid="requests-list">List</div>,
}));

vi.mock('@/components/rotation/RoleHistoryList', () => ({
  RoleHistoryList: () => <div data-testid="role-history-list">History</div>,
}));

vi.mock('@/components/rotation/MyRotationRequests', () => ({
  MyRotationRequests: () => <div data-testid="my-rotation-requests">My Requests</div>,
}));

vi.mock('@/components/rotation/AIRotationSuggestions', () => ({
  AIRotationSuggestions: () => <div data-testid="ai-rotation-suggestions">AI Suggestions</div>,
}));

vi.mock('@/components/rotation/CreateRotationDialog', () => ({
  CreateRotationDialog: () => <div data-testid="create-rotation-dialog" />,
}));

vi.mock('@/components/ui/section-help', () => ({
  SectionHelp: () => <div data-testid="section-help">Help</div>,
  HelpWidget: () => <div data-testid="help-widget">Widget</div>,
}));

vi.mock('@/components/ui/how-it-works', () => ({
  HowItWorks: () => <div data-testid="how-it-works">How it works</div>,
}));

vi.mock('@/components/preview/RoleRotationPreviewModal', () => ({
  RoleRotationPreviewModal: () => <div data-testid="preview-modal" />,
}));

vi.mock('@/components/navigation/BackButton', () => ({
  BackButton: () => <div data-testid="back-button">Back</div>,
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

  it('renders todas las solicitudes tab', () => {
    renderComponent();
    expect(screen.getByText('Todas las Solicitudes')).toBeInTheDocument();
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
