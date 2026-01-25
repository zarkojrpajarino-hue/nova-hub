import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { KPIsView } from './KPIsView';

// Mock KPI components
vi.mock('@/components/kpi/KPITabContent', () => ({
  KPITabContent: () => <div data-testid="kpi-tab-content">KPI Content</div>,
}));
vi.mock('@/components/validation/ValidationOrderCard', () => ({
  ValidationOrderCard: () => <div data-testid="validation-order-card">Validation Order</div>,
}));
vi.mock('@/components/validation/BlockedBanner', () => ({
  BlockedBanner: () => <div data-testid="blocked-banner">Blocked Banner</div>,
}));
vi.mock('@/components/rankings/ValidatorRankingCard', () => ({
  ValidatorRankingCard: () => <div data-testid="validator-ranking-card">Validator Ranking</div>,
}));

// Mock data hooks
vi.mock('@/hooks/useNovaData', () => ({
  useMemberStats: vi.fn(() => ({ 
    data: [
      { id: 'user1', nombre: 'Test User', lps: 5, bps: 20, cps: 10, color: '#6366F1' }
    ], 
    isLoading: false 
  })),
  useObjectives: vi.fn(() => ({ data: [], isLoading: false })),
}));

describe('KPIsView', () => {
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
        <KPIsView />
      </QueryClientProvider>
    );
  };

  it('renders page title', () => {
    renderComponent();
    expect(screen.getByText('Otros KPIs')).toBeInTheDocument();
  });

  it('renders subtitle', () => {
    renderComponent();
    expect(screen.getByText('Learning Paths, Book Points y Community Points')).toBeInTheDocument();
  });

  it('renders Learning Paths summary', () => {
    renderComponent();
    expect(screen.getByText('Learning Paths')).toBeInTheDocument();
  });

  it('renders Book Points summary', () => {
    renderComponent();
    expect(screen.getByText('Book Points')).toBeInTheDocument();
  });

  it('renders Community Points summary', () => {
    renderComponent();
    expect(screen.getByText('Community Points')).toBeInTheDocument();
  });

  it('displays total LPs', () => {
    renderComponent();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('displays total BPs', () => {
    renderComponent();
    expect(screen.getByText('20')).toBeInTheDocument();
  });

  it('displays total CPs', () => {
    renderComponent();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('renders KPI icons', () => {
    const { container } = renderComponent();
    const bookIcon = container.querySelector('.lucide-book-open');
    expect(bookIcon).toBeInTheDocument();
  });
});
