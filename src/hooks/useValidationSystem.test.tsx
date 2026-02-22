import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import {
  useValidationOrder,
  useMyValidators,
  useValidatorStats,
  useIsBlocked,
  useMyPendingValidations,
  useCanUpload
} from './useValidationSystem';

// Thenable chain mock: every chainable method returns the same chain object,
// and the chain itself is awaitable (thenable) so `await chain` resolves to
// { data: resolveData, error: null }.
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
    rpc: vi.fn(() => Promise.resolve({ data: false, error: null })),
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

describe('useValidationSystem', () => {
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

  it('useValidationOrder fetches validation order', async () => {
    const { result } = renderHook(() => useValidationOrder(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('useMyValidators fetches validators for user', async () => {
    const { result } = renderHook(() => useMyValidators('user1'), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('useValidatorStats fetches validator statistics', async () => {
    const { result } = renderHook(() => useValidatorStats('user1'), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('useIsBlocked checks if user is blocked', async () => {
    const { result } = renderHook(() => useIsBlocked(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('useMyPendingValidations fetches pending validations', async () => {
    const { result } = renderHook(() => useMyPendingValidations(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('useCanUpload returns canUpload status', () => {
    const { result } = renderHook(() => useCanUpload(), { wrapper });

    expect(result.current).toHaveProperty('canUpload');
    expect(result.current).toHaveProperty('isBlocked');
    expect(result.current).toHaveProperty('isLoading');
  });
});
