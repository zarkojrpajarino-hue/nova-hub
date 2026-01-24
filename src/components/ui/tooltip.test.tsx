import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './tooltip';

describe('Tooltip Components', () => {
  describe('Basic rendering', () => {
    it('renders tooltip trigger', () => {
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>Hover me</TooltipTrigger>
          </Tooltip>
        </TooltipProvider>
      );
      expect(screen.getByText('Hover me')).toBeInTheDocument();
    });

    it('renders tooltip with trigger and content structure', () => {
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>Trigger</TooltipTrigger>
            <TooltipContent>Tooltip text</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
      expect(screen.getByText('Trigger')).toBeInTheDocument();
    });
  });

  describe('TooltipContent', () => {
    it('applies base classes when open', () => {
      render(
        <TooltipProvider>
          <Tooltip open>
            <TooltipTrigger>Hover</TooltipTrigger>
            <TooltipContent data-testid="content">Content</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      const content = screen.getByTestId('content');
      expect(content).toHaveClass('z-50');
      expect(content).toHaveClass('rounded-md');
      expect(content).toHaveClass('border');
      expect(content).toHaveClass('bg-popover');
    });

    it('applies custom className', () => {
      render(
        <TooltipProvider>
          <Tooltip open>
            <TooltipTrigger>Hover</TooltipTrigger>
            <TooltipContent className="custom-tooltip" data-testid="content">
              Content
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      const content = screen.getByTestId('content');
      expect(content).toHaveClass('custom-tooltip');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(
        <TooltipProvider>
          <Tooltip open>
            <TooltipTrigger>Hover</TooltipTrigger>
            <TooltipContent ref={ref}>Content</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
      expect(ref.current).not.toBeNull();
    });
  });

  describe('TooltipProvider', () => {
    it('wraps tooltip components', () => {
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>Test</TooltipTrigger>
          </Tooltip>
        </TooltipProvider>
      );
      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it('supports multiple tooltips', () => {
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>First</TooltipTrigger>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger>Second</TooltipTrigger>
          </Tooltip>
        </TooltipProvider>
      );
      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
    });
  });

  describe('Tooltip composition', () => {
    it('renders tooltip structure with button trigger', () => {
      render(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger data-testid="trigger">
              <button>Action Button</button>
            </TooltipTrigger>
            <TooltipContent>Helper text</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      expect(screen.getByTestId('trigger')).toBeInTheDocument();
      expect(screen.getByText('Action Button')).toBeInTheDocument();
    });
  });
});
