import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AspectRatio } from './aspect-ratio';

describe('AspectRatio', () => {
  it('renders with children', () => {
    render(
      <AspectRatio>
        <img src="/test.jpg" alt="Test" />
      </AspectRatio>
    );
    expect(screen.getByAltText('Test')).toBeInTheDocument();
  });

  it('renders with 16/9 ratio', () => {
    render(
      <AspectRatio ratio={16 / 9} data-testid="aspect-ratio">
        <div>Content</div>
      </AspectRatio>
    );
    expect(screen.getByTestId('aspect-ratio')).toBeInTheDocument();
  });

  it('renders with 1/1 ratio', () => {
    render(
      <AspectRatio ratio={1} data-testid="aspect-ratio">
        <div>Square</div>
      </AspectRatio>
    );
    expect(screen.getByTestId('aspect-ratio')).toBeInTheDocument();
  });

  it('renders with 4/3 ratio', () => {
    render(
      <AspectRatio ratio={4 / 3} data-testid="aspect-ratio">
        <div>Content</div>
      </AspectRatio>
    );
    expect(screen.getByTestId('aspect-ratio')).toBeInTheDocument();
  });

  it('wraps image content', () => {
    render(
      <AspectRatio ratio={16 / 9}>
        <img src="/landscape.jpg" alt="Landscape" />
      </AspectRatio>
    );
    const image = screen.getByAltText('Landscape');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/landscape.jpg');
  });

  it('wraps video content', () => {
    render(
      <AspectRatio ratio={16 / 9}>
        <video data-testid="video" src="/video.mp4" />
      </AspectRatio>
    );
    expect(screen.getByTestId('video')).toBeInTheDocument();
  });

  it('wraps div content', () => {
    render(
      <AspectRatio ratio={1}>
        <div data-testid="content">Aspect Ratio Content</div>
      </AspectRatio>
    );
    expect(screen.getByTestId('content')).toBeInTheDocument();
    expect(screen.getByText('Aspect Ratio Content')).toBeInTheDocument();
  });
});
