import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NotificationDropdown } from './NotificationDropdown';

// Mock hooks
vi.mock('@/hooks/useNotifications', () => ({
  useNotifications: vi.fn(() => ({ data: [], isLoading: false })),
  useUnreadCount: vi.fn(() => ({ data: 0 })),
  useMarkAsRead: vi.fn(() => ({
    mutate: vi.fn(),
  })),
  useMarkAllAsRead: vi.fn(() => ({
    mutate: vi.fn(),
  })),
}));

vi.mock('@/contexts/NavigationContext', () => ({
  useNavigation: vi.fn(() => ({
    navigate: vi.fn(),
  })),
}));

// Mock date-fns
vi.mock('date-fns', () => ({
  formatDistanceToNow: vi.fn(() => 'hace 2 horas'),
}));

vi.mock('date-fns/locale', () => ({
  es: {},
}));

describe('NotificationDropdown', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <NotificationDropdown />
      </QueryClientProvider>
    );
  };

  it('renders notification button', () => {
    const { container } = renderComponent();
    const button = container.querySelector('button');
    expect(button).toBeInTheDocument();
  });

  it('renders Bell icon', () => {
    const { container } = renderComponent();
    const icon = container.querySelector('.lucide-bell');
    expect(icon).toBeInTheDocument();
  });

  it('does not show unread badge when count is 0', () => {
    const { container } = renderComponent();
    const badge = container.querySelector('.bg-destructive');
    expect(badge).not.toBeInTheDocument();
  });
});
