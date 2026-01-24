import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from './pagination';

describe('Pagination Components', () => {
  describe('Pagination', () => {
    it('renders pagination nav', () => {
      const { container } = render(
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationLink href="#">1</PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );
      expect(container.querySelector('nav')).toBeInTheDocument();
    });

    it('has correct aria-label', () => {
      const { container } = render(<Pagination><PaginationContent /></Pagination>);
      expect(container.querySelector('nav')).toHaveAttribute('aria-label', 'pagination');
    });
  });

  describe('PaginationContent', () => {
    it('renders as list', () => {
      render(
        <Pagination>
          <PaginationContent data-testid="content" />
        </Pagination>
      );
      expect(screen.getByTestId('content').tagName).toBe('UL');
    });

    it('forwards ref', () => {
      const ref = { current: null };
      render(<Pagination><PaginationContent ref={ref} /></Pagination>);
      expect(ref.current).not.toBeNull();
    });
  });

  describe('PaginationItem', () => {
    it('renders as list item', () => {
      render(
        <Pagination>
          <PaginationContent>
            <PaginationItem data-testid="item">1</PaginationItem>
          </PaginationContent>
        </Pagination>
      );
      expect(screen.getByTestId('item').tagName).toBe('LI');
    });
  });

  describe('PaginationLink', () => {
    it('renders link', () => {
      render(
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationLink href="/page/1">1</PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('applies active state', () => {
      render(
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationLink href="/page/1" isActive>1</PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );
      expect(screen.getByText('1')).toHaveAttribute('aria-current', 'page');
    });

    it('handles click', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationLink href="#" onClick={onClick}>1</PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );
      await user.click(screen.getByText('1'));
      expect(onClick).toHaveBeenCalled();
    });
  });

  describe('PaginationPrevious', () => {
    it('renders previous button', () => {
      render(
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="/page/1" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );
      expect(screen.getByText('Previous')).toBeInTheDocument();
    });

    it('has correct aria-label', () => {
      render(
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );
      expect(screen.getByLabelText('Go to previous page')).toBeInTheDocument();
    });
  });

  describe('PaginationNext', () => {
    it('renders next button', () => {
      render(
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationNext href="/page/2" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );
      expect(screen.getByText('Next')).toBeInTheDocument();
    });
  });

  describe('PaginationEllipsis', () => {
    it('renders ellipsis', () => {
      const { container } = render(
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );
      expect(screen.getByText('More pages')).toBeInTheDocument();
      expect(container.querySelector('[aria-hidden]')).toBeInTheDocument();
    });
  });

  describe('Complete Pagination', () => {
    it('renders full pagination', () => {
      render(
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="/page/1" />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="/page/1">1</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="/page/2" isActive>2</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="/page/3">3</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="/page/10">10</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="/page/3" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );

      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toHaveAttribute('aria-current', 'page');
    });
  });
});
