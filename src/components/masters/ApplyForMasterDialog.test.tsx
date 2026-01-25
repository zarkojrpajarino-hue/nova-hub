import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApplyForMasterDialog } from './ApplyForMasterDialog';

vi.mock('@/hooks/useMasters', () => ({
  useCheckMasterEligibility: vi.fn(() => ({ data: null, isLoading: false })),
  useCreateMasterApplication: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
}));

vi.mock('@/data/mockData', () => ({
  ROLE_CONFIG: {
    comercial: { label: 'Comercial', color: '#6366F1', icon: () => null },
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe('ApplyForMasterDialog', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.clearAllMocks();
  });

  const renderComponent = () => render(
    <QueryClientProvider client={queryClient}>
      <ApplyForMasterDialog
        open={true}
        onOpenChange={vi.fn()}
        userRoles={['comercial']}
        userId="user1"
      />
    </QueryClientProvider>
  );

  it('renders dialog title', () => {
    renderComponent();
    expect(screen.getByText('Aplicar para ser Master')).toBeInTheDocument();
  });

  it('renders role selection label', () => {
    renderComponent();
    expect(screen.getByText('Rol para el que aplicas')).toBeInTheDocument();
  });

  it('renders motivation textarea', () => {
    renderComponent();
    expect(screen.getByText(/Por qué quieres ser Master/)).toBeInTheDocument();
  });

  it('renders Enviar Aplicación button', () => {
    renderComponent();
    expect(screen.getByText('Enviar Aplicación')).toBeInTheDocument();
  });
});
