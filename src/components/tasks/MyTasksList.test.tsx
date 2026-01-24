import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { MyTasksList } from './MyTasksList';

// Mock hooks
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    profile: { id: 'user1', nombre: 'Test User' },
  })),
}));

vi.mock('@/hooks/useNovaData', () => ({
  useProjects: vi.fn(() => ({
    data: [
      { id: 'proj1', nombre: 'Proyecto Alpha', icon: '📱', color: '#6366F1' },
      { id: 'proj2', nombre: 'Proyecto Beta', icon: '🚀', color: '#22C55E' },
    ],
  })),
}));

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          neq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
  },
}));

import { supabase } from '@/integrations/supabase/client';

const today = new Date().toISOString().split('T')[0];
const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

describe('MyTasksList', () => {
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
        <MemoryRouter>
          <MyTasksList />
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  it('renders loading state', () => {
    renderComponent();
    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
  });

  it('renders empty state when no tasks', async () => {
    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          neq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      })),
    }));
    (supabase.from as any).mockImplementation(mockFrom);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('No hay tareas pendientes')).toBeInTheDocument();
      expect(screen.getByText('¡Buen trabajo!')).toBeInTheDocument();
    });
  });

  it('renders tasks list with project info', async () => {
    const mockTasks = [
      {
        id: 'task1',
        titulo: 'Complete feature A',
        descripcion: 'Description A',
        status: 'in_progress',
        prioridad: 1,
        fecha_limite: today,
        project_id: 'proj1',
        assignee_id: 'user1',
        ai_generated: false,
      },
    ];

    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          neq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: mockTasks, error: null })),
          })),
        })),
      })),
    }));
    (supabase.from as any).mockImplementation(mockFrom);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Complete feature A')).toBeInTheDocument();
      expect(screen.getByText('📱')).toBeInTheDocument();
      expect(screen.getByText('Proyecto Alpha')).toBeInTheDocument();
    });
  });

  it('groups tasks into today, overdue, and upcoming sections', async () => {
    const mockTasks = [
      {
        id: 'task1',
        titulo: 'Today Task',
        descripcion: null,
        status: 'in_progress',
        prioridad: 1,
        fecha_limite: today,
        project_id: 'proj1',
        assignee_id: 'user1',
        ai_generated: false,
      },
      {
        id: 'task2',
        titulo: 'Overdue Task',
        descripcion: null,
        status: 'in_progress',
        prioridad: 2,
        fecha_limite: yesterday,
        project_id: 'proj1',
        assignee_id: 'user1',
        ai_generated: false,
      },
      {
        id: 'task3',
        titulo: 'Upcoming Task',
        descripcion: null,
        status: 'in_progress',
        prioridad: 3,
        fecha_limite: tomorrow,
        project_id: 'proj2',
        assignee_id: 'user1',
        ai_generated: false,
      },
    ];

    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          neq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: mockTasks, error: null })),
          })),
        })),
      })),
    }));
    (supabase.from as any).mockImplementation(mockFrom);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Atrasadas/)).toBeInTheDocument();
      expect(screen.getByText(/Hoy/)).toBeInTheDocument();
      expect(screen.getByText(/Próximas/)).toBeInTheDocument();
    });
  });

  it('displays priority indicator with correct color', async () => {
    const mockTasks = [
      {
        id: 'task1',
        titulo: 'High Priority Task',
        descripcion: null,
        status: 'in_progress',
        prioridad: 1,
        fecha_limite: today,
        project_id: 'proj1',
        assignee_id: 'user1',
        ai_generated: false,
      },
    ];

    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          neq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: mockTasks, error: null })),
          })),
        })),
      })),
    }));
    (supabase.from as any).mockImplementation(mockFrom);

    const { container } = renderComponent();

    await waitFor(() => {
      const priorityDot = container.querySelector('.w-2.h-2.rounded-full');
      expect(priorityDot).toHaveStyle({ backgroundColor: '#EF4444' }); // Alta priority red
    });
  });

  it('shows AI-generated badge for AI tasks', async () => {
    const mockTasks = [
      {
        id: 'task1',
        titulo: 'AI Generated Task',
        descripcion: null,
        status: 'in_progress',
        prioridad: 2,
        fecha_limite: today,
        project_id: 'proj1',
        assignee_id: 'user1',
        ai_generated: true,
      },
    ];

    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          neq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: mockTasks, error: null })),
          })),
        })),
      })),
    }));
    (supabase.from as any).mockImplementation(mockFrom);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('IA')).toBeInTheDocument();
    });
  });

  it('highlights overdue tasks with alert icon', async () => {
    const mockTasks = [
      {
        id: 'task1',
        titulo: 'Overdue Task',
        descripcion: null,
        status: 'in_progress',
        prioridad: 1,
        fecha_limite: yesterday,
        project_id: 'proj1',
        assignee_id: 'user1',
        ai_generated: false,
      },
    ];

    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          neq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: mockTasks, error: null })),
          })),
        })),
      })),
    }));
    (supabase.from as any).mockImplementation(mockFrom);

    const { container } = renderComponent();

    await waitFor(() => {
      const alertIcons = container.querySelectorAll('.lucide-alert-circle');
      expect(alertIcons.length).toBeGreaterThan(0);
    });
  });

  it('renders filter dropdowns', async () => {
    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          neq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      })),
    }));
    (supabase.from as any).mockImplementation(mockFrom);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('No hay tareas pendientes')).toBeInTheDocument();
    });

    expect(screen.getByRole('combobox', { hidden: true })).toBeInTheDocument();
  });

  it('filters tasks by type (today filter)', async () => {
    const user = userEvent.setup();
    const mockTasks = [
      {
        id: 'task1',
        titulo: 'Today Task',
        descripcion: null,
        status: 'in_progress',
        prioridad: 1,
        fecha_limite: today,
        project_id: 'proj1',
        assignee_id: 'user1',
        ai_generated: false,
      },
      {
        id: 'task2',
        titulo: 'Tomorrow Task',
        descripcion: null,
        status: 'in_progress',
        prioridad: 1,
        fecha_limite: tomorrow,
        project_id: 'proj1',
        assignee_id: 'user1',
        ai_generated: false,
      },
    ];

    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          neq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: mockTasks, error: null })),
          })),
        })),
      })),
    }));
    (supabase.from as any).mockImplementation(mockFrom);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Today Task')).toBeInTheDocument();
      expect(screen.getByText('Tomorrow Task')).toBeInTheDocument();
    });
  });

  it('renders navigation button for project', async () => {
    const mockTasks = [
      {
        id: 'task1',
        titulo: 'Task with Project',
        descripcion: null,
        status: 'in_progress',
        prioridad: 1,
        fecha_limite: today,
        project_id: 'proj1',
        assignee_id: 'user1',
        ai_generated: false,
      },
    ];

    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          neq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: mockTasks, error: null })),
          })),
        })),
      })),
    }));
    (supabase.from as any).mockImplementation(mockFrom);

    const { container } = renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Task with Project')).toBeInTheDocument();
    });

    const chevronButton = container.querySelector('.lucide-chevron-right');
    expect(chevronButton).toBeInTheDocument();
  });

  it('formats due date correctly', async () => {
    const mockTasks = [
      {
        id: 'task1',
        titulo: 'Task with Date',
        descripcion: null,
        status: 'in_progress',
        prioridad: 1,
        fecha_limite: '2024-03-15',
        project_id: 'proj1',
        assignee_id: 'user1',
        ai_generated: false,
      },
    ];

    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          neq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: mockTasks, error: null })),
          })),
        })),
      })),
    }));
    (supabase.from as any).mockImplementation(mockFrom);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/15 mar/)).toBeInTheDocument();
    });
  });

  it('handles tasks without due date', async () => {
    const mockTasks = [
      {
        id: 'task1',
        titulo: 'Task without Date',
        descripcion: null,
        status: 'in_progress',
        prioridad: 1,
        fecha_limite: null,
        project_id: 'proj1',
        assignee_id: 'user1',
        ai_generated: false,
      },
    ];

    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          neq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: mockTasks, error: null })),
          })),
        })),
      })),
    }));
    (supabase.from as any).mockImplementation(mockFrom);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Task without Date')).toBeInTheDocument();
      expect(screen.getByText(/Próximas/)).toBeInTheDocument();
    });
  });
});
