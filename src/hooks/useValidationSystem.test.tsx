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

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
          maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        is: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        in: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
    rpc: vi.fn(() => Promise.resolve({ data: false, error: null })),
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
