import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ValidationOrderCard } from './ValidationOrderCard';

// Mock the validation system hooks to return non-loading state
vi.mock('@/hooks/useValidationSystem', () => ({
  useValidationOrder: vi.fn(() => ({ data: [], isLoading: false })),
  useMyValidators: vi.fn(() => ({ data: [], isLoading: false })),
  useValidatorStats: vi.fn(() => ({ data: null, isLoading: false })),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ profile: { id: 'user1', nombre: 'Test User' } }),
}));

describe('ValidationOrderCard', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.clearAllMocks();
  });

  const renderComponent = () => render(
    <QueryClientProvider client={queryClient}>
      <ValidationOrderCard />
    </QueryClientProvider>
  );

  it('renders orden de validacion title', () => {
    renderComponent();
    // Component renders "Sistema de Validación" as the card title
    expect(screen.getByText('Sistema de Validación')).toBeInTheDocument();
  });

  it('renders yo valido a section', () => {
    renderComponent();
    // Component renders "Validas a" for the section where the user validates others
    expect(screen.getByText(/Validas a/)).toBeInTheDocument();
  });

  it('renders me validan section', () => {
    renderComponent();
    // Component renders "Te validan" for the section showing who validates the user
    expect(screen.getByText(/Te validan/)).toBeInTheDocument();
  });
});
