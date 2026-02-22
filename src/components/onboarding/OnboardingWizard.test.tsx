import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OnboardingWizard } from './OnboardingWizard';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
      insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockProject = {
  id: 'proj1',
  nombre: 'Test Project',
  tipo: 'validacion',
  color: '#6366F1',
  icon: '🚀',
};

describe('OnboardingWizard', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.clearAllMocks();
  });

  const renderComponent = () => render(
    <QueryClientProvider client={queryClient}>
      <OnboardingWizard project={mockProject} />
    </QueryClientProvider>
  );

  it('renders project name', () => {
    renderComponent();
    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  it('renders onboarding mode', () => {
    renderComponent();
    // Project has no onboarding_data, so usingStateBased=true -> renders 'Onboarding Adaptativo'
    expect(screen.getByText('Onboarding Adaptativo')).toBeInTheDocument();
  });

  it('renders siguiente button', () => {
    renderComponent();
    expect(screen.getByText('Siguiente')).toBeInTheDocument();
  });
});
