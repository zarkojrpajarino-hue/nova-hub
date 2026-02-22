import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ValidationCard } from './ValidationCard';

// Mock hooks
const mockUsePendingValidations = vi.fn(() => ({ data: [], isLoading: true }));
vi.mock('@/hooks/usePendingValidations', () => ({
  usePendingValidations: (...args: unknown[]) => mockUsePendingValidations(...args),
  useValidate: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
}));

// Mock navigation context
vi.mock('@/contexts/NavigationContext', () => ({
  useNavigation: vi.fn(() => ({
    navigate: vi.fn(),
  })),
}));

// Mock date-fns
vi.mock('date-fns', () => ({
  formatDistanceToNow: () => 'hace 2 horas',
}));

vi.mock('date-fns/locale', () => ({
  es: {},
}));

describe('ValidationCard', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
    // Re-set the default return value after clearAllMocks
    mockUsePendingValidations.mockReturnValue({ data: [], isLoading: true });
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ValidationCard />
      </QueryClientProvider>
    );
  };

  it('renders card title', () => {
    renderComponent();
    expect(screen.getByText('Validaciones Pendientes')).toBeInTheDocument();
  });

  it('renders CheckCircle2 icon', () => {
    const { container } = renderComponent();
    const checkIcon = container.querySelector('.lucide-circle-check');
    expect(checkIcon).toBeInTheDocument();
  });

  it('shows loading state', () => {
    const { container } = renderComponent();
    // Loader2 is aliased to LoaderCircle in lucide-react, so class is .lucide-loader-circle
    const loader = container.querySelector('.lucide-loader-circle');
    expect(loader).toBeInTheDocument();
  });

  it('renders with custom limit', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ValidationCard limit={5} />
      </QueryClientProvider>
    );
    expect(screen.getByText('Validaciones Pendientes')).toBeInTheDocument();
  });

  it('renders with custom delay', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ValidationCard delay={10} />
      </QueryClientProvider>
    );
    expect(screen.getByText('Validaciones Pendientes')).toBeInTheDocument();
  });
});
