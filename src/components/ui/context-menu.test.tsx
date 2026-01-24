import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
} from './context-menu';

describe('ContextMenu Components', () => {
  describe('ContextMenu', () => {
    it('renders context menu trigger', () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger>Right click me</ContextMenuTrigger>
        </ContextMenu>
      );
      expect(screen.getByText('Right click me')).toBeInTheDocument();
    });

    it('opens on right click', async () => {
      const user = userEvent.setup();
      render(
        <ContextMenu>
          <ContextMenuTrigger>Right click</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>Item 1</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );

      const trigger = screen.getByText('Right click');
      await user.pointer({ keys: '[MouseRight]', target: trigger });

      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });
  });

  describe('ContextMenuTrigger', () => {
    it('renders trigger element', () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger data-testid="trigger">
            Trigger
          </ContextMenuTrigger>
        </ContextMenu>
      );
      expect(screen.getByTestId('trigger')).toBeInTheDocument();
    });

    it('renders as custom element with asChild', () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <button>Custom Button</button>
          </ContextMenuTrigger>
        </ContextMenu>
      );
      expect(screen.getByText('Custom Button')).toBeInTheDocument();
    });
  });

  describe('ContextMenuContent', () => {
    it('renders content when opened', async () => {
      const user = userEvent.setup();
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent data-testid="content">
            <ContextMenuItem>Menu Item</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );

      await user.pointer({ keys: '[MouseRight]', target: screen.getByText('Trigger') });

      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('applies custom className', async () => {
      const user = userEvent.setup();
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent className="custom-content" data-testid="content">
            <ContextMenuItem>Item</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );

      await user.pointer({ keys: '[MouseRight]', target: screen.getByText('Trigger') });

      expect(screen.getByTestId('content')).toHaveClass('custom-content');
    });

    it('forwards ref correctly', async () => {
      const user = userEvent.setup();
      const ref = { current: null };
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent ref={ref}>
            <ContextMenuItem>Item</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );

      await user.pointer({ keys: '[MouseRight]', target: screen.getByText('Trigger') });

      expect(ref.current).not.toBeNull();
    });
  });

  describe('ContextMenuItem', () => {
    it('renders menu item', async () => {
      const user = userEvent.setup();
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>Copy</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );

      await user.pointer({ keys: '[MouseRight]', target: screen.getByText('Trigger') });

      expect(screen.getByText('Copy')).toBeInTheDocument();
    });

    it('handles click event', async () => {
      const user = userEvent.setup();
      const handleSelect = vi.fn();
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onSelect={handleSelect}>Action</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );

      await user.pointer({ keys: '[MouseRight]', target: screen.getByText('Trigger') });
      await user.click(screen.getByText('Action'));

      expect(handleSelect).toHaveBeenCalled();
    });

    it('applies inset prop', async () => {
      const user = userEvent.setup();
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem inset data-testid="item">
              Inset Item
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );

      await user.pointer({ keys: '[MouseRight]', target: screen.getByText('Trigger') });

      expect(screen.getByTestId('item')).toHaveClass('pl-8');
    });

    it('applies custom className', async () => {
      const user = userEvent.setup();
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem className="custom-item" data-testid="item">
              Item
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );

      await user.pointer({ keys: '[MouseRight]', target: screen.getByText('Trigger') });

      expect(screen.getByTestId('item')).toHaveClass('custom-item');
    });

    it('forwards ref correctly', async () => {
      const user = userEvent.setup();
      const ref = { current: null };
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem ref={ref}>Item</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );

      await user.pointer({ keys: '[MouseRight]', target: screen.getByText('Trigger') });

      expect(ref.current).not.toBeNull();
    });
  });

  describe('ContextMenuCheckboxItem', () => {
    it('renders checkbox item', async () => {
      const user = userEvent.setup();
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuCheckboxItem>Show Toolbar</ContextMenuCheckboxItem>
          </ContextMenuContent>
        </ContextMenu>
      );

      await user.pointer({ keys: '[MouseRight]', target: screen.getByText('Trigger') });

      expect(screen.getByText('Show Toolbar')).toBeInTheDocument();
    });

    it('handles checked state', async () => {
      const user = userEvent.setup();
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuCheckboxItem checked data-testid="checkbox">
              Enabled
            </ContextMenuCheckboxItem>
          </ContextMenuContent>
        </ContextMenu>
      );

      await user.pointer({ keys: '[MouseRight]', target: screen.getByText('Trigger') });

      const checkbox = screen.getByTestId('checkbox');
      expect(checkbox).toHaveAttribute('data-state', 'checked');
    });

    it('applies custom className', async () => {
      const user = userEvent.setup();
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuCheckboxItem className="custom-checkbox" data-testid="checkbox">
              Item
            </ContextMenuCheckboxItem>
          </ContextMenuContent>
        </ContextMenu>
      );

      await user.pointer({ keys: '[MouseRight]', target: screen.getByText('Trigger') });

      expect(screen.getByTestId('checkbox')).toHaveClass('custom-checkbox');
    });

    it('forwards ref correctly', async () => {
      const user = userEvent.setup();
      const ref = { current: null };
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuCheckboxItem ref={ref}>Item</ContextMenuCheckboxItem>
          </ContextMenuContent>
        </ContextMenu>
      );

      await user.pointer({ keys: '[MouseRight]', target: screen.getByText('Trigger') });

      expect(ref.current).not.toBeNull();
    });
  });

  describe('ContextMenuRadioItem', () => {
    it('renders radio item', async () => {
      const user = userEvent.setup();
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuRadioGroup>
              <ContextMenuRadioItem value="option1">Option 1</ContextMenuRadioItem>
            </ContextMenuRadioGroup>
          </ContextMenuContent>
        </ContextMenu>
      );

      await user.pointer({ keys: '[MouseRight]', target: screen.getByText('Trigger') });

      expect(screen.getByText('Option 1')).toBeInTheDocument();
    });

    it('handles selection', async () => {
      const user = userEvent.setup();
      const handleValueChange = vi.fn();
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuRadioGroup onValueChange={handleValueChange}>
              <ContextMenuRadioItem value="option1">Option 1</ContextMenuRadioItem>
              <ContextMenuRadioItem value="option2">Option 2</ContextMenuRadioItem>
            </ContextMenuRadioGroup>
          </ContextMenuContent>
        </ContextMenu>
      );

      await user.pointer({ keys: '[MouseRight]', target: screen.getByText('Trigger') });
      await user.click(screen.getByText('Option 1'));

      expect(handleValueChange).toHaveBeenCalledWith('option1');
    });

    it('applies custom className', async () => {
      const user = userEvent.setup();
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuRadioGroup>
              <ContextMenuRadioItem className="custom-radio" data-testid="radio" value="opt">
                Option
              </ContextMenuRadioItem>
            </ContextMenuRadioGroup>
          </ContextMenuContent>
        </ContextMenu>
      );

      await user.pointer({ keys: '[MouseRight]', target: screen.getByText('Trigger') });

      expect(screen.getByTestId('radio')).toHaveClass('custom-radio');
    });

    it('forwards ref correctly', async () => {
      const user = userEvent.setup();
      const ref = { current: null };
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuRadioGroup>
              <ContextMenuRadioItem ref={ref} value="opt">
                Option
              </ContextMenuRadioItem>
            </ContextMenuRadioGroup>
          </ContextMenuContent>
        </ContextMenu>
      );

      await user.pointer({ keys: '[MouseRight]', target: screen.getByText('Trigger') });

      expect(ref.current).not.toBeNull();
    });
  });

  describe('ContextMenuLabel', () => {
    it('renders label', async () => {
      const user = userEvent.setup();
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuLabel>Actions</ContextMenuLabel>
          </ContextMenuContent>
        </ContextMenu>
      );

      await user.pointer({ keys: '[MouseRight]', target: screen.getByText('Trigger') });

      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('applies inset prop', async () => {
      const user = userEvent.setup();
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuLabel inset data-testid="label">
              Label
            </ContextMenuLabel>
          </ContextMenuContent>
        </ContextMenu>
      );

      await user.pointer({ keys: '[MouseRight]', target: screen.getByText('Trigger') });

      expect(screen.getByTestId('label')).toHaveClass('pl-8');
    });

    it('applies custom className', async () => {
      const user = userEvent.setup();
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuLabel className="custom-label" data-testid="label">
              Label
            </ContextMenuLabel>
          </ContextMenuContent>
        </ContextMenu>
      );

      await user.pointer({ keys: '[MouseRight]', target: screen.getByText('Trigger') });

      expect(screen.getByTestId('label')).toHaveClass('custom-label');
    });

    it('forwards ref correctly', async () => {
      const user = userEvent.setup();
      const ref = { current: null };
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuLabel ref={ref}>Label</ContextMenuLabel>
          </ContextMenuContent>
        </ContextMenu>
      );

      await user.pointer({ keys: '[MouseRight]', target: screen.getByText('Trigger') });

      expect(ref.current).not.toBeNull();
    });
  });

  describe('ContextMenuSeparator', () => {
    it('renders separator', async () => {
      const user = userEvent.setup();
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>Item 1</ContextMenuItem>
            <ContextMenuSeparator data-testid="separator" />
            <ContextMenuItem>Item 2</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );

      await user.pointer({ keys: '[MouseRight]', target: screen.getByText('Trigger') });

      expect(screen.getByTestId('separator')).toBeInTheDocument();
    });

    it('applies base classes', async () => {
      const user = userEvent.setup();
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuSeparator data-testid="separator" />
          </ContextMenuContent>
        </ContextMenu>
      );

      await user.pointer({ keys: '[MouseRight]', target: screen.getByText('Trigger') });

      const separator = screen.getByTestId('separator');
      expect(separator).toHaveClass('h-px');
      expect(separator).toHaveClass('bg-border');
    });

    it('applies custom className', async () => {
      const user = userEvent.setup();
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuSeparator className="custom-separator" data-testid="separator" />
          </ContextMenuContent>
        </ContextMenu>
      );

      await user.pointer({ keys: '[MouseRight]', target: screen.getByText('Trigger') });

      expect(screen.getByTestId('separator')).toHaveClass('custom-separator');
    });

    it('forwards ref correctly', async () => {
      const user = userEvent.setup();
      const ref = { current: null };
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuSeparator ref={ref} />
          </ContextMenuContent>
        </ContextMenu>
      );

      await user.pointer({ keys: '[MouseRight]', target: screen.getByText('Trigger') });

      expect(ref.current).not.toBeNull();
    });
  });

  describe('ContextMenuShortcut', () => {
    it('renders shortcut', async () => {
      const user = userEvent.setup();
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>
              Copy
              <ContextMenuShortcut>⌘C</ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );

      await user.pointer({ keys: '[MouseRight]', target: screen.getByText('Trigger') });

      expect(screen.getByText('⌘C')).toBeInTheDocument();
    });

    it('applies base classes', async () => {
      const user = userEvent.setup();
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>
              Copy
              <ContextMenuShortcut data-testid="shortcut">⌘C</ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );

      await user.pointer({ keys: '[MouseRight]', target: screen.getByText('Trigger') });

      const shortcut = screen.getByTestId('shortcut');
      expect(shortcut).toHaveClass('ml-auto');
      expect(shortcut).toHaveClass('text-xs');
    });

    it('applies custom className', async () => {
      const user = userEvent.setup();
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>
              Copy
              <ContextMenuShortcut className="custom-shortcut" data-testid="shortcut">
                ⌘C
              </ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );

      await user.pointer({ keys: '[MouseRight]', target: screen.getByText('Trigger') });

      expect(screen.getByTestId('shortcut')).toHaveClass('custom-shortcut');
    });
  });

  describe('ContextMenu composition', () => {
    it('renders complete context menu', async () => {
      const user = userEvent.setup();
      render(
        <ContextMenu>
          <ContextMenuTrigger>Right click here</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuLabel>Edit</ContextMenuLabel>
            <ContextMenuSeparator />
            <ContextMenuItem>
              Copy
              <ContextMenuShortcut>⌘C</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem>
              Paste
              <ContextMenuShortcut>⌘V</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuCheckboxItem checked>Show Toolbar</ContextMenuCheckboxItem>
          </ContextMenuContent>
        </ContextMenu>
      );

      await user.pointer({ keys: '[MouseRight]', target: screen.getByText('Right click here') });

      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Copy')).toBeInTheDocument();
      expect(screen.getByText('Paste')).toBeInTheDocument();
      expect(screen.getByText('⌘C')).toBeInTheDocument();
      expect(screen.getByText('Show Toolbar')).toBeInTheDocument();
    });

    it('handles submenu', async () => {
      const user = userEvent.setup();
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>Action 1</ContextMenuItem>
            <ContextMenuSub>
              <ContextMenuSubTrigger>More Options</ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuItem>Submenu Item</ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
          </ContextMenuContent>
        </ContextMenu>
      );

      await user.pointer({ keys: '[MouseRight]', target: screen.getByText('Trigger') });

      expect(screen.getByText('More Options')).toBeInTheDocument();
    });

    it('handles grouped items', async () => {
      const user = userEvent.setup();
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuGroup>
              <ContextMenuItem>Group Item 1</ContextMenuItem>
              <ContextMenuItem>Group Item 2</ContextMenuItem>
            </ContextMenuGroup>
          </ContextMenuContent>
        </ContextMenu>
      );

      await user.pointer({ keys: '[MouseRight]', target: screen.getByText('Trigger') });

      expect(screen.getByText('Group Item 1')).toBeInTheDocument();
      expect(screen.getByText('Group Item 2')).toBeInTheDocument();
    });
  });
});
