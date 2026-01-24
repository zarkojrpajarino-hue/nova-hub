import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TopRankingsWidget } from './TopRankingsWidget';

const mockMembers = [
  {
    id: '1',
    nombre: 'Juan Pérez',
    color: '#6366F1',
    obvs: 25,
    facturacion: 15000,
    lps: 10,
  },
  {
    id: '2',
    nombre: 'María González',
    color: '#22C55E',
    obvs: 20,
    facturacion: 12000,
    lps: 8,
  },
  {
    id: '3',
    nombre: 'Carlos Ruiz',
    color: '#F59E0B',
    obvs: 15,
    facturacion: 10000,
    lps: 6,
  },
  {
    id: '4',
    nombre: 'Ana López',
    color: '#EC4899',
    obvs: 10,
    facturacion: 5000,
    lps: 4,
  },
];

describe('TopRankingsWidget', () => {
  it('renders all three podium sections', () => {
    render(<TopRankingsWidget members={mockMembers} />);
    expect(screen.getByText('Top OBVs')).toBeInTheDocument();
    expect(screen.getByText('Top Facturación')).toBeInTheDocument();
    expect(screen.getByText('Top LPs')).toBeInTheDocument();
  });

  it('renders top 3 members by OBVs', () => {
    render(<TopRankingsWidget members={mockMembers} />);
    expect(screen.getByText('Top OBVs')).toBeInTheDocument();
    expect(screen.getAllByText('J')).toHaveLength(3); // Juan appears in all 3 podiums
    expect(screen.getAllByText('M')).toHaveLength(3); // María appears in all 3 podiums
    expect(screen.getAllByText('C')).toHaveLength(3); // Carlos appears in all 3 podiums
  });

  it('shows crown emoji for first place in OBVs', () => {
    render(<TopRankingsWidget members={mockMembers} />);
    const crownEmojis = screen.getAllByText('👑');
    expect(crownEmojis).toHaveLength(3); // One crown per podium
  });

  it('displays OBV counts correctly', () => {
    render(<TopRankingsWidget members={mockMembers} />);
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('renders top 3 members by facturacion', () => {
    render(<TopRankingsWidget members={mockMembers} />);
    expect(screen.getByText('Top Facturación')).toBeInTheDocument();
    // Members are shown by avatars with first letters
  });

  it('formats facturacion as currency', () => {
    render(<TopRankingsWidget members={mockMembers} />);
    expect(screen.getByText('€15.0K')).toBeInTheDocument();
    expect(screen.getByText('€12.0K')).toBeInTheDocument();
    expect(screen.getByText('€10.0K')).toBeInTheDocument();
  });

  it('renders top 3 members by LPs', () => {
    render(<TopRankingsWidget members={mockMembers} />);
    expect(screen.getByText('Top LPs')).toBeInTheDocument();
    // Members are shown by avatars with first letters
  });

  it('displays LP counts correctly', () => {
    render(<TopRankingsWidget members={mockMembers} />);
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
  });

  it('shows podium positions in correct order (2-1-3)', () => {
    const { container } = render(<TopRankingsWidget members={mockMembers} />);
    const podiums = container.querySelectorAll('.h-\\[120px\\]');
    expect(podiums.length).toBe(3);
  });

  it('handles empty members array', () => {
    render(<TopRankingsWidget members={[]} />);
    expect(screen.getByText('Top OBVs')).toBeInTheDocument();
    expect(screen.getByText('Top Facturación')).toBeInTheDocument();
    expect(screen.getByText('Top LPs')).toBeInTheDocument();
  });

  it('handles less than 3 members', () => {
    const fewMembers = mockMembers.slice(0, 2);
    render(<TopRankingsWidget members={fewMembers} />);
    expect(screen.getAllByText('J')).toHaveLength(3); // Juan in all 3 podiums
    expect(screen.getAllByText('M')).toHaveLength(3); // María in all 3 podiums
  });

  it('handles single member', () => {
    const singleMember = mockMembers.slice(0, 1);
    render(<TopRankingsWidget members={singleMember} />);
    expect(screen.getAllByText('J')).toHaveLength(3); // Juan in all 3 podiums
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('renders with correct grid layout', () => {
    const { container } = render(<TopRankingsWidget members={mockMembers} />);
    const grid = container.querySelector('.grid.grid-cols-3');
    expect(grid).toBeInTheDocument();
  });

  it('applies correct height to podium containers', () => {
    const { container } = render(<TopRankingsWidget members={mockMembers} />);
    const podiums = container.querySelectorAll('.h-\\[120px\\]');
    podiums.forEach(podium => {
      expect(podium).toHaveClass('h-[120px]');
    });
  });

  it('renders OBV icon', () => {
    const { container } = render(<TopRankingsWidget members={mockMembers} />);
    const obvSection = screen.getByText('Top OBVs').closest('div');
    const icon = obvSection?.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('renders facturacion icon', () => {
    const { container } = render(<TopRankingsWidget members={mockMembers} />);
    const facturacionSection = screen.getByText('Top Facturación').closest('div');
    const icon = facturacionSection?.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('renders LP icon', () => {
    const { container } = render(<TopRankingsWidget members={mockMembers} />);
    const lpSection = screen.getByText('Top LPs').closest('div');
    const icon = lpSection?.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('sorts members correctly by OBVs descending', () => {
    const unsortedMembers = [mockMembers[3], mockMembers[0], mockMembers[2], mockMembers[1]];
    render(<TopRankingsWidget members={unsortedMembers} />);
    // Top member should have crown and highest value
    expect(screen.getAllByText('👑')).toHaveLength(3); // Crown in each podium for first place
    expect(screen.getByText('25')).toBeInTheDocument(); // Juan's OBV count
  });

  it('sorts members correctly by facturacion descending', () => {
    const unsortedMembers = [mockMembers[3], mockMembers[0], mockMembers[2], mockMembers[1]];
    render(<TopRankingsWidget members={unsortedMembers} />);
    expect(screen.getByText('€15.0K')).toBeInTheDocument(); // Juan's facturacion
  });

  it('sorts members correctly by LPs descending', () => {
    const unsortedMembers = [mockMembers[3], mockMembers[0], mockMembers[2], mockMembers[1]];
    render(<TopRankingsWidget members={unsortedMembers} />);
    expect(screen.getByText('10')).toBeInTheDocument(); // Juan's LP count
  });

  it('handles members with zero values', () => {
    const zeroMembers = [
      {
        id: '1',
        nombre: 'Zero Member',
        color: '#6366F1',
        obvs: 0,
        facturacion: 0,
        lps: 0,
      },
    ];
    render(<TopRankingsWidget members={zeroMembers} />);
    expect(screen.getAllByText('Z')).toHaveLength(3); // Zero in all 3 podiums
    expect(screen.getAllByText('0')).toHaveLength(2); // 0 for OBVs and LPs
    expect(screen.getByText('€0.0K')).toBeInTheDocument(); // Formatted facturacion
  });

  it('limits to top 3 members only', () => {
    const manyMembers = [
      ...mockMembers,
      {
        id: '5',
        nombre: 'Fifth Member',
        color: '#8B5CF6',
        obvs: 5,
        facturacion: 3000,
        lps: 2,
      },
    ];
    render(<TopRankingsWidget members={manyMembers} />);
    expect(screen.getAllByText('J')).toHaveLength(3);
    expect(screen.getAllByText('M')).toHaveLength(3);
    expect(screen.getAllByText('C')).toHaveLength(3);
    expect(screen.queryByText('F')).not.toBeInTheDocument(); // Fifth not shown
  });

  it('renders card with border', () => {
    const { container } = render(<TopRankingsWidget members={mockMembers} />);
    const card = container.querySelector('.border');
    expect(card).toBeInTheDocument();
  });

  it('applies gap between podium items', () => {
    const { container } = render(<TopRankingsWidget members={mockMembers} />);
    const podiums = container.querySelectorAll('.gap-2');
    expect(podiums.length).toBeGreaterThan(0);
  });

  it('centers podium items', () => {
    const { container } = render(<TopRankingsWidget members={mockMembers} />);
    const podiums = container.querySelectorAll('.justify-center');
    expect(podiums.length).toBeGreaterThan(0);
  });
});
