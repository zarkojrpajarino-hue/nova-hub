import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './button';

describe('Button', () => {
  describe('Basic rendering', () => {
    it('renders button with text', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('renders as button element by default', () => {
      const { container } = render(<Button>Button</Button>);
      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
    });

    it('applies base classes', () => {
      render(<Button data-testid="button">Button</Button>);
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('inline-flex');
      expect(button).toHaveClass('items-center');
      expect(button).toHaveClass('justify-center');
      expect(button).toHaveClass('rounded-md');
    });
  });

  describe('Variants', () => {
    it('applies default variant', () => {
      render(<Button data-testid="button">Default</Button>);
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('bg-primary');
      expect(button).toHaveClass('text-primary-foreground');
    });

    it('applies destructive variant', () => {
      render(
        <Button variant="destructive" data-testid="button">
          Destructive
        </Button>
      );
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('bg-destructive');
      expect(button).toHaveClass('text-destructive-foreground');
    });

    it('applies outline variant', () => {
      render(
        <Button variant="outline" data-testid="button">
          Outline
        </Button>
      );
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('border');
      expect(button).toHaveClass('border-input');
      expect(button).toHaveClass('bg-background');
    });

    it('applies secondary variant', () => {
      render(
        <Button variant="secondary" data-testid="button">
          Secondary
        </Button>
      );
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('bg-secondary');
      expect(button).toHaveClass('text-secondary-foreground');
    });

    it('applies ghost variant', () => {
      render(
        <Button variant="ghost" data-testid="button">
          Ghost
        </Button>
      );
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('hover:bg-accent');
    });

    it('applies link variant', () => {
      render(
        <Button variant="link" data-testid="button">
          Link
        </Button>
      );
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('text-primary');
      expect(button).toHaveClass('underline-offset-4');
    });
  });

  describe('Sizes', () => {
    it('applies default size', () => {
      render(<Button data-testid="button">Default Size</Button>);
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('h-10');
      expect(button).toHaveClass('px-4');
    });

    it('applies small size', () => {
      render(
        <Button size="sm" data-testid="button">
          Small
        </Button>
      );
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('h-9');
      expect(button).toHaveClass('px-3');
    });

    it('applies large size', () => {
      render(
        <Button size="lg" data-testid="button">
          Large
        </Button>
      );
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('h-11');
      expect(button).toHaveClass('px-8');
    });

    it('applies icon size', () => {
      render(
        <Button size="icon" data-testid="button">
          X
        </Button>
      );
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('h-10');
      expect(button).toHaveClass('w-10');
    });
  });

  describe('Interaction', () => {
    it('calls onClick handler', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <Button onClick={handleClick} data-testid="button">
          Click
        </Button>
      );

      const button = screen.getByTestId('button');
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <Button onClick={handleClick} disabled data-testid="button">
          Disabled
        </Button>
      );

      const button = screen.getByTestId('button');
      await user.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('supports disabled state', () => {
      render(
        <Button disabled data-testid="button">
          Disabled
        </Button>
      );
      const button = screen.getByTestId('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Props forwarding', () => {
    it('applies custom className', () => {
      render(
        <Button className="custom-class" data-testid="button">
          Custom
        </Button>
      );
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('custom-class');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(<Button ref={ref}>Button</Button>);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });

    it('forwards native button props', () => {
      render(
        <Button type="submit" aria-label="Submit form" id="submit-btn" data-testid="button">
          Submit
        </Button>
      );
      const button = screen.getByTestId('button');
      expect(button).toHaveAttribute('type', 'submit');
      expect(button).toHaveAttribute('aria-label', 'Submit form');
      expect(button).toHaveAttribute('id', 'submit-btn');
    });
  });

  describe('asChild prop', () => {
    it('renders as child component when asChild is true', () => {
      render(
        <Button asChild>
          <a href="/link">Link Button</a>
        </Button>
      );

      const link = screen.getByText('Link Button');
      expect(link.tagName).toBe('A');
      expect(link).toHaveAttribute('href', '/link');
    });

    it('applies button styles to child component', () => {
      render(
        <Button asChild variant="destructive" size="lg">
          <a href="/link" data-testid="link-button">
            Link
          </a>
        </Button>
      );

      const link = screen.getByTestId('link-button');
      expect(link).toHaveClass('bg-destructive');
      expect(link).toHaveClass('h-11');
    });
  });

  describe('Content variations', () => {
    it('renders with icon', () => {
      render(
        <Button data-testid="button">
          <svg data-testid="icon">
            <title>Icon</title>
          </svg>
          With Icon
        </Button>
      );

      expect(screen.getByTestId('icon')).toBeInTheDocument();
      expect(screen.getByText('With Icon')).toBeInTheDocument();
    });

    it('renders icon-only button', () => {
      render(
        <Button size="icon" data-testid="button">
          <svg data-testid="icon">
            <title>Close</title>
          </svg>
        </Button>
      );

      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });
  });

  describe('Variant and size combinations', () => {
    it('combines destructive variant with small size', () => {
      render(
        <Button variant="destructive" size="sm" data-testid="button">
          Small Destructive
        </Button>
      );

      const button = screen.getByTestId('button');
      expect(button).toHaveClass('bg-destructive');
      expect(button).toHaveClass('h-9');
    });

    it('combines outline variant with large size', () => {
      render(
        <Button variant="outline" size="lg" data-testid="button">
          Large Outline
        </Button>
      );

      const button = screen.getByTestId('button');
      expect(button).toHaveClass('border');
      expect(button).toHaveClass('h-11');
    });
  });
});
