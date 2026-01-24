import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from './sheet';

describe('Sheet Components', () => {
  describe('Sheet', () => {
    it('renders sheet trigger', () => {
      render(
        <Sheet>
          <SheetTrigger>Open sheet</SheetTrigger>
        </Sheet>
      );
      expect(screen.getByText('Open sheet')).toBeInTheDocument();
    });

    it('opens on click', async () => {
      const user = userEvent.setup();
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetTitle>Sheet Title</SheetTitle>
          </SheetContent>
        </Sheet>
      );

      const trigger = screen.getByText('Open');
      await user.click(trigger);

      expect(screen.getByText('Sheet Title')).toBeInTheDocument();
    });

    it('renders with open state', () => {
      render(
        <Sheet open>
          <SheetTrigger>Trigger</SheetTrigger>
          <SheetContent>
            <SheetTitle>Visible sheet</SheetTitle>
          </SheetContent>
        </Sheet>
      );
      expect(screen.getByText('Visible sheet')).toBeInTheDocument();
    });
  });

  describe('SheetTrigger', () => {
    it('renders trigger button', () => {
      render(
        <Sheet>
          <SheetTrigger data-testid="trigger">
            Click me
          </SheetTrigger>
        </Sheet>
      );
      expect(screen.getByTestId('trigger')).toBeInTheDocument();
    });

    it('renders as custom element with asChild', () => {
      render(
        <Sheet>
          <SheetTrigger asChild>
            <button>Custom Button</button>
          </SheetTrigger>
        </Sheet>
      );
      expect(screen.getByText('Custom Button')).toBeInTheDocument();
    });
  });

  describe('SheetContent', () => {
    it('renders content when open', () => {
      render(
        <Sheet open>
          <SheetTrigger>Trigger</SheetTrigger>
          <SheetContent data-testid="content">
            <SheetTitle>Sheet content</SheetTitle>
          </SheetContent>
        </Sheet>
      );
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('applies base classes', () => {
      render(
        <Sheet open>
          <SheetTrigger>Trigger</SheetTrigger>
          <SheetContent data-testid="content">
            <SheetTitle>Title</SheetTitle>
          </SheetContent>
        </Sheet>
      );
      const content = screen.getByTestId('content');
      expect(content).toHaveClass('fixed');
      expect(content).toHaveClass('z-50');
      expect(content).toHaveClass('gap-4');
    });

    it('applies custom className', () => {
      render(
        <Sheet open>
          <SheetTrigger>Trigger</SheetTrigger>
          <SheetContent className="custom-sheet" data-testid="content">
            <SheetTitle>Title</SheetTitle>
          </SheetContent>
        </Sheet>
      );
      const content = screen.getByTestId('content');
      expect(content).toHaveClass('custom-sheet');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(
        <Sheet open>
          <SheetTrigger>Trigger</SheetTrigger>
          <SheetContent ref={ref}>
            <SheetTitle>Title</SheetTitle>
          </SheetContent>
        </Sheet>
      );
      expect(ref.current).not.toBeNull();
    });

    it('renders with right side by default', () => {
      render(
        <Sheet open>
          <SheetTrigger>Trigger</SheetTrigger>
          <SheetContent data-testid="content">
            <SheetTitle>Title</SheetTitle>
          </SheetContent>
        </Sheet>
      );
      const content = screen.getByTestId('content');
      expect(content).toHaveClass('inset-y-0');
      expect(content).toHaveClass('right-0');
    });

    it('renders with left side', () => {
      render(
        <Sheet open>
          <SheetTrigger>Trigger</SheetTrigger>
          <SheetContent side="left" data-testid="content">
            <SheetTitle>Title</SheetTitle>
          </SheetContent>
        </Sheet>
      );
      const content = screen.getByTestId('content');
      expect(content).toHaveClass('left-0');
    });

    it('renders with top side', () => {
      render(
        <Sheet open>
          <SheetTrigger>Trigger</SheetTrigger>
          <SheetContent side="top" data-testid="content">
            <SheetTitle>Title</SheetTitle>
          </SheetContent>
        </Sheet>
      );
      const content = screen.getByTestId('content');
      expect(content).toHaveClass('inset-x-0');
      expect(content).toHaveClass('top-0');
    });

    it('renders with bottom side', () => {
      render(
        <Sheet open>
          <SheetTrigger>Trigger</SheetTrigger>
          <SheetContent side="bottom" data-testid="content">
            <SheetTitle>Title</SheetTitle>
          </SheetContent>
        </Sheet>
      );
      const content = screen.getByTestId('content');
      expect(content).toHaveClass('inset-x-0');
      expect(content).toHaveClass('bottom-0');
    });

    it('renders close button', () => {
      render(
        <Sheet open>
          <SheetTrigger>Trigger</SheetTrigger>
          <SheetContent>
            <SheetTitle>Title</SheetTitle>
          </SheetContent>
        </Sheet>
      );
      expect(screen.getByText('Close')).toBeInTheDocument();
    });
  });

  describe('SheetHeader', () => {
    it('renders header section', () => {
      render(
        <Sheet open>
          <SheetTrigger>Trigger</SheetTrigger>
          <SheetContent>
            <SheetHeader data-testid="header">
              <SheetTitle>Header Title</SheetTitle>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      );
      expect(screen.getByTestId('header')).toBeInTheDocument();
    });

    it('applies base classes', () => {
      render(
        <Sheet open>
          <SheetTrigger>Trigger</SheetTrigger>
          <SheetContent>
            <SheetHeader data-testid="header">
              <SheetTitle>Title</SheetTitle>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      );
      const header = screen.getByTestId('header');
      expect(header).toHaveClass('flex');
      expect(header).toHaveClass('flex-col');
      expect(header).toHaveClass('space-y-2');
    });

    it('applies custom className', () => {
      render(
        <Sheet open>
          <SheetTrigger>Trigger</SheetTrigger>
          <SheetContent>
            <SheetHeader className="custom-header" data-testid="header">
              <SheetTitle>Title</SheetTitle>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      );
      expect(screen.getByTestId('header')).toHaveClass('custom-header');
    });
  });

  describe('SheetFooter', () => {
    it('renders footer section', () => {
      render(
        <Sheet open>
          <SheetTrigger>Trigger</SheetTrigger>
          <SheetContent>
            <SheetTitle>Title</SheetTitle>
            <SheetFooter data-testid="footer">
              <button>Action</button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      );
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });

    it('applies base classes', () => {
      render(
        <Sheet open>
          <SheetTrigger>Trigger</SheetTrigger>
          <SheetContent>
            <SheetTitle>Title</SheetTitle>
            <SheetFooter data-testid="footer">
              <button>Action</button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      );
      const footer = screen.getByTestId('footer');
      expect(footer).toHaveClass('flex');
      expect(footer).toHaveClass('flex-col-reverse');
    });

    it('applies custom className', () => {
      render(
        <Sheet open>
          <SheetTrigger>Trigger</SheetTrigger>
          <SheetContent>
            <SheetTitle>Title</SheetTitle>
            <SheetFooter className="custom-footer" data-testid="footer">
              <button>Action</button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      );
      expect(screen.getByTestId('footer')).toHaveClass('custom-footer');
    });
  });

  describe('SheetTitle', () => {
    it('renders title', () => {
      render(
        <Sheet open>
          <SheetTrigger>Trigger</SheetTrigger>
          <SheetContent>
            <SheetTitle>Sheet Title</SheetTitle>
          </SheetContent>
        </Sheet>
      );
      expect(screen.getByText('Sheet Title')).toBeInTheDocument();
    });

    it('applies base classes', () => {
      render(
        <Sheet open>
          <SheetTrigger>Trigger</SheetTrigger>
          <SheetContent>
            <SheetTitle data-testid="title">Title</SheetTitle>
          </SheetContent>
        </Sheet>
      );
      const title = screen.getByTestId('title');
      expect(title).toHaveClass('text-lg');
      expect(title).toHaveClass('font-semibold');
    });

    it('applies custom className', () => {
      render(
        <Sheet open>
          <SheetTrigger>Trigger</SheetTrigger>
          <SheetContent>
            <SheetTitle className="custom-title" data-testid="title">
              Title
            </SheetTitle>
          </SheetContent>
        </Sheet>
      );
      expect(screen.getByTestId('title')).toHaveClass('custom-title');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(
        <Sheet open>
          <SheetTrigger>Trigger</SheetTrigger>
          <SheetContent>
            <SheetTitle ref={ref}>Title</SheetTitle>
          </SheetContent>
        </Sheet>
      );
      expect(ref.current).not.toBeNull();
    });
  });

  describe('SheetDescription', () => {
    it('renders description', () => {
      render(
        <Sheet open>
          <SheetTrigger>Trigger</SheetTrigger>
          <SheetContent>
            <SheetTitle>Title</SheetTitle>
            <SheetDescription>This is a description</SheetDescription>
          </SheetContent>
        </Sheet>
      );
      expect(screen.getByText('This is a description')).toBeInTheDocument();
    });

    it('applies base classes', () => {
      render(
        <Sheet open>
          <SheetTrigger>Trigger</SheetTrigger>
          <SheetContent>
            <SheetTitle>Title</SheetTitle>
            <SheetDescription data-testid="description">
              Description
            </SheetDescription>
          </SheetContent>
        </Sheet>
      );
      const description = screen.getByTestId('description');
      expect(description).toHaveClass('text-sm');
      expect(description).toHaveClass('text-muted-foreground');
    });

    it('applies custom className', () => {
      render(
        <Sheet open>
          <SheetTrigger>Trigger</SheetTrigger>
          <SheetContent>
            <SheetTitle>Title</SheetTitle>
            <SheetDescription className="custom-description" data-testid="description">
              Description
            </SheetDescription>
          </SheetContent>
        </Sheet>
      );
      expect(screen.getByTestId('description')).toHaveClass('custom-description');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(
        <Sheet open>
          <SheetTrigger>Trigger</SheetTrigger>
          <SheetContent>
            <SheetTitle>Title</SheetTitle>
            <SheetDescription ref={ref}>Description</SheetDescription>
          </SheetContent>
        </Sheet>
      );
      expect(ref.current).not.toBeNull();
    });
  });

  describe('SheetClose', () => {
    it('renders close button', () => {
      render(
        <Sheet open>
          <SheetTrigger>Trigger</SheetTrigger>
          <SheetContent>
            <SheetTitle>Title</SheetTitle>
            <SheetClose>Close Sheet</SheetClose>
          </SheetContent>
        </Sheet>
      );
      // There's a built-in close button
      expect(screen.getByText('Close')).toBeInTheDocument();
    });

    it('renders as custom element with asChild', () => {
      render(
        <Sheet open>
          <SheetTrigger>Trigger</SheetTrigger>
          <SheetContent>
            <SheetTitle>Title</SheetTitle>
            <SheetClose asChild>
              <button>Custom Close</button>
            </SheetClose>
          </SheetContent>
        </Sheet>
      );
      expect(screen.getByText('Custom Close')).toBeInTheDocument();
    });
  });

  describe('Sheet composition', () => {
    it('renders complete sheet', () => {
      render(
        <Sheet open>
          <SheetTrigger>Open Sheet</SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Sheet Title</SheetTitle>
              <SheetDescription>
                This is a sheet description with more details.
              </SheetDescription>
            </SheetHeader>
            <div className="py-4">
              <p>Sheet body content goes here</p>
            </div>
            <SheetFooter>
              <button>Submit</button>
              <SheetClose asChild>
                <button>Cancel</button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      );

      expect(screen.getByText('Sheet Title')).toBeInTheDocument();
      expect(screen.getByText(/This is a sheet description/)).toBeInTheDocument();
      expect(screen.getByText('Sheet body content goes here')).toBeInTheDocument();
      expect(screen.getByText('Submit')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('renders sheet with navigation menu', () => {
      render(
        <Sheet open>
          <SheetTrigger>Menu</SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            <nav>
              <a href="#home">Home</a>
              <a href="#about">About</a>
              <a href="#contact">Contact</a>
            </nav>
          </SheetContent>
        </Sheet>
      );

      expect(screen.getByText('Navigation')).toBeInTheDocument();
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('About')).toBeInTheDocument();
      expect(screen.getByText('Contact')).toBeInTheDocument();
    });

    it('renders sheet from different sides', () => {
      const sides = ['left', 'right', 'top', 'bottom'] as const;

      sides.forEach((side) => {
        const { unmount } = render(
          <Sheet open>
            <SheetTrigger>Open {side}</SheetTrigger>
            <SheetContent side={side} data-testid={`sheet-${side}`}>
              <SheetTitle>Sheet from {side}</SheetTitle>
            </SheetContent>
          </Sheet>
        );

        expect(screen.getByTestId(`sheet-${side}`)).toBeInTheDocument();
        unmount();
      });
    });
  });
});
