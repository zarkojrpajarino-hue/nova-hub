import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyRankingCard } from './MyRankingCard';

const mockRanking = {
  id: 'rank1',
  role_name: 'comercial',
  ranking_position: 1,
  score: 85,
  previous_position: 3,
};

describe('MyRankingCard', () => {
  it('renders role name', () => {
    render(
      <MyRankingCard
        ranking={mockRanking}
        projectName="Proyecto Alpha"
        projectColor="#6366F1"
      />
    );
    expect(screen.getByText('Comercial')).toBeInTheDocument();
  });

  it('renders project name', () => {
    render(
      <MyRankingCard
        ranking={mockRanking}
        projectName="Proyecto Alpha"
        projectColor="#6366F1"
      />
    );
    expect(screen.getByText('Proyecto Alpha')).toBeInTheDocument();
  });

  it('renders score percentage', () => {
    render(
      <MyRankingCard
        ranking={mockRanking}
        projectName="Proyecto Alpha"
        projectColor="#6366F1"
      />
    );
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('renders position 1 with Crown icon', () => {
    const { container } = render(
      <MyRankingCard
        ranking={mockRanking}
        projectName="Proyecto Alpha"
        projectColor="#6366F1"
      />
    );
    const crownIcon = container.querySelector('.lucide-crown');
    expect(crownIcon).toBeInTheDocument();
  });

  it('renders position 2 with Medal icon', () => {
    const ranking = { ...mockRanking, ranking_position: 2 };
    const { container } = render(
      <MyRankingCard
        ranking={ranking}
        projectName="Proyecto Alpha"
        projectColor="#6366F1"
      />
    );
    const medalIcon = container.querySelector('.lucide-medal');
    expect(medalIcon).toBeInTheDocument();
  });

  it('renders position 3 with Award icon', () => {
    const ranking = { ...mockRanking, ranking_position: 3 };
    const { container } = render(
      <MyRankingCard
        ranking={ranking}
        projectName="Proyecto Alpha"
        projectColor="#6366F1"
      />
    );
    const awardIcon = container.querySelector('.lucide-award');
    expect(awardIcon).toBeInTheDocument();
  });

  it('renders position number for rank > 3', () => {
    const ranking = { ...mockRanking, ranking_position: 4, previous_position: null };
    render(
      <MyRankingCard
        ranking={ranking}
        projectName="Proyecto Alpha"
        projectColor="#6366F1"
      />
    );
    expect(screen.getByText('#4')).toBeInTheDocument();
  });

  it('shows positive position change with TrendingUp icon', () => {
    const { container } = render(
      <MyRankingCard
        ranking={mockRanking} // position 1, previous 3
        projectName="Proyecto Alpha"
        projectColor="#6366F1"
      />
    );
    const trendingUpIcon = container.querySelector('.lucide-trending-up');
    expect(trendingUpIcon).toBeInTheDocument();
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('shows negative position change with TrendingDown icon', () => {
    const ranking = { ...mockRanking, ranking_position: 5, previous_position: 2 };
    const { container } = render(
      <MyRankingCard
        ranking={ranking}
        projectName="Proyecto Alpha"
        projectColor="#6366F1"
      />
    );
    const trendingDownIcon = container.querySelector('.lucide-trending-down');
    expect(trendingDownIcon).toBeInTheDocument();
    expect(screen.getByText('-3')).toBeInTheDocument();
  });

  it('shows no change indicator when position unchanged', () => {
    const ranking = { ...mockRanking, previous_position: 1 };
    const { container } = render(
      <MyRankingCard
        ranking={ranking}
        projectName="Proyecto Alpha"
        projectColor="#6366F1"
      />
    );
    const minusIcon = container.querySelector('.lucide-minus');
    expect(minusIcon).toBeInTheDocument();
    expect(screen.getByText('=')).toBeInTheDocument();
  });

  it('does not show position change when previous_position is null', () => {
    const ranking = { ...mockRanking, previous_position: null };
    const { container } = render(
      <MyRankingCard
        ranking={ranking}
        projectName="Proyecto Alpha"
        projectColor="#6366F1"
      />
    );
    expect(screen.queryByText('+')).not.toBeInTheDocument();
    expect(screen.queryByText('-')).not.toBeInTheDocument();
  });

  it('renders progress bar', () => {
    const { container } = render(
      <MyRankingCard
        ranking={mockRanking}
        projectName="Proyecto Alpha"
        projectColor="#6366F1"
      />
    );
    const progressBar = container.querySelector('[role="progressbar"]');
    expect(progressBar).toBeInTheDocument();
  });

  it('sets progress value to score', () => {
    const { container } = render(
      <MyRankingCard
        ranking={mockRanking}
        projectName="Proyecto Alpha"
        projectColor="#6366F1"
      />
    );
    const progressBar = container.querySelector('[role="progressbar"]');
    expect(progressBar).toHaveAttribute('aria-valuenow', '85');
  });

  it('renders role icon with correct color', () => {
    const { container } = render(
      <MyRankingCard
        ranking={mockRanking}
        projectName="Proyecto Alpha"
        projectColor="#6366F1"
      />
    );
    const roleIcon = container.querySelector('.lucide-shopping-cart'); // Comercial icon
    expect(roleIcon).toBeInTheDocument();
  });

  it('renders project color indicator', () => {
    const { container } = render(
      <MyRankingCard
        ranking={mockRanking}
        projectName="Proyecto Alpha"
        projectColor="#22C55E"
      />
    );
    const colorDot = container.querySelector('.rounded-full');
    expect(colorDot).toHaveStyle({ background: '#22C55E' });
  });

  it('applies gradient background for top 3 positions', () => {
    const { container } = render(
      <MyRankingCard
        ranking={mockRanking}
        projectName="Proyecto Alpha"
        projectColor="#6366F1"
      />
    );
    const card = container.querySelector('.bg-gradient-to-br');
    expect(card).toBeInTheDocument();
  });

  it('does not apply gradient for positions > 3', () => {
    const ranking = { ...mockRanking, ranking_position: 5, previous_position: null };
    const { container } = render(
      <MyRankingCard
        ranking={ranking}
        projectName="Proyecto Alpha"
        projectColor="#6366F1"
      />
    );
    const card = container.firstChild;
    // Should have overflow-hidden but not bg-gradient-to-br
    expect(card).toHaveClass('overflow-hidden');
  });

  it('renders colored top border', () => {
    const { container } = render(
      <MyRankingCard
        ranking={mockRanking}
        projectName="Proyecto Alpha"
        projectColor="#6366F1"
      />
    );
    const topBorder = container.querySelector('.h-1');
    expect(topBorder).toBeInTheDocument();
  });

  it('formats decimal scores to integers', () => {
    const ranking = { ...mockRanking, score: 87.6 };
    render(
      <MyRankingCard
        ranking={ranking}
        projectName="Proyecto Alpha"
        projectColor="#6366F1"
      />
    );
    expect(screen.getByText('88%')).toBeInTheDocument();
  });

  it('renders Score label', () => {
    render(
      <MyRankingCard
        ranking={mockRanking}
        projectName="Proyecto Alpha"
        projectColor="#6366F1"
      />
    );
    expect(screen.getByText('Score')).toBeInTheDocument();
  });

  it('applies correct color to positive change', () => {
    const { container } = render(
      <MyRankingCard
        ranking={mockRanking} // +2 change
        projectName="Proyecto Alpha"
        projectColor="#6366F1"
      />
    );
    const changeIndicator = container.querySelector('.text-success');
    expect(changeIndicator).toBeInTheDocument();
  });

  it('applies correct color to negative change', () => {
    const ranking = { ...mockRanking, ranking_position: 5, previous_position: 2 };
    const { container } = render(
      <MyRankingCard
        ranking={ranking}
        projectName="Proyecto Alpha"
        projectColor="#6366F1"
      />
    );
    const changeIndicator = container.querySelector('.text-destructive');
    expect(changeIndicator).toBeInTheDocument();
  });

  it('handles unknown role name gracefully', () => {
    const ranking = { ...mockRanking, role_name: 'unknown_role' };
    render(
      <MyRankingCard
        ranking={ranking}
        projectName="Proyecto Alpha"
        projectColor="#6366F1"
      />
    );
    expect(screen.getByText('unknown_role')).toBeInTheDocument();
  });

  it('renders Trophy icon for unknown roles', () => {
    const ranking = { ...mockRanking, role_name: 'unknown_role' };
    const { container } = render(
      <MyRankingCard
        ranking={ranking}
        projectName="Proyecto Alpha"
        projectColor="#6366F1"
      />
    );
    const trophyIcon = container.querySelector('.lucide-trophy');
    expect(trophyIcon).toBeInTheDocument();
  });
});
