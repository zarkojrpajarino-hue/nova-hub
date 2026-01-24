import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from './navigation-menu';

describe('NavigationMenu Components', () => {
  describe('NavigationMenu', () => {
    it('renders navigation menu', () => {
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink href="/">Home</NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );
      expect(screen.getByText('Home')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <NavigationMenu className="custom-nav">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink href="/">Home</NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );
      expect(container.firstChild).toHaveClass('custom-nav');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(
        <NavigationMenu ref={ref}>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink href="/">Home</NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );
      expect(ref.current).not.toBeNull();
    });
  });

  describe('NavigationMenuList', () => {
    it('renders list', () => {
      render(
        <NavigationMenu>
          <NavigationMenuList data-testid="nav-list">
            <NavigationMenuItem>
              <NavigationMenuLink href="/">Home</NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );
      expect(screen.getByTestId('nav-list')).toBeInTheDocument();
    });

    it('renders multiple items', () => {
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink href="/">Home</NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink href="/about">About</NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('About')).toBeInTheDocument();
    });
  });

  describe('NavigationMenuTrigger', () => {
    it('renders trigger', () => {
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Products</NavigationMenuTrigger>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );
      expect(screen.getByText('Products')).toBeInTheDocument();
    });

    it('opens content on click', async () => {
      const user = userEvent.setup();
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Products</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div>Product 1</div>
                <div>Product 2</div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );

      await user.click(screen.getByText('Products'));
      expect(screen.getByText('Product 1')).toBeInTheDocument();
      expect(screen.getByText('Product 2')).toBeInTheDocument();
    });

    it('renders chevron icon', () => {
      const { container } = render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Menu</NavigationMenuTrigger>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );
      expect(container.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('NavigationMenuContent', () => {
    it('renders content when trigger is clicked', async () => {
      const user = userEvent.setup();
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Services</NavigationMenuTrigger>
              <NavigationMenuContent data-testid="nav-content">
                <div>Service 1</div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );

      await user.click(screen.getByText('Services'));
      expect(screen.getByTestId('nav-content')).toBeInTheDocument();
    });

    it('applies custom className', async () => {
      const user = userEvent.setup();
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Menu</NavigationMenuTrigger>
              <NavigationMenuContent className="custom-content" data-testid="nav-content">
                Content
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );

      await user.click(screen.getByText('Menu'));
      expect(screen.getByTestId('nav-content')).toHaveClass('custom-content');
    });
  });

  describe('NavigationMenuLink', () => {
    it('renders link', () => {
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink href="/docs">Documentation</NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );
      expect(screen.getByText('Documentation')).toBeInTheDocument();
    });

    it('applies href attribute', () => {
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink href="/contact">Contact</NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );
      const link = screen.getByText('Contact');
      expect(link).toHaveAttribute('href', '/contact');
    });
  });

  describe('navigationMenuTriggerStyle', () => {
    it('returns trigger style classes', () => {
      const styles = navigationMenuTriggerStyle();
      expect(typeof styles).toBe('string');
      expect(styles).toContain('group');
    });
  });

  describe('Complete NavigationMenu', () => {
    it('renders complete navigation with multiple items', () => {
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink href="/">Home</NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Products</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="p-4">
                  <p>Product A</p>
                  <p>Product B</p>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink href="/about">About</NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Products')).toBeInTheDocument();
      expect(screen.getByText('About')).toBeInTheDocument();
    });

    it('renders navigation with links using trigger style', () => {
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink href="/docs" className={navigationMenuTriggerStyle()}>
                Docs
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );

      expect(screen.getByText('Docs')).toBeInTheDocument();
    });
  });
});
