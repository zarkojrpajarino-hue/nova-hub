import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EvidencePreviewModal } from './EvidencePreviewModal';

describe('EvidencePreviewModal', () => {
  it('renders dialog when open', () => {
    render(
      <EvidencePreviewModal
        open={true}
        onOpenChange={() => {}}
        embedUrl="https://test.com"
        type="doc"
      />
    );
    expect(screen.getByText(/Vista previa/)).toBeInTheDocument();
  });

  it('renders iframe with embedUrl', () => {
    render(
      <EvidencePreviewModal
        open={true}
        onOpenChange={() => {}}
        embedUrl="https://test.com/embed"
        type="sheet"
      />
    );
    // DialogContent uses a Radix UI Portal that renders into document.body,
    // so the iframe is not inside the render container — query document.body instead
    const iframe = document.body.querySelector('iframe');
    expect(iframe).toHaveAttribute('src', 'https://test.com/embed');
  });
});
