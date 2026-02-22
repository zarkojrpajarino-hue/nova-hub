import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUserSettings, useUserRoles } from './useSettings';
import { ReactNode } from 'react';

// Mock useAuth
vi.mock('./useAuth', () => ({
  useAuth: vi.fn(() => ({
    profile: { id: 'user1', nombre: 'Test User' },
    user: { id: 'auth1' },
  })),
}));

// Thenable chain mock: every chainable method returns the same chain object.
// The chain is awaitable (thenable) resolving to { data: resolveData, error: null }.
// maybeSingle() always resolves with { data: null, error: null } so that hooks
// that use maybeSingle() receive null and fall back to defaults.
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
    storage: {
      from: vi.fn(() => ({
        remove: vi.fn(() => Promise.resolve({ data: null, error: null })),
        upload: vi.fn(() => Promise.resolve({ data: null, error: null })),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/avatar.jpg' } })),
      })),
    },
  },
}));

describe('useSettings hooks', () => {
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

  describe('useUserSettings', () => {
    it('fetches user settings', async () => {
      const { result } = renderHook(() => useUserSettings(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeDefined();
    });

    it('returns default settings when none exist', async () => {
      const { result } = renderHook(() => useUserSettings(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.notifications).toBeDefined();
      expect(result.current.data?.notifications.nuevas_obvs).toBe(true);
      expect(result.current.data?.notifications.validaciones).toBe(true);
    });
  });

  describe('useUserRoles', () => {
    it('fetches all user roles', async () => {
      const { result } = renderHook(() => useUserRoles(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual([]);
    });
  });
});
