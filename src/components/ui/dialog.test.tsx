import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from './dialog';

describe('Dialog Components', () => {
  describe('Dialog basic rendering', () => {
    it('renders dialog trigger', () => {
      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
        </Dialog>
      );
      expect(screen.getByText('Open Dialog')).toBeInTheDocument();
    });

    it('shows content when open', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle>Dialog Title</DialogTitle>
            <DialogDescription>Dialog Description</DialogDescription>
          </DialogContent>
        </Dialog>
      );
      expect(screen.getByText('Dialog Title')).toBeInTheDocument();
      expect(screen.getByText('Dialog Description')).toBeInTheDocument();
    });

    it('hides content when closed', () => {
      render(
        <Dialog open={false}>
          <DialogContent>
            <DialogTitle>Hidden Title</DialogTitle>
          </DialogContent>
        </Dialog>
      );
      expect(screen.queryByText('Hidden Title')).not.toBeInTheDocument();
    });
  });

  describe('DialogTitle', () => {
    it('renders title text', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle>Test Title</DialogTitle>
          </DialogContent>
        </Dialog>
      );
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('applies custom className to title', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle className="custom-title">Title</DialogTitle>
          </DialogContent>
        </Dialog>
      );
      const title = screen.getByText('Title');
      expect(title).toHaveClass('custom-title');
    });
  });

  describe('DialogDescription', () => {
    it('renders description text', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogDescription>Test Description</DialogDescription>
          </DialogContent>
        </Dialog>
      );
      expect(screen.getByText('Test Description')).toBeInTheDocument();
    });

    it('applies custom className to description', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogDescription className="custom-desc">Description</DialogDescription>
          </DialogContent>
        </Dialog>
      );
      const description = screen.getByText('Description');
      expect(description).toHaveClass('custom-desc');
    });
  });

  describe('DialogHeader', () => {
    it('renders header with children', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Header Title</DialogTitle>
              <DialogDescription>Header Description</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );
      expect(screen.getByText('Header Title')).toBeInTheDocument();
      expect(screen.getByText('Header Description')).toBeInTheDocument();
    });

    it('applies custom className to header', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogHeader className="custom-header" data-testid="header">
              <DialogTitle>Title</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );
      const header = screen.getByTestId('header');
      expect(header).toHaveClass('custom-header');
    });
  });

  describe('DialogFooter', () => {
    it('renders footer with children', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogFooter data-testid="footer">
              <button>Cancel</button>
              <button>Confirm</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Confirm')).toBeInTheDocument();
    });

    it('applies custom className to footer', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogFooter className="custom-footer" data-testid="footer">
              Footer Content
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
      const footer = screen.getByTestId('footer');
      expect(footer).toHaveClass('custom-footer');
    });
  });

  describe('Dialog composition', () => {
    it('renders complete dialog with all parts', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Complete Dialog</DialogTitle>
              <DialogDescription>This is a complete dialog</DialogDescription>
            </DialogHeader>
            <div data-testid="content">Main Content</div>
            <DialogFooter>
              <button>Action</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByText('Complete Dialog')).toBeInTheDocument();
      expect(screen.getByText('This is a complete dialog')).toBeInTheDocument();
      expect(screen.getByTestId('content')).toBeInTheDocument();
      expect(screen.getByText('Action')).toBeInTheDocument();
    });

    it('renders close button', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle>Dialog with Close</DialogTitle>
          </DialogContent>
        </Dialog>
      );
      expect(screen.getByText('Close')).toBeInTheDocument();
    });
  });

  describe('Dialog controlled state', () => {
    it('respects open prop', () => {
      const { rerender } = render(
        <Dialog open={false}>
          <DialogContent>
            <DialogTitle>Controlled Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      expect(screen.queryByText('Controlled Dialog')).not.toBeInTheDocument();

      rerender(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>Controlled Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByText('Controlled Dialog')).toBeInTheDocument();
    });

    it('calls onOpenChange when state should change', async () => {
      const user = userEvent.setup();
      const handleOpenChange = vi.fn();

      render(
        <Dialog open onOpenChange={handleOpenChange}>
          <DialogContent>
            <DialogTitle>Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      const closeButton = screen.getByText('Close');
      await user.click(closeButton);

      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
