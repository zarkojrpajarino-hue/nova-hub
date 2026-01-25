import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FinancialAlertsCard } from './FinancialAlertsCard';

// Mock date-fns
vi.mock('date-fns', () => ({
  formatDistanceToNow: () => 'hace 2 días',
  format: () => '15/03/2024',
}));

vi.mock('date-fns/locale', () => ({
  es: {},
}));

const mockAlerts = [
  {
    id: 'alert1',
    type: 'overdue' as const,
    title: 'Pago vencido',
    description: 'Factura #123 vencida',
    severity: 'high' as const,
    project_name: 'Proyecto Alpha',
    amount: 5000,
    created_at: new Date().toISOString(),
  },
  {
    id: 'alert2',
    type: 'low_margin' as const,
    title: 'Margen bajo',
    description: 'Margen por debajo del objetivo',
    severity: 'medium' as const,
    project_name: 'Proyecto Beta',
    amount: 2000,
    created_at: new Date().toISOString(),
  },
];

describe('FinancialAlertsCard', () => {
  it('renders alerts title', () => {
    render(<FinancialAlertsCard alerts={mockAlerts} />);
    expect(screen.getByText('Alertas Financieras')).toBeInTheDocument();
  });

  it('renders alert items', () => {
    render(<FinancialAlertsCard alerts={mockAlerts} />);
    expect(screen.getByText('Pago vencido')).toBeInTheDocument();
    expect(screen.getByText('Margen bajo')).toBeInTheDocument();
  });

  it('displays project names', () => {
    render(<FinancialAlertsCard alerts={mockAlerts} />);
    expect(screen.getByText('Proyecto Alpha')).toBeInTheDocument();
    expect(screen.getByText('Proyecto Beta')).toBeInTheDocument();
  });

  it('renders empty state when no alerts', () => {
    render(<FinancialAlertsCard alerts={[]} />);
    expect(screen.getByText('No hay alertas financieras')).toBeInTheDocument();
  });

  it('renders AlertTriangle icon', () => {
    const { container } = render(<FinancialAlertsCard alerts={mockAlerts} />);
    const icon = container.querySelector('.lucide-alert-triangle');
    expect(icon).toBeInTheDocument();
  });

  it('displays alert amounts', () => {
    render(<FinancialAlertsCard alerts={mockAlerts} />);
    expect(screen.getByText('5.000 €')).toBeInTheDocument();
    expect(screen.getByText('2.000 €')).toBeInTheDocument();
  });
});
