import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProjectTeamTab } from './ProjectTeamTab';

// Mock ROLE_CONFIG
vi.mock('@/data/mockData', () => ({
  ROLE_CONFIG: {
    comercial: {
      label: 'Comercial',
      color: '#6366F1',
      icon: () => null,
    },
    closer: {
      label: 'Closer',
      color: '#22C55E',
      icon: () => null,
    },
  },
}));

const mockProject = {
  id: 'proj1',
  nombre: 'Proyecto Alpha',
  icon: '🚀',
  descripcion: 'Test project',
  color: '#6366F1',
  obvs_objetivo: 50,
  obvs_actuales: 25,
  meta_facturacion: 100000,
  facturacion_actual: 50000,
  created_at: new Date().toISOString(),
  leads_actuales: 10,
  leads_objetivo: 20,
};

const mockTeamMembers = [
  {
    id: 'user1',
    nombre: 'John Doe',
    role: 'comercial',
    color: '#6366F1',
    isLead: true,
    obvs: 10,
    facturacion: 5000,
    margen: 3000,
  },
  {
    id: 'user2',
    nombre: 'Jane Smith',
    role: 'closer',
    color: '#22C55E',
    isLead: false,
    obvs: 8,
    facturacion: 4000,
    margen: 2500,
  },
];

describe('ProjectTeamTab', () => {
  it('renders team section title', () => {
    render(<ProjectTeamTab project={mockProject} teamMembers={mockTeamMembers} />);
    expect(screen.getByText('Equipo de Proyecto Alpha')).toBeInTheDocument();
  });

  it('displays team member names', () => {
    render(<ProjectTeamTab project={mockProject} teamMembers={mockTeamMembers} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('shows role labels', () => {
    render(<ProjectTeamTab project={mockProject} teamMembers={mockTeamMembers} />);
    expect(screen.getAllByText('Comercial').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Closer').length).toBeGreaterThan(0);
  });

  it('renders Crown icon for team lead', () => {
    const { container } = render(<ProjectTeamTab project={mockProject} teamMembers={mockTeamMembers} />);
    const icon = container.querySelector('.lucide-crown');
    expect(icon).toBeInTheDocument();
  });

  it('displays roles legend section', () => {
    render(<ProjectTeamTab project={mockProject} teamMembers={mockTeamMembers} />);
    expect(screen.getByText('Roles del Equipo')).toBeInTheDocument();
  });

  it('shows member count per role', () => {
    render(<ProjectTeamTab project={mockProject} teamMembers={mockTeamMembers} />);
    // Each role (comercial and closer) has 1 member, so '1 asignados' appears twice.
    // Use getAllByText to handle multiple matching elements.
    expect(screen.getAllByText('1 asignados').length).toBeGreaterThan(0);
  });

  it('renders Users icon', () => {
    const { container } = render(<ProjectTeamTab project={mockProject} teamMembers={mockTeamMembers} />);
    const icon = container.querySelector('.lucide-users');
    expect(icon).toBeInTheDocument();
  });

  it('displays member stats (OBVs)', () => {
    render(<ProjectTeamTab project={mockProject} teamMembers={mockTeamMembers} />);
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('shows fact. label for facturación', () => {
    render(<ProjectTeamTab project={mockProject} teamMembers={mockTeamMembers} />);
    const labels = screen.getAllByText('Fact.');
    expect(labels.length).toBe(2);
  });
});
