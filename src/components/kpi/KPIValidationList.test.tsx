import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { KPIValidationList } from './KPIValidationList';

// Mock hooks
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({ profile: { id: 'user1', nombre: 'Test User' } })),
}));

// Mock supabase - chain: select().eq('type').eq('status').neq('owner_id').order()
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(function chainableEq() {
          return {
            eq: vi.fn(function chainableEq2() {
              return {
                neq: vi.fn(() => ({
                  order: vi.fn(() => Promise.resolve({ data: [], error: null })),
                })),
              };
            }),
            in: vi.fn(() => Promise.resolve({ data: [], error: null })),
          };
        }),
        in: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  },
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock EvidenceViewer
vi.mock('@/components/evidence/EvidenceViewer', () => ({
  EvidenceViewer: () => <div data-testid="evidence-viewer">Evidence</div>,
}));

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

  it('shows empty state for Learning Paths', async () => {
    renderComponent('lp');
    await waitFor(() => {
      expect(screen.getByText(/No hay Learning Paths pendientes de validar/)).toBeInTheDocument();
    });
  });

  it('shows empty state for Book Points', async () => {
    renderComponent('bp');
    await waitFor(() => {
      expect(screen.getByText(/No hay Book Points pendientes de validar/)).toBeInTheDocument();
    });
  });

  it('shows empty state for Community Points', async () => {
    renderComponent('cp');
    await waitFor(() => {
      expect(screen.getByText(/No hay Community Points pendientes de validar/)).toBeInTheDocument();
    });
  });

  it('renders CheckCircle2 icon in empty state', async () => {
    const { container } = renderComponent();
    // lucide-react v0.462+ uses lucide-circle-check (was lucide-check-circle-2)
    await waitFor(() => {
      const icon = container.querySelector('.lucide-circle-check') || container.querySelector('.lucide-check-circle-2');
      expect(icon).toBeInTheDocument();
    });
  });
});
