import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TaskCompletionDialog } from './TaskCompletionDialog';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(() => Promise.resolve({ data: null, error: null })),
    },
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe('TaskCompletionDialog', () => {
  const mockTask = {
    id: 'task1',
    titulo: 'Test Task',
    descripcion: 'Test description',
  };

  const renderComponent = () => render(
    <TaskCompletionDialog
      open={true}
      onOpenChange={vi.fn()}
      task={mockTask}
      onComplete={vi.fn()}
    />
  );

  it('renders dialog title', () => {
    renderComponent();
    expect(screen.getByText('Completar Tarea')).toBeInTheDocument();
  });

  it('renders task title', () => {
    renderComponent();
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });

  it('renders resultado options', () => {
    renderComponent();
    expect(screen.getByText('Éxito total')).toBeInTheDocument();
    expect(screen.getByText('Éxito parcial')).toBeInTheDocument();
    expect(screen.getByText('No completada')).toBeInTheDocument();
  });

  it('renders insights textarea', () => {
    renderComponent();
    expect(screen.getByText(/Qué insights obtuviste/)).toBeInTheDocument();
  });

  it('renders aprendizaje textarea', () => {
    renderComponent();
    expect(screen.getByText(/Qué aprendizaje te llevas/)).toBeInTheDocument();
  });

  it('renders completar tarea button', () => {
    renderComponent();
    expect(screen.getByText('Completar tarea')).toBeInTheDocument();
  });
});
