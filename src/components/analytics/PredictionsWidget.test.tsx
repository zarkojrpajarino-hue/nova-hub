import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PredictionsWidget } from './PredictionsWidget';

// Mock useObjectives hook
vi.mock('@/hooks/useNovaData', () => ({
  useObjectives: vi.fn(() => ({
    data: [
      { name: 'obvs', target_value: 150 },
      { name: 'lps', target_value: 18 },
    ],
  })),
}));

// Mock date-fns
vi.mock('date-fns', () => ({
  differenceInDays: () => 90,
  endOfMonth: () => new Date(),
  startOfMonth: () => new Date(),
}));

const mockMembers = [
  {
    id: 'user1',
    nombre: 'Juan Pérez',
    color: '#6366F1',
    avatar: null,
    email: 'juan@test.com',
    obvs: 50,
    lps: 5,
    bps: 20,
    cps: 15,
    facturacion: 5000,
    margen: 2500,
  },
  {
    id: 'user2',
    nombre: 'María García',
    color: '#22C55E',
    avatar: null,
    email: 'maria@test.com',
    obvs: 40,
    lps: 4,
    bps: 18,
    cps: 12,
    facturacion: 4000,
    margen: 2000,
  },
];

describe('PredictionsWidget', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <PredictionsWidget members={mockMembers} period="month" />
      </QueryClientProvider>
    );
  };

  it('renders predictions title', () => {
    renderComponent();
    expect(screen.getByText('Predicciones de Objetivo Semestral')).toBeInTheDocument();
  });

  it('renders Target icon', () => {
    const { container } = renderComponent();
    const targetIcon = container.querySelector('.lucide-target');
    expect(targetIcon).toBeInTheDocument();
  });

  it('displays projection description', () => {
    renderComponent();
    expect(screen.getByText(/Proyección lineal basada en el ritmo actual/)).toBeInTheDocument();
  });

  it('renders prediction cards for metrics', () => {
    renderComponent();
    expect(screen.getByText('OBVs')).toBeInTheDocument();
    expect(screen.getByText('Learning Paths')).toBeInTheDocument();
    expect(screen.getByText('Book Points')).toBeInTheDocument();
  });

  it('displays status summary card', () => {
    renderComponent();
    expect(screen.getByText('Resumen de Estado')).toBeInTheDocument();
    expect(screen.getByText('En buen camino')).toBeInTheDocument();
    expect(screen.getByText('En riesgo')).toBeInTheDocument();
    expect(screen.getByText('Por detrás')).toBeInTheDocument();
  });

  it('shows current and target values', () => {
    renderComponent();
    expect(screen.getAllByText(/Actual:/)).toHaveLength(6);
    expect(screen.getAllByText(/Objetivo:/)).toHaveLength(6);
  });

  it('displays projection percentages', () => {
    const { container } = renderComponent();
    const percentages = container.querySelectorAll('[class*="text-"]');
    expect(percentages.length).toBeGreaterThan(0);
  });
});
