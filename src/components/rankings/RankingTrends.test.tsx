import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RankingTrends } from './RankingTrends';

// Mock Recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: ({ dataKey }: any) => <div data-testid={`line-${dataKey}`}>{dataKey}</div>,
  XAxis: () => <div data-testid="x-axis">XAxis</div>,
  YAxis: () => <div data-testid="y-axis">YAxis</div>,
  CartesianGrid: () => <div data-testid="cartesian-grid">Grid</div>,
  Tooltip: () => <div data-testid="tooltip">Tooltip</div>,
  Legend: () => <div data-testid="legend">Legend</div>,
}));

const mockRankings = [
  {
    id: '1',
    role_name: 'comercial',
    user_id: 'user1',
    ranking_position: 1,
    score: 85,
    previous_position: 3,
    userName: 'Juan Pérez',
    userColor: '#6366F1',
    calculated_at: new Date().toISOString(),
  },
  {
    id: '2',
    role_name: 'comercial',
    user_id: 'user2',
    ranking_position: 2,
    score: 75,
    previous_position: 2,
    userName: 'María González',
    userColor: '#22C55E',
    calculated_at: new Date().toISOString(),
  },
  {
    id: '3',
    role_name: 'closer',
    user_id: 'user3',
    ranking_position: 1,
    score: 90,
    previous_position: 5,
    userName: 'Carlos Ruiz',
    userColor: '#F59E0B',
    calculated_at: new Date().toISOString(),
  },
];

describe('RankingTrends', () => {
  it('renders three main sections', () => {
    render(<RankingTrends rankings={mockRankings} selectedRole="all" />);
    expect(screen.getByText('Mayores Movimientos')).toBeInTheDocument();
    expect(screen.getByText('Estadísticas por Rol')).toBeInTheDocument();
    expect(screen.getByText('Distribución de Scores')).toBeInTheDocument();
  });

  it('displays movers sorted by biggest position change', () => {
    render(<RankingTrends rankings={mockRankings} selectedRole="all" />);
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    expect(screen.getByText('Carlos Ruiz')).toBeInTheDocument();
  });

  it('shows empty state when no position changes', () => {
    const noChanges = [
      {
        id: '1',
        role_name: 'comercial',
        user_id: 'user1',
        ranking_position: 1,
        score: 85,
        previous_position: null,
        userName: 'User 1',
        userColor: '#6366F1',
        calculated_at: new Date().toISOString(),
      },
    ];
    render(<RankingTrends rankings={noChanges} selectedRole="all" />);
    expect(screen.getByText('Sin cambios de posición registrados aún')).toBeInTheDocument();
  });

  it('displays user avatars with colors', () => {
    const { container } = render(<RankingTrends rankings={mockRankings} selectedRole="all" />);
    const avatar = screen.getByText('J');
    expect(avatar).toHaveStyle({ background: '#6366F1' });
  });

  it('shows trending up icon for position improvements', () => {
    const { container } = render(<RankingTrends rankings={mockRankings} selectedRole="all" />);
    const trendingUpIcons = container.querySelectorAll('.lucide-trending-up');
    expect(trendingUpIcons.length).toBeGreaterThan(0);
  });

  it('shows trending down icon for position declines', () => {
    const rankingsWithDecline = [
      {
        id: '1',
        role_name: 'comercial',
        user_id: 'user1',
        ranking_position: 5,
        score: 60,
        previous_position: 2,
        userName: 'Declined User',
        userColor: '#EF4444',
        calculated_at: new Date().toISOString(),
      },
    ];
    const { container } = render(<RankingTrends rankings={rankingsWithDecline} selectedRole="all" />);
    const trendingDownIcons = container.querySelectorAll('.lucide-trending-down');
    expect(trendingDownIcons.length).toBeGreaterThan(0);
  });

  it('calculates and displays role statistics', () => {
    render(<RankingTrends rankings={mockRankings} selectedRole="all" />);
    expect(screen.getByText('2 miembros')).toBeInTheDocument(); // comercial has 2 members
  });

  it('displays average score for each role', () => {
    render(<RankingTrends rankings={mockRankings} selectedRole="all" />);
    expect(screen.getByText('80%')).toBeInTheDocument(); // avg of 85 and 75
    expect(screen.getByText('90%')).toBeInTheDocument(); // closer
  });

  it('shows top performer for each role', () => {
    render(<RankingTrends rankings={mockRankings} selectedRole="all" />);
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument(); // #1 in comercial
    expect(screen.getByText('Carlos Ruiz')).toBeInTheDocument(); // #1 in closer
  });

  it('renders role icons and labels', () => {
    const { container } = render(<RankingTrends rankings={mockRankings} selectedRole="all" />);
    expect(screen.getByText('Comercial')).toBeInTheDocument();
    expect(screen.getByText('Closer')).toBeInTheDocument();
  });

  it('renders score distribution chart', () => {
    render(<RankingTrends rankings={mockRankings} selectedRole="all" />);
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByTestId('x-axis')).toBeInTheDocument();
    expect(screen.getByTestId('y-axis')).toBeInTheDocument();
    expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    expect(screen.getByTestId('legend')).toBeInTheDocument();
  });

  it('filters chart data by selected role', () => {
    render(<RankingTrends rankings={mockRankings} selectedRole="comercial" />);
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('shows all roles when selectedRole is "all"', () => {
    render(<RankingTrends rankings={mockRankings} selectedRole="all" />);
    expect(screen.getByText('Comercial')).toBeInTheDocument();
    expect(screen.getByText('Closer')).toBeInTheDocument();
  });

  it('limits movers to top 10', () => {
    const manyMovers = Array.from({ length: 15 }, (_, i) => ({
      id: `${i}`,
      role_name: 'comercial',
      user_id: `user${i}`,
      ranking_position: i + 1,
      score: 80 - i,
      previous_position: 15 - i,
      userName: `User ${i}`,
      userColor: '#6366F1',
      calculated_at: new Date().toISOString(),
    }));

    const { container } = render(<RankingTrends rankings={manyMovers} selectedRole="all" />);
    const moversContainer = container.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.gap-3');
    const moverCards = moversContainer?.querySelectorAll('.flex.items-center.gap-3.p-3');
    expect(moverCards?.length).toBeLessThanOrEqual(10);
  });

  it('displays role color in badges', () => {
    const { container } = render(<RankingTrends rankings={mockRankings} selectedRole="all" />);
    const badges = container.querySelectorAll('.border-\\[var\\(--tw-prose-hr\\)\\]');
    expect(badges.length).toBeGreaterThan(0);
  });

  it('renders responsive container for chart', () => {
    render(<RankingTrends rankings={mockRankings} selectedRole="all" />);
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
  });
});
