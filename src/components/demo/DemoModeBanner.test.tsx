import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DemoModeBanner } from './DemoModeBanner';

// Mock DemoModeContext
const mockDisableDemo = vi.fn();
const mockIsDemoMode = vi.fn(() => true);

vi.mock('@/contexts/DemoModeContext', () => ({
  useDemoMode: () => ({
    isDemoMode: mockIsDemoMode(),
    disableDemo: mockDisableDemo,
  }),
}));

describe('DemoModeBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsDemoMode.mockReturnValue(true);
  });

  it('renders when demo mode is active', () => {
    mockIsDemoMode.mockReturnValue(true);
    render(<DemoModeBanner />);

    expect(screen.getByText('Modo Demostración Activo')).toBeInTheDocument();
  });

  it('does not render when demo mode is inactive', () => {
    mockIsDemoMode.mockReturnValue(false);
    const { container } = render(<DemoModeBanner />);

    expect(container.firstChild).toBeNull();
  });

  it('displays demo mode description on desktop', () => {
    render(<DemoModeBanner />);

    expect(
      screen.getByText(/Estás viendo datos de ejemplo para explorar las funcionalidades/i)
    ).toBeInTheDocument();
  });

  it('calls disableDemo when exit button is clicked', () => {
    render(<DemoModeBanner />);

    const exitButton = screen.getByRole('button');
    fireEvent.click(exitButton);

    expect(mockDisableDemo).toHaveBeenCalledTimes(1);
  });

  it('has correct styling for visibility', () => {
    const { container } = render(<DemoModeBanner />);

    const banner = container.querySelector('div');
    expect(banner?.className).toContain('fixed');
    expect(banner?.className).toContain('top-0');
    expect(banner?.className).toContain('z-[100]');
  });

  it('displays Eye icon', () => {
    const { container } = render(<DemoModeBanner />);

    // Check that lucide Eye icon SVG is rendered
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
