import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from './alert-dialog';

describe('AlertDialog Components', () => {
  describe('AlertDialog', () => {
    it('renders alert dialog with trigger', () => {
      render(
        <AlertDialog>
          <AlertDialogTrigger>Open</AlertDialogTrigger>
        </AlertDialog>
      );
      expect(screen.getByText('Open')).toBeInTheDocument();
    });

    it('renders with open state', () => {
      render(
        <AlertDialog open>
          <AlertDialogTrigger>Open</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Dialog Title</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      );
      expect(screen.getByText('Dialog Title')).toBeInTheDocument();
    });

    it('opens on trigger click', async () => {
      const user = userEvent.setup();
      render(
        <AlertDialog>
          <AlertDialogTrigger>Open Dialog</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Alert Title</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      );

      const trigger = screen.getByText('Open Dialog');
      await user.click(trigger);

      expect(screen.getByText('Alert Title')).toBeInTheDocument();
    });
  });

  describe('AlertDialogTrigger', () => {
    it('renders trigger button', () => {
      render(
        <AlertDialog>
          <AlertDialogTrigger data-testid="trigger">Click me</AlertDialogTrigger>
        </AlertDialog>
      );
      expect(screen.getByTestId('trigger')).toBeInTheDocument();
    });

    it('renders as custom element', () => {
      render(
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button>Custom Button</button>
          </AlertDialogTrigger>
        </AlertDialog>
      );
      expect(screen.getByText('Custom Button')).toBeInTheDocument();
    });
  });

  describe('AlertDialogContent', () => {
    it('renders content when open', () => {
      render(
        <AlertDialog open>
          <AlertDialogTrigger>Open</AlertDialogTrigger>
          <AlertDialogContent data-testid="content">
            <AlertDialogTitle>Title</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      );
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <AlertDialog open>
          <AlertDialogTrigger>Open</AlertDialogTrigger>
          <AlertDialogContent className="custom-content" data-testid="content">
            <AlertDialogTitle>Title</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      );
      const content = screen.getByTestId('content');
      expect(content).toHaveClass('custom-content');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(
        <AlertDialog open>
          <AlertDialogTrigger>Open</AlertDialogTrigger>
          <AlertDialogContent ref={ref}>
            <AlertDialogTitle>Title</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      );
      expect(ref.current).not.toBeNull();
    });
  });

  describe('AlertDialogHeader', () => {
    it('renders header section', () => {
      render(
        <AlertDialog open>
          <AlertDialogTrigger>Open</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader data-testid="header">
              <AlertDialogTitle>Header Title</AlertDialogTitle>
            </AlertDialogHeader>
          </AlertDialogContent>
        </AlertDialog>
      );
      expect(screen.getByTestId('header')).toBeInTheDocument();
    });

    it('applies base classes', () => {
      render(
        <AlertDialog open>
          <AlertDialogTrigger>Open</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader data-testid="header">
              <AlertDialogTitle>Title</AlertDialogTitle>
            </AlertDialogHeader>
          </AlertDialogContent>
        </AlertDialog>
      );
      const header = screen.getByTestId('header');
      expect(header).toHaveClass('flex');
      expect(header).toHaveClass('flex-col');
    });

    it('applies custom className', () => {
      render(
        <AlertDialog open>
          <AlertDialogTrigger>Open</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader className="custom-header" data-testid="header">
              <AlertDialogTitle>Title</AlertDialogTitle>
            </AlertDialogHeader>
          </AlertDialogContent>
        </AlertDialog>
      );
      expect(screen.getByTestId('header')).toHaveClass('custom-header');
    });
  });

  describe('AlertDialogFooter', () => {
    it('renders footer section', () => {
      render(
        <AlertDialog open>
          <AlertDialogTrigger>Open</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogFooter data-testid="footer">
              <AlertDialogAction>Confirm</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });

    it('applies base classes', () => {
      render(
        <AlertDialog open>
          <AlertDialogTrigger>Open</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogFooter data-testid="footer">
              <AlertDialogAction>Confirm</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
      const footer = screen.getByTestId('footer');
      expect(footer).toHaveClass('flex');
      expect(footer).toHaveClass('flex-col-reverse');
    });

    it('applies custom className', () => {
      render(
        <AlertDialog open>
          <AlertDialogTrigger>Open</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogFooter className="custom-footer" data-testid="footer">
              <AlertDialogAction>Confirm</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
      expect(screen.getByTestId('footer')).toHaveClass('custom-footer');
    });
  });

  describe('AlertDialogTitle', () => {
    it('renders title', () => {
      render(
        <AlertDialog open>
          <AlertDialogTrigger>Open</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Alert Title</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      );
      expect(screen.getByText('Alert Title')).toBeInTheDocument();
    });

    it('applies base classes', () => {
      render(
        <AlertDialog open>
          <AlertDialogTrigger>Open</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle data-testid="title">Title</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      );
      const title = screen.getByTestId('title');
      expect(title).toHaveClass('text-lg');
      expect(title).toHaveClass('font-semibold');
    });

    it('applies custom className', () => {
      render(
        <AlertDialog open>
          <AlertDialogTrigger>Open</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle className="custom-title" data-testid="title">
              Title
            </AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      );
      expect(screen.getByTestId('title')).toHaveClass('custom-title');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(
        <AlertDialog open>
          <AlertDialogTrigger>Open</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle ref={ref}>Title</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      );
      expect(ref.current).not.toBeNull();
    });
  });

  describe('AlertDialogDescription', () => {
    it('renders description', () => {
      render(
        <AlertDialog open>
          <AlertDialogTrigger>Open</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogDescription>This is a description</AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      );
      expect(screen.getByText('This is a description')).toBeInTheDocument();
    });

    it('applies base classes', () => {
      render(
        <AlertDialog open>
          <AlertDialogTrigger>Open</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogDescription data-testid="description">
              Description
            </AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      );
      const description = screen.getByTestId('description');
      expect(description).toHaveClass('text-sm');
      expect(description).toHaveClass('text-muted-foreground');
    });

    it('applies custom className', () => {
      render(
        <AlertDialog open>
          <AlertDialogTrigger>Open</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogDescription className="custom-description" data-testid="description">
              Description
            </AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      );
      expect(screen.getByTestId('description')).toHaveClass('custom-description');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(
        <AlertDialog open>
          <AlertDialogTrigger>Open</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogDescription ref={ref}>Description</AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      );
      expect(ref.current).not.toBeNull();
    });
  });

  describe('AlertDialogAction', () => {
    it('renders action button', () => {
      render(
        <AlertDialog open>
          <AlertDialogTrigger>Open</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogAction>Confirm</AlertDialogAction>
          </AlertDialogContent>
        </AlertDialog>
      );
      expect(screen.getByText('Confirm')).toBeInTheDocument();
    });

    it('calls onClick handler', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(
        <AlertDialog open>
          <AlertDialogTrigger>Open</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogAction onClick={handleClick}>Confirm</AlertDialogAction>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByText('Confirm'));
      expect(handleClick).toHaveBeenCalled();
    });

    it('applies custom className', () => {
      render(
        <AlertDialog open>
          <AlertDialogTrigger>Open</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogAction className="custom-action" data-testid="action">
              Confirm
            </AlertDialogAction>
          </AlertDialogContent>
        </AlertDialog>
      );
      expect(screen.getByTestId('action')).toHaveClass('custom-action');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(
        <AlertDialog open>
          <AlertDialogTrigger>Open</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogAction ref={ref}>Confirm</AlertDialogAction>
          </AlertDialogContent>
        </AlertDialog>
      );
      expect(ref.current).not.toBeNull();
    });
  });

  describe('AlertDialogCancel', () => {
    it('renders cancel button', () => {
      render(
        <AlertDialog open>
          <AlertDialogTrigger>Open</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogContent>
        </AlertDialog>
      );
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('calls onClick handler', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(
        <AlertDialog open>
          <AlertDialogTrigger>Open</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogCancel onClick={handleClick}>Cancel</AlertDialogCancel>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByText('Cancel'));
      expect(handleClick).toHaveBeenCalled();
    });

    it('applies custom className', () => {
      render(
        <AlertDialog open>
          <AlertDialogTrigger>Open</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogCancel className="custom-cancel" data-testid="cancel">
              Cancel
            </AlertDialogCancel>
          </AlertDialogContent>
        </AlertDialog>
      );
      expect(screen.getByTestId('cancel')).toHaveClass('custom-cancel');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(
        <AlertDialog open>
          <AlertDialogTrigger>Open</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogCancel ref={ref}>Cancel</AlertDialogCancel>
          </AlertDialogContent>
        </AlertDialog>
      );
      expect(ref.current).not.toBeNull();
    });
  });

  describe('AlertDialog composition', () => {
    it('renders complete alert dialog', () => {
      render(
        <AlertDialog open>
          <AlertDialogTrigger>Delete</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );

      expect(screen.getByText('Are you sure?')).toBeInTheDocument();
      expect(screen.getByText(/This action cannot be undone/)).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Continue')).toBeInTheDocument();
    });

    it('handles user interaction flow', async () => {
      const user = userEvent.setup();
      const handleAction = vi.fn();
      const handleCancel = vi.fn();

      render(
        <AlertDialog>
          <AlertDialogTrigger>Delete Account</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Account</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete your account?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleAction}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );

      // Open dialog
      await user.click(screen.getByText('Delete Account'));

      // Verify dialog is open
      expect(screen.getByText('Are you sure you want to delete your account?')).toBeInTheDocument();

      // Click action
      await user.click(screen.getByText('Delete'));
      expect(handleAction).toHaveBeenCalled();
    });
  });
});
