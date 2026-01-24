import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Switch } from './switch';

describe('Switch', () => {
  it('renders switch', () => {
    render(<Switch data-testid="switch" />);
    expect(screen.getByTestId('switch')).toBeInTheDocument();
  });

  it('handles checked state', async () => {
    const user = userEvent.setup();
    const handleCheckedChange = vi.fn();

    render(<Switch onCheckedChange={handleCheckedChange} data-testid="switch" />);

    const switchElement = screen.getByTestId('switch');
    await user.click(switchElement);

    expect(handleCheckedChange).toHaveBeenCalledWith(true);
  });

  it('handles unchecked state', async () => {
    const user = userEvent.setup();
    const handleCheckedChange = vi.fn();

    render(<Switch checked onCheckedChange={handleCheckedChange} data-testid="switch" />);

    const switchElement = screen.getByTestId('switch');
    await user.click(switchElement);

    expect(handleCheckedChange).toHaveBeenCalledWith(false);
  });

  it('supports controlled checked state', () => {
    const { rerender } = render(<Switch checked={false} data-testid="switch" />);

    let switchElement = screen.getByTestId('switch');
    expect(switchElement).toHaveAttribute('data-state', 'unchecked');

    rerender(<Switch checked={true} data-testid="switch" />);

    switchElement = screen.getByTestId('switch');
    expect(switchElement).toHaveAttribute('data-state', 'checked');
  });

  it('applies custom className', () => {
    render(<Switch className="custom-switch" data-testid="switch" />);
    const switchElement = screen.getByTestId('switch');
    expect(switchElement).toHaveClass('custom-switch');
  });

  it('applies base classes', () => {
    render(<Switch data-testid="switch" />);
    const switchElement = screen.getByTestId('switch');
    expect(switchElement).toHaveClass('inline-flex');
    expect(switchElement).toHaveClass('h-6');
    expect(switchElement).toHaveClass('w-11');
    expect(switchElement).toHaveClass('rounded-full');
  });

  it('supports disabled state', () => {
    render(<Switch disabled data-testid="switch" />);
    const switchElement = screen.getByTestId('switch');
    expect(switchElement).toBeDisabled();
  });

  it('does not trigger onChange when disabled', async () => {
    const user = userEvent.setup();
    const handleCheckedChange = vi.fn();

    render(<Switch disabled onCheckedChange={handleCheckedChange} data-testid="switch" />);

    const switchElement = screen.getByTestId('switch');
    await user.click(switchElement);

    expect(handleCheckedChange).not.toHaveBeenCalled();
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(<Switch ref={ref} />);
    expect(ref.current).not.toBeNull();
  });

  it('supports defaultChecked prop', () => {
    render(<Switch defaultChecked data-testid="switch" />);
    const switchElement = screen.getByTestId('switch');
    expect(switchElement).toHaveAttribute('data-state', 'checked');
  });

  it('renders with aria-label', () => {
    render(<Switch aria-label="Enable notifications" data-testid="switch" />);
    const switchElement = screen.getByTestId('switch');
    expect(switchElement).toHaveAttribute('aria-label', 'Enable notifications');
  });

  it('has correct role attribute', () => {
    render(<Switch data-testid="switch" />);
    const switchElement = screen.getByTestId('switch');
    expect(switchElement).toHaveAttribute('role', 'switch');
  });

  it('toggles between states on multiple clicks', async () => {
    const user = userEvent.setup();
    const handleCheckedChange = vi.fn();

    render(<Switch onCheckedChange={handleCheckedChange} data-testid="switch" />);

    const switchElement = screen.getByTestId('switch');

    await user.click(switchElement);
    expect(handleCheckedChange).toHaveBeenNthCalledWith(1, true);

    await user.click(switchElement);
    expect(handleCheckedChange).toHaveBeenNthCalledWith(2, false);
  });
});
