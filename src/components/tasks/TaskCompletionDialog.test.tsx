import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TaskCompletionDialog } from './TaskCompletionDialog';

describe('TaskCompletionDialog', () => {
  const mockTask = {
    id: 'task1',
    titulo: 'Test Task',
    descripcion: 'Test description',
    playbook: null,
    metadata: null,
  };

  it('renders dialog when open', () => {
    render(
      <TaskCompletionDialog
        open={true}
        onOpenChange={() => {}}
        task={mockTask}
        onComplete={async () => {}}
      />
    );
    expect(screen.getByText(/Completar tarea/i)).toBeInTheDocument();
  });

  it('renders task title', () => {
    render(
      <TaskCompletionDialog
        open={true}
        onOpenChange={() => {}}
        task={mockTask}
        onComplete={async () => {}}
      />
    );
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });

  it('renders resultado selector', () => {
    render(
      <TaskCompletionDialog
        open={true}
        onOpenChange={() => {}}
        task={mockTask}
        onComplete={async () => {}}
      />
    );
    expect(screen.getByText(/Resultado/i)).toBeInTheDocument();
  });
});
