import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PendingPaymentsCard } from './PendingPaymentsCard';

const mockPayments = [
  {
    id: 'pay1',
    titulo: 'Venta 1',
    importe: 1000,
    fecha_venta: '2024-01-01',
    fecha_cobro_esperada: '2024-02-01',
    estado_cobro: 'pendiente',
    importe_cobrado: 0,
    pendiente: 1000,
    dias_vencido: 5,
    numero_factura: 'FAC-001',
    cliente: 'Cliente A',
    cliente_empresa: 'Empresa A',
    proyecto_nombre: 'Proyecto Alpha',
    proyecto_color: '#6366F1',
    responsable_nombre: 'John Doe',
  },
  {
    id: 'pay2',
    titulo: 'Venta 2',
    importe: 2000,
    fecha_venta: '2024-01-15',
    fecha_cobro_esperada: '2024-03-15',
    estado_cobro: 'pendiente',
    importe_cobrado: 0,
    pendiente: 2000,
    dias_vencido: -10,
    numero_factura: 'FAC-002',
    cliente: 'Cliente B',
    cliente_empresa: 'Empresa B',
    proyecto_nombre: 'Proyecto Beta',
    proyecto_color: '#22C55E',
    responsable_nombre: 'Jane Smith',
  },
];

describe('PendingPaymentsCard', () => {
  it('renders card title', () => {
    render(<PendingPaymentsCard payments={mockPayments} />);
    expect(screen.getByText('Cobros Pendientes')).toBeInTheDocument();
  });

  it('displays total pending amount', () => {
    render(<PendingPaymentsCard payments={mockPayments} />);
    // toLocaleString('es-ES') may render 3000 or 3.000 depending on ICU data availability
    expect(screen.getByText(/€3[,.]?000/)).toBeInTheDocument();
  });

  it('shows empty state when no payments', () => {
    render(<PendingPaymentsCard payments={[]} />);
    expect(screen.getByText('¡Todo cobrado!')).toBeInTheDocument();
    expect(screen.getByText('No hay pagos pendientes')).toBeInTheDocument();
  });

  it('displays overdue payments section', () => {
    render(<PendingPaymentsCard payments={mockPayments} />);
    expect(screen.getByText(/Vencidos \(1\)/)).toBeInTheDocument();
  });

  it('displays upcoming payments section', () => {
    render(<PendingPaymentsCard payments={mockPayments} />);
    expect(screen.getByText(/Próximos \(1\)/)).toBeInTheDocument();
  });

  it('shows client name', () => {
    render(<PendingPaymentsCard payments={mockPayments} />);
    expect(screen.getByText('Cliente A')).toBeInTheDocument();
  });

  it('shows invoice number', () => {
    render(<PendingPaymentsCard payments={mockPayments} />);
    expect(screen.getByText('FAC-001')).toBeInTheDocument();
  });

  it('renders Clock icon', () => {
    const { container } = render(<PendingPaymentsCard payments={mockPayments} />);
    const icon = container.querySelector('.lucide-clock');
    expect(icon).toBeInTheDocument();
  });

  it('calls onMarkPaid when Cobrado button clicked', async () => {
    const user = userEvent.setup();
    const mockOnMarkPaid = vi.fn();
    render(<PendingPaymentsCard payments={mockPayments} onMarkPaid={mockOnMarkPaid} />);
    
    const buttons = screen.getAllByText('Cobrado');
    await user.click(buttons[0]);
    
    expect(mockOnMarkPaid).toHaveBeenCalledWith('pay1');
  });
});
