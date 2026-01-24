import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AITaskGenerator } from './AITaskGenerator';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({ profile: { id: 'user1' } })),
}));

describe('AITaskGenerator', () => {
  const mockMembers = [{ id: '1', nombre: 'Test', color: '#6366F1' }];

  const renderComponent = () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
      <QueryClientProvider client={queryClient}>
        <AITaskGenerator 
          projectId="proj1" 
          projectMembers={mockMembers}
          open={true}
          onOpenChange={() => {}}
        />
      </QueryClientProvider>
    );
  };

  it('renders dialog when open', () => {
    renderComponent();
    expect(screen.getByText(/Generar Tareas con IA/i)).toBeInTheDocument();
  });

  it('renders task type selector', () => {
    renderComponent();
    expect(screen.getByText(/Tipo de tareas/i)).toBeInTheDocument();
  });
});
