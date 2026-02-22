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
      version: 1,
      contenido: {
        sections: [
          { title: 'Paso 1', content: 'Step content', tips: ['Tip 1'] },
        ],
      },
      fortalezas: ['Fortaleza 1'],
      areas_mejora: ['Área 1'],
      objetivos_sugeridos: [],
      ai_model: null,
      is_active: true,
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

  it('renders playbook role name', () => {
    renderComponent();
    expect(screen.getByText(/Playbook: comercial/)).toBeInTheDocument();
  });

  it('renders fortalezas section', () => {
    renderComponent();
    expect(screen.getByText('Fortalezas')).toBeInTheDocument();
  });

  it('renders playbook section title', () => {
    renderComponent();
    expect(screen.getByText('Paso 1')).toBeInTheDocument();
  });
});
