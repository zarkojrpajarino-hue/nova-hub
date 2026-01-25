import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { InsightsList } from './InsightsList';

// Mock hooks
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({ profile: { id: 'user1', nombre: 'Test User' } })),
}));

vi.mock('@/hooks/useDevelopment', () => ({
  useInsights: vi.fn(() => ({ data: [], isLoading: false })),
  useDeleteInsight: vi.fn(() => ({
    mutateAsync: vi.fn(),
  })),
}));

vi.mock('@/contexts/DemoModeContext', () => ({
  useDemoMode: vi.fn(() => ({ isDemoMode: false })),
}));

vi.mock('@/data/demoData', () => ({
  DEMO_INSIGHTS: [],
}));

// Mock date-fns
vi.mock('date-fns', () => ({
  formatDistanceToNow: vi.fn(() => 'hace 2 horas'),
}));

vi.mock('date-fns/locale', () => ({
  es: {},
}));

// Mock InsightForm
vi.mock('./InsightForm', () => ({
  InsightForm: () => <div data-testid="insight-form">Insight Form</div>,
}));

describe('InsightsList', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <InsightsList {...props} />
      </QueryClientProvider>
    );
  };

  it('renders title', () => {
    renderComponent();
    expect(screen.getByText('Mis Insights')).toBeInTheDocument();
  });

  it('renders Nuevo Insight button', () => {
    renderComponent();
    expect(screen.getByText('Nuevo Insight')).toBeInTheDocument();
  });

  it('renders filter buttons', () => {
    renderComponent();
    expect(screen.getByText('Todos')).toBeInTheDocument();
    expect(screen.getByText('Aprendizaje')).toBeInTheDocument();
    expect(screen.getByText('Reflexión')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Éxito')).toBeInTheDocument();
    expect(screen.getByText('Idea')).toBeInTheDocument();
  });

  it('shows empty state when no insights', () => {
    renderComponent();
    expect(screen.getByText('No hay insights registrados')).toBeInTheDocument();
  });

  it('shows count badge', () => {
    renderComponent();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('renders Lightbulb icon', () => {
    const { container } = renderComponent();
    const icons = container.querySelectorAll('.lucide-lightbulb');
    expect(icons.length).toBeGreaterThan(0);
  });
});
