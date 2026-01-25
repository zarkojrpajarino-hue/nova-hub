import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OnboardingGate } from './OnboardingGate';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(() => Promise.resolve({ data: null, error: null })),
    },
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/components/onboarding/OnboardingWizard', () => ({
  OnboardingWizard: () => <div data-testid="onboarding-wizard">Wizard</div>,
}));

const mockProject = {
  id: 'proj1',
  nombre: 'Test Project',
  tipo: 'validacion',
  color: '#6366F1',
  icon: '🚀',
  descripcion: 'Test',
  obvs_objetivo: 10,
  obvs_actuales: 0,
  meta_facturacion: 10000,
  facturacion_actual: 0,
  created_at: new Date().toISOString(),
  leads_actuales: 0,
  leads_objetivo: 10,
};

describe('OnboardingGate', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.clearAllMocks();
  });

  const renderComponent = () => render(
    <QueryClientProvider client={queryClient}>
      <OnboardingGate project={mockProject} />
    </QueryClientProvider>
  );

  it('renders onboarding required title', () => {
    renderComponent();
    expect(screen.getByText('Onboarding Requerido')).toBeInTheDocument();
  });

  it('renders comenzar onboarding button', () => {
    renderComponent();
    expect(screen.getByText('Comenzar Onboarding')).toBeInTheDocument();
  });

  it('shows project name', () => {
    renderComponent();
    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  it('shows project type', () => {
    renderComponent();
    expect(screen.getByText('Proyecto de Validación')).toBeInTheDocument();
  });
});
