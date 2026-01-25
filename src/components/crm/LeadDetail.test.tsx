import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LeadDetail } from './LeadDetail';

// Mock hooks
vi.mock('@/hooks/useCRM', () => ({
  useUpdateLead: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
  useDeleteLead: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
}));

const mockLead = {
  id: 'lead1',
  nombre: 'Empresa Alpha',
  status: 'warm',
  valor_estimado: 15000,
  proyecto_id: 'proj1',
  responsable_id: 'user1',
  contacto: 'contacto@empresa.com',
  telefono: '123456789',
  notas: 'Cliente potencial interesante',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockProjects = [
  { id: 'proj1', nombre: 'Proyecto Alpha', icon: '🚀' },
];

const mockMembers = [
  { id: 'user1', nombre: 'Juan Pérez', color: '#6366F1' },
];

describe('LeadDetail', () => {
  let queryClient: QueryClient;
  const mockOnClose = vi.fn();

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderComponent = (isOpen = true) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <LeadDetail
          lead={mockLead}
          projects={mockProjects}
          members={mockMembers}
          isOpen={isOpen}
          onClose={mockOnClose}
        />
      </QueryClientProvider>
    );
  };

  it('renders lead name', () => {
    renderComponent();
    expect(screen.getByText('Empresa Alpha')).toBeInTheDocument();
  });

  it('displays lead details', () => {
    renderComponent();
    expect(screen.getByText('15.000 €')).toBeInTheDocument();
    expect(screen.getByText('contacto@empresa.com')).toBeInTheDocument();
  });

  it('renders close button', () => {
    renderComponent();
    const closeButton = screen.getByRole('button', { name: /close/i });
    expect(closeButton).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', async () => {
    const user = userEvent.setup();
    renderComponent();
    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('does not render when closed', () => {
    renderComponent(false);
    expect(screen.queryByText('Empresa Alpha')).not.toBeInTheDocument();
  });
});
