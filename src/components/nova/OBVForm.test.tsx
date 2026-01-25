import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OBVForm } from './OBVForm';

// Mock hooks
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    profile: { id: 'user1', nombre: 'Test User' },
  })),
}));

vi.mock('@/hooks/useNovaData', () => ({
  useProjects: vi.fn(() => ({ data: [], isLoading: false })),
  useProjectMembers: vi.fn(() => ({ data: [], isLoading: false })),
  useMemberStats: vi.fn(() => ({ data: [], isLoading: false })),
  usePipelineGlobal: vi.fn(() => ({ data: [], isLoading: false })),
}));

vi.mock('@/hooks/useValidationSystem', () => ({
  useCanUpload: vi.fn(() => ({ canUpload: true, isBlocked: false })),
}));

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => Promise.resolve({ data: [], error: null })),
    })),
  },
}));

describe('OBVForm', () => {
  let queryClient: QueryClient;
  const mockOnCancel = vi.fn();
  const mockOnSuccess = vi.fn();

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
        <OBVForm onCancel={mockOnCancel} onSuccess={mockOnSuccess} />
      </QueryClientProvider>
    );
  };

  it('renders OBV type selection', () => {
    renderComponent();
    expect(screen.getByText('Exploración')).toBeInTheDocument();
    expect(screen.getByText('Validación')).toBeInTheDocument();
    expect(screen.getByText('Venta')).toBeInTheDocument();
  });

  it('displays type descriptions', () => {
    renderComponent();
    expect(screen.getByText(/Primer contacto/)).toBeInTheDocument();
  });

  it('shows navigation buttons', () => {
    renderComponent();
    expect(screen.getByText('Siguiente')).toBeInTheDocument();
  });

  it('renders ChevronRight icon', () => {
    const { container } = renderComponent();
    const chevronIcon = container.querySelector('.lucide-chevron-right');
    expect(chevronIcon).toBeInTheDocument();
  });
});
