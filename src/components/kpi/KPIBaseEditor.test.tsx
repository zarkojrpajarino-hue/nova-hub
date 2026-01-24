import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { KPIBaseEditor } from './KPIBaseEditor';

describe('KPIBaseEditor', () => {
  const renderComponent = () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
      <QueryClientProvider client={queryClient}>
        <KPIBaseEditor kpiId="kpi1" onClose={() => {}} />
      </QueryClientProvider>
    );
  };

  it('renders loading state initially', () => {
    renderComponent();
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });
});
