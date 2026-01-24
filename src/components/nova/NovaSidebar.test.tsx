import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NovaSidebar } from './NovaSidebar';

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

describe('NovaSidebar', () => {
  it('renders sidebar', () => {
    render(<NovaSidebar {...defaultProps} />);
    expect(screen.getByLabelText('Navegación principal')).toBeInTheDocument();
  });

  it('renders logo section', () => {
    render(<NovaSidebar {...defaultProps} />);
    expect(screen.getByText('NOVA')).toBeInTheDocument();
    expect(screen.getByText('BETA')).toBeInTheDocument();
  });

  it('renders logo icon', () => {
    render(<NovaSidebar {...defaultProps} />);
    const logoIcon = screen.getByLabelText('Logo NOVA');
    expect(logoIcon).toBeInTheDocument();
    expect(logoIcon).toHaveTextContent('N');
  });

  it('renders navigation sections', () => {
    render(<NovaSidebar {...defaultProps} />);
    expect(screen.getByText('Principal')).toBeInTheDocument();
    expect(screen.getByText('Gestión')).toBeInTheDocument();
    expect(screen.getByText('Equipo')).toBeInTheDocument();
    expect(screen.getByText('Sistema')).toBeInTheDocument();
  });

  it('renders all navigation items', () => {
    render(<NovaSidebar {...defaultProps} />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Mi Espacio')).toBeInTheDocument();
    expect(screen.getByText('Mi Desarrollo')).toBeInTheDocument();
    expect(screen.getByText('Rankings')).toBeInTheDocument();
    expect(screen.getByText('Masters')).toBeInTheDocument();
    expect(screen.getByText('Rotación de Roles')).toBeInTheDocument();
    expect(screen.getByText('Proyectos')).toBeInTheDocument();
    expect(screen.getByText('Centro OBVs')).toBeInTheDocument();
    expect(screen.getByText('CRM Global')).toBeInTheDocument();
    expect(screen.getByText('Financiero')).toBeInTheDocument();
    expect(screen.getByText('Otros KPIs')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Reuniones de Rol')).toBeInTheDocument();
    expect(screen.getByText('Configuración')).toBeInTheDocument();
  });

  it('highlights active view', () => {
    render(<NovaSidebar {...defaultProps} currentView="dashboard" />);
    const dashboardButton = screen.getByText('Dashboard').closest('button');
    expect(dashboardButton).toHaveAttribute('aria-current', 'page');
  });

  it('does not highlight inactive views', () => {
    render(<NovaSidebar {...defaultProps} currentView="dashboard" />);
    const projectsButton = screen.getByText('Proyectos').closest('button');
    expect(projectsButton).not.toHaveAttribute('aria-current', 'page');
  });

  it('renders badge on Proyectos', () => {
    render(<NovaSidebar {...defaultProps} />);
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('calls setCurrentView on nav item click', async () => {
    const user = userEvent.setup();
    const setCurrentView = vi.fn();

    render(<NovaSidebar {...defaultProps} setCurrentView={setCurrentView} />);
    await user.click(screen.getByText('Proyectos'));

    expect(setCurrentView).toHaveBeenCalledWith('proyectos');
  });

  it('calls setCurrentView with correct view id', async () => {
    const user = userEvent.setup();
    const setCurrentView = vi.fn();

    render(<NovaSidebar {...defaultProps} setCurrentView={setCurrentView} />);
    await user.click(screen.getByText('Analytics'));

    expect(setCurrentView).toHaveBeenCalledWith('analytics');
  });

  it('renders user section', () => {
    render(<NovaSidebar {...defaultProps} />);
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    expect(screen.getByText('Team Member')).toBeInTheDocument();
  });

  it('renders user avatar with initial', () => {
    render(<NovaSidebar {...defaultProps} />);
    const avatar = screen.getByText('J');
    expect(avatar).toHaveStyle({ background: '#6366F1' });
  });

  it('renders user avatar with default color when no color provided', () => {
    const userWithoutColor = { nombre: 'Test User' };
    render(<NovaSidebar {...defaultProps} currentUser={userWithoutColor} />);
    const avatar = screen.getByText('T');
    expect(avatar).toHaveStyle({ background: '#6366F1' });
  });

  it('renders default user when no user provided', () => {
    render(<NovaSidebar {...defaultProps} currentUser={null} />);
    expect(screen.getByText('Usuario')).toBeInTheDocument();
    expect(screen.getByText('U')).toBeInTheDocument();
  });

  it('renders sign out button', () => {
    render(<NovaSidebar {...defaultProps} />);
    expect(screen.getByLabelText('Cerrar sesión')).toBeInTheDocument();
    expect(screen.getByText('Cerrar sesión')).toBeInTheDocument();
  });

  it('calls onSignOut when sign out button is clicked', async () => {
    const user = userEvent.setup();
    const onSignOut = vi.fn();

    render(<NovaSidebar {...defaultProps} onSignOut={onSignOut} />);
    await user.click(screen.getByLabelText('Cerrar sesión'));

    expect(onSignOut).toHaveBeenCalledTimes(1);
  });

  it('renders icons for all nav items', () => {
    const { container } = render(<NovaSidebar {...defaultProps} />);
    const navButtons = container.querySelectorAll('nav button');
    navButtons.forEach((button) => {
      expect(button.querySelector('svg')).toBeInTheDocument();
    });
  });

  it('has correct aria-labels for nav items', () => {
    render(<NovaSidebar {...defaultProps} />);
    expect(screen.getByLabelText('Navegar a Dashboard')).toBeInTheDocument();
    expect(screen.getByLabelText('Navegar a Proyectos')).toBeInTheDocument();
    expect(screen.getByLabelText('Navegar a Analytics')).toBeInTheDocument();
  });

  it('renders all nav items with menuitem role', () => {
    const { container } = render(<NovaSidebar {...defaultProps} />);
    const menuItems = container.querySelectorAll('[role="menuitem"]');
    expect(menuItems.length).toBeGreaterThan(0);
  });

  it('applies fixed positioning', () => {
    const { container } = render(<NovaSidebar {...defaultProps} />);
    const sidebar = container.querySelector('aside');
    expect(sidebar).toHaveClass('fixed');
  });

  it('has correct width', () => {
    const { container } = render(<NovaSidebar {...defaultProps} />);
    const sidebar = container.querySelector('aside');
    expect(sidebar).toHaveClass('w-64');
  });

  it('renders navigation with correct aria-label', () => {
    render(<NovaSidebar {...defaultProps} />);
    expect(screen.getByLabelText('Menú de navegación')).toBeInTheDocument();
  });

  it('highlights different view when currentView changes', () => {
    const { rerender } = render(<NovaSidebar {...defaultProps} currentView="dashboard" />);

    let dashboardButton = screen.getByText('Dashboard').closest('button');
    expect(dashboardButton).toHaveAttribute('aria-current', 'page');

    rerender(<NovaSidebar {...defaultProps} currentView="proyectos" />);

    dashboardButton = screen.getByText('Dashboard').closest('button');
    const projectsButton = screen.getByText('Proyectos').closest('button');

    expect(dashboardButton).not.toHaveAttribute('aria-current', 'page');
    expect(projectsButton).toHaveAttribute('aria-current', 'page');
  });

  it('renders settings icon in user section', () => {
    const { container } = render(<NovaSidebar {...defaultProps} />);
    const userSection = container.querySelector('.border-t.border-sidebar-border');
    expect(userSection?.querySelector('svg')).toBeInTheDocument();
  });

  it('applies gradient to logo icon', () => {
    render(<NovaSidebar {...defaultProps} />);
    const logoIcon = screen.getByLabelText('Logo NOVA');
    expect(logoIcon).toHaveClass('nova-gradient');
  });

  it('renders banner role on logo section', () => {
    const { container } = render(<NovaSidebar {...defaultProps} />);
    const banner = container.querySelector('[role="banner"]');
    expect(banner).toBeInTheDocument();
  });

  it('truncates long user names', () => {
    const longNameUser = {
      nombre: 'Juan Carlos Francisco González Pérez',
      color: '#6366F1',
    };
    render(<NovaSidebar {...defaultProps} currentUser={longNameUser} />);
    const userName = screen.getByText('Juan Carlos Francisco González Pérez');
    expect(userName).toHaveClass('truncate');
  });
});
