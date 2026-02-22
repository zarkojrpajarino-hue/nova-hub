import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MyRotationRequests } from './MyRotationRequests';
import type { RoleRotationRequest } from '@/hooks/useRoleRotation';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
  },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ profile: { id: 'user1', nombre: 'Test User' } }),
}));

vi.mock('date-fns', () => ({
  formatDistanceToNow: () => 'hace 2 días',
}));

vi.mock('date-fns/locale', () => ({
  es: {},
}));

describe('MyRotationRequests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.clearAllMocks();
  });

  const renderComponent = (requests: RoleRotationRequest[] = []) => render(
    <QueryClientProvider client={queryClient}>
      <MyRotationRequests requests={requests} />
    </QueryClientProvider>
  );

  it('renders mis solicitudes title', () => {
    renderComponent([]);
    expect(screen.getByText('Mis Solicitudes')).toBeInTheDocument();
  });

  it('shows empty state when no requests', () => {
    renderComponent([]);
    expect(screen.getByText(/Sin solicitudes/)).toBeInTheDocument();
  });
});
