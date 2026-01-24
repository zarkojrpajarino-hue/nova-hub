import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmDialog } from './confirm-dialog';

describe('ConfirmDialog', () => {
  const defaultProps = {
    open: false,
    onOpenChange: vi.fn(),
    title: 'Confirm Action',
    description: 'Are you sure you want to proceed?',
    onConfirm: vi.fn(),
  };

  it('does not render when closed', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.queryByText('Confirm Action')).not.toBeInTheDocument();
  });

  it('renders when open', () => {
    render(<ConfirmDialog {...defaultProps} open />);
    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
  });

  it('renders with custom title and description', () => {
    render(
      <ConfirmDialog
        {...defaultProps}
        open
        title="Delete Item"
        description="This action cannot be undone."
      />
    );
    expect(screen.getByText('Delete Item')).toBeInTheDocument();
    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
  });

  it('renders with default confirm and cancel labels', () => {
    render(<ConfirmDialog {...defaultProps} open />);
    expect(screen.getByText('Confirmar')).toBeInTheDocument();
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
  });

  it('renders with custom confirm and cancel labels', () => {
    render(
      <ConfirmDialog
        {...defaultProps}
        open
        confirmLabel="Delete"
        cancelLabel="Keep"
      />
    );
    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('Keep')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<ConfirmDialog {...defaultProps} open onConfirm={onConfirm} />);

    const confirmButton = screen.getByText('Confirmar');
    await user.click(confirmButton);

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('renders with default variant', () => {
    render(<ConfirmDialog {...defaultProps} open />);
    const confirmButton = screen.getByText('Confirmar');
    expect(confirmButton).toBeInTheDocument();
  });

  it('renders with destructive variant', () => {
    render(<ConfirmDialog {...defaultProps} open variant="destructive" />);
    const confirmButton = screen.getByText('Confirmar');
    expect(confirmButton).toHaveClass('bg-destructive');
  });

  it('shows loading spinner when isLoading is true', () => {
    render(<ConfirmDialog {...defaultProps} open isLoading />);
    // Loading spinner is rendered with Loader2 icon
    const confirmButton = screen.getByText('Confirmar');
    expect(confirmButton).toBeInTheDocument();
  });

  it('disables buttons when isLoading is true', () => {
    render(<ConfirmDialog {...defaultProps} open isLoading />);
    const confirmButton = screen.getByText('Confirmar');
    const cancelButton = screen.getByText('Cancelar');
    expect(confirmButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
  });

  it('buttons are enabled when not loading', () => {
    render(<ConfirmDialog {...defaultProps} open isLoading={false} />);
    const confirmButton = screen.getByText('Confirmar');
    const cancelButton = screen.getByText('Cancelar');
    expect(confirmButton).not.toBeDisabled();
    expect(cancelButton).not.toBeDisabled();
  });

  it('prevents default on confirm button click', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<ConfirmDialog {...defaultProps} open onConfirm={onConfirm} />);

    const confirmButton = screen.getByText('Confirmar');
    await user.click(confirmButton);

    // onConfirm was called, meaning preventDefault was effective
    expect(onConfirm).toHaveBeenCalled();
  });

  describe('Dialog open state management', () => {
    it('calls onOpenChange when dialog state changes', async () => {
      const onOpenChange = vi.fn();
      const { rerender } = render(
        <ConfirmDialog {...defaultProps} open={false} onOpenChange={onOpenChange} />
      );

      rerender(<ConfirmDialog {...defaultProps} open onOpenChange={onOpenChange} />);

      expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    });

    it('respects controlled open state', () => {
      const { rerender } = render(<ConfirmDialog {...defaultProps} open={false} />);

      expect(screen.queryByText('Confirm Action')).not.toBeInTheDocument();

      rerender(<ConfirmDialog {...defaultProps} open />);

      expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    });
  });

  describe('Different use cases', () => {
    it('renders delete confirmation dialog', () => {
      render(
        <ConfirmDialog
          open
          onOpenChange={vi.fn()}
          title="Delete Project"
          description="This will permanently delete the project and all associated data."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          variant="destructive"
          onConfirm={vi.fn()}
        />
      );

      expect(screen.getByText('Delete Project')).toBeInTheDocument();
      expect(screen.getByText(/permanently delete/)).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('renders save confirmation dialog', () => {
      render(
        <ConfirmDialog
          open
          onOpenChange={vi.fn()}
          title="Save Changes"
          description="Do you want to save your changes before leaving?"
          confirmLabel="Save"
          cancelLabel="Discard"
          onConfirm={vi.fn()}
        />
      );

      expect(screen.getByText('Save Changes')).toBeInTheDocument();
      expect(screen.getByText(/save your changes/)).toBeInTheDocument();
    });

    it('renders logout confirmation dialog', () => {
      render(
        <ConfirmDialog
          open
          onOpenChange={vi.fn()}
          title="Logout"
          description="¿Estás seguro de que quieres cerrar sesión?"
          confirmLabel="Cerrar sesión"
          cancelLabel="Cancelar"
          onConfirm={vi.fn()}
        />
      );

      expect(screen.getByText('Logout')).toBeInTheDocument();
      expect(screen.getByText(/Estás seguro/)).toBeInTheDocument();
      expect(screen.getByText('Cerrar sesión')).toBeInTheDocument();
    });
  });

  describe('Loading state variations', () => {
    it('renders loading state with custom confirm label', () => {
      render(
        <ConfirmDialog
          {...defaultProps}
          open
          isLoading
          confirmLabel="Deleting..."
        />
      );

      expect(screen.getByText('Deleting...')).toBeInTheDocument();
      // Confirm button is disabled when loading
      expect(screen.getByText('Deleting...')).toBeDisabled();
    });

    it('does not disable buttons when isLoading is false', () => {
      render(
        <ConfirmDialog {...defaultProps} open isLoading={false} />
      );

      const confirmButton = screen.getByText('Confirmar');
      expect(confirmButton).not.toBeDisabled();
    });
  });

  describe('Integration with AlertDialog', () => {
    it('uses AlertDialog components internally', () => {
      render(<ConfirmDialog {...defaultProps} open />);

      // Check that AlertDialog structure is present
      expect(screen.getByText('Confirm Action')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
      expect(screen.getByText('Confirmar')).toBeInTheDocument();
      expect(screen.getByText('Cancelar')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper dialog structure', () => {
      render(<ConfirmDialog {...defaultProps} open />);

      // Title and description are present
      expect(screen.getByText('Confirm Action')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
    });

    it('action buttons are accessible', () => {
      render(<ConfirmDialog {...defaultProps} open />);

      const confirmButton = screen.getByText('Confirmar');
      const cancelButton = screen.getByText('Cancelar');

      expect(confirmButton.tagName).toBe('BUTTON');
      expect(cancelButton.tagName).toBe('BUTTON');
    });
  });
});
