import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useNotifications, useUnreadCount } from './useNotifications';
import { ReactNode } from 'react';

// Mock useAuth
vi.mock('./useAuth', () => ({
  useAuth: vi.fn(() => ({
    profile: { id: 'user1', nombre: 'Test User' },
  })),
}));

// Thenable chain that resolves with { data: [], error: null }
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

// Thenable chain that resolves with { count: 0, error: null } for head queries
function createCountChain() {
  const chain: Record<string, unknown> = {};
  const methods = ['select', 'eq', 'neq', 'order', 'limit', 'or', 'in', 'is', 'gte', 'lte', 'lt', 'gt', 'not', 'range', 'ilike', 'like', 'filter', 'match'];
  methods.forEach(m => {
    chain[m] = vi.fn(() => chain);
  });
  chain['single'] = vi.fn(() => Promise.resolve({ data: null, error: null }));
  chain['maybeSingle'] = vi.fn(() => Promise.resolve({ data: null, error: null }));
  // Resolves with count shape for useUnreadCount
  chain['then'] = (resolve: (val: unknown) => unknown) => Promise.resolve({ count: 0, error: null }).then(resolve);
  chain['catch'] = (reject: (val: unknown) => unknown) => Promise.resolve({ count: 0, error: null }).catch(reject);
  return chain;
}

// Mock supabase — from() returns a regular data chain, but select() with
// { count: 'exact', head: true } returns a count chain so that useUnreadCount
// destructures { count: 0, error: null } correctly.
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => {
      const chain: Record<string, unknown> = {};
      const methods = ['eq', 'neq', 'order', 'limit', 'or', 'in', 'is', 'gte', 'lte', 'lt', 'gt', 'not', 'range', 'ilike', 'like', 'filter', 'match'];
      methods.forEach(m => {
        chain[m] = vi.fn(() => chain);
      });
      chain['single'] = vi.fn(() => Promise.resolve({ data: null, error: null }));
      chain['maybeSingle'] = vi.fn(() => Promise.resolve({ data: null, error: null }));
      // select() checks if called with head:true option (count query) or not
      chain['select'] = vi.fn((_cols: unknown, opts?: { count?: string; head?: boolean }) => {
        if (opts && opts.head === true) {
          return createCountChain();
        }
        return createChain();
      });
      chain['then'] = (resolve: (val: unknown) => unknown) => Promise.resolve({ data: [], error: null }).then(resolve);
      chain['catch'] = (reject: (val: unknown) => unknown) => Promise.resolve({ data: [], error: null }).catch(reject);
      return chain;
    }),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
  },
}));

describe('useNotifications hooks', () => {
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

  describe('useNotifications', () => {
    it('fetches notifications', async () => {
      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual([]);
    });
  });

  describe('useUnreadCount', () => {
    it('returns unread count', async () => {
      const { result } = renderHook(() => useUnreadCount(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBe(0);
    });
  });
});
