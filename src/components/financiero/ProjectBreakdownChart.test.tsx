import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProjectBreakdownChart } from './ProjectBreakdownChart';

// Mock Recharts
vi.mock('recharts', () => ({
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

const mockData = [
  {
    project_id: 'proj1',
    project_name: 'Proyecto Alpha',
    project_color: '#6366F1',
    facturacion: 50000,
  },
  {
    project_id: 'proj2',
    project_name: 'Proyecto Beta',
    project_color: '#22C55E',
    facturacion: 30000,
  },
  {
    project_id: 'proj1',
    project_name: 'Proyecto Alpha',
    project_color: '#6366F1',
    facturacion: 20000,
  },
];

describe('ProjectBreakdownChart', () => {
  it('renders chart title', () => {
    render(<ProjectBreakdownChart data={mockData} />);
    expect(screen.getByText('Por Proyecto')).toBeInTheDocument();
  });

  it('renders PieChart icon', () => {
    const { container } = render(<ProjectBreakdownChart data={mockData} />);
    const icon = container.querySelector('.lucide-pie-chart');
    expect(icon).toBeInTheDocument();
  });

  it('renders chart components', () => {
    render(<ProjectBreakdownChart data={mockData} />);
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
  });

  it('renders empty state when no data', () => {
    render(<ProjectBreakdownChart data={[]} />);
    expect(screen.getByText('No hay datos por proyecto')).toBeInTheDocument();
  });

  it('displays project names in legend', () => {
    render(<ProjectBreakdownChart data={mockData} />);
    expect(screen.getByText('Proyecto Alpha')).toBeInTheDocument();
    expect(screen.getByText('Proyecto Beta')).toBeInTheDocument();
  });

  it('aggregates data by project correctly', () => {
    render(<ProjectBreakdownChart data={mockData} />);
    expect(screen.getByText(/70%/)).toBeInTheDocument();
    expect(screen.getByText(/30%/)).toBeInTheDocument();
  });

  it('formats currency values', () => {
    render(<ProjectBreakdownChart data={mockData} />);
    expect(screen.getByText(/70\.000/)).toBeInTheDocument();
    expect(screen.getByText(/30\.000/)).toBeInTheDocument();
  });
});
