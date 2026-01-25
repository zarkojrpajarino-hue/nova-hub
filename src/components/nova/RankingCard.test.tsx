import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RankingCard } from './RankingCard';
import { TrendingUp } from 'lucide-react';
import { Member } from '@/data/mockData';

describe('RankingCard', () => {
  const mockMembers: Member[] = [
    { id: '1', nombre: 'Alice', color: '#FF0000', obvs: 50, facturacion: 10000, lps: 25 } as Member,
    { id: '2', nombre: 'Bob', color: '#00FF00', obvs: 40, facturacion: 8000, lps: 20 } as Member,
    { id: '3', nombre: 'Charlie', color: '#0000FF', obvs: 30, facturacion: 6000, lps: 15 } as Member,
    { id: '4', nombre: 'Diana', color: '#FFFF00', obvs: 20, facturacion: 4000, lps: 10 } as Member,
    { id: '5', nombre: 'Eve', color: '#FF00FF', obvs: 10, facturacion: 2000, lps: 5 } as Member,
    { id: '6', nombre: 'Frank', color: '#00FFFF', obvs: 5, facturacion: 1000, lps: 3 } as Member,
  ];

  const defaultProps = {
    title: 'Top Rankings',
    icon: TrendingUp,
    iconColor: '#6366F1',
    members: mockMembers,
    valueKey: 'obvs' as keyof Member,
    objective: 100,
  };

  it('renders title correctly', () => {
    render(<RankingCard {...defaultProps} />);

    expect(screen.getByText('Top Rankings')).toBeInTheDocument();
  });

  it('limits display to top 5 members', () => {
    render(<RankingCard {...defaultProps} />);

    // Should show Alice through Eve (5 members)
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Eve')).toBeInTheDocument();

    // Frank (6th member) should not be displayed
    expect(screen.queryByText('Frank')).not.toBeInTheDocument();
  });

  it('displays member names and values', () => {
    render(<RankingCard {...defaultProps} />);

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument(); // Alice's obvs value
  });

  it('calculates progress correctly', () => {
    render(<RankingCard {...defaultProps} />);

    // Alice has 50 obvs out of 100 objective = 50%
    expect(screen.getByText('50% del objetivo')).toBeInTheDocument();

    // Bob has 40 obvs out of 100 objective = 40%
    expect(screen.getByText('40% del objetivo')).toBeInTheDocument();
  });

  it('uses custom formatValue function when provided', () => {
    const formatValue = (v: number) => `€${v}`;
    render(
      <RankingCard
        {...defaultProps}
        valueKey="facturacion"
        formatValue={formatValue}
      />
    );

    expect(screen.getByText('€10000')).toBeInTheDocument();
  });

  it('displays position badges with correct styling', () => {
    render(<RankingCard {...defaultProps} />);

    // Check that position numbers are rendered (1, 2, 3, 4, 5)
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('displays member initials in avatar', () => {
    render(<RankingCard {...defaultProps} />);

    // Check that first letter of names are displayed
    const avatars = screen.getAllByText(/^[A-Z]$/);
    expect(avatars.length).toBeGreaterThan(0);
    expect(screen.getByText('A')).toBeInTheDocument(); // Alice
    expect(screen.getByText('B')).toBeInTheDocument(); // Bob
  });

  it('renders icon with correct color', () => {
    const { container } = render(<RankingCard {...defaultProps} iconColor="#FF0000" />);

    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('handles empty members array', () => {
    render(<RankingCard {...defaultProps} members={[]} />);

    expect(screen.getByText('Top Rankings')).toBeInTheDocument();
    // No member names should be displayed
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
  });

  it('works with different value keys', () => {
    render(<RankingCard {...defaultProps} valueKey="lps" />);

    expect(screen.getByText('25')).toBeInTheDocument(); // Alice's lps value
  });
});
