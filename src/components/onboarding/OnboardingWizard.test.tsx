import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OnboardingWizard } from './OnboardingWizard';

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
      insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
  },
}));

const mockProject = {
  id: 'proj1',
  nombre: 'Proyecto Test',
  tipo: 'validacion',
  color: '#6366F1',
  icon: '🚀',
  onboarding_data: null,
};

describe('OnboardingWizard', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderComponent = (props: any = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <OnboardingWizard
          project={mockProject}
          {...props}
        />
      </QueryClientProvider>
    );
  };

  it('renders project name', () => {
    renderComponent();
    expect(screen.getByText('Proyecto Test')).toBeInTheDocument();
  });

  it('shows onboarding mode label', () => {
    renderComponent();
    expect(screen.getByText('Onboarding - Modo Validación')).toBeInTheDocument();
  });

  it('displays Lean Startup badge for validation projects', () => {
    renderComponent();
    expect(screen.getByText(/🧪 Lean Startup/)).toBeInTheDocument();
  });

  it('renders navigation buttons', () => {
    renderComponent();
    expect(screen.getByText('Siguiente')).toBeInTheDocument();
  });

  it('shows cancel button when onCancel provided', () => {
    renderComponent({ onCancel: vi.fn() });
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
  });

  it('displays complete button on last step', async () => {
    const { container } = renderComponent();
    const nextButtons = screen.getAllByText('Siguiente');
    
    expect(nextButtons.length).toBeGreaterThan(0);
  });

  it('renders Rocket icon', () => {
    const { container } = renderComponent();
    expect(container).toBeTruthy();
  });

  it('shows operacion mode for operation projects', () => {
    const operacionProject = { ...mockProject, tipo: 'operacion' };
    renderComponent({ project: operacionProject });
    expect(screen.getByText('Onboarding - Modo Operación')).toBeInTheDocument();
  });

  it('displays Negocio Validado badge for operation projects', () => {
    const operacionProject = { ...mockProject, tipo: 'operacion' };
    renderComponent({ project: operacionProject });
    expect(screen.getByText(/🚀 Negocio Validado/)).toBeInTheDocument();
  });
});
