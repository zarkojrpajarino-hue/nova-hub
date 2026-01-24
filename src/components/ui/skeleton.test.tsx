import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Skeleton } from './skeleton';

describe('Skeleton', () => {
  it('renders skeleton', () => {
    render(<Skeleton data-testid="skeleton" />);
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  it('applies base classes', () => {
    render(<Skeleton data-testid="skeleton" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('animate-pulse');
    expect(skeleton).toHaveClass('rounded-md');
    expect(skeleton).toHaveClass('bg-muted');
  });

  it('applies custom className', () => {
    render(<Skeleton className="custom-skeleton" data-testid="skeleton" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('custom-skeleton');
  });

  it('renders as div element', () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.querySelector('div');
    expect(skeleton).toBeInTheDocument();
  });

  it('forwards HTML div props', () => {
    render(<Skeleton id="skeleton-1" aria-label="Loading" data-testid="skeleton" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveAttribute('id', 'skeleton-1');
    expect(skeleton).toHaveAttribute('aria-label', 'Loading');
  });

  it('can have custom dimensions', () => {
    render(<Skeleton className="h-4 w-32" data-testid="skeleton" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('h-4');
    expect(skeleton).toHaveClass('w-32');
  });

  it('can be used for circular skeletons', () => {
    render(<Skeleton className="h-12 w-12 rounded-full" data-testid="skeleton" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('rounded-full');
  });

  it('renders with children', () => {
    render(
      <Skeleton data-testid="skeleton">
        <span>Loading content</span>
      </Skeleton>
    );
    expect(screen.getByText('Loading content')).toBeInTheDocument();
  });
});
