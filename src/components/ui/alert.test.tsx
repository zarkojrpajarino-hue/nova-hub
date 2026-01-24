import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Alert, AlertTitle, AlertDescription } from './alert';

describe('Alert Components', () => {
  describe('Alert', () => {
    it('renders alert with children', () => {
      render(<Alert data-testid="alert">Alert Content</Alert>);
      expect(screen.getByTestId('alert')).toBeInTheDocument();
      expect(screen.getByText('Alert Content')).toBeInTheDocument();
    });

    it('has role="alert" attribute', () => {
      render(<Alert data-testid="alert">Alert</Alert>);
      const alert = screen.getByTestId('alert');
      expect(alert).toHaveAttribute('role', 'alert');
    });

    it('applies default variant', () => {
      const { container } = render(<Alert>Default Alert</Alert>);
      const alert = container.firstChild as HTMLElement;
      expect(alert).toHaveClass('bg-background');
      expect(alert).toHaveClass('text-foreground');
    });

    it('applies destructive variant', () => {
      const { container } = render(<Alert variant="destructive">Destructive Alert</Alert>);
      const alert = container.firstChild as HTMLElement;
      expect(alert).toHaveClass('border-destructive/50');
      expect(alert).toHaveClass('text-destructive');
    });

    it('applies custom className', () => {
      render(<Alert className="custom-alert" data-testid="alert">Alert</Alert>);
      const alert = screen.getByTestId('alert');
      expect(alert).toHaveClass('custom-alert');
    });

    it('applies base classes', () => {
      const { container } = render(<Alert>Alert</Alert>);
      const alert = container.firstChild as HTMLElement;
      expect(alert).toHaveClass('relative');
      expect(alert).toHaveClass('w-full');
      expect(alert).toHaveClass('rounded-lg');
      expect(alert).toHaveClass('border');
      expect(alert).toHaveClass('p-4');
    });

    it('forwards ref', () => {
      const ref = { current: null };
      render(<Alert ref={ref}>Alert</Alert>);
      expect(ref.current).not.toBeNull();
    });

    it('forwards props', () => {
      render(
        <Alert data-testid="alert" aria-label="Custom Alert" id="alert-1">
          Alert
        </Alert>
      );
      const alert = screen.getByTestId('alert');
      expect(alert).toHaveAttribute('aria-label', 'Custom Alert');
      expect(alert).toHaveAttribute('id', 'alert-1');
    });
  });

  describe('AlertTitle', () => {
    it('renders title text', () => {
      render(<AlertTitle>Alert Title</AlertTitle>);
      expect(screen.getByText('Alert Title')).toBeInTheDocument();
    });

    it('renders as h5 element', () => {
      const { container } = render(<AlertTitle>Title</AlertTitle>);
      const title = container.querySelector('h5');
      expect(title).toBeInTheDocument();
    });

    it('applies base classes', () => {
      const { container } = render(<AlertTitle>Title</AlertTitle>);
      const title = container.firstChild as HTMLElement;
      expect(title).toHaveClass('mb-1');
      expect(title).toHaveClass('font-medium');
      expect(title).toHaveClass('leading-none');
      expect(title).toHaveClass('tracking-tight');
    });

    it('applies custom className', () => {
      const { container } = render(<AlertTitle className="custom-title">Title</AlertTitle>);
      const title = container.firstChild as HTMLElement;
      expect(title).toHaveClass('custom-title');
    });

    it('forwards ref', () => {
      const ref = { current: null };
      render(<AlertTitle ref={ref}>Title</AlertTitle>);
      expect(ref.current).not.toBeNull();
    });
  });

  describe('AlertDescription', () => {
    it('renders description text', () => {
      render(<AlertDescription>Alert Description</AlertDescription>);
      expect(screen.getByText('Alert Description')).toBeInTheDocument();
    });

    it('renders as div element', () => {
      const { container } = render(<AlertDescription>Description</AlertDescription>);
      const description = container.querySelector('div');
      expect(description).toBeInTheDocument();
    });

    it('applies base classes', () => {
      const { container } = render(<AlertDescription>Description</AlertDescription>);
      const description = container.firstChild as HTMLElement;
      expect(description).toHaveClass('text-sm');
    });

    it('applies custom className', () => {
      const { container } = render(
        <AlertDescription className="custom-description">Description</AlertDescription>
      );
      const description = container.firstChild as HTMLElement;
      expect(description).toHaveClass('custom-description');
    });

    it('forwards ref', () => {
      const ref = { current: null };
      render(<AlertDescription ref={ref}>Description</AlertDescription>);
      expect(ref.current).not.toBeNull();
    });

    it('renders complex content', () => {
      render(
        <AlertDescription>
          <p>Paragraph 1</p>
          <p>Paragraph 2</p>
        </AlertDescription>
      );
      expect(screen.getByText('Paragraph 1')).toBeInTheDocument();
      expect(screen.getByText('Paragraph 2')).toBeInTheDocument();
    });
  });

  describe('Alert composition', () => {
    it('renders complete alert with title and description', () => {
      render(
        <Alert data-testid="complete-alert">
          <AlertTitle>Important Alert</AlertTitle>
          <AlertDescription>This is an important message.</AlertDescription>
        </Alert>
      );

      expect(screen.getByTestId('complete-alert')).toBeInTheDocument();
      expect(screen.getByText('Important Alert')).toBeInTheDocument();
      expect(screen.getByText('This is an important message.')).toBeInTheDocument();
    });

    it('renders destructive alert with title and description', () => {
      render(
        <Alert variant="destructive" data-testid="destructive-alert">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Something went wrong.</AlertDescription>
        </Alert>
      );

      expect(screen.getByTestId('destructive-alert')).toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
    });

    it('renders alert with icon and content', () => {
      render(
        <Alert>
          <svg data-testid="alert-icon">
            <title>Icon</title>
          </svg>
          <AlertTitle>Title with Icon</AlertTitle>
          <AlertDescription>Description with icon</AlertDescription>
        </Alert>
      );

      expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
      expect(screen.getByText('Title with Icon')).toBeInTheDocument();
      expect(screen.getByText('Description with icon')).toBeInTheDocument();
    });
  });
});
