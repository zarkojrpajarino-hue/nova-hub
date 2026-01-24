import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from './resizable';

describe('Resizable Components', () => {
  describe('ResizablePanelGroup', () => {
    it('renders panel group', () => {
      const { container } = render(
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel>Panel 1</ResizablePanel>
        </ResizablePanelGroup>
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <ResizablePanelGroup direction="horizontal" className="custom-group">
          <ResizablePanel>Content</ResizablePanel>
        </ResizablePanelGroup>
      );
      expect(container.firstChild).toHaveClass('custom-group');
    });

    it('renders with vertical direction', () => {
      const { container } = render(
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel>Panel 1</ResizablePanel>
        </ResizablePanelGroup>
      );
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('ResizablePanel', () => {
    it('renders panel content', () => {
      const { getByText } = render(
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel>Panel Content</ResizablePanel>
        </ResizablePanelGroup>
      );
      expect(getByText('Panel Content')).toBeInTheDocument();
    });

    it('renders with default size', () => {
      const { getByText } = render(
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={50}>Content</ResizablePanel>
        </ResizablePanelGroup>
      );
      expect(getByText('Content')).toBeInTheDocument();
    });

    it('renders with min/max size', () => {
      const { getByText } = render(
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel minSize={20} maxSize={80}>Content</ResizablePanel>
        </ResizablePanelGroup>
      );
      expect(getByText('Content')).toBeInTheDocument();
    });
  });

  describe('ResizableHandle', () => {
    it('renders handle', () => {
      const { container } = render(
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel>Panel 1</ResizablePanel>
          <ResizableHandle />
          <ResizablePanel>Panel 2</ResizablePanel>
        </ResizablePanelGroup>
      );
      expect(container.querySelector('[data-panel-resize-handle-id]')).toBeInTheDocument();
    });

    it('renders handle with grip icon', () => {
      const { container } = render(
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel>Panel 1</ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel>Panel 2</ResizablePanel>
        </ResizablePanelGroup>
      );
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel>Panel 1</ResizablePanel>
          <ResizableHandle className="custom-handle" />
          <ResizablePanel>Panel 2</ResizablePanel>
        </ResizablePanelGroup>
      );
      expect(container.querySelector('.custom-handle')).toBeInTheDocument();
    });
  });

  describe('Complete Resizable Layout', () => {
    it('renders two-panel layout', () => {
      const { getByText } = render(
        <ResizablePanelGroup direction="horizontal" className="h-[200px]">
          <ResizablePanel defaultSize={50}>
            <div>Left Panel</div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={50}>
            <div>Right Panel</div>
          </ResizablePanel>
        </ResizablePanelGroup>
      );

      expect(getByText('Left Panel')).toBeInTheDocument();
      expect(getByText('Right Panel')).toBeInTheDocument();
    });

    it('renders three-panel layout', () => {
      const { getByText } = render(
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel>Panel 1</ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel>Panel 2</ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel>Panel 3</ResizablePanel>
        </ResizablePanelGroup>
      );

      expect(getByText('Panel 1')).toBeInTheDocument();
      expect(getByText('Panel 2')).toBeInTheDocument();
      expect(getByText('Panel 3')).toBeInTheDocument();
    });

    it('renders vertical layout', () => {
      const { getByText } = render(
        <ResizablePanelGroup direction="vertical" className="h-[400px]">
          <ResizablePanel>Top Panel</ResizablePanel>
          <ResizableHandle />
          <ResizablePanel>Bottom Panel</ResizablePanel>
        </ResizablePanelGroup>
      );

      expect(getByText('Top Panel')).toBeInTheDocument();
      expect(getByText('Bottom Panel')).toBeInTheDocument();
    });
  });
});
