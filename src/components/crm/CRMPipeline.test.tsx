import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CRMPipeline } from './CRMPipeline';
import type { Lead } from '@/hooks/useCRMPipeline';

// Mock useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    profile: { id: 'user1', nombre: 'Test User' },
  })),
}));

// Mock leadService
vi.mock('@/services/LeadService', () => ({
  leadService: {
    updateStatus: vi.fn(() => Promise.resolve()),
  },
}));

// Mock @hello-pangea/dnd
vi.mock('@hello-pangea/dnd', () => ({
  DragDropContext: ({ children }: { children: ReactNode }) => <>{children}</>,
  Droppable: ({ children }: { children: (provided: object, snapshot: object) => ReactNode }) =>
    <>{children({ innerRef: vi.fn(), droppableProps: {}, placeholder: null }, { isDraggingOver: false })}</>,
  Draggable: ({ children }: { children: (provided: object, snapshot: object) => ReactNode }) =>
    <>{children({ innerRef: vi.fn(), draggableProps: {}, dragHandleProps: {} }, { isDragging: false })}</>,
}));

// Mock hooks
vi.mock('@/hooks/useCRM', () => ({
  useUpdateLead: vi.fn(() => ({
    mutateAsync: vi.fn(),
  })),
}));

const mockLeads: Lead[] = [
  {
    id: 'lead1',
    nombre: 'Empresa Alpha',
    status: 'frio',
    valor_potencial: 10000,
    project_id: 'proj1',
    responsable_id: 'user1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    empresa: 'Alpha Corp',
    email: 'contact@alpha.com',
    telefono: '123456789',
    notas: null,
    proxima_accion: null,
    proxima_accion_fecha: null,
  },
  {
    id: 'lead2',
    nombre: 'Empresa Beta',
    status: 'hot',
    valor_potencial: 25000,
    project_id: 'proj1',
    responsable_id: 'user2',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    empresa: 'Beta Inc',
    email: 'contact@beta.com',
    telefono: '987654321',
    notas: null,
    proxima_accion: null,
    proxima_accion_fecha: null,
  },
];

const mockProjects = [
  { id: 'proj1', nombre: 'Proyecto 1', icon: '🚀', color: '#6366F1' },
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
          isLoading={false}
        />
      </QueryClientProvider>
    );
  };

  it('renders view toggle buttons', () => {
    renderComponent();
    // View toggle buttons use icon-only buttons with title attributes, not visible text
    expect(screen.getByTitle('Vista Kanban')).toBeInTheDocument();
    expect(screen.getByTitle('Vista Lista')).toBeInTheDocument();
    expect(screen.getByTitle('Vista Tabla')).toBeInTheDocument();
  });

  it('renders leads in default view', () => {
    renderComponent();
    expect(screen.getByText('Empresa Alpha')).toBeInTheDocument();
    expect(screen.getByText('Empresa Beta')).toBeInTheDocument();
  });

  it('switches to list view', async () => {
    const user = userEvent.setup();
    renderComponent();
    await user.click(screen.getByTitle('Vista Lista'));
    expect(screen.getByText('Empresa Alpha')).toBeInTheDocument();
  });

  it('displays lead value', () => {
    renderComponent();
    // Values appear in both the column header total and the individual lead card
    // Use getAllByText since the value may appear multiple times (column total + card)
    const value10k = screen.getAllByText(`€${(10000).toLocaleString()}`);
    expect(value10k.length).toBeGreaterThanOrEqual(1);
    const value25k = screen.getAllByText(`€${(25000).toLocaleString()}`);
    expect(value25k.length).toBeGreaterThanOrEqual(1);
  });

  it('renders status columns in kanban view', () => {
    renderComponent();
    // PIPELINE_STAGES labels are in Spanish: 'Frío', 'Tibio', 'Hot'
    expect(screen.getByText('Frío')).toBeInTheDocument();
    expect(screen.getByText('Tibio')).toBeInTheDocument();
    expect(screen.getByText('Hot')).toBeInTheDocument();
  });
});
