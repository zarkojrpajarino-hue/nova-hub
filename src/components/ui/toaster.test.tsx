import { describe, it, expect, vi } from 'vitest';
import type { Mock } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Toaster } from './toaster';

// Mock the useToast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(),
}));

import { useToast } from '@/hooks/use-toast';

describe('Toaster Component', () => {
  it('renders toaster without toasts', () => {
    (useToast as Mock).mockReturnValue({ toasts: [] });

    const { container } = render(<Toaster />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders single toast', () => {
    (useToast as Mock).mockReturnValue({
      toasts: [
        {
          id: '1',
          title: 'Toast Title',
          description: 'Toast Description',
        },
      ],
    });

    render(<Toaster />);
    expect(screen.getByText('Toast Title')).toBeInTheDocument();
    expect(screen.getByText('Toast Description')).toBeInTheDocument();
  });

  it('renders multiple toasts', () => {
    (useToast as Mock).mockReturnValue({
      toasts: [
        {
          id: '1',
          title: 'First Toast',
          description: 'First Description',
        },
        {
          id: '2',
          title: 'Second Toast',
          description: 'Second Description',
        },
      ],
    });

    render(<Toaster />);
    expect(screen.getByText('First Toast')).toBeInTheDocument();
    expect(screen.getByText('First Description')).toBeInTheDocument();
    expect(screen.getByText('Second Toast')).toBeInTheDocument();
    expect(screen.getByText('Second Description')).toBeInTheDocument();
  });

  it('renders toast with title only', () => {
    (useToast as Mock).mockReturnValue({
      toasts: [
        {
          id: '1',
          title: 'Title Only',
        },
      ],
    });

    render(<Toaster />);
    expect(screen.getByText('Title Only')).toBeInTheDocument();
  });

  it('renders toast with description only', () => {
    (useToast as Mock).mockReturnValue({
      toasts: [
        {
          id: '1',
          description: 'Description Only',
        },
      ],
    });

    render(<Toaster />);
    expect(screen.getByText('Description Only')).toBeInTheDocument();
  });

  it('renders toast with action', () => {
    const action = <button>Action Button</button>;
    (useToast as Mock).mockReturnValue({
      toasts: [
        {
          id: '1',
          title: 'Toast with Action',
          description: 'Description',
          action,
        },
      ],
    });

    render(<Toaster />);
    expect(screen.getByText('Toast with Action')).toBeInTheDocument();
    expect(screen.getByText('Action Button')).toBeInTheDocument();
  });

  it('renders close button for each toast', () => {
    (useToast as Mock).mockReturnValue({
      toasts: [
        {
          id: '1',
          title: 'Toast 1',
        },
        {
          id: '2',
          title: 'Toast 2',
        },
      ],
    });

    const { container } = render(<Toaster />);
    const closeButtons = container.querySelectorAll('[toast-close]');
    expect(closeButtons).toHaveLength(2);
  });

  it('renders viewport', () => {
    (useToast as Mock).mockReturnValue({ toasts: [] });

    const { container } = render(<Toaster />);
    expect(container.querySelector('.fixed')).toBeInTheDocument();
  });

  it('passes props to Toast component', () => {
    (useToast as Mock).mockReturnValue({
      toasts: [
        {
          id: '1',
          title: 'Toast',
          variant: 'destructive',
        },
      ],
    });

    render(<Toaster />);
    expect(screen.getByText('Toast')).toBeInTheDocument();
  });

  it('uses unique keys for toasts', () => {
    (useToast as Mock).mockReturnValue({
      toasts: [
        { id: 'unique-1', title: 'Toast 1' },
        { id: 'unique-2', title: 'Toast 2' },
        { id: 'unique-3', title: 'Toast 3' },
      ],
    });

    render(<Toaster />);
    expect(screen.getByText('Toast 1')).toBeInTheDocument();
    expect(screen.getByText('Toast 2')).toBeInTheDocument();
    expect(screen.getByText('Toast 3')).toBeInTheDocument();
  });

  it('renders empty when no toasts', () => {
    (useToast as Mock).mockReturnValue({ toasts: [] });

    const { container } = render(<Toaster />);
    // Should only have viewport, no toast content
    expect(container.querySelector('[toast-close]')).not.toBeInTheDocument();
  });

  it('renders toast without title or description', () => {
    (useToast as Mock).mockReturnValue({
      toasts: [
        {
          id: '1',
        },
      ],
    });

    const { container } = render(<Toaster />);
    // Toast should render but without title/description
    expect(container.querySelector('[toast-close]')).toBeInTheDocument();
  });

  it('renders toast with custom variant', () => {
    (useToast as Mock).mockReturnValue({
      toasts: [
        {
          id: '1',
          title: 'Custom Variant',
          variant: 'default',
        },
      ],
    });

    render(<Toaster />);
    expect(screen.getByText('Custom Variant')).toBeInTheDocument();
  });

  it('handles toast with all properties', () => {
    const action = <button>Undo</button>;
    (useToast as Mock).mockReturnValue({
      toasts: [
        {
          id: 'complete-toast',
          title: 'Complete Toast',
          description: 'This toast has everything',
          variant: 'destructive',
          action,
        },
      ],
    });

    render(<Toaster />);
    expect(screen.getByText('Complete Toast')).toBeInTheDocument();
    expect(screen.getByText('This toast has everything')).toBeInTheDocument();
    expect(screen.getByText('Undo')).toBeInTheDocument();
  });
});
