import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { KPIBaseEditor } from './KPIBaseEditor';

describe('KPIBaseEditor', () => {
  const renderComponent = () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
      <QueryClientProvider client={queryClient}>
        <KPIBaseEditor
          memberId="member1"
          memberName="Test Member"
          currentStats={{
            obvs: 10,
            lps: 5,
            bps: 3,
            cps: 2,
            facturacion: 1000,
            margen: 500,
          }}
        />
      </QueryClientProvider>
    );
  };

  it('renders edit button', () => {
    const { getByRole } = renderComponent();
    const button = getByRole('button', { name: /editar kpis/i });
    expect(button).toBeInTheDocument();
  });
});
