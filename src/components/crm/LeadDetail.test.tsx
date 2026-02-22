import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LeadDetail } from './LeadDetail';

// Mock useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    profile: { id: 'user1', nombre: 'Test User' },
  })),
}));

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
          in: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
  },
}));

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
  status: 'tibio',
  valor_potencial: 15000,
  project_id: 'proj1',
  responsable_id: 'user1',
  empresa: 'Alpha Corp',
  email: 'contacto@empresa.com',
  telefono: '123456789',
  notas: 'Cliente potencial interesante',
  proxima_accion: 'Llamar',
  proxima_accion_fecha: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockMembers = [
  { id: 'user1', nombre: 'Juan Pérez', color: '#6366F1' },
];

describe('LeadDetail', () => {
  let queryClient: QueryClient;
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderComponent = (open = true) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <LeadDetail
          lead={mockLead as unknown as Parameters<typeof LeadDetail>[0]['lead']}
          members={mockMembers}
          open={open}
          onOpenChange={mockOnOpenChange}
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
    // toLocaleString() output depends on runtime locale (e.g. '15,000' in en-US)
    expect(screen.getByText(`€${(15000).toLocaleString()}`)).toBeInTheDocument();
    expect(screen.getByText('contacto@empresa.com')).toBeInTheDocument();
  });

  it('renders close button', () => {
    renderComponent();
    // Radix Sheet close button has an accessible name from the sr-only "Close" span
    const closeButtons = screen.getAllByRole('button');
    expect(closeButtons.length).toBeGreaterThan(0);
  });

  it('calls onOpenChange when close button clicked', async () => {
    const user = userEvent.setup();
    renderComponent();
    // Find the Radix close button - it contains a sr-only "Close" text
    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);
    expect(mockOnOpenChange).toHaveBeenCalled();
  });

  it('does not render when closed', () => {
    renderComponent(false);
    expect(screen.queryByText('Empresa Alpha')).not.toBeInTheDocument();
  });
});
