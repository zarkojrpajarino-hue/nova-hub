import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from './breadcrumb';

describe('Breadcrumb Components', () => {
  describe('Breadcrumb', () => {
    it('renders breadcrumb navigation', () => {
      render(<Breadcrumb data-testid="breadcrumb" />);
      expect(screen.getByTestId('breadcrumb')).toBeInTheDocument();
    });

    it('renders as nav element', () => {
      const { container } = render(<Breadcrumb />);
      const nav = container.querySelector('nav');
      expect(nav).toBeInTheDocument();
    });

    it('has correct aria-label', () => {
      render(<Breadcrumb data-testid="breadcrumb" />);
      const breadcrumb = screen.getByTestId('breadcrumb');
      expect(breadcrumb).toHaveAttribute('aria-label', 'breadcrumb');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(<Breadcrumb ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLElement);
    });
  });

  describe('BreadcrumbList', () => {
    it('renders list', () => {
      render(
        <Breadcrumb>
          <BreadcrumbList data-testid="list" />
        </Breadcrumb>
      );
      expect(screen.getByTestId('list')).toBeInTheDocument();
    });

    it('renders as ol element', () => {
      const { container } = render(
        <Breadcrumb>
          <BreadcrumbList />
        </Breadcrumb>
      );
      const ol = container.querySelector('ol');
      expect(ol).toBeInTheDocument();
    });

    it('applies base classes', () => {
      render(
        <Breadcrumb>
          <BreadcrumbList data-testid="list" />
        </Breadcrumb>
      );
      const list = screen.getByTestId('list');
      expect(list).toHaveClass('flex');
      expect(list).toHaveClass('flex-wrap');
      expect(list).toHaveClass('items-center');
    });

    it('applies custom className', () => {
      render(
        <Breadcrumb>
          <BreadcrumbList className="custom-list" data-testid="list" />
        </Breadcrumb>
      );
      const list = screen.getByTestId('list');
      expect(list).toHaveClass('custom-list');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(
        <Breadcrumb>
          <BreadcrumbList ref={ref} />
        </Breadcrumb>
      );
      expect(ref.current).toBeInstanceOf(HTMLOListElement);
    });
  });

  describe('BreadcrumbItem', () => {
    it('renders item', () => {
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem data-testid="item">Item</BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );
      expect(screen.getByTestId('item')).toBeInTheDocument();
    });

    it('renders as li element', () => {
      const { container } = render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>Item</BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );
      const li = container.querySelector('li');
      expect(li).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="custom-item" data-testid="item">
              Item
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );
      const item = screen.getByTestId('item');
      expect(item).toHaveClass('custom-item');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem ref={ref}>Item</BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );
      expect(ref.current).toBeInstanceOf(HTMLLIElement);
    });
  });

  describe('BreadcrumbLink', () => {
    it('renders link', () => {
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );
      expect(screen.getByText('Home')).toBeInTheDocument();
    });

    it('renders as anchor element', () => {
      const { container } = render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );
      const link = container.querySelector('a');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/');
    });

    it('applies custom className', () => {
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink className="custom-link" href="/">
                Home
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );
      const link = screen.getByText('Home');
      expect(link).toHaveClass('custom-link');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink ref={ref} href="/">
                Home
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );
      expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
    });
  });

  describe('BreadcrumbPage', () => {
    it('renders current page', () => {
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Current Page</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );
      expect(screen.getByText('Current Page')).toBeInTheDocument();
    });

    it('renders as span element', () => {
      const { container } = render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Current</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );
      const span = container.querySelector('span');
      expect(span).toBeInTheDocument();
    });

    it('has correct aria attributes', () => {
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage data-testid="page">Current</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );
      const page = screen.getByTestId('page');
      expect(page).toHaveAttribute('role', 'link');
      expect(page).toHaveAttribute('aria-disabled', 'true');
      expect(page).toHaveAttribute('aria-current', 'page');
    });

    it('applies custom className', () => {
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage className="custom-page" data-testid="page">
                Current
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );
      const page = screen.getByTestId('page');
      expect(page).toHaveClass('custom-page');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage ref={ref}>Current</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );
      expect(ref.current).toBeInstanceOf(HTMLSpanElement);
    });
  });

  describe('BreadcrumbSeparator', () => {
    it('renders separator with default icon', () => {
      const { container } = render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbSeparator />
          </BreadcrumbList>
        </Breadcrumb>
      );
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('renders custom separator', () => {
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbSeparator>/</BreadcrumbSeparator>
          </BreadcrumbList>
        </Breadcrumb>
      );
      expect(screen.getByText('/')).toBeInTheDocument();
    });

    it('has correct aria attributes', () => {
      const { container } = render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbSeparator />
          </BreadcrumbList>
        </Breadcrumb>
      );
      const separator = container.querySelector('li[role="presentation"]');
      expect(separator).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('BreadcrumbEllipsis', () => {
    it('renders ellipsis', () => {
      const { container } = render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbEllipsis />
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('has correct aria attributes', () => {
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbEllipsis data-testid="ellipsis" />
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );
      const ellipsis = screen.getByTestId('ellipsis');
      expect(ellipsis).toHaveAttribute('role', 'presentation');
      expect(ellipsis).toHaveAttribute('aria-hidden', 'true');
    });

    it('applies custom className', () => {
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbEllipsis className="custom-ellipsis" data-testid="ellipsis" />
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );
      const ellipsis = screen.getByTestId('ellipsis');
      expect(ellipsis).toHaveClass('custom-ellipsis');
    });
  });

  describe('Breadcrumb composition', () => {
    it('renders complete breadcrumb navigation', () => {
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/docs">Docs</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Components</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Docs')).toBeInTheDocument();
      expect(screen.getByText('Components')).toBeInTheDocument();
    });
  });
});
