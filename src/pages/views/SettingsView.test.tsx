import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { SettingsView } from './SettingsView';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
    auth: {
      signOut: vi.fn(() => Promise.resolve({ error: null })),
    },
  },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    profile: { id: 'user1', nombre: 'Test User', email: 'test@test.com' },
    signOut: vi.fn(),
  }),
}));

vi.mock('@/hooks/useSettings', () => ({
  useUserRoles: () => ({ data: [] }),
}));

vi.mock('@/components/nova/NovaHeader', () => ({
  NovaHeader: ({ title }: { title: string }) => <div data-testid="nova-header">{title}</div>,
}));

vi.mock('@/components/settings/ProfileSettings', () => ({
  ProfileSettings: () => <div data-testid="profile-settings">Profile</div>,
}));

vi.mock('@/components/settings/NotificationSettings', () => ({
  NotificationSettings: () => <div data-testid="notification-settings">Notifications</div>,
}));

vi.mock('@/components/settings/AdminSettings', () => ({
  AdminSettings: () => <div data-testid="admin-settings">Admin</div>,
}));

vi.mock('@/components/evidence', () => ({
  DocumentManager: () => <div data-testid="document-manager">Documents</div>,
}));

vi.mock('@/components/ui/section-help', () => ({
  SectionHelp: () => <div data-testid="section-help">Help</div>,
  HelpWidget: () => <div data-testid="help-widget">Widget</div>,
}));

vi.mock('@/components/ui/how-it-works', () => ({
  HowItWorks: () => <div data-testid="how-it-works">How it works</div>,
}));

vi.mock('@/components/preview/SettingsPreviewModal', () => ({
  SettingsPreviewModal: () => <div data-testid="preview-modal" />,
}));

describe('SettingsView', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.clearAllMocks();
  });

  const renderComponent = () => render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <SettingsView />
      </QueryClientProvider>
    </MemoryRouter>
  );

  it('renders configuracion title', () => {
    renderComponent();
    expect(screen.getByText('Configuración')).toBeInTheDocument();
  });

  it('renders mi perfil tab', () => {
    renderComponent();
    expect(screen.getByText('Mi Perfil')).toBeInTheDocument();
  });

  it('renders notificaciones tab', () => {
    renderComponent();
    expect(screen.getByText('Notificaciones')).toBeInTheDocument();
  });

  it('renders cerrar sesion button', () => {
    renderComponent();
    expect(screen.getByText('Cerrar sesión')).toBeInTheDocument();
  });
});
