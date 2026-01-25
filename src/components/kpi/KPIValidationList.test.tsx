import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { KPIValidationList } from './KPIValidationList';

// Mock hooks
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({ profile: { id: 'user1', nombre: 'Test User' } })),
}));

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            neq: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          })),
        })),
        in: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
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

  it('shows empty state for Learning Paths', () => {
    renderComponent('lp');
    expect(screen.getByText(/No hay Learning Paths pendientes de validar/)).toBeInTheDocument();
  });

  it('shows empty state for Book Points', () => {
    renderComponent('bp');
    expect(screen.getByText(/No hay Book Points pendientes de validar/)).toBeInTheDocument();
  });

  it('shows empty state for Community Points', () => {
    renderComponent('cp');
    expect(screen.getByText(/No hay Community Points pendientes de validar/)).toBeInTheDocument();
  });

  it('renders CheckCircle2 icon in empty state', () => {
    const { container } = renderComponent();
    const icon = container.querySelector('.lucide-check-circle-2');
    expect(icon).toBeInTheDocument();
  });
});
