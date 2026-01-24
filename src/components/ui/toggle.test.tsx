import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toggle } from './toggle';

describe('Toggle', () => {
  describe('Basic rendering', () => {
    it('renders toggle button', () => {
      render(<Toggle>Toggle</Toggle>);
      expect(screen.getByText('Toggle')).toBeInTheDocument();
    });

    it('applies base classes', () => {
      render(<Toggle data-testid="toggle">Toggle</Toggle>);
      const toggle = screen.getByTestId('toggle');
      expect(toggle).toHaveClass('inline-flex');
      expect(toggle).toHaveClass('items-center');
      expect(toggle).toHaveClass('justify-center');
      expect(toggle).toHaveClass('rounded-md');
    });

    it('renders as button element', () => {
      const { container } = render(<Toggle>Toggle</Toggle>);
      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('applies default variant', () => {
      render(<Toggle data-testid="toggle">Default</Toggle>);
      const toggle = screen.getByTestId('toggle');
      expect(toggle).toHaveClass('bg-transparent');
    });

    it('applies outline variant', () => {
      render(
        <Toggle variant="outline" data-testid="toggle">
          Outline
        </Toggle>
      );
      const toggle = screen.getByTestId('toggle');
      expect(toggle).toHaveClass('border');
      expect(toggle).toHaveClass('border-input');
      expect(toggle).toHaveClass('bg-transparent');
    });
  });

  describe('Sizes', () => {
    it('applies default size', () => {
      render(<Toggle data-testid="toggle">Default</Toggle>);
      const toggle = screen.getByTestId('toggle');
      expect(toggle).toHaveClass('h-10');
      expect(toggle).toHaveClass('px-3');
    });

    it('applies small size', () => {
      render(
        <Toggle size="sm" data-testid="toggle">
          Small
        </Toggle>
      );
      const toggle = screen.getByTestId('toggle');
      expect(toggle).toHaveClass('h-9');
      expect(toggle).toHaveClass('px-2.5');
    });

    it('applies large size', () => {
      render(
        <Toggle size="lg" data-testid="toggle">
          Large
        </Toggle>
      );
      const toggle = screen.getByTestId('toggle');
      expect(toggle).toHaveClass('h-11');
      expect(toggle).toHaveClass('px-5');
    });
  });

  describe('Interaction', () => {
    it('toggles on click', async () => {
      const user = userEvent.setup();
      const handlePressedChange = vi.fn();

      render(
        <Toggle onPressedChange={handlePressedChange} data-testid="toggle">
          Toggle
        </Toggle>
      );

      const toggle = screen.getByTestId('toggle');
      await user.click(toggle);

      expect(handlePressedChange).toHaveBeenCalledWith(true);
    });

    it('supports pressed state', () => {
      render(
        <Toggle pressed data-testid="toggle">
          Pressed
        </Toggle>
      );
      const toggle = screen.getByTestId('toggle');
      expect(toggle).toHaveAttribute('data-state', 'on');
    });

    it('supports unpressed state', () => {
      render(
        <Toggle pressed={false} data-testid="toggle">
          Unpressed
        </Toggle>
      );
      const toggle = screen.getByTestId('toggle');
      expect(toggle).toHaveAttribute('data-state', 'off');
    });

    it('supports disabled state', () => {
      render(
        <Toggle disabled data-testid="toggle">
          Disabled
        </Toggle>
      );
      const toggle = screen.getByTestId('toggle');
      expect(toggle).toBeDisabled();
    });

    it('does not toggle when disabled', async () => {
      const user = userEvent.setup();
      const handlePressedChange = vi.fn();

      render(
        <Toggle disabled onPressedChange={handlePressedChange} data-testid="toggle">
          Disabled
        </Toggle>
      );

      const toggle = screen.getByTestId('toggle');
      await user.click(toggle);

      expect(handlePressedChange).not.toHaveBeenCalled();
    });
  });

  describe('Props forwarding', () => {
    it('applies custom className', () => {
      render(
        <Toggle className="custom-toggle" data-testid="toggle">
          Custom
        </Toggle>
      );
      const toggle = screen.getByTestId('toggle');
      expect(toggle).toHaveClass('custom-toggle');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(<Toggle ref={ref}>Toggle</Toggle>);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });

    it('forwards native button props', () => {
      render(
        <Toggle aria-label="Toggle setting" id="toggle-1" data-testid="toggle">
          Toggle
        </Toggle>
      );
      const toggle = screen.getByTestId('toggle');
      expect(toggle).toHaveAttribute('aria-label', 'Toggle setting');
      expect(toggle).toHaveAttribute('id', 'toggle-1');
    });
  });

  describe('Content variations', () => {
    it('renders with icon', () => {
      render(
        <Toggle data-testid="toggle">
          <svg data-testid="icon">
            <title>Icon</title>
          </svg>
          With Icon
        </Toggle>
      );

      expect(screen.getByTestId('icon')).toBeInTheDocument();
      expect(screen.getByText('With Icon')).toBeInTheDocument();
    });

    it('renders icon-only toggle', () => {
      render(
        <Toggle data-testid="toggle">
          <svg data-testid="icon">
            <title>Star</title>
          </svg>
        </Toggle>
      );

      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });
  });

  describe('Variant and size combinations', () => {
    it('combines outline variant with small size', () => {
      render(
        <Toggle variant="outline" size="sm" data-testid="toggle">
          Small Outline
        </Toggle>
      );

      const toggle = screen.getByTestId('toggle');
      expect(toggle).toHaveClass('border');
      expect(toggle).toHaveClass('h-9');
    });

    it('combines default variant with large size', () => {
      render(
        <Toggle variant="default" size="lg" data-testid="toggle">
          Large Default
        </Toggle>
      );

      const toggle = screen.getByTestId('toggle');
      expect(toggle).toHaveClass('bg-transparent');
      expect(toggle).toHaveClass('h-11');
    });
  });
});
