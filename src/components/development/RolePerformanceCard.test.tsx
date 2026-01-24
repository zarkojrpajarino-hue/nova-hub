import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RolePerformanceCard } from './RolePerformanceCard';
import type { RolePerformance } from '@/hooks/useDevelopment';

const mockPerformance: RolePerformance = {
  role_name: 'cliente',
  project_name: 'Proyecto Test',
  performance_score: 85,
  task_completion_rate: 90,
  completed_tasks: 9,
  total_tasks: 10,
  validated_obvs: 5,
  total_facturacion: 1500,
  lead_conversion_rate: 75,
  leads_ganados: 3,
  total_leads: 4,
  is_lead: false,
  role_accepted: true,
};

describe('RolePerformanceCard', () => {
  it('renders role name', () => {
    render(<RolePerformanceCard performance={mockPerformance} />);
    expect(screen.getByText('cliente')).toBeInTheDocument();
  });

  it('renders project name', () => {
    render(<RolePerformanceCard performance={mockPerformance} />);
    expect(screen.getByText('Proyecto Test')).toBeInTheDocument();
  });

  it('renders performance score', () => {
    render(<RolePerformanceCard performance={mockPerformance} />);
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('Puntuación General')).toBeInTheDocument();
  });

  it('renders task completion rate', () => {
    render(<RolePerformanceCard performance={mockPerformance} />);
    expect(screen.getByText('90%')).toBeInTheDocument();
    expect(screen.getByText('9/10')).toBeInTheDocument();
  });

  it('renders validated OBVs', () => {
    render(<RolePerformanceCard performance={mockPerformance} />);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('€1500')).toBeInTheDocument();
  });

  it('renders lead conversion rate', () => {
    render(<RolePerformanceCard performance={mockPerformance} />);
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('3/4')).toBeInTheDocument();
  });

  it('shows accepted role badge when role is accepted', () => {
    render(<RolePerformanceCard performance={mockPerformance} />);
    expect(screen.getByText('Rol Aceptado')).toBeInTheDocument();
  });

  it('shows pending badge when role is not accepted', () => {
    const pendingPerformance = { ...mockPerformance, role_accepted: false };
    render(<RolePerformanceCard performance={pendingPerformance} />);
    expect(screen.getByText('Pendiente de Aceptar')).toBeInTheDocument();
  });

  it('shows lead badge when is_lead is true', () => {
    const leadPerformance = { ...mockPerformance, is_lead: true };
    render(<RolePerformanceCard performance={leadPerformance} />);
    expect(screen.getByText('Lead del Proyecto')).toBeInTheDocument();
  });

  it('does not show lead badge when is_lead is false', () => {
    render(<RolePerformanceCard performance={mockPerformance} />);
    expect(screen.queryByText('Lead del Proyecto')).not.toBeInTheDocument();
  });

  it('renders ranking when provided', () => {
    const ranking = { position: 1, previousPosition: 3 };
    render(<RolePerformanceCard performance={mockPerformance} ranking={ranking} />);
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('Ranking')).toBeInTheDocument();
  });

  it('does not render ranking when not provided', () => {
    render(<RolePerformanceCard performance={mockPerformance} />);
    expect(screen.queryByText('Ranking')).not.toBeInTheDocument();
  });

  it('shows arrow up when position improved', () => {
    const ranking = { position: 1, previousPosition: 3 };
    const { container } = render(<RolePerformanceCard performance={mockPerformance} ranking={ranking} />);
    const arrowUp = container.querySelector('.text-success');
    expect(arrowUp).toBeInTheDocument();
  });

  it('shows arrow down when position worsened', () => {
    const ranking = { position: 3, previousPosition: 1 };
    const { container } = render(<RolePerformanceCard performance={mockPerformance} ranking={ranking} />);
    const arrowDown = container.querySelector('.text-destructive');
    expect(arrowDown).toBeInTheDocument();
  });

  it('shows equal sign when position unchanged', () => {
    const ranking = { position: 2, previousPosition: 2 };
    const { container } = render(<RolePerformanceCard performance={mockPerformance} ranking={ranking} />);
    const equal = container.querySelector('.text-muted-foreground');
    expect(equal).toBeInTheDocument();
  });

  it('does not show position change when no previous position', () => {
    const ranking = { position: 1, previousPosition: null };
    render(<RolePerformanceCard performance={mockPerformance} ranking={ranking} />);
    expect(screen.getByText('#1')).toBeInTheDocument();
  });

  it('renders role color bar at top', () => {
    const { container } = render(<RolePerformanceCard performance={mockPerformance} />);
    const colorBar = container.querySelector('.h-1');
    expect(colorBar).toBeInTheDocument();
  });

  it('renders role icon', () => {
    const { container } = render(<RolePerformanceCard performance={mockPerformance} />);
    const iconContainer = container.querySelector('.w-10.h-10.rounded-lg');
    expect(iconContainer).toBeInTheDocument();
    expect(iconContainer?.querySelector('svg')).toBeInTheDocument();
  });

  it('renders progress bar for performance score', () => {
    const { container } = render(<RolePerformanceCard performance={mockPerformance} />);
    const progress = container.querySelector('[role="progressbar"]');
    expect(progress).toBeInTheDocument();
  });

  it('renders all metric labels', () => {
    render(<RolePerformanceCard performance={mockPerformance} />);
    expect(screen.getByText('Tareas')).toBeInTheDocument();
    expect(screen.getByText('OBVs')).toBeInTheDocument();
    expect(screen.getByText('Leads')).toBeInTheDocument();
  });

  it('renders metrics grid with 3 columns', () => {
    const { container } = render(<RolePerformanceCard performance={mockPerformance} />);
    const grid = container.querySelector('.grid-cols-3');
    expect(grid).toBeInTheDocument();
    const cells = grid?.querySelectorAll('.bg-muted\\/50');
    expect(cells).toHaveLength(3);
  });

  it('handles zero facturacion', () => {
    const zeroPerformance = { ...mockPerformance, total_facturacion: 0 };
    render(<RolePerformanceCard performance={zeroPerformance} />);
    expect(screen.getByText('€0')).toBeInTheDocument();
  });

  it('handles zero task completion', () => {
    const zeroTasks = { ...mockPerformance, completed_tasks: 0, total_tasks: 0, task_completion_rate: 0 };
    render(<RolePerformanceCard performance={zeroTasks} />);
    expect(screen.getByText('0/0')).toBeInTheDocument();
  });

  it('handles unknown role gracefully', () => {
    const unknownRole = { ...mockPerformance, role_name: 'unknown_role' };
    render(<RolePerformanceCard performance={unknownRole} />);
    expect(screen.getByText('unknown_role')).toBeInTheDocument();
  });

  it('applies success styling to accepted role badge', () => {
    render(<RolePerformanceCard performance={mockPerformance} />);
    const badge = screen.getByText('Rol Aceptado');
    expect(badge).toHaveClass('bg-success/10', 'text-success');
  });

  it('applies muted styling to pending role badge', () => {
    const pendingPerformance = { ...mockPerformance, role_accepted: false };
    render(<RolePerformanceCard performance={pendingPerformance} />);
    const badge = screen.getByText('Pendiente de Aceptar');
    expect(badge).toHaveClass('bg-muted', 'text-muted-foreground');
  });

  it('applies amber styling to lead badge', () => {
    const leadPerformance = { ...mockPerformance, is_lead: true };
    render(<RolePerformanceCard performance={leadPerformance} />);
    const badge = screen.getByText('Lead del Proyecto');
    expect(badge).toHaveClass('bg-amber-500/10', 'text-amber-500');
  });

  it('formats facturacion without decimals', () => {
    const decimalPerformance = { ...mockPerformance, total_facturacion: 1234.56 };
    render(<RolePerformanceCard performance={decimalPerformance} />);
    expect(screen.getByText('€1235')).toBeInTheDocument();
  });
});
