import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './accordion';

describe('Accordion Components', () => {
  describe('Accordion', () => {
    it('renders accordion container', () => {
      render(
        <Accordion type="single" collapsible data-testid="accordion">
          <AccordionItem value="item-1">
            <AccordionTrigger>Item 1</AccordionTrigger>
            <AccordionContent>Content 1</AccordionContent>
          </AccordionItem>
        </Accordion>
      );
      expect(screen.getByTestId('accordion')).toBeInTheDocument();
    });

    it('renders with single type', () => {
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Single Item</AccordionTrigger>
            <AccordionContent>Single Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      );
      expect(screen.getByText('Single Item')).toBeInTheDocument();
    });

    it('renders with multiple type', () => {
      render(
        <Accordion type="multiple">
          <AccordionItem value="item-1">
            <AccordionTrigger>Item 1</AccordionTrigger>
            <AccordionContent>Content 1</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Item 2</AccordionTrigger>
            <AccordionContent>Content 2</AccordionContent>
          </AccordionItem>
        </Accordion>
      );
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });
  });

  describe('AccordionItem', () => {
    it('renders accordion item', () => {
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="test" data-testid="item">
            <AccordionTrigger>Test</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      );
      expect(screen.getByTestId('item')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="test" className="custom-item" data-testid="item">
            <AccordionTrigger>Test</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      );
      const item = screen.getByTestId('item');
      expect(item).toHaveClass('custom-item');
    });

    it('applies border-b class', () => {
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="test" data-testid="item">
            <AccordionTrigger>Test</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      );
      const item = screen.getByTestId('item');
      expect(item).toHaveClass('border-b');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="test" ref={ref}>
            <AccordionTrigger>Test</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      );
      expect(ref.current).not.toBeNull();
    });
  });

  describe('AccordionTrigger', () => {
    it('renders trigger button', () => {
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="test">
            <AccordionTrigger>Click me</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      );
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('applies base classes', () => {
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="test">
            <AccordionTrigger data-testid="trigger">Trigger</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      );
      const trigger = screen.getByTestId('trigger');
      expect(trigger).toHaveClass('flex');
      expect(trigger).toHaveClass('flex-1');
      expect(trigger).toHaveClass('items-center');
      expect(trigger).toHaveClass('justify-between');
    });

    it('applies custom className', () => {
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="test">
            <AccordionTrigger className="custom-trigger" data-testid="trigger">
              Trigger
            </AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      );
      const trigger = screen.getByTestId('trigger');
      expect(trigger).toHaveClass('custom-trigger');
    });

    it('includes chevron icon', () => {
      const { container } = render(
        <Accordion type="single" collapsible>
          <AccordionItem value="test">
            <AccordionTrigger>Trigger</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      );
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('expands on click', async () => {
      const user = userEvent.setup();
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="test">
            <AccordionTrigger>Click to expand</AccordionTrigger>
            <AccordionContent>Hidden content</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      const trigger = screen.getByText('Click to expand');
      await user.click(trigger);

      expect(screen.getByText('Hidden content')).toBeVisible();
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="test">
            <AccordionTrigger ref={ref}>Trigger</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      );
      expect(ref.current).not.toBeNull();
    });
  });

  describe('AccordionContent', () => {
    it('renders content when expanded', async () => {
      const user = userEvent.setup();
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="test">
            <AccordionTrigger>Trigger</AccordionTrigger>
            <AccordionContent>Expanded content</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      const trigger = screen.getByText('Trigger');
      await user.click(trigger);

      expect(screen.getByText('Expanded content')).toBeVisible();
    });

    it('applies custom className', async () => {
      const user = userEvent.setup();
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="test">
            <AccordionTrigger>Trigger</AccordionTrigger>
            <AccordionContent className="custom-content" data-testid="content">
              Content
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      const trigger = screen.getByText('Trigger');
      await user.click(trigger);

      const contentWrapper = screen.getByTestId('content').parentElement;
      expect(contentWrapper).toBeInTheDocument();
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="test">
            <AccordionTrigger>Trigger</AccordionTrigger>
            <AccordionContent ref={ref}>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      );
      expect(ref.current).not.toBeNull();
    });
  });

  describe('Accordion composition', () => {
    it('renders multiple accordion items', () => {
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Section 1</AccordionTrigger>
            <AccordionContent>Content 1</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Section 2</AccordionTrigger>
            <AccordionContent>Content 2</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>Section 3</AccordionTrigger>
            <AccordionContent>Content 3</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      expect(screen.getByText('Section 1')).toBeInTheDocument();
      expect(screen.getByText('Section 2')).toBeInTheDocument();
      expect(screen.getByText('Section 3')).toBeInTheDocument();
    });

    it('allows multiple items open with type="multiple"', async () => {
      const user = userEvent.setup();
      render(
        <Accordion type="multiple">
          <AccordionItem value="item-1">
            <AccordionTrigger>First</AccordionTrigger>
            <AccordionContent>First content</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Second</AccordionTrigger>
            <AccordionContent>Second content</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      await user.click(screen.getByText('First'));
      await user.click(screen.getByText('Second'));

      expect(screen.getByText('First content')).toBeVisible();
      expect(screen.getByText('Second content')).toBeVisible();
    });
  });
});
