import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Popover, PopoverTrigger, PopoverContent } from './popover';

describe('Popover Components', () => {
  describe('Popover', () => {
    it('renders popover trigger', () => {
      render(
        <Popover>
          <PopoverTrigger>Open popover</PopoverTrigger>
        </Popover>
      );
      expect(screen.getByText('Open popover')).toBeInTheDocument();
    });

    it('opens on click', async () => {
      const user = userEvent.setup();
      render(
        <Popover>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>Popover content</PopoverContent>
        </Popover>
      );

      const trigger = screen.getByText('Open');
      await user.click(trigger);

      expect(screen.getByText('Popover content')).toBeInTheDocument();
    });

    it('renders with open state', () => {
      render(
        <Popover open>
          <PopoverTrigger>Trigger</PopoverTrigger>
          <PopoverContent>Content visible</PopoverContent>
        </Popover>
      );
      expect(screen.getByText('Content visible')).toBeInTheDocument();
    });

    it('renders with closed state', () => {
      render(
        <Popover open={false}>
          <PopoverTrigger>Trigger</PopoverTrigger>
          <PopoverContent>Hidden content</PopoverContent>
        </Popover>
      );
      expect(screen.queryByText('Hidden content')).not.toBeInTheDocument();
    });
  });

  describe('PopoverTrigger', () => {
    it('renders trigger button', () => {
      render(
        <Popover>
          <PopoverTrigger data-testid="trigger">
            Click me
          </PopoverTrigger>
        </Popover>
      );
      expect(screen.getByTestId('trigger')).toBeInTheDocument();
    });

    it('renders as custom element with asChild', () => {
      render(
        <Popover>
          <PopoverTrigger asChild>
            <button>Custom Button</button>
          </PopoverTrigger>
        </Popover>
      );
      expect(screen.getByText('Custom Button')).toBeInTheDocument();
    });

    it('renders text trigger', () => {
      render(
        <Popover>
          <PopoverTrigger>Settings</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      );
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });
  });

  describe('PopoverContent', () => {
    it('renders content when open', () => {
      render(
        <Popover open>
          <PopoverTrigger>Trigger</PopoverTrigger>
          <PopoverContent data-testid="content">
            Popover content
          </PopoverContent>
        </Popover>
      );
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('applies base classes', () => {
      render(
        <Popover open>
          <PopoverTrigger>Trigger</PopoverTrigger>
          <PopoverContent data-testid="content">
            Content
          </PopoverContent>
        </Popover>
      );
      const content = screen.getByTestId('content');
      expect(content).toHaveClass('z-50');
      expect(content).toHaveClass('w-72');
      expect(content).toHaveClass('rounded-md');
      expect(content).toHaveClass('border');
    });

    it('applies custom className', () => {
      render(
        <Popover open>
          <PopoverTrigger>Trigger</PopoverTrigger>
          <PopoverContent className="custom-popover" data-testid="content">
            Content
          </PopoverContent>
        </Popover>
      );
      const content = screen.getByTestId('content');
      expect(content).toHaveClass('custom-popover');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(
        <Popover open>
          <PopoverTrigger>Trigger</PopoverTrigger>
          <PopoverContent ref={ref}>
            Content
          </PopoverContent>
        </Popover>
      );
      expect(ref.current).not.toBeNull();
    });

    it('renders with custom align prop', () => {
      render(
        <Popover open>
          <PopoverTrigger>Trigger</PopoverTrigger>
          <PopoverContent align="start" data-testid="content">
            Content
          </PopoverContent>
        </Popover>
      );
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('renders with custom sideOffset prop', () => {
      render(
        <Popover open>
          <PopoverTrigger>Trigger</PopoverTrigger>
          <PopoverContent sideOffset={8} data-testid="content">
            Content
          </PopoverContent>
        </Popover>
      );
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
  });

  describe('Popover with content', () => {
    it('renders simple text content', () => {
      render(
        <Popover open>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>
            This is popover content
          </PopoverContent>
        </Popover>
      );
      expect(screen.getByText('This is popover content')).toBeInTheDocument();
    });

    it('renders complex content', () => {
      render(
        <Popover open>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>
            <div>
              <h3>Popover Title</h3>
              <p>Popover description</p>
            </div>
          </PopoverContent>
        </Popover>
      );
      expect(screen.getByText('Popover Title')).toBeInTheDocument();
      expect(screen.getByText('Popover description')).toBeInTheDocument();
    });

    it('renders with form content', () => {
      render(
        <Popover open>
          <PopoverTrigger>Settings</PopoverTrigger>
          <PopoverContent>
            <form>
              <label htmlFor="name">Name</label>
              <input id="name" placeholder="Enter name" />
              <button type="submit">Save</button>
            </form>
          </PopoverContent>
        </Popover>
      );
      expect(screen.getByLabelText('Name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter name')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
    });

    it('renders with list content', () => {
      render(
        <Popover open>
          <PopoverTrigger>Options</PopoverTrigger>
          <PopoverContent>
            <ul>
              <li>Option 1</li>
              <li>Option 2</li>
              <li>Option 3</li>
            </ul>
          </PopoverContent>
        </Popover>
      );
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
      expect(screen.getByText('Option 3')).toBeInTheDocument();
    });
  });

  describe('Popover interaction', () => {
    it('opens popover on trigger click', async () => {
      const user = userEvent.setup();
      render(
        <Popover>
          <PopoverTrigger>Click to open</PopoverTrigger>
          <PopoverContent>Opened content</PopoverContent>
        </Popover>
      );

      const trigger = screen.getByText('Click to open');
      await user.click(trigger);

      expect(screen.getByText('Opened content')).toBeInTheDocument();
    });

    it('respects controlled open state', () => {
      const { rerender } = render(
        <Popover open={false}>
          <PopoverTrigger>Trigger</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      );

      expect(screen.queryByText('Content')).not.toBeInTheDocument();

      rerender(
        <Popover open={true}>
          <PopoverTrigger>Trigger</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      );

      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('renders with defaultOpen prop', () => {
      render(
        <Popover defaultOpen>
          <PopoverTrigger>Trigger</PopoverTrigger>
          <PopoverContent>Initially visible</PopoverContent>
        </Popover>
      );

      expect(screen.getByText('Initially visible')).toBeInTheDocument();
    });
  });

  describe('Popover composition', () => {
    it('renders complete popover with header and footer', () => {
      render(
        <Popover open>
          <PopoverTrigger>Open Settings</PopoverTrigger>
          <PopoverContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Settings</h4>
                <p className="text-sm">Adjust your preferences</p>
              </div>
              <div>
                <label>Theme</label>
                <select>
                  <option>Light</option>
                  <option>Dark</option>
                </select>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      );

      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Adjust your preferences')).toBeInTheDocument();
      expect(screen.getByText('Theme')).toBeInTheDocument();
    });

    it('renders with button as trigger', () => {
      render(
        <Popover open>
          <PopoverTrigger asChild>
            <button className="btn">More options</button>
          </PopoverTrigger>
          <PopoverContent>
            Additional options here
          </PopoverContent>
        </Popover>
      );

      expect(screen.getByText('More options')).toBeInTheDocument();
      expect(screen.getByText('Additional options here')).toBeInTheDocument();
    });

    it('renders with icon trigger', () => {
      render(
        <Popover open>
          <PopoverTrigger asChild>
            <button aria-label="Info">
              <span>ℹ️</span>
            </button>
          </PopoverTrigger>
          <PopoverContent>
            Information content
          </PopoverContent>
        </Popover>
      );

      expect(screen.getByLabelText('Info')).toBeInTheDocument();
      expect(screen.getByText('Information content')).toBeInTheDocument();
    });
  });
});
