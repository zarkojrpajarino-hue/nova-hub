import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { InsightForm } from './InsightForm';

// Mock hooks
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({ profile: { id: 'user1', nombre: 'Test User' } })),
}));

vi.mock('@/hooks/useNovaData', () => ({
  useProjects: vi.fn(() => ({ 
    data: [
      { id: 'proj1', nombre: 'Test Project', icon: '🚀' }
    ] 
  })),
}));

vi.mock('@/hooks/useDevelopment', () => ({
  useCreateInsight: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
  useUpdateInsight: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('InsightForm', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <InsightForm
          open={true}
          onOpenChange={vi.fn()}
          {...props}
        />
      </QueryClientProvider>
    );
  };

  it('renders dialog title for new insight', () => {
    renderComponent();
    expect(screen.getByText('Nuevo Insight')).toBeInTheDocument();
  });

  it('renders dialog title for editing insight', () => {
    const insight = {
      id: 'ins1',
      user_id: 'user1',
      titulo: 'Test Insight',
      contenido: 'Test content',
      tipo: 'aprendizaje' as const,
      project_id: null,
      role_context: null,
      tags: [],
      is_private: true,
      created_at: new Date().toISOString(),
    };
    renderComponent({ insight });
    expect(screen.getByText('Editar Insight')).toBeInTheDocument();
  });

  it('renders title input field', () => {
    renderComponent();
    expect(screen.getByLabelText('Título')).toBeInTheDocument();
  });

  it('renders content textarea', () => {
    renderComponent();
    expect(screen.getByLabelText('Contenido')).toBeInTheDocument();
  });

  it('renders tipo select', () => {
    renderComponent();
    expect(screen.getByText('Tipo')).toBeInTheDocument();
  });

  it('renders role context input', () => {
    renderComponent();
    expect(screen.getByLabelText('Rol (contexto)')).toBeInTheDocument();
  });

  it('renders tags section', () => {
    renderComponent();
    expect(screen.getByText('Tags')).toBeInTheDocument();
  });

  it('renders private switch', () => {
    renderComponent();
    expect(screen.getByText('Privado (solo visible para ti)')).toBeInTheDocument();
  });

  it('renders cancel button', () => {
    renderComponent();
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
  });

  it('renders save button', () => {
    renderComponent();
    expect(screen.getByText('Guardar')).toBeInTheDocument();
  });
});
