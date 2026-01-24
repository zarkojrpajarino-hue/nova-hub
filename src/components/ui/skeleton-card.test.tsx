import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SkeletonCard, SkeletonTable, SkeletonStats } from './skeleton-card';

describe('Skeleton Components', () => {
  describe('SkeletonCard', () => {
    it('renders skeleton card', () => {
      const { container } = render(<SkeletonCard />);
      expect(container.firstChild).toHaveClass('animate-pulse');
    });

    it('renders with default rows', () => {
      const { container } = render(<SkeletonCard />);
      const spaceContainers = container.querySelectorAll('.space-y-2');
      // Second space-y-2 container has the rows
      const rows = spaceContainers[1].querySelectorAll(':scope > div');
      expect(rows.length).toBe(3);
    });

    it('renders with custom rows', () => {
      const { container } = render(<SkeletonCard rows={5} />);
      const spaceContainers = container.querySelectorAll('.space-y-2');
      // Second space-y-2 container has the rows
      const rows = spaceContainers[1].querySelectorAll(':scope > div');
      expect(rows.length).toBe(5);
    });

    it('applies custom className', () => {
      const { container } = render(<SkeletonCard className="custom-skeleton" />);
      expect(container.firstChild).toHaveClass('custom-skeleton');
    });
  });

  describe('SkeletonTable', () => {
    it('renders skeleton table', () => {
      const { container } = render(<SkeletonTable />);
      expect(container.firstChild).toHaveClass('animate-pulse');
    });

    it('renders with default rows', () => {
      const { container } = render(<SkeletonTable />);
      const rows = container.querySelectorAll('.p-4.border-b');
      expect(rows.length).toBeGreaterThan(0);
    });

    it('renders with custom rows', () => {
      const { container } = render(<SkeletonTable rows={3} />);
      const bodyRows = container.querySelectorAll('.p-4.border-b.last\\:border-0');
      expect(bodyRows.length).toBe(3);
    });

    it('renders table header', () => {
      const { container } = render(<SkeletonTable />);
      const header = container.querySelector('.p-4.border-b.flex.gap-4');
      expect(header).toBeInTheDocument();
    });
  });

  describe('SkeletonStats', () => {
    it('renders skeleton stats', () => {
      const { container } = render(<SkeletonStats />);
      expect(container.querySelector('.grid')).toBeInTheDocument();
    });

    it('renders 6 stat cards', () => {
      const { container } = render(<SkeletonStats />);
      const cards = container.querySelectorAll('.animate-pulse');
      expect(cards.length).toBe(6);
    });

    it('renders grid layout', () => {
      const { container } = render(<SkeletonStats />);
      const grid = container.querySelector('.grid-cols-6');
      expect(grid).toBeInTheDocument();
    });
  });
});
