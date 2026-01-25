import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChallengesList } from './ChallengesList';

vi.mock('@/data/mockData', () => ({
  ROLE_CONFIG: {
    comercial: { label: 'Comercial', color: '#6366F1', icon: () => null },
  },
}));

vi.mock('date-fns', () => ({
  formatDistanceToNow: vi.fn(() => 'hace 2 días'),
  format: vi.fn(() => '15 de enero de 2024'),
}));

vi.mock('date-fns/locale', () => ({
  es: {},
}));

describe('ChallengesList', () => {
  it('shows empty state when no challenges', () => {
    render(<ChallengesList challenges={[]} masters={[]} profiles={[]} />);
    expect(screen.getByText('Sin desafíos activos')).toBeInTheDocument();
  });

  it('renders Swords icon in empty state', () => {
    const { container } = render(<ChallengesList challenges={[]} masters={[]} profiles={[]} />);
    const icon = container.querySelector('.lucide-swords');
    expect(icon).toBeInTheDocument();
  });

  it('shows empty state description', () => {
    render(<ChallengesList challenges={[]} masters={[]} profiles={[]} />);
    expect(screen.getByText(/Los desafíos permiten competir/)).toBeInTheDocument();
  });
});
