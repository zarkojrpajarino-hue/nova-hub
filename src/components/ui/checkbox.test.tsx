import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Checkbox } from './checkbox';

describe('Checkbox', () => {
  it('renders checkbox', () => {
    render(<Checkbox data-testid="checkbox" />);
    expect(screen.getByTestId('checkbox')).toBeInTheDocument();
  });

  it('handles checked state', async () => {
    const user = userEvent.setup();
    const handleCheckedChange = vi.fn();

    render(<Checkbox onCheckedChange={handleCheckedChange} data-testid="checkbox" />);

    const checkbox = screen.getByTestId('checkbox');
    await user.click(checkbox);

    expect(handleCheckedChange).toHaveBeenCalledWith(true);
  });

  it('handles unchecked state', async () => {
    const user = userEvent.setup();
    const handleCheckedChange = vi.fn();

    render(<Checkbox checked onCheckedChange={handleCheckedChange} data-testid="checkbox" />);

    const checkbox = screen.getByTestId('checkbox');
    await user.click(checkbox);

    expect(handleCheckedChange).toHaveBeenCalledWith(false);
  });

  it('supports controlled checked state', () => {
    const { rerender } = render(<Checkbox checked={false} data-testid="checkbox" />);

    let checkbox = screen.getByTestId('checkbox');
    expect(checkbox).toHaveAttribute('data-state', 'unchecked');

    rerender(<Checkbox checked={true} data-testid="checkbox" />);

    checkbox = screen.getByTestId('checkbox');
    expect(checkbox).toHaveAttribute('data-state', 'checked');
  });

  it('applies custom className', () => {
    render(<Checkbox className="custom-checkbox" data-testid="checkbox" />);
    const checkbox = screen.getByTestId('checkbox');
    expect(checkbox).toHaveClass('custom-checkbox');
  });

  it('applies base classes', () => {
    render(<Checkbox data-testid="checkbox" />);
    const checkbox = screen.getByTestId('checkbox');
    expect(checkbox).toHaveClass('h-4');
    expect(checkbox).toHaveClass('w-4');
    expect(checkbox).toHaveClass('rounded-sm');
    expect(checkbox).toHaveClass('border');
  });

  it('supports disabled state', () => {
    render(<Checkbox disabled data-testid="checkbox" />);
    const checkbox = screen.getByTestId('checkbox');
    expect(checkbox).toBeDisabled();
  });

  it('does not trigger onChange when disabled', async () => {
    const user = userEvent.setup();
    const handleCheckedChange = vi.fn();

    render(<Checkbox disabled onCheckedChange={handleCheckedChange} data-testid="checkbox" />);

    const checkbox = screen.getByTestId('checkbox');
    await user.click(checkbox);

    expect(handleCheckedChange).not.toHaveBeenCalled();
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(<Checkbox ref={ref} />);
    expect(ref.current).not.toBeNull();
  });

  it('supports defaultChecked prop', () => {
    render(<Checkbox defaultChecked data-testid="checkbox" />);
    const checkbox = screen.getByTestId('checkbox');
    expect(checkbox).toHaveAttribute('data-state', 'checked');
  });

  it('renders with aria-label', () => {
    render(<Checkbox aria-label="Accept terms" data-testid="checkbox" />);
    const checkbox = screen.getByTestId('checkbox');
    expect(checkbox).toHaveAttribute('aria-label', 'Accept terms');
  });
});
