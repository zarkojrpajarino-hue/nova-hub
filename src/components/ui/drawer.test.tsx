import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from './drawer';

describe('Drawer Components', () => {
  describe('Drawer', () => {
    it('renders drawer trigger', () => {
      render(
        <Drawer>
          <DrawerTrigger>Open drawer</DrawerTrigger>
        </Drawer>
      );
      expect(screen.getByText('Open drawer')).toBeInTheDocument();
    });

    it('opens on click', async () => {
      const user = userEvent.setup();
      render(
        <Drawer>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>Drawer Title</DrawerTitle>
          </DrawerContent>
        </Drawer>
      );

      const trigger = screen.getByText('Open');
      await user.click(trigger);

      expect(screen.getByText('Drawer Title')).toBeInTheDocument();
    });

    it('renders with open state', () => {
      render(
        <Drawer open>
          <DrawerTrigger>Trigger</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>Visible drawer</DrawerTitle>
          </DrawerContent>
        </Drawer>
      );
      expect(screen.getByText('Visible drawer')).toBeInTheDocument();
    });

    it('renders with shouldScaleBackground prop', () => {
      render(
        <Drawer shouldScaleBackground={false}>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>Title</DrawerTitle>
          </DrawerContent>
        </Drawer>
      );
      expect(screen.getByText('Open')).toBeInTheDocument();
    });
  });

  describe('DrawerTrigger', () => {
    it('renders trigger button', () => {
      render(
        <Drawer>
          <DrawerTrigger data-testid="trigger">
            Click me
          </DrawerTrigger>
        </Drawer>
      );
      expect(screen.getByTestId('trigger')).toBeInTheDocument();
    });

    it('renders as custom element with asChild', () => {
      render(
        <Drawer>
          <DrawerTrigger asChild>
            <button>Custom Button</button>
          </DrawerTrigger>
        </Drawer>
      );
      expect(screen.getByText('Custom Button')).toBeInTheDocument();
    });
  });

  describe('DrawerContent', () => {
    it('renders content when open', () => {
      render(
        <Drawer open>
          <DrawerTrigger>Trigger</DrawerTrigger>
          <DrawerContent data-testid="content">
            <DrawerTitle>Drawer content</DrawerTitle>
          </DrawerContent>
        </Drawer>
      );
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('applies base classes', () => {
      render(
        <Drawer open>
          <DrawerTrigger>Trigger</DrawerTrigger>
          <DrawerContent data-testid="content">
            <DrawerTitle>Title</DrawerTitle>
          </DrawerContent>
        </Drawer>
      );
      const content = screen.getByTestId('content');
      expect(content).toHaveClass('fixed');
      expect(content).toHaveClass('inset-x-0');
      expect(content).toHaveClass('bottom-0');
      expect(content).toHaveClass('z-50');
    });

    it('applies custom className', () => {
      render(
        <Drawer open>
          <DrawerTrigger>Trigger</DrawerTrigger>
          <DrawerContent className="custom-drawer" data-testid="content">
            <DrawerTitle>Title</DrawerTitle>
          </DrawerContent>
        </Drawer>
      );
      const content = screen.getByTestId('content');
      expect(content).toHaveClass('custom-drawer');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(
        <Drawer open>
          <DrawerTrigger>Trigger</DrawerTrigger>
          <DrawerContent ref={ref}>
            <DrawerTitle>Title</DrawerTitle>
          </DrawerContent>
        </Drawer>
      );
      expect(ref.current).not.toBeNull();
    });

    it('renders drag handle', () => {
      render(
        <Drawer open>
          <DrawerTrigger>Trigger</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>Title</DrawerTitle>
          </DrawerContent>
        </Drawer>
      );
      // Check for the drag handle div with multiple classes
      // Drawer content renders in a Portal, so we need to use document
      const dragHandles = document.querySelectorAll('div');
      const dragHandle = Array.from(dragHandles).find(
        (div) => div.className.includes('mx-auto') && div.className.includes('h-2')
      );
      expect(dragHandle).toBeInTheDocument();
    });
  });

  describe('DrawerHeader', () => {
    it('renders header section', () => {
      render(
        <Drawer open>
          <DrawerTrigger>Trigger</DrawerTrigger>
          <DrawerContent>
            <DrawerHeader data-testid="header">
              <DrawerTitle>Header Title</DrawerTitle>
            </DrawerHeader>
          </DrawerContent>
        </Drawer>
      );
      expect(screen.getByTestId('header')).toBeInTheDocument();
    });

    it('applies base classes', () => {
      render(
        <Drawer open>
          <DrawerTrigger>Trigger</DrawerTrigger>
          <DrawerContent>
            <DrawerHeader data-testid="header">
              <DrawerTitle>Title</DrawerTitle>
            </DrawerHeader>
          </DrawerContent>
        </Drawer>
      );
      const header = screen.getByTestId('header');
      expect(header).toHaveClass('grid');
      expect(header).toHaveClass('gap-1.5');
      expect(header).toHaveClass('p-4');
    });

    it('applies custom className', () => {
      render(
        <Drawer open>
          <DrawerTrigger>Trigger</DrawerTrigger>
          <DrawerContent>
            <DrawerHeader className="custom-header" data-testid="header">
              <DrawerTitle>Title</DrawerTitle>
            </DrawerHeader>
          </DrawerContent>
        </Drawer>
      );
      expect(screen.getByTestId('header')).toHaveClass('custom-header');
    });
  });

  describe('DrawerFooter', () => {
    it('renders footer section', () => {
      render(
        <Drawer open>
          <DrawerTrigger>Trigger</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>Title</DrawerTitle>
            <DrawerFooter data-testid="footer">
              <button>Action</button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      );
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });

    it('applies base classes', () => {
      render(
        <Drawer open>
          <DrawerTrigger>Trigger</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>Title</DrawerTitle>
            <DrawerFooter data-testid="footer">
              <button>Action</button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      );
      const footer = screen.getByTestId('footer');
      expect(footer).toHaveClass('mt-auto');
      expect(footer).toHaveClass('flex');
      expect(footer).toHaveClass('flex-col');
    });

    it('applies custom className', () => {
      render(
        <Drawer open>
          <DrawerTrigger>Trigger</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>Title</DrawerTitle>
            <DrawerFooter className="custom-footer" data-testid="footer">
              <button>Action</button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      );
      expect(screen.getByTestId('footer')).toHaveClass('custom-footer');
    });
  });

  describe('DrawerTitle', () => {
    it('renders title', () => {
      render(
        <Drawer open>
          <DrawerTrigger>Trigger</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>Drawer Title</DrawerTitle>
          </DrawerContent>
        </Drawer>
      );
      expect(screen.getByText('Drawer Title')).toBeInTheDocument();
    });

    it('applies base classes', () => {
      render(
        <Drawer open>
          <DrawerTrigger>Trigger</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle data-testid="title">Title</DrawerTitle>
          </DrawerContent>
        </Drawer>
      );
      const title = screen.getByTestId('title');
      expect(title).toHaveClass('text-lg');
      expect(title).toHaveClass('font-semibold');
    });

    it('applies custom className', () => {
      render(
        <Drawer open>
          <DrawerTrigger>Trigger</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle className="custom-title" data-testid="title">
              Title
            </DrawerTitle>
          </DrawerContent>
        </Drawer>
      );
      expect(screen.getByTestId('title')).toHaveClass('custom-title');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(
        <Drawer open>
          <DrawerTrigger>Trigger</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle ref={ref}>Title</DrawerTitle>
          </DrawerContent>
        </Drawer>
      );
      expect(ref.current).not.toBeNull();
    });
  });

  describe('DrawerDescription', () => {
    it('renders description', () => {
      render(
        <Drawer open>
          <DrawerTrigger>Trigger</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>Title</DrawerTitle>
            <DrawerDescription>This is a description</DrawerDescription>
          </DrawerContent>
        </Drawer>
      );
      expect(screen.getByText('This is a description')).toBeInTheDocument();
    });

    it('applies base classes', () => {
      render(
        <Drawer open>
          <DrawerTrigger>Trigger</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>Title</DrawerTitle>
            <DrawerDescription data-testid="description">
              Description
            </DrawerDescription>
          </DrawerContent>
        </Drawer>
      );
      const description = screen.getByTestId('description');
      expect(description).toHaveClass('text-sm');
      expect(description).toHaveClass('text-muted-foreground');
    });

    it('applies custom className', () => {
      render(
        <Drawer open>
          <DrawerTrigger>Trigger</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>Title</DrawerTitle>
            <DrawerDescription className="custom-description" data-testid="description">
              Description
            </DrawerDescription>
          </DrawerContent>
        </Drawer>
      );
      expect(screen.getByTestId('description')).toHaveClass('custom-description');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(
        <Drawer open>
          <DrawerTrigger>Trigger</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>Title</DrawerTitle>
            <DrawerDescription ref={ref}>Description</DrawerDescription>
          </DrawerContent>
        </Drawer>
      );
      expect(ref.current).not.toBeNull();
    });
  });

  describe('DrawerClose', () => {
    it('renders close button', () => {
      render(
        <Drawer open>
          <DrawerTrigger>Trigger</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>Title</DrawerTitle>
            <DrawerClose>Close</DrawerClose>
          </DrawerContent>
        </Drawer>
      );
      expect(screen.getByText('Close')).toBeInTheDocument();
    });

    it('renders as custom element with asChild', () => {
      render(
        <Drawer open>
          <DrawerTrigger>Trigger</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>Title</DrawerTitle>
            <DrawerClose asChild>
              <button>Custom Close</button>
            </DrawerClose>
          </DrawerContent>
        </Drawer>
      );
      expect(screen.getByText('Custom Close')).toBeInTheDocument();
    });
  });

  describe('Drawer composition', () => {
    it('renders complete drawer', () => {
      render(
        <Drawer open>
          <DrawerTrigger>Open Drawer</DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Drawer Title</DrawerTitle>
              <DrawerDescription>
                This is a drawer description with more details.
              </DrawerDescription>
            </DrawerHeader>
            <div className="p-4">
              <p>Drawer body content goes here</p>
            </div>
            <DrawerFooter>
              <button>Submit</button>
              <DrawerClose>
                <button>Cancel</button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      );

      expect(screen.getByText('Drawer Title')).toBeInTheDocument();
      expect(screen.getByText(/This is a drawer description/)).toBeInTheDocument();
      expect(screen.getByText('Drawer body content goes here')).toBeInTheDocument();
      expect(screen.getByText('Submit')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('renders drawer with form', () => {
      render(
        <Drawer open>
          <DrawerTrigger>Open Form</DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Contact Form</DrawerTitle>
            </DrawerHeader>
            <form className="p-4">
              <input placeholder="Name" />
              <input placeholder="Email" />
              <textarea placeholder="Message" />
            </form>
            <DrawerFooter>
              <button type="submit">Send</button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      );

      expect(screen.getByText('Contact Form')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Message')).toBeInTheDocument();
    });
  });
});
