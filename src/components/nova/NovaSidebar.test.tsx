import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NovaSidebar } from './NovaSidebar';

// Mock subscription hooks
vi.mock('@/hooks/useSubscription', () => ({
  useFeatureAccess: vi.fn(() => ({
    canUseFeature: vi.fn(() => true),
    isLoading: false,
    plan: 'enterprise',
  })),
  useAvailablePlans: vi.fn(() => []),
}));

// Mock PlanSelectionModal
vi.mock('@/components/subscription/PlanSelectionModal', () => ({
  PlanSelectionModal: () => null,
}));

// Mock useProjectContext to avoid needing real Supabase
vi.mock('@/hooks/useProjectContext', () => ({
  useProjectContext: () => ({
    currentProject: null,
    userRole: null,
    isAdmin: false,
    isLoading: false,
    phaseState: { current_phase: 3 },
    engineData: null,
  }),
}));

// Mock usePhaseFeatures to return Phase 3 (most features visible)
vi.mock('@/hooks/usePhaseFeatures', () => ({
  usePhaseFeatures: () => ({ phase: 3 }),
}));

const mockUser = {
  nombre: 'Juan Pérez',
  color: '#6366F1',
};

const defaultProps = {
  currentView: 'dashboard',
  setCurrentView: vi.fn(),
  currentUser: mockUser,
  onSignOut: vi.fn(),
};

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

function renderSidebar(props = {}) {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/']}>
        <NovaSidebar {...defaultProps} {...props} />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('NovaSidebar', () => {
  it('renders sidebar with aria-label', () => {
    renderSidebar();
    expect(screen.getByLabelText('Navegacion principal')).toBeInTheDocument();
  });

  it('renders OPTIMUS-K brand', () => {
    renderSidebar();
    expect(screen.getByText('OPTIMUS-K')).toBeInTheDocument();
  });

  it('renders BETA badge', () => {
    renderSidebar();
    expect(screen.getByText('BETA')).toBeInTheDocument();
  });

  it('renders logo with correct aria-label', () => {
    renderSidebar();
    const logoIcon = screen.getByLabelText('Logo Optimus-K');
    expect(logoIcon).toBeInTheDocument();
    expect(logoIcon).toHaveTextContent('O');
  });

  it('applies gradient to logo icon', () => {
    renderSidebar();
    const logoIcon = screen.getByLabelText('Logo Optimus-K');
    expect(logoIcon).toHaveClass('optimus-gradient');
  });

  it('renders banner role on logo section', () => {
    const { container } = renderSidebar();
    const banner = container.querySelector('[role="banner"]');
    expect(banner).toBeInTheDocument();
  });

  it('renders navigation with correct aria-label', () => {
    renderSidebar();
    expect(screen.getByLabelText('Menú de navegación')).toBeInTheDocument();
  });

  it('applies fixed positioning', () => {
    const { container } = renderSidebar();
    const sidebar = container.querySelector('aside');
    expect(sidebar).toHaveClass('fixed');
  });

  it('has correct width', () => {
    const { container } = renderSidebar();
    const sidebar = container.querySelector('aside');
    expect(sidebar).toHaveClass('w-64');
  });

  it('renders Dashboard nav item in default open section', async () => {
    renderSidebar();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders Mi Espacio nav item in default open section', () => {
    renderSidebar();
    expect(screen.getByText('Mi Espacio')).toBeInTheDocument();
  });

  it('renders Mi Desarrollo nav item in default open section', () => {
    renderSidebar();
    expect(screen.getByText('Mi Desarrollo')).toBeInTheDocument();
  });

  it('renders user name', () => {
    renderSidebar();
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
  });

  it('renders Team Member subtitle', () => {
    renderSidebar();
    expect(screen.getByText('Team Member')).toBeInTheDocument();
  });

  it('renders user avatar with initial', () => {
    renderSidebar();
    const avatar = screen.getByText('J');
    expect(avatar).toHaveStyle({ background: '#6366F1' });
  });

  it('renders default user when no user provided', () => {
    renderSidebar({ currentUser: null });
    expect(screen.getByText('Usuario')).toBeInTheDocument();
    expect(screen.getByText('U')).toBeInTheDocument();
  });

  it('renders sign out button', () => {
    renderSidebar();
    expect(screen.getByLabelText('Cerrar sesion')).toBeInTheDocument();
    expect(screen.getByText('Cerrar sesion')).toBeInTheDocument();
  });

  it('calls onSignOut when sign out button is clicked', async () => {
    const user = userEvent.setup();
    const onSignOut = vi.fn();
    renderSidebar({ onSignOut });
    await user.click(screen.getByLabelText('Cerrar sesion'));
    expect(onSignOut).toHaveBeenCalledTimes(1);
  });

  it('renders nav items with menuitem role', () => {
    const { container } = renderSidebar();
    const menuItems = container.querySelectorAll('[role="menuitem"]');
    expect(menuItems.length).toBeGreaterThan(0);
  });

  it('renders settings icon in user section', () => {
    const { container } = renderSidebar();
    const userSection = container.querySelector('.border-t.border-sidebar-border');
    expect(userSection?.querySelector('svg')).toBeInTheDocument();
  });

  it('highlights active view with aria-current', () => {
    renderSidebar({ currentView: 'dashboard' });
    const dashboardButton = screen.getByText('Dashboard').closest('button');
    expect(dashboardButton).toHaveAttribute('aria-current', 'page');
  });

  it('does not highlight inactive views', () => {
    renderSidebar({ currentView: 'dashboard' });
    const miEspacioButton = screen.getByText('Mi Espacio').closest('button');
    expect(miEspacioButton).not.toHaveAttribute('aria-current', 'page');
  });

  it('renders user avatar with default color when no color provided', () => {
    const userWithoutColor = { nombre: 'Test User' };
    renderSidebar({ currentUser: userWithoutColor });
    const avatar = screen.getByText('T');
    expect(avatar).toHaveStyle({ background: '#6366F1' });
  });

  it('truncates long user names', () => {
    const longNameUser = { nombre: 'Juan Carlos Francisco González Pérez', color: '#6366F1' };
    renderSidebar({ currentUser: longNameUser });
    const userName = screen.getByText('Juan Carlos Francisco González Pérez');
    expect(userName).toHaveClass('truncate');
  });

  it('renders section toggle buttons', () => {
    renderSidebar();
    expect(screen.getByText(/Principal/i)).toBeInTheDocument();
  });

  it('opens another section when clicked', async () => {
    const user = userEvent.setup();
    renderSidebar();
    // Click on 'Crear y Validar' section to open it
    const sectionButton = screen.getByText(/Crear y Validar/i).closest('button');
    await user.click(sectionButton!);
    // After clicking, Centro OBV should be visible
    expect(screen.getByText('Centro OBV')).toBeInTheDocument();
  });
});
