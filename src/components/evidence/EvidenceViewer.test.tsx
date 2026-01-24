import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EvidenceViewer } from './EvidenceViewer';

vi.mock('./EvidencePreviewModal', () => ({
  EvidencePreviewModal: () => <div>Modal</div>,
}));

vi.mock('@/lib/driveUtils', () => ({
  parseDriveUrl: () => ({ isValid: true, type: 'document', embedUrl: 'https://test.com' }),
  getDriveTypeIcon: () => '📄',
  getDriveTypeName: () => 'Documento',
}));

describe('EvidenceViewer', () => {
  it('renders no evidence message when url is null', () => {
    render(<EvidenceViewer url={null} />);
    expect(screen.getByText('Sin evidencia adjunta')).toBeInTheDocument();
  });

  it('renders view buttons for valid URL', () => {
    render(<EvidenceViewer url="https://drive.google.com/file/d/test" />);
    expect(screen.getByText('Vista previa')).toBeInTheDocument();
  });

  it('renders compact version', () => {
    render(<EvidenceViewer url="https://drive.google.com/file/d/test" compact />);
    expect(screen.getByText('Ver evidencia')).toBeInTheDocument();
  });
});
