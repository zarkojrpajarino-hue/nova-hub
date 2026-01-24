import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { InsightsList } from './InsightsList';

describe('InsightsList', () => {
  const renderComponent = () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
      <QueryClientProvider client={queryClient}>
        <InsightsList />
      </QueryClientProvider>
    );
  };

  it('renders header with title', () => {
    renderComponent();
    expect(screen.getByText('Mis Insights')).toBeInTheDocument();
  });

  it('renders new insight button', () => {
    renderComponent();
    expect(screen.getByText('Nuevo Insight')).toBeInTheDocument();
  });

  it('renders filter buttons', () => {
    renderComponent();
    expect(screen.getByText('Todos')).toBeInTheDocument();
  });
});
