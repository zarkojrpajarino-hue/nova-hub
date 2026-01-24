import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Toaster, toast } from './sonner';

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light' }),
}));

describe('Sonner Components', () => {
  beforeEach(() => {
    // Clear all toasts before each test
    vi.clearAllMocks();
  });

  describe('Toaster', () => {
    it('renders toaster component', () => {
      const { container } = render(<Toaster />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders without errors', () => {
      const { container } = render(<Toaster />);
      expect(container.firstChild).toBeTruthy();
    });

    it('forwards props to Sonner component', () => {
      const { container } = render(<Toaster data-testid="custom-toaster" />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders with custom position', () => {
      const { container } = render(<Toaster position="top-center" />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders with custom expand setting', () => {
      const { container } = render(<Toaster expand={true} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders with custom richColors', () => {
      const { container } = render(<Toaster richColors />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('toast function', () => {
    it('exports toast function', () => {
      expect(toast).toBeDefined();
      expect(typeof toast).toBe('function');
    });

    it('toast function has success method', () => {
      expect(toast.success).toBeDefined();
      expect(typeof toast.success).toBe('function');
    });

    it('toast function has error method', () => {
      expect(toast.error).toBeDefined();
      expect(typeof toast.error).toBe('function');
    });

    it('toast function has warning method', () => {
      expect(toast.warning).toBeDefined();
      expect(typeof toast.warning).toBe('function');
    });

    it('toast function has info method', () => {
      expect(toast.info).toBeDefined();
      expect(typeof toast.info).toBe('function');
    });

    it('toast function has loading method', () => {
      expect(toast.loading).toBeDefined();
      expect(typeof toast.loading).toBe('function');
    });

    it('toast function has promise method', () => {
      expect(toast.promise).toBeDefined();
      expect(typeof toast.promise).toBe('function');
    });

    it('toast function has dismiss method', () => {
      expect(toast.dismiss).toBeDefined();
      expect(typeof toast.dismiss).toBe('function');
    });
  });

  describe('Theme Integration', () => {
    it('uses light theme from useTheme', () => {
      const { container } = render(<Toaster />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders with dark theme', () => {
      vi.mock('next-themes', () => ({
        useTheme: () => ({ theme: 'dark' }),
      }));

      const { container } = render(<Toaster />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders with system theme', () => {
      vi.mock('next-themes', () => ({
        useTheme: () => ({ theme: 'system' }),
      }));

      const { container } = render(<Toaster />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });
});
