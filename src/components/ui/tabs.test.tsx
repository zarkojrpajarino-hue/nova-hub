import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';

describe('Tabs Components', () => {
  describe('Tabs basic rendering', () => {
    it('renders tabs with triggers and content', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      );

      expect(screen.getByText('Tab 1')).toBeInTheDocument();
      expect(screen.getByText('Tab 2')).toBeInTheDocument();
    });

    it('shows default tab content', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      );

      expect(screen.getByText('Content 1')).toBeVisible();
    });
  });

  describe('TabsList', () => {
    it('renders tab list with children', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList data-testid="tabs-list">
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
        </Tabs>
      );

      expect(screen.getByTestId('tabs-list')).toBeInTheDocument();
    });

    it('applies custom className to tab list', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList className="custom-list" data-testid="tabs-list">
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
        </Tabs>
      );

      const tabsList = screen.getByTestId('tabs-list');
      expect(tabsList).toHaveClass('custom-list');
    });

    it('applies base classes to tab list', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList data-testid="tabs-list">
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
        </Tabs>
      );

      const tabsList = screen.getByTestId('tabs-list');
      expect(tabsList).toHaveClass('inline-flex');
      expect(tabsList).toHaveClass('items-center');
      expect(tabsList).toHaveClass('bg-muted');
    });
  });

  describe('TabsTrigger', () => {
    it('renders trigger button', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Click Me</TabsTrigger>
          </TabsList>
        </Tabs>
      );

      expect(screen.getByText('Click Me')).toBeInTheDocument();
    });

    it('applies custom className to trigger', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1" className="custom-trigger">
              Tab 1
            </TabsTrigger>
          </TabsList>
        </Tabs>
      );

      const trigger = screen.getByText('Tab 1');
      expect(trigger).toHaveClass('custom-trigger');
    });

    it('changes tab on click', async () => {
      const user = userEvent.setup();

      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      );

      const tab2 = screen.getByText('Tab 2');
      await user.click(tab2);

      expect(screen.getByText('Content 2')).toBeVisible();
    });

    it('supports disabled state', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1" disabled>
              Disabled Tab
            </TabsTrigger>
          </TabsList>
        </Tabs>
      );

      const trigger = screen.getByText('Disabled Tab');
      expect(trigger).toBeDisabled();
    });
  });

  describe('TabsContent', () => {
    it('renders content for active tab', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Active Content</TabsContent>
        </Tabs>
      );

      expect(screen.getByText('Active Content')).toBeInTheDocument();
    });

    it('applies custom className to content', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1" className="custom-content">
            Content
          </TabsContent>
        </Tabs>
      );

      const content = screen.getByText('Content');
      expect(content).toHaveClass('custom-content');
    });

    it('renders complex content', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">
            <div data-testid="complex-content">
              <h2>Title</h2>
              <p>Paragraph</p>
            </div>
          </TabsContent>
        </Tabs>
      );

      expect(screen.getByTestId('complex-content')).toBeInTheDocument();
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Paragraph')).toBeInTheDocument();
    });
  });

  describe('Tabs controlled state', () => {
    it('respects value prop', () => {
      render(
        <Tabs value="tab2">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      );

      expect(screen.getByText('Content 2')).toBeVisible();
    });

    it('calls onValueChange when tab changes', async () => {
      const user = userEvent.setup();
      const handleValueChange = vi.fn();

      render(
        <Tabs defaultValue="tab1" onValueChange={handleValueChange}>
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      );

      const tab2 = screen.getByText('Tab 2');
      await user.click(tab2);

      expect(handleValueChange).toHaveBeenCalledWith('tab2');
    });
  });

  describe('Tabs with multiple triggers', () => {
    it('renders multiple tabs correctly', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">First</TabsTrigger>
            <TabsTrigger value="tab2">Second</TabsTrigger>
            <TabsTrigger value="tab3">Third</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">First Content</TabsContent>
          <TabsContent value="tab2">Second Content</TabsContent>
          <TabsContent value="tab3">Third Content</TabsContent>
        </Tabs>
      );

      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
      expect(screen.getByText('Third')).toBeInTheDocument();
    });

    it('switches between multiple tabs', async () => {
      const user = userEvent.setup();

      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
          <TabsContent value="tab3">Content 3</TabsContent>
        </Tabs>
      );

      expect(screen.getByText('Content 1')).toBeVisible();

      await user.click(screen.getByText('Tab 2'));
      expect(screen.getByText('Content 2')).toBeVisible();

      await user.click(screen.getByText('Tab 3'));
      expect(screen.getByText('Content 3')).toBeVisible();
    });
  });
});
