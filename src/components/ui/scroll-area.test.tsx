import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScrollArea, ScrollBar } from './scroll-area';

describe('ScrollArea Components', () => {
  describe('ScrollArea', () => {
    it('renders scroll area', () => {
      render(
        <ScrollArea data-testid="scroll-area">
          <div>Content</div>
        </ScrollArea>
      );
      expect(screen.getByTestId('scroll-area')).toBeInTheDocument();
    });

    it('applies base classes', () => {
      render(
        <ScrollArea data-testid="scroll-area">
          <div>Content</div>
        </ScrollArea>
      );
      const scrollArea = screen.getByTestId('scroll-area');
      expect(scrollArea).toHaveClass('relative');
      expect(scrollArea).toHaveClass('overflow-hidden');
    });

    it('applies custom className', () => {
      render(
        <ScrollArea className="custom-scroll" data-testid="scroll-area">
          <div>Content</div>
        </ScrollArea>
      );
      const scrollArea = screen.getByTestId('scroll-area');
      expect(scrollArea).toHaveClass('custom-scroll');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(
        <ScrollArea ref={ref}>
          <div>Content</div>
        </ScrollArea>
      );
      expect(ref.current).not.toBeNull();
    });

    it('renders children content', () => {
      render(
        <ScrollArea>
          <div data-testid="content">Scrollable content</div>
        </ScrollArea>
      );
      expect(screen.getByTestId('content')).toBeInTheDocument();
      expect(screen.getByText('Scrollable content')).toBeInTheDocument();
    });

    it('renders with custom height', () => {
      render(
        <ScrollArea className="h-72" data-testid="scroll-area">
          <div>Content</div>
        </ScrollArea>
      );
      const scrollArea = screen.getByTestId('scroll-area');
      expect(scrollArea).toHaveClass('h-72');
    });
  });

  describe('ScrollBar', () => {
    it('renders with scroll area', () => {
      const { container } = render(
        <ScrollArea className="h-72">
          <div>Content</div>
        </ScrollArea>
      );
      // ScrollBar is rendered internally
      expect(container.querySelector('[data-radix-scroll-area-viewport]')).toBeInTheDocument();
    });

    it('works with vertical orientation', () => {
      render(
        <ScrollArea className="h-72">
          <div>Scrollable content</div>
        </ScrollArea>
      );
      expect(screen.getByText('Scrollable content')).toBeInTheDocument();
    });

    it('works with horizontal orientation', () => {
      render(
        <ScrollArea className="w-72">
          <div className="w-96">Wide content</div>
        </ScrollArea>
      );
      expect(screen.getByText('Wide content')).toBeInTheDocument();
    });
  });

  describe('ScrollArea with content', () => {
    it('renders long content', () => {
      render(
        <ScrollArea className="h-48">
          <div>
            {Array.from({ length: 50 }, (_, i) => (
              <p key={i}>Line {i + 1}</p>
            ))}
          </div>
        </ScrollArea>
      );
      expect(screen.getByText('Line 1')).toBeInTheDocument();
      expect(screen.getByText('Line 50')).toBeInTheDocument();
    });

    it('renders with custom scrollbar', () => {
      render(
        <ScrollArea className="h-48">
          <div>Content</div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      );
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('renders multiple paragraphs', () => {
      render(
        <ScrollArea className="h-32">
          <div>
            <p>Paragraph 1</p>
            <p>Paragraph 2</p>
            <p>Paragraph 3</p>
          </div>
        </ScrollArea>
      );
      expect(screen.getByText('Paragraph 1')).toBeInTheDocument();
      expect(screen.getByText('Paragraph 2')).toBeInTheDocument();
      expect(screen.getByText('Paragraph 3')).toBeInTheDocument();
    });
  });

  describe('ScrollArea composition', () => {
    it('renders complete scroll area with both scrollbars', () => {
      render(
        <ScrollArea className="h-72 w-48">
          <div className="p-4">
            <h3>Scrollable Content</h3>
            <p>This content can scroll vertically and horizontally.</p>
          </div>
        </ScrollArea>
      );
      expect(screen.getByText('Scrollable Content')).toBeInTheDocument();
      expect(screen.getByText(/This content can scroll/)).toBeInTheDocument();
    });

    it('wraps table content', () => {
      render(
        <ScrollArea className="h-72">
          <table>
            <thead>
              <tr>
                <th>Header 1</th>
                <th>Header 2</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Cell 1</td>
                <td>Cell 2</td>
              </tr>
            </tbody>
          </table>
        </ScrollArea>
      );
      expect(screen.getByText('Header 1')).toBeInTheDocument();
      expect(screen.getByText('Cell 1')).toBeInTheDocument();
    });
  });
});
