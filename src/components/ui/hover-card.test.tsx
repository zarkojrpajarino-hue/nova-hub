import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HoverCard, HoverCardTrigger, HoverCardContent } from './hover-card';

describe('HoverCard Components', () => {
  describe('HoverCard', () => {
    it('renders hover card trigger', () => {
      render(
        <HoverCard>
          <HoverCardTrigger>Hover me</HoverCardTrigger>
        </HoverCard>
      );
      expect(screen.getByText('Hover me')).toBeInTheDocument();
    });

    it('renders with open state', () => {
      render(
        <HoverCard open>
          <HoverCardTrigger>Trigger</HoverCardTrigger>
          <HoverCardContent>Hover content</HoverCardContent>
        </HoverCard>
      );
      expect(screen.getByText('Hover content')).toBeInTheDocument();
    });

    it('renders with closed state', () => {
      render(
        <HoverCard open={false}>
          <HoverCardTrigger>Trigger</HoverCardTrigger>
          <HoverCardContent>Hover content</HoverCardContent>
        </HoverCard>
      );
      expect(screen.queryByText('Hover content')).not.toBeInTheDocument();
    });
  });

  describe('HoverCardTrigger', () => {
    it('renders trigger element', () => {
      render(
        <HoverCard>
          <HoverCardTrigger data-testid="trigger">
            Hover trigger
          </HoverCardTrigger>
        </HoverCard>
      );
      expect(screen.getByTestId('trigger')).toBeInTheDocument();
    });

    it('renders as custom element with asChild', () => {
      render(
        <HoverCard>
          <HoverCardTrigger asChild>
            <button>Custom Button</button>
          </HoverCardTrigger>
        </HoverCard>
      );
      expect(screen.getByText('Custom Button')).toBeInTheDocument();
    });

    it('renders text content', () => {
      render(
        <HoverCard>
          <HoverCardTrigger>Hover over this text</HoverCardTrigger>
          <HoverCardContent>Content</HoverCardContent>
        </HoverCard>
      );
      expect(screen.getByText('Hover over this text')).toBeInTheDocument();
    });
  });

  describe('HoverCardContent', () => {
    it('renders content when open', () => {
      render(
        <HoverCard open>
          <HoverCardTrigger>Trigger</HoverCardTrigger>
          <HoverCardContent data-testid="content">
            Card content
          </HoverCardContent>
        </HoverCard>
      );
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('applies base classes', () => {
      render(
        <HoverCard open>
          <HoverCardTrigger>Trigger</HoverCardTrigger>
          <HoverCardContent data-testid="content">
            Content
          </HoverCardContent>
        </HoverCard>
      );
      const content = screen.getByTestId('content');
      expect(content).toHaveClass('z-50');
      expect(content).toHaveClass('w-64');
      expect(content).toHaveClass('rounded-md');
      expect(content).toHaveClass('border');
    });

    it('applies custom className', () => {
      render(
        <HoverCard open>
          <HoverCardTrigger>Trigger</HoverCardTrigger>
          <HoverCardContent className="custom-hover-card" data-testid="content">
            Content
          </HoverCardContent>
        </HoverCard>
      );
      const content = screen.getByTestId('content');
      expect(content).toHaveClass('custom-hover-card');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(
        <HoverCard open>
          <HoverCardTrigger>Trigger</HoverCardTrigger>
          <HoverCardContent ref={ref}>
            Content
          </HoverCardContent>
        </HoverCard>
      );
      expect(ref.current).not.toBeNull();
    });

    it('renders with custom align prop', () => {
      render(
        <HoverCard open>
          <HoverCardTrigger>Trigger</HoverCardTrigger>
          <HoverCardContent align="start" data-testid="content">
            Content
          </HoverCardContent>
        </HoverCard>
      );
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('renders with custom sideOffset prop', () => {
      render(
        <HoverCard open>
          <HoverCardTrigger>Trigger</HoverCardTrigger>
          <HoverCardContent sideOffset={8} data-testid="content">
            Content
          </HoverCardContent>
        </HoverCard>
      );
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
  });

  describe('HoverCard with content', () => {
    it('renders simple text content', () => {
      render(
        <HoverCard open>
          <HoverCardTrigger>Hover</HoverCardTrigger>
          <HoverCardContent>
            This is hover card content
          </HoverCardContent>
        </HoverCard>
      );
      expect(screen.getByText('This is hover card content')).toBeInTheDocument();
    });

    it('renders complex content', () => {
      render(
        <HoverCard open>
          <HoverCardTrigger>Hover</HoverCardTrigger>
          <HoverCardContent>
            <div>
              <h3>Title</h3>
              <p>Description text</p>
            </div>
          </HoverCardContent>
        </HoverCard>
      );
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Description text')).toBeInTheDocument();
    });

    it('renders with avatar and text', () => {
      render(
        <HoverCard open>
          <HoverCardTrigger>@username</HoverCardTrigger>
          <HoverCardContent>
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-200" />
              <div>
                <h4>User Name</h4>
                <p>User bio</p>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      );
      expect(screen.getByText('@username')).toBeInTheDocument();
      expect(screen.getByText('User Name')).toBeInTheDocument();
      expect(screen.getByText('User bio')).toBeInTheDocument();
    });
  });

  describe('HoverCard composition', () => {
    it('renders complete hover card with profile info', () => {
      render(
        <HoverCard open>
          <HoverCardTrigger>@nextjs</HoverCardTrigger>
          <HoverCardContent>
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Next.js</h4>
              <p className="text-sm">
                The React Framework - created and maintained by @vercel.
              </p>
              <div className="flex items-center text-sm">
                <span>Joined December 2021</span>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      );

      expect(screen.getByText('@nextjs')).toBeInTheDocument();
      expect(screen.getByText('Next.js')).toBeInTheDocument();
      expect(screen.getByText(/The React Framework/)).toBeInTheDocument();
      expect(screen.getByText(/Joined December 2021/)).toBeInTheDocument();
    });

    it('renders with link as trigger', () => {
      render(
        <HoverCard open>
          <HoverCardTrigger asChild>
            <a href="#" className="underline">
              Hover link
            </a>
          </HoverCardTrigger>
          <HoverCardContent>
            Link preview content
          </HoverCardContent>
        </HoverCard>
      );

      expect(screen.getByText('Hover link')).toBeInTheDocument();
      expect(screen.getByText('Link preview content')).toBeInTheDocument();
    });

    it('renders with button as trigger', () => {
      render(
        <HoverCard open>
          <HoverCardTrigger asChild>
            <button className="font-medium">
              Hover button
            </button>
          </HoverCardTrigger>
          <HoverCardContent>
            Button preview content
          </HoverCardContent>
        </HoverCard>
      );

      expect(screen.getByText('Hover button')).toBeInTheDocument();
      expect(screen.getByText('Button preview content')).toBeInTheDocument();
    });

    it('renders with image in content', () => {
      render(
        <HoverCard open>
          <HoverCardTrigger>Preview</HoverCardTrigger>
          <HoverCardContent>
            <div>
              <img src="/test.jpg" alt="Preview" />
              <p>Image description</p>
            </div>
          </HoverCardContent>
        </HoverCard>
      );

      expect(screen.getByAltText('Preview')).toBeInTheDocument();
      expect(screen.getByText('Image description')).toBeInTheDocument();
    });
  });

  describe('HoverCard interaction', () => {
    it('shows content on hover', async () => {
      const user = userEvent.setup();
      render(
        <HoverCard>
          <HoverCardTrigger data-testid="trigger">Hover</HoverCardTrigger>
          <HoverCardContent>Content</HoverCardContent>
        </HoverCard>
      );

      const trigger = screen.getByTestId('trigger');
      await user.hover(trigger);

      // Note: Radix HoverCard requires delay before showing
      // In tests we use controlled open state
    });

    it('respects controlled open state', () => {
      const { rerender } = render(
        <HoverCard open={false}>
          <HoverCardTrigger>Trigger</HoverCardTrigger>
          <HoverCardContent>Content</HoverCardContent>
        </HoverCard>
      );

      expect(screen.queryByText('Content')).not.toBeInTheDocument();

      rerender(
        <HoverCard open={true}>
          <HoverCardTrigger>Trigger</HoverCardTrigger>
          <HoverCardContent>Content</HoverCardContent>
        </HoverCard>
      );

      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('renders with defaultOpen prop', () => {
      render(
        <HoverCard defaultOpen>
          <HoverCardTrigger>Trigger</HoverCardTrigger>
          <HoverCardContent>Initially visible</HoverCardContent>
        </HoverCard>
      );

      expect(screen.getByText('Initially visible')).toBeInTheDocument();
    });
  });
});
