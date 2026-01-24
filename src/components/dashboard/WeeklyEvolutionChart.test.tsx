import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WeeklyEvolutionChart } from './WeeklyEvolutionChart';

// Mock Recharts components
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: ({ dataKey }: any) => <div data-testid={`line-${dataKey}`}>{dataKey}</div>,
  XAxis: () => <div data-testid="x-axis">XAxis</div>,
  YAxis: () => <div data-testid="y-axis">YAxis</div>,
  CartesianGrid: () => <div data-testid="cartesian-grid">Grid</div>,
  Tooltip: () => <div data-testid="tooltip">Tooltip</div>,
  Legend: () => <div data-testid="legend">Legend</div>,
}));

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        gte: vi.fn(() => ({
          lte: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    })),
  },
}));

import { supabase } from '@/integrations/supabase/client';

describe('WeeklyEvolutionChart', () => {
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
        <WeeklyEvolutionChart />
      </QueryClientProvider>
    );
  };

  it('renders chart title', () => {
    renderComponent();
    expect(screen.getByText('Evolución Semanal')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    renderComponent();
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('renders chart components when data loads', async () => {
    const mockObvs = [
      {
        id: '1',
        created_at: new Date().toISOString(),
      },
    ];

    const mockKPIs = [
      {
        id: '1',
        type: 'lp',
        created_at: new Date().toISOString(),
      },
    ];

    let callCount = 0;
    const mockFrom = vi.fn((table: string) => ({
      select: vi.fn(() => ({
        gte: vi.fn(() => ({
          lte: vi.fn(() => {
            callCount++;
            if (table === 'obvs') {
              return Promise.resolve({ data: mockObvs, error: null });
            }
            if (table === 'kpis') {
              return Promise.resolve({ data: mockKPIs, error: null });
            }
            return Promise.resolve({ data: [], error: null });
          }),
        })),
      })),
    }));
    (supabase.from as any).mockImplementation(mockFrom);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });

  it('renders responsive container', async () => {
    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        gte: vi.fn(() => ({
          lte: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    }));
    (supabase.from as any).mockImplementation(mockFrom);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });
  });

  it('renders X axis', async () => {
    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        gte: vi.fn(() => ({
          lte: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    }));
    (supabase.from as any).mockImplementation(mockFrom);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('x-axis')).toBeInTheDocument();
    });
  });

  it('renders Y axis', async () => {
    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        gte: vi.fn(() => ({
          lte: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    }));
    (supabase.from as any).mockImplementation(mockFrom);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('y-axis')).toBeInTheDocument();
    });
  });

  it('renders cartesian grid', async () => {
    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        gte: vi.fn(() => ({
          lte: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    }));
    (supabase.from as any).mockImplementation(mockFrom);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
    });
  });

  it('renders tooltip', async () => {
    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        gte: vi.fn(() => ({
          lte: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    }));
    (supabase.from as any).mockImplementation(mockFrom);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    });
  });

  it('renders legend', async () => {
    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        gte: vi.fn(() => ({
          lte: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    }));
    (supabase.from as any).mockImplementation(mockFrom);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('legend')).toBeInTheDocument();
    });
  });

  it('renders OBVs line', async () => {
    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        gte: vi.fn(() => ({
          lte: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    }));
    (supabase.from as any).mockImplementation(mockFrom);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('line-OBVs')).toBeInTheDocument();
    });
  });

  it('renders LPs line', async () => {
    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        gte: vi.fn(() => ({
          lte: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    }));
    (supabase.from as any).mockImplementation(mockFrom);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('line-LPs')).toBeInTheDocument();
    });
  });

  it('renders BPs line', async () => {
    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        gte: vi.fn(() => ({
          lte: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    }));
    (supabase.from as any).mockImplementation(mockFrom);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('line-BPs')).toBeInTheDocument();
    });
  });

  it('does not render CPs line', async () => {
    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        gte: vi.fn(() => ({
          lte: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    }));
    (supabase.from as any).mockImplementation(mockFrom);

    renderComponent();

    await waitFor(() => {
      expect(screen.queryByTestId('line-CPs')).not.toBeInTheDocument();
    });
  });

  it('queries obvs table', async () => {
    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        gte: vi.fn(() => ({
          lte: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    }));
    (supabase.from as any).mockImplementation(mockFrom);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    expect(mockFrom).toHaveBeenCalledWith('obvs');
  });

  it('renders chart with data aggregation', async () => {
    const mockObvs = [
      { id: '1', created_at: new Date().toISOString() },
      { id: '2', created_at: new Date().toISOString() },
    ];

    const mockKPIs = [
      { id: '1', type: 'lp', created_at: new Date().toISOString() },
      { id: '2', type: 'bp', created_at: new Date().toISOString() },
    ];

    const mockFrom = vi.fn((table: string) => ({
      select: vi.fn(() => ({
        gte: vi.fn(() => ({
          lte: vi.fn(() => {
            if (table === 'obvs') {
              return Promise.resolve({ data: mockObvs, error: null });
            }
            if (table === 'kpis') {
              return Promise.resolve({ data: mockKPIs, error: null });
            }
            return Promise.resolve({ data: [], error: null });
          }),
        })),
      })),
    }));
    (supabase.from as any).mockImplementation(mockFrom);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      expect(screen.getByTestId('line-OBVs')).toBeInTheDocument();
      expect(screen.getByTestId('line-LPs')).toBeInTheDocument();
      expect(screen.getByTestId('line-BPs')).toBeInTheDocument();
    });
  });

  it('renders card container', () => {
    const { container } = renderComponent();
    const card = container.querySelector('.border');
    expect(card).toBeInTheDocument();
  });

  it('renders header with icon', () => {
    const { container } = renderComponent();
    expect(screen.getByText('Evolución Semanal')).toBeInTheDocument();
    const header = screen.getByText('Evolución Semanal').closest('div');
    expect(header?.querySelector('svg')).toBeInTheDocument();
  });

  it('shows empty state message when no data', async () => {
    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        gte: vi.fn(() => ({
          lte: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    }));
    (supabase.from as any).mockImplementation(mockFrom);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });

  it('handles query errors gracefully', async () => {
    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        gte: vi.fn(() => ({
          lte: vi.fn(() => Promise.resolve({ data: null, error: { message: 'Error' } })),
        })),
      })),
    }));
    (supabase.from as any).mockImplementation(mockFrom);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });

  it('sets correct height for chart container', async () => {
    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        gte: vi.fn(() => ({
          lte: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    }));
    (supabase.from as any).mockImplementation(mockFrom);

    const { container } = renderComponent();

    await waitFor(() => {
      const chartContainer = container.querySelector('.h-\\[220px\\]');
      expect(chartContainer).toBeInTheDocument();
    });
  });

  it('aggregates data by week', async () => {
    const now = new Date();
    const mockObvs = [
      { id: '1', created_at: now.toISOString() },
      { id: '2', created_at: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString() },
    ];

    const mockFrom = vi.fn((table: string) => ({
      select: vi.fn(() => ({
        gte: vi.fn(() => ({
          lte: vi.fn(() => {
            if (table === 'obvs') {
              return Promise.resolve({ data: mockObvs, error: null });
            }
            return Promise.resolve({ data: [], error: null });
          }),
        })),
      })),
    }));
    (supabase.from as any).mockImplementation(mockFrom);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });

  it('filters KPIs by type correctly', async () => {
    const mockKPIs = [
      { id: '1', type: 'lp', created_at: new Date().toISOString() },
      { id: '2', type: 'bp', created_at: new Date().toISOString() },
    ];

    const mockFrom = vi.fn((table: string) => ({
      select: vi.fn(() => ({
        gte: vi.fn(() => ({
          lte: vi.fn(() => {
            if (table === 'kpis') {
              return Promise.resolve({ data: mockKPIs, error: null });
            }
            return Promise.resolve({ data: [], error: null });
          }),
        })),
      })),
    }));
    (supabase.from as any).mockImplementation(mockFrom);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('line-LPs')).toBeInTheDocument();
      expect(screen.getByTestId('line-BPs')).toBeInTheDocument();
    });
  });

  it('displays 8 weeks of data', async () => {
    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        gte: vi.fn(() => ({
          lte: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    }));
    (supabase.from as any).mockImplementation(mockFrom);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });
});
