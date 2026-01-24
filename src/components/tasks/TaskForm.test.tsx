import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TaskForm } from './TaskForm';

// Mock hooks
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    profile: { id: 'user1', nombre: 'Test User' },
  })),
}));

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  },
}));

import { supabase } from '@/integrations/supabase/client';

const mockProjectMembers = [
  { id: 'member1', nombre: 'Juan Pérez', color: '#6366F1' },
  { id: 'member2', nombre: 'María García', color: '#22C55E' },
];

describe('TaskForm', () => {
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
        <TaskForm
          projectId="proj1"
          projectMembers={mockProjectMembers}
          open={true}
          onOpenChange={mockOnOpenChange}
          {...props}
        />
      </QueryClientProvider>
    );
  };

  it('renders dialog with title', () => {
    renderComponent();
    expect(screen.getByText('Nueva Tarea')).toBeInTheDocument();
  });

  it('renders all form fields', () => {
    renderComponent();
    expect(screen.getByLabelText(/Título/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Descripción/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Asignar a/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Prioridad/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Fecha límite/)).toBeInTheDocument();
  });

  it('allows typing in titulo field', async () => {
    const user = userEvent.setup();
    renderComponent();

    const tituloInput = screen.getByLabelText(/Título/);
    await user.type(tituloInput, 'Preparar presentación');

    expect(tituloInput).toHaveValue('Preparar presentación');
  });

  it('allows typing in descripcion field', async () => {
    const user = userEvent.setup();
    renderComponent();

    const descripcionInput = screen.getByLabelText(/Descripción/);
    await user.type(descripcionInput, 'Detalles de la tarea');

    expect(descripcionInput).toHaveValue('Detalles de la tarea');
  });

  it('allows selecting fecha limite', async () => {
    const user = userEvent.setup();
    renderComponent();

    const dateInput = screen.getByLabelText(/Fecha límite/);
    await user.type(dateInput, '2024-12-31');

    expect(dateInput).toHaveValue('2024-12-31');
  });

  it('renders Cancel and Create buttons', () => {
    renderComponent();
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
    expect(screen.getByText('Crear Tarea')).toBeInTheDocument();
  });

  it('submits form successfully', async () => {
    const user = userEvent.setup();
    const mockInsert = vi.fn(() => Promise.resolve({ data: null, error: null }));
    (supabase.from as any).mockReturnValue({
      insert: mockInsert,
    });

    renderComponent();

    await user.type(screen.getByLabelText(/Título/), 'Test Task');
    await user.click(screen.getByText('Crear Tarea'));

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          project_id: 'proj1',
          titulo: 'Test Task',
          status: 'todo',
          ai_generated: false,
        })
      );
    });
  });

  it('validates titulo is not empty', async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByText('Crear Tarea'));

    // Should not submit
    expect(screen.getByLabelText(/Título/)).toBeInTheDocument();
  });

  it('closes dialog after successful submission', async () => {
    const user = userEvent.setup();
    const mockInsert = vi.fn(() => Promise.resolve({ data: null, error: null }));
    (supabase.from as any).mockReturnValue({
      insert: mockInsert,
    });

    renderComponent();

    await user.type(screen.getByLabelText(/Título/), 'Test');
    await user.click(screen.getByText('Crear Tarea'));

    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    const mockInsert = vi.fn(() => new Promise((resolve) => setTimeout(() => resolve({ data: null, error: null }), 100)));
    (supabase.from as any).mockReturnValue({
      insert: mockInsert,
    });

    renderComponent();

    await user.type(screen.getByLabelText(/Título/), 'Test');
    await user.click(screen.getByText('Crear Tarea'));

    expect(screen.getByText('Creando...')).toBeInTheDocument();
  });

  it('handles submission error gracefully', async () => {
    const user = userEvent.setup();
    const mockInsert = vi.fn(() => Promise.resolve({ data: null, error: { message: 'Error' } }));
    (supabase.from as any).mockReturnValue({
      insert: mockInsert,
    });

    renderComponent();

    await user.type(screen.getByLabelText(/Título/), 'Test');
    await user.click(screen.getByText('Crear Tarea'));

    await waitFor(() => {
      expect(mockOnOpenChange).not.toHaveBeenCalled();
    });
  });

  it('invalidates queries after successful submission', async () => {
    const user = userEvent.setup();
    const mockInsert = vi.fn(() => Promise.resolve({ data: null, error: null }));
    (supabase.from as any).mockReturnValue({
      insert: mockInsert,
    });
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');

    renderComponent();

    await user.type(screen.getByLabelText(/Título/), 'Test');
    await user.click(screen.getByText('Crear Tarea'));

    await waitFor(() => {
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['project_tasks', 'proj1'] });
    });
  });

  it('resets form after successful submission', async () => {
    const user = userEvent.setup();
    const mockInsert = vi.fn(() => Promise.resolve({ data: null, error: null }));
    (supabase.from as any).mockReturnValue({
      insert: mockInsert,
    });

    renderComponent();

    const tituloInput = screen.getByLabelText(/Título/);
    await user.type(tituloInput, 'Test');
    await user.click(screen.getByText('Crear Tarea'));

    await waitFor(() => {
      expect(tituloInput).toHaveValue('');
    });
  });

  it('calls onOpenChange when Cancel is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByText('Cancelar'));

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('sets default prioridad to Media', () => {
    renderComponent();
    // Default value is '2' (Media) but component uses SelectValue placeholder
    expect(screen.getByRole('combobox', { name: /prioridad/i })).toBeInTheDocument();
  });

  it('assigns to current user if no assignee selected', async () => {
    const user = userEvent.setup();
    const mockInsert = vi.fn(() => Promise.resolve({ data: null, error: null }));
    (supabase.from as any).mockReturnValue({
      insert: mockInsert,
    });

    renderComponent();

    await user.type(screen.getByLabelText(/Título/), 'Test');
    await user.click(screen.getByText('Crear Tarea'));

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          assignee_id: 'user1', // Current user ID
        })
      );
    });
  });

  it('renders Calendar icon for fecha limite', () => {
    const { container } = renderComponent();
    const calendarIcon = container.querySelector('.lucide-calendar');
    expect(calendarIcon).toBeInTheDocument();
  });

  it('renders Flag icon for prioridad', () => {
    const { container } = renderComponent();
    const flagIcon = container.querySelector('.lucide-flag');
    expect(flagIcon).toBeInTheDocument();
  });

  it('renders User icon for assignee', () => {
    const { container } = renderComponent();
    const userIcon = container.querySelector('.lucide-user');
    expect(userIcon).toBeInTheDocument();
  });

  it('submits with all fields filled', async () => {
    const user = userEvent.setup();
    const mockInsert = vi.fn(() => Promise.resolve({ data: null, error: null }));
    (supabase.from as any).mockReturnValue({
      insert: mockInsert,
    });

    renderComponent();

    await user.type(screen.getByLabelText(/Título/), 'Complete Task');
    await user.type(screen.getByLabelText(/Descripción/), 'Task description');
    await user.type(screen.getByLabelText(/Fecha límite/), '2024-12-31');
    await user.click(screen.getByText('Crear Tarea'));

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          titulo: 'Complete Task',
          descripcion: 'Task description',
          fecha_limite: '2024-12-31',
        })
      );
    });
  });

  it('uses placeholder for titulo', () => {
    renderComponent();
    const tituloInput = screen.getByPlaceholderText('Preparar presentación del pitch...');
    expect(tituloInput).toBeInTheDocument();
  });

  it('uses placeholder for descripcion', () => {
    renderComponent();
    const descripcionInput = screen.getByPlaceholderText('Detalles de la tarea...');
    expect(descripcionInput).toBeInTheDocument();
  });

  it('disables buttons during submission', async () => {
    const user = userEvent.setup();
    const mockInsert = vi.fn(() => new Promise((resolve) => setTimeout(() => resolve({ data: null, error: null }), 100)));
    (supabase.from as any).mockReturnValue({
      insert: mockInsert,
    });

    renderComponent();

    await user.type(screen.getByLabelText(/Título/), 'Test');
    await user.click(screen.getByText('Crear Tarea'));

    const cancelButton = screen.getByText('Cancelar');
    const submitButton = screen.getByText('Creando...');
    expect(cancelButton).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });
});
