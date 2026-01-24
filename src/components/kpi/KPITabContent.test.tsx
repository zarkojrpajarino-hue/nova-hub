import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { KPITabContent } from './KPITabContent';

vi.mock('./KPIUploadForm', () => ({
  KPIUploadForm: () => <div>Upload Form</div>,
}));

vi.mock('./KPIList', () => ({
  KPIList: () => <div>KPI List</div>,
}));

vi.mock('./KPIValidationList', () => ({
  KPIValidationList: () => <div>Validation List</div>,
}));

describe('KPITabContent', () => {
  const renderComponent = (type: 'lp' | 'bp' | 'cp' = 'lp') => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
      <QueryClientProvider client={queryClient}>
        <KPITabContent type={type} />
      </QueryClientProvider>
    );
  };

  it('renders LP header', () => {
    renderComponent('lp');
    expect(screen.getByText('Learning Paths')).toBeInTheDocument();
  });

  it('renders BP header', () => {
    renderComponent('bp');
    expect(screen.getByText('Book Points')).toBeInTheDocument();
  });

  it('renders CP header', () => {
    renderComponent('cp');
    expect(screen.getByText('Community Points')).toBeInTheDocument();
  });

  it('renders upload button', () => {
    renderComponent();
    expect(screen.getByText('Subir nuevo')).toBeInTheDocument();
  });
});
