import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} from './dropdown-menu';

describe('DropdownMenu Components', () => {
  describe('DropdownMenu', () => {
    it('renders dropdown trigger', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open menu</DropdownMenuTrigger>
        </DropdownMenu>
      );
      expect(screen.getByText('Open menu')).toBeInTheDocument();
    });

    it('opens on click', async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const trigger = screen.getByText('Open');
      await user.click(trigger);

      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });
  });

  describe('DropdownMenuTrigger', () => {
    it('renders trigger button', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger data-testid="trigger">
            Menu
          </DropdownMenuTrigger>
        </DropdownMenu>
      );
      expect(screen.getByTestId('trigger')).toBeInTheDocument();
    });

    it('renders as custom element with asChild', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button>Custom Button</button>
          </DropdownMenuTrigger>
        </DropdownMenu>
      );
      expect(screen.getByText('Custom Button')).toBeInTheDocument();
    });
  });

  describe('DropdownMenuContent', () => {
    it('renders content when opened', async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
          <DropdownMenuContent data-testid="content">
            <DropdownMenuItem>Menu Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Trigger'));

      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('applies custom className', async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
          <DropdownMenuContent className="custom-content" data-testid="content">
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Trigger'));

      expect(screen.getByTestId('content')).toHaveClass('custom-content');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(
        <DropdownMenu open>
          <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
          <DropdownMenuContent ref={ref}>
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      expect(ref.current).not.toBeNull();
    });
  });

  describe('DropdownMenuItem', () => {
    it('renders menu item', async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Profile</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Trigger'));

      expect(screen.getByText('Profile')).toBeInTheDocument();
    });

    it('handles click event', async () => {
      const user = userEvent.setup();
      const handleSelect = vi.fn();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={handleSelect}>Action</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Trigger'));
      await user.click(screen.getByText('Action'));

      expect(handleSelect).toHaveBeenCalled();
    });

    it('applies inset prop', async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem inset data-testid="item">
              Inset Item
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Trigger'));

      expect(screen.getByTestId('item')).toHaveClass('pl-8');
    });

    it('applies custom className', async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem className="custom-item" data-testid="item">
              Item
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Trigger'));

      expect(screen.getByTestId('item')).toHaveClass('custom-item');
    });

    it('forwards ref correctly', async () => {
      const user = userEvent.setup();
      const ref = { current: null };
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem ref={ref}>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Trigger'));

      expect(ref.current).not.toBeNull();
    });
  });

  describe('DropdownMenuCheckboxItem', () => {
    it('renders checkbox item', async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem>Show Status Bar</DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Trigger'));

      expect(screen.getByText('Show Status Bar')).toBeInTheDocument();
    });

    it('handles checked state', async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem checked data-testid="checkbox">
              Enabled
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Trigger'));

      const checkbox = screen.getByTestId('checkbox');
      expect(checkbox).toHaveAttribute('data-state', 'checked');
    });

    it('applies custom className', async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem className="custom-checkbox" data-testid="checkbox">
              Item
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Trigger'));

      expect(screen.getByTestId('checkbox')).toHaveClass('custom-checkbox');
    });

    it('forwards ref correctly', async () => {
      const user = userEvent.setup();
      const ref = { current: null };
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem ref={ref}>Item</DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Trigger'));

      expect(ref.current).not.toBeNull();
    });
  });

  describe('DropdownMenuRadioItem', () => {
    it('renders radio item', async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup>
              <DropdownMenuRadioItem value="option1">Option 1</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Trigger'));

      expect(screen.getByText('Option 1')).toBeInTheDocument();
    });

    it('handles selection', async () => {
      const user = userEvent.setup();
      const handleValueChange = vi.fn();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup onValueChange={handleValueChange}>
              <DropdownMenuRadioItem value="option1">Option 1</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="option2">Option 2</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Trigger'));
      await user.click(screen.getByText('Option 1'));

      expect(handleValueChange).toHaveBeenCalledWith('option1');
    });

    it('applies custom className', async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup>
              <DropdownMenuRadioItem className="custom-radio" data-testid="radio" value="opt">
                Option
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Trigger'));

      expect(screen.getByTestId('radio')).toHaveClass('custom-radio');
    });

    it('forwards ref correctly', async () => {
      const user = userEvent.setup();
      const ref = { current: null };
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup>
              <DropdownMenuRadioItem ref={ref} value="opt">
                Option
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Trigger'));

      expect(ref.current).not.toBeNull();
    });
  });

  describe('DropdownMenuLabel', () => {
    it('renders label', async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Trigger'));

      expect(screen.getByText('My Account')).toBeInTheDocument();
    });

    it('applies inset prop', async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel inset data-testid="label">
              Label
            </DropdownMenuLabel>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Trigger'));

      expect(screen.getByTestId('label')).toHaveClass('pl-8');
    });

    it('applies custom className', async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel className="custom-label" data-testid="label">
              Label
            </DropdownMenuLabel>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Trigger'));

      expect(screen.getByTestId('label')).toHaveClass('custom-label');
    });

    it('forwards ref correctly', async () => {
      const user = userEvent.setup();
      const ref = { current: null };
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel ref={ref}>Label</DropdownMenuLabel>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Trigger'));

      expect(ref.current).not.toBeNull();
    });
  });

  describe('DropdownMenuSeparator', () => {
    it('renders separator', async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
            <DropdownMenuSeparator data-testid="separator" />
            <DropdownMenuItem>Item 2</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Trigger'));

      expect(screen.getByTestId('separator')).toBeInTheDocument();
    });

    it('applies base classes', async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSeparator data-testid="separator" />
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Trigger'));

      const separator = screen.getByTestId('separator');
      expect(separator).toHaveClass('h-px');
      expect(separator).toHaveClass('bg-muted');
    });

    it('applies custom className', async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSeparator className="custom-separator" data-testid="separator" />
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Trigger'));

      expect(screen.getByTestId('separator')).toHaveClass('custom-separator');
    });

    it('forwards ref correctly', async () => {
      const user = userEvent.setup();
      const ref = { current: null };
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSeparator ref={ref} />
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Trigger'));

      expect(ref.current).not.toBeNull();
    });
  });

  describe('DropdownMenuShortcut', () => {
    it('renders shortcut', async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>
              Save
              <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Trigger'));

      expect(screen.getByText('⌘S')).toBeInTheDocument();
    });

    it('applies base classes', async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>
              Save
              <DropdownMenuShortcut data-testid="shortcut">⌘S</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Trigger'));

      const shortcut = screen.getByTestId('shortcut');
      expect(shortcut).toHaveClass('ml-auto');
      expect(shortcut).toHaveClass('text-xs');
    });

    it('applies custom className', async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>
              Save
              <DropdownMenuShortcut className="custom-shortcut" data-testid="shortcut">
                ⌘S
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Trigger'));

      expect(screen.getByTestId('shortcut')).toHaveClass('custom-shortcut');
    });
  });

  describe('DropdownMenu composition', () => {
    it('renders complete dropdown menu', async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>My Account</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              Profile
              <DropdownMenuShortcut>⌘P</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>
              Settings
              <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem checked>Notifications</DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('My Account'));

      expect(screen.getByText('Account')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('⌘P')).toBeInTheDocument();
      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });

    it('handles submenu', async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Action 1</DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>More Options</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Submenu Item</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Trigger'));

      expect(screen.getByText('More Options')).toBeInTheDocument();
    });

    it('handles grouped items', async () => {
      const user = userEvent.setup();
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuItem>Group Item 1</DropdownMenuItem>
              <DropdownMenuItem>Group Item 2</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await user.click(screen.getByText('Trigger'));

      expect(screen.getByText('Group Item 1')).toBeInTheDocument();
      expect(screen.getByText('Group Item 2')).toBeInTheDocument();
    });
  });
});
