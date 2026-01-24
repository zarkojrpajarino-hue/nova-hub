import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RecentActivityFeed } from './RecentActivityFeed';

// Mock hooks
vi.mock('@/hooks/useNovaData', () => ({
  useProfiles: vi.fn(),
  useProjects: vi.fn(),
}));

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    })),
  },
}));

import { useProfiles, useProjects } from '@/hooks/useNovaData';
import { supabase } from '@/integrations/supabase/client';

const mockProfiles = [
  { id: 'user1', nombre: 'Juan Pérez', color: '#6366F1' },
  { id: 'user2', nombre: 'María González', color: '#22C55E' },
];

const mockProjects = [
  { id: 'proj1', nombre: 'Proyecto Alpha' },
  { id: 'proj2', nombre: 'Proyecto Beta' },
];

describe('RecentActivityFeed', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
    (useProfiles as any).mockReturnValue({ data: mockProfiles });
    (useProjects as any).mockReturnValue({ data: mockProjects });
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <RecentActivityFeed />
      </QueryClientProvider>
    );
  };

  it('renders loading state', () => {
    renderComponent();
    expect(screen.getByText('Actividad Reciente')).toBeInTheDocument();
  });

  it('renders header with icon', () => {
    const { container } = renderComponent();
    expect(screen.getByText('Actividad Reciente')).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('shows loading spinner initially', () => {
    renderComponent();
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('renders empty state when no activities', async () => {
    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    }));
    (supabase.from as any).mockImplementation(mockFrom);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Sin actividad reciente')).toBeInTheDocument();
    });
  });

  it('renders activities when data is available', async () => {
    const mockActivities = [
      {
        id: '1',
        action: 'obv_created',
        entity_type: 'obv',
        entity_id: 'obv1',
        user_id: 'user1',
        created_at: new Date().toISOString(),
        metadata: { titulo: 'OBV Test' },
      },
    ];

    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: mockActivities, error: null })),
        })),
      })),
    }));
    (supabase.from as any).mockImplementation(mockFrom);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      expect(screen.getByText('subió OBV')).toBeInTheDocument();
      expect(screen.getByText('OBV Test')).toBeInTheDocument();
    });
  });

  it('renders user avatar with color', async () => {
    const mockActivities = [
      {
        id: '1',
        action: 'obv_created',
        entity_type: 'obv',
        entity_id: 'obv1',
        user_id: 'user1',
        created_at: new Date().toISOString(),
        metadata: { titulo: 'Test' },
      },
    ];

    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: mockActivities, error: null })),
        })),
      })),
    }));
    (supabase.from as any).mockImplementation(mockFrom);

    renderComponent();

    await waitFor(() => {
      const avatar = screen.getByText('J');
      expect(avatar).toHaveStyle({ backgroundColor: '#6366F1' });
    });
  });

  it('renders activity with facturacion amount', async () => {
    const mockActivities = [
      {
        id: '1',
        action: 'obv_validated',
        entity_type: 'obv',
        entity_id: 'obv1',
        user_id: 'user2',
        created_at: new Date().toISOString(),
        metadata: { titulo: 'OBV Facturado', facturacion: 5000 },
      },
    ];

    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: mockActivities, error: null })),
        })),
      })),
    }));
    (supabase.from as any).mockImplementation(mockFrom);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('€5000')).toBeInTheDocument();
    });
  });

  it('renders multiple activities', async () => {
    const mockActivities = [
      {
        id: '1',
        action: 'obv_created',
        entity_type: 'obv',
        user_id: 'user1',
        created_at: new Date().toISOString(),
        metadata: { titulo: 'OBV 1' },
      },
      {
        id: '2',
        action: 'lead_created',
        entity_type: 'lead',
        user_id: 'user2',
        created_at: new Date().toISOString(),
        metadata: { nombre: 'Lead Test' },
      },
    ];

    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: mockActivities, error: null })),
        })),
      })),
    }));
    (supabase.from as any).mockImplementation(mockFrom);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('OBV 1')).toBeInTheDocument();
      expect(screen.getByText('Lead Test')).toBeInTheDocument();
    });
  });

  it('renders kpi activity with type', async () => {
    const mockActivities = [
      {
        id: '1',
        action: 'kpi_created',
        entity_type: 'kpi',
        user_id: 'user1',
        created_at: new Date().toISOString(),
        metadata: { type: 'bp', titulo: 'Book Power' },
      },
    ];

    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: mockActivities, error: null })),
        })),
      })),
    }));
    (supabase.from as any).mockImplementation(mockFrom);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/BP:/)).toBeInTheDocument();
      expect(screen.getByText(/Book Power/)).toBeInTheDocument();
    });
  });

  it('renders lead activity with project name', async () => {
    const mockActivities = [
      {
        id: '1',
        action: 'lead_updated',
        entity_type: 'lead',
        user_id: 'user1',
        created_at: new Date().toISOString(),
        metadata: { nombre: 'Cliente ABC', proyecto_nombre: 'Proyecto Alpha' },
      },
    ];

    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: mockActivities, error: null })),
        })),
      })),
    }));
    (supabase.from as any).mockImplementation(mockFrom);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Cliente ABC en Proyecto Alpha/)).toBeInTheDocument();
    });
  });

  it('renders task completed activity', async () => {
    const mockActivities = [
      {
        id: '1',
        action: 'task_completed',
        entity_type: 'task',
        user_id: 'user1',
        created_at: new Date().toISOString(),
        metadata: { titulo: 'Tarea Importante' },
      },
    ];

    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: mockActivities, error: null })),
        })),
      })),
    }));
    (supabase.from as any).mockImplementation(mockFrom);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('completó tarea')).toBeInTheDocument();
      expect(screen.getByText('Tarea Importante')).toBeInTheDocument();
    });
  });

  it('handles unknown user gracefully', async () => {
    const mockActivities = [
      {
        id: '1',
        action: 'obv_created',
        entity_type: 'obv',
        user_id: 'unknown-user',
        created_at: new Date().toISOString(),
        metadata: { titulo: 'Test' },
      },
    ];

    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: mockActivities, error: null })),
        })),
      })),
    }));
    (supabase.from as any).mockImplementation(mockFrom);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Usuario')).toBeInTheDocument();
    });
  });

  it('renders time ago text', async () => {
    const mockActivities = [
      {
        id: '1',
        action: 'obv_created',
        entity_type: 'obv',
        user_id: 'user1',
        created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
        metadata: { titulo: 'Test' },
      },
    ];

    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: mockActivities, error: null })),
        })),
      })),
    }));
    (supabase.from as any).mockImplementation(mockFrom);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/hace/)).toBeInTheDocument();
    });
  });

  it('has scrollable container', async () => {
    renderComponent();

    await waitFor(() => {
      const container = document.querySelector('.max-h-\\[400px\\]');
      expect(container).toHaveClass('overflow-y-auto');
    });
  });

  it('applies hover effect to activity items', async () => {
    const mockActivities = [
      {
        id: '1',
        action: 'obv_created',
        entity_type: 'obv',
        user_id: 'user1',
        created_at: new Date().toISOString(),
        metadata: { titulo: 'Test' },
      },
    ];

    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: mockActivities, error: null })),
        })),
      })),
    }));
    (supabase.from as any).mockImplementation(mockFrom);

    const { container } = renderComponent();

    await waitFor(() => {
      const activityItem = container.querySelector('.hover\\:bg-muted\\/50');
      expect(activityItem).toBeInTheDocument();
    });
  });
});
