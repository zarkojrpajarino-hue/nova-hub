import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CRMPipeline } from './CRMPipeline';

// Mock hooks
vi.mock('@/hooks/useCRM', () => ({
  useUpdateLead: vi.fn(() => ({
    mutateAsync: vi.fn(),
  })),
}));

const mockLeads = [
  {
    id: 'lead1',
    nombre: 'Empresa Alpha',
    status: 'cold',
    valor_estimado: 10000,
    proyecto_id: 'proj1',
    responsable_id: 'user1',
    created_at: new Date().toISOString(),
  },
  {
    id: 'lead2',
    nombre: 'Empresa Beta',
    status: 'hot',
    valor_estimado: 25000,
    proyecto_id: 'proj1',
    responsable_id: 'user2',
    created_at: new Date().toISOString(),
  },
];

const mockProjects = [
  { id: 'proj1', nombre: 'Proyecto 1', icon: '🚀' },
];

const mockMembers = [
  { id: 'user1', nombre: 'Juan Pérez', color: '#6366F1' },
  { id: 'user2', nombre: 'María García', color: '#22C55E' },
];

describe('CRMPipeline', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <CRMPipeline
          leads={mockLeads}
          projects={mockProjects}
          members={mockMembers}
        />
      </QueryClientProvider>
    );
  };

  it('renders view toggle buttons', () => {
    renderComponent();
    expect(screen.getByText('Kanban')).toBeInTheDocument();
    expect(screen.getByText('Lista')).toBeInTheDocument();
    expect(screen.getByText('Tabla')).toBeInTheDocument();
  });

  it('renders leads in default view', () => {
    renderComponent();
    expect(screen.getByText('Empresa Alpha')).toBeInTheDocument();
    expect(screen.getByText('Empresa Beta')).toBeInTheDocument();
  });

  it('switches to list view', async () => {
    const user = userEvent.setup();
    renderComponent();
    await user.click(screen.getByText('Lista'));
    expect(screen.getByText('Empresa Alpha')).toBeInTheDocument();
  });

  it('displays lead value', () => {
    renderComponent();
    expect(screen.getByText('10.000 €')).toBeInTheDocument();
    expect(screen.getByText('25.000 €')).toBeInTheDocument();
  });

  it('renders status columns in kanban view', () => {
    renderComponent();
    expect(screen.getByText('Cold')).toBeInTheDocument();
    expect(screen.getByText('Warm')).toBeInTheDocument();
    expect(screen.getByText('Hot')).toBeInTheDocument();
  });
});
