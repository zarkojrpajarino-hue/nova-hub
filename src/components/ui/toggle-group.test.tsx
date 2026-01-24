import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToggleGroup, ToggleGroupItem } from './toggle-group';

describe('ToggleGroup Components', () => {
  describe('ToggleGroup', () => {
    it('renders toggle group', () => {
      const { container } = render(
        <ToggleGroup type="single">
          <ToggleGroupItem value="a">A</ToggleGroupItem>
        </ToggleGroup>
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders multiple items', () => {
      render(
        <ToggleGroup type="single">
          <ToggleGroupItem value="a">A</ToggleGroupItem>
          <ToggleGroupItem value="b">B</ToggleGroupItem>
          <ToggleGroupItem value="c">C</ToggleGroupItem>
        </ToggleGroup>
      );
      expect(screen.getByText('A')).toBeInTheDocument();
      expect(screen.getByText('B')).toBeInTheDocument();
      expect(screen.getByText('C')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <ToggleGroup type="single" className="custom-group">
          <ToggleGroupItem value="a">A</ToggleGroupItem>
        </ToggleGroup>
      );
      expect(container.firstChild).toHaveClass('custom-group');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(
        <ToggleGroup type="single" ref={ref}>
          <ToggleGroupItem value="a">A</ToggleGroupItem>
        </ToggleGroup>
      );
      expect(ref.current).not.toBeNull();
    });
  });

  describe('ToggleGroupItem', () => {
    it('renders toggle item', () => {
      render(
        <ToggleGroup type="single">
          <ToggleGroupItem value="item">Item</ToggleGroupItem>
        </ToggleGroup>
      );
      expect(screen.getByText('Item')).toBeInTheDocument();
    });

    it('handles click', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(
        <ToggleGroup type="single" onValueChange={onValueChange}>
          <ToggleGroupItem value="a">A</ToggleGroupItem>
        </ToggleGroup>
      );

      await user.click(screen.getByText('A'));
      expect(onValueChange).toHaveBeenCalledWith('a');
    });

    it('applies custom className', () => {
      render(
        <ToggleGroup type="single">
          <ToggleGroupItem value="a" className="custom-item">
            A
          </ToggleGroupItem>
        </ToggleGroup>
      );
      expect(screen.getByText('A')).toHaveClass('custom-item');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(
        <ToggleGroup type="single">
          <ToggleGroupItem value="a" ref={ref}>
            A
          </ToggleGroupItem>
        </ToggleGroup>
      );
      expect(ref.current).not.toBeNull();
    });
  });

  describe('ToggleGroup types', () => {
    it('renders single type', () => {
      render(
        <ToggleGroup type="single">
          <ToggleGroupItem value="a">A</ToggleGroupItem>
          <ToggleGroupItem value="b">B</ToggleGroupItem>
        </ToggleGroup>
      );
      expect(screen.getByText('A')).toBeInTheDocument();
      expect(screen.getByText('B')).toBeInTheDocument();
    });

    it('renders multiple type', () => {
      render(
        <ToggleGroup type="multiple">
          <ToggleGroupItem value="a">A</ToggleGroupItem>
          <ToggleGroupItem value="b">B</ToggleGroupItem>
        </ToggleGroup>
      );
      expect(screen.getByText('A')).toBeInTheDocument();
      expect(screen.getByText('B')).toBeInTheDocument();
    });

    it('handles multiple selection', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(
        <ToggleGroup type="multiple" onValueChange={onValueChange}>
          <ToggleGroupItem value="a">A</ToggleGroupItem>
          <ToggleGroupItem value="b">B</ToggleGroupItem>
        </ToggleGroup>
      );

      await user.click(screen.getByText('A'));
      await user.click(screen.getByText('B'));

      expect(onValueChange).toHaveBeenCalled();
    });
  });

  describe('ToggleGroup variants', () => {
    it('renders with default variant', () => {
      render(
        <ToggleGroup type="single" variant="default">
          <ToggleGroupItem value="a">A</ToggleGroupItem>
        </ToggleGroup>
      );
      expect(screen.getByText('A')).toBeInTheDocument();
    });

    it('renders with outline variant', () => {
      render(
        <ToggleGroup type="single" variant="outline">
          <ToggleGroupItem value="a">A</ToggleGroupItem>
        </ToggleGroup>
      );
      expect(screen.getByText('A')).toBeInTheDocument();
    });
  });

  describe('ToggleGroup sizes', () => {
    it('renders with default size', () => {
      render(
        <ToggleGroup type="single" size="default">
          <ToggleGroupItem value="a">A</ToggleGroupItem>
        </ToggleGroup>
      );
      expect(screen.getByText('A')).toBeInTheDocument();
    });

    it('renders with sm size', () => {
      render(
        <ToggleGroup type="single" size="sm">
          <ToggleGroupItem value="a">A</ToggleGroupItem>
        </ToggleGroup>
      );
      expect(screen.getByText('A')).toBeInTheDocument();
    });

    it('renders with lg size', () => {
      render(
        <ToggleGroup type="single" size="lg">
          <ToggleGroupItem value="a">A</ToggleGroupItem>
        </ToggleGroup>
      );
      expect(screen.getByText('A')).toBeInTheDocument();
    });
  });
});
