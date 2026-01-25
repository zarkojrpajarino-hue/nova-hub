import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EvidenceUrlInput } from './EvidenceUrlInput';

// Mock driveUtils
vi.mock('@/lib/driveUtils', () => ({
  parseDriveUrl: vi.fn((url: string) => {
    if (url.includes('drive.google.com')) {
      return {
        isValid: true,
        type: 'file',
        fileId: 'abc123',
        previewUrl: 'https://drive.google.com/file/d/abc123/preview',
        embedUrl: 'https://drive.google.com/file/d/abc123/preview',
        errorMessage: null,
      };
    }
    return {
      isValid: false,
      type: 'unknown',
      fileId: null,
      previewUrl: null,
      embedUrl: null,
      errorMessage: 'No es una URL de Google Drive válida',
    };
  }),
  getDriveTypeIcon: vi.fn(() => '📎'),
  getDriveTypeName: vi.fn(() => 'Archivo'),
}));

// Mock EvidencePreviewModal
vi.mock('./EvidencePreviewModal', () => ({
  EvidencePreviewModal: () => <div data-testid="preview-modal">Preview Modal</div>,
}));

describe('EvidenceUrlInput', () => {
  it('renders label', () => {
    render(<EvidenceUrlInput value="" onChange={vi.fn()} />);
    expect(screen.getByText('Evidencia (URL Google Drive)')).toBeInTheDocument();
  });

  it('renders custom label when provided', () => {
    render(<EvidenceUrlInput value="" onChange={vi.fn()} label="Custom Label" />);
    expect(screen.getByText('Custom Label')).toBeInTheDocument();
  });

  it('shows required indicator when required is true', () => {
    const { container } = render(<EvidenceUrlInput value="" onChange={vi.fn()} required />);
    expect(container.querySelector('.text-destructive')).toBeInTheDocument();
  });

  it('renders input field', () => {
    render(<EvidenceUrlInput value="" onChange={vi.fn()} />);
    expect(screen.getByPlaceholderText(/https:\/\/drive.google.com/)).toBeInTheDocument();
  });

  it('shows help text when input is empty', () => {
    render(<EvidenceUrlInput value="" onChange={vi.fn()} />);
    expect(screen.getByText(/Sube tu evidencia a Google Drive/)).toBeInTheDocument();
  });

  it('calls onChange when typing', async () => {
    const user = userEvent.setup();
    const mockOnChange = vi.fn();
    render(<EvidenceUrlInput value="" onChange={mockOnChange} />);
    
    const input = screen.getByPlaceholderText(/https:\/\/drive.google.com/);
    await user.type(input, 'test');
    
    expect(mockOnChange).toHaveBeenCalled();
  });

  it('displays value in input', () => {
    const testUrl = 'https://drive.google.com/file/d/test123';
    render(<EvidenceUrlInput value={testUrl} onChange={vi.fn()} />);
    
    const input = screen.getByPlaceholderText(/https:\/\/drive.google.com/) as HTMLInputElement;
    expect(input.value).toBe(testUrl);
  });

  it('shows Check icon for valid URL', () => {
    const { container } = render(
      <EvidenceUrlInput value="https://drive.google.com/file/d/test123" onChange={vi.fn()} />
    );
    
    const checkIcon = container.querySelector('.lucide-check');
    expect(checkIcon).toBeInTheDocument();
  });

  it('shows AlertCircle icon for invalid URL', () => {
    const { container } = render(
      <EvidenceUrlInput value="https://example.com" onChange={vi.fn()} />
    );
    
    const alertIcon = container.querySelector('.lucide-alert-circle');
    expect(alertIcon).toBeInTheDocument();
  });
});
