import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useRotationRequests, useMyRotationRequests, useRoleHistory } from './useRoleRotation';

// Thenable chain mock: every chainable method returns the same chain object,
// and the chain itself is awaitable (thenable) so `await chain` resolves to
// { data: [], error: null }.
function createChain(resolveData: unknown[] | null = []) {
  const chain: Record<string, unknown> = {};
  const methods = ['select', 'eq', 'neq', 'order', 'limit', 'or', 'in', 'is', 'gte', 'lte', 'lt', 'gt', 'not', 'range', 'ilike', 'like', 'filter', 'match'];
  methods.forEach(m => {
    chain[m] = vi.fn(() => chain);
  });
  chain['single'] = vi.fn(() => Promise.resolve({ data: null, error: null }));
  chain['maybeSingle'] = vi.fn(() => Promise.resolve({ data: null, error: null }));
  // Make thenable so `await chain` resolves
  chain['then'] = (resolve: (val: unknown) => unknown) => Promise.resolve({ data: resolveData, error: null }).then(resolve);
  chain['catch'] = (reject: (val: unknown) => unknown) => Promise.resolve({ data: resolveData, error: null }).catch(reject);
  return chain;
}

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => createChain()),
    rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
  },
}));

// Mock useAuth
vi.mock('./useAuth', () => ({
  useAuth: vi.fn(() => ({ profile: { id: 'user1', nombre: 'Test User' } })),
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('useRoleRotation', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  it('useRotationRequests fetches rotation requests', async () => {
    const { result } = renderHook(() => useRotationRequests(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('useRotationRequests can filter by status', async () => {
    const { result } = renderHook(() => useRotationRequests('pending'), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('useMyRotationRequests fetches user rotation requests', async () => {
    const { result } = renderHook(() => useMyRotationRequests(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('useRoleHistory fetches role history', async () => {
    const { result } = renderHook(() => useRoleHistory(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('useRoleHistory can filter by user ID', async () => {
    const { result } = renderHook(() => useRoleHistory('user1'), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});
