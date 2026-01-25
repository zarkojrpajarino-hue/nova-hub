import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TopRankingsWidget } from './TopRankingsWidget';

const mockMembers = [
  { id: 'user1', nombre: 'Alice', color: '#6366F1', obvs: 10, facturacion: 5000, lps: 3 },
  { id: 'user2', nombre: 'Bob', color: '#22C55E', obvs: 15, facturacion: 8000, lps: 5 },
  { id: 'user3', nombre: 'Charlie', color: '#F59E0B', obvs: 8, facturacion: 3000, lps: 2 },
];

describe('TopRankingsWidget', () => {
  it('renders Top OBVs section', () => {
    render(<TopRankingsWidget members={mockMembers} />);
    expect(screen.getByText('Top OBVs')).toBeInTheDocument();
  });

  it('renders Top Facturación section', () => {
    render(<TopRankingsWidget members={mockMembers} />);
    expect(screen.getByText('Top Facturación')).toBeInTheDocument();
  });

  it('renders Top LPs section', () => {
    render(<TopRankingsWidget members={mockMembers} />);
    expect(screen.getByText('Top LPs')).toBeInTheDocument();
  });

  it('renders Crown icon for Top OBVs', () => {
    const { container } = render(<TopRankingsWidget members={mockMembers} />);
    const icons = container.querySelectorAll('.lucide-crown');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('renders TrendingUp icon for Top Facturación', () => {
    const { container } = render(<TopRankingsWidget members={mockMembers} />);
    const icon = container.querySelector('.lucide-trending-up');
    expect(icon).toBeInTheDocument();
  });

  it('renders BookOpen icon for Top LPs', () => {
    const { container } = render(<TopRankingsWidget members={mockMembers} />);
    const icon = container.querySelector('.lucide-book-open');
    expect(icon).toBeInTheDocument();
  });

  it('displays first place indicator', () => {
    render(<TopRankingsWidget members={mockMembers} />);
    const firstPlaces = screen.getAllByText('1');
    expect(firstPlaces.length).toBeGreaterThan(0);
  });

  it('displays second place indicator', () => {
    render(<TopRankingsWidget members={mockMembers} />);
    const secondPlaces = screen.getAllByText('2');
    expect(secondPlaces.length).toBeGreaterThan(0);
  });

  it('displays third place indicator', () => {
    render(<TopRankingsWidget members={mockMembers} />);
    const thirdPlaces = screen.getAllByText('3');
    expect(thirdPlaces.length).toBeGreaterThan(0);
  });
});
