import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MasterCard } from './MasterCard';

// Mock date-fns
vi.mock('date-fns', () => ({
  formatDistanceToNow: () => '3 meses',
}));

vi.mock('date-fns/locale', () => ({
  es: {},
}));

// Mock ROLE_CONFIG
vi.mock('@/data/mockData', () => ({
  ROLE_CONFIG: {
    comercial: { label: 'Comercial', color: '#6366F1' },
    partner: { label: 'Partner', color: '#22C55E' },
  },
}));

const mockMaster = {
  id: 'master1',
  user_id: 'user1',
  role_name: 'comercial',
  level: 1,
  title: 'Master Comercial',
  appointed_at: '2024-01-01T00:00:00Z',
  total_mentees: 5,
  successful_defenses: 3,
  userName: 'Juan Pérez',
  userAvatar: null,
  userColor: '#6366F1',
};

describe('MasterCard', () => {
  it('renders master name', () => {
    render(<MasterCard master={mockMaster} />);
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
  });

  it('renders level badge', () => {
    render(<MasterCard master={mockMaster} />);
    expect(screen.getByText('Master')).toBeInTheDocument();
  });

  it('renders role badge', () => {
    render(<MasterCard master={mockMaster} />);
    expect(screen.getByText('Comercial')).toBeInTheDocument();
  });

  it('renders mentees count', () => {
    render(<MasterCard master={mockMaster} />);
    expect(screen.getByText('Mentees')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders successful defenses count', () => {
    render(<MasterCard master={mockMaster} />);
    expect(screen.getByText('Defensas')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders time since appointment', () => {
    render(<MasterCard master={mockMaster} />);
    expect(screen.getByText('Desde hace')).toBeInTheDocument();
    expect(screen.getByText('3 meses')).toBeInTheDocument();
  });

  it('renders avatar with user color', () => {
    const { container } = render(<MasterCard master={mockMaster} />);
    const avatar = container.querySelector('.text-lg.font-bold');
    expect(avatar).toHaveTextContent('J');
  });

  it('renders Senior Master badge for level 2', () => {
    const seniorMaster = { ...mockMaster, level: 2 };
    render(<MasterCard master={seniorMaster} />);
    expect(screen.getByText('Senior Master')).toBeInTheDocument();
  });

  it('renders Grand Master badge for level 3', () => {
    const grandMaster = { ...mockMaster, level: 3 };
    render(<MasterCard master={grandMaster} />);
    expect(screen.getByText('Grand Master')).toBeInTheDocument();
  });

  it('renders challenge button when canChallenge is true', () => {
    const mockOnChallenge = vi.fn();
    render(<MasterCard master={mockMaster} canChallenge={true} onChallenge={mockOnChallenge} />);
    expect(screen.getByText(/Desafiar/)).toBeInTheDocument();
  });

  it('does not render challenge button when canChallenge is false', () => {
    render(<MasterCard master={mockMaster} canChallenge={false} />);
    expect(screen.queryByText(/Desafiar/)).not.toBeInTheDocument();
  });

  it('handles unknown role gracefully', () => {
    const unknownRoleMaster = { ...mockMaster, role_name: 'unknown_role' };
    render(<MasterCard master={unknownRoleMaster} />);
    expect(screen.getByText('unknown_role')).toBeInTheDocument();
  });
});
