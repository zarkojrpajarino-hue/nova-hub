import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RolePerformanceCard } from './RolePerformanceCard';
import type { RolePerformance } from '@/hooks/useDevelopment';

// Mock ROLE_CONFIG
vi.mock('@/data/mockData', () => ({
  ROLE_CONFIG: {
    comercial: {
      label: 'Comercial',
      color: '#6366F1',
      icon: () => null,
    },
  },
}));

const mockPerformance: RolePerformance = {
  user_id: 'user1',
  user_name: 'Test User',
  project_id: 'proj1',
  role_name: 'comercial',
  role_accepted: true,
  is_lead: false,
  project_name: 'Proyecto Alpha',
  performance_score: 85,
  task_completion_rate: 90,
  total_tasks: 10,
  completed_tasks: 9,
  validated_obvs: 15,
  total_obvs: 20,
  total_facturacion: 5000,
  lead_conversion_rate: 60,
  total_leads: 10,
  leads_ganados: 6,
  joined_at: new Date().toISOString(),
};

describe('RolePerformanceCard', () => {
  it('renders role name', () => {
    render(<RolePerformanceCard performance={mockPerformance} />);
    expect(screen.getByText('Comercial')).toBeInTheDocument();
  });

  it('renders project name', () => {
    render(<RolePerformanceCard performance={mockPerformance} />);
    expect(screen.getByText('Proyecto Alpha')).toBeInTheDocument();
  });

  it('displays performance score', () => {
    render(<RolePerformanceCard performance={mockPerformance} />);
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('displays task completion rate', () => {
    render(<RolePerformanceCard performance={mockPerformance} />);
    expect(screen.getByText('90%')).toBeInTheDocument();
  });

  it('shows completed tasks count', () => {
    render(<RolePerformanceCard performance={mockPerformance} />);
    expect(screen.getByText('9/10')).toBeInTheDocument();
  });

  it('shows validated OBVs count', () => {
    render(<RolePerformanceCard performance={mockPerformance} />);
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('displays total facturación', () => {
    render(<RolePerformanceCard performance={mockPerformance} />);
    expect(screen.getByText('€5000')).toBeInTheDocument();
  });

  it('shows lead conversion rate', () => {
    render(<RolePerformanceCard performance={mockPerformance} />);
    expect(screen.getByText('60%')).toBeInTheDocument();
  });

  it('shows leads ganados count', () => {
    render(<RolePerformanceCard performance={mockPerformance} />);
    expect(screen.getByText('6/10')).toBeInTheDocument();
  });

  it('displays rol aceptado badge', () => {
    render(<RolePerformanceCard performance={mockPerformance} />);
    expect(screen.getByText('Rol Aceptado')).toBeInTheDocument();
  });

  it('shows ranking position when provided', () => {
    render(<RolePerformanceCard performance={mockPerformance} ranking={{ position: 1, previousPosition: 2 }} />);
    expect(screen.getByText('#1')).toBeInTheDocument();
  });

  it('shows lead badge when is_lead is true', () => {
    const leadPerformance: RolePerformance = { ...mockPerformance, is_lead: true };
    render(<RolePerformanceCard performance={leadPerformance} />);
    expect(screen.getByText('Lead del Proyecto')).toBeInTheDocument();
  });
});
