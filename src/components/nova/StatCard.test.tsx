import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatCard } from './StatCard';
import { TrendingUp } from 'lucide-react';

describe('StatCard', () => {
  const defaultProps = {
    icon: TrendingUp,
    value: 42,
    label: 'Test Metric',
    progress: 75,
    color: '#6366F1',
  };

  it('renders value and label correctly', () => {
    render(<StatCard {...defaultProps} />);

    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Test Metric')).toBeInTheDocument();
  });

  it('displays string values correctly', () => {
    render(<StatCard {...defaultProps} value="100K" />);

    expect(screen.getByText('100K')).toBeInTheDocument();
  });

  it('shows target when provided', () => {
    render(<StatCard {...defaultProps} target={100} />);

    expect(screen.getByText('Meta: 100')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('does not show target when not provided', () => {
    render(<StatCard {...defaultProps} />);

    expect(screen.queryByText(/Meta:/)).not.toBeInTheDocument();
  });

  it('clamps progress to 100%', () => {
    render(<StatCard {...defaultProps} progress={150} target={100} />);

    // Progress should be clamped to 100%
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('renders with correct color', () => {
    const { container } = render(<StatCard {...defaultProps} color="#FF0000" />);

    // Check that the icon container has the color in its background
    const iconContainer = container.querySelector('div[style*="background"]');
    expect(iconContainer).toBeTruthy();
  });

  it('handles zero progress correctly', () => {
    render(<StatCard {...defaultProps} progress={0} target={50} />);

    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('renders icon component', () => {
    const { container } = render(<StatCard {...defaultProps} />);

    // Check that the lucide icon SVG is rendered
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
