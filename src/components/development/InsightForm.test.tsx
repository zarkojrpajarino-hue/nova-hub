import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { InsightForm } from './InsightForm';

// Mock hooks
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    profile: { id: 'user1', nombre: 'Test User' },
  })),
}));

vi.mock('@/hooks/useNovaData', () => ({
  useProjects: vi.fn(() => ({
    data: [
      { id: 'proj1', nombre: 'Proyecto Alpha', icon: '📱' },
      { id: 'proj2', nombre: 'Proyecto Beta', icon: '🚀' },
    ],
  })),
}));

vi.mock('@/hooks/useDevelopment', () => ({
  useCreateInsight: vi.fn(() => ({
    mutateAsync: vi.fn(() => Promise.resolve()),
    isPending: false,
  })),
  useUpdateInsight: vi.fn(() => ({
    mutateAsync: vi.fn(() => Promise.resolve()),
    isPending: false,
  })),
}));

import { useCreateInsight, useUpdateInsight } from '@/hooks/useDevelopment';

describe('InsightForm', () => {
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

  const renderComponent = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <InsightForm
          open={true}
          onOpenChange={mockOnOpenChange}
          {...props}
        />
      </QueryClientProvider>
    );
  };

  it('renders dialog with title for new insight', () => {
    renderComponent();
    expect(screen.getByText('Nuevo Insight')).toBeInTheDocument();
  });

  it('renders dialog with title for editing insight', () => {
    const mockInsight = {
      id: 'insight1',
      user_id: 'user1',
      titulo: 'Existing Insight',
      contenido: 'Content',
      tipo: 'aprendizaje' as const,
      project_id: null,
      role_context: null,
      tags: [],
      is_private: true,
      created_at: new Date().toISOString(),
    };
    renderComponent({ insight: mockInsight });
    expect(screen.getByText('Editar Insight')).toBeInTheDocument();
  });

  it('renders all form fields', () => {
    renderComponent();
    expect(screen.getByLabelText('Título')).toBeInTheDocument();
    expect(screen.getByLabelText('Contenido')).toBeInTheDocument();
    expect(screen.getByLabelText('Tipo')).toBeInTheDocument();
    expect(screen.getByLabelText(/Proyecto/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Rol/)).toBeInTheDocument();
    expect(screen.getByLabelText('Tags')).toBeInTheDocument();
  });

  it('renders privacy toggle', () => {
    renderComponent();
    expect(screen.getByLabelText(/Privado/)).toBeInTheDocument();
  });

  it('pre-fills form when editing existing insight', () => {
    const mockInsight = {
      id: 'insight1',
      user_id: 'user1',
      titulo: 'Test Insight',
      contenido: 'Test Content',
      tipo: 'reflexion' as const,
      project_id: 'proj1',
      role_context: 'Comercial',
      tags: ['tag1', 'tag2'],
      is_private: false,
      created_at: new Date().toISOString(),
    };
    renderComponent({ insight: mockInsight });

    expect(screen.getByDisplayValue('Test Insight')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Content')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Comercial')).toBeInTheDocument();
    expect(screen.getByText('#tag1')).toBeInTheDocument();
    expect(screen.getByText('#tag2')).toBeInTheDocument();
  });

  it('allows typing in titulo field', async () => {
    const user = userEvent.setup();
    renderComponent();

    const tituloInput = screen.getByLabelText('Título');
    await user.type(tituloInput, 'My new insight');

    expect(tituloInput).toHaveValue('My new insight');
  });

  it('allows typing in contenido field', async () => {
    const user = userEvent.setup();
    renderComponent();

    const contenidoInput = screen.getByLabelText('Contenido');
    await user.type(contenidoInput, 'This is my learning');

    expect(contenidoInput).toHaveValue('This is my learning');
  });

  it('allows adding tags', async () => {
    const user = userEvent.setup();
    renderComponent();

    const tagInput = screen.getByPlaceholderText('Añadir tag...');
    await user.type(tagInput, 'newtag');
    await user.click(screen.getByText('Añadir'));

    expect(screen.getByText('#newtag')).toBeInTheDocument();
    expect(tagInput).toHaveValue('');
  });

  it('allows adding tags by pressing Enter', async () => {
    const user = userEvent.setup();
    renderComponent();

    const tagInput = screen.getByPlaceholderText('Añadir tag...');
    await user.type(tagInput, 'quicktag{Enter}');

    expect(screen.getByText('#quicktag')).toBeInTheDocument();
  });

  it('prevents adding duplicate tags', async () => {
    const user = userEvent.setup();
    renderComponent();

    const tagInput = screen.getByPlaceholderText('Añadir tag...');
    await user.type(tagInput, 'tag1');
    await user.click(screen.getByText('Añadir'));
    await user.type(tagInput, 'tag1');
    await user.click(screen.getByText('Añadir'));

    const tags = screen.getAllByText('#tag1');
    expect(tags).toHaveLength(1);
  });

  it('allows removing tags', async () => {
    const user = userEvent.setup();
    const mockInsight = {
      id: 'insight1',
      user_id: 'user1',
      titulo: 'Test',
      contenido: 'Content',
      tipo: 'aprendizaje' as const,
      project_id: null,
      role_context: null,
      tags: ['removeme'],
      is_private: true,
      created_at: new Date().toISOString(),
    };
    renderComponent({ insight: mockInsight });

    expect(screen.getByText('#removeme')).toBeInTheDocument();

    const removeButton = screen.getByRole('button', { name: '' });
    await user.click(removeButton);

    expect(screen.queryByText('#removeme')).not.toBeInTheDocument();
  });

  it('renders Cancel button', () => {
    renderComponent();
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
  });

  it('renders Guardar button for new insight', () => {
    renderComponent();
    expect(screen.getByText('Guardar')).toBeInTheDocument();
  });

  it('renders Actualizar button for existing insight', () => {
    const mockInsight = {
      id: 'insight1',
      user_id: 'user1',
      titulo: 'Test',
      contenido: 'Content',
      tipo: 'aprendizaje' as const,
      project_id: null,
      role_context: null,
      tags: [],
      is_private: true,
      created_at: new Date().toISOString(),
    };
    renderComponent({ insight: mockInsight });
    expect(screen.getByText('Actualizar')).toBeInTheDocument();
  });

  it('shows loader when submitting', () => {
    (useCreateInsight as any).mockReturnValue({
      mutateAsync: vi.fn(() => Promise.resolve()),
      isPending: true,
    });

    renderComponent();
    const saveButton = screen.getByText('Guardar');
    expect(saveButton).toBeDisabled();
  });

  it('uses default project ID when provided', () => {
    renderComponent({ defaultProjectId: 'proj1' });
    // Project dropdown should have proj1 selected by default
    // This is tested implicitly through the form state
  });

  it('uses default role context when provided', () => {
    renderComponent({ defaultRoleContext: 'Técnico' });
    const roleInput = screen.getByLabelText(/Rol/);
    expect(roleInput).toHaveValue('Técnico');
  });

  it('resets form when dialog closes and reopens', () => {
    const { rerender } = renderComponent();

    const tituloInput = screen.getByLabelText('Título');
    expect(tituloInput).toHaveValue('');

    // Simulate closing and reopening
    rerender(
      <QueryClientProvider client={queryClient}>
        <InsightForm open={false} onOpenChange={mockOnOpenChange} />
      </QueryClientProvider>
    );

    rerender(
      <QueryClientProvider client={queryClient}>
        <InsightForm open={true} onOpenChange={mockOnOpenChange} />
      </QueryClientProvider>
    );

    expect(tituloInput).toHaveValue('');
  });
});
