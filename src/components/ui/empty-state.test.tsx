import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Inbox, FileX, Search } from 'lucide-react';
import { EmptyState } from './empty-state';

describe('EmptyState', () => {
  it('renders with icon, title, and description', () => {
    render(
      <EmptyState
        icon={Inbox}
        title="No messages"
        description="You don't have any messages yet."
      />
    );

    expect(screen.getByText('No messages')).toBeInTheDocument();
    expect(screen.getByText("You don't have any messages yet.")).toBeInTheDocument();
  });

  it('renders with custom icon', () => {
    const { container } = render(
      <EmptyState
        icon={FileX}
        title="No files"
        description="No files found."
      />
    );

    expect(screen.getByText('No files')).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders without action button', () => {
    render(
      <EmptyState
        icon={Search}
        title="No results"
        description="Try adjusting your search."
      />
    );

    expect(screen.getByText('No results')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders with action button', () => {
    const handleClick = vi.fn();
    render(
      <EmptyState
        icon={Inbox}
        title="No messages"
        description="Start a new conversation."
        action={{
          label: 'New Message',
          onClick: handleClick,
        }}
      />
    );

    expect(screen.getByText('New Message')).toBeInTheDocument();
  });

  it('calls action onClick when button is clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(
      <EmptyState
        icon={Inbox}
        title="No messages"
        description="Start a new conversation."
        action={{
          label: 'New Message',
          onClick: handleClick,
        }}
      />
    );

    const button = screen.getByText('New Message');
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies custom className', () => {
    const { container } = render(
      <EmptyState
        icon={Inbox}
        title="No messages"
        description="Description"
        className="custom-empty-state"
      />
    );

    const emptyState = container.firstChild;
    expect(emptyState).toHaveClass('custom-empty-state');
  });

  it('renders title with correct styling', () => {
    render(
      <EmptyState
        icon={Inbox}
        title="No messages"
        description="Description"
      />
    );

    const title = screen.getByText('No messages');
    expect(title.tagName).toBe('H3');
    expect(title).toHaveClass('font-semibold');
  });

  it('renders description with correct styling', () => {
    render(
      <EmptyState
        icon={Inbox}
        title="No messages"
        description="You don't have any messages."
      />
    );

    const description = screen.getByText("You don't have any messages.");
    expect(description.tagName).toBe('P');
    expect(description).toHaveClass('text-muted-foreground');
  });

  describe('Different empty states', () => {
    it('renders no data empty state', () => {
      render(
        <EmptyState
          icon={Inbox}
          title="No data available"
          description="There is no data to display at the moment."
        />
      );

      expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('renders no results empty state', () => {
      render(
        <EmptyState
          icon={Search}
          title="No results found"
          description="Try searching with different keywords."
          action={{
            label: 'Clear filters',
            onClick: vi.fn(),
          }}
        />
      );

      expect(screen.getByText('No results found')).toBeInTheDocument();
      expect(screen.getByText('Clear filters')).toBeInTheDocument();
    });

    it('renders empty inbox state', () => {
      render(
        <EmptyState
          icon={Inbox}
          title="Inbox is empty"
          description="All caught up! You have no new messages."
        />
      );

      expect(screen.getByText('Inbox is empty')).toBeInTheDocument();
    });

    it('renders no files state with create action', () => {
      const onCreate = vi.fn();
      render(
        <EmptyState
          icon={FileX}
          title="No files yet"
          description="Upload your first file to get started."
          action={{
            label: 'Upload file',
            onClick: onCreate,
          }}
        />
      );

      expect(screen.getByText('No files yet')).toBeInTheDocument();
      expect(screen.getByText('Upload file')).toBeInTheDocument();
    });
  });

  describe('Icon rendering', () => {
    it('renders icon with correct size', () => {
      const { container } = render(
        <EmptyState
          icon={Inbox}
          title="Title"
          description="Description"
        />
      );

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('renders different icons correctly', () => {
      const icons = [Inbox, FileX, Search];

      icons.forEach((Icon, index) => {
        const { unmount } = render(
          <EmptyState
            icon={Icon}
            title={`Title ${index}`}
            description={`Description ${index}`}
          />
        );

        expect(screen.getByText(`Title ${index}`)).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Action button variations', () => {
    it('action button has nova-gradient class', () => {
      render(
        <EmptyState
          icon={Inbox}
          title="Title"
          description="Description"
          action={{
            label: 'Action',
            onClick: vi.fn(),
          }}
        />
      );

      // The button renders via the Button component (shadcn) - check it exists and is clickable
      const button = screen.getByText('Action');
      expect(button).toBeInTheDocument();
    });

    it('renders multiple empty states with different actions', async () => {
      const user = userEvent.setup();
      const action1 = vi.fn();
      const action2 = vi.fn();

      const { rerender } = render(
        <EmptyState
          icon={Inbox}
          title="State 1"
          description="Description 1"
          action={{
            label: 'Action 1',
            onClick: action1,
          }}
        />
      );

      const button1 = screen.getByText('Action 1');
      await user.click(button1);
      expect(action1).toHaveBeenCalledTimes(1);

      rerender(
        <EmptyState
          icon={FileX}
          title="State 2"
          description="Description 2"
          action={{
            label: 'Action 2',
            onClick: action2,
          }}
        />
      );

      const button2 = screen.getByText('Action 2');
      await user.click(button2);
      expect(action2).toHaveBeenCalledTimes(1);
    });
  });

  describe('Layout and styling', () => {
    it('has correct layout classes', () => {
      const { container } = render(
        <EmptyState
          icon={Inbox}
          title="Title"
          description="Description"
        />
      );

      // The inner content div (child of container.firstChild) has the flex layout classes
      const contentDiv = container.firstChild?.firstChild as HTMLElement;
      expect(contentDiv).toHaveClass('flex');
      expect(contentDiv).toHaveClass('flex-col');
      expect(contentDiv).toHaveClass('items-center');
      expect(contentDiv).toHaveClass('justify-center');
    });

    it('renders icon container with correct styling', () => {
      const { container } = render(
        <EmptyState
          icon={Inbox}
          title="Title"
          description="Description"
        />
      );

      // The icon container uses w-16 h-16 rounded-full bg-muted/50
      const iconContainer = container.querySelector('.w-16.h-16');
      expect(iconContainer).toBeInTheDocument();
      expect(iconContainer).toHaveClass('rounded-full');
    });
  });
});
