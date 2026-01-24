import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PendingValidationsWidget } from './PendingValidationsWidget';

describe('PendingValidationsWidget', () => {
  let queryClient: QueryClient;

  const renderComponent = () => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
      <QueryClientProvider client={queryClient}>
        <PendingValidationsWidget />
      </QueryClientProvider>
    );
  };

  it('renders widget title', () => {
    renderComponent();
    expect(screen.getByText('Validaciones Pendientes')).toBeInTheDocument();
  });
});
