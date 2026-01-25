import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TaskForm } from './TaskForm';

// Mock hooks
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({ profile: { id: 'user1' } })),
}));

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  },
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe('TaskForm', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
  });

  const renderComponent = () => render(
    <QueryClientProvider client={queryClient}>
      <TaskForm
        projectId="proj1"
        projectMembers={[]}
        open={true}
        onOpenChange={vi.fn()}
      />
    </QueryClientProvider>
  );

  it('renders dialog title', () => {
    renderComponent();
    expect(screen.getByText('Nueva Tarea')).toBeInTheDocument();
  });

  it('renders titulo input', () => {
    renderComponent();
    expect(screen.getByLabelText(/Título/)).toBeInTheDocument();
  });

  it('renders descripcion textarea', () => {
    renderComponent();
    expect(screen.getByLabelText('Descripción')).toBeInTheDocument();
  });

  it('renders crear tarea button', () => {
    renderComponent();
    expect(screen.getByText('Crear Tarea')).toBeInTheDocument();
  });
});
