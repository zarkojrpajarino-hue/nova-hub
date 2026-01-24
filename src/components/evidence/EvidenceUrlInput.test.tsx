import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EvidenceUrlInput } from './EvidenceUrlInput';

vi.mock('@/lib/driveUtils', () => ({
  parseDriveUrl: (url: string) => {
    if (url.includes('drive.google.com/file')) {
      return {
        isValid: true,
        type: 'file',
        previewUrl: 'https://preview.url',
        embedUrl: 'https://embed.url',
      };
    }
    if (url.includes('docs.google.com')) {
      return {
        isValid: true,
        type: 'docs',
        previewUrl: 'https://preview.url',
        embedUrl: 'https://embed.url',
      };
    }
    return { isValid: false, errorMessage: 'URL no válida' };
  },
  getDriveTypeIcon: () => '📄',
  getDriveTypeName: (type: string) => type === 'file' ? 'Archivo' : 'Documento',
}));

vi.mock('./EvidencePreviewModal', () => ({
  EvidencePreviewModal: () => <div>Preview Modal</div>,
}));

describe('EvidenceUrlInput', () => {
  const mockOnChange = vi.fn();

  it('renders label', () => {
    render(<EvidenceUrlInput value="" onChange={mockOnChange} />);
    expect(screen.getByText('Evidencia (URL Google Drive)')).toBeInTheDocument();
  });

  it('renders custom label', () => {
    render(<EvidenceUrlInput value="" onChange={mockOnChange} label="Custom Label" />);
    expect(screen.getByText('Custom Label')).toBeInTheDocument();
  });

  it('shows required asterisk when required', () => {
    render(<EvidenceUrlInput value="" onChange={mockOnChange} required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('renders input field', () => {
    render(<EvidenceUrlInput value="" onChange={mockOnChange} />);
    const input = screen.getByPlaceholderText(/https:\/\/drive.google.com/);
    expect(input).toBeInTheDocument();
  });

  it('calls onChange when typing', async () => {
    const user = userEvent.setup();
    render(<EvidenceUrlInput value="" onChange={mockOnChange} />);
    const input = screen.getByPlaceholderText(/https:\/\/drive.google.com/);

    await user.type(input, 'test');
    expect(mockOnChange).toHaveBeenCalled();
  });

  it('shows help text when empty', () => {
    render(<EvidenceUrlInput value="" onChange={mockOnChange} />);
    expect(screen.getByText(/Sube tu evidencia a Google Drive/)).toBeInTheDocument();
  });

  it('hides help text when has value', () => {
    render(<EvidenceUrlInput value="https://drive.google.com/file/d/test" onChange={mockOnChange} />);
    expect(screen.queryByText(/Sube tu evidencia a Google Drive/)).not.toBeInTheDocument();
  });

  it('shows success indicator for valid URL', async () => {
    const { container } = render(
      <EvidenceUrlInput value="https://drive.google.com/file/d/test" onChange={mockOnChange} />
    );
    await waitFor(() => {
      expect(container.querySelector('.text-success')).toBeInTheDocument();
    });
  });

  it('shows error indicator for invalid URL', async () => {
    const { container } = render(
      <EvidenceUrlInput value="https://invalid.com" onChange={mockOnChange} />
    );
    await waitFor(() => {
      expect(container.querySelector('.text-destructive')).toBeInTheDocument();
    });
  });

  it('shows file type detected message', async () => {
    render(<EvidenceUrlInput value="https://drive.google.com/file/d/test" onChange={mockOnChange} />);
    await waitFor(() => {
      expect(screen.getByText(/Archivo detectado/)).toBeInTheDocument();
    });
  });

  it('shows error message for invalid URL', async () => {
    render(<EvidenceUrlInput value="https://invalid.com" onChange={mockOnChange} />);
    await waitFor(() => {
      expect(screen.getByText('URL no válida')).toBeInTheDocument();
    });
  });

  it('shows preview button for valid URL', async () => {
    render(<EvidenceUrlInput value="https://drive.google.com/file/d/test" onChange={mockOnChange} />);
    await waitFor(() => {
      expect(screen.getByText('Vista previa')).toBeInTheDocument();
    });
  });

  it('shows open in drive button for valid URL', async () => {
    render(<EvidenceUrlInput value="https://drive.google.com/file/d/test" onChange={mockOnChange} />);
    await waitFor(() => {
      expect(screen.getByText('Abrir en Drive')).toBeInTheDocument();
    });
  });

  it('opens preview modal on preview button click', async () => {
    const user = userEvent.setup();
    render(<EvidenceUrlInput value="https://drive.google.com/file/d/test" onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.getByText('Vista previa')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Vista previa'));
    expect(screen.getByText('Preview Modal')).toBeInTheDocument();
  });

  it('applies success border class for valid URL', async () => {
    const { container } = render(
      <EvidenceUrlInput value="https://drive.google.com/file/d/test" onChange={mockOnChange} />
    );
    await waitFor(() => {
      const input = container.querySelector('input');
      expect(input).toHaveClass('border-success');
    });
  });

  it('applies destructive border class for invalid URL', async () => {
    const { container } = render(
      <EvidenceUrlInput value="https://invalid.com" onChange={mockOnChange} />
    );
    await waitFor(() => {
      const input = container.querySelector('input');
      expect(input).toHaveClass('border-destructive');
    });
  });
});
