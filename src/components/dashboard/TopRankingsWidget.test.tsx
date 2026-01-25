import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TopRankingsWidget } from './TopRankingsWidget';

// Mock useNovaData
vi.mock('@/hooks/useNovaData', () => ({
  useTopRankings: vi.fn(() => ({
    data: {
      topByObvs: [
        { id: 'user1', nombre: 'Juan', apellidos: 'Pérez', obvs_count: 10, avatar: null, color: '#6366F1' },
        { id: 'user2', nombre: 'María', apellidos: 'García', obvs_count: 8, avatar: null, color: '#22C55E' },
      ],
      topByFacturacion: [
        { id: 'user1', nombre: 'Juan', apellidos: 'Pérez', facturacion_total: 50000, avatar: null, color: '#6366F1' },
      ],
      topByLPs: [
        { id: 'user3', nombre: 'Carlos', apellidos: 'López', lp_count: 5, avatar: null, color: '#F59E0B' },
      ],
    },
    isLoading: false,
  })),
}));

describe('TopRankingsWidget', () => {
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
        <TopRankingsWidget />
      </QueryClientProvider>
    );
  };

  it('renders rankings title', () => {
    renderComponent();
    expect(screen.getByText('Rankings')).toBeInTheDocument();
  });

  it('renders podium tabs', () => {
    renderComponent();
    expect(screen.getByText('OBVs')).toBeInTheDocument();
    expect(screen.getByText('Facturación')).toBeInTheDocument();
    expect(screen.getByText('LPs')).toBeInTheDocument();
  });

  it('renders top performers by OBVs', () => {
    renderComponent();
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    expect(screen.getByText('María García')).toBeInTheDocument();
  });

  it('displays OBV count', () => {
    renderComponent();
    expect(screen.getByText('10 OBVs')).toBeInTheDocument();
  });

  it('renders Trophy icon', () => {
    const { container } = renderComponent();
    const trophyIcon = container.querySelector('.lucide-trophy');
    expect(trophyIcon).toBeInTheDocument();
  });
});
