import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { ProjectComparisonCharts } from './ProjectComparisonCharts';

// Mock Recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children }: { children: ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  Cell: () => <div data-testid="cell" />,
}));

const mockProjectStats = [
  {
    id: 'proj1',
    nombre: 'Proyecto Alpha',
    color: '#6366F1',
    facturacion: 50000,
    margen: 25000,
    total_obvs: 30,
    total_leads: 10,
    leads_ganados: 7,
  },
  {
    id: 'proj2',
    nombre: 'Proyecto Beta',
    color: '#22C55E',
    facturacion: 30000,
    margen: 15000,
    total_obvs: 20,
    total_leads: 8,
    leads_ganados: 5,
  },
];

describe('ProjectComparisonCharts', () => {
  const mockOnExportCSV = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders billing chart title', () => {
    render(
      <ProjectComparisonCharts
        projectStats={mockProjectStats}
        onExportCSV={mockOnExportCSV}
      />
    );
    expect(screen.getByText('Facturación y Margen por Proyecto')).toBeInTheDocument();
  });

  it('renders OBVs chart title', () => {
    render(
      <ProjectComparisonCharts
        projectStats={mockProjectStats}
        onExportCSV={mockOnExportCSV}
      />
    );
    expect(screen.getByText('OBVs por Proyecto')).toBeInTheDocument();
  });

  it('renders leads chart title', () => {
    render(
      <ProjectComparisonCharts
        projectStats={mockProjectStats}
        onExportCSV={mockOnExportCSV}
      />
    );
    expect(screen.getByText('Leads: Convertidos vs Total')).toBeInTheDocument();
  });

  it('renders export button', () => {
    const { container } = render(
      <ProjectComparisonCharts
        projectStats={mockProjectStats}
        onExportCSV={mockOnExportCSV}
      />
    );
    const downloadIcon = container.querySelector('.lucide-download');
    expect(downloadIcon).toBeInTheDocument();
  });

  it('calls onExportCSV when export button clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ProjectComparisonCharts
        projectStats={mockProjectStats}
        onExportCSV={mockOnExportCSV}
      />
    );

    const exportButton = container.querySelector('button');
    if (exportButton) {
      await user.click(exportButton);
      expect(mockOnExportCSV).toHaveBeenCalled();
    }
  });

  it('renders chart components', () => {
    render(
      <ProjectComparisonCharts
        projectStats={mockProjectStats}
        onExportCSV={mockOnExportCSV}
      />
    );
    expect(screen.getAllByTestId('responsive-container')).toHaveLength(3);
    expect(screen.getAllByTestId('bar-chart')).toHaveLength(3);
  });

  it('handles empty project stats', () => {
    render(
      <ProjectComparisonCharts
        projectStats={[]}
        onExportCSV={mockOnExportCSV}
      />
    );
    expect(screen.getByText('Facturación y Margen por Proyecto')).toBeInTheDocument();
  });
});
