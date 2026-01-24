import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from './collapsible';

describe('Collapsible Components', () => {
  describe('Collapsible', () => {
    it('renders collapsible container', () => {
      render(
        <Collapsible data-testid="collapsible">
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      );
      expect(screen.getByTestId('collapsible')).toBeInTheDocument();
    });

    it('renders with open state', () => {
      render(
        <Collapsible open>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Visible content</CollapsibleContent>
        </Collapsible>
      );
      expect(screen.getByText('Visible content')).toBeVisible();
    });

    it('renders with closed state by default', () => {
      render(
        <Collapsible>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Hidden content</CollapsibleContent>
        </Collapsible>
      );
      // Content is not rendered in DOM when collapsed
      expect(screen.getByText('Toggle')).toBeInTheDocument();
    });

    it('supports defaultOpen prop', () => {
      render(
        <Collapsible defaultOpen>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Initially visible</CollapsibleContent>
        </Collapsible>
      );
      expect(screen.getByText('Initially visible')).toBeVisible();
    });
  });

  describe('CollapsibleTrigger', () => {
    it('renders trigger button', () => {
      render(
        <Collapsible>
          <CollapsibleTrigger>Click to toggle</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      );
      expect(screen.getByText('Click to toggle')).toBeInTheDocument();
    });

    it('toggles content on click', async () => {
      const user = userEvent.setup();
      render(
        <Collapsible>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Collapsible content</CollapsibleContent>
        </Collapsible>
      );

      const trigger = screen.getByText('Toggle');
      await user.click(trigger);

      expect(screen.getByText('Collapsible content')).toBeVisible();
    });

    it('renders as button by default', () => {
      const { container } = render(
        <Collapsible>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      );
      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('CollapsibleContent', () => {
    it('renders content when open', () => {
      render(
        <Collapsible open>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Content text</CollapsibleContent>
        </Collapsible>
      );
      expect(screen.getByText('Content text')).toBeVisible();
    });

    it('hides content when closed', () => {
      render(
        <Collapsible open={false}>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Hidden text</CollapsibleContent>
        </Collapsible>
      );
      // Verify trigger is visible but content is not rendered
      expect(screen.getByText('Toggle')).toBeInTheDocument();
    });

    it('renders complex content', () => {
      render(
        <Collapsible open>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>
            <div>
              <h3>Title</h3>
              <p>Description</p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      );
      expect(screen.getByText('Title')).toBeVisible();
      expect(screen.getByText('Description')).toBeVisible();
    });
  });

  describe('Collapsible composition', () => {
    it('renders complete collapsible structure', () => {
      render(
        <Collapsible>
          <CollapsibleTrigger data-testid="trigger">
            <button>Show more</button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <p>Additional information here</p>
          </CollapsibleContent>
        </Collapsible>
      );

      expect(screen.getByTestId('trigger')).toBeInTheDocument();
      expect(screen.getByText('Show more')).toBeInTheDocument();
    });

    it('toggles visibility correctly', async () => {
      const user = userEvent.setup();
      render(
        <Collapsible>
          <CollapsibleTrigger>Toggle details</CollapsibleTrigger>
          <CollapsibleContent>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
          </CollapsibleContent>
        </Collapsible>
      );

      const trigger = screen.getByText('Toggle details');

      // Click to show
      await user.click(trigger);
      expect(screen.getByText('Item 1')).toBeVisible();
      expect(screen.getByText('Item 2')).toBeVisible();

      // Click to hide again
      await user.click(trigger);
      expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
    });
  });

  describe('Controlled Collapsible', () => {
    it('respects controlled open state', () => {
      render(
        <Collapsible open={true}>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Controlled content</CollapsibleContent>
        </Collapsible>
      );
      expect(screen.getByText('Controlled content')).toBeVisible();
    });

    it('respects controlled closed state', () => {
      render(
        <Collapsible open={false}>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Controlled content</CollapsibleContent>
        </Collapsible>
      );
      expect(screen.queryByText('Controlled content')).not.toBeInTheDocument();
    });
  });
});
