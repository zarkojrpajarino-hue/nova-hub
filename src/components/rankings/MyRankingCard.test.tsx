import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyRankingCard } from './MyRankingCard';

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

const mockRanking = {
  id: 'rank1',
  role_name: 'comercial',
  ranking_position: 1,
  score: 95,
  previous_position: 2,
};

describe('MyRankingCard', () => {
  it('renders role name', () => {
    render(<MyRankingCard ranking={mockRanking} projectName="Test Project" projectColor="#6366F1" />);
    expect(screen.getByText('Comercial')).toBeInTheDocument();
  });

  it('renders project name', () => {
    render(<MyRankingCard ranking={mockRanking} projectName="Test Project" projectColor="#6366F1" />);
    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  it('displays score', () => {
    render(<MyRankingCard ranking={mockRanking} projectName="Test Project" projectColor="#6366F1" />);
    expect(screen.getByText('95%')).toBeInTheDocument();
  });

  it('shows Score label', () => {
    render(<MyRankingCard ranking={mockRanking} projectName="Test Project" projectColor="#6366F1" />);
    expect(screen.getByText('Score')).toBeInTheDocument();
  });

  it('shows trending up icon when position improved', () => {
    const { container } = render(<MyRankingCard ranking={mockRanking} projectName="Test Project" projectColor="#6366F1" />);
    const icon = container.querySelector('.lucide-trending-up');
    expect(icon).toBeInTheDocument();
  });

  it('shows trending down icon when position worsened', () => {
    const worseRanking = { ...mockRanking, ranking_position: 3, previous_position: 1 };
    const { container } = render(<MyRankingCard ranking={worseRanking} projectName="Test Project" projectColor="#6366F1" />);
    const icon = container.querySelector('.lucide-trending-down');
    expect(icon).toBeInTheDocument();
  });

  it('renders Crown icon for first place', () => {
    const { container } = render(<MyRankingCard ranking={mockRanking} projectName="Test Project" projectColor="#6366F1" />);
    const icon = container.querySelector('.lucide-crown');
    expect(icon).toBeInTheDocument();
  });

  it('renders Medal icon for second place', () => {
    const secondPlace = { ...mockRanking, ranking_position: 2, previous_position: null };
    const { container } = render(<MyRankingCard ranking={secondPlace} projectName="Test Project" projectColor="#6366F1" />);
    const icon = container.querySelector('.lucide-medal');
    expect(icon).toBeInTheDocument();
  });

  it('renders Award icon for third place', () => {
    const thirdPlace = { ...mockRanking, ranking_position: 3, previous_position: null };
    const { container } = render(<MyRankingCard ranking={thirdPlace} projectName="Test Project" projectColor="#6366F1" />);
    const icon = container.querySelector('.lucide-award');
    expect(icon).toBeInTheDocument();
  });
});
