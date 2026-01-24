import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useProfiles,
  useProjects,
  useProjectMembers,
  useLeads,
  useMemberStats,
  useObjectives,
  useProjectStats,
  usePipelineGlobal,
  useCurrentMemberStats
} from './useNovaData';
import type { Profile, Project, ProjectMember, Lead, MemberStats, Objective } from './useNovaData';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from '@/integrations/supabase/client';

describe('useNovaData hooks', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('useProfiles', () => {
    it('fetches profiles successfully', async () => {
      const mockProfiles: Profile[] = [
        {
          id: '1',
          auth_id: 'auth1',
          email: 'test@example.com',
          nombre: 'Test User',
          avatar: null,
          color: '#6366F1',
          especialization: 'Developer',
          created_at: '2024-01-01',
        },
      ];

      const mockSupabaseChain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockProfiles, error: null }),
      };

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabaseChain);

      const { result } = renderHook(() => useProfiles(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockProfiles);
      expect(supabase.from).toHaveBeenCalledWith('profiles');
    });

    it('handles error when fetching profiles', async () => {
      const mockError = new Error('Database error');
      const mockSupabaseChain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      };

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabaseChain);

      const { result } = renderHook(() => useProfiles(), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toBeTruthy();
    });
  });

  describe('useProjects', () => {
    it('fetches projects successfully', async () => {
      const mockProjects: Project[] = [
        {
          id: 'p1',
          nombre: 'Test Project',
          descripcion: 'A test project',
          fase: 'planning',
          tipo: 'validacion',
          onboarding_completed: true,
          onboarding_data: null,
          icon: '🚀',
          color: '#6366F1',
          created_at: '2024-01-01',
        },
      ];

      const mockSupabaseChain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockProjects, error: null }),
      };

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabaseChain);

      const { result } = renderHook(() => useProjects(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockProjects);
      expect(supabase.from).toHaveBeenCalledWith('projects');
    });
  });

  describe('useProjectMembers', () => {
    it('fetches project members successfully', async () => {
      const mockMembers: ProjectMember[] = [
        {
          id: 'pm1',
          project_id: 'p1',
          member_id: '1',
          role: 'developer',
          is_lead: false,
          role_accepted: true,
          role_accepted_at: '2024-01-01',
          role_responsibilities: ['coding', 'testing'],
          performance_score: 85,
        },
      ];

      const mockSupabaseChain = {
        select: vi.fn().mockResolvedValue({ data: mockMembers, error: null }),
      };

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabaseChain);

      const { result } = renderHook(() => useProjectMembers(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockMembers);
    });
  });

  describe('useLeads', () => {
    it('fetches leads successfully', async () => {
      const mockLeads: Lead[] = [
        {
          id: 'l1',
          project_id: 'p1',
          nombre: 'Test Lead',
          empresa: 'Test Company',
          status: 'nuevo',
          valor_potencial: 50000,
          responsable_id: '1',
        },
      ];

      const mockSupabaseChain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockLeads, error: null }),
      };

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabaseChain);

      const { result } = renderHook(() => useLeads(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockLeads);
      expect(supabase.from).toHaveBeenCalledWith('leads');
    });
  });

  describe('useMemberStats', () => {
    it('fetches member stats successfully', async () => {
      const mockStats: MemberStats[] = [
        {
          id: '1',
          nombre: 'Test User',
          color: '#6366F1',
          avatar: null,
          email: 'test@example.com',
          obvs: 10,
          lps: 5,
          bps: 3,
          cps: 2,
          facturacion: 50000,
          margen: 15000,
        },
      ];

      const mockSupabaseChain = {
        select: vi.fn().mockResolvedValue({ data: mockStats, error: null }),
      };

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabaseChain);

      const { result } = renderHook(() => useMemberStats(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockStats);
    });
  });

  describe('useObjectives', () => {
    it('fetches objectives successfully', async () => {
      const mockObjectives: Objective[] = [
        {
          id: 'o1',
          name: 'Revenue Target',
          target_value: 100000,
          unit: 'EUR',
          period: 'monthly',
        },
      ];

      const mockSupabaseChain = {
        select: vi.fn().mockResolvedValue({ data: mockObjectives, error: null }),
      };

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabaseChain);

      const { result } = renderHook(() => useObjectives(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockObjectives);
    });
  });

  describe('useProjectStats', () => {
    it('fetches project stats successfully', async () => {
      const mockStats = [
        {
          id: 'p1',
          facturacion: 100000,
          margen: 30000,
          total_obvs: 25,
          leads_ganados: 10,
        },
      ];

      const mockSupabaseChain = {
        select: vi.fn().mockResolvedValue({ data: mockStats, error: null }),
      };

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabaseChain);

      const { result } = renderHook(() => useProjectStats(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockStats);
    });
  });

  describe('usePipelineGlobal', () => {
    it('fetches pipeline data successfully', async () => {
      const mockPipeline = [
        {
          id: 'l1',
          nombre: 'Test Lead',
          status: 'nuevo',
          project_id: 'p1',
        },
      ];

      const mockSupabaseChain = {
        select: vi.fn().mockResolvedValue({ data: mockPipeline, error: null }),
      };

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabaseChain);

      const { result } = renderHook(() => usePipelineGlobal(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockPipeline);
    });
  });

  describe('useCurrentMemberStats', () => {
    it('fetches current member stats successfully', async () => {
      const mockStats: MemberStats = {
        id: '1',
        nombre: 'Test User',
        color: '#6366F1',
        avatar: null,
        email: 'test@example.com',
        obvs: 10,
        lps: 5,
        bps: 3,
        cps: 2,
        facturacion: 50000,
        margen: 15000,
      };

      const mockSupabaseChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: mockStats, error: null }),
      };

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabaseChain);

      const { result } = renderHook(() => useCurrentMemberStats('test@example.com'), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockStats);
    });

    it('returns null when email is undefined', async () => {
      const { result } = renderHook(() => useCurrentMemberStats(undefined), { wrapper });

      // Query should be disabled when email is undefined
      expect(result.current.isPending).toBe(true);
      expect(result.current.data).toBe(undefined);
    });

    it('handles email filtering correctly', async () => {
      const mockStats: MemberStats = {
        id: '1',
        nombre: 'Test User',
        color: '#6366F1',
        avatar: null,
        email: 'specific@example.com',
        obvs: 10,
        lps: 5,
        bps: 3,
        cps: 2,
        facturacion: 50000,
        margen: 15000,
      };

      const mockSupabaseChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: mockStats, error: null }),
      };

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabaseChain);

      const { result } = renderHook(() => useCurrentMemberStats('specific@example.com'), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockSupabaseChain.eq).toHaveBeenCalledWith('email', 'specific@example.com');
      expect(result.current.data).toEqual(mockStats);
    });
  });
});
