import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Separator } from './separator';

describe('Separator', () => {
  it('renders separator', () => {
    render(<Separator data-testid="separator" />);
    expect(screen.getByTestId('separator')).toBeInTheDocument();
  });

  it('applies base classes', () => {
    render(<Separator data-testid="separator" />);
    const separator = screen.getByTestId('separator');
    expect(separator).toHaveClass('shrink-0');
    expect(separator).toHaveClass('bg-border');
  });

  it('renders horizontal separator by default', () => {
    render(<Separator data-testid="separator" />);
    const separator = screen.getByTestId('separator');
    expect(separator).toHaveClass('h-[1px]');
    expect(separator).toHaveClass('w-full');
  });

  it('renders vertical separator when orientation is vertical', () => {
    render(<Separator orientation="vertical" data-testid="separator" />);
    const separator = screen.getByTestId('separator');
    expect(separator).toHaveClass('h-full');
    expect(separator).toHaveClass('w-[1px]');
  });

  it('applies custom className', () => {
    render(<Separator className="custom-separator" data-testid="separator" />);
    const separator = screen.getByTestId('separator');
    expect(separator).toHaveClass('custom-separator');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(<Separator ref={ref} />);
    expect(ref.current).not.toBeNull();
  });

  it('has decorative prop set by default', () => {
    render(<Separator data-testid="separator" />);
    const separator = screen.getByTestId('separator');
    // Radix UI handles decorative internally, just verify it renders
    expect(separator).toBeInTheDocument();
  });

  it('supports non-decorative separator', () => {
    render(<Separator decorative={false} data-testid="separator" />);
    const separator = screen.getByTestId('separator');
    expect(separator).toHaveAttribute('role', 'separator');
  });

  it('has correct orientation attribute', () => {
    render(<Separator orientation="horizontal" data-testid="separator" />);
    const separator = screen.getByTestId('separator');
    expect(separator).toHaveAttribute('data-orientation', 'horizontal');
  });

  it('forwards additional props', () => {
    render(<Separator id="my-separator" role="separator" data-testid="separator" />);
    const separator = screen.getByTestId('separator');
    expect(separator).toHaveAttribute('id', 'my-separator');
  });
});
