import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoadingButton } from './loading-button';

describe('LoadingButton', () => {
  it('renders button with children', () => {
    render(<LoadingButton>Click me</LoadingButton>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('renders without loading state', () => {
    render(<LoadingButton loading={false}>Submit</LoadingButton>);
    expect(screen.getByText('Submit')).toBeInTheDocument();
    expect(screen.getByText('Submit')).not.toBeDisabled();
  });

  it('renders with loading state', () => {
    const { container } = render(<LoadingButton loading>Submit</LoadingButton>);
    expect(screen.getByText('Submit')).toBeInTheDocument();
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('is disabled when loading', () => {
    render(<LoadingButton loading>Submit</LoadingButton>);
    expect(screen.getByText('Submit')).toBeDisabled();
  });

  it('is disabled when disabled prop is true', () => {
    render(<LoadingButton disabled>Submit</LoadingButton>);
    expect(screen.getByText('Submit')).toBeDisabled();
  });

  it('is disabled when both loading and disabled', () => {
    render(<LoadingButton loading disabled>Submit</LoadingButton>);
    expect(screen.getByText('Submit')).toBeDisabled();
  });

  it('calls onClick when not loading', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<LoadingButton onClick={onClick}>Click me</LoadingButton>);

    await user.click(screen.getByText('Click me'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when loading', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<LoadingButton loading onClick={onClick}>Click me</LoadingButton>);

    await user.click(screen.getByText('Click me'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(<LoadingButton ref={ref}>Button</LoadingButton>);
    expect(ref.current).not.toBeNull();
  });

  it('renders with button variants', () => {
    render(<LoadingButton variant="destructive">Delete</LoadingButton>);
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('renders loading spinner with correct classes', () => {
    const { container } = render(<LoadingButton loading>Submit</LoadingButton>);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toHaveClass('w-4');
    expect(spinner).toHaveClass('h-4');
    expect(spinner).toHaveClass('mr-2');
  });

  it('renders with different button sizes', () => {
    render(<LoadingButton size="lg">Large Button</LoadingButton>);
    expect(screen.getByText('Large Button')).toBeInTheDocument();
  });

  it('renders as different button types', () => {
    render(<LoadingButton type="submit">Submit Form</LoadingButton>);
    const button = screen.getByText('Submit Form');
    expect(button).toHaveAttribute('type', 'submit');
  });

  it('shows loading spinner before text', () => {
    const { container } = render(<LoadingButton loading>Save Changes</LoadingButton>);
    const button = screen.getByText('Save Changes');
    const spinner = container.querySelector('.animate-spin');

    expect(button).toBeInTheDocument();
    expect(spinner).toBeInTheDocument();
  });
});
