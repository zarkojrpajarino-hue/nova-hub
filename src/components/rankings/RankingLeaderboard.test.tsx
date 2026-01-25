import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RankingLeaderboard } from './RankingLeaderboard';

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

const mockRankings = [
  {
    id: 'rank1',
    role_name: 'comercial',
    user_id: 'user1',
    project_id: 'proj1',
    ranking_position: 1,
    score: 95,
    previous_position: 2,
    userName: 'John Doe',
    userAvatar: null,
    userColor: '#6366F1',
    projectName: 'Proyecto Alpha',
    projectColor: '#6366F1',
  },
  {
    id: 'rank2',
    role_name: 'comercial',
    user_id: 'user2',
    project_id: 'proj1',
    ranking_position: 2,
    score: 85,
    previous_position: 1,
    userName: 'Jane Smith',
    userAvatar: null,
    userColor: '#22C55E',
    projectName: 'Proyecto Alpha',
    projectColor: '#6366F1',
  },
];

describe('RankingLeaderboard', () => {
  it('shows empty state when no rankings', () => {
    render(<RankingLeaderboard rankings={[]} />);
    expect(screen.getByText('Sin rankings disponibles')).toBeInTheDocument();
  });

  it('renders role section title', () => {
    render(<RankingLeaderboard rankings={mockRankings} />);
    expect(screen.getByText('Comercial')).toBeInTheDocument();
  });

  it('shows participants count', () => {
    render(<RankingLeaderboard rankings={mockRankings} />);
    expect(screen.getByText(/2 participantes/)).toBeInTheDocument();
  });

  it('displays user names', () => {
    render(<RankingLeaderboard rankings={mockRankings} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('shows project name', () => {
    render(<RankingLeaderboard rankings={mockRankings} />);
    expect(screen.getAllByText('Proyecto Alpha').length).toBeGreaterThan(0);
  });

  it('displays scores', () => {
    render(<RankingLeaderboard rankings={mockRankings} />);
    expect(screen.getByText('95%')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('highlights current user ranking', () => {
    const { container } = render(<RankingLeaderboard rankings={mockRankings} currentUserId="user1" />);
    const highlighted = container.querySelector('.ring-primary');
    expect(highlighted).toBeInTheDocument();
  });

  it('shows "Tú" badge for current user', () => {
    render(<RankingLeaderboard rankings={mockRankings} currentUserId="user1" />);
    expect(screen.getByText('Tú')).toBeInTheDocument();
  });

  it('renders Trophy icon in empty state', () => {
    const { container } = render(<RankingLeaderboard rankings={[]} />);
    const icon = container.querySelector('.lucide-trophy');
    expect(icon).toBeInTheDocument();
  });
});
