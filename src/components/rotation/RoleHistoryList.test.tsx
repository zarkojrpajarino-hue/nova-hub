import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RoleHistoryList } from './RoleHistoryList';

vi.mock('date-fns', () => ({
  formatDistanceToNow: () => 'hace 2 días',
  format: () => '25 ene 2026',
}));

vi.mock('date-fns/locale', () => ({
  es: {},
}));

describe('RoleHistoryList', () => {
  it('renders empty state when no history', () => {
    render(<RoleHistoryList history={[]} />);
    expect(screen.getByText('Sin historial de cambios')).toBeInTheDocument();
  });

  it('shows empty state message', () => {
    render(<RoleHistoryList history={[]} />);
    expect(screen.getByText(/Los cambios de rol se registrarán aquí/)).toBeInTheDocument();
  });

  it('renders history items when provided', () => {
    const history = [
      {
        id: '1',
        user_id: 'user1',
        project_id: 'proj1',
        old_role: 'sales',
        new_role: 'finance',
        change_type: 'swap',
        created_at: '2026-01-20',
        notes: 'Test swap',
        user_nombre: 'Test User',
        user_avatar: null,
        project_nombre: 'Test Project',
      },
    ];
    render(<RoleHistoryList history={history} />);
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });
});
