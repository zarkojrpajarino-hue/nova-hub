import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from './table';

describe('Table Components', () => {
  describe('Table', () => {
    it('renders table', () => {
      render(
        <Table data-testid="table">
          <TableBody>
            <TableRow>
              <TableCell>Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      expect(screen.getByTestId('table')).toBeInTheDocument();
    });

    it('applies base classes', () => {
      render(<Table data-testid="table" />);
      const table = screen.getByTestId('table');
      expect(table).toHaveClass('w-full');
      expect(table).toHaveClass('caption-bottom');
      expect(table).toHaveClass('text-sm');
    });

    it('applies custom className', () => {
      render(<Table className="custom-table" data-testid="table" />);
      const table = screen.getByTestId('table');
      expect(table).toHaveClass('custom-table');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(<Table ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLTableElement);
    });
  });

  describe('TableHeader', () => {
    it('renders table header', () => {
      render(
        <Table>
          <TableHeader data-testid="header">
            <TableRow>
              <TableHead>Header</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      );
      expect(screen.getByTestId('header')).toBeInTheDocument();
    });

    it('renders as thead element', () => {
      const { container } = render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Header</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      );
      const thead = container.querySelector('thead');
      expect(thead).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <Table>
          <TableHeader className="custom-header" data-testid="header">
            <TableRow>
              <TableHead>Header</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      );
      const header = screen.getByTestId('header');
      expect(header).toHaveClass('custom-header');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(
        <Table>
          <TableHeader ref={ref}>
            <TableRow>
              <TableHead>Header</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      );
      expect(ref.current).toBeInstanceOf(HTMLTableSectionElement);
    });
  });

  describe('TableBody', () => {
    it('renders table body', () => {
      render(
        <Table>
          <TableBody data-testid="body">
            <TableRow>
              <TableCell>Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      expect(screen.getByTestId('body')).toBeInTheDocument();
    });

    it('renders as tbody element', () => {
      const { container } = render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      const tbody = container.querySelector('tbody');
      expect(tbody).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <Table>
          <TableBody className="custom-body" data-testid="body">
            <TableRow>
              <TableCell>Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      const body = screen.getByTestId('body');
      expect(body).toHaveClass('custom-body');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(
        <Table>
          <TableBody ref={ref}>
            <TableRow>
              <TableCell>Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      expect(ref.current).toBeInstanceOf(HTMLTableSectionElement);
    });
  });

  describe('TableFooter', () => {
    it('renders table footer', () => {
      render(
        <Table>
          <TableFooter data-testid="footer">
            <TableRow>
              <TableCell>Footer</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      );
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });

    it('renders as tfoot element', () => {
      const { container } = render(
        <Table>
          <TableFooter>
            <TableRow>
              <TableCell>Footer</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      );
      const tfoot = container.querySelector('tfoot');
      expect(tfoot).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <Table>
          <TableFooter className="custom-footer" data-testid="footer">
            <TableRow>
              <TableCell>Footer</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      );
      const footer = screen.getByTestId('footer');
      expect(footer).toHaveClass('custom-footer');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(
        <Table>
          <TableFooter ref={ref}>
            <TableRow>
              <TableCell>Footer</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      );
      expect(ref.current).toBeInstanceOf(HTMLTableSectionElement);
    });
  });

  describe('TableRow', () => {
    it('renders table row', () => {
      render(
        <Table>
          <TableBody>
            <TableRow data-testid="row">
              <TableCell>Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      expect(screen.getByTestId('row')).toBeInTheDocument();
    });

    it('renders as tr element', () => {
      const { container } = render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      const tr = container.querySelector('tr');
      expect(tr).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <Table>
          <TableBody>
            <TableRow className="custom-row" data-testid="row">
              <TableCell>Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      const row = screen.getByTestId('row');
      expect(row).toHaveClass('custom-row');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(
        <Table>
          <TableBody>
            <TableRow ref={ref}>
              <TableCell>Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      expect(ref.current).toBeInstanceOf(HTMLTableRowElement);
    });
  });

  describe('TableHead', () => {
    it('renders table head cell', () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Header Cell</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      );
      expect(screen.getByText('Header Cell')).toBeInTheDocument();
    });

    it('renders as th element', () => {
      const { container } = render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Header</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      );
      const th = container.querySelector('th');
      expect(th).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="custom-head" data-testid="head">
                Header
              </TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      );
      const head = screen.getByTestId('head');
      expect(head).toHaveClass('custom-head');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead ref={ref}>Header</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      );
      expect(ref.current).toBeInstanceOf(HTMLTableCellElement);
    });
  });

  describe('TableCell', () => {
    it('renders table cell', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Cell Content</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      expect(screen.getByText('Cell Content')).toBeInTheDocument();
    });

    it('renders as td element', () => {
      const { container } = render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      const td = container.querySelector('td');
      expect(td).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell className="custom-cell" data-testid="cell">
                Cell
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      const cell = screen.getByTestId('cell');
      expect(cell).toHaveClass('custom-cell');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell ref={ref}>Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      expect(ref.current).toBeInstanceOf(HTMLTableCellElement);
    });
  });

  describe('TableCaption', () => {
    it('renders table caption', () => {
      render(
        <Table>
          <TableCaption>Table Description</TableCaption>
        </Table>
      );
      expect(screen.getByText('Table Description')).toBeInTheDocument();
    });

    it('renders as caption element', () => {
      const { container } = render(
        <Table>
          <TableCaption>Caption</TableCaption>
        </Table>
      );
      const caption = container.querySelector('caption');
      expect(caption).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <Table>
          <TableCaption className="custom-caption" data-testid="caption">
            Caption
          </TableCaption>
        </Table>
      );
      const caption = screen.getByTestId('caption');
      expect(caption).toHaveClass('custom-caption');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(
        <Table>
          <TableCaption ref={ref}>Caption</TableCaption>
        </Table>
      );
      expect(ref.current).toBeInstanceOf(HTMLTableCaptionElement);
    });
  });

  describe('Table composition', () => {
    it('renders complete table structure', () => {
      render(
        <Table data-testid="table">
          <TableCaption>User List</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>John Doe</TableCell>
              <TableCell>john@example.com</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Jane Smith</TableCell>
              <TableCell>jane@example.com</TableCell>
            </TableRow>
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell>Total: 2 users</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      );

      expect(screen.getByTestId('table')).toBeInTheDocument();
      expect(screen.getByText('User List')).toBeInTheDocument();
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
      expect(screen.getByText('Total: 2 users')).toBeInTheDocument();
    });
  });
});
