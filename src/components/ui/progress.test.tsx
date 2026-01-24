import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Progress } from './progress';

describe('Progress', () => {
  it('renders progress bar', () => {
    render(<Progress data-testid="progress" value={50} />);
    expect(screen.getByTestId('progress')).toBeInTheDocument();
  });

  it('applies base classes', () => {
    render(<Progress data-testid="progress" value={0} />);
    const progress = screen.getByTestId('progress');
    expect(progress).toHaveClass('relative');
    expect(progress).toHaveClass('h-4');
    expect(progress).toHaveClass('w-full');
    expect(progress).toHaveClass('overflow-hidden');
    expect(progress).toHaveClass('rounded-full');
    expect(progress).toHaveClass('bg-secondary');
  });

  it('applies custom className', () => {
    render(<Progress className="custom-progress" data-testid="progress" value={50} />);
    const progress = screen.getByTestId('progress');
    expect(progress).toHaveClass('custom-progress');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(<Progress ref={ref} value={50} />);
    expect(ref.current).not.toBeNull();
  });

  it('renders with 0% value', () => {
    const { container } = render(<Progress value={0} data-testid="progress" />);
    const indicator = container.querySelector('[class*="bg-primary"]');
    expect(indicator).toHaveStyle({ transform: 'translateX(-100%)' });
  });

  it('renders with 50% value', () => {
    const { container } = render(<Progress value={50} data-testid="progress" />);
    const indicator = container.querySelector('[class*="bg-primary"]');
    expect(indicator).toHaveStyle({ transform: 'translateX(-50%)' });
  });

  it('renders with 100% value', () => {
    const { container } = render(<Progress value={100} data-testid="progress" />);
    const indicator = container.querySelector('[class*="bg-primary"]');
    expect(indicator).toHaveStyle({ transform: 'translateX(-0%)' });
  });

  it('handles undefined value as 0', () => {
    const { container } = render(<Progress data-testid="progress" />);
    const indicator = container.querySelector('[class*="bg-primary"]');
    expect(indicator).toHaveStyle({ transform: 'translateX(-100%)' });
  });

  it('has correct aria attributes', () => {
    render(<Progress value={50} data-testid="progress" />);
    const progress = screen.getByTestId('progress');
    expect(progress).toHaveAttribute('role', 'progressbar');
    expect(progress).toHaveAttribute('aria-valuemax', '100');
  });

  it('forwards additional props', () => {
    render(<Progress value={50} id="progress-1" aria-label="Loading" data-testid="progress" />);
    const progress = screen.getByTestId('progress');
    expect(progress).toHaveAttribute('id', 'progress-1');
    expect(progress).toHaveAttribute('aria-label', 'Loading');
  });
});
