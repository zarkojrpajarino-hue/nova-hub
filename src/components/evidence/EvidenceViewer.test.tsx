import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EvidenceViewer } from './EvidenceViewer';

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

describe('EvidenceViewer', () => {
  it('shows message when no URL provided', () => {
    render(<EvidenceViewer url={null} />);
    expect(screen.getByText('Sin evidencia adjunta')).toBeInTheDocument();
  });

  it('renders FileQuestion icon when no URL', () => {
    const { container } = render(<EvidenceViewer url={null} />);
    const icon = container.querySelector('.lucide-file-question');
    expect(icon).toBeInTheDocument();
  });

  it('shows vista previa button for valid Drive URL', () => {
    render(<EvidenceViewer url="https://drive.google.com/file/d/test123" />);
    expect(screen.getByText('Vista previa')).toBeInTheDocument();
  });

  it('shows abrir en Drive button for valid Drive URL', () => {
    render(<EvidenceViewer url="https://drive.google.com/file/d/test123" />);
    expect(screen.getByText('Abrir en Drive')).toBeInTheDocument();
  });

  it('renders Eye icon for vista previa button', () => {
    const { container } = render(<EvidenceViewer url="https://drive.google.com/file/d/test123" />);
    const icon = container.querySelector('.lucide-eye');
    expect(icon).toBeInTheDocument();
  });

  it('renders ExternalLink icon for Drive button', () => {
    const { container } = render(<EvidenceViewer url="https://drive.google.com/file/d/test123" />);
    const icons = container.querySelectorAll('.lucide-external-link');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('renders compact mode correctly', () => {
    render(<EvidenceViewer url="https://drive.google.com/file/d/test123" compact />);
    expect(screen.getByText('Ver evidencia')).toBeInTheDocument();
  });

  it('shows warning for invalid URL format', () => {
    render(<EvidenceViewer url="https://example.com/file" />);
    expect(screen.getByText('Ver enlace (formato no reconocido)')).toBeInTheDocument();
  });

  it('renders AlertTriangle icon for invalid URL', () => {
    const { container } = render(<EvidenceViewer url="https://example.com/file" />);
    // AlertTriangle is aliased to TriangleAlert in lucide-react v0.462, so the class is lucide-triangle-alert
    const icon = container.querySelector('.lucide-triangle-alert');
    expect(icon).toBeInTheDocument();
  });
});
