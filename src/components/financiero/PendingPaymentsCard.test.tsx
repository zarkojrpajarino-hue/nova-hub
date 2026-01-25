import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PendingPaymentsCard } from './PendingPaymentsCard';

const mockPayments = [
  {
    id: 'pay1',
    titulo: 'Venta Alpha',
    importe: 10000,
    fecha_venta: '2024-01-01',
    fecha_cobro_esperada: '2024-02-01',
    estado_cobro: 'pendiente',
    importe_cobrado: 0,
    pendiente: 10000,
    dias_vencido: 15,
    numero_factura: 'F-001',
    cliente: 'Empresa Alpha',
    cliente_empresa: 'Alpha Corp',
    proyecto_nombre: 'Proyecto 1',
    proyecto_color: '#6366F1',
    responsable_nombre: 'Juan Pérez',
  },
  {
    id: 'pay2',
    titulo: 'Venta Beta',
    importe: 5000,
    fecha_venta: '2024-03-01',
    fecha_cobro_esperada: '2024-04-15',
    estado_cobro: 'pendiente',
    importe_cobrado: 0,
    pendiente: 5000,
    dias_vencido: -10,
    numero_factura: 'F-002',
    cliente: 'Empresa Beta',
    cliente_empresa: 'Beta Ltd',
    proyecto_nombre: 'Proyecto 2',
    proyecto_color: '#22C55E',
    responsable_nombre: 'María García',
  },
];

describe('PendingPaymentsCard', () => {
  it('renders card title', () => {
    render(<PendingPaymentsCard payments={mockPayments} />);
    expect(screen.getByText('Cobros Pendientes')).toBeInTheDocument();
  });

  it('displays total pending amount', () => {
    render(<PendingPaymentsCard payments={mockPayments} />);
    expect(screen.getByText(/15\.000/)).toBeInTheDocument();
  });

  it('shows overdue payments section', () => {
    render(<PendingPaymentsCard payments={mockPayments} />);
    expect(screen.getByText('Vencidos (1)')).toBeInTheDocument();
  });

  it('shows upcoming payments section', () => {
    render(<PendingPaymentsCard payments={mockPayments} />);
    expect(screen.getByText('Próximos (1)')).toBeInTheDocument();
  });

  it('renders empty state when no payments', () => {
    render(<PendingPaymentsCard payments={[]} />);
    expect(screen.getByText('¡Todo cobrado!')).toBeInTheDocument();
    expect(screen.getByText('No hay pagos pendientes')).toBeInTheDocument();
  });

  it('displays payment client names', () => {
    render(<PendingPaymentsCard payments={mockPayments} />);
    expect(screen.getByText('Empresa Alpha')).toBeInTheDocument();
    expect(screen.getByText('Empresa Beta')).toBeInTheDocument();
  });

  it('shows invoice numbers', () => {
    render(<PendingPaymentsCard payments={mockPayments} />);
    expect(screen.getByText('F-001')).toBeInTheDocument();
    expect(screen.getByText('F-002')).toBeInTheDocument();
  });

  it('calls onMarkPaid when cobrado button clicked', async () => {
    const user = userEvent.setup();
    const mockOnMarkPaid = vi.fn();
    render(<PendingPaymentsCard payments={mockPayments} onMarkPaid={mockOnMarkPaid} />);
    
    const cobradoButtons = screen.getAllByText('Cobrado');
    await user.click(cobradoButtons[0]);
    
    expect(mockOnMarkPaid).toHaveBeenCalledWith('pay1');
  });

  it('renders Clock icon', () => {
    const { container } = render(<PendingPaymentsCard payments={mockPayments} />);
    const clockIcon = container.querySelector('.lucide-clock');
    expect(clockIcon).toBeInTheDocument();
  });

  it('shows overdue days for overdue payments', () => {
    render(<PendingPaymentsCard payments={mockPayments} />);
    expect(screen.getByText('15d vencido')).toBeInTheDocument();
  });
});
