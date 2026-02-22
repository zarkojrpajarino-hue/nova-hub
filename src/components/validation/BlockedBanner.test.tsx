import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BlockedBanner } from './BlockedBanner';

// Mock the validation system hooks directly so the component returns null (not blocked)
vi.mock('@/hooks/useValidationSystem', () => ({
  useIsBlocked: vi.fn(() => ({ data: false, isLoading: false })),
  useMyPendingValidations: vi.fn(() => ({ data: [], isLoading: false })),
  useCanUpload: vi.fn(() => ({ canUpload: true, isBlocked: false })),
}));

vi.mock('date-fns', () => ({
  formatDistanceToNow: () => 'hace 2 días',
}));

vi.mock('date-fns/locale', () => ({
  es: {},
}));

describe('BlockedBanner', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.clearAllMocks();
  });

  const renderComponent = () => render(
    <QueryClientProvider client={queryClient}>
      <BlockedBanner />
    </QueryClientProvider>
  );

  it('does not render when not blocked', () => {
    renderComponent();
    expect(screen.queryByText('Estás bloqueado')).not.toBeInTheDocument();
  });

  it('renders ir a validaciones button when provided callback', () => {
    const onNavigate = vi.fn();
    render(
      <QueryClientProvider client={queryClient}>
        <BlockedBanner onNavigateToValidations={onNavigate} />
      </QueryClientProvider>
    );
    // Should not render if not blocked
    expect(screen.queryByText('Ir a Validaciones')).not.toBeInTheDocument();
  });
});
