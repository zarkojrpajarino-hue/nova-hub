import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BlockedBanner } from './BlockedBanner';

// Mock hooks
vi.mock('@/hooks/useValidationSystem', () => ({
  useIsBlocked: vi.fn(() => ({ data: true })),
  useMyPendingValidations: vi.fn(() => ({ 
    data: [
      {
        id: 'val1',
        titulo: 'Test Validation',
        owner_nombre: 'John Doe',
        owner_color: '#6366F1',
        deadline: new Date(Date.now() - 86400000).toISOString(),
      }
    ] 
  })),
}));

// Mock date-fns
vi.mock('date-fns', () => ({
  formatDistanceToNow: () => '1 día',
}));

vi.mock('date-fns/locale', () => ({
  es: {},
}));

describe('BlockedBanner', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BlockedBanner {...props} />
      </QueryClientProvider>
    );
  };

  it('renders blocked warning title', () => {
    renderComponent();
    expect(screen.getByText('⚠️ Estás bloqueado')).toBeInTheDocument();
  });

  it('shows blocked message', () => {
    renderComponent();
    expect(screen.getByText(/No puedes subir KPIs ni OBVs/)).toBeInTheDocument();
  });

  it('displays AlertTriangle icon', () => {
    const { container } = renderComponent();
    const alertIcon = container.querySelector('.lucide-alert-triangle');
    expect(alertIcon).toBeInTheDocument();
  });

  it('shows pending validation count', () => {
    renderComponent();
    expect(screen.getByText(/1 validación/)).toBeInTheDocument();
  });

  it('displays validation title', () => {
    renderComponent();
    expect(screen.getByText('Test Validation')).toBeInTheDocument();
  });

  it('shows Clock icon', () => {
    const { container } = renderComponent();
    const clockIcon = container.querySelector('.lucide-clock');
    expect(clockIcon).toBeInTheDocument();
  });

  it('renders navigation button when callback provided', () => {
    const mockNavigate = vi.fn();
    renderComponent({ onNavigateToValidations: mockNavigate });
    expect(screen.getByText('Ir a validar ahora')).toBeInTheDocument();
  });

  it('calls onNavigateToValidations when button clicked', async () => {
    const user = userEvent.setup();
    const mockNavigate = vi.fn();
    renderComponent({ onNavigateToValidations: mockNavigate });
    
    await user.click(screen.getByText('Ir a validar ahora'));
    expect(mockNavigate).toHaveBeenCalled();
  });

  it('shows overdue status', () => {
    renderComponent();
    expect(screen.getByText(/Vencido hace/)).toBeInTheDocument();
  });
});
