import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarLabel,
  MenubarShortcut,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent,
} from './menubar';

describe('Menubar Components', () => {
  describe('Menubar', () => {
    it('renders menubar', () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
          </MenubarMenu>
        </Menubar>
      );
      expect(screen.getByText('File')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <Menubar className="custom-menubar">
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
          </MenubarMenu>
        </Menubar>
      );
      expect(container.firstChild).toHaveClass('custom-menubar');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(
        <Menubar ref={ref}>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
          </MenubarMenu>
        </Menubar>
      );
      expect(ref.current).not.toBeNull();
    });
  });

  describe('MenubarMenu with items', () => {
    it('opens on trigger click', async () => {
      const user = userEvent.setup();
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>New File</MenubarItem>
              <MenubarItem>Open</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );

      await user.click(screen.getByText('File'));
      expect(screen.getByText('New File')).toBeInTheDocument();
    });

    it('renders menu with separator', async () => {
      const user = userEvent.setup();
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>Edit</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Cut</MenubarItem>
              <MenubarSeparator />
              <MenubarItem>Copy</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );

      await user.click(screen.getByText('Edit'));
      expect(screen.getByText('Cut')).toBeInTheDocument();
      expect(screen.getByText('Copy')).toBeInTheDocument();
    });
  });

  describe('MenubarCheckboxItem', () => {
    it('renders checkbox item', async () => {
      const user = userEvent.setup();
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>View</MenubarTrigger>
            <MenubarContent>
              <MenubarCheckboxItem checked={false}>Show Toolbar</MenubarCheckboxItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );

      await user.click(screen.getByText('View'));
      expect(screen.getByText('Show Toolbar')).toBeInTheDocument();
    });

    it('handles checked state', async () => {
      const user = userEvent.setup();
      const onCheckedChange = vi.fn();
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>View</MenubarTrigger>
            <MenubarContent>
              <MenubarCheckboxItem checked={true} onCheckedChange={onCheckedChange}>
                Toolbar
              </MenubarCheckboxItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );

      await user.click(screen.getByText('View'));
      expect(screen.getByText('Toolbar')).toBeInTheDocument();
    });
  });

  describe('MenubarRadioGroup', () => {
    it('renders radio items', async () => {
      const user = userEvent.setup();
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>Theme</MenubarTrigger>
            <MenubarContent>
              <MenubarRadioGroup value="light">
                <MenubarRadioItem value="light">Light</MenubarRadioItem>
                <MenubarRadioItem value="dark">Dark</MenubarRadioItem>
              </MenubarRadioGroup>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );

      await user.click(screen.getByText('Theme'));
      expect(screen.getByText('Light')).toBeInTheDocument();
      expect(screen.getByText('Dark')).toBeInTheDocument();
    });
  });

  describe('MenubarLabel', () => {
    it('renders label', async () => {
      const user = userEvent.setup();
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>Menu</MenubarTrigger>
            <MenubarContent>
              <MenubarLabel>Actions</MenubarLabel>
              <MenubarItem>Action 1</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );

      await user.click(screen.getByText('Menu'));
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });
  });

  describe('MenubarShortcut', () => {
    it('renders shortcut', async () => {
      const user = userEvent.setup();
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>
                Save
                <MenubarShortcut>⌘S</MenubarShortcut>
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );

      await user.click(screen.getByText('File'));
      expect(screen.getByText('⌘S')).toBeInTheDocument();
    });
  });

  describe('MenubarSub', () => {
    it('renders submenu', async () => {
      const user = userEvent.setup();
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarSub>
                <MenubarSubTrigger>Recent</MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarItem>file1.txt</MenubarItem>
                  <MenubarItem>file2.txt</MenubarItem>
                </MenubarSubContent>
              </MenubarSub>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );

      await user.click(screen.getByText('File'));
      expect(screen.getByText('Recent')).toBeInTheDocument();
    });
  });

  describe('Complete Menubar', () => {
    it('renders complete menubar with multiple menus', () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>Edit</MenubarTrigger>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>View</MenubarTrigger>
          </MenubarMenu>
        </Menubar>
      );

      expect(screen.getByText('File')).toBeInTheDocument();
      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('View')).toBeInTheDocument();
    });
  });
});
