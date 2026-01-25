import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PlaybookViewer } from './PlaybookViewer';

// Mock hooks
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ profile: { id: 'user1' } }),
}));

vi.mock('@/hooks/useDevelopment', () => ({
  usePlaybookForRole: () => ({
    data: {
      id: 'pb1',
      user_id: 'user1',
      role_name: 'comercial',
      contenido: {
        titulo: 'Test Playbook',
        descripcion: 'Test description',
        pasos: [{ titulo: 'Paso 1', contenido: 'Step content', orden: 1 }],
        recursos: ['Resource 1'],
        tips: ['Tip 1'],
      },
      is_active: true,
      version: 1,
      generated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    },
    isLoading: false,
  }),
  useGeneratePlaybook: () => ({
    mutateAsync: vi.fn(),
  }),
}));

vi.mock('@/contexts/DemoModeContext', () => ({
  useDemoMode: () => ({ isDemoMode: false }),
}));

describe('PlaybookViewer', () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  const renderComponent = () => render(
    <QueryClientProvider client={queryClient}>
      <PlaybookViewer roleName="comercial" />
    </QueryClientProvider>
  );

  it('renders playbook title', () => {
    renderComponent();
    expect(screen.getByText('Test Playbook')).toBeInTheDocument();
  });

  it('renders playbook description', () => {
    renderComponent();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('renders playbook steps', () => {
    renderComponent();
    expect(screen.getByText('Paso 1')).toBeInTheDocument();
  });
});
