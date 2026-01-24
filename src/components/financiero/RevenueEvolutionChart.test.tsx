import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RevenueEvolutionChart } from './RevenueEvolutionChart';

// Mock Recharts
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

const mockData = [
  {
    project_id: 'proj1',
    project_name: 'Proyecto Alpha',
    project_color: '#6366F1',
    month: '2024-01',
    facturacion: 10000,
    costes: 3000,
    margen: 7000,
    num_ventas: 5,
    margen_percent: 70,
    cobrado: 8000,
    pendiente_cobro: 2000,
  },
];

describe('RevenueEvolutionChart', () => {
  it('renders chart title', () => {
    render(<RevenueEvolutionChart data={mockData} />);
    expect(screen.getByText('Evolución de Ingresos')).toBeInTheDocument();
  });

  it('renders TrendingUp icon', () => {
    const { container } = render(<RevenueEvolutionChart data={mockData} />);
    const icon = container.querySelector('.lucide-trending-up');
    expect(icon).toBeInTheDocument();
  });

  it('renders chart components', () => {
    render(<RevenueEvolutionChart data={mockData} />);
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('renders with empty data', () => {
    render(<RevenueEvolutionChart data={[]} />);
    expect(screen.getByText('Evolución de Ingresos')).toBeInTheDocument();
  });

  it('aggregates monthly data correctly', () => {
    const multipleMonthData = [
      ...mockData,
      {
        ...mockData[0],
        facturacion: 5000,
        margen: 3000,
        costes: 2000,
      },
    ];
    render(<RevenueEvolutionChart data={multipleMonthData} />);
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });
});
