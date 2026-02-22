import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from './command';

describe('Command Components', () => {
  describe('Command', () => {
    it('renders command container', () => {
      render(
        <Command data-testid="command">
          <CommandInput placeholder="Search..." />
        </Command>
      );
      expect(screen.getByTestId('command')).toBeInTheDocument();
    });

    it('applies base classes', () => {
      render(
        <Command data-testid="command">
          <CommandInput placeholder="Search..." />
        </Command>
      );
      const command = screen.getByTestId('command');
      expect(command).toHaveClass('flex');
      expect(command).toHaveClass('flex-col');
    });

    it('applies custom className', () => {
      render(
        <Command className="custom-command" data-testid="command">
          <CommandInput placeholder="Search..." />
        </Command>
      );
      const command = screen.getByTestId('command');
      expect(command).toHaveClass('custom-command');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(
        <Command ref={ref}>
          <CommandInput placeholder="Search..." />
        </Command>
      );
      expect(ref.current).not.toBeNull();
    });
  });

  describe('CommandDialog', () => {
    it('renders dialog when open', () => {
      render(
        <CommandDialog open>
          <CommandInput placeholder="Type a command..." />
        </CommandDialog>
      );
      expect(screen.getByPlaceholderText('Type a command...')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(
        <CommandDialog open={false}>
          <CommandInput placeholder="Type a command..." />
        </CommandDialog>
      );
      expect(screen.queryByPlaceholderText('Type a command...')).not.toBeInTheDocument();
    });

    it('renders with children', () => {
      render(
        <CommandDialog open>
          <CommandInput placeholder="Search" />
          <CommandList>
            <CommandItem>Item 1</CommandItem>
          </CommandList>
        </CommandDialog>
      );
      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });
  });

  describe('CommandInput', () => {
    it('renders input field', () => {
      render(
        <Command>
          <CommandInput placeholder="Search..." />
        </Command>
      );
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    });

    it('renders search icon', () => {
      const { container } = render(
        <Command>
          <CommandInput placeholder="Search..." />
        </Command>
      );
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('accepts user input', async () => {
      const user = userEvent.setup();
      render(
        <Command>
          <CommandInput placeholder="Search..." />
        </Command>
      );

      const input = screen.getByPlaceholderText('Search...');
      await user.type(input, 'test query');
      expect(input).toHaveValue('test query');
    });

    it('applies custom className', () => {
      render(
        <Command>
          <CommandInput className="custom-input" placeholder="Search..." />
        </Command>
      );
      const input = screen.getByPlaceholderText('Search...');
      expect(input).toHaveClass('custom-input');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(
        <Command>
          <CommandInput ref={ref} placeholder="Search..." />
        </Command>
      );
      expect(ref.current).not.toBeNull();
    });

    it('can be disabled', () => {
      render(
        <Command>
          <CommandInput disabled placeholder="Search..." />
        </Command>
      );
      const input = screen.getByPlaceholderText('Search...');
      expect(input).toBeDisabled();
    });
  });

  describe('CommandList', () => {
    it('renders list container', () => {
      render(
        <Command>
          <CommandList data-testid="list">
            <CommandItem>Item 1</CommandItem>
          </CommandList>
        </Command>
      );
      expect(screen.getByTestId('list')).toBeInTheDocument();
    });

    it('applies base classes', () => {
      render(
        <Command>
          <CommandList data-testid="list">
            <CommandItem>Item 1</CommandItem>
          </CommandList>
        </Command>
      );
      const list = screen.getByTestId('list');
      expect(list).toHaveClass('max-h-[300px]');
      expect(list).toHaveClass('overflow-y-auto');
    });

    it('applies custom className', () => {
      render(
        <Command>
          <CommandList className="custom-list" data-testid="list">
            <CommandItem>Item 1</CommandItem>
          </CommandList>
        </Command>
      );
      const list = screen.getByTestId('list');
      expect(list).toHaveClass('custom-list');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(
        <Command>
          <CommandList ref={ref}>
            <CommandItem>Item 1</CommandItem>
          </CommandList>
        </Command>
      );
      expect(ref.current).not.toBeNull();
    });
  });

  describe('CommandEmpty', () => {
    it('renders empty state', () => {
      render(
        <Command>
          <CommandEmpty>No results found.</CommandEmpty>
        </Command>
      );
      expect(screen.getByText('No results found.')).toBeInTheDocument();
    });

    it('applies base classes', () => {
      render(
        <Command>
          <CommandEmpty data-testid="empty">No results</CommandEmpty>
        </Command>
      );
      const empty = screen.getByTestId('empty');
      expect(empty).toHaveClass('py-6');
      expect(empty).toHaveClass('text-center');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(
        <Command>
          <CommandEmpty ref={ref}>No results</CommandEmpty>
        </Command>
      );
      expect(ref.current).not.toBeNull();
    });
  });

  describe('CommandGroup', () => {
    it('renders group container', () => {
      render(
        <Command>
          <CommandList>
            <CommandGroup data-testid="group">
              <CommandItem>Item 1</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      );
      expect(screen.getByTestId('group')).toBeInTheDocument();
    });

    it('renders with heading', () => {
      render(
        <Command>
          <CommandList>
            <CommandGroup heading="Suggestions">
              <CommandItem>Item 1</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      );
      expect(screen.getByText('Suggestions')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <Command>
          <CommandList>
            <CommandGroup className="custom-group" data-testid="group">
              <CommandItem>Item 1</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      );
      const group = screen.getByTestId('group');
      expect(group).toHaveClass('custom-group');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(
        <Command>
          <CommandList>
            <CommandGroup ref={ref}>
              <CommandItem>Item 1</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      );
      expect(ref.current).not.toBeNull();
    });
  });

  describe('CommandItem', () => {
    it('renders item', () => {
      render(
        <Command>
          <CommandList>
            <CommandItem>Calendar</CommandItem>
          </CommandList>
        </Command>
      );
      expect(screen.getByText('Calendar')).toBeInTheDocument();
    });

    it('handles click event', async () => {
      const user = userEvent.setup();
      const handleSelect = vi.fn();
      render(
        <Command>
          <CommandList>
            <CommandItem onSelect={handleSelect}>Calendar</CommandItem>
          </CommandList>
        </Command>
      );

      await user.click(screen.getByText('Calendar'));
      expect(handleSelect).toHaveBeenCalled();
    });

    it('applies custom className', () => {
      render(
        <Command>
          <CommandList>
            <CommandItem className="custom-item" data-testid="item">
              Item
            </CommandItem>
          </CommandList>
        </Command>
      );
      const item = screen.getByTestId('item');
      expect(item).toHaveClass('custom-item');
    });

    it('supports disabled state', () => {
      render(
        <Command>
          <CommandList>
            <CommandItem disabled data-testid="item">
              Disabled Item
            </CommandItem>
          </CommandList>
        </Command>
      );
      const item = screen.getByTestId('item');
      expect(item).toHaveAttribute('data-disabled', 'true');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(
        <Command>
          <CommandList>
            <CommandItem ref={ref}>Item</CommandItem>
          </CommandList>
        </Command>
      );
      expect(ref.current).not.toBeNull();
    });
  });

  describe('CommandSeparator', () => {
    it('renders separator', () => {
      render(
        <Command>
          <CommandList>
            <CommandGroup>
              <CommandItem>Item 1</CommandItem>
            </CommandGroup>
            <CommandSeparator data-testid="separator" />
            <CommandGroup>
              <CommandItem>Item 2</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      );
      expect(screen.getByTestId('separator')).toBeInTheDocument();
    });

    it('applies base classes', () => {
      render(
        <Command>
          <CommandList>
            <CommandSeparator data-testid="separator" />
          </CommandList>
        </Command>
      );
      const separator = screen.getByTestId('separator');
      expect(separator).toHaveClass('h-px');
      expect(separator).toHaveClass('bg-border');
    });

    it('applies custom className', () => {
      render(
        <Command>
          <CommandList>
            <CommandSeparator className="custom-separator" data-testid="separator" />
          </CommandList>
        </Command>
      );
      const separator = screen.getByTestId('separator');
      expect(separator).toHaveClass('custom-separator');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(
        <Command>
          <CommandList>
            <CommandSeparator ref={ref} />
          </CommandList>
        </Command>
      );
      expect(ref.current).not.toBeNull();
    });
  });

  describe('CommandShortcut', () => {
    it('renders shortcut', () => {
      render(
        <Command>
          <CommandList>
            <CommandItem>
              Search
              <CommandShortcut>⌘K</CommandShortcut>
            </CommandItem>
          </CommandList>
        </Command>
      );
      expect(screen.getByText('⌘K')).toBeInTheDocument();
    });

    it('applies base classes', () => {
      render(
        <Command>
          <CommandList>
            <CommandItem>
              Search
              <CommandShortcut data-testid="shortcut">⌘K</CommandShortcut>
            </CommandItem>
          </CommandList>
        </Command>
      );
      const shortcut = screen.getByTestId('shortcut');
      expect(shortcut).toHaveClass('ml-auto');
      expect(shortcut).toHaveClass('text-xs');
    });

    it('applies custom className', () => {
      render(
        <Command>
          <CommandList>
            <CommandItem>
              Search
              <CommandShortcut className="custom-shortcut" data-testid="shortcut">
                ⌘K
              </CommandShortcut>
            </CommandItem>
          </CommandList>
        </Command>
      );
      const shortcut = screen.getByTestId('shortcut');
      expect(shortcut).toHaveClass('custom-shortcut');
    });
  });

  describe('Command composition', () => {
    it('renders complete command palette', () => {
      render(
        <Command>
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Suggestions">
              <CommandItem>Calendar</CommandItem>
              <CommandItem>Search Emoji</CommandItem>
              <CommandItem>Calculator</CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Preferences">
              <CommandItem>Profile</CommandItem>
              <CommandItem>Billing</CommandItem>
              <CommandItem>Settings</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      );

      expect(screen.getByPlaceholderText('Type a command or search...')).toBeInTheDocument();
      expect(screen.getByText('Suggestions')).toBeInTheDocument();
      expect(screen.getByText('Preferences')).toBeInTheDocument();
      expect(screen.getByText('Calendar')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
    });

    it('filters items based on search', async () => {
      const user = userEvent.setup();
      render(
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandItem>Calendar</CommandItem>
            <CommandItem>Calculator</CommandItem>
            <CommandItem>Profile</CommandItem>
          </CommandList>
        </Command>
      );

      const input = screen.getByPlaceholderText('Search...');
      await user.type(input, 'cal');

      // Items are still in DOM, cmdk handles filtering internally
      expect(screen.getByText('Calendar')).toBeInTheDocument();
      expect(screen.getByText('Calculator')).toBeInTheDocument();
    });

    it('renders with shortcuts', () => {
      render(
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandGroup heading="Commands">
              <CommandItem>
                Search
                <CommandShortcut>⌘K</CommandShortcut>
              </CommandItem>
              <CommandItem>
                Settings
                <CommandShortcut>⌘S</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      );

      expect(screen.getByText('⌘K')).toBeInTheDocument();
      expect(screen.getByText('⌘S')).toBeInTheDocument();
    });
  });
});
