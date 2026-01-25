import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { KanbanBoard } from './KanbanBoard';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({ profile: { id: 'user1' } })),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      })),
    })),
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('./TaskForm', () => ({
  TaskForm: () => <div data-testid="task-form">Task Form</div>,
}));

vi.mock('./TaskPlaybookViewer', () => ({
  TaskPlaybookViewer: () => <div>Playbook Viewer</div>,
}));

vi.mock('./TaskCompletionDialog', () => ({
  TaskCompletionDialog: () => <div>Completion Dialog</div>,
}));

describe('KanbanBoard', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.clearAllMocks();
  });

  const renderComponent = () => render(
    <QueryClientProvider client={queryClient}>
      <KanbanBoard projectId="proj1" projectMembers={[]} />
    </QueryClientProvider>
  );

  it('renders Manual button', async () => {
    renderComponent();
    const button = await screen.findByText('Manual');
    expect(button).toBeInTheDocument();
  });

  it('renders column headers', async () => {
    renderComponent();
    expect(await screen.findByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('Doing')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
    expect(screen.getByText('Blocked')).toBeInTheDocument();
  });
});
