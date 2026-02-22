import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DemoModeBanner } from './DemoModeBanner';

// Mock DemoModeContext
const mockDisableDemo = vi.fn();

vi.mock('@/contexts/DemoModeContext', () => ({
  useDemoMode: vi.fn(() => ({
    isDemoMode: true,
    disableDemo: mockDisableDemo,
  })),
}));

import { useDemoMode } from '@/contexts/DemoModeContext';

describe('DemoModeBanner', () => {
  beforeEach(() => {
    (useDemoMode as Mock).mockReturnValue({
      isDemoMode: true,
      disableDemo: mockDisableDemo,
    });
    vi.clearAllMocks();
    mockDisableDemo.mockReset();
  });
  it('renders when demo mode is active', () => {
    render(<DemoModeBanner />);
    expect(screen.getByText('Modo Demostración Activo')).toBeInTheDocument();
  });

  it('displays demo mode message', () => {
    render(<DemoModeBanner />);
    expect(screen.getByText(/Estás viendo datos de ejemplo/)).toBeInTheDocument();
  });

  it('renders Eye icon', () => {
    const { container } = render(<DemoModeBanner />);
    const eyeIcon = container.querySelector('.lucide-eye');
    expect(eyeIcon).toBeInTheDocument();
  });

  it('renders exit button', () => {
    render(<DemoModeBanner />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls disableDemo when exit button clicked', async () => {
    const user = userEvent.setup();
    render(<DemoModeBanner />);

    const exitButton = screen.getByRole('button');
    await user.click(exitButton);

    expect(mockDisableDemo).toHaveBeenCalled();
  });

  it('does not render when demo mode is inactive', () => {
    (useDemoMode as Mock).mockReturnValue({
      isDemoMode: false,
      disableDemo: mockDisableDemo,
    });

    const { container } = render(<DemoModeBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('has fixed positioning at top', () => {
    const { container } = render(<DemoModeBanner />);
    const banner = container.firstChild as HTMLElement;
    expect(banner).toHaveClass('fixed');
    expect(banner).toHaveClass('top-0');
  });

  it('uses amber background color', () => {
    const { container } = render(<DemoModeBanner />);
    const banner = container.firstChild as HTMLElement;
    expect(banner).toHaveClass('bg-amber-500');
  });

  it('renders X icon in exit button', () => {
    const { container } = render(<DemoModeBanner />);
    const xIcon = container.querySelector('.lucide-x');
    expect(xIcon).toBeInTheDocument();
  });

  it('shows exit text on larger screens', () => {
    render(<DemoModeBanner />);
    const exitText = screen.getByText('Salir');
    expect(exitText).toHaveClass('hidden');
    expect(exitText).toHaveClass('sm:inline');
  });
});
