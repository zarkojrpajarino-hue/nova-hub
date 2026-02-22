import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useMasterApplications,
  useMyMasterApplications,
  useTeamMasters,
  useMasterVotes,
  useMasterChallenges
} from './useMasters';
import { ReactNode } from 'react';

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

describe('useMasters hooks', () => {
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

  describe('useMasterApplications', () => {
    it('fetches master applications', async () => {
      const { result } = renderHook(() => useMasterApplications(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual([]);
    });

    it('fetches applications with status filter', async () => {
      const { result } = renderHook(() => useMasterApplications('pending'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual([]);
    });
  });

  describe('useMyMasterApplications', () => {
    it('returns empty array when no userId provided', async () => {
      const { result } = renderHook(() => useMyMasterApplications(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Query is disabled when no userId (enabled: !!userId), so data is undefined
      expect(result.current.data).toEqual(undefined);
    });

    it('fetches user applications when userId provided', async () => {
      const { result } = renderHook(() => useMyMasterApplications('user1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual([]);
    });
  });

  describe('useTeamMasters', () => {
    it('fetches all team masters', async () => {
      const { result } = renderHook(() => useTeamMasters(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual([]);
    });

    it('fetches masters for specific role', async () => {
      const { result } = renderHook(() => useTeamMasters('comercial'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual([]);
    });
  });

  describe('useMasterVotes', () => {
    it('returns empty array when no applicationId', async () => {
      const { result } = renderHook(() => useMasterVotes(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Query is disabled when no applicationId (enabled: !!applicationId), so data is undefined
      expect(result.current.data).toEqual(undefined);
    });

    it('fetches votes when applicationId provided', async () => {
      const { result } = renderHook(() => useMasterVotes('app1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual([]);
    });
  });

  describe('useMasterChallenges', () => {
    it('fetches all challenges', async () => {
      const { result } = renderHook(() => useMasterChallenges(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual([]);
    });

    it('fetches challenges for specific master', async () => {
      const { result } = renderHook(() => useMasterChallenges('master1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual([]);
    });
  });
});
