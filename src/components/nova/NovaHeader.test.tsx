import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NovaHeader } from './NovaHeader';

// Mock dependencies
const mockOpenSearch = vi.fn();
const mockIsMobile = vi.fn(() => false);

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => mockIsMobile(),
}));

vi.mock('@/contexts/SearchContext', () => ({
  useSearch: () => ({
    open: mockOpenSearch,
    close: vi.fn(),
    isOpen: false,
  }),
}));

vi.mock('@/components/notifications/NotificationCenterV2', () => ({
  NotificationCenterV2: () => <div data-testid="notification-dropdown">Notifications</div>,
}));

vi.mock('@/components/navigation/BackButton', () => ({
  BackButton: ({ onClick }: { onClick: () => void }) => <button onClick={onClick}>Back</button>,
}));

describe('NovaHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsMobile.mockReturnValue(false);
  });

  it('renders title correctly', () => {
    render(<NovaHeader title="Dashboard" />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(<NovaHeader title="Dashboard" subtitle="Overview of your projects" />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Overview of your projects')).toBeInTheDocument();
  });

  it('does not render subtitle when not provided', () => {
    render(<NovaHeader title="Dashboard" />);

    const subtitle = screen.queryByText(/Overview/);
    expect(subtitle).not.toBeInTheDocument();
  });

  it('opens search when search button is clicked', () => {
    render(<NovaHeader title="Dashboard" />);

    const searchButton = screen.getByRole('button', { name: /buscar/i });
    fireEvent.click(searchButton);

    expect(mockOpenSearch).toHaveBeenCalledTimes(1);
  });

  it('calls onNewOBV when Nueva OBV button is clicked', () => {
    const mockOnNewOBV = vi.fn();
    render(<NovaHeader title="Dashboard" onNewOBV={mockOnNewOBV} />);

    const obvButton = screen.getByRole('button', { name: /nueva obv/i });
    fireEvent.click(obvButton);

    expect(mockOnNewOBV).toHaveBeenCalledTimes(1);
  });

  it('renders notification dropdown', () => {
    render(<NovaHeader title="Dashboard" />);

    expect(screen.getByTestId('notification-dropdown')).toBeInTheDocument();
  });

  it('displays search keyboard shortcut on desktop', () => {
    render(<NovaHeader title="Dashboard" />);

    expect(screen.getByText('⌘K')).toBeInTheDocument();
  });

  it('applies mobile styles when on mobile', () => {
    mockIsMobile.mockReturnValue(true);
    const { container } = render(<NovaHeader title="Dashboard" />);

    // Check that header has mobile padding class
    const header = container.querySelector('header');
    expect(header?.className).toContain('pl-16');
  });

  it('does not apply mobile styles on desktop', () => {
    mockIsMobile.mockReturnValue(false);
    const { container } = render(<NovaHeader title="Dashboard" />);

    const header = container.querySelector('header');
    expect(header?.className).not.toContain('pl-16');
  });
});
