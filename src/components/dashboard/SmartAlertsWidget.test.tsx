import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SmartAlertsWidget } from './SmartAlertsWidget';

// Mock hooks
vi.mock('@/hooks/useNovaData', () => ({
  useProfiles: vi.fn(),
  useProjects: vi.fn(),
  useMemberStats: vi.fn(),
  useObjectives: vi.fn(),
}));

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { useProfiles, useProjects, useMemberStats, useObjectives } from '@/hooks/useNovaData';
import { supabase } from '@/integrations/supabase/client';

const mockProfiles = [
  { id: 'user1', nombre: 'Juan Pérez' },
  { id: 'user2', nombre: 'María González' },
];

const mockProjects = [
  { id: 'proj1', nombre: 'Proyecto Alpha' },
];

const mockMemberStats = [
  { member_id: 'user1', obvs: 10 },
  { member_id: 'user2', obvs: 15 },
];

const mockObjectives = [
  { name: 'obvs', target_value: 150 },
];

describe('SmartAlertsWidget', () => {
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
    (useMemberStats as any).mockReturnValue({ data: mockMemberStats });
    (useObjectives as any).mockReturnValue({ data: mockObjectives });
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <SmartAlertsWidget />
      </QueryClientProvider>
    );
  };

  it('renders loading state', () => {
    renderComponent();
    expect(screen.getByText('Alertas')).toBeInTheDocument();
  });

  it('renders header with icon', () => {
    const { container } = renderComponent();
    expect(screen.getByText('Alertas')).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('shows loading spinner initially', () => {
    renderComponent();
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('renders empty state when no alerts', async () => {
    const recentDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();

    const mockObvsFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        gte: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({
            data: [
              { owner_id: 'user1', created_at: recentDate },
              { owner_id: 'user2', created_at: recentDate }
            ],
            error: null
          })),
        })),
      })),
    }));

    const mockLeadsFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        lt: vi.fn(() => ({
          neq: vi.fn(() => ({
            neq: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          })),
        })),
      })),
    }));

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'obvs') return mockObvsFrom();
      if (table === 'leads') return mockLeadsFrom();
      return null;
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Todo en orden, ¡sigue así!')).toBeInTheDocument();
      expect(screen.getByText('✅')).toBeInTheDocument();
    });
  });

  it('renders inactive member alert', async () => {
    const oldDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();

    const mockObvsFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        gte: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({
            data: [{ owner_id: 'user1', created_at: oldDate }],
            error: null
          })),
        })),
      })),
    }));

    const mockLeadsFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        lt: vi.fn(() => ({
          neq: vi.fn(() => ({
            neq: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          })),
        })),
      })),
    }));

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'obvs') return mockObvsFrom();
      if (table === 'leads') return mockLeadsFrom();
      return null;
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/María González sin actividad/)).toBeInTheDocument();
    });
  });

  it('renders stale leads alert', async () => {
    const mockObvsFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        gte: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    }));

    const mockLeadsFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        lt: vi.fn(() => ({
          neq: vi.fn(() => ({
            neq: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve({
                data: [
                  { id: '1', nombre: 'Lead 1', project_id: 'proj1', proxima_accion_fecha: '2020-01-01' }
                ],
                error: null
              })),
            })),
          })),
        })),
      })),
    }));

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'obvs') return mockObvsFrom();
      if (table === 'leads') return mockLeadsFrom();
      return null;
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Proyecto Alpha: seguimiento pendiente/)).toBeInTheDocument();
      expect(screen.getByText(/1 lead con fecha de acción vencida/)).toBeInTheDocument();
    });
  });

  it('renders multiple stale leads for same project', async () => {
    const mockObvsFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        gte: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    }));

    const mockLeadsFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        lt: vi.fn(() => ({
          neq: vi.fn(() => ({
            neq: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve({
                data: [
                  { id: '1', nombre: 'Lead 1', project_id: 'proj1', proxima_accion_fecha: '2020-01-01' },
                  { id: '2', nombre: 'Lead 2', project_id: 'proj1', proxima_accion_fecha: '2020-01-01' },
                ],
                error: null
              })),
            })),
          })),
        })),
      })),
    }));

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'obvs') return mockObvsFrom();
      if (table === 'leads') return mockLeadsFrom();
      return null;
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/2 leads con fecha de acción vencida/)).toBeInTheDocument();
    });
  });

  it('renders alert count badge', async () => {
    const oldDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    const recentDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();

    const mockObvsFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        gte: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({
            data: [
              { owner_id: 'user1', created_at: recentDate },
              { owner_id: 'user2', created_at: oldDate }
            ],
            error: null
          })),
        })),
      })),
    }));

    const mockLeadsFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        lt: vi.fn(() => ({
          neq: vi.fn(() => ({
            neq: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          })),
        })),
      })),
    }));

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'obvs') return mockObvsFrom();
      if (table === 'leads') return mockLeadsFrom();
      return null;
    });

    renderComponent();

    await waitFor(() => {
      const badges = document.querySelectorAll('.bg-warning\\/20.text-warning');
      expect(badges.length).toBeGreaterThan(0);
      expect(badges[0]).toHaveTextContent('1');
    });
  });

  it('applies error severity styling', async () => {
    const oldDate = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString();

    const mockObvsFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        gte: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({
            data: [{ owner_id: 'user1', created_at: oldDate }],
            error: null
          })),
        })),
      })),
    }));

    const mockLeadsFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        lt: vi.fn(() => ({
          neq: vi.fn(() => ({
            neq: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          })),
        })),
      })),
    }));

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'obvs') return mockObvsFrom();
      if (table === 'leads') return mockLeadsFrom();
      return null;
    });

    const { container } = renderComponent();

    await waitFor(() => {
      const alertBox = container.querySelector('.bg-destructive\\/10');
      expect(alertBox).toBeInTheDocument();
    });
  });

  it('applies warning severity styling', async () => {
    const oldDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const mockObvsFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        gte: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({
            data: [{ owner_id: 'user1', created_at: oldDate }],
            error: null
          })),
        })),
      })),
    }));

    const mockLeadsFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        lt: vi.fn(() => ({
          neq: vi.fn(() => ({
            neq: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          })),
        })),
      })),
    }));

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'obvs') return mockObvsFrom();
      if (table === 'leads') return mockLeadsFrom();
      return null;
    });

    const { container } = renderComponent();

    await waitFor(() => {
      const alertBox = container.querySelector('.bg-warning\\/10');
      expect(alertBox).toBeInTheDocument();
    });
  });

  it('limits alerts to maximum 5', async () => {
    const oldDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();

    // Create mock data that would generate many alerts
    const manyProfiles = Array.from({ length: 10 }, (_, i) => ({
      id: `user${i}`,
      nombre: `User ${i}`,
    }));

    (useProfiles as any).mockReturnValue({ data: manyProfiles });

    const mockObvsFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        gte: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    }));

    const mockLeadsFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        lt: vi.fn(() => ({
          neq: vi.fn(() => ({
            neq: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          })),
        })),
      })),
    }));

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'obvs') return mockObvsFrom();
      if (table === 'leads') return mockLeadsFrom();
      return null;
    });

    const { container } = renderComponent();

    await waitFor(() => {
      const alertItems = container.querySelectorAll('.space-y-3 > div');
      expect(alertItems.length).toBeLessThanOrEqual(5);
    });
  });

  it('renders alert with icon', async () => {
    const oldDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();

    const mockObvsFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        gte: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({
            data: [{ owner_id: 'user1', created_at: oldDate }],
            error: null
          })),
        })),
      })),
    }));

    const mockLeadsFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        lt: vi.fn(() => ({
          neq: vi.fn(() => ({
            neq: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          })),
        })),
      })),
    }));

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'obvs') return mockObvsFrom();
      if (table === 'leads') return mockLeadsFrom();
      return null;
    });

    const { container } = renderComponent();

    await waitFor(() => {
      const icons = container.querySelectorAll('.shrink-0 svg');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  it('shows success icon when no alerts', async () => {
    const recentDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();

    const mockObvsFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        gte: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({
            data: [
              { owner_id: 'user1', created_at: recentDate },
              { owner_id: 'user2', created_at: recentDate }
            ],
            error: null
          })),
        })),
      })),
    }));

    const mockLeadsFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        lt: vi.fn(() => ({
          neq: vi.fn(() => ({
            neq: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          })),
        })),
      })),
    }));

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'obvs') return mockObvsFrom();
      if (table === 'leads') return mockLeadsFrom();
      return null;
    });

    const { container } = renderComponent();

    await waitFor(() => {
      const successIcon = container.querySelector('.text-success');
      expect(successIcon).toBeInTheDocument();
    });
  });
});
