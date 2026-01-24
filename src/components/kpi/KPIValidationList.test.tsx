import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { KPIValidationList } from './KPIValidationList';

// Mock components
vi.mock('@/components/evidence/EvidenceViewer', () => ({
  EvidenceViewer: ({ url, compact }: any) => <div data-testid="evidence-viewer">{url}</div>,
}));

// Mock hooks
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    profile: { id: 'validator1', nombre: 'Validator User' },
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
        in: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  },
}));

import { supabase } from '@/integrations/supabase/client';

describe('KPIValidationList', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderComponent = (type: 'lp' | 'bp' | 'cp' = 'lp') => {
    return render(
      <QueryClientProvider client={queryClient}>
        <KPIValidationList type={type} />
      </QueryClientProvider>
    );
  };

  it('renders loading state', () => {
    renderComponent();
    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
  });

  it('renders empty state when no pending KPIs', async () => {
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
      expect(screen.getByText(/No hay Learning Paths pendientes de validar/)).toBeInTheDocument();
    });
  });

  it('renders pending KPIs list', async () => {
    const mockKPIs = [
      {
        id: 'kpi1',
        titulo: 'Test KPI 1',
        descripcion: 'Description 1',
        evidence_url: 'https://drive.google.com/file/d/test1',
        type: 'lp',
        cp_points: null,
        created_at: new Date().toISOString(),
        owner_id: 'owner1',
        status: 'pending',
      },
    ];

    const mockProfiles = [
      { id: 'owner1', nombre: 'Owner User', color: '#6366F1' },
    ];

    let callCount = 0;
    const mockFrom = vi.fn((table: string) => {
      if (table === 'kpis') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              neq: vi.fn(() => ({
                order: vi.fn(() => Promise.resolve({ data: mockKPIs, error: null })),
              })),
            })),
          })),
        };
      }
      if (table === 'kpi_validaciones') {
        return {
          select: vi.fn(() => ({
            in: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        };
      }
      if (table === 'profiles') {
        return {
          select: vi.fn(() => ({
            in: vi.fn(() => Promise.resolve({ data: mockProfiles, error: null })),
          })),
        };
      }
      return null;
    });
    (supabase.from as any).mockImplementation(mockFrom);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Test KPI 1')).toBeInTheDocument();
      expect(screen.getByText('Description 1')).toBeInTheDocument();
      expect(screen.getByText(/Owner User/)).toBeInTheDocument();
    });
  });

  it('renders evidence viewer when evidence URL is provided', async () => {
    const mockKPIs = [
      {
        id: 'kpi1',
        titulo: 'KPI with Evidence',
        descripcion: null,
        evidence_url: 'https://drive.google.com/file/d/test',
        type: 'lp',
        cp_points: null,
        created_at: new Date().toISOString(),
        owner_id: 'owner1',
        status: 'pending',
      },
    ];

    const mockProfiles = [
      { id: 'owner1', nombre: 'Owner', color: '#6366F1' },
    ];

    const mockFrom = vi.fn((table: string) => {
      if (table === 'kpis') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              neq: vi.fn(() => ({
                order: vi.fn(() => Promise.resolve({ data: mockKPIs, error: null })),
              })),
            })),
          })),
        };
      }
      if (table === 'kpi_validaciones') {
        return {
          select: vi.fn(() => ({
            in: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        };
      }
      if (table === 'profiles') {
        return {
          select: vi.fn(() => ({
            in: vi.fn(() => Promise.resolve({ data: mockProfiles, error: null })),
          })),
        };
      }
    });
    (supabase.from as any).mockImplementation(mockFrom);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('evidence-viewer')).toBeInTheDocument();
    });
  });

  it('renders CP points badge for community points with value > 1', async () => {
    const mockKPIs = [
      {
        id: 'kpi1',
        titulo: 'CP KPI',
        descripcion: null,
        evidence_url: null,
        type: 'cp',
        cp_points: 3,
        created_at: new Date().toISOString(),
        owner_id: 'owner1',
        status: 'pending',
      },
    ];

    const mockProfiles = [{ id: 'owner1', nombre: 'Owner', color: '#6366F1' }];

    const mockFrom = vi.fn((table: string) => {
      if (table === 'kpis') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              neq: vi.fn(() => ({
                order: vi.fn(() => Promise.resolve({ data: mockKPIs, error: null })),
              })),
            })),
          })),
        };
      }
      if (table === 'kpi_validaciones') {
        return {
          select: vi.fn(() => ({
            in: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        };
      }
      if (table === 'profiles') {
        return {
          select: vi.fn(() => ({
            in: vi.fn(() => Promise.resolve({ data: mockProfiles, error: null })),
          })),
        };
      }
    });
    (supabase.from as any).mockImplementation(mockFrom);

    renderComponent('cp');

    await waitFor(() => {
      expect(screen.getByText('3 pts')).toBeInTheDocument();
    });
  });

  it('renders owner avatar with first letter', async () => {
    const mockKPIs = [
      {
        id: 'kpi1',
        titulo: 'Test KPI',
        descripcion: null,
        evidence_url: null,
        type: 'lp',
        cp_points: null,
        created_at: new Date().toISOString(),
        owner_id: 'owner1',
        status: 'pending',
      },
    ];

    const mockProfiles = [{ id: 'owner1', nombre: 'Alice', color: '#FF6B6B' }];

    const mockFrom = vi.fn((table: string) => {
      if (table === 'kpis') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              neq: vi.fn(() => ({
                order: vi.fn(() => Promise.resolve({ data: mockKPIs, error: null })),
              })),
            })),
          })),
        };
      }
      if (table === 'kpi_validaciones') {
        return {
          select: vi.fn(() => ({
            in: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        };
      }
      if (table === 'profiles') {
        return {
          select: vi.fn(() => ({
            in: vi.fn(() => Promise.resolve({ data: mockProfiles, error: null })),
          })),
        };
      }
    });
    (supabase.from as any).mockImplementation(mockFrom);

    const { container } = renderComponent();

    await waitFor(() => {
      const avatar = screen.getByText('A');
      expect(avatar).toHaveStyle({ backgroundColor: '#FF6B6B' });
    });
  });

  it('displays existing validations with approvals and comments', async () => {
    const mockKPIs = [
      {
        id: 'kpi1',
        titulo: 'KPI with Validations',
        descripcion: null,
        evidence_url: null,
        type: 'lp',
        cp_points: null,
        created_at: new Date().toISOString(),
        owner_id: 'owner1',
        status: 'pending',
      },
    ];

    const mockValidations = [
      {
        kpi_id: 'kpi1',
        validator_id: 'validator2',
        approved: true,
        comentario: 'Excelente trabajo',
      },
      {
        kpi_id: 'kpi1',
        validator_id: 'validator3',
        approved: false,
        comentario: 'Falta evidencia',
      },
    ];

    const mockProfiles = [{ id: 'owner1', nombre: 'Owner', color: '#6366F1' }];
    const mockValidators = [
      { id: 'validator2', nombre: 'Validator 2' },
      { id: 'validator3', nombre: 'Validator 3' },
    ];

    const mockFrom = vi.fn((table: string) => {
      if (table === 'kpis') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              neq: vi.fn(() => ({
                order: vi.fn(() => Promise.resolve({ data: mockKPIs, error: null })),
              })),
            })),
          })),
        };
      }
      if (table === 'kpi_validaciones') {
        return {
          select: vi.fn(() => ({
            in: vi.fn(() => Promise.resolve({ data: mockValidations, error: null })),
          })),
        };
      }
      if (table === 'profiles') {
        return {
          select: vi.fn(() => ({
            in: vi.fn((field: string, ids: string[]) => {
              if (ids.includes('validator2') || ids.includes('validator3')) {
                return Promise.resolve({ data: mockValidators, error: null });
              }
              return Promise.resolve({ data: mockProfiles, error: null });
            }),
          })),
        };
      }
    });
    (supabase.from as any).mockImplementation(mockFrom);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Validator 2')).toBeInTheDocument();
      expect(screen.getByText('Validator 3')).toBeInTheDocument();
      expect(screen.getByText(/"Excelente trabajo"/)).toBeInTheDocument();
      expect(screen.getByText(/"Falta evidencia"/)).toBeInTheDocument();
    });
  });

  it('shows validation button and opens comment form on click', async () => {
    const user = userEvent.setup();
    const mockKPIs = [
      {
        id: 'kpi1',
        titulo: 'Test KPI',
        descripcion: null,
        evidence_url: null,
        type: 'lp',
        cp_points: null,
        created_at: new Date().toISOString(),
        owner_id: 'owner1',
        status: 'pending',
      },
    ];

    const mockProfiles = [{ id: 'owner1', nombre: 'Owner', color: '#6366F1' }];

    const mockFrom = vi.fn((table: string) => {
      if (table === 'kpis') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              neq: vi.fn(() => ({
                order: vi.fn(() => Promise.resolve({ data: mockKPIs, error: null })),
              })),
            })),
          })),
        };
      }
      if (table === 'kpi_validaciones') {
        return {
          select: vi.fn(() => ({
            in: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        };
      }
      if (table === 'profiles') {
        return {
          select: vi.fn(() => ({
            in: vi.fn(() => Promise.resolve({ data: mockProfiles, error: null })),
          })),
        };
      }
    });
    (supabase.from as any).mockImplementation(mockFrom);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Validar')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Validar'));

    expect(screen.getByPlaceholderText('Comentario opcional...')).toBeInTheDocument();
    expect(screen.getByText('Aprobar')).toBeInTheDocument();
    expect(screen.getByText('Rechazar')).toBeInTheDocument();
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
  });

  it('queries KPIs with correct type filter', async () => {
    const mockFrom = vi.fn((table: string) => {
      if (table === 'kpis') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              neq: vi.fn(() => ({
                order: vi.fn(() => Promise.resolve({ data: [], error: null })),
              })),
            })),
          })),
        };
      }
      return {
        select: vi.fn(() => ({
          in: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      };
    });
    (supabase.from as any).mockImplementation(mockFrom);

    renderComponent('bp');

    await waitFor(() => {
      expect(screen.getByText(/No hay Book Points pendientes/)).toBeInTheDocument();
    });
  });

  it('filters out KPIs already validated by current user', async () => {
    const mockKPIs = [
      {
        id: 'kpi1',
        titulo: 'KPI 1',
        descripcion: null,
        evidence_url: null,
        type: 'lp',
        cp_points: null,
        created_at: new Date().toISOString(),
        owner_id: 'owner1',
        status: 'pending',
      },
      {
        id: 'kpi2',
        titulo: 'KPI 2',
        descripcion: null,
        evidence_url: null,
        type: 'lp',
        cp_points: null,
        created_at: new Date().toISOString(),
        owner_id: 'owner2',
        status: 'pending',
      },
    ];

    const mockValidations = [
      {
        kpi_id: 'kpi1',
        validator_id: 'validator1', // Current user already validated this
        approved: true,
        comentario: null,
      },
    ];

    const mockProfiles = [
      { id: 'owner1', nombre: 'Owner 1', color: '#6366F1' },
      { id: 'owner2', nombre: 'Owner 2', color: '#22C55E' },
    ];

    const mockFrom = vi.fn((table: string) => {
      if (table === 'kpis') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              neq: vi.fn(() => ({
                order: vi.fn(() => Promise.resolve({ data: mockKPIs, error: null })),
              })),
            })),
          })),
        };
      }
      if (table === 'kpi_validaciones') {
        return {
          select: vi.fn(() => ({
            in: vi.fn(() => Promise.resolve({ data: mockValidations, error: null })),
          })),
        };
      }
      if (table === 'profiles') {
        return {
          select: vi.fn(() => ({
            in: vi.fn(() => Promise.resolve({ data: mockProfiles, error: null })),
          })),
        };
      }
    });
    (supabase.from as any).mockImplementation(mockFrom);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('KPI 2')).toBeInTheDocument();
      expect(screen.queryByText('KPI 1')).not.toBeInTheDocument();
    });
  });
});
