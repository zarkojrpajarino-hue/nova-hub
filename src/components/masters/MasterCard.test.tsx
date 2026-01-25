import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MasterCard } from './MasterCard';

vi.mock('@/data/mockData', () => ({
  ROLE_CONFIG: {
    comercial: { label: 'Comercial', color: '#6366F1', icon: () => null },
  },
}));

vi.mock('date-fns', () => ({
  formatDistanceToNow: vi.fn(() => '3 meses'),
}));

vi.mock('date-fns/locale', () => ({
  es: {},
}));

const mockMaster = {
  id: 'master1',
  user_id: 'user1',
  role_name: 'comercial',
  level: 1,
  title: null,
  appointed_at: new Date().toISOString(),
  total_mentees: 5,
  successful_defenses: 3,
  userName: 'John Doe',
  userAvatar: null,
  userColor: '#6366F1',
};

describe('MasterCard', () => {
  it('renders user name', () => {
    render(<MasterCard master={mockMaster} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('displays Master level badge', () => {
    render(<MasterCard master={mockMaster} />);
    expect(screen.getByText('Master')).toBeInTheDocument();
  });

  it('shows role label', () => {
    render(<MasterCard master={mockMaster} />);
    expect(screen.getByText('Comercial')).toBeInTheDocument();
  });

  it('displays mentees count', () => {
    render(<MasterCard master={mockMaster} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('shows successful defenses', () => {
    render(<MasterCard master={mockMaster} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders challenge button when canChallenge is true', () => {
    render(<MasterCard master={mockMaster} canChallenge={true} onChallenge={vi.fn()} />);
    expect(screen.getByText('Desafiar')).toBeInTheDocument();
  });
});
