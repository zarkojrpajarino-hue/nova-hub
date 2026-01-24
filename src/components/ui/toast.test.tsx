import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
} from './toast';

describe('Toast Components', () => {
  describe('ToastProvider', () => {
    it('renders provider', () => {
      const { container } = render(
        <ToastProvider>
          <div>Content</div>
        </ToastProvider>
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders children', () => {
      render(
        <ToastProvider>
          <div>Toast Content</div>
        </ToastProvider>
      );
      expect(screen.getByText('Toast Content')).toBeInTheDocument();
    });
  });

  describe('ToastViewport', () => {
    it('renders viewport', () => {
      const { container } = render(
        <ToastProvider>
          <ToastViewport />
        </ToastProvider>
      );
      expect(container.querySelector('.fixed')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <ToastProvider>
          <ToastViewport className="custom-viewport" />
        </ToastProvider>
      );
      expect(container.querySelector('.custom-viewport')).toBeInTheDocument();
    });

    it('forwards ref', () => {
      const ref = { current: null };
      render(
        <ToastProvider>
          <ToastViewport ref={ref} />
        </ToastProvider>
      );
      expect(ref.current).not.toBeNull();
    });
  });

  describe('Toast', () => {
    it('renders toast with open state', () => {
      const { container } = render(
        <ToastProvider>
          <Toast open>
            <ToastTitle>Title</ToastTitle>
          </Toast>
          <ToastViewport />
        </ToastProvider>
      );
      expect(screen.getByText('Title')).toBeInTheDocument();
    });

    it('applies default variant', () => {
      render(
        <ToastProvider>
          <Toast open variant="default">
            <ToastTitle>Default Toast</ToastTitle>
          </Toast>
          <ToastViewport />
        </ToastProvider>
      );
      expect(screen.getByText('Default Toast')).toBeInTheDocument();
    });

    it('applies destructive variant', () => {
      render(
        <ToastProvider>
          <Toast open variant="destructive">
            <ToastTitle>Error Toast</ToastTitle>
          </Toast>
          <ToastViewport />
        </ToastProvider>
      );
      const title = screen.getByText('Error Toast');
      expect(title).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <ToastProvider>
          <Toast open className="custom-toast">
            <ToastTitle>Custom</ToastTitle>
          </Toast>
          <ToastViewport />
        </ToastProvider>
      );
      expect(container.querySelector('.custom-toast')).toBeInTheDocument();
    });

    it('forwards ref', () => {
      const ref = { current: null };
      render(
        <ToastProvider>
          <Toast open ref={ref}>
            <ToastTitle>Title</ToastTitle>
          </Toast>
          <ToastViewport />
        </ToastProvider>
      );
      expect(ref.current).not.toBeNull();
    });
  });

  describe('ToastTitle', () => {
    it('renders title', () => {
      render(
        <ToastProvider>
          <Toast open>
            <ToastTitle>Toast Title</ToastTitle>
          </Toast>
          <ToastViewport />
        </ToastProvider>
      );
      expect(screen.getByText('Toast Title')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <ToastProvider>
          <Toast open>
            <ToastTitle className="custom-title">Title</ToastTitle>
          </Toast>
          <ToastViewport />
        </ToastProvider>
      );
      const title = screen.getByText('Title');
      expect(title).toHaveClass('custom-title');
    });

    it('forwards ref', () => {
      const ref = { current: null };
      render(
        <ToastProvider>
          <Toast open>
            <ToastTitle ref={ref}>Title</ToastTitle>
          </Toast>
          <ToastViewport />
        </ToastProvider>
      );
      expect(ref.current).not.toBeNull();
    });
  });

  describe('ToastDescription', () => {
    it('renders description', () => {
      render(
        <ToastProvider>
          <Toast open>
            <ToastTitle>Title</ToastTitle>
            <ToastDescription>This is a description</ToastDescription>
          </Toast>
          <ToastViewport />
        </ToastProvider>
      );
      expect(screen.getByText('This is a description')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <ToastProvider>
          <Toast open>
            <ToastTitle>Title</ToastTitle>
            <ToastDescription className="custom-desc">Description</ToastDescription>
          </Toast>
          <ToastViewport />
        </ToastProvider>
      );
      const description = screen.getByText('Description');
      expect(description).toHaveClass('custom-desc');
    });

    it('forwards ref', () => {
      const ref = { current: null };
      render(
        <ToastProvider>
          <Toast open>
            <ToastTitle>Title</ToastTitle>
            <ToastDescription ref={ref}>Description</ToastDescription>
          </Toast>
          <ToastViewport />
        </ToastProvider>
      );
      expect(ref.current).not.toBeNull();
    });
  });

  describe('ToastClose', () => {
    it('renders close button', () => {
      const { container } = render(
        <ToastProvider>
          <Toast open>
            <ToastTitle>Title</ToastTitle>
            <ToastClose />
          </Toast>
          <ToastViewport />
        </ToastProvider>
      );
      expect(container.querySelector('[toast-close]')).toBeInTheDocument();
    });

    it('renders X icon', () => {
      const { container } = render(
        <ToastProvider>
          <Toast open>
            <ToastTitle>Title</ToastTitle>
            <ToastClose />
          </Toast>
          <ToastViewport />
        </ToastProvider>
      );
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <ToastProvider>
          <Toast open>
            <ToastTitle>Title</ToastTitle>
            <ToastClose className="custom-close" />
          </Toast>
          <ToastViewport />
        </ToastProvider>
      );
      expect(container.querySelector('.custom-close')).toBeInTheDocument();
    });

    it('forwards ref', () => {
      const ref = { current: null };
      render(
        <ToastProvider>
          <Toast open>
            <ToastTitle>Title</ToastTitle>
            <ToastClose ref={ref} />
          </Toast>
          <ToastViewport />
        </ToastProvider>
      );
      expect(ref.current).not.toBeNull();
    });
  });

  describe('ToastAction', () => {
    it('renders action button', () => {
      render(
        <ToastProvider>
          <Toast open>
            <ToastTitle>Title</ToastTitle>
            <ToastAction altText="Undo">Undo</ToastAction>
          </Toast>
          <ToastViewport />
        </ToastProvider>
      );
      expect(screen.getByText('Undo')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <ToastProvider>
          <Toast open>
            <ToastTitle>Title</ToastTitle>
            <ToastAction altText="Retry" className="custom-action">
              Retry
            </ToastAction>
          </Toast>
          <ToastViewport />
        </ToastProvider>
      );
      const action = screen.getByText('Retry');
      expect(action).toHaveClass('custom-action');
    });

    it('forwards ref', () => {
      const ref = { current: null };
      render(
        <ToastProvider>
          <Toast open>
            <ToastTitle>Title</ToastTitle>
            <ToastAction altText="Action" ref={ref}>
              Action
            </ToastAction>
          </Toast>
          <ToastViewport />
        </ToastProvider>
      );
      expect(ref.current).not.toBeNull();
    });
  });

  describe('Complete Toast', () => {
    it('renders full toast with all components', () => {
      render(
        <ToastProvider>
          <Toast open>
            <ToastTitle>Success</ToastTitle>
            <ToastDescription>Your changes have been saved.</ToastDescription>
            <ToastAction altText="Undo">Undo</ToastAction>
            <ToastClose />
          </Toast>
          <ToastViewport />
        </ToastProvider>
      );

      expect(screen.getByText('Success')).toBeInTheDocument();
      expect(screen.getByText('Your changes have been saved.')).toBeInTheDocument();
      expect(screen.getByText('Undo')).toBeInTheDocument();
    });

    it('renders destructive toast with action', () => {
      render(
        <ToastProvider>
          <Toast open variant="destructive">
            <ToastTitle>Error</ToastTitle>
            <ToastDescription>Something went wrong.</ToastDescription>
            <ToastAction altText="Try again">Try again</ToastAction>
            <ToastClose />
          </Toast>
          <ToastViewport />
        </ToastProvider>
      );

      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
      expect(screen.getByText('Try again')).toBeInTheDocument();
    });
  });
});
