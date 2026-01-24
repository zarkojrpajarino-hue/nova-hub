import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  SidebarInput,
} from './sidebar';

describe('Sidebar Components', () => {
  describe('SidebarProvider', () => {
    it('renders sidebar provider', () => {
      const { container } = render(
        <SidebarProvider>
          <div>Content</div>
        </SidebarProvider>
      );
      expect(container.querySelector('.group\\/sidebar-wrapper')).toBeInTheDocument();
    });

    it('renders children', () => {
      render(
        <SidebarProvider>
          <div>Sidebar Content</div>
        </SidebarProvider>
      );
      expect(screen.getByText('Sidebar Content')).toBeInTheDocument();
    });

    it('forwards ref', () => {
      const ref = { current: null };
      render(
        <SidebarProvider ref={ref}>
          <div>Content</div>
        </SidebarProvider>
      );
      expect(ref.current).not.toBeNull();
    });
  });

  describe('Sidebar', () => {
    it('renders sidebar', () => {
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarContent>Content</SidebarContent>
          </Sidebar>
        </SidebarProvider>
      );
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('applies left side by default', () => {
      const { container } = render(
        <SidebarProvider>
          <Sidebar>
            <SidebarContent>Content</SidebarContent>
          </Sidebar>
        </SidebarProvider>
      );
      expect(container.querySelector('[data-side="left"]')).toBeInTheDocument();
    });
  });

  describe('SidebarContent', () => {
    it('renders content', () => {
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarContent>
              <div>Sidebar Content</div>
            </SidebarContent>
          </Sidebar>
        </SidebarProvider>
      );
      expect(screen.getByText('Sidebar Content')).toBeInTheDocument();
    });

    it('forwards ref', () => {
      const ref = { current: null };
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarContent ref={ref}>Content</SidebarContent>
          </Sidebar>
        </SidebarProvider>
      );
      expect(ref.current).not.toBeNull();
    });
  });

  describe('SidebarHeader', () => {
    it('renders header', () => {
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarHeader>
              <div>Header Content</div>
            </SidebarHeader>
          </Sidebar>
        </SidebarProvider>
      );
      expect(screen.getByText('Header Content')).toBeInTheDocument();
    });
  });

  describe('SidebarFooter', () => {
    it('renders footer', () => {
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarFooter>
              <div>Footer Content</div>
            </SidebarFooter>
          </Sidebar>
        </SidebarProvider>
      );
      expect(screen.getByText('Footer Content')).toBeInTheDocument();
    });
  });

  describe('SidebarGroup', () => {
    it('renders group', () => {
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarContent>
              <SidebarGroup>
                <div>Group Content</div>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
        </SidebarProvider>
      );
      expect(screen.getByText('Group Content')).toBeInTheDocument();
    });
  });

  describe('SidebarGroupLabel', () => {
    it('renders group label', () => {
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
        </SidebarProvider>
      );
      expect(screen.getByText('Navigation')).toBeInTheDocument();
    });
  });

  describe('SidebarGroupContent', () => {
    it('renders group content', () => {
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <div>Items</div>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
        </SidebarProvider>
      );
      expect(screen.getByText('Items')).toBeInTheDocument();
    });
  });

  describe('SidebarMenu', () => {
    it('renders menu', () => {
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <div>Menu Item</div>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarContent>
          </Sidebar>
        </SidebarProvider>
      );
      expect(screen.getByText('Menu Item')).toBeInTheDocument();
    });

    it('forwards ref', () => {
      const ref = { current: null };
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarContent>
              <SidebarMenu ref={ref}>
                <SidebarMenuItem>Item</SidebarMenuItem>
              </SidebarMenu>
            </SidebarContent>
          </Sidebar>
        </SidebarProvider>
      );
      expect(ref.current).not.toBeNull();
    });
  });

  describe('SidebarMenuItem', () => {
    it('renders menu item', () => {
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton>Item</SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarContent>
          </Sidebar>
        </SidebarProvider>
      );
      expect(screen.getByText('Item')).toBeInTheDocument();
    });
  });

  describe('SidebarMenuButton', () => {
    it('renders menu button', () => {
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton>Dashboard</SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarContent>
          </Sidebar>
        </SidebarProvider>
      );
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('applies active state', () => {
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive>Active</SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarContent>
          </Sidebar>
        </SidebarProvider>
      );
      expect(screen.getByText('Active')).toHaveAttribute('data-active', 'true');
    });
  });

  describe('SidebarSeparator', () => {
    it('renders separator', () => {
      const { container } = render(
        <SidebarProvider>
          <Sidebar>
            <SidebarContent>
              <SidebarSeparator />
            </SidebarContent>
          </Sidebar>
        </SidebarProvider>
      );
      expect(container.querySelector('[data-sidebar="separator"]')).toBeInTheDocument();
    });
  });

  describe('SidebarInput', () => {
    it('renders input', () => {
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarHeader>
              <SidebarInput placeholder="Search..." />
            </SidebarHeader>
          </Sidebar>
        </SidebarProvider>
      );
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    });

    it('forwards ref', () => {
      const ref = { current: null };
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarHeader>
              <SidebarInput ref={ref} />
            </SidebarHeader>
          </Sidebar>
        </SidebarProvider>
      );
      expect(ref.current).not.toBeNull();
    });
  });

  describe('Complete Sidebar', () => {
    it('renders full sidebar structure', () => {
      render(
        <SidebarProvider>
          <Sidebar>
            <SidebarHeader>
              <div>App Logo</div>
            </SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Main</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton>Dashboard</SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton>Projects</SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
              <div>Footer</div>
            </SidebarFooter>
          </Sidebar>
        </SidebarProvider>
      );

      expect(screen.getByText('App Logo')).toBeInTheDocument();
      expect(screen.getByText('Main')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Projects')).toBeInTheDocument();
      expect(screen.getByText('Footer')).toBeInTheDocument();
    });
  });
});
