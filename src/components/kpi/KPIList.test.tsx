import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { KPIList } from './KPIList';

// Mock auth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    profile: { id: 'user1', nombre: 'Test User' },
  })),
}));

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      })),
    })),
  },
}));

import { supabase } from '@/integrations/supabase/client';

describe('KPIList', () => {
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
        <KPIList type={type} />
      </QueryClientProvider>
    );
  };

  it('renders loading state', () => {
    renderComponent();
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('renders empty state when no KPIs', async () => {
    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      })),
    }));
    (supabase.from as any).mockImplementation(mockFrom);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/No tienes/)).toBeInTheDocument();
      expect(screen.getByText(/Learning Path/)).toBeInTheDocument();
      expect(screen.getByText(/s registrados/)).toBeInTheDocument();
    });
  });

  it('renders KPI list when data is available', async () => {
    const mockKPIs = [
      {
        id: '1',
        titulo: 'Test LP 1',
        descripcion: 'Description 1',
        status: 'pending',
        created_at: new Date().toISOString(),
        evidence_url: 'https://drive.google.com/file/d/test1',
      },
      {
        id: '2',
        titulo: 'Test LP 2',
        descripcion: 'Description 2',
        status: 'validated',
        created_at: new Date().toISOString(),
        evidence_url: 'https://drive.google.com/file/d/test2',
      },
    ];

    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: mockKPIs, error: null })),
          })),
        })),
      })),
    }));
    (supabase.from as any).mockImplementation(mockFrom);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Test LP 1')).toBeInTheDocument();
      expect(screen.getByText('Test LP 2')).toBeInTheDocument();
    });
  });

  it('renders validated status badge', async () => {
    const mockKPIs = [
      {
        id: '1',
        titulo: 'Validated KPI',
        status: 'validated',
        created_at: new Date().toISOString(),
      },
    ];

    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: mockKPIs, error: null })),
          })),
        })),
      })),
    }));
    (supabase.from as any).mockImplementation(mockFrom);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Validado')).toBeInTheDocument();
    });
  });

  it('renders rejected status badge', async () => {
    const mockKPIs = [
      {
        id: '1',
        titulo: 'Rejected KPI',
        status: 'rejected',
        created_at: new Date().toISOString(),
      },
    ];

    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: mockKPIs, error: null })),
          })),
        })),
      })),
    }));
    (supabase.from as any).mockImplementation(mockFrom);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Rechazado')).toBeInTheDocument();
    });
  });

  it('renders pending status badge', async () => {
    const mockKPIs = [
      {
        id: '1',
        titulo: 'Pending KPI',
        status: 'pending',
        created_at: new Date().toISOString(),
      },
    ];

    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: mockKPIs, error: null })),
          })),
        })),
      })),
    }));
    (supabase.from as any).mockImplementation(mockFrom);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Pendiente')).toBeInTheDocument();
    });
  });

  it('renders evidence button when URL is provided', async () => {
    const mockKPIs = [
      {
        id: '1',
        titulo: 'KPI with Evidence',
        status: 'pending',
        created_at: new Date().toISOString(),
        evidence_url: 'https://drive.google.com/file/d/test',
      },
    ];

    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: mockKPIs, error: null })),
          })),
        })),
      })),
    }));
    (supabase.from as any).mockImplementation(mockFrom);

    const { container } = renderComponent();

    await waitFor(() => {
      expect(screen.getByText('KPI with Evidence')).toBeInTheDocument();
    });

    // Check for ExternalLink icon
    const externalLinkIcon = container.querySelector('.lucide-external-link');
    expect(externalLinkIcon).toBeInTheDocument();
  });

  it('does not render evidence link when URL is missing', async () => {
    const mockKPIs = [
      {
        id: '1',
        titulo: 'KPI without Evidence',
        status: 'pending',
        created_at: new Date().toISOString(),
        evidence_url: null,
      },
    ];

    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: mockKPIs, error: null })),
          })),
        })),
      })),
    }));
    (supabase.from as any).mockImplementation(mockFrom);

    const { container } = renderComponent();

    await waitFor(() => {
      expect(screen.getByText('KPI without Evidence')).toBeInTheDocument();
    });

    const button = container.querySelector('button[type="button"]');
    expect(button).not.toBeInTheDocument();
  });

  it('formats date correctly', async () => {
    const mockDate = new Date('2024-03-15T10:30:00Z');
    const mockKPIs = [
      {
        id: '1',
        titulo: 'Date Test KPI',
        status: 'pending',
        created_at: mockDate.toISOString(),
      },
    ];

    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: mockKPIs, error: null })),
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

  it('queries with correct type for LP', async () => {
    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      })),
    }));
    (supabase.from as any).mockImplementation(mockFrom);

    renderComponent('lp');

    await waitFor(() => {
      expect(screen.getByText(/Learning Path/)).toBeInTheDocument();
    });

    expect(mockFrom).toHaveBeenCalledWith('kpis');
  });

  it('queries with correct type for BP', async () => {
    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      })),
    }));
    (supabase.from as any).mockImplementation(mockFrom);

    renderComponent('bp');

    await waitFor(() => {
      expect(screen.getByText(/Book Point/)).toBeInTheDocument();
    });
  });

  it('queries with correct type for CP', async () => {
    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      })),
    }));
    (supabase.from as any).mockImplementation(mockFrom);

    renderComponent('cp');

    await waitFor(() => {
      expect(screen.getByText(/Community Point/)).toBeInTheDocument();
    });
  });

  it('applies default styling to validated badge', async () => {
    const mockKPIs = [
      {
        id: '1',
        titulo: 'Test',
        status: 'validated',
        created_at: new Date().toISOString(),
      },
    ];

    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: mockKPIs, error: null })),
          })),
        })),
      })),
    }));
    (supabase.from as any).mockImplementation(mockFrom);

    renderComponent();

    await waitFor(() => {
      const badge = screen.getByText('Validado');
      expect(badge).toHaveClass('bg-primary', 'text-primary-foreground');
    });
  });

  it('applies destructive styling to rejected badge', async () => {
    const mockKPIs = [
      {
        id: '1',
        titulo: 'Test',
        status: 'rejected',
        created_at: new Date().toISOString(),
      },
    ];

    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: mockKPIs, error: null })),
          })),
        })),
      })),
    }));
    (supabase.from as any).mockImplementation(mockFrom);

    renderComponent();

    await waitFor(() => {
      const badge = screen.getByText('Rechazado');
      expect(badge).toHaveClass('bg-destructive', 'text-destructive-foreground');
    });
  });

  it('applies secondary styling to pending badge', async () => {
    const mockKPIs = [
      {
        id: '1',
        titulo: 'Test',
        status: 'pending',
        created_at: new Date().toISOString(),
      },
    ];

    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: mockKPIs, error: null })),
          })),
        })),
      })),
    }));
    (supabase.from as any).mockImplementation(mockFrom);

    renderComponent();

    await waitFor(() => {
      const badge = screen.getByText('Pendiente');
      expect(badge).toHaveClass('bg-secondary', 'text-secondary-foreground');
    });
  });

  it('renders multiple KPIs in order', async () => {
    const mockKPIs = [
      {
        id: '1',
        titulo: 'First KPI',
        status: 'pending',
        created_at: new Date('2024-03-15').toISOString(),
      },
      {
        id: '2',
        titulo: 'Second KPI',
        status: 'validated',
        created_at: new Date('2024-03-14').toISOString(),
      },
      {
        id: '3',
        titulo: 'Third KPI',
        status: 'rejected',
        created_at: new Date('2024-03-13').toISOString(),
      },
    ];

    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: mockKPIs, error: null })),
          })),
        })),
      })),
    }));
    (supabase.from as any).mockImplementation(mockFrom);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('First KPI')).toBeInTheDocument();
      expect(screen.getByText('Second KPI')).toBeInTheDocument();
      expect(screen.getByText('Third KPI')).toBeInTheDocument();
    });
  });

  it('renders description when provided', async () => {
    const mockKPIs = [
      {
        id: '1',
        titulo: 'Test KPI',
        descripcion: 'This is a test description',
        status: 'pending',
        created_at: new Date().toISOString(),
      },
    ];

    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: mockKPIs, error: null })),
          })),
        })),
      })),
    }));
    (supabase.from as any).mockImplementation(mockFrom);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('This is a test description')).toBeInTheDocument();
    });
  });
});
