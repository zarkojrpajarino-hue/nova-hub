import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RankingTrends } from './RankingTrends';

vi.mock('@/data/mockData', () => ({
  ROLE_CONFIG: {
    comercial: { label: 'Comercial', color: '#6366F1', icon: () => null },
  },
}));

vi.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  Legend: () => <div data-testid="legend" />,
}));

describe('RankingTrends', () => {
  it('renders mayores movimientos title', () => {
    render(<RankingTrends rankings={[]} selectedRole="all" />);
    expect(screen.getByText('Mayores Movimientos')).toBeInTheDocument();
  });

  it('renders estadísticas por rol title', () => {
    render(<RankingTrends rankings={[]} selectedRole="all" />);
    expect(screen.getByText('Estadísticas por Rol')).toBeInTheDocument();
  });

  it('renders distribución de scores title', () => {
    render(<RankingTrends rankings={[]} selectedRole="all" />);
    expect(screen.getByText('Distribución de Scores')).toBeInTheDocument();
  });

  it('shows empty state when no movers', () => {
    render(<RankingTrends rankings={[]} selectedRole="all" />);
    expect(screen.getByText(/Sin cambios de posición/)).toBeInTheDocument();
  });
});
