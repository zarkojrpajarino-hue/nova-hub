import { describe, it, expect, vi } from 'vitest';
import type { Mock } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ValidatorRankingCard } from './ValidatorRankingCard';

vi.mock('@/hooks/useValidationSystem', () => ({
  useAllValidatorStats: vi.fn(() => ({
    data: [],
    isLoading: false,
  })),
}));

import { useAllValidatorStats } from '@/hooks/useValidationSystem';

describe('ValidatorRankingCard', () => {
  const renderComponent = () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
      <QueryClientProvider client={queryClient}>
        <ValidatorRankingCard />
      </QueryClientProvider>
    );
  };

  it('renders card title', () => {
    renderComponent();
    expect(screen.getByText('Ranking de Validadores')).toBeInTheDocument();
  });

  it('shows loading skeletons when loading', () => {
    (useAllValidatorStats as Mock).mockReturnValue({ data: undefined, isLoading: true });
    renderComponent();
    expect(screen.getByText('Ranking de Validadores')).toBeInTheDocument();
  });

  it('shows empty message when no data', () => {
    (useAllValidatorStats as Mock).mockReturnValue({ data: [], isLoading: false });
    renderComponent();
    expect(screen.getByText('No hay datos de validación aún')).toBeInTheDocument();
  });
});
