import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RankingLeaderboard } from './RankingLeaderboard';

describe('RankingLeaderboard', () => {
  it('renders empty state', () => {
    render(<RankingLeaderboard rankings={[]} />);
    expect(screen.getByText('Sin rankings disponibles')).toBeInTheDocument();
  });

  it('renders rankings for a role', () => {
    const rankings = [{
      id: '1',
      role_name: 'comercial',
      user_id: 'user1',
      project_id: 'proj1',
      ranking_position: 1,
      score: 85,
      previous_position: null,
      userName: 'Test User',
      userAvatar: null,
      userColor: '#6366F1',
      projectName: 'Test Project',
      projectColor: '#6366F1',
    }];
    render(<RankingLeaderboard rankings={rankings} />);
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });
});
