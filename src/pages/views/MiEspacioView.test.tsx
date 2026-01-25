import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { MiEspacioView } from './MiEspacioView';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
  },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ profile: { id: 'user1', nombre: 'Test User', email: 'test@test.com' } }),
}));

vi.mock('@/components/nova/NovaHeader', () => ({
  NovaHeader: ({ title }: { title: string }) => <div data-testid="nova-header">{title}</div>,
}));

vi.mock('@/components/tasks/MyTasksList', () => ({
  MyTasksList: () => <div data-testid="my-tasks">Tasks</div>,
}));

vi.mock('@/components/ui/section-help', () => ({
  SectionHelp: () => <div data-testid="section-help">Help</div>,
  HelpWidget: () => <div data-testid="help-widget">Widget</div>,
}));

describe('MiEspacioView', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.clearAllMocks();
  });

  const renderComponent = () => render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <MiEspacioView />
      </QueryClientProvider>
    </MemoryRouter>
  );

  it('renders mi espacio title', () => {
    renderComponent();
    expect(screen.getByText('Mi Espacio')).toBeInTheDocument();
  });

  it('renders mis kpis section', () => {
    renderComponent();
    expect(screen.getByText('Mis KPIs')).toBeInTheDocument();
  });

  it('renders mis proyectos y roles section', () => {
    renderComponent();
    expect(screen.getByText('Mis Proyectos y Roles')).toBeInTheDocument();
  });

  it('renders mis tareas section', () => {
    renderComponent();
    expect(screen.getByText('Mis Tareas')).toBeInTheDocument();
  });
});
