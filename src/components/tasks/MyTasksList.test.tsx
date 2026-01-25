import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { MyTasksList } from './MyTasksList';

// Mock hooks
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({ profile: { id: 'user1' } })),
}));

vi.mock('@/hooks/useNovaData', () => ({
  useProjects: vi.fn(() => ({ data: [] })),
}));

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          neq: vi.fn(() => ({
            order: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
  },
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe('MyTasksList', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
  });

  const renderComponent = () => render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <MyTasksList />
      </QueryClientProvider>
    </BrowserRouter>
  );

  it('renders empty state message', async () => {
    renderComponent();
    const message = await screen.findByText('No hay tareas pendientes');
    expect(message).toBeInTheDocument();
  });

  it('shows success message in empty state', async () => {
    renderComponent();
    const message = await screen.findByText('¡Buen trabajo!');
    expect(message).toBeInTheDocument();
  });
});
