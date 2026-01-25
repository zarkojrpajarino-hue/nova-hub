import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApplyForMasterDialog } from './ApplyForMasterDialog';

// Mock hooks
vi.mock('@/hooks/useMasters', () => ({
  useCheckMasterEligibility: vi.fn(() => ({
    data: {
      eligible: true,
      performance: 85,
      months_in_role: 6,
      reasons: [],
    },
    isLoading: false,
  })),
  useCreateMasterApplication: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
}));

// Mock ROLE_CONFIG
vi.mock('@/data/mockData', () => ({
  ROLE_CONFIG: {
    comercial: { label: 'Comercial', color: '#6366F1', icon: () => null },
  },
}));

describe('ApplyForMasterDialog', () => {
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
        <ApplyForMasterDialog
          open={true}
          onOpenChange={vi.fn()}
          userRoles={['comercial']}
          userId="user1"
          {...props}
        />
      </QueryClientProvider>
    );
  };

  it('renders dialog title', () => {
    renderComponent();
    expect(screen.getByText('Aplicar para ser Master')).toBeInTheDocument();
  });

  it('renders Crown icon', () => {
    const { container } = renderComponent();
    const crownIcon = container.querySelector('.lucide-crown');
    expect(crownIcon).toBeInTheDocument();
  });

  it('displays dialog description', () => {
    renderComponent();
    expect(screen.getByText(/Los Masters son líderes de conocimiento/)).toBeInTheDocument();
  });

  it('renders role selection dropdown', () => {
    renderComponent();
    expect(screen.getByText('Rol para el que aplicas')).toBeInTheDocument();
  });

  it('shows eligibility verification section', () => {
    renderComponent();
    expect(screen.getByText('Verificación de Elegibilidad')).toBeInTheDocument();
  });

  it('displays eligible badge when user is eligible', () => {
    renderComponent();
    expect(screen.getByText('Elegible')).toBeInTheDocument();
  });

  it('shows performance percentage', () => {
    renderComponent();
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('displays months in role', () => {
    renderComponent();
    expect(screen.getByText('6 meses')).toBeInTheDocument();
  });

  it('renders motivation textarea', () => {
    renderComponent();
    const textarea = screen.getByPlaceholderText(/Explica tu motivación/);
    expect(textarea).toBeInTheDocument();
  });

  it('shows achievements section', () => {
    renderComponent();
    expect(screen.getByText('Logros destacados (opcional)')).toBeInTheDocument();
  });

  it('allows adding achievements', async () => {
    const user = userEvent.setup();
    renderComponent();
    const addButton = screen.getByText('+ Añadir');
    await user.click(addButton);
    const titleInputs = screen.getAllByPlaceholderText('Título del logro');
    expect(titleInputs).toHaveLength(2);
  });

  it('renders submit button', () => {
    renderComponent();
    expect(screen.getByText('Enviar Aplicación')).toBeInTheDocument();
  });

  it('shows cancel button', () => {
    renderComponent();
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
  });
});
